import Peer, { DataConnection } from 'peerjs';
import { TouchInputState, GameRuntime } from './engine';
import { SfxSyncEvent } from './soundEngine';
import {
  AmbientMote,
  AppScreen,
  BoonDef,
  BoonId,
  Boss,
  BossProjectile,
  CameraState,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  ChestDrop,
  ComicSlash,
  DeathEffect,
  DEFAULT_CHEATS,
  DIFFICULTY_SETTINGS,
  DifficultyKey,
  DungeonGate,
  EclipseBeacon,
  EclipseMirror,
  EclipsePrison,
  EclipsePylon,
  Enemy,
  EnergyWave,
  FloatingText,
  GameMode,
  HeroClassId,
  Knife,
  LobbyPlayerInfo,
  Medkit,
  OniCursedZone,
  OniShrine,
  OniSpiritBomb,
  Particle,
  Player,
  PlayerId,
  PlayerProjectile,
  RelicDrop,
  RoomKind,
  RunSummary,
  ShopItem,
  SlashArc,
  StageKey,
  TelegraphLine,
  VoidDecoy,
  VoidRift,
  VoidTentacle,
  WeaponDrop,
  WeaponId,
} from './types';

export type CoopMode = 'solo' | 'local' | 'online';
export type OnlineRole = 'none' | 'host' | 'guest';
export type OnlineConnectionStatus = 'idle' | 'creating' | 'waiting' | 'connecting' | 'connected' | 'error';

const PEER_PREFIX = 'dungeon-bouncer-v1-';
const ROOM_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)];
  }
  return code;
}

export function sanitizeRoomCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
}

export function getInitialRoomCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const code = sanitizeRoomCode(params.get('room') || '');
    return code.length >= 4 ? code : null;
  } catch {
    return null;
  }
}

export function getInviteLink(code: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('room', code);
  return url.toString();
}

export interface LobbyLoadoutPayload {
  heroClass: HeroClassId;
  colorHex: string;
  ready?: boolean;
  difficulty?: DifficultyKey;
  mode?: GameMode;
}

export interface SyncedPlayer {
  id: PlayerId;
  heroClass: HeroClassId;
  weapon: WeaponId;
  coins: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facingAngle: number;
  size: number;
  speed: number;
  color: string;
  hasKnife: boolean;
  state: Player['state'];
  reviveProgress: number;
  invulnerable: boolean;
  inSafeZone: boolean;
  safeZoneClosed: boolean;
  dashReady: boolean;
  dashTime: number;
  dashCooldown: number;
  dashImmune: boolean;
  dashTrail: { x: number; y: number; alpha: number; color: string; angle: number }[];
  dashTimeLeft: number;
  dashCooldownTimer: number;
  postDashInvulnerability: number;
  hp: number;
  maxHp: number;
  dash2Ready: boolean;
  dash2CooldownTimer: number;
  dash2Active: boolean;
  usingDash2: boolean;
  invulnFrames: number;
  abilityReady: boolean;
  abilityCooldown: number;
  abilityCooldownTimer: number;
  cloakTimer: number;
  empoweredStrike: boolean;
  shieldRegenTimer: number;
  sealed: boolean;
  sealTimer: number;
  hasShield: boolean;
  overdriveTimer: number;
  magnetTimer: number;
  dashDirX: number;
  dashDirY: number;
  animTime: number;
}

export interface SyncedRuntimeSnapshot {
  difficulty: DifficultyKey;
  mode: GameMode;
  numPlayers: number;
  isOnlineCampaign: boolean;
  roomKind: RoomKind;
  roomDepth: number;
  bossesDefeatedCount: number;
  chests: ChestDrop[];
  weaponDrops: WeaponDrop[];
  gates: DungeonGate[];
  shopItems: ShopItem[];
  pingByPlayer: Record<number, number | null>;
  playerColors: Record<number, string>;
  playerClasses: Record<number, HeroClassId>;
  stage: StageKey;
  waveNumber: number;
  bossType: GameRuntime['bossType'];
  isBossLevel: boolean;
  arenaWidth: number;
  arenaHeight: number;
  camera: CameraState;
  bossVoiceLine: string | null;
  bossVoiceTimer: number;
  players: SyncedPlayer[];
  playerProjectiles: PlayerProjectile[];
  voidDecoys: VoidDecoy[];
  telegraphLines: TelegraphLine[];
  knives: Knife[];
  enemies: Enemy[];
  boss: Boss;
  bossProjectiles: BossProjectile[];
  voidTentacles: VoidTentacle[];
  oniShrines: OniShrine[];
  oniCursedZones: OniCursedZone[];
  oniSpiritBombs: OniSpiritBomb[];
  eclipseBeacons: EclipseBeacon[];
  eclipsePylons: EclipsePylon[];
  eclipsePrison: EclipsePrison | null;
  eclipseMirrors: EclipseMirror[];
  eclipseMarkedBy: PlayerId | null;
  eclipseMarkTimer: number;
  eclipseCounterFlashTimer: number;
  eclipseSyncTimer: number;
  eclipseTetherTimer: number;
  eclipseSanctuaryActive: boolean;
  medkits: Medkit[];
  relics: RelicDrop[];
  dustParticles: Particle[];
  deathEffects: DeathEffect[];
  slashArcs: SlashArc[];
  floatingTexts: FloatingText[];
  comicSlashes: ComicSlash[];
  voidRifts: VoidRift[];
  energyWaves: EnergyWave[];
  activeBoons: BoonId[];
  score: number;
  stylePoints: number;
  grazes: number;
  kills: number;
  elapsedSeconds: number;
  stageElapsed: number;
  maxCombo: number;
  playerCombos: Record<number, { count: number; timer: number }>;
  medkitInventoryCount: number;
  medkitNotif: string | null;
  phaseAnnounce: { text: string; color: string } | null;
  screenShake: number;
  freezeTime: number;
  introPlaying: boolean;
  introTimer: number;
  fadeOpacity: number;
  warningFlash: number;
  timeScale: number;
  bossNameReveal: boolean;
  bossDeadTimer: number;
  gameOver: boolean;
  victory: boolean;
  p1SafeZone: GameRuntime['p1SafeZone'];
  p2SafeZone: GameRuntime['p2SafeZone'];
  cheatsUsed: boolean;
}

