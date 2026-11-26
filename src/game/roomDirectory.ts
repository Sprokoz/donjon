import Peer, { DataConnection } from 'peerjs';
import { DifficultyKey, GameMode } from './types';

export interface PublicRoomInfo {
  code: string;
  hostName: string;
  mode: GameMode;
  difficulty: DifficultyKey;
  playersCount: number;
  maxPlayers: number;
  inGame: boolean;
  updatedAt: number;
}

type DirectoryMessage =
  | { type: 'register_room'; room: PublicRoomInfo }
  | { type: 'unregister_room'; code: string }
  | { type: 'list_rooms' }
  | { type: 'rooms_snapshot'; rooms: PublicRoomInfo[] };

const DIRECTORY_HUB_PEER_ID = 'dungeon-bouncer-dir-v1';
const BROADCAST_CHANNEL_NAME = 'dungeon_bouncer_rooms_v1';
const STORAGE_KEY = 'dungeon_bouncer_public_rooms_v1';
const ROOM_TTL_MS = 28_000;

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

export class RoomDirectoryClient {
  private peer: Peer | null = null;
  private isAnchor = false;
  private anchorConn: DataConnection | null = null;
  private subscriberConns = new Map<string, DataConnection>();
  private roomsMap = new Map<string, PublicRoomInfo>();
  private hostedRoom: PublicRoomInfo | null = null;
  private bc: BroadcastChannel | null = null;
  private heartbeatTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private destroyed = false;
  private onRoomsUpdate: (rooms: PublicRoomInfo[]) => void;
  private beforeUnloadHandler: (() => void) | null = null;

  constructor(onRoomsUpdate: (rooms: PublicRoomInfo[]) => void) {
    this.onRoomsUpdate = onRoomsUpdate;
    this.loadLocalCache();
    this.setupLocalChannel();
    this.startHeartbeat();
    this.connectOrClaimAnchor();

    if (typeof window !== 'undefined') {
      this.beforeUnloadHandler = () => {
        if (this.hostedRoom) {
          this.unpublishRoom(this.hostedRoom.code);
        }
      };
      window.addEventListener('beforeunload', this.beforeUnloadHandler);
    }
  }

  public getRooms(): PublicRoomInfo[] {
    this.pruneExpired();
    return Array.from(this.roomsMap.values()).sort((a, b) => {
      if (a.inGame !== b.inGame) return a.inGame ? 1 : -1;
      return b.updatedAt - a.updatedAt;
    });
  }

  public publishRoom(room: Omit<PublicRoomInfo, 'updatedAt'>) {
    if (this.destroyed) return;
    const stamped: PublicRoomInfo = { ...room, updatedAt: Date.now() };
    this.hostedRoom = stamped;
    this.roomsMap.set(stamped.code, stamped);
    this.saveLocalCache();
    this.postBroadcast({ type: 'register_room', room: stamped });

    if (this.isAnchor) {
      this.broadcastSnapshotFromAnchor();
    } else if (this.anchorConn?.open) {
      try {
        this.anchorConn.send({ type: 'register_room', room: stamped } as DirectoryMessage);
      } catch {
        // ignore transient send error
      }
    }
    this.emitUpdate();
  }

  public unpublishRoom(code?: string) {
    const targetCode = code || this.hostedRoom?.code;
    if (!targetCode) return;
    if (this.hostedRoom?.code === targetCode) {
      this.hostedRoom = null;
    }
    this.roomsMap.delete(targetCode);
    this.saveLocalCache();
    this.postBroadcast({ type: 'unregister_room', code: targetCode });

    if (this.isAnchor) {
      this.broadcastSnapshotFromAnchor();
    } else if (this.anchorConn?.open) {
      try {
        this.anchorConn.send({ type: 'unregister_room', code: targetCode } as DirectoryMessage);
      } catch {
        // ignore
      }
    }
    this.emitUpdate();
  }

  public refresh() {
    if (this.destroyed) return;
    this.loadLocalCache();
    this.pruneExpired();
    this.emitUpdate();

    if (this.isAnchor) {
      if (this.hostedRoom) {
        this.publishRoom(this.hostedRoom);
      } else {
        this.broadcastSnapshotFromAnchor();
      }
    } else if (this.anchorConn?.open) {
      try {
        this.anchorConn.send({ type: 'list_rooms' } as DirectoryMessage);
        if (this.hostedRoom) {
          this.anchorConn.send({ type: 'register_room', room: { ...this.hostedRoom, updatedAt: Date.now() } } as DirectoryMessage);
        }
      } catch {
        // ignore
      }
    } else {
      this.connectOrClaimAnchor();
    }
  }

