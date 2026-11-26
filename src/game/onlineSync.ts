import Peer, { DataConnection } from 'peerjs';
import { TouchInputState, GameRuntime, PersistedRoomState } from './engine';
import { SfxSyncEvent } from './soundEngine';
import {
  AmbientMote,
  AppScreen,
  BoonDef,
  BoonId,
  Boss,
  BossChannelKind,
  BossProjectile,
  BossVariantId,
  CameraState,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  ChestDrop,
  clampPlayerToArenaAndHallways,
  CoinBurstEvent,
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
  FinalVoteState,
  FloatingText,
  FloorMapHudSnapshot,
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
  ShopNpc,
  SkillScrollDrop,
  SkillScrollItem,
  SkillZone,
  SlashArc,
  StageKey,
  TelegraphLine,
  VoidDecoy,
  VoidRift,
  VoidTentacle,
  WeaponClassId,
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
  playerName?: string;
  ready?: boolean;
  difficulty?: DifficultyKey;
  mode?: GameMode;
}

export interface SyncedPlayer {
  id: PlayerId;
  name: string;
  isBot?: boolean;
  heroClass: HeroClassId;
  weapon: WeaponId;
  scrollBag: SkillScrollItem[];
  potions: number;
  potionCooldownTimer: number;
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
  bonusMaxHp: number;
  dash2Ready: boolean;
  dash2CooldownTimer: number;
  dash2Active: boolean;
  usingDash2: boolean;
  invulnFrames: number;
  unlockedSkillTier: number;
  learnedSkills: Partial<Record<WeaponClassId, number[]>>;
  skillCooldowns: [number, number, number, number];
  skillMaxCooldowns: [number, number, number, number];
  abilityReady: boolean;
  abilityCooldown: number;
  abilityCooldownTimer: number;
  cloakTimer: number;
  empoweredStrike: boolean;
  shieldRegenTimer: number;
  bladeHealCd: number;
  whirlwindTimer: number;
  fortifyTimer: number;
  frontShieldTimer: number;
  bloodlustTimer: number;
  chargeTimer: number;
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
  isTeamworkPractice?: boolean;
  roomKind: RoomKind;
  roomDepth: number;
  roomWave: number;
  roomTotalWaves: number;
  floorNumber: number;
  loopLevel: number;
  currentRoomKey: string;
  floorMapRev: number;
  floorMap?: FloorMapHudSnapshot | null;
  bossesDefeatedCount: number;
  chests: ChestDrop[];
  weaponDrops: WeaponDrop[];
  scrollDrops: SkillScrollDrop[];
  coinBursts: CoinBurstEvent[];
  skillZones: SkillZone[];
  gates: DungeonGate[];
  shopNpc: ShopNpc | null;
  shopItems: ShopItem[];
  finalVote: FinalVoteState | null;
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
  | { type: 'kicked'; reason?: string }
  | { type: 'ping'; ts: number }
  | { type: 'pong'; ts: number }
  | {
      type: 'lobby_state';
      roster: LobbyPlayerInfo[];
      difficulty: DifficultyKey;
      mode: GameMode;
      maxPlayers: number;
    }
  | { type: 'guest_config'; colorHex: string; heroClass: HeroClassId; ready: boolean; playerName?: string }
  | { type: 'loadout'; payload: LobbyLoadoutPayload }
  | { type: 'input'; input: TouchInputState }
  | { type: 'sync'; seq?: number; snap: SyncedRuntimeSnapshot; sfx: SfxSyncEvent[] }
  | { type: 'floor_sync'; rev: number; stage: StageKey; floorMap: FloorMapHudSnapshot }
  | { type: 'sfx'; events: SfxSyncEvent[] }
  | {
      type: 'screen';
      screen: AppScreen;
      boonDraft?: { clearedStage: StageKey; nextStage: StageKey; choices: BoonDef[] };
      transitionTarget?: StageKey | null;
      summary?: RunSummary | null;
      pausedBy?: PlayerId;
    }
  | { type: 'cmd'; action: 'skip_intro' | 'pause' | 'resume' | 'leave' | 'use_potion' | 'drop_weapon' | 'resync_me' | 'optimize_all' }
  | { type: 'cmd'; action: 'use_scroll' | 'drop_scroll'; scrollId: number }
  | { type: 'cmd'; action: 'buy_shop_item'; itemId: number }
  | { type: 'cmd'; action: 'switch_practice_weapon'; weaponId: WeaponId }
  | { type: 'cmd'; action: 'trigger_practice_attack'; kind?: BossChannelKind }
  | { type: 'cmd'; action: 'switch_practice_boss'; stage: 'mechaBoss' | 'voidBoss' | 'oniBoss' | 'eclipseBoss'; variantId?: BossVariantId }
  | { type: 'optimize_progress'; active: boolean; step: string; progress: number; initiatorId?: PlayerId }
  | { type: 'cast_vote'; choice: 'end' | 'deeper' };

export function buildFloorMapSnapshot(rt: GameRuntime): FloorMapHudSnapshot | null {
  if (!rt.isOnlineCampaign) return null;
  return {
    floorNumber: rt.floorNumber,
    loopLevel: rt.loopLevel,
    currentRoomKey: rt.currentRoomKey,
    gridSize: 6,
    nodes: Object.values(rt.floorGrid).map((r) => ({
      key: r.key,
      gx: r.gx,
      gy: r.gy,
      kind: r.kind,
      visited: r.visited,
      cleared: r.cleared,
      revealed: r.revealed,
      connections: { ...r.connections },
    })),
  };
}

function r0(n: number): number {
  return Math.round(n);
}

function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function serializeRuntimeForSync(
  rt: GameRuntime,
  optimizeConnection = false,
  maxGuestPingMs = 0
): SyncedRuntimeSnapshot {
  const playerCombos: Record<number, { count: number; timer: number }> = {};
  for (const k of Object.keys(rt.playerCombos)) {
    const id = Number(k);
    const c = rt.playerCombos[id];
    if (c && (c.count > 0 || c.timer > 0)) {
      playerCombos[id] = { count: c.count, timer: r1(c.timer) };
    }
  }

  const b = rt.boss;
  const heavyBossLoad = optimizeConnection || rt.bossProjectiles.length >= 12 || maxGuestPingMs > 110;
  const inShopRoom = rt.roomKind === 'shop';

  return {
    difficulty: rt.difficulty,
    mode: rt.mode,
    numPlayers: rt.numPlayers,
    isOnlineCampaign: rt.isOnlineCampaign,
    isTeamworkPractice: Boolean(rt.isTeamworkPractice),
    roomKind: rt.roomKind,
    roomDepth: rt.roomDepth,
    roomWave: rt.roomWave,
    roomTotalWaves: rt.roomTotalWaves,
    floorNumber: rt.floorNumber,
    loopLevel: rt.loopLevel,
    currentRoomKey: rt.currentRoomKey,
    floorMapRev: rt.floorMapRev,
    bossesDefeatedCount: rt.bossesDefeatedCount,
    chests: rt.chests.map((c) => ({
      ...c,
      x: r0(c.x),
      y: r0(c.y),
      openAnim: r2(c.openAnim),
    })),
    weaponDrops: rt.weaponDrops.map((w) => ({
      ...w,
      x: r0(w.x),
      y: r0(w.y),
      bob: r2(w.bob),
      swapLockTimer: r2(w.swapLockTimer),
    })),
    scrollDrops: rt.scrollDrops.map((sd) => ({
      ...sd,
      x: r0(sd.x),
      y: r0(sd.y),
      bob: r2(sd.bob),
      lockTimer: r2(sd.lockTimer),
    })),
    coinBursts: rt.coinBursts.map((cb) => ({
      id: cb.id,
      x: r0(cb.x),
      y: r0(cb.y),
      amount: cb.amount,
      ttl: r2(cb.ttl),
    })),
    skillZones: rt.skillZones.map((sz) => ({
      ...sz,
      x: r0(sz.x),
      y: r0(sz.y),
      radius: r0(sz.radius),
      timer: r2(sz.timer),
      tickTimer: r2(sz.tickTimer),
    })),
    gates: rt.gates.map((g) => ({
      ...g,
      x: r0(g.x),
      y: r0(g.y),
      width: r0(g.width),
      height: r0(g.height),
      playersInside: [...g.playersInside],
      holdProgress: r2(g.holdProgress),
    })),
    shopNpc: inShopRoom && rt.shopNpc ? { ...rt.shopNpc } : null,
    shopItems: inShopRoom ? rt.shopItems.map((s) => ({ ...s, purchasedBy: [...s.purchasedBy] })) : [],
    finalVote: rt.finalVote
      ? {
          active: rt.finalVote.active,
          timer: r1(rt.finalVote.timer),
          votes: { ...rt.finalVote.votes },
          loopLevel: rt.finalVote.loopLevel,
        }
      : null,
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
      name: p.name || `P${p.id}`,
      isBot: Boolean(p.isBot),
      heroClass: p.heroClass,
      weapon: p.weapon,
      scrollBag: p.scrollBag.map((s) => ({ ...s })),
      potions: p.potions,
      potionCooldownTimer: r1(p.potionCooldownTimer),
      coins: p.coins,
      x: r1(p.x),
      y: r1(p.y),
      vx: r1(p.vx),
      vy: r1(p.vy),
      facingAngle: r2(p.facingAngle),
      size: p.size,
      speed: r2(p.speed),
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
      dashTrail: heavyBossLoad
        ? []
        : p.dashTrail.slice(-3).map((t) => ({
            x: r0(t.x),
            y: r0(t.y),
            alpha: r2(t.alpha),
            color: t.color,
            angle: r2(t.angle),
          })),
      dashTimeLeft: r2(p.dashTimeLeft),
      dashCooldownTimer: r1(p.dashCooldownTimer),
      postDashInvulnerability: r2(p.postDashInvulnerability),
      hp: Math.round(p.hp),
      maxHp: p.maxHp,
      bonusMaxHp: p.bonusMaxHp,
      dash2Ready: p.dash2Ready,
      dash2CooldownTimer: r1(p.dash2CooldownTimer),
      dash2Active: p.dash2Active,
      usingDash2: p.usingDash2,
      invulnFrames: r2(p.invulnFrames),
      unlockedSkillTier: p.unlockedSkillTier,
      learnedSkills: Object.fromEntries(
        Object.entries(p.learnedSkills || {}).map(([k, v]) => [k, Array.isArray(v) ? [...v] : [1]])
      ),
      skillCooldowns: [
        r1(p.skillCooldowns[0] || 0),
        r1(p.skillCooldowns[1] || 0),
        r1(p.skillCooldowns[2] || 0),
        r1(p.skillCooldowns[3] || 0),
      ],
      skillMaxCooldowns: [
        p.skillMaxCooldowns[0] || 12,
        p.skillMaxCooldowns[1] || 15,
        p.skillMaxCooldowns[2] || 18,
        p.skillMaxCooldowns[3] || 22,
      ],
      abilityReady: p.abilityReady,
      abilityCooldown: p.abilityCooldown,
      abilityCooldownTimer: r1(p.abilityCooldownTimer),
      cloakTimer: r2(p.cloakTimer),
      empoweredStrike: p.empoweredStrike,
      shieldRegenTimer: r1(p.shieldRegenTimer),
      bladeHealCd: r1(p.bladeHealCd),
      whirlwindTimer: r2(p.whirlwindTimer),
      fortifyTimer: r2(p.fortifyTimer),
      frontShieldTimer: r2(p.frontShieldTimer),
      bloodlustTimer: r2(p.bloodlustTimer),
      chargeTimer: r2(p.chargeTimer),
      sealed: p.sealed,
      sealTimer: r1(p.sealTimer),
      hasShield: p.hasShield,
      overdriveTimer: r1(p.overdriveTimer),
      magnetTimer: r1(p.magnetTimer),
      dashDirX: r2(p.dashDirX),
      dashDirY: r2(p.dashDirY),
      animTime: r2(p.animTime),
    })),
    playerProjectiles: (heavyBossLoad ? rt.playerProjectiles.slice(-18) : rt.playerProjectiles).map((pp) => ({
      ...pp,
      x: r1(pp.x),
      y: r1(pp.y),
      dx: r2(pp.dx),
      dy: r2(pp.dy),
      angle: r2(pp.angle),
      lifetime: r2(pp.lifetime),
    })),
    voidDecoys: rt.voidDecoys.map((v) => ({
      ...v,
      x: r0(v.x),
      y: r0(v.y),
      timer: r2(v.timer),
    })),
    telegraphLines: rt.telegraphLines.map((t) => ({
      ...t,
      x1: r0(t.x1),
      y1: r0(t.y1),
      x2: r0(t.x2),
      y2: r0(t.y2),
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
      dx: r2(e.dx),
      dy: r2(e.dy),
      speed: r2(e.speed),
      rotation: r2(e.rotation),
      hp: e.hp !== undefined ? r0(e.hp) : undefined,
      hitFlashTimer: e.hitFlashTimer ? r2(e.hitFlashTimer) : 0,
    })),
    boss: {
      ...b,
      x: r1(b.x),
      y: r1(b.y),
      health: r0(b.health),
      targetX: r1(b.targetX),
      targetY: r1(b.targetY),
      animationTimer: r2(b.animationTimer),
      rotationAngle: r2(b.rotationAngle),
      flashIntensity: r2(b.flashIntensity),
      stateTimer: r2(b.stateTimer),
      attackTimer: r2(b.attackTimer),
      pulseSize: r1(b.pulseSize),
      shakeIntensity: r1(b.shakeIntensity),
      posture: r1(b.posture),
      channelTimer: b.channelTimer ? r2(b.channelTimer) : 0,
      channelAngle: b.channelAngle !== undefined ? r2(b.channelAngle) : undefined,
      channelSafeX: b.channelSafeX !== undefined ? r0(b.channelSafeX) : undefined,
      channelSafeY: b.channelSafeY !== undefined ? r0(b.channelSafeY) : undefined,
      channelTetherPair: b.channelTetherPair ? ([...b.channelTetherPair] as [PlayerId, PlayerId]) : undefined,
      channelNodes: b.channelNodes ? b.channelNodes.map((n) => ({ ...n, x: r0(n.x), y: r0(n.y) })) : undefined,
    },
    bossProjectiles: rt.bossProjectiles.map((bp) => ({
      ...bp,
      x: r0(bp.x),
      y: r0(bp.y),
      dx: r2(bp.dx),
      dy: r2(bp.dy),
      speed: r2(bp.speed),
    })),
    voidTentacles: rt.isBossLevel
      ? rt.voidTentacles.map((vt) => ({
          ...vt,
          waveOffset: r2(vt.waveOffset),
          extendFactor: r2(vt.extendFactor),
        }))
      : [],
    oniShrines: rt.isBossLevel ? rt.oniShrines.map((s) => ({ ...s })) : [],
    oniCursedZones: rt.oniCursedZones.map((z) => ({
      ...z,
      x: r0(z.x),
      y: r0(z.y),
      radius: r0(z.radius),
      alpha: r2(z.alpha),
    })),
    oniSpiritBombs: rt.isBossLevel
      ? rt.oniSpiritBombs.map((bm) => ({
          ...bm,
          x: r0(bm.x),
          y: r0(bm.y),
        }))
      : [],
    eclipseBeacons: [],
    eclipsePylons: rt.isBossLevel ? rt.eclipsePylons.map((p) => ({ ...p })) : [],
    eclipsePrison: rt.isBossLevel && rt.eclipsePrison ? { ...rt.eclipsePrison } : null,
    eclipseMirrors: rt.isBossLevel
      ? rt.eclipseMirrors.map((m) => ({
          ...m,
          x: r0(m.x),
          y: r0(m.y),
          charge: r2(m.charge),
        }))
      : [],
    eclipseMarkedBy: rt.eclipseMarkedBy,
    eclipseMarkTimer: r1(rt.eclipseMarkTimer),
    eclipseCounterFlashTimer: r2(rt.eclipseCounterFlashTimer),
    eclipseSyncTimer: r2(rt.eclipseSyncTimer),
    eclipseTetherTimer: r1(rt.eclipseTetherTimer),
    eclipseSanctuaryActive: rt.eclipseSanctuaryActive,
    medkits: rt.medkits.map((m) => ({ ...m, x: r0(m.x), y: r0(m.y), bob: r2(m.bob) })),
    relics: rt.relics.map((r) => ({ ...r, x: r0(r.x), y: r0(r.y), bob: r2(r.bob) })),
    dustParticles: heavyBossLoad
      ? []
      : rt.dustParticles.slice(-2).map((d) => ({
          ...d,
          x: r0(d.x),
          y: r0(d.y),
          alpha: r2(d.alpha),
        })),
    deathEffects: heavyBossLoad
      ? []
      : rt.deathEffects.slice(-5).map((de) => ({
          ...de,
          x: r0(de.x),
          y: r0(de.y),
          radius: de.radius !== undefined ? r0(de.radius) : undefined,
          alpha: r2(de.alpha),
        })),
    slashArcs: heavyBossLoad
      ? []
      : rt.slashArcs.slice(-4).map((sa) => ({
          ...sa,
          x: r0(sa.x),
          y: r0(sa.y),
          alpha: r2(sa.alpha),
        })),
    floatingTexts: rt.floatingTexts.slice(heavyBossLoad ? -2 : -5).map((ft) => ({
      ...ft,
      x: r0(ft.x),
      y: r0(ft.y),
      alpha: r2(ft.alpha),
    })),
    comicSlashes: heavyBossLoad
      ? []
      : rt.comicSlashes.slice(-3).map((cs) => ({
          ...cs,
          alpha: r2(cs.alpha),
        })),
    voidRifts: heavyBossLoad
      ? []
      : rt.voidRifts.slice(-3).map((vr) => ({
          ...vr,
          size: r0(vr.size),
          alpha: r2(vr.alpha),
          rotation: r2(vr.rotation),
        })),
    energyWaves: rt.energyWaves.slice(heavyBossLoad ? -2 : -4).map((ew) => ({
      ...ew,
      radius: r0(ew.radius),
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
  const learnedCopy: Partial<Record<WeaponClassId, number[]>> = {};
  if (sp.learnedSkills) {
    for (const [k, v] of Object.entries(sp.learnedSkills)) {
      if (Array.isArray(v)) learnedCopy[k as WeaponClassId] = [...v];
    }
  }
  const base: Player = {
    ...sp,
    name: sp.name || `P${sp.id}`,
    isBot: Boolean(sp.isBot),
    scrollBag: Array.isArray(sp.scrollBag) ? sp.scrollBag.map((s) => ({ ...s })) : [],
    potions: sp.potions ?? 0,
    potionCooldownTimer: sp.potionCooldownTimer ?? 0,
    frontShieldTimer: sp.frontShieldTimer ?? 0,
    swapCooldownTimer: 0,
    learnedSkills: learnedCopy,
    grazedIds: prev ? prev.grazedIds : new Set<number>(),
    _lastDashPressed: false,
    _lastAbilityPressed: false,
    _lastSkill2Pressed: false,
    _lastSkill3Pressed: false,
    _lastSkill4Pressed: false,
    _lastPotionPressed: false,
    cleanDodgeFailed: false,
  };
  return base;
}

function hydrateFloorGrid(floorMap: FloorMapHudSnapshot | null | undefined, stage: StageKey): Record<string, PersistedRoomState> {
  const grid: Record<string, PersistedRoomState> = {};
  if (!floorMap) return grid;
  for (const n of floorMap.nodes) {
    const labelMap: Record<RoomKind, string> = {
      start: 'ENTRY HALL',
      combat: 'COMBAT CHAMBER',
      shop: 'MERCHANT SHOP',
      treasure: 'TREASURE VAULT',
      boss: 'BOSS SANCTUM',
    };
    grid[n.key] = {
      key: n.key,
      gx: n.gx,
      gy: n.gy,
      kind: n.kind,
      stage,
      label: labelMap[n.kind] || 'CHAMBER',
      connections: { ...n.connections },
      visited: n.visited,
      cleared: n.cleared,
      revealed: n.revealed,
      enemies: [],
      chests: [],
      weaponDrops: [],
      scrollDrops: [],
      shopItems: [],
      medkits: [],
      relics: [],
    };
  }
  return grid;
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

export interface GuestFloorMapCache {
  rev: number;
  stage: StageKey;
  floorMap: FloorMapHudSnapshot;
}

function stepLocalPredictedMovement(
  p: Player,
  rt: GameRuntime,
  dt: number,
  input?: TouchInputState
) {
  if (!input || p.state !== 'alive' || p.sealed || rt.introPlaying) return;

  let dirX = input.x;
  let dirY = input.y;
  const mag = Math.hypot(dirX, dirY);
  if (mag > 1) {
    dirX /= mag;
    dirY /= mag;
  }
  if (Math.abs(dirX) > 0.04 || Math.abs(dirY) > 0.04) {
    p.facingAngle = Math.atan2(dirY, dirX);
    p.dashDirX = dirX;
    p.dashDirY = dirY;
  }

  // Instant local dash prediction so non-host players feel crisp zero-delay dashes
  const dashPressed = Boolean(input.dash);
  if (dashPressed && !p._lastDashPressed && p.dashTimeLeft <= 0 && p.chargeTimer <= 0) {
    if (p.dashReady || (p.dash2Active && p.dash2Ready)) {
      const usingSecond = !p.dashReady;
      if (usingSecond) {
        p.dash2Ready = false;
      } else {
        p.dashReady = false;
      }
      p.usingDash2 = usingSecond;
      p.dashImmune = true;
      p.dashTimeLeft = p.dashTime || 0.16;
    }
  }
  p._lastDashPressed = dashPressed;

  if (p.chargeTimer > 0) {
    const cs = 16.5 * (dt * 60);
    p.vx = p.dashDirX * cs;
    p.vy = p.dashDirY * cs;
    p.x += p.vx;
    p.y += p.vy;
    clampPlayerToArenaAndHallways(p, rt.arenaWidth, rt.arenaHeight, rt.gates);
    return;
  }

  if (p.dashTimeLeft > 0) {
    const ds = 18.0 * (p.overdriveTimer > 0 ? 1.15 : 1.0);
    const moveX = Math.abs(dirX) > 0.04 || Math.abs(dirY) > 0.04 ? dirX : p.dashDirX;
    const moveY = Math.abs(dirX) > 0.04 || Math.abs(dirY) > 0.04 ? dirY : p.dashDirY;
    p.x += moveX * ds * (dt * 60);
    p.y += moveY * ds * (dt * 60);
    p.vx = moveX * ds;
    p.vy = moveY * ds;
    if (p.dashTrail.length < 8) {
      p.dashTrail.push({ x: p.x, y: p.y, alpha: 0.85, color: p.color, angle: p.facingAngle });
    }
    p.dashTimeLeft = Math.max(0, p.dashTimeLeft - dt);
    if (p.dashTimeLeft <= 0) {
      p.dashImmune = false;
      p.usingDash2 = false;
    }
    clampPlayerToArenaAndHallways(p, rt.arenaWidth, rt.arenaHeight, rt.gates);
    return;
  }

  const speedMult =
    (p.overdriveTimer > 0 ? 1.32 : 1.0) *
    (p.cloakTimer > 0 ? 1.26 : 1.0) *
    (p.bloodlustTimer > 0 ? 1.3 : 1.0) *
    (p.fortifyTimer > 0 ? 0.88 : 1.0);

  const stepScale = dt * 60;
  const vx = dirX * p.speed * speedMult * stepScale;
  const vy = dirY * p.speed * speedMult * stepScale;
  p.vx = vx;
  p.vy = vy;
  p.x += vx;
  p.y += vy;
  clampPlayerToArenaAndHallways(p, rt.arenaWidth, rt.arenaHeight, rt.gates);
  if (Math.abs(dirX) > 0.04 || Math.abs(dirY) > 0.04) {
    p.animTime += dt * 1.4;
  }
}

export function advanceGuestDisplayRuntime(
  rt: GameRuntime,
  dt: number,
  localPlayerId?: PlayerId,
  localInput?: TouchInputState
) {
  const clampedDt = Math.max(0.002, Math.min(dt, 0.05));
  const frameMult = clampedDt * 60;

  rt.players.forEach((p) => {
    if (p.state !== 'alive') return;
    if (localPlayerId !== undefined && p.id === localPlayerId) {
      stepLocalPredictedMovement(p, rt, clampedDt, localInput);
    } else if (!rt.introPlaying) {
      p.x += p.vx * frameMult * 0.78;
      p.y += p.vy * frameMult * 0.78;
      p.vx *= Math.pow(0.9, frameMult);
      p.vy *= Math.pow(0.9, frameMult);
      clampPlayerToArenaAndHallways(p, rt.arenaWidth, rt.arenaHeight, rt.gates);
      p.animTime += clampedDt;
    }
    for (let ti = p.dashTrail.length - 1; ti >= 0; ti--) {
      p.dashTrail[ti].alpha -= clampedDt * 4.2;
      if (p.dashTrail[ti].alpha <= 0) p.dashTrail.splice(ti, 1);
    }
  });

  if (!rt.introPlaying) {
    if (
      rt.isBossLevel &&
      rt.boss.health > 0 &&
      rt.boss.state !== 'comic_intro' &&
      rt.boss.state !== 'dead' &&
      rt.boss.state !== 'phase_transition'
    ) {
      const b = rt.boss;
      const dxB = b.targetX - b.x;
      const dyB = b.targetY - b.y;
      const dB = Math.hypot(dxB, dyB);
      if (dB > 2 && dB < 260) {
        const moveStep = Math.min(dB, 3.2 * frameMult);
        b.x += (dxB / dB) * moveStep;
        b.y += (dyB / dB) * moveStep;
      }
      b.animationTimer += clampedDt;
      b.rotationAngle += clampedDt * (b.phase === 2 ? 3.2 : 1.8);
    }

    rt.enemies.forEach((e) => {
      if ((e.stunTimer && e.stunTimer > 0) || e.chargeState === 'telegraph') return;
      e.x = Math.max(12, Math.min(rt.arenaWidth - e.size - 12, e.x + e.dx * e.speed * frameMult * 0.88));
      e.y = Math.max(12, Math.min(rt.arenaHeight - e.size - 12, e.y + e.dy * e.speed * frameMult * 0.88));
    });

    rt.bossProjectiles.forEach((bp) => {
      if (bp.type === 'mine' || bp.type === 'phantom_clone') return;
      bp.x += bp.dx * bp.speed * frameMult;
      bp.y += bp.dy * bp.speed * frameMult;
    });

    rt.playerProjectiles.forEach((pp) => {
      pp.x += pp.dx * frameMult;
      pp.y += pp.dy * frameMult;
    });
  }

  rt.energyWaves.forEach((ew) => {
    ew.radius = Math.min(ew.maxRadius, ew.radius + ew.speed * clampedDt);
    ew.alpha = Math.max(0, ew.alpha - clampedDt * 1.4);
  });

  rt.floatingTexts.forEach((ft) => {
    ft.y -= 26 * clampedDt;
    ft.alpha = Math.max(0, ft.alpha - clampedDt * 0.9);
  });

  rt.deathEffects.forEach((de) => {
    de.alpha = Math.max(0, de.alpha - clampedDt * 1.4);
  });

  rt.slashArcs.forEach((sa) => {
    sa.alpha = Math.max(0, sa.alpha - clampedDt * 2.2);
  });

  rt.ambientMotes.forEach((m) => {
    m.x += m.vx * clampedDt;
    m.y += m.vy * clampedDt;
    m.phase += clampedDt * 2;
    if (m.y < -10) {
      m.y = rt.arenaHeight + 10;
      m.x = Math.random() * rt.arenaWidth;
    }
  });
}

export function applySyncedSnapshotToGuest(
  displayRt: GameRuntime | null,
  snap: SyncedRuntimeSnapshot,
  dt: number,
  guestFloorCache?: GuestFloorMapCache | null,
  localPingMs?: number | null,
  localPlayerId?: PlayerId,
  localInput?: TouchInputState
): GameRuntime {
  const clampedDt = Math.max(0.004, Math.min(dt, 0.05));
  const lerpAlpha = 0.62;
  const leadSec = Math.min(0.035, Math.max(0, (localPingMs || 0) / 2500)) * 60;

  if (
    !displayRt ||
    displayRt.stage !== snap.stage ||
    displayRt.roomDepth !== snap.roomDepth ||
    displayRt.currentRoomKey !== snap.currentRoomKey ||
    displayRt.loopLevel !== snap.loopLevel
  ) {
    const players: Player[] = snap.players.map((sp) => hydratePlayer(sp));
    const useCache = guestFloorCache && guestFloorCache.stage === snap.stage;
    const initialFloorGrid = snap.floorMap
      ? hydrateFloorGrid(snap.floorMap, snap.stage)
      : useCache
      ? hydrateFloorGrid(guestFloorCache.floorMap, snap.stage)
      : displayRt?.floorGrid || {};
    const initialFloorRev = snap.floorMap
      ? snap.floorMapRev
      : useCache
      ? guestFloorCache.rev
      : 0;
    return {
      difficulty: snap.difficulty,
      diffSettings: DIFFICULTY_SETTINGS[snap.difficulty],
      mode: snap.mode,
      numPlayers: snap.numPlayers,
      isOnlineCampaign: snap.isOnlineCampaign,
      isTeamworkPractice: Boolean(snap.isTeamworkPractice),
      roomKind: snap.roomKind,
      roomDepth: snap.roomDepth,
      roomWave: snap.roomWave || 1,
      roomTotalWaves: snap.roomTotalWaves || 1,
      floorNumber: snap.floorNumber,
      loopLevel: snap.loopLevel,
      currentRoomKey: snap.currentRoomKey,
      floorMapRev: initialFloorRev,
      floorGrid: initialFloorGrid,
      bossesDefeatedCount: snap.bossesDefeatedCount,
      chests: snap.chests.map((c) => ({ ...c })),
      weaponDrops: snap.weaponDrops.map((w) => ({ ...w })),
      scrollDrops: snap.scrollDrops.map((sd) => ({ ...sd })),
      coinBursts: (snap.coinBursts || []).map((b) => ({ ...b })),
      skillZones: snap.skillZones.map((sz) => ({ ...sz })),
      gates: snap.gates.map((g) => ({ ...g, playersInside: [...g.playersInside] })),
      shopNpc: snap.shopNpc ? { ...snap.shopNpc } : null,
      shopItems: snap.shopItems.map((s) => ({ ...s, purchasedBy: [...s.purchasedBy] })),
      lastKilledPos: null,
      finalVote: snap.finalVote ? { ...snap.finalVote, votes: { ...snap.finalVote.votes } } : null,
      finalVoteResolveDelay: 0,
      pingByPlayer: { ...snap.pingByPlayer },
      playerColors: { ...snap.playerColors },
      playerClasses: { ...snap.playerClasses },
      playerNames: Object.fromEntries(players.map((p) => [p.id, p.name])),
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
      tutorialWeapon: 'none',
      tutorialSkillUses: 0,
      tutorialGrazesStart: 0,
      tutorialFireTimer: 0,
      tutorialCounterDone: false,
      practiceAttackTimer: 4,
      practiceWeapon: 'tank_shield',
      bossProjBurstCooldowns: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
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
  displayRt.isTeamworkPractice = Boolean(snap.isTeamworkPractice);
  displayRt.roomKind = snap.roomKind;
  displayRt.roomDepth = snap.roomDepth;
  displayRt.roomWave = snap.roomWave || 1;
  displayRt.roomTotalWaves = snap.roomTotalWaves || 1;
  displayRt.floorNumber = snap.floorNumber;
  displayRt.loopLevel = snap.loopLevel;
  displayRt.currentRoomKey = snap.currentRoomKey;
  if (snap.floorMap && displayRt.floorMapRev !== snap.floorMapRev) {
    displayRt.floorGrid = hydrateFloorGrid(snap.floorMap, snap.stage);
    displayRt.floorMapRev = snap.floorMapRev;
  } else if (guestFloorCache && guestFloorCache.stage === snap.stage && displayRt.floorMapRev !== guestFloorCache.rev) {
    displayRt.floorGrid = hydrateFloorGrid(guestFloorCache.floorMap, snap.stage);
    displayRt.floorMapRev = guestFloorCache.rev;
  }
  displayRt.bossesDefeatedCount = snap.bossesDefeatedCount;
  displayRt.chests = snap.chests.map((c) => ({ ...c }));
  displayRt.weaponDrops = snap.weaponDrops.map((w) => ({ ...w }));
  displayRt.scrollDrops = snap.scrollDrops.map((sd) => ({ ...sd })),
  displayRt.coinBursts = (snap.coinBursts || []).map((b) => ({ ...b }));
  displayRt.skillZones = snap.skillZones.map((sz) => ({ ...sz }));
  displayRt.gates = snap.gates.map((g) => ({ ...g, playersInside: [...g.playersInside] }));
  displayRt.shopNpc = snap.shopNpc ? { ...snap.shopNpc } : null;
  displayRt.shopItems = snap.shopItems.map((s) => ({ ...s, purchasedBy: [...s.purchasedBy] }));
  displayRt.finalVote = snap.finalVote ? { ...snap.finalVote, votes: { ...snap.finalVote.votes } } : null;
  displayRt.pingByPlayer = { ...snap.pingByPlayer };
  displayRt.playerColors = { ...snap.playerColors };
  displayRt.playerClasses = { ...snap.playerClasses };
  displayRt.waveNumber = snap.waveNumber;
  displayRt.bossType = snap.bossType;
  displayRt.isBossLevel = snap.isBossLevel;
  displayRt.arenaWidth = snap.arenaWidth;
  displayRt.arenaHeight = snap.arenaHeight;

  displayRt.camera.x = lerpNum(displayRt.camera.x, snap.camera.x, lerpAlpha, 140);
  displayRt.camera.y = lerpNum(displayRt.camera.y, snap.camera.y, lerpAlpha, 140);
  displayRt.camera.zoom = lerpNum(displayRt.camera.zoom, snap.camera.zoom, lerpAlpha, 0.4);

  displayRt.bossVoiceLine = snap.bossVoiceLine;
  displayRt.bossVoiceTimer = snap.bossVoiceTimer;

  displayRt.players = snap.players.map((sp, idx) => {
    const prev = displayRt.players[idx];
    const next = hydratePlayer(sp, prev);
    const isLocalGuest = localPlayerId !== undefined && sp.id === localPlayerId;
    if (prev && prev.state === next.state) {
      next._lastDashPressed = prev._lastDashPressed;
      if (isLocalGuest && next.state === 'alive' && !next.sealed && !snap.introPlaying) {
        // Keep active local predicted dash smooth until host snapshot catches up
        const localDashInFlight = prev.dashTimeLeft > 0 && sp.dashTimeLeft <= 0 && !sp.dashReady;
        if (localDashInFlight) {
          next.dashTimeLeft = prev.dashTimeLeft;
          next.dashImmune = true;
          next.dashTrail = prev.dashTrail.map((t) => ({ ...t }));
          next.x = prev.x;
          next.y = prev.y;
          next.facingAngle = prev.facingAngle;
          next.dashDirX = prev.dashDirX;
          next.dashDirY = prev.dashDirY;
        } else if (sp.dashTimeLeft <= 0 && !sp.usingDash2 && sp.chargeTimer <= 0) {
          // Latency-compensated host position so moving guests aren't pulled backward by half-RTT lag
          const oneWayFrames = Math.min(0.11, Math.max(0, (localPingMs || 50) / 2000)) * 60;
          const compHostX = sp.x + sp.vx * oneWayFrames;
          const compHostY = sp.y + sp.vy * oneWayFrames;
          const err = Math.hypot(compHostX - prev.x, compHostY - prev.y);
          if (err > 180) {
            next.x = compHostX;
            next.y = compHostY;
          } else if (err > 38) {
            const pull = err > 96 ? 0.28 : 0.12;
            next.x = prev.x + (compHostX - prev.x) * pull;
            next.y = prev.y + (compHostY - prev.y) * pull;
          } else {
            next.x = prev.x;
            next.y = prev.y;
          }
        } else {
          // Host dashing/charging: blend toward host smoothly
          next.x = lerpNum(prev.x, sp.x, 0.72, 160);
          next.y = lerpNum(prev.y, sp.y, 0.72, 160);
        }
        stepLocalPredictedMovement(next, displayRt, clampedDt, localInput);
      } else {
        const leadMult = next.state === 'alive' && !snap.introPlaying ? leadSec : 0;
        const targetX = sp.x + sp.vx * leadMult;
        const targetY = sp.y + sp.vy * leadMult;
        next.x = lerpNum(prev.x, targetX, lerpAlpha, 120);
        next.y = lerpNum(prev.y, targetY, lerpAlpha, 120);
      }
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
    channelTetherPair: snap.boss.channelTetherPair ? [...snap.boss.channelTetherPair] as [PlayerId, PlayerId] : undefined,
    channelNodes: snap.boss.channelNodes ? snap.boss.channelNodes.map((n) => ({ ...n })) : undefined,
    x: lerpNum(prevBoss.x, snap.boss.x, lerpAlpha, 140),
    y: lerpNum(prevBoss.y, snap.boss.y, lerpAlpha, 140),
  };

  displayRt.bossProjectiles = snap.bossProjectiles.map((bp) => {
    const prev = prevBossProjsByUid.get(bp.uid);
    const moveLead = bp.type !== 'mine' && bp.type !== 'phantom_clone' ? leadSec : 0;
    const targetX = bp.x + bp.dx * bp.speed * moveLead;
    const targetY = bp.y + bp.dy * bp.speed * moveLead;
    if (!prev) return { ...bp, x: targetX, y: targetY };
    return {
      ...bp,
      x: lerpNum(prev.x, targetX, 0.65, 105),
      y: lerpNum(prev.y, targetY, 0.65, 105),
    };
  });

  displayRt.playerProjectiles = snap.playerProjectiles.map((pp) => {
    const prev = prevPlayerProjsByUid.get(pp.uid);
    const targetX = pp.x + pp.dx * leadSec;
    const targetY = pp.y + pp.dy * leadSec;
    if (!prev) return { ...pp, x: targetX, y: targetY };
    return {
      ...pp,
      x: lerpNum(prev.x, targetX, 0.65, 105),
      y: lerpNum(prev.y, targetY, 0.65, 105),
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
  onKicked?: (reason: string) => void;
}

interface GuestSlot {
  conn: DataConnection;
  streamConn: DataConnection | null;
  clientUid?: string;
  roomToken?: string;
  playerName?: string;
  pingMs: number | null;
  lastHeardAt: number;
}

function getBufferedAmount(conn: DataConnection | null | undefined): number {
  if (!conn) return 0;
  const dc = (conn as unknown as { dataChannel?: { bufferedAmount?: number } }).dataChannel;
  return typeof dc?.bufferedAmount === 'number' ? dc.bufferedAmount : 0;
}

function getOrCreateClientUid(): string {
  const key = 'dungeon_bouncer_client_uid_v1';
  try {
    const existing = sessionStorage.getItem(key);
    if (existing && existing.length >= 6) return existing;
    const next = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    sessionStorage.setItem(key, next);
    return next;
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

function getOrCreateRoomToken(roomCode: string): string {
  const key = `dungeon_bouncer_room_token_v1_${sanitizeRoomCode(roomCode)}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as { token?: string; ts?: number };
      if (parsed?.token && parsed.ts && Date.now() - parsed.ts < 12 * 60 * 60 * 1000) {
        return parsed.token;
      }
    }
    const next = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    localStorage.setItem(key, JSON.stringify({ token: next, ts: Date.now() }));
    return next;
  } catch {
    return getOrCreateClientUid();
  }
}

export class OnlineSession {
  private peer: Peer | null = null;
  private hostConn: DataConnection | null = null;
  private hostStreamConn: DataConnection | null = null;
  private guests = new Map<PlayerId, GuestSlot>();
  private slotByClientUid = new Map<string, PlayerId>();
  private slotByRoomToken = new Map<string, PlayerId>();
  private slotNameBySlotId = new Map<PlayerId, string>();
  private pendingStreams = new Map<string, DataConnection>();
  private guestClientUid = getOrCreateClientUid();
  private guestRoomToken: string;
  private guestPlayerName: string;
  private role: 'host' | 'guest';
  private roomCode: string;
  private maxPlayers: number;
  private callbacks: OnlineSessionCallbacks;
  private destroyed = false;
  private connectTimer: number | null = null;
  private pingTimer: number | null = null;
  private hostWasConnected = false;
  private hostLastHeardAt = performance.now();
  private lowBandwidth = false;
  private syncSeq = 0;
  private lastReceivedSyncSeq = 0;
  private lastStreamHealAt = 0;
  private lastCtrlSyncFallbackAt = 0;

  constructor(
    role: 'host' | 'guest',
    roomCode: string,
    callbacks: OnlineSessionCallbacks,
    maxPlayers = 5,
    playerName = ''
  ) {
    this.role = role;
    this.roomCode = sanitizeRoomCode(roomCode);
    this.guestRoomToken = getOrCreateRoomToken(this.roomCode);
    this.guestPlayerName = playerName.trim().slice(0, 14);
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
            slot.streamConn?.close();
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

  setLowBandwidth(enabled: boolean) {
    this.lowBandwidth = enabled;
  }

  isLowBandwidth(): boolean {
    return this.lowBandwidth;
  }

  kickGuest(playerId: PlayerId, reason = 'You were removed by the Host.'): boolean {
    if (this.role !== 'host' || playerId === 1) return false;
    const slot = this.guests.get(playerId);
    // Forget sticky reconnect bindings for kicked player so slot opens cleanly
    for (const [uid, sid] of this.slotByClientUid.entries()) {
      if (sid === playerId) this.slotByClientUid.delete(uid);
    }
    for (const [tok, sid] of this.slotByRoomToken.entries()) {
      if (sid === playerId) this.slotByRoomToken.delete(tok);
    }
    this.slotNameBySlotId.delete(playerId);

    if (!slot) return false;
    try {
      if (slot.conn.open) {
        slot.conn.send({ type: 'kicked', reason } as OnlineMessage);
      }
    } catch {
      // ignore
    }
    this.guests.delete(playerId);
    window.setTimeout(() => {
      try {
        slot.streamConn?.close();
        slot.conn.close();
      } catch {
        // ignore
      }
    }, 80);
    if (this.guests.size === 0) {
      this.callbacks.onStatusChange('waiting');
    }
    this.callbacks.onPingUpdate?.(this.getPingByPlayer());
    return true;
  }

  burstPing() {
    if (this.destroyed || this.role !== 'host') return;
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
  }

  reopenStream() {
    if (this.destroyed) return;
    if (this.role === 'guest') {
      if (this.peer && !this.peer.destroyed && this.hostConn?.open) {
        try {
          this.hostStreamConn?.close();
        } catch {
          // ignore
        }
        this.hostStreamConn = null;
        const targetId = `${PEER_PREFIX}${this.roomCode}`;
        const streamConn = this.peer.connect(targetId, {
          label: 'stream',
          reliable: false,
          serialization: 'json',
          metadata: {
            channel: 'stream',
            clientUid: this.guestClientUid,
            roomToken: this.guestRoomToken,
            playerName: this.guestPlayerName,
          },
        });
        this.attachGuestToHostConnection(streamConn, true);
        this.send({ type: 'cmd', action: 'resync_me' });
      }
    } else {
      this.burstPing();
    }
  }

  send(msg: OnlineMessage, targetPlayerId?: PlayerId, reliable = false): boolean {
    if (this.destroyed) return false;
    const isStreamMsg = !reliable && (msg.type === 'sync' || msg.type === 'input');
    const syncLimit = this.lowBandwidth ? 5120 : 12288;
    const inputLimit = this.lowBandwidth ? 3072 : 6144;
    const now = performance.now();

    if (msg.type === 'sync') {
      msg.seq = ++this.syncSeq;
    }

    if (this.role === 'host') {
      const sendToSlot = (slot: GuestSlot): boolean => {
        if (!slot.conn.open) return false;
        const hasOpenStream = Boolean(slot.streamConn?.open);
        if (msg.type === 'sync' && !hasOpenStream) {
          // Never choke reliable ctrlConn when streamConn is closed/rebuilding; throttle tiny fallback only
          if (getBufferedAmount(slot.conn) > 256 || now - this.lastCtrlSyncFallbackAt < 180) {
            return false;
          }
          this.lastCtrlSyncFallbackAt = now;
        }
        const targetConn = isStreamMsg && hasOpenStream ? slot.streamConn! : slot.conn;
        if (msg.type === 'sync' && hasOpenStream && getBufferedAmount(targetConn) > syncLimit) {
          return false;
        }
        try {
          targetConn.send(msg);
          return true;
        } catch {
          return false;
        }
      };

      if (targetPlayerId !== undefined) {
        const slot = this.guests.get(targetPlayerId);
        return slot ? sendToSlot(slot) : false;
      }
      let sentAny = false;
      for (const slot of this.guests.values()) {
        if (sendToSlot(slot)) sentAny = true;
      }
      return sentAny;
    }

    const hasOpenStream = Boolean(this.hostStreamConn?.open);
    const targetConn = isStreamMsg && hasOpenStream ? this.hostStreamConn! : this.hostConn;
    if (!targetConn || !targetConn.open) return false;
    const cap = hasOpenStream ? inputLimit : 1024;
    if (!reliable && msg.type === 'input' && getBufferedAmount(targetConn) > cap) return false;
    try {
      targetConn.send(msg);
      return true;
    } catch {
      return false;
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

  private evictTimedOutGuest(slotId: PlayerId, slot: GuestSlot) {
    if (this.guests.get(slotId) !== slot) return;
    this.guests.delete(slotId);
    try {
      slot.streamConn?.close();
      slot.conn.close();
    } catch {
      // ignore
    }
    if (this.guests.size === 0) {
      this.callbacks.onStatusChange('waiting');
    }
    this.callbacks.onPingUpdate?.(this.getPingByPlayer());
    this.callbacks.onPartnerDisconnect(slotId);
  }

  private dialGuestStream() {
    if (this.destroyed || this.role !== 'guest' || !this.peer || this.peer.destroyed || !this.hostConn?.open) {
      return;
    }
    this.lastStreamHealAt = performance.now();
    try {
      this.hostStreamConn?.close();
    } catch {
      // ignore
    }
    this.hostStreamConn = null;
    const targetId = `${PEER_PREFIX}${this.roomCode}`;
    const streamConn = this.peer.connect(targetId, {
      label: 'stream',
      reliable: false,
      serialization: 'json',
      metadata: {
        channel: 'stream',
        clientUid: this.guestClientUid,
        roomToken: this.guestRoomToken,
        playerName: this.guestPlayerName,
      },
    });
    this.attachGuestToHostConnection(streamConn, true);
  }

  private ensurePingLoop() {
    if (this.pingTimer !== null) return;
    if (this.role === 'host') {
      this.pingTimer = window.setInterval(() => {
        if (this.destroyed) return;
        const now = performance.now();
        for (const [slotId, slot] of Array.from(this.guests.entries())) {
          if (now - slot.lastHeardAt > 12500) {
            this.evictTimedOutGuest(slotId, slot);
            continue;
          }
          if (slot.conn.open) {
            try {
              slot.conn.send({ type: 'ping', ts: now } as OnlineMessage);
            } catch {
              this.evictTimedOutGuest(slotId, slot);
            }
          }
        }
      }, 1000);
    } else {
      this.pingTimer = window.setInterval(() => {
        if (this.destroyed || !this.hostWasConnected) return;
        const now = performance.now();
        // Auto-recover dropped unreliable stream channel mid-boss fight without breaking session
        if (this.hostConn?.open && (!this.hostStreamConn || !this.hostStreamConn.open) && now - this.lastStreamHealAt > 2600) {
          this.dialGuestStream();
        }
        // Proactive guest keepalive ping when silent > 2.2s so Host knows guest is alive during bursts
        if (this.hostConn?.open && now - this.hostLastHeardAt > 2200) {
          try {
            this.hostConn.send({ type: 'ping', ts: now } as OnlineMessage);
          } catch {
            // ignore
          }
        }
        if (now - this.hostLastHeardAt > 14000) {
          this.clearTimers();
          this.hostWasConnected = false;
          try {
            this.hostStreamConn?.close();
            this.hostConn?.close();
          } catch {
            // ignore
          }
          this.hostConn = null;
          this.hostStreamConn = null;
          this.callbacks.onPartnerDisconnect(1);
        }
      }, 1000);
    }
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
        const ctrlConn = peer.connect(targetId, {
          label: 'ctrl',
          reliable: true,
          serialization: 'json',
          metadata: {
            channel: 'ctrl',
            clientUid: this.guestClientUid,
            roomToken: this.guestRoomToken,
            playerName: this.guestPlayerName,
          },
        });
        this.attachGuestToHostConnection(ctrlConn, false);

        const streamConn = peer.connect(targetId, {
          label: 'stream',
          reliable: false,
          serialization: 'json',
          metadata: {
            channel: 'stream',
            clientUid: this.guestClientUid,
            roomToken: this.guestRoomToken,
            playerName: this.guestPlayerName,
          },
        });
        this.attachGuestToHostConnection(streamConn, true);
      }
    });

    if (this.role === 'host') {
      peer.on('connection', (incomingConn) => {
        if (this.destroyed) {
          incomingConn.close();
          return;
        }
        const meta = (incomingConn.metadata || {}) as {
          channel?: 'ctrl' | 'stream';
          clientUid?: string;
          roomToken?: string;
          playerName?: string;
        };
        if (meta.channel === 'stream' && meta.clientUid) {
          let matchedSlot: GuestSlot | undefined;
          for (const slot of this.guests.values()) {
            if (slot.clientUid === meta.clientUid || (meta.roomToken && slot.roomToken === meta.roomToken)) {
              matchedSlot = slot;
              break;
            }
          }
          if (matchedSlot) {
            this.attachHostStreamConnection(incomingConn, matchedSlot, this.findSlotId(matchedSlot));
          } else {
            this.pendingStreams.set(meta.clientUid, incomingConn);
          }
          return;
        }

        let assignedSlot: PlayerId | null = null;
        // 1. Match active tab UID first
        if (meta.clientUid && this.slotByClientUid.has(meta.clientUid)) {
          const prevSlot = this.slotByClientUid.get(meta.clientUid)!;
          if (prevSlot <= this.maxPlayers) {
            assignedSlot = prevSlot;
          }
        }
        // 2. Match persistent room token (survives tab close/reopen on same browser)
        if (assignedSlot === null && meta.roomToken && this.slotByRoomToken.has(meta.roomToken)) {
          const tokSlot = this.slotByRoomToken.get(meta.roomToken)!;
          if (tokSlot <= this.maxPlayers) {
            const active = this.guests.get(tokSlot);
            // If same tab reloaded OR previous connection closed/stale (>3.5s) reuse exact slot
            if (!active || !active.conn.open || performance.now() - active.lastHeardAt > 3500) {
              assignedSlot = tokSlot;
            }
          }
        }
        // 3. Fallback: match disconnected slot with identical custom playerName
        const incomingName = (meta.playerName || '').trim().toLowerCase();
        if (assignedSlot === null && incomingName && !/^player\s*\d+$/i.test(incomingName)) {
          for (const [sid, prevName] of this.slotNameBySlotId.entries()) {
            if (sid <= this.maxPlayers && prevName.toLowerCase() === incomingName) {
              const active = this.guests.get(sid);
              if (!active || !active.conn.open || performance.now() - active.lastHeardAt > 3500) {
                assignedSlot = sid;
                break;
              }
            }
          }
        }

        if (assignedSlot !== null) {
          const existing = this.guests.get(assignedSlot);
          if (existing) {
            this.guests.delete(assignedSlot);
            try {
              existing.streamConn?.close();
              existing.conn.close();
            } catch {
              // ignore
            }
          }
        } else {
          const candidateSlots: PlayerId[] = [2, 3, 4, 5];
          for (const s of candidateSlots) {
            if (s <= this.maxPlayers && !this.guests.has(s)) {
              assignedSlot = s;
              break;
            }
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
        if (meta.clientUid) {
          this.slotByClientUid.set(meta.clientUid, assignedSlot);
        }
        if (meta.roomToken) {
          this.slotByRoomToken.set(meta.roomToken, assignedSlot);
        }
        if (meta.playerName?.trim()) {
          this.slotNameBySlotId.set(assignedSlot, meta.playerName.trim().slice(0, 14));
        }
        this.attachHostToGuestConnection(incomingConn, assignedSlot, meta.clientUid, meta.roomToken, meta.playerName);
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
      if (!this.destroyed && peer && !peer.destroyed) {
        window.setTimeout(() => {
          if (!this.destroyed && peer && !peer.destroyed && peer.disconnected) {
            try {
              peer.reconnect();
            } catch {
              // ignore
            }
          }
        }, 250);
      }
    });
  }

  private findSlotId(target: GuestSlot): PlayerId {
    for (const [id, slot] of this.guests.entries()) {
      if (slot === target) return id;
    }
    return 2;
  }

  private attachHostStreamConnection(conn: DataConnection, slot: GuestSlot, slotId: PlayerId) {
    if (slot.streamConn && slot.streamConn !== conn) {
      try {
        slot.streamConn.close();
      } catch {
        // ignore
      }
    }
    slot.streamConn = conn;
    conn.on('data', (raw) => {
      if (this.destroyed || !raw || typeof raw !== 'object') return;
      slot.lastHeardAt = performance.now();
      const msg = raw as OnlineMessage;
      if ('type' in msg) {
        this.callbacks.onMessage(msg, slotId);
      }
    });
    const clearStream = () => {
      if (slot.streamConn === conn) {
        slot.streamConn = null;
      }
    };
    conn.on('close', clearStream);
    conn.on('error', clearStream);
  }

  private attachHostToGuestConnection(
    conn: DataConnection,
    slotId: PlayerId,
    clientUid?: string,
    roomToken?: string,
    playerName?: string
  ) {
    const slot: GuestSlot = {
      conn,
      streamConn: null,
      clientUid,
      roomToken,
      playerName: playerName?.trim().slice(0, 14),
      pingMs: null,
      lastHeardAt: performance.now(),
    };
    this.guests.set(slotId, slot);

    if (clientUid && this.pendingStreams.has(clientUid)) {
      const pendingStream = this.pendingStreams.get(clientUid)!;
      this.pendingStreams.delete(clientUid);
      this.attachHostStreamConnection(pendingStream, slot, slotId);
    }

    conn.on('open', () => {
      if (this.destroyed) return;
      slot.lastHeardAt = performance.now();
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
      slot.lastHeardAt = performance.now();
      const msg = raw as OnlineMessage;
      if (msg.type === 'ping') {
        try {
          conn.send({ type: 'pong', ts: msg.ts } as OnlineMessage);
        } catch {
          // ignore
        }
        return;
      }
      if (msg.type === 'pong') {
        const rawRtt = Math.max(1, Math.round(performance.now() - msg.ts));
        slot.pingMs =
          slot.pingMs === null
            ? rawRtt
            : rawRtt > slot.pingMs * 2.2 + 40
            ? Math.round(slot.pingMs * 0.65 + rawRtt * 0.35)
            : Math.round(slot.pingMs * 0.4 + rawRtt * 0.6);
        this.callbacks.onPingUpdate?.(this.getPingByPlayer());
        return;
      }
      if (msg.type === 'guest_config' && msg.playerName?.trim()) {
        this.slotNameBySlotId.set(slotId, msg.playerName.trim().slice(0, 14));
      }
      if ('type' in msg) {
        this.callbacks.onMessage(msg, slotId);
      }
    });

    const handleDrop = () => {
      if (this.destroyed) return;
      if (this.guests.get(slotId)?.conn === conn) {
        try {
          slot.streamConn?.close();
        } catch {
          // ignore
        }
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

  private attachGuestToHostConnection(conn: DataConnection, isStream: boolean) {
    if (isStream) {
      this.hostStreamConn = conn;
      conn.on('data', (raw) => {
        if (this.destroyed || !raw || typeof raw !== 'object') return;
        this.hostLastHeardAt = performance.now();
        const msg = raw as OnlineMessage;
        if (msg.type === 'sync' && typeof msg.seq === 'number') {
          if (msg.seq < this.lastReceivedSyncSeq) return;
          this.lastReceivedSyncSeq = msg.seq;
        }
        if ('type' in msg) {
          this.callbacks.onMessage(msg, 1);
        }
      });
      const clearStream = () => {
        if (this.hostStreamConn === conn) {
          this.hostStreamConn = null;
        }
      };
      conn.on('close', clearStream);
      conn.on('error', clearStream);
      return;
    }

    this.hostConn = conn;

    conn.on('open', () => {
      if (this.destroyed) return;
      if (this.connectTimer !== null) {
        window.clearTimeout(this.connectTimer);
        this.connectTimer = null;
      }
      this.hostLastHeardAt = performance.now();
      this.hostWasConnected = true;
      this.ensurePingLoop();
      this.callbacks.onStatusChange('connected');
    });

    conn.on('data', (raw) => {
      if (this.destroyed || !raw || typeof raw !== 'object') return;
      this.hostLastHeardAt = performance.now();
      const msg = raw as OnlineMessage;
      if (msg.type === 'ping') {
        try {
          conn.send({ type: 'pong', ts: msg.ts } as OnlineMessage);
        } catch {
          // ignore
        }
        return;
      }
      if (msg.type === 'pong') {
        return;
      }
      if (msg.type === 'kicked') {
        const reason = msg.reason || 'You were removed from the room by the Host.';
        this.callbacks.onKicked?.(reason);
        this.destroy();
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
      if (msg.type === 'sync' && typeof msg.seq === 'number') {
        if (msg.seq < this.lastReceivedSyncSeq) return;
        this.lastReceivedSyncSeq = msg.seq;
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
      try {
        this.hostStreamConn?.close();
      } catch {
        // ignore
      }
      this.hostStreamConn = null;
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
      this.hostStreamConn?.close();
    } catch {
      // ignore
    }
    this.hostConn = null;
    this.hostStreamConn = null;
    for (const slot of this.guests.values()) {
      try {
        slot.conn.close();
        slot.streamConn?.close();
      } catch {
        // ignore
      }
    }
    this.guests.clear();
    this.pendingStreams.clear();
    try {
      this.peer?.destroy();
    } catch {
      // ignore
    }
    this.peer = null;
  }
}