export type OnlineMessage =
  | { type: 'welcome'; playerId: PlayerId }
  | { type: 'room_full' }
  | { type: 'ping'; ts: number }
  | { type: 'pong'; ts: number }
  | {
      type: 'lobby_state';
      roster: LobbyPlayerInfo[];
      difficulty: DifficultyKey;
      mode: GameMode;
      maxPlayers: number;
    }
  | { type: 'guest_config'; colorHex: string; heroClass: HeroClassId; ready: boolean }
  | { type: 'loadout'; payload: LobbyLoadoutPayload }
  | { type: 'input'; input: TouchInputState }
  | { type: 'sync'; snap: SyncedRuntimeSnapshot; sfx: SfxSyncEvent[] }
  | { type: 'sfx'; events: SfxSyncEvent[] }
  | {
      type: 'screen';
      screen: AppScreen;
      boonDraft?: { clearedStage: StageKey; nextStage: StageKey; choices: BoonDef[] };
      transitionTarget?: StageKey | null;
      summary?: RunSummary | null;
      pausedBy?: PlayerId;
    }
  | { type: 'cmd'; action: 'skip_intro' | 'pause' | 'resume' | 'leave' };

function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function serializeRuntimeForSync(rt: GameRuntime): SyncedRuntimeSnapshot {
  const playerCombos: Record<number, { count: number; timer: number }> = {};
  for (const k of Object.keys(rt.playerCombos)) {
    const id = Number(k);
    playerCombos[id] = { ...rt.playerCombos[id] };
  }

  return {
    difficulty: rt.difficulty,
    mode: rt.mode,
    numPlayers: rt.numPlayers,
    isOnlineCampaign: rt.isOnlineCampaign,
    roomKind: rt.roomKind,
    roomDepth: rt.roomDepth,
    bossesDefeatedCount: rt.bossesDefeatedCount,
    chests: rt.chests.map((c) => ({ ...c })),
    weaponDrops: rt.weaponDrops.map((w) => ({ ...w, bob: r2(w.bob), swapLockTimer: r2(w.swapLockTimer) })),
    gates: rt.gates.map((g) => ({
      ...g,
      playersInside: [...g.playersInside],
      holdProgress: r2(g.holdProgress),
    })),
    shopItems: rt.shopItems.map((s) => ({ ...s, purchasedBy: [...s.purchasedBy] })),
    pingByPlayer: { ...rt.pingByPlayer },
    playerColors: { ...rt.playerColors },
    playerClasses: { ...rt.playerClasses },
    stage: rt.stage,
    waveNumber: rt.waveNumber,
    bossType: rt.bossType,
    isBossLevel: rt.isBossLevel,
    arenaWidth: rt.arenaWidth,
    arenaHeight: rt.arenaHeight,
    camera: {
      x: r1(rt.camera.x),
      y: r1(rt.camera.y),
      zoom: r2(rt.camera.zoom),
    },
    bossVoiceLine: rt.bossVoiceLine,
    bossVoiceTimer: r1(rt.bossVoiceTimer),
    players: rt.players.map((p) => ({
      id: p.id,
      heroClass: p.heroClass,
      weapon: p.weapon,
      coins: p.coins,
      x: r1(p.x),
      y: r1(p.y),
      vx: r1(p.vx),
      vy: r1(p.vy),
      facingAngle: r2(p.facingAngle),
      size: p.size,
      speed: p.speed,
      color: p.color,
      hasKnife: p.hasKnife,
      state: p.state,
      reviveProgress: r2(p.reviveProgress),
      invulnerable: p.invulnerable,
      inSafeZone: p.inSafeZone,
      safeZoneClosed: p.safeZoneClosed,
      dashReady: p.dashReady,
      dashTime: p.dashTime,
      dashCooldown: p.dashCooldown,
      dashImmune: p.dashImmune,
      dashTrail: p.dashTrail.map((t) => ({
        x: r1(t.x),
        y: r1(t.y),
        alpha: r2(t.alpha),
        color: t.color,
        angle: r2(t.angle),
      })),
      dashTimeLeft: r2(p.dashTimeLeft),
      dashCooldownTimer: r1(p.dashCooldownTimer),
      postDashInvulnerability: r2(p.postDashInvulnerability),
      hp: Math.round(p.hp),
      maxHp: p.maxHp,
      dash2Ready: p.dash2Ready,
      dash2CooldownTimer: r1(p.dash2CooldownTimer),
      dash2Active: p.dash2Active,
      usingDash2: p.usingDash2,
      invulnFrames: r2(p.invulnFrames),
      abilityReady: p.abilityReady,
      abilityCooldown: p.abilityCooldown,
      abilityCooldownTimer: r1(p.abilityCooldownTimer),
      cloakTimer: r2(p.cloakTimer),
      empoweredStrike: p.empoweredStrike,
      shieldRegenTimer: r1(p.shieldRegenTimer),
      sealed: p.sealed,
      sealTimer: r1(p.sealTimer),
      hasShield: p.hasShield,
      overdriveTimer: r1(p.overdriveTimer),
      magnetTimer: r1(p.magnetTimer),
      dashDirX: r2(p.dashDirX),
      dashDirY: r2(p.dashDirY),
      animTime: r2(p.animTime),
    })),
    playerProjectiles: rt.playerProjectiles.map((pp) => ({
      ...pp,
      x: r1(pp.x),
      y: r1(pp.y),
      angle: r2(pp.angle),
      lifetime: r2(pp.lifetime),
    })),
    voidDecoys: rt.voidDecoys.map((v) => ({
      ...v,
      x: r1(v.x),
      y: r1(v.y),
      timer: r2(v.timer),
    })),
    telegraphLines: rt.telegraphLines.map((t) => ({
      ...t,
      x1: r1(t.x1),
      y1: r1(t.y1),
      x2: r1(t.x2),
      y2: r1(t.y2),
      timer: r2(t.timer),
    })),
    knives: rt.knives.map((k) => ({
      ...k,
      x: r1(k.x),
      y: r1(k.y),
      bobPhase: r2(k.bobPhase),
    })),
    enemies: rt.enemies.map((e) => ({
      ...e,
      x: r1(e.x),
      y: r1(e.y),
      rotation: r2(e.rotation),
    })),
    boss: {
      ...rt.boss,
      x: r1(rt.boss.x),
      y: r1(rt.boss.y),
      targetX: r1(rt.boss.targetX),
      targetY: r1(rt.boss.targetY),
      animationTimer: r2(rt.boss.animationTimer),
      rotationAngle: r2(rt.boss.rotationAngle),
      flashIntensity: r2(rt.boss.flashIntensity),
      stateTimer: r2(rt.boss.stateTimer),
      attackTimer: r2(rt.boss.attackTimer),
      pulseSize: r1(rt.boss.pulseSize),
    },
    bossProjectiles: rt.bossProjectiles.map((bp) => ({
      ...bp,
      x: r1(bp.x),
      y: r1(bp.y),
    })),
    voidTentacles: rt.voidTentacles.map((vt) => ({
      ...vt,
      waveOffset: r2(vt.waveOffset),
      extendFactor: r2(vt.extendFactor),
    })),
    oniShrines: rt.oniShrines.map((s) => ({ ...s })),
    oniCursedZones: rt.oniCursedZones.map((z) => ({
      ...z,
      x: r1(z.x),
      y: r1(z.y),
      radius: r1(z.radius),
      alpha: r2(z.alpha),
    })),
    oniSpiritBombs: rt.oniSpiritBombs.map((b) => ({
      ...b,
      x: r1(b.x),
      y: r1(b.y),
    })),
    eclipseBeacons: rt.eclipseBeacons.map((b) => ({ ...b })),
    eclipsePylons: rt.eclipsePylons.map((p) => ({ ...p })),
    eclipsePrison: rt.eclipsePrison ? { ...rt.eclipsePrison } : null,
    eclipseMirrors: rt.eclipseMirrors.map((m) => ({
      ...m,
      x: r1(m.x),
      y: r1(m.y),
      charge: r2(m.charge),
    })),
    eclipseMarkedBy: rt.eclipseMarkedBy,
    eclipseMarkTimer: r1(rt.eclipseMarkTimer),
    eclipseCounterFlashTimer: r2(rt.eclipseCounterFlashTimer),
    eclipseSyncTimer: r2(rt.eclipseSyncTimer),
    eclipseTetherTimer: r1(rt.eclipseTetherTimer),
    eclipseSanctuaryActive: rt.eclipseSanctuaryActive,
    medkits: rt.medkits.map((m) => ({ ...m, bob: r2(m.bob) })),
    relics: rt.relics.map((r) => ({ ...r, bob: r2(r.bob) })),
    dustParticles: rt.dustParticles.slice(-60).map((d) => ({
      ...d,
      x: r1(d.x),
      y: r1(d.y),
      alpha: r2(d.alpha),
    })),
    deathEffects: rt.deathEffects.slice(-40).map((de) => ({
      ...de,
      x: r1(de.x),
      y: r1(de.y),
      radius: de.radius !== undefined ? r1(de.radius) : undefined,
      alpha: r2(de.alpha),
    })),
    slashArcs: rt.slashArcs.map((sa) => ({
      ...sa,
      x: r1(sa.x),
      y: r1(sa.y),
      alpha: r2(sa.alpha),
    })),
    floatingTexts: rt.floatingTexts.slice(-24).map((ft) => ({
      ...ft,
      x: r1(ft.x),
      y: r1(ft.y),
      alpha: r2(ft.alpha),
    })),
    comicSlashes: rt.comicSlashes.map((cs) => ({
      ...cs,
      alpha: r2(cs.alpha),
    })),
    voidRifts: rt.voidRifts.map((vr) => ({
      ...vr,
      size: r1(vr.size),
      alpha: r2(vr.alpha),
      rotation: r2(vr.rotation),
    })),
    energyWaves: rt.energyWaves.map((ew) => ({
      ...ew,
      radius: r1(ew.radius),
      alpha: r2(ew.alpha),
    })),
    activeBoons: [...rt.activeBoons],
    score: Math.round(rt.score),
    stylePoints: r1(rt.stylePoints),
    grazes: rt.grazes,
    kills: rt.kills,
    elapsedSeconds: r1(rt.elapsedSeconds),
    stageElapsed: r1(rt.stageElapsed),
    maxCombo: rt.maxCombo,
    playerCombos,
    medkitInventoryCount: rt.medkitInventoryCount,
    medkitNotif: rt.medkitNotif,
    phaseAnnounce: rt.phaseAnnounce,
    screenShake: r1(rt.screenShake),
    freezeTime: r2(rt.freezeTime),
    introPlaying: rt.introPlaying,
    introTimer: r2(rt.introTimer),
    fadeOpacity: r2(rt.fadeOpacity),
    warningFlash: r2(rt.warningFlash),
    timeScale: r2(rt.timeScale),
    bossNameReveal: rt.bossNameReveal,
    bossDeadTimer: r2(rt.bossDeadTimer),
    gameOver: rt.gameOver,
    victory: rt.victory,
    p1SafeZone: { ...rt.p1SafeZone },
    p2SafeZone: { ...rt.p2SafeZone },
    cheatsUsed: rt.cheatsUsed || Object.values(rt.cheats).some(Boolean),
  };
}