  public destroy() {
    if (this.destroyed) return;
    if (this.hostedRoom) {
      this.unpublishRoom(this.hostedRoom.code);
    }
    this.destroyed = true;
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.beforeUnloadHandler && typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
    try {
      this.bc?.close();
    } catch {
      // ignore
    }
    this.bc = null;
    this.cleanupPeer();
  }

  private setupLocalChannel() {
    if (typeof BroadcastChannel === 'undefined') return;
    try {
      this.bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.bc.onmessage = (ev: MessageEvent<DirectoryMessage>) => {
        if (this.destroyed || !ev.data) return;
        const msg = ev.data;
        if (msg.type === 'register_room') {
          this.roomsMap.set(msg.room.code, msg.room);
          this.saveLocalCache();
          if (this.isAnchor) this.broadcastSnapshotFromAnchor();
          this.emitUpdate();
        } else if (msg.type === 'unregister_room') {
          this.roomsMap.delete(msg.code);
          this.saveLocalCache();
          if (this.isAnchor) this.broadcastSnapshotFromAnchor();
          this.emitUpdate();
        } else if (msg.type === 'rooms_snapshot') {
          this.mergeSnapshot(msg.rooms);
        }
      };
    } catch {
      this.bc = null;
    }
  }

  private postBroadcast(msg: DirectoryMessage) {
    try {
      this.bc?.postMessage(msg);
    } catch {
      // ignore
    }
  }

  private loadLocalCache() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PublicRoomInfo[];
      if (!Array.isArray(parsed)) return;
      const now = Date.now();
      for (const item of parsed) {
        if (item && typeof item.code === 'string' && now - (item.updatedAt || 0) < ROOM_TTL_MS) {
          this.roomsMap.set(item.code, item);
        }
      }
    } catch {
      // ignore
    }
  }

  private saveLocalCache() {
    try {
      const list = Array.from(this.roomsMap.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  private pruneExpired(): boolean {
    const now = Date.now();
    let changed = false;
    for (const [code, room] of this.roomsMap.entries()) {
      if (this.hostedRoom && this.hostedRoom.code === code) continue;
      if (now - room.updatedAt > ROOM_TTL_MS) {
        this.roomsMap.delete(code);
        changed = true;
      }
    }
    if (changed) this.saveLocalCache();
    return changed;
  }

  private mergeSnapshot(rooms: PublicRoomInfo[]) {
    const now = Date.now();
    const nextMap = new Map<string, PublicRoomInfo>();
    for (const r of rooms) {
      if (r && r.code && now - (r.updatedAt || 0) <= ROOM_TTL_MS) {
        nextMap.set(r.code, r);
      }
    }
    if (this.hostedRoom) {
      nextMap.set(this.hostedRoom.code, { ...this.hostedRoom, updatedAt: now });
    }
    this.roomsMap = nextMap;
    this.saveLocalCache();
    this.emitUpdate();
  }

  private startHeartbeat() {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.destroyed) return;
      if (this.hostedRoom) {
        this.publishRoom(this.hostedRoom);
      } else {
        const changed = this.pruneExpired();
        if (changed) {
          if (this.isAnchor) this.broadcastSnapshotFromAnchor();
          this.emitUpdate();
        }
      }
    }, 8000);
  }

  private cleanupPeer() {
    try {
      this.anchorConn?.close();
    } catch {
      // ignore
    }
    this.anchorConn = null;
    for (const conn of this.subscriberConns.values()) {
      try {
        conn.close();
      } catch {
        // ignore
      }
    }
    this.subscriberConns.clear();
    try {
      this.peer?.destroy();
    } catch {
      // ignore
    }
    this.peer = null;
    this.isAnchor = false;
  }

  private scheduleReconnect(delayMs = 450) {
    if (this.destroyed || this.reconnectTimer !== null) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.destroyed) {
        this.connectOrClaimAnchor();
      }
    }, delayMs);
  }

  private connectOrClaimAnchor() {
    if (this.destroyed) return;
    this.cleanupPeer();

    let peer: Peer;
    try {
      peer = new Peer(DIRECTORY_HUB_PEER_ID, {
        config: { iceServers: ICE_SERVERS },
      });
    } catch {
      this.scheduleReconnect(2000);
      return;
    }
    this.peer = peer;

    peer.on('open', () => {
      if (this.destroyed || this.peer !== peer) return;
      this.isAnchor = true;
      if (this.hostedRoom) {
        this.roomsMap.set(this.hostedRoom.code, { ...this.hostedRoom, updatedAt: Date.now() });
      }
      this.emitUpdate();
    });

    peer.on('connection', (conn) => {
      if (this.destroyed || this.peer !== peer) {
        conn.close();
        return;
      }
      this.attachSubscriber(conn);
    });

    peer.on('error', (err) => {
      if (this.destroyed || this.peer !== peer) return;
      const errType = (err as { type?: string })?.type;
      if (errType === 'unavailable-id') {
        // Another player already owns the anchor Peer ID; join as client
        this.connectAsSubscriber();
      } else {
        this.scheduleReconnect(2500);
      }
    });

    peer.on('disconnected', () => {
      if (this.destroyed || this.peer !== peer) return;
      try {
        peer.reconnect();
      } catch {
        this.scheduleReconnect(1500);
      }
    });
  }

  private attachSubscriber(conn: DataConnection) {
    this.subscriberConns.set(conn.peer, conn);
    conn.on('open', () => {
      if (!this.isAnchor) return;
      this.pruneExpired();
      try {
        conn.send({ type: 'rooms_snapshot', rooms: this.getRooms() } as DirectoryMessage);
      } catch {
        // ignore
      }
    });

    conn.on('data', (raw) => {
      if (!this.isAnchor) return;
      const msg = raw as DirectoryMessage;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'register_room' && msg.room?.code) {
        const room: PublicRoomInfo = { ...msg.room, updatedAt: Date.now() };
        this.roomsMap.set(room.code, room);
        this.saveLocalCache();
        this.broadcastSnapshotFromAnchor();
        this.emitUpdate();
      } else if (msg.type === 'unregister_room' && msg.code) {
        this.roomsMap.delete(msg.code);
        this.saveLocalCache();
        this.broadcastSnapshotFromAnchor();
        this.emitUpdate();
      } else if (msg.type === 'list_rooms') {
        this.pruneExpired();
        try {
          conn.send({ type: 'rooms_snapshot', rooms: this.getRooms() } as DirectoryMessage);
        } catch {
          // ignore
        }
      }
    });

    const onDrop = () => {
      this.subscriberConns.delete(conn.peer);
    };
    conn.on('close', onDrop);
    conn.on('error', onDrop);
  }

  private broadcastSnapshotFromAnchor() {
    if (!this.isAnchor) return;
    this.pruneExpired();
    const rooms = this.getRooms();
    const payload: DirectoryMessage = { type: 'rooms_snapshot', rooms };
    this.postBroadcast(payload);
    for (const conn of this.subscriberConns.values()) {
      if (conn.open) {
        try {
          conn.send(payload);
        } catch {
          // ignore
        }
      }
    }
  }

  private connectAsSubscriber() {
    if (this.destroyed) return;
    this.cleanupPeer();

    let clientPeer: Peer;
    try {
      clientPeer = new Peer({
        config: { iceServers: ICE_SERVERS },
      });
    } catch {
      this.scheduleReconnect(2000);
      return;
    }
    this.peer = clientPeer;
    this.isAnchor = false;

    clientPeer.on('open', () => {
      if (this.destroyed || this.peer !== clientPeer) return;
      const conn = clientPeer.connect(DIRECTORY_HUB_PEER_ID, {
        reliable: true,
        serialization: 'json',
      });
      this.anchorConn = conn;

      conn.on('open', () => {
        if (this.destroyed || this.anchorConn !== conn) return;
        try {
          conn.send({ type: 'list_rooms' } as DirectoryMessage);
          if (this.hostedRoom) {
            conn.send({
              type: 'register_room',
              room: { ...this.hostedRoom, updatedAt: Date.now() },
            } as DirectoryMessage);
          }
        } catch {
          // ignore
        }
      });

      conn.on('data', (raw) => {
        const msg = raw as DirectoryMessage;
        if (msg?.type === 'rooms_snapshot' && Array.isArray(msg.rooms)) {
          this.mergeSnapshot(msg.rooms);
        }
      });

      const handleAnchorLost = () => {
        if (this.destroyed || this.anchorConn !== conn) return;
        this.anchorConn = null;
        this.scheduleReconnect(200 + Math.floor(Math.random() * 500));
      };
      conn.on('close', handleAnchorLost);
      conn.on('error', handleAnchorLost);
    });

    clientPeer.on('error', () => {
      if (this.destroyed || this.peer !== clientPeer) return;
      this.scheduleReconnect(1200 + Math.floor(Math.random() * 600));
    });
  }

  private emitUpdate() {
    this.onRoomsUpdate(this.getRooms());
  }
}