function createGuestAmbientMotes(count = 28, width = CANVAS_WIDTH, height = CANVAS_HEIGHT): AmbientMote[] {
  const motes: AmbientMote[] = [];
  for (let i = 0; i < count; i++) {
    motes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 20,
      vy: -10 - Math.random() * 24,
      size: 1.5 + Math.random() * 2.4,
      alpha: 0.25 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return motes;
}

function lerpNum(prev: number, target: number, alpha: number, snapThreshold = 95): number {
  const diff = target - prev;
  if (Math.abs(diff) > snapThreshold) return target;
  return prev + diff * alpha;
}

function hydratePlayer(sp: SyncedPlayer, prev?: Player): Player {
  const base: Player = {
    ...sp,
    grazedIds: prev ? prev.grazedIds : new Set<number>(),
    _lastDashPressed: false,
    _lastAbilityPressed: false,
    cleanDodgeFailed: false,
  };
  return base;
}

function cloneCombos(src: Record<number, { count: number; timer: number }>): Record<number, { count: number; timer: number }> {
  const out: Record<number, { count: number; timer: number }> = {
    1: { count: 0, timer: 0 },
    2: { count: 0, timer: 0 },
    3: { count: 0, timer: 0 },
    4: { count: 0, timer: 0 },
    5: { count: 0, timer: 0 },
  };
  for (const key of Object.keys(src)) {
    const id = Number(key);
    out[id] = { ...src[id] };
  }
  return out;
}

export function applySyncedSnapshotToGuest(
  displayRt: GameRuntime | null,
  snap: SyncedRuntimeSnapshot,
  dt: number
): GameRuntime {
  const lerpAlpha = 1 - Math.exp(-28 * Math.max(0.004, Math.min(dt, 0.05)));

  if (!displayRt || displayRt.stage !== snap.stage || displayRt.roomDepth !== snap.roomDepth) {
    const players: Player[] = snap.players.map((sp) => hydratePlayer(sp));
    return {
      difficulty: snap.difficulty,
      diffSettings: DIFFICULTY_SETTINGS[snap.difficulty],
      mode: snap.mode,
      numPlayers: snap.numPlayers,
      isOnlineCampaign: snap.isOnlineCampaign,
      roomKind: snap.roomKind,
      roomDepth: snap.roomDepth,
      bossesDefeatedCount: snap.bossesDefeatedCount,
      chests: snap.chests.map((c) => ({ ...c })),
      weaponDrops: snap.weaponDrops.map((w) => ({ ...w })),
      gates: snap.gates.map((g) => ({ ...g, playersInside: [...g.playersInside] })),
      shopItems: snap.shopItems.map((s) => ({ ...s, purchasedBy: [...s.purchasedBy] })),
      lastKilledPos: null,
      shopBuyTimers: {},
      pingByPlayer: { ...snap.pingByPlayer },
      playerColors: { ...snap.playerColors },
      playerClasses: { ...snap.playerClasses },
      stage: snap.stage,
      waveNumber: snap.waveNumber,
      bossType: snap.bossType,
      isBossLevel: snap.isBossLevel,
      arenaWidth: snap.arenaWidth,
      arenaHeight: snap.arenaHeight,
      camera: { ...snap.camera },
      bossVoiceLine: snap.bossVoiceLine,
      bossVoiceTimer: snap.bossVoiceTimer,
      players,
      playerProjectiles: snap.playerProjectiles.map((p) => ({ ...p })),
      voidDecoys: snap.voidDecoys.map((v) => ({ ...v })),
      telegraphLines: snap.telegraphLines.map((t) => ({ ...t })),
      knives: snap.knives.map((k) => ({ ...k })),
      enemies: snap.enemies.map((e) => ({ ...e })),
      boss: { ...snap.boss },
      bossProjectiles: snap.bossProjectiles.map((b) => ({ ...b })),
      voidTentacles: snap.voidTentacles.map((v) => ({ ...v })),
      oniShrines: snap.oniShrines.map((s) => ({ ...s })),
      oniCursedZones: snap.oniCursedZones.map((z) => ({ ...z })),
      oniSpiritBombs: snap.oniSpiritBombs.map((b) => ({ ...b })),
      eclipseBeacons: snap.eclipseBeacons.map((b) => ({ ...b })),
      eclipsePylons: snap.eclipsePylons.map((p) => ({ ...p })),
      eclipsePrison: snap.eclipsePrison ? { ...snap.eclipsePrison } : null,
      eclipseMirrors: snap.eclipseMirrors.map((m) => ({ ...m })),
      eclipseMarkedBy: snap.eclipseMarkedBy,
      eclipseMarkTimer: snap.eclipseMarkTimer,
      eclipseCounterFlashTimer: snap.eclipseCounterFlashTimer,
      eclipseSyncTimer: snap.eclipseSyncTimer,
      eclipseTetherTimer: snap.eclipseTetherTimer,
      eclipseSanctuaryActive: snap.eclipseSanctuaryActive,
      medkits: snap.medkits.map((m) => ({ ...m })),
      relics: snap.relics.map((r) => ({ ...r })),
      dustParticles: snap.dustParticles.map((d) => ({ ...d })),
      deathEffects: snap.deathEffects.map((de) => ({ ...de })),
      slashArcs: snap.slashArcs.map((sa) => ({ ...sa })),
      floatingTexts: snap.floatingTexts.map((ft) => ({ ...ft })),
      comicSlashes: snap.comicSlashes.map((cs) => ({ ...cs })),
      voidRifts: snap.voidRifts.map((vr) => ({ ...vr })),
      energyWaves: snap.energyWaves.map((ew) => ({ ...ew })),
      ambientMotes: createGuestAmbientMotes(28, snap.arenaWidth, snap.arenaHeight),
      activeBoons: [...snap.activeBoons],
      score: snap.score,
      stylePoints: snap.stylePoints,
      grazes: snap.grazes,
      kills: snap.kills,
      elapsedSeconds: snap.elapsedSeconds,
      stageElapsed: snap.stageElapsed,
      maxCombo: snap.maxCombo,
      playerCombos: cloneCombos(snap.playerCombos),
      medkitSpawnTimer: 0,
      relicSpawnTimer: 0,
      medkitInventoryCount: snap.medkitInventoryCount,
      medkitNotif: snap.medkitNotif,
      medkitNotifTimer: 0,
      phaseAnnounce: snap.phaseAnnounce,
      phaseAnnounceTimer: 0,
      screenShake: snap.screenShake,
      freezeTime: snap.freezeTime,
      introPlaying: snap.introPlaying,
      introTimer: snap.introTimer,
      fadeOpacity: snap.fadeOpacity,
      warningFlash: snap.warningFlash,
      timeScale: snap.timeScale,
      landingSlowRemaining: 0,
      bossNameReveal: snap.bossNameReveal,
      bossDeadTimer: snap.bossDeadTimer,
      bossDeadBeat: 0,
      gameOver: snap.gameOver,
      victory: snap.victory,
      nextUid: 1,
      p1SafeZone: { ...snap.p1SafeZone },
      p2SafeZone: { ...snap.p2SafeZone },
      isTutorial: false,
      tutorialStep: 1,
      tutorialSkillUses: 0,
      tutorialGrazesStart: 0,
      tutorialFireTimer: 0,
      cheats: { ...DEFAULT_CHEATS },
      cheatsUsed: snap.cheatsUsed,
      bossHitCooldowns: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      dungeonCleanDodgeTimer: 0,
      pendingEvent: null,
    };
  }

  const prevEnemiesById = new Map<number, Enemy>();
  displayRt.enemies.forEach((e) => prevEnemiesById.set(e.id, e));

  const prevBossProjsByUid = new Map<number, BossProjectile>();
  displayRt.bossProjectiles.forEach((bp) => prevBossProjsByUid.set(bp.uid, bp));

  const prevPlayerProjsByUid = new Map<number, PlayerProjectile>();
  displayRt.playerProjectiles.forEach((pp) => prevPlayerProjsByUid.set(pp.uid, pp));

  const prevKnivesByOwner = new Map<PlayerId, Knife>();
  displayRt.knives.forEach((k) => prevKnivesByOwner.set(k.owner, k));

  displayRt.difficulty = snap.difficulty;
  displayRt.diffSettings = DIFFICULTY_SETTINGS[snap.difficulty];
  displayRt.mode = snap.mode;
  displayRt.numPlayers = snap.numPlayers;
  displayRt.isOnlineCampaign = snap.isOnlineCampaign;
  displayRt.roomKind = snap.roomKind;
  displayRt.roomDepth = snap.roomDepth;
  displayRt.bossesDefeatedCount = snap.bossesDefeatedCount;
  displayRt.chests = snap.chests.map((c) => ({ ...c }));
  displayRt.weaponDrops = snap.weaponDrops.map((w) => ({ ...w }));
  displayRt.gates = snap.gates.map((g) => ({ ...g, playersInside: [...g.playersInside] }));
  displayRt.shopItems = snap.shopItems.map((s) => ({ ...s, purchasedBy: [...s.purchasedBy] }));
  displayRt.pingByPlayer = { ...snap.pingByPlayer };
  displayRt.playerColors = { ...snap.playerColors };
  displayRt.playerClasses = { ...snap.playerClasses };
  displayRt.waveNumber = snap.waveNumber;
  displayRt.bossType = snap.bossType;
  displayRt.isBossLevel = snap.isBossLevel;
  displayRt.arenaWidth = snap.arenaWidth;
  displayRt.arenaHeight = snap.arenaHeight;

  displayRt.camera.x = lerpNum(displayRt.camera.x, snap.camera.x, lerpAlpha, 120);
  displayRt.camera.y = lerpNum(displayRt.camera.y, snap.camera.y, lerpAlpha, 120);
  displayRt.camera.zoom = lerpNum(displayRt.camera.zoom, snap.camera.zoom, lerpAlpha, 0.4);

  displayRt.bossVoiceLine = snap.bossVoiceLine;
  displayRt.bossVoiceTimer = snap.bossVoiceTimer;

  displayRt.players = snap.players.map((sp, idx) => {
    const prev = displayRt.players[idx];
    const next = hydratePlayer(sp, prev);
    if (prev && prev.state === next.state) {
      next.x = lerpNum(prev.x, sp.x, lerpAlpha, 110);
      next.y = lerpNum(prev.y, sp.y, lerpAlpha, 110);
    }
    return next;
  });

  displayRt.enemies = snap.enemies.map((e) => {
    const prev = prevEnemiesById.get(e.id);
    if (!prev) return { ...e };
    return {
      ...e,
      x: lerpNum(prev.x, e.x, lerpAlpha, 95),
      y: lerpNum(prev.y, e.y, lerpAlpha, 95),
    };
  });

  const prevBoss = displayRt.boss;
  displayRt.boss = {
    ...snap.boss,
    x: lerpNum(prevBoss.x, snap.boss.x, lerpAlpha, 140),
    y: lerpNum(prevBoss.y, snap.boss.y, lerpAlpha, 140),
  };

  displayRt.bossProjectiles = snap.bossProjectiles.map((bp) => {
    const prev = prevBossProjsByUid.get(bp.uid);
    if (!prev) return { ...bp };
    return {
      ...bp,
      x: lerpNum(prev.x, bp.x, lerpAlpha, 100),
      y: lerpNum(prev.y, bp.y, lerpAlpha, 100),
    };
  });

  displayRt.playerProjectiles = snap.playerProjectiles.map((pp) => {
    const prev = prevPlayerProjsByUid.get(pp.uid);
    if (!prev) return { ...pp };
    return {
      ...pp,
      x: lerpNum(prev.x, pp.x, lerpAlpha, 100),
      y: lerpNum(prev.y, pp.y, lerpAlpha, 100),
    };
  });

  displayRt.knives = snap.knives.map((k) => {
    const prev = prevKnivesByOwner.get(k.owner);
    if (!prev) return { ...k };
    return {
      ...k,
      x: lerpNum(prev.x, k.x, lerpAlpha, 100),
      y: lerpNum(prev.y, k.y, lerpAlpha, 100),
    };
  });

  displayRt.voidDecoys = snap.voidDecoys.map((v) => ({ ...v }));
  displayRt.telegraphLines = snap.telegraphLines.map((t) => ({ ...t }));
  displayRt.voidTentacles = snap.voidTentacles.map((v) => ({ ...v }));
  displayRt.oniShrines = snap.oniShrines.map((s) => ({ ...s }));
  displayRt.oniCursedZones = snap.oniCursedZones.map((z) => ({ ...z }));

  displayRt.oniSpiritBombs = snap.oniSpiritBombs.map((b, idx) => {
    const prev = displayRt.oniSpiritBombs[idx];
    if (!prev) return { ...b };
    return {
      ...b,
      x: lerpNum(prev.x, b.x, lerpAlpha, 95),
      y: lerpNum(prev.y, b.y, lerpAlpha, 95),
    };
  });

  displayRt.eclipseBeacons = snap.eclipseBeacons.map((b) => ({ ...b }));
  displayRt.eclipsePylons = snap.eclipsePylons.map((p) => ({ ...p }));
  displayRt.eclipsePrison = snap.eclipsePrison ? { ...snap.eclipsePrison } : null;
  displayRt.eclipseMirrors = snap.eclipseMirrors.map((m) => ({ ...m }));
  displayRt.eclipseMarkedBy = snap.eclipseMarkedBy;
  displayRt.eclipseMarkTimer = snap.eclipseMarkTimer;
  displayRt.eclipseCounterFlashTimer = snap.eclipseCounterFlashTimer;
  displayRt.eclipseSyncTimer = snap.eclipseSyncTimer;
  displayRt.eclipseTetherTimer = snap.eclipseTetherTimer;
  displayRt.eclipseSanctuaryActive = snap.eclipseSanctuaryActive;

  displayRt.medkits = snap.medkits.map((m) => ({ ...m }));
  displayRt.relics = snap.relics.map((r) => ({ ...r }));
  displayRt.dustParticles = snap.dustParticles.map((d) => ({ ...d }));
  displayRt.deathEffects = snap.deathEffects.map((de) => ({ ...de }));
  displayRt.slashArcs = snap.slashArcs.map((sa) => ({ ...sa }));
  displayRt.floatingTexts = snap.floatingTexts.map((ft) => ({ ...ft }));
  displayRt.comicSlashes = snap.comicSlashes.map((cs) => ({ ...cs }));
  displayRt.voidRifts = snap.voidRifts.map((vr) => ({ ...vr }));
  displayRt.energyWaves = snap.energyWaves.map((ew) => ({ ...ew }));

  displayRt.ambientMotes.forEach((m) => {
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    m.phase += dt * 2;
    if (m.y < -10) {
      m.y = displayRt.arenaHeight + 10;
      m.x = Math.random() * displayRt.arenaWidth;
    }
  });

  displayRt.activeBoons = [...snap.activeBoons];
  displayRt.score = snap.score;
  displayRt.stylePoints = snap.stylePoints;
  displayRt.grazes = snap.grazes;
  displayRt.kills = snap.kills;
  displayRt.elapsedSeconds = snap.elapsedSeconds;
  displayRt.stageElapsed = snap.stageElapsed;
  displayRt.maxCombo = snap.maxCombo;
  displayRt.playerCombos = cloneCombos(snap.playerCombos);
  displayRt.medkitInventoryCount = snap.medkitInventoryCount;
  displayRt.medkitNotif = snap.medkitNotif;
  displayRt.phaseAnnounce = snap.phaseAnnounce;
  displayRt.screenShake = snap.screenShake;
  displayRt.freezeTime = snap.freezeTime;
  displayRt.introPlaying = snap.introPlaying;
  displayRt.introTimer = snap.introTimer;
  displayRt.fadeOpacity = snap.fadeOpacity;
  displayRt.warningFlash = snap.warningFlash;
  displayRt.timeScale = snap.timeScale;
  displayRt.bossNameReveal = snap.bossNameReveal;
  displayRt.bossDeadTimer = snap.bossDeadTimer;
  displayRt.gameOver = snap.gameOver;
  displayRt.victory = snap.victory;
  displayRt.p1SafeZone = { ...snap.p1SafeZone };
  displayRt.p2SafeZone = { ...snap.p2SafeZone };
  displayRt.cheatsUsed = snap.cheatsUsed;

  return displayRt;
}

export interface OnlineSessionCallbacks {
  onStatusChange: (status: OnlineConnectionStatus, error?: string) => void;
  onMessage: (msg: OnlineMessage, fromPlayerId: PlayerId) => void;
  onGuestJoin?: (playerId: PlayerId) => void;
  onPartnerDisconnect: (disconnectedPlayerId?: PlayerId) => void;
  onPingUpdate?: (pings: Record<number, number | null>) => void;
  onAssignedSlot?: (playerId: PlayerId) => void;
}

interface GuestSlot {
  conn: DataConnection;
  pingMs: number | null;
}

export class OnlineSession {
  private peer: Peer | null = null;
  private hostConn: DataConnection | null = null;
  private guests = new Map<PlayerId, GuestSlot>();
  private role: 'host' | 'guest';
  private roomCode: string;
  private maxPlayers: number;
  private callbacks: OnlineSessionCallbacks;
  private destroyed = false;
  private connectTimer: number | null = null;
  private pingTimer: number | null = null;
  private hostWasConnected = false;

  constructor(
    role: 'host' | 'guest',
    roomCode: string,
    callbacks: OnlineSessionCallbacks,
    maxPlayers = 5
  ) {
    this.role = role;
    this.roomCode = sanitizeRoomCode(roomCode);
    this.callbacks = callbacks;
    this.maxPlayers = Math.max(2, Math.min(5, maxPlayers));
    this.start();
  }

  getRole(): 'host' | 'guest' {
    return this.role;
  }

  getRoomCode(): string {
    return this.roomCode;
  }

  setMaxPlayers(maxPlayers: number) {
    this.maxPlayers = Math.max(2, Math.min(5, maxPlayers));
    if (this.role === 'host') {
      for (const [slotId, slot] of this.guests.entries()) {
        if (slotId > this.maxPlayers) {
          try {
            slot.conn.close();
          } catch {
            // ignore
          }
          this.guests.delete(slotId);
        }
      }
    }
  }

  getConnectedGuestIds(): PlayerId[] {
    const ids: PlayerId[] = [];
    for (const [id, slot] of this.guests.entries()) {
      if (slot.conn.open) ids.push(id);
    }
    return ids.sort((a, b) => a - b);
  }

  getPingByPlayer(): Record<number, number | null> {
    const map: Record<number, number | null> = { 1: 1 };
    for (const [id, slot] of this.guests.entries()) {
      if (slot.conn.open) {
        map[id] = slot.pingMs;
      }
    }
    return map;
  }

  isConnected(): boolean {
    if (this.role === 'host') {
      for (const slot of this.guests.values()) {
        if (slot.conn.open) return true;
      }
      return false;
    }
    return Boolean(this.hostConn && this.hostConn.open);
  }

  send(msg: OnlineMessage, targetPlayerId?: PlayerId) {
    if (this.destroyed) return;
    if (this.role === 'host') {
      if (targetPlayerId !== undefined) {
        const slot = this.guests.get(targetPlayerId);
        if (slot && slot.conn.open) {
          try {
            slot.conn.send(msg);
          } catch {
            // ignore
          }
        }
        return;
      }
      for (const slot of this.guests.values()) {
        if (slot.conn.open) {
          try {
            slot.conn.send(msg);
          } catch {
            // ignore
          }
        }
      }
      return;
    }

    if (!this.hostConn || !this.hostConn.open) return;
    try {
      this.hostConn.send(msg);
    } catch {
      // ignore transient channel send error
    }
  }

  private clearTimers() {
    if (this.connectTimer !== null) {
      window.clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
    if (this.pingTimer !== null) {
      window.clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private ensurePingLoop() {
    if (this.role !== 'host' || this.pingTimer !== null) return;
    this.pingTimer = window.setInterval(() => {
      if (this.destroyed) return;
      const now = performance.now();
      for (const slot of this.guests.values()) {
        if (slot.conn.open) {
          try {
            slot.conn.send({ type: 'ping', ts: now } as OnlineMessage);
          } catch {
            // ignore
          }
        }
      }
    }, 1200);
  }

  private start() {
    this.callbacks.onStatusChange(this.role === 'host' ? 'creating' : 'connecting');

    const peerId = this.role === 'host' ? `${PEER_PREFIX}${this.roomCode}` : undefined;
    const peer = new Peer(peerId as string, {
      config: { iceServers: ICE_SERVERS },
    });
    this.peer = peer;

    if (this.role === 'guest') {
      this.connectTimer = window.setTimeout(() => {
        if (!this.destroyed && !this.isConnected()) {
          this.callbacks.onStatusChange(
            'error',
            'Timed out finding room. Check the Room Code or ask Host to recreate.'
          );
          this.destroy();
        }
      }, 15000);
    }

    peer.on('open', () => {
      if (this.destroyed) return;
      if (this.role === 'host') {
        this.callbacks.onStatusChange('waiting');
        this.ensurePingLoop();
      } else {
        const targetId = `${PEER_PREFIX}${this.roomCode}`;
        const conn = peer.connect(targetId, { reliable: true });
        this.attachGuestToHostConnection(conn);
      }
    });

    if (this.role === 'host') {
      peer.on('connection', (incomingConn) => {
        if (this.destroyed) {
          incomingConn.close();
          return;
        }
        let assignedSlot: PlayerId | null = null;
        const candidateSlots: PlayerId[] = [2, 3, 4, 5];
        for (const s of candidateSlots) {
          if (s <= this.maxPlayers && !this.guests.has(s)) {
            assignedSlot = s;
            break;
          }
        }
        if (assignedSlot === null) {
          incomingConn.on('open', () => {
            try {
              incomingConn.send({ type: 'room_full' } as OnlineMessage);
            } catch {
              // ignore
            }
            window.setTimeout(() => {
              try {
                incomingConn.close();
              } catch {
                // ignore
              }
            }, 150);
          });
          return;
        }
        this.attachHostToGuestConnection(incomingConn, assignedSlot);
      });
    }

    peer.on('error', (err) => {
      if (this.destroyed) return;
      if (this.connectTimer !== null) {
        window.clearTimeout(this.connectTimer);
        this.connectTimer = null;
      }
      const errType = (err as { type?: string })?.type || '';
      if (errType === 'unavailable-id') {
        this.callbacks.onStatusChange('error', 'Room code already in use. Regenerating...');
      } else if (errType === 'peer-unavailable') {
        this.callbacks.onStatusChange('error', 'Room not found. Double-check the Room Code.');
      } else {
        this.callbacks.onStatusChange(
          'error',
          'Connection error. Ensure players have internet access.'
        );
      }
    });

    peer.on('disconnected', () => {
      if (!this.destroyed && !this.isConnected() && peer && !peer.destroyed) {
        try {
          peer.reconnect();
        } catch {
          // ignore
        }
      }
    });
  }

  private attachHostToGuestConnection(conn: DataConnection, slotId: PlayerId) {
    const slot: GuestSlot = { conn, pingMs: null };
    this.guests.set(slotId, slot);

    conn.on('open', () => {
      if (this.destroyed) return;
      try {
        conn.send({ type: 'welcome', playerId: slotId } as OnlineMessage);
        conn.send({ type: 'ping', ts: performance.now() } as OnlineMessage);
      } catch {
        // ignore
      }
      this.ensurePingLoop();
      this.callbacks.onStatusChange('connected');
      this.callbacks.onGuestJoin?.(slotId);
    });

    conn.on('data', (raw) => {
      if (this.destroyed || !raw || typeof raw !== 'object') return;
      const msg = raw as OnlineMessage;
      if (msg.type === 'pong') {
        const rtt = Math.max(1, Math.round(performance.now() - msg.ts));
        slot.pingMs = rtt;
        this.callbacks.onPingUpdate?.(this.getPingByPlayer());
        return;
      }
      if ('type' in msg) {
        this.callbacks.onMessage(msg, slotId);
      }
    });

    const handleDrop = () => {
      if (this.destroyed) return;
      if (this.guests.get(slotId)?.conn === conn) {
        this.guests.delete(slotId);
        if (this.guests.size === 0) {
          this.callbacks.onStatusChange('waiting');
        }
        this.callbacks.onPingUpdate?.(this.getPingByPlayer());
        this.callbacks.onPartnerDisconnect(slotId);
      }
    };

    conn.on('close', handleDrop);
    conn.on('error', handleDrop);
  }

  private attachGuestToHostConnection(conn: DataConnection) {
    this.hostConn = conn;

    conn.on('open', () => {
      if (this.destroyed) return;
      if (this.connectTimer !== null) {
        window.clearTimeout(this.connectTimer);
        this.connectTimer = null;
      }
      this.hostWasConnected = true;
      this.callbacks.onStatusChange('connected');
    });

    conn.on('data', (raw) => {
      if (this.destroyed || !raw || typeof raw !== 'object') return;
      const msg = raw as OnlineMessage;
      if (msg.type === 'ping') {
        try {
          conn.send({ type: 'pong', ts: msg.ts } as OnlineMessage);
        } catch {
          // ignore
        }
        return;
      }
      if (msg.type === 'room_full') {
        this.callbacks.onStatusChange('error', 'Room is full (max 5 players reached).');
        this.destroy();
        return;
      }
      if (msg.type === 'welcome') {
        this.callbacks.onAssignedSlot?.(msg.playerId);
        return;
      }
      if ('type' in msg) {
        this.callbacks.onMessage(msg, 1);
      }
    });

    conn.on('close', () => {
      if (this.destroyed) return;
      this.clearTimers();
      const wasConnected = this.hostWasConnected;
      this.hostWasConnected = false;
      this.hostConn = null;
      if (wasConnected) {
        this.callbacks.onPartnerDisconnect(1);
      } else {
        this.callbacks.onStatusChange('error', 'Host closed the connection.');
      }
    });

    conn.on('error', () => {
      if (this.destroyed) return;
      this.clearTimers();
      if (this.hostWasConnected) {
        this.hostWasConnected = false;
        this.callbacks.onPartnerDisconnect(1);
      } else {
        this.callbacks.onStatusChange('error', 'Failed to establish peer channel.');
      }
    });
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clearTimers();
    try {
      this.hostConn?.close();
    } catch {
      // ignore
    }
    this.hostConn = null;
    for (const slot of this.guests.values()) {
      try {
        slot.conn.close();
      } catch {
        // ignore
      }
    }
    this.guests.clear();
    try {
      this.peer?.destroy();
    } catch {
      // ignore
    }
    this.peer = null;
  }
}
