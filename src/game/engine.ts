import { soundEngine } from './soundEngine';
import {
  AmbientMote,
  BOONS_CATALOG,
  BoonDef,
  BoonId,
  Boss,
  BossChannelKind,
  BOSS_ARENA_HEIGHT,
  BOSS_ARENA_WIDTH,
  BOSS_VARIANTS,
  BossProjectile,
  BossType,
  BossVariantDef,
  BossVariantId,
  CameraState,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CheatsConfig,
  ChestDrop,
  clampPlayerToArenaAndHallways,
  ClassSkillDef,
  CoinBurstEvent,
  ComicSlash,
  ControlsConfig,
  DeathEffect,
  DEFAULT_CHEATS,
  DIFFICULTY_SETTINGS,
  DifficultyConfig,
  DifficultyKey,
  DUNGEON_ARENA_HEIGHT,
  DUNGEON_ARENA_WIDTH,
  DungeonGate,
  EclipseBeacon,
  EclipseMirror,
  EclipsePrison,
  EclipsePylon,
  Enemy,
  EnemyType,
  EnergyWave,
  FinalVoteState,
  FloatingText,
  FloorMapHudSnapshot,
  GameMode,
  GateDir,
  getGateHallwayBounds,
  HERO_CLASSES,
  HeroClassId,
  HudSnapshot,
  Knife,
  LeaderboardEntry,
  Medkit,
  OniCursedZone,
  OniShrine,
  OniSpiritBomb,
  Particle,
  Player,
  PlayerHudState,
  PlayerId,
  PlayerProjectile,
  RelicDrop,
  RelicType,
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
  WEAPONS_CATALOG,
  WeaponClassId,
  WeaponDrop,
  WeaponId,
} from './types';

export interface PersistedRoomState {
  key: string;
  gx: number;
  gy: number;
  kind: RoomKind;
  stage: StageKey;
  bossStage?: 'mechaBoss' | 'voidBoss' | 'oniBoss' | 'eclipseBoss';
  bossVariantId?: BossVariantId;
  label: string;
  connections: Partial<Record<GateDir, string>>;
  visited: boolean;
  cleared: boolean;
  revealed: boolean;
  enemies: Enemy[];
  chests: ChestDrop[];
  weaponDrops: WeaponDrop[];
  scrollDrops: SkillScrollDrop[];
  shopItems: ShopItem[];
  medkits: Medkit[];
  relics: RelicDrop[];
  nextFloorPortalOpen?: boolean;
}

export interface SafeZone {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface GameRuntime {
  difficulty: DifficultyKey;
  diffSettings: DifficultyConfig;
  mode: GameMode;
  numPlayers: number;
  isOnlineCampaign: boolean;
  isTeamworkPractice: boolean;
  roomKind: RoomKind;
  roomDepth: number;
  roomWave: number;
  roomTotalWaves: number;
  floorNumber: number;
  loopLevel: number;
  currentRoomKey: string;
  floorGrid: Record<string, PersistedRoomState>;
  floorMapRev: number;
  bossesDefeatedCount: number;
  chests: ChestDrop[];
  weaponDrops: WeaponDrop[];
  scrollDrops: SkillScrollDrop[];
  coinBursts: CoinBurstEvent[];
  skillZones: SkillZone[];
  gates: DungeonGate[];
  shopItems: ShopItem[];
  shopNpc: ShopNpc | null;
  lastKilledPos: { x: number; y: number } | null;
  finalVote: FinalVoteState | null;
  finalVoteResolveDelay: number;
  pingByPlayer: Record<number, number | null>;
  playerNames: Record<number, string>;
  playerColors: Record<number, string>;
  playerClasses: Record<number, HeroClassId>;
  stage: StageKey;
  waveNumber: number;
  bossType: BossType;
  lastBossVariantId?: BossVariantId;
  isBossLevel: boolean;
  arenaWidth: number;
  arenaHeight: number;
  camera: CameraState;
  bossVoiceLine: string | null;
  bossVoiceTimer: number;
  players: Player[];
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
  ambientMotes: AmbientMote[];
  activeBoons: BoonId[];
  score: number;
  stylePoints: number;
  grazes: number;
  kills: number;
  elapsedSeconds: number;
  stageElapsed: number;
  maxCombo: number;
  playerCombos: Record<number, { count: number; timer: number }>;
  medkitSpawnTimer: number;
  relicSpawnTimer: number;
  medkitInventoryCount: number;
  medkitNotif: string | null;
  medkitNotifTimer: number;
  phaseAnnounce: { text: string; color: string } | null;
  phaseAnnounceTimer: number;
  screenShake: number;
  freezeTime: number;
  introPlaying: boolean;
  introTimer: number;
  fadeOpacity: number;
  warningFlash: number;
  timeScale: number;
  landingSlowRemaining: number;
  bossNameReveal: boolean;
  bossDeadTimer: number;
  bossDeadBeat: number;
  gameOver: boolean;
  victory: boolean;
  nextUid: number;
  p1SafeZone: SafeZone;
  p2SafeZone: SafeZone;
  isTutorial: boolean;
  tutorialStep: number;
  tutorialSkillUses: number;
  tutorialGrazesStart: number;
  tutorialFireTimer: number;
  tutorialWeapon: WeaponId;
  tutorialCounterDone: boolean;
  practiceAttackTimer: number;
  practiceWeapon: WeaponId;
  cheats: CheatsConfig;
  cheatsUsed: boolean;
  bossHitCooldowns: Record<number, number>;
  bossProjBurstCooldowns: Record<number, number>;
  dungeonCleanDodgeTimer: number;
  pendingEvent:
    | null
    | { type: 'STAGE_CLEARED'; clearedStage: StageKey; nextStage: StageKey; offerBoons: boolean }
    | { type: 'GAME_OVER' }
    | { type: 'VICTORY' };
}

function usesWeaponSystem(rt: GameRuntime): boolean {
  return rt.isOnlineCampaign || rt.isTeamworkPractice;
}

const INTRO_DURATION = 2.2;
const LANDING_TARGET_Y = 100;
const REVIVE_TIME = 3.2;
const BOSS_DEAD_DELAY = 4.2;
const MAX_PARTICLES = 120;
const MAX_BOSS_PROJECTILES = 160;

export const LEADERBOARD_KEY = 'dungeon_bouncer_leaderboard_v3';

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function saveLeaderboardEntry(summary: RunSummary): LeaderboardEntry[] {
  const existing = loadLeaderboard();
  const entry: LeaderboardEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    score: Math.round(summary.score),
    rank: summary.rank,
    difficulty: summary.difficulty,
    mode: summary.mode,
    numPlayers: summary.numPlayers,
    elapsedSeconds: summary.elapsedSeconds,
    maxCombo: summary.maxCombo,
    victory: summary.victory,
    date: new Date().toLocaleDateString(),
    cheated: summary.cheated,
  };
  const updated = [...existing, entry].sort((a, b) => b.score - a.score).slice(0, 8);
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
  return updated;
}

export function computeRank(summary: Omit<RunSummary, 'rank'>): 'S' | 'A' | 'B' | 'C' {
  if (!summary.victory) return summary.score > 4500 ? 'B' : 'C';
  const parTime = summary.mode === 'boss_rush' ? 140 : 210;
  let pts = 0;
  if (summary.elapsedSeconds <= parTime) pts += 2;
  else if (summary.elapsedSeconds <= parTime * 1.45) pts += 1;
  if (summary.maxCombo >= 8) pts += 2;
  else if (summary.maxCombo >= 4) pts += 1;
  if (summary.grazes >= 6) pts += 1;
  if (pts >= 4) return 'S';
  if (pts >= 3) return 'A';
  if (pts >= 1) return 'B';
  return 'C';
}

function getStyleRank(pts: number): HudSnapshot['styleRank'] {
  if (pts >= 90) return 'SSS';
  if (pts >= 70) return 'SS';
  if (pts >= 50) return 'S';
  if (pts >= 35) return 'A';
  if (pts >= 20) return 'B';
  if (pts >= 8) return 'C';
  return 'D';
}

function createAmbientMotes(count = 28, width = CANVAS_WIDTH, height = CANVAS_HEIGHT): AmbientMote[] {
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

function createPlayer(
  id: PlayerId,
  heroClass: HeroClassId,
  x: number,
  y: number,
  color: string,
  diffSettings: DifficultyConfig,
  numPlayers: number,
  usesWeapons: boolean,
  playerName?: string,
  isBot = false
): Player {
  const classDef = HERO_CLASSES.find((c) => c.id === heroClass) || HERO_CLASSES[0];
  const isActive = id <= numPlayers;
  const maxHp = usesWeapons ? diffSettings.baseMaxHp : diffSettings.baseMaxHp + classDef.bonusHp;

  const sMax: [number, number, number, number] = usesWeapons
    ? [12, 16, 20, 26]
    : [
        classDef.skills[0].cooldown,
        classDef.skills[1].cooldown,
        classDef.skills[2].cooldown,
        classDef.skills[3].cooldown,
      ];

  return {
    id,
    name: (playerName || `Player ${id}`).trim().slice(0, 14) || `Player ${id}`,
    isBot,
    heroClass,
    weapon: 'none',
    scrollBag: [],
    potions: usesWeapons ? 1 : 0,
    potionCooldownTimer: 0,
    swapCooldownTimer: 0,
    coins: 0,
    x,
    y,
    vx: 0,
    vy: 0,
    facingAngle: Math.PI / 2,
    size: 38,
    speed: usesWeapons ? 5.2 : classDef.baseSpeed,
    color,
    hasKnife: false,
    state: isActive ? 'alive' : 'spectator',
    reviveProgress: 0,
    invulnerable: true,
    inSafeZone: true,
    safeZoneClosed: false,
    dashReady: true,
    dashTime: !usesWeapons && heroClass === 'ronin' ? 0.18 : 0.16,
    dashCooldown: usesWeapons ? 8.8 : classDef.dashCooldown,
    dashImmune: false,
    dashTrail: [],
    dashTimeLeft: 0,
    dashCooldownTimer: 0,
    postDashInvulnerability: 0,
    hp: maxHp,
    maxHp,
    bonusMaxHp: 0,
    dash2Ready: false,
    dash2CooldownTimer: 0,
    dash2Active: false,
    usingDash2: false,
    invulnFrames: 0,
    _lastDashPressed: false,
    _lastAbilityPressed: false,
    _lastSkill2Pressed: false,
    _lastSkill3Pressed: false,
    _lastSkill4Pressed: false,
    _lastPotionPressed: false,
    unlockedSkillTier: 1,
    learnedSkills: {},
    skillCooldowns: [0, 0, 0, 0],
    skillMaxCooldowns: sMax,
    weaponCooldowns: {},
    tankShieldReady: true,
    abilityReady: usesWeapons ? false : true,
    abilityCooldown: usesWeapons ? 12.0 : classDef.skillCooldown,
    abilityCooldownTimer: 0,
    cloakTimer: 0,
    empoweredStrike: false,
    shieldRegenTimer: !usesWeapons && heroClass === 'vanguard' ? 28 : 0,
    bladeHealCd: 0,
    whirlwindTimer: 0,
    fortifyTimer: 0,
    frontShieldTimer: 0,
    bloodlustTimer: 0,
    chargeTimer: 0,
    sealed: false,
    sealTimer: 0,
    hasShield: !usesWeapons && heroClass === 'vanguard',
    overdriveTimer: 0,
    magnetTimer: 0,
    grazedIds: new Set<number>(),
    dashDirX: 0,
    dashDirY: 1,
    animTime: Math.random() * 10,
    cleanDodgeFailed: false,
  };
}

function createEmptyBoss(): Boss {
  return {
    x: CANVAS_WIDTH / 2 - 52,
    y: -150,
    size: 104,
    health: 30,
    maxHealth: 30,
    state: 'idle',
    stateTimer: 1,
    attackPattern: 'rotary_spiral',
    attackLabel: '',
    attackTimer: 0,
    targetX: CANVAS_WIDTH / 2 - 52,
    targetY: 80,
    animationTimer: 0,
    pulseSize: 1,
    rotationAngle: 0,
    flashIntensity: 0,
    weakenedHits: 0,
    maxWeakenedHits: 4,
    entryPhase: 0,
    originalY: 80,
    shakeIntensity: 0,
    phase: 1,
    attacksBeforeVulnerable: 0,
    attacksNeeded: 2,
    posture: 0,
    maxPosture: 100,
    postureDecayGrace: 0,
    postureUnlocked: false,
    wallDirection: null,
    variantId: 'mecha_bastion',
    channelKind: null,
    channelTimer: 0,
    channelMaxTimer: 0,
    channelHits: 0,
    channelHitsNeeded: 1,
    channelLabel: '',
    channelSafeX: 0,
    channelSafeY: 0,
    channelSafeR: 92,
    channelAngle: 0,
    channelTargetPlayerId: undefined,
    channelTetherPair: undefined,
    channelNodes: [],
    channelSeqCount: 0,
  };
}

function spawnKnivesForPlayers(
  players: Player[],
  playerColors: Record<number, string>,
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT
): Knife[] {
  const active = players.filter((p) => p.state !== 'spectator');
  const count = Math.max(1, active.length);
  return active.map((pl, idx) => {
    const bandWidth = (width * 0.72) / count;
    const xStart = width * 0.14 + idx * bandWidth;
    return {
      x: xStart + Math.random() * Math.max(24, bandWidth - 24),
      y: height * 0.25 + Math.random() * (height * 0.5),
      size: 26,
      color: playerColors[pl.id] || pl.color || '#ef4444',
      owner: pl.id,
      bobPhase: idx * 1.1,
      luckyTimer: 0,
    };
  });
}

function spawnKnives(
  numPlayers: number,
  playerColors: Record<number, string>,
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT
): Knife[] {
  const knives: Knife[] = [];
  for (let i = 1; i <= numPlayers; i++) {
    const pid = i as PlayerId;
    const bandWidth = (width * 0.72) / Math.max(1, numPlayers);
    const xStart = width * 0.14 + (i - 1) * bandWidth;
    knives.push({
      x: xStart + Math.random() * Math.max(24, bandWidth - 24),
      y: height * 0.25 + Math.random() * (height * 0.5),
      size: 26,
      color: playerColors[pid] || '#ef4444',
      owner: pid,
      bobPhase: (i - 1) * 1.1,
      luckyTimer: 0,
    });
  }
  return knives;
}

function getStandardKnifePos(rt: GameRuntime, size: number): { x: number; y: number } {
  let kx = 120 + Math.random() * (rt.arenaWidth - 240);
  let ky = 140 + Math.random() * (rt.arenaHeight - 280);
  if (rt.isBossLevel && rt.boss.health > 0) {
    const bcx = rt.boss.x + rt.boss.size / 2;
    const bcy = rt.boss.y + rt.boss.size / 2;
    const d = Math.hypot(kx + size / 2 - bcx, ky + size / 2 - bcy);
    if (d < rt.boss.size * 0.72) {
      const ang = Math.random() * Math.PI * 2;
      kx = Math.max(80, Math.min(rt.arenaWidth - 80 - size, bcx + Math.cos(ang) * (rt.boss.size * 0.9 + 50)));
      ky = Math.max(90, Math.min(rt.arenaHeight - 90 - size, bcy + Math.sin(ang) * (rt.boss.size * 0.9 + 50)));
    }
  }
  return { x: kx, y: ky };
}

function repositionKnifeForPlayer(rt: GameRuntime, player: Player) {
  const knife = rt.knives.find((k) => k.owner === player.id);
  if (!knife) return;
  if (player.state === 'alive' && Math.random() < 0.48) {
    const px = player.x + player.size / 2;
    const py = player.y + player.size / 2;
    const minDist = 56;
    const maxDist = 140;
    let bestX = px;
    let bestY = py;
    for (let attempt = 0; attempt < 8; attempt++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = minDist + Math.random() * (maxDist - minDist);
      const cx = Math.max(60, Math.min(rt.arenaWidth - 60 - knife.size, px + Math.cos(ang) * dist - knife.size / 2));
      const cy = Math.max(80, Math.min(rt.arenaHeight - 80 - knife.size, py + Math.sin(ang) * dist - knife.size / 2));
      bestX = cx;
      bestY = cy;
      if (!rt.isBossLevel || rt.boss.health <= 0) break;
      const bcx = rt.boss.x + rt.boss.size / 2;
      const bcy = rt.boss.y + rt.boss.size / 2;
      if (Math.hypot(cx + knife.size / 2 - bcx, cy + knife.size / 2 - bcy) >= rt.boss.size * 0.72) {
        break;
      }
    }
    knife.x = bestX;
    knife.y = bestY;
    knife.luckyTimer = 6.5;
    return;
  }

  const pos = getStandardKnifePos(rt, knife.size);
  knife.x = pos.x;
  knife.y = pos.y;
  knife.luckyTimer = 0;
}

function getSpawnXForPlayer(id: number, numPlayers: number, arenaWidth: number, isBossStart: boolean, isOnlineCampaign: boolean): number {
  if (!isBossStart && !isOnlineCampaign) {
    return id === 1 ? 130 : 630;
  }
  const activeCount = Math.max(1, numPlayers);
  if (activeCount === 2 && isBossStart) {
    return id === 1 ? Math.round(arenaWidth * 0.34) : Math.round(arenaWidth * 0.64);
  }
  const spacing = isOnlineCampaign ? 86 : 110;
  const offset = (id - 1 - (activeCount - 1) / 2) * spacing;
  return Math.round(arenaWidth / 2 - 19 + offset);
}

export function createInitialGameRuntime(params: {
  difficulty: DifficultyKey;
  mode: GameMode;
  numPlayers: number;
  playerColors: Record<number, string>;
  playerClasses: Record<number, HeroClassId>;
  playerNames?: Record<number, string>;
  isOnlineCampaign?: boolean;
  activePlayerIds?: PlayerId[];
  cheats?: CheatsConfig;
}): GameRuntime {
  const activeCheats: CheatsConfig = { ...DEFAULT_CHEATS, ...(params.cheats || {}) };
  const anyCheat = Object.values(activeCheats).some(Boolean);
  const diffSettings = DIFFICULTY_SETTINGS[params.difficulty];
  const isTutorial = params.mode === 'tutorial';
  const isTeamworkPractice = params.mode === 'teamwork_practice';
  const isBossStart = params.mode === 'boss_rush' || isTeamworkPractice;
  const isOnlineCampaign = Boolean(params.isOnlineCampaign && params.mode === 'campaign');
  const usesWeapons = isOnlineCampaign || isTeamworkPractice;
  const startW = isBossStart ? BOSS_ARENA_WIDTH : isOnlineCampaign ? DUNGEON_ARENA_WIDTH : CANVAS_WIDTH;
  const startH = isBossStart ? BOSS_ARENA_HEIGHT : isOnlineCampaign ? DUNGEON_ARENA_HEIGHT : CANVAS_HEIGHT;

  const activeSet = params.activePlayerIds && params.activePlayerIds.length > 0 ? new Set(params.activePlayerIds) : null;
  const spawnSoloDummies = isTeamworkPractice && params.numPlayers === 1;
  const effectiveNumPlayers = spawnSoloDummies ? 3 : params.numPlayers;
  const maxActiveId = activeSet ? Math.max(...Array.from(activeSet)) : effectiveNumPlayers;
  const slotCount = isOnlineCampaign || isTeamworkPractice
    ? Math.max(1, Math.min(5, Math.max(effectiveNumPlayers, maxActiveId)))
    : Math.max(2, Math.min(5, Math.max(effectiveNumPlayers, maxActiveId)));
  const players: Player[] = [];
  for (let i = 1; i <= slotCount; i++) {
    const pid = i as PlayerId;
    const isBot = spawnSoloDummies && i >= 2 && i <= 3;
    const isIncluded = isBot ? true : activeSet ? activeSet.has(pid) : i <= effectiveNumPlayers;
    const xPos = getSpawnXForPlayer(pid, effectiveNumPlayers, startW, isBossStart, isOnlineCampaign);
    const botColor = i === 2 ? '#34d399' : '#fde047';
    const botName = i === 2 ? 'Dummy Ranger' : 'Dummy Cleric';
    const pl = createPlayer(
      pid,
      params.playerClasses[pid] || 'ronin',
      xPos,
      -60,
      isBot ? botColor : params.playerColors[pid] || '#ef4444',
      diffSettings,
      isIncluded ? Math.max(effectiveNumPlayers, pid) : 0,
      usesWeapons,
      isBot ? botName : params.playerNames?.[pid],
      isBot
    );
    if (!isIncluded) {
      pl.state = 'spectator';
      pl.hasKnife = false;
      pl.hp = 0;
    }
    players.push(pl);
  }

  const startStage: StageKey = isBossStart ? 'mechaBoss' : 'ironDungeon';

  const runtime: GameRuntime = {
    difficulty: params.difficulty,
    diffSettings,
    mode: params.mode,
    numPlayers: effectiveNumPlayers,
    isOnlineCampaign,
    isTeamworkPractice,
    roomKind: 'combat',
    roomDepth: 1,
    roomWave: 1,
    roomTotalWaves: 1,
    floorNumber: 1,
    loopLevel: 1,
    currentRoomKey: '2,2',
    floorGrid: {},
    floorMapRev: 1,
    bossesDefeatedCount: 0,
    chests: [],
    weaponDrops: [],
    scrollDrops: [],
    skillZones: [],
    gates: [],
    shopItems: [],
    shopNpc: null,
    lastKilledPos: null,
    finalVote: null,
    finalVoteResolveDelay: 0,
    pingByPlayer: { 1: 1 },
    playerNames: { ...(params.playerNames || {}) },
    playerColors: { ...params.playerColors },
    playerClasses: { ...params.playerClasses },
    stage: startStage,
    waveNumber: 1,
    bossType: 'mecha',
    lastBossVariantId: undefined,
    isBossLevel: isBossStart,
    arenaWidth: startW,
    arenaHeight: startH,
    camera: isBossStart
      ? { x: startW / 2, y: startH * 0.52, zoom: 0.65 }
      : isOnlineCampaign
      ? { x: startW / 2, y: startH * 0.45, zoom: 0.72 }
      : { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, zoom: 1 },
    bossVoiceLine: null,
    bossVoiceTimer: 0,
    players,
    playerProjectiles: [],
    voidDecoys: [],
    telegraphLines: [],
    knives: spawnKnivesForPlayers(players, params.playerColors, startW, startH),
    enemies: [],
    boss: createEmptyBoss(),
    bossProjectiles: [],
    voidTentacles: [],
    oniShrines: [],
    oniCursedZones: [],
    oniSpiritBombs: [],
    eclipseBeacons: [],
    eclipsePylons: [],
    eclipsePrison: null,
    eclipseMirrors: [],
    eclipseMarkedBy: null,
    eclipseMarkTimer: 0,
    eclipseCounterFlashTimer: 0,
    eclipseSyncTimer: 0,
    eclipseTetherTimer: 0,
    eclipseSanctuaryActive: false,
    medkits: [],
    relics: [],
    coinBursts: [],
    dustParticles: [],
    deathEffects: [],
    slashArcs: [],
    floatingTexts: [],
    comicSlashes: [],
    voidRifts: [],
    energyWaves: [],
    ambientMotes: createAmbientMotes(isBossStart || isOnlineCampaign ? 48 : 28, startW, startH),
    activeBoons: [],
    score: 0,
    stylePoints: 0,
    grazes: 0,
    kills: 0,
    elapsedSeconds: 0,
    stageElapsed: 0,
    maxCombo: 0,
    playerCombos: {
      1: { count: 0, timer: 0 },
      2: { count: 0, timer: 0 },
      3: { count: 0, timer: 0 },
      4: { count: 0, timer: 0 },
      5: { count: 0, timer: 0 },
    },
    medkitSpawnTimer: 22,
    relicSpawnTimer: 11,
    medkitInventoryCount: 0,
    medkitNotif: null,
    medkitNotifTimer: 0,
    phaseAnnounce: null,
    phaseAnnounceTimer: 0,
    screenShake: 0,
    freezeTime: 0,
    introPlaying: true,
    introTimer: 0,
    fadeOpacity: 1,
    warningFlash: 0,
    timeScale: 1,
    landingSlowRemaining: 0,
    bossNameReveal: false,
    bossDeadTimer: 0,
    bossDeadBeat: 0,
    gameOver: false,
    victory: false,
    nextUid: 1,
    p1SafeZone: isOnlineCampaign
      ? { x: Math.round(startW / 2 - 230), y: 40, width: 460, height: 185, color: 'rgba(56, 189, 248, 0.12)' }
      : { x: 50, y: 50, width: 200, height: 185, color: 'rgba(56, 189, 248, 0.12)' },
    p2SafeZone: isOnlineCampaign
      ? { x: Math.round(startW / 2 - 230), y: 40, width: 460, height: 185, color: 'rgba(244, 63, 94, 0.12)' }
      : { x: 550, y: 50, width: 200, height: 185, color: 'rgba(244, 63, 94, 0.12)' },
    isTutorial,
    tutorialStep: 1,
    tutorialSkillUses: 0,
    tutorialGrazesStart: 0,
    tutorialFireTimer: 0.8,
    tutorialWeapon: 'none',
    tutorialCounterDone: false,
    practiceAttackTimer: 1.5,
    practiceWeapon: 'tank_shield',
    cheats: activeCheats,
    cheatsUsed: anyCheat,
    bossHitCooldowns: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    bossProjBurstCooldowns: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    dungeonCleanDodgeTimer: 0,
    pendingEvent: null,
  };

  if (activeCheats.allRelics) {
    applyCheatAllRelics(runtime);
  }
  if (activeCheats.alwaysArmed) {
    runtime.players.forEach((p) => {
      if (p.state === 'alive') p.hasKnife = true;
    });
  }

  if (isTutorial) {
    soundEngine.setMusicTrack('ironDungeon', false);
    showPhaseAnnounce(rtOrNull(runtime), 'TRAINING GROUNDS · DRILL 1: BLADE EXECUTION', '#38bdf8', 2.8);
  } else if (isTeamworkPractice) {
    setupBossStage(runtime, 'mechaBoss');
    skipBossIntro(runtime);
    runtime.introPlaying = false;
    runtime.fadeOpacity = 0;
    const defaultRoleList: WeaponClassId[] = ['tank_shield', 'ranger_bow', 'holy_staff', 'warrior_greatsword', 'assassin_blades'];
    runtime.players.forEach((pl, idx) => {
      if (pl.state === 'spectator') return;
      WEAPONS_CATALOG.forEach((w) => {
        pl.learnedSkills[w.id] = [1, 2, 3, 4];
      });
      pl.potions = 2;
      const wId = defaultRoleList[idx % defaultRoleList.length];
      equipWeapon(runtime, pl, wId);
      pl.unlockedSkillTier = 4;
      pl.y = Math.round(runtime.arenaHeight * 0.7);
      pl.invulnerable = false;
    });
    showPhaseAnnounce(
      rtOrNull(runtime),
      'BOSS TEAMWORK PRACTICE · SWAP WEAPONS & COUNTER BOSS MECHANICS!',
      '#38bdf8',
      3.4
    );
  } else if (isBossStart) {
    setupBossStage(runtime, 'mechaBoss');
  } else if (isOnlineCampaign) {
    generateFloorGrid(runtime);
    soundEngine.setMusicTrack('ironDungeon', false);
    showPhaseAnnounce(rtOrNull(runtime), 'FLOOR 1 · CLEAR ENTRY HALL FOR CHEST & MAP GATES', '#fbbf24', 3.0);
  } else {
    soundEngine.setMusicTrack('ironDungeon', false);
  }

  return runtime;
}

function applyCheatAllRelics(rt: GameRuntime) {
  BOONS_CATALOG.forEach((b) => {
    if (!rt.activeBoons.includes(b.id)) {
      applyBoon(rt, b.id);
    }
  });
  rt.players.forEach((p) => {
    if (p.state !== 'spectator') p.hasShield = true;
  });
}

export function setRuntimeCheats(rt: GameRuntime, cheats: CheatsConfig) {
  rt.cheats = { ...cheats };
  if (Object.values(cheats).some(Boolean)) {
    rt.cheatsUsed = true;
  }
  if (cheats.allRelics) {
    applyCheatAllRelics(rt);
  }
  if (cheats.alwaysArmed) {
    rt.players.forEach((p) => {
      if (p.state === 'alive') p.hasKnife = true;
    });
  }
}

export function cheatHealParty(rt: GameRuntime) {
  rt.cheatsUsed = true;
  rt.medkitInventoryCount += 10;
  rt.players.forEach((p) => {
    if (p.state === 'spectator') return;
    p.state = 'alive';
    p.hp = p.maxHp;
    p.hasShield = true;
    p.sealed = false;
    p.sealTimer = 0;
    p.reviveProgress = 0;
    addFloatingText(rt, p.x + p.size / 2, p.y - 16, 'CHEAT HEAL!', '#34d399', 1.15);
  });
  soundEngine.playMedkit();
}

export function cheatClearOrExpose(rt: GameRuntime) {
  rt.cheatsUsed = true;
  rt.enemies = [];
  rt.bossProjectiles = [];
  rt.telegraphLines = [];
  rt.oniCursedZones = [];
  rt.oniSpiritBombs = [];
  if (rt.isBossLevel && rt.boss.health > 0 && rt.boss.state !== 'dead') {
    rt.boss.state = 'weakened';
    rt.boss.stateTimer = 6.0;
    rt.boss.weakenedHits = 0;
    rt.boss.attackLabel = '';
    soundEngine.playBossWeakened();
    addFloatingText(rt, rt.boss.x + rt.boss.size / 2, rt.boss.y - 20, 'BOSS EXPOSED!', '#fbbf24', 1.25);
  } else {
    soundEngine.playShockwave();
  }
}

export function cheatWarpBoss(rt: GameRuntime, stage: StageKey) {
  rt.cheatsUsed = true;
  transitionToStage(rt, stage);
}

export function skipBossIntro(rt: GameRuntime) {
  if (!rt.isBossLevel || rt.boss.state !== 'comic_intro') return;
  const b = rt.boss;
  const landTarget = Math.round(rt.arenaHeight * 0.7);
  rt.players.forEach((p) => {
    if (p.state === 'spectator') return;
    p.y = landTarget;
    p.invulnerable = false;
  });
  rt.introPlaying = false;
  rt.introTimer = INTRO_DURATION;
  rt.fadeOpacity = 0;
  rt.warningFlash = 0;
  rt.timeScale = 1;
  rt.landingSlowRemaining = 0;
  rt.bossNameReveal = false;
  rt.comicSlashes = [];
  rt.telegraphLines = [];
  b.x = b.targetX;
  b.y = b.originalY;
  b.entryPhase = 1;
  b.shakeIntensity = 0;
  b.state = 'idle';
  b.stateTimer = 1.6;
  b.attackLabel = '';
  soundEngine.stopBossIntroAudio();
  soundEngine.playUiClick();
}

function getDiffScale(rt: GameRuntime): { spd: number; pace: number } {
  const loopBoost = 1 + Math.max(0, rt.loopLevel - 1) * 0.15;
  return {
    spd: rt.diffSettings.bulletSpeedMult * loopBoost,
    pace: rt.diffSettings.cadenceMult * loopBoost,
  };
}

function getScoreMult(rt: GameRuntime): number {
  return rt.diffSettings.scoreMultiplier * (1 + Math.max(0, rt.loopLevel - 1) * 0.5);
}

function triggerBossExposedWindow(rt: GameRuntime, message = 'BOSS EXPOSED — 2X DAMAGE!') {
  const b = rt.boss;
  const isP2 = b.phase === 2;
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;
  b.state = 'weakened';
  b.stateTimer =
    rt.difficulty === 'hard'
      ? isP2
        ? 4.6
        : 5.2
      : rt.difficulty === 'medium'
      ? isP2
        ? 5.2
        : 5.8
      : isP2
      ? 5.8
      : 6.4;
  b.weakenedHits = 0;
  b.attacksBeforeVulnerable = 0;
  b.attacksNeeded = rt.difficulty === 'hard' ? 3 : rt.bossType === 'void' && !isP2 ? 3 : 2;
  b.posture = 0;
  b.postureUnlocked = false;
  b.postureDecayGrace = 0;
  b.attackTimer = 0;
  b.entryPhase = 0;
  b.channelKind = null;
  b.channelTimer = 0;
  b.channelLabel = '';
  b.channelNodes = [];
  b.channelTargetPlayerId = undefined;
  b.channelTetherPair = undefined;
  b.attackLabel = 'WEAKENED · 2X CRITICAL DMG';
  rt.telegraphLines = [];
  rt.oniCursedZones = rt.oniCursedZones.filter((z) => !(z.telegraphTimer && z.telegraphTimer > 0));
  soundEngine.playBossWeakened();
  rt.screenShake = Math.max(rt.screenShake, 14);
  rt.energyWaves.push({ x: cx, y: cy, radius: 14, maxRadius: 340, alpha: 0.9, speed: 460, color: '#22d3ee' });
  addFloatingText(rt, cx, cy - 64, message, '#22d3ee', 1.25);
}

function emitBossWeakenedSparks(rt: GameRuntime) {
  const b = rt.boss;
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;
  if (Math.random() < 0.35) {
    const a = Math.random() * Math.PI * 2;
    addParticle(rt, {
      x: cx + (Math.random() - 0.5) * b.size * 0.6,
      y: cy + (Math.random() - 0.5) * b.size * 0.6,
      dx: Math.cos(a) * 140,
      dy: Math.sin(a) * 140,
      alpha: 0.9,
      size: 3.5,
      color: '#22d3ee',
    });
  }
}

function awardCleanDodge(rt: GameRuntime, player: Player) {
  rt.grazes++;
  rt.stylePoints = Math.min(100, rt.stylePoints + 8);
  rt.score += Math.round(150 * getScoreMult(rt));
  const shave = hasBoon(rt, 'blade_magnet') ? 2.5 : 1.5;
  player.dashCooldownTimer = Math.max(0, player.dashCooldownTimer - shave);
  if (!player.dashReady && player.dashCooldownTimer <= 0) {
    player.dashReady = true;
  }
  const newlyEmpowered = !player.empoweredStrike;
  player.empoweredStrike = true;
  soundEngine.playGraze();
  addFloatingText(
    rt,
    player.x + player.size / 2,
    player.y - 16,
    newlyEmpowered ? 'CLEAN DODGE · EMPOWERED!' : 'CLEAN DODGE +150',
    newlyEmpowered ? '#fde047' : '#22d3ee',
    0.95
  );

  // Volt class passive: Static Arc bolt on Clean Dodge (Classic modes only)!
  if (!usesWeaponSystem(rt) && player.heroClass === 'volt') {
    let ang = player.facingAngle;
    if (rt.isBossLevel) {
      ang = Math.atan2(
        rt.boss.y + rt.boss.size / 2 - (player.y + player.size / 2),
        rt.boss.x + rt.boss.size / 2 - (player.x + player.size / 2)
      );
    } else if (rt.enemies.length > 0) {
      let best = rt.enemies[0];
      let bestD = Infinity;
      for (const en of rt.enemies) {
        const ed = Math.hypot(en.x - player.x, en.y - player.y);
        if (ed < bestD) {
          bestD = ed;
          best = en;
        }
      }
      ang = Math.atan2(
        best.y + best.size / 2 - (player.y + player.size / 2),
        best.x + best.size / 2 - (player.x + player.size / 2)
      );
    }
    rt.playerProjectiles.push({
      uid: rt.nextUid++,
      ownerId: player.id,
      kind: 'arc_bolt',
      x: player.x + player.size / 2,
      y: player.y + player.size / 2,
      dx: Math.cos(ang) * 10,
      dy: Math.sin(ang) * 10,
      angle: ang,
      radius: 14,
      color: '#facc15',
      lifetime: 1.0,
      pierce: 1,
    });
  }
}

function partyHasTank(rt: GameRuntime): boolean {
  return rt.players.some(
    (p) =>
      p.state === 'alive' &&
      (usesWeaponSystem(rt) ? p.weapon === 'tank_shield' : p.heroClass === 'vanguard')
  );
}

function wrapAngleDiff(a: number, b: number): number {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function isTeamworkChaosActive(rt: GameRuntime): boolean {
  return !rt.isTutorial;
}

function getTeamworkDiffScale(rt: GameRuntime): {
  durMult: number;
  dmgMult: number;
  hitScale: number;
  projSpdMult: number;
} {
  if (rt.difficulty === 'easy') {
    return { durMult: 1.38, dmgMult: 0.56, hitScale: 0.7, projSpdMult: 0.78 };
  }
  if (rt.difficulty === 'medium') {
    return { durMult: 1.16, dmgMult: 0.78, hitScale: 0.85, projSpdMult: 0.9 };
  }
  return { durMult: 1.0, dmgMult: 1.0, hitScale: 1.0, projSpdMult: 1.0 };
}

function rollFloorBossVariant(
  rt: GameRuntime,
  bossType: BossType,
  avoidVariantId?: BossVariantId
): BossVariantId {
  const all = BOSS_VARIANTS.filter((v) => v.bossType === bossType);
  const filtered = avoidVariantId && all.length > 1 ? all.filter((v) => v.id !== avoidVariantId) : all;
  const equipped = new Set(
    rt.players
      .filter((p) => p.state !== 'spectator' && p.weapon !== 'none')
      .map((p) => p.weapon as WeaponClassId)
  );
  if (equipped.size === 0) {
    return filtered[Math.floor(Math.random() * filtered.length)]?.id || all[0].id;
  }
  const weighted = filtered.map((v) => {
    const overlap = v.suggestedWeapons.filter((w) => equipped.has(w)).length;
    return { v, w: 1 + overlap * 3 };
  });
  const total = weighted.reduce((acc, x) => acc + x.w, 0);
  let r = Math.random() * total;
  for (const item of weighted) {
    r -= item.w;
    if (r <= 0) return item.v.id;
  }
  return filtered[0]?.id || all[0].id;
}

function aimTankAtThreat(rt: GameRuntime, p: Player) {
  // If tank isn't holding a movement direction, face boss or nearest foe automatically
  if (Math.abs(p.vx) > 0.1 || Math.abs(p.vy) > 0.1) return;
  const pcx = p.x + p.size / 2;
  const pcy = p.y + p.size / 2;
  if (rt.isBossLevel && rt.boss.health > 0 && rt.boss.state !== 'dead') {
    const bcx = rt.boss.x + rt.boss.size / 2;
    const bcy = rt.boss.y + rt.boss.size / 2;
    p.facingAngle = Math.atan2(bcy - pcy, bcx - pcx);
    return;
  }
  if (rt.enemies.length > 0) {
    let best = rt.enemies[0];
    let bestD = Infinity;
    for (const e of rt.enemies) {
      const ed = Math.hypot(e.x + e.size / 2 - pcx, e.y + e.size / 2 - pcy);
      if (ed < bestD) {
        bestD = ed;
        best = e;
      }
    }
    p.facingAngle = Math.atan2(best.y + best.size / 2 - pcy, best.x + best.size / 2 - pcx);
  }
}

function doesFrontShieldInterceptPoint(tank: Player, px: number, py: number, extraRadius = 0): boolean {
  if (tank.state !== 'alive' || tank.frontShieldTimer <= 0) return false;
  const tcx = tank.x + tank.size / 2;
  const tcy = tank.y + tank.size / 2;
  const dx = px - tcx;
  const dy = py - tcy;
  const dist = Math.hypot(dx, dy);
  if (dist < 6 || dist > 84 + extraRadius) return false;
  const ang = Math.atan2(dy, dx);
  return Math.abs(wrapAngleDiff(ang, tank.facingAngle)) <= 1.26;
}

function isBehindTankShield(rt: GameRuntime, ally: Player, threatX: number, threatY: number): boolean {
  if (ally.state !== 'alive') return false;
  const acx = ally.x + ally.size / 2;
  const acy = ally.y + ally.size / 2;

  // Tank themselves facing the threat
  if (ally.frontShieldTimer > 0) {
    const angToThreat = Math.atan2(threatY - acy, threatX - acx);
    if (Math.abs(wrapAngleDiff(angToThreat, ally.facingAngle)) <= 1.32) {
      return true;
    }
  }

  // Allied players standing inside the Tank's protective rear shadow cone
  for (const tank of rt.players) {
    if (tank.state !== 'alive' || tank.frontShieldTimer <= 0 || tank.id === ally.id) continue;
    const tcx = tank.x + tank.size / 2;
    const tcy = tank.y + tank.size / 2;
    const angToThreat = Math.atan2(threatY - tcy, threatX - tcx);
    if (Math.abs(wrapAngleDiff(angToThreat, tank.facingAngle)) > 1.32) continue;

    const toAllyX = acx - tcx;
    const toAllyY = acy - tcy;
    const dist = Math.hypot(toAllyX, toAllyY);
    if (dist > 250) continue;

    const fx = Math.cos(tank.facingAngle);
    const fy = Math.sin(tank.facingAngle);
    // Behind tank = negative dot with facing direction (with slight front tolerance of +14px right at the wall)
    const alongBack = -(toAllyX * fx + toAllyY * fy);
    const perp = Math.abs(-toAllyX * fy + toAllyY * fx);
    if (alongBack >= -14 && perp <= 82 + alongBack * 0.28) {
      return true;
    }
  }
  return false;
}

function doesTankInterceptLine(
  rt: GameRuntime,
  bx: number,
  by: number,
  tx: number,
  ty: number
): boolean {
  const angBossToLine = Math.atan2(ty - by, tx - bx);
  return rt.players.some((tank) => {
    if (tank.state !== 'alive' || tank.frontShieldTimer <= 0) return false;
    const tcx = tank.x + tank.size / 2;
    const tcy = tank.y + tank.size / 2;
    const distToSeg = pointToSegmentDist(tcx, tcy, bx, by, tx, ty);
    if (distToSeg > 84) return false;
    return Math.abs(wrapAngleDiff(tank.facingAngle, angBossToLine + Math.PI)) <= 1.35;
  });
}

export function getBossVariantDef(bossType: BossType, variantId?: BossVariantId): BossVariantDef {
  if (variantId) {
    const exact = BOSS_VARIANTS.find((v) => v.id === variantId);
    if (exact) return exact;
  }
  return BOSS_VARIANTS.find((v) => v.bossType === bossType) || BOSS_VARIANTS[0];
}

export function getBossTeamworkPool(bossType: BossType, variantId?: BossVariantId): BossChannelKind[] {
  const v = getBossVariantDef(bossType, variantId);
  if (v && v.channelPool.length > 0) return v.channelPool;
  if (bossType === 'mecha') return ['cursed_floor', 'siege_beam'];
  if (bossType === 'void') return ['hunter_mark', 'gravity_storm', 'abyss_tether'];
  if (bossType === 'oni') return ['cursed_floor', 'demon_seal_purge', 'meteor_soak'];
  return ['meteor_soak', 'siege_beam', 'interrupt'];
}

function startBossCounterChannel(
  rt: GameRuntime,
  forcedKind?: BossChannelKind
) {
  const b = rt.boss;
  if (b.health <= 0 || b.state === 'dead' || b.state === 'weakened' || b.channelKind) return;
  const alive = rt.players.filter((p) => p.state === 'alive');
  if (alive.length === 0) return;

  const hasTank = partyHasTank(rt);
  const hasBow = alive.some((pl) => pl.weapon === 'ranger_bow');
  const hasAssassin = alive.some((pl) => pl.weapon === 'assassin_blades');
  const hasStaff = alive.some((pl) => pl.weapon === 'holy_staff');
  const hasGreatsword = alive.some((pl) => pl.weapon === 'warrior_greatsword');
  const tw = getTeamworkDiffScale(rt);
  const pool = getBossTeamworkPool(rt.bossType, b.variantId);
  const seq = b.channelSeqCount || 0;
  b.channelSeqCount = seq + 1;
  const kind: BossChannelKind =
    forcedKind ||
    pool[(seq + rt.bossesDefeatedCount) % pool.length];

  const bx = b.x + b.size / 2;
  const by = b.y + b.size / 2;
  b.channelNodes = [];
  b.channelTargetPlayerId = undefined;
  b.channelTetherPair = undefined;

  if (kind === 'cursed_floor') {
    const dur = (rt.loopLevel >= 2 ? 4.3 : 4.6) * tw.durMult;
    const safeR = rt.difficulty === 'easy' ? 114 : rt.difficulty === 'medium' ? 104 : 98;
    const side = (b.attacksBeforeVulnerable + Math.floor(Math.random() * 2)) % 2 === 0 ? -1 : 1;
    const safeX = Math.max(180, Math.min(rt.arenaWidth - 180, rt.arenaWidth * 0.5 + side * (rt.arenaWidth * 0.21)));
    const safeY = Math.max(210, Math.min(rt.arenaHeight - 155, rt.arenaHeight * 0.66));

    b.channelKind = 'cursed_floor';
    b.channelTimer = dur;
    b.channelMaxTimer = dur;
    b.channelSafeX = safeX;
    b.channelSafeY = safeY;
    b.channelSafeR = safeR;
    b.channelHits = 0;
    b.channelHitsNeeded = 1;
    b.attackTimer = 0.6 * tw.durMult;
    b.channelLabel = hasTank
      ? 'MOLTEN LOCKDOWN — ONLY 1 SAFE ISLAND! TANK [E] SHIELD BOSS BARRAGE!'
      : 'MOLTEN LOCKDOWN — ONLY 1 SAFE ISLAND! WEAVE BARRAGE (HARD WITHOUT TANK)!';

    soundEngine.playBossTelegraph();
    showPhaseAnnounce(rt, b.channelLabel, '#fbbf24', 3.2);
    addFloatingText(rt, safeX, safeY - safeR - 14, 'ONLY SAFE ISLAND!', '#34d399', 1.25);
  } else if (kind === 'siege_beam') {
    const dur = (rt.loopLevel >= 2 ? 3.3 : 3.6) * tw.durMult;
    const avgX = alive.reduce((sum, pl) => sum + pl.x + pl.size / 2, 0) / alive.length;
    const avgY = alive.reduce((sum, pl) => sum + pl.y + pl.size / 2, 0) / alive.length;
    const coneAngle = Math.atan2(avgY - by, avgX - bx);

    b.channelKind = 'siege_beam';
    b.channelTimer = dur;
    b.channelMaxTimer = dur;
    b.channelAngle = coneAngle;
    b.channelHits = 0;
    b.channelHitsNeeded = 1;
    b.attackTimer = 0.4 * tw.durMult;
    b.channelLabel = hasTank
      ? 'APOCALYPSE CONE — TANK [E] FRONT SHIELD & ALLIES CROWD BEHIND!'
      : 'APOCALYPSE BARRAGE — NO TANK! WEAVE THROUGH CONE LANES!';

    soundEngine.playBossTelegraph();
    showPhaseAnnounce(rt, b.channelLabel, hasTank ? '#38bdf8' : '#f43f5e', 3.0);
    addFloatingText(rt, bx, by - 46, 'APOCALYPSE SIEGE LOCK!', '#f43f5e', 1.25);
  } else if (kind === 'gravity_storm') {
    const dur = (rt.loopLevel >= 2 ? 3.8 : 4.1) * tw.durMult;
    b.channelKind = 'gravity_storm';
    b.channelTimer = dur;
    b.channelMaxTimer = dur;
    b.channelHits = 0;
    b.channelHitsNeeded = 1;
    b.attackTimer = 0.45 * tw.durMult;
    b.channelLabel = hasTank
      ? 'SOUL MAELSTROM — FIGHT GRAVITY PULL & SHELTER BEHIND TANK [E]/[R]!'
      : 'SOUL MAELSTROM — DASH OUTWARD AGAINST GRAVITY VORTEX!';

    soundEngine.playBossTelegraph();
    showPhaseAnnounce(rt, b.channelLabel, '#a855f7', 3.0);
    addFloatingText(rt, bx, by - 46, 'GRAVITY VORTEX PULL!', '#c084fc', 1.25);
  } else if (kind === 'hunter_mark') {
    const nonTankAlive = alive.filter((pl) => pl.weapon !== 'tank_shield' && pl.heroClass !== 'vanguard');
    const target =
      (nonTankAlive.length > 0 ? nonTankAlive : alive)[
        Math.floor(Math.random() * (nonTankAlive.length > 0 ? nonTankAlive.length : alive.length))
      ];
    const needed = Math.max(1, Math.round((alive.length >= 3 ? 2 : 1) * tw.hitScale));
    const dur = 3.6 * tw.durMult;

    b.channelKind = 'hunter_mark';
    b.channelTimer = dur;
    b.channelMaxTimer = dur;
    b.channelTargetPlayerId = target.id;
    b.channelHits = 0;
    b.channelHitsNeeded = needed;
    b.channelLabel = hasTank
      ? `EXECUTION LOCK: ${target.name.toUpperCase()} — TANK [E] INTERCEPT BEAM OR STAGGER BOSS!`
      : `EXECUTION LOCK: ${target.name.toUpperCase()} — LAND SKILLS TO STAGGER BOSS (${needed}X)!`;

    soundEngine.playBossTelegraph();
    showPhaseAnnounce(rt, b.channelLabel, '#ef4444', 3.1);
    addFloatingText(rt, target.x + target.size / 2, target.y - 24, 'EXECUTION TARGET!', '#ef4444', 1.25);
  } else if (kind === 'bow_weakpoint') {
    const dur = 5.0 * tw.durMult;
    const needed = Math.max(3, Math.round((hasBow ? 4 : 6) * tw.hitScale));
    b.channelKind = 'bow_weakpoint';
    b.channelTimer = dur;
    b.channelMaxTimer = dur;
    b.channelHits = 0;
    b.channelHitsNeeded = needed;
    b.attackTimer = 0.6 * tw.durMult;
    b.channelLabel = hasBow
      ? 'OVERHEATED CORE EXPOSED — RANGER BOW ARROWS DEAL 3X CRITICAL DMG!'
      : 'CORE EXPOSED (SHOCK AURA) — NO BOW! USE RANGED SKILLS ONLY!';

    soundEngine.playBossAttackExecuteSfx('bow_weakpoint');
    showPhaseAnnounce(rt, b.channelLabel, '#34d399', 3.2);
    addFloatingText(rt, bx, by - 46, 'CORE EXPOSED · BOW 3X!', '#34d399', 1.3);
  } else if (kind === 'sky_battery') {
    const dur = 5.4 * tw.durMult;
    const needed = 4;
    const padX = Math.max(150, rt.arenaWidth * 0.16);
    const padY = Math.max(150, rt.arenaHeight * 0.22);
    b.channelNodes = [
      { x: padX, y: padY, r: 28, activated: false },
      { x: rt.arenaWidth - padX, y: padY, r: 28, activated: false },
      { x: padX, y: rt.arenaHeight - padY, r: 28, activated: false },
      { x: rt.arenaWidth - padX, y: rt.arenaHeight - padY, r: 28, activated: false },
    ];
    b.channelKind = 'sky_battery';
    b.channelTimer = dur;
    b.channelMaxTimer = dur;
    b.channelHits = 0;
    b.channelHitsNeeded = needed;
    b.attackTimer = 0.65 * tw.durMult;
    b.channelLabel = hasBow
      ? 'SKY BATTERY TURRETS — RANGER BOW SNIPES TURRETS OR CORE (3X)!'
      : 'SKY BATTERY TURRETS — SHOCK AURA! DESTROY 4 TURRETS WITH SKILLS!';

    soundEngine.playBossAttackExecuteSfx('sky_battery');
    showPhaseAnnounce(rt, b.channelLabel, '#34d399', 3.2);
    addFloatingText(rt, bx, by - 46, 'SKY BATTERIES DEPLOYED!', '#34d399', 1.3);
  } else if (kind === 'emp_interrupt') {
    const dur = 4.2 * tw.durMult;
    const needed = Math.max(3, Math.round(4 * tw.hitScale));
    b.channelKind = 'emp_interrupt';
    b.channelTimer = dur;
    b.channelMaxTimer = dur;
    b.channelHits = 0;
    b.channelHitsNeeded = needed;
    b.attackTimer = 0.9 * tw.durMult;
    b.channelLabel = hasAssassin
      ? 'UNAVOIDABLE EMP PULSE — ASSASSIN SKILL [E/Q/R/F] BREAKS IN 1 HIT!'
      : `UNAVOIDABLE EMP — NO ASSASSIN! LAND ${needed} WEAPON SKILLS (NO BASIC)!`;

    soundEngine.playBossAttackExecuteSfx('emp_interrupt');
    showPhaseAnnounce(rt, b.channelLabel, '#e879f9', 3.2);
    addFloatingText(rt, bx, by - 46, 'UNAVOIDABLE EMP CHARGING!', '#f43f5e', 1.3);
  } else if (kind === 'mirage_ambush') {
    const dur = 4.5 * tw.durMult;
    const needed = Math.max(3, Math.round(4 * tw.hitScale));
    b.channelKind = 'mirage_ambush';
    b.channelTimer = dur;
    b.channelMaxTimer = dur;
    b.channelHits = 0;
    b.channelHitsNeeded = needed;
    b.attackTimer = 0.72 * tw.durMult;
    b.channelLabel = hasAssassin
      ? 'SHADOW COUNTER DOME — ASSASSIN SKILLS [E/Q/R/F] SHATTER! BASIC ATTACKS PARRIED!'
      : `SHADOW COUNTER — BASIC BLADES PARRIED! HIT ${needed}X WITH SKILLS!`;

    soundEngine.playBossAttackExecuteSfx('mirage_ambush');
    showPhaseAnnounce(rt, b.channelLabel, '#c084fc', 3.2);
    addFloatingText(rt, bx, by - 46, 'COUNTER DOME · USE SKILLS!', '#c084fc', 1.3);
  } else if (kind === 'cursed_miasma') {
    const dur = (rt.loopLevel >= 2 ? 4.6 : 5.0) * tw.durMult;
    const needed = hasStaff ? 1 : Math.max(2, Math.round((alive.length >= 3 ? 4 : 3) * tw.hitScale));
    b.channelKind = 'cursed_miasma';
    b.channelTimer = dur;
    b.channelMaxTimer = dur;
    b.channelHits = 0;
    b.channelHitsNeeded = needed;
    b.attackTimer = 1.0 * tw.durMult;
    b.channelLabel = hasStaff
      ? 'PLAGUE MIASMA — HOLY STAFF SKILL [E/Q/R/F] PURIFIES ARENA IN 1 CAST!'
      : `PLAGUE MIASMA — NO HOLY STAFF! LAND ${needed}X SKILLS TO DISPEL!`;

    soundEngine.playBossAttackExecuteSfx('cursed_miasma');
    showPhaseAnnounce(rt, b.channelLabel, '#a3e635', 3.2);
    addFloatingText(rt, bx, by - 46, 'PLAGUE MIASMA!', '#a3e635', 1.3);
  } else if (kind === 'blood_curse') {
    const dur = 4.8 * tw.durMult;
    const needed = hasStaff ? 1 : Math.max(2, Math.round(3 * tw.hitScale));
    b.channelKind = 'blood_curse';
    b.channelTimer = dur;
    b.channelMaxTimer = dur;
    b.channelHits = 0;
    b.channelHitsNeeded = needed;
    b.attackTimer = 0.95 * tw.durMult;
    b.channelLabel = hasStaff
      ? 'CRIMSON BLOOD CURSE — HOLY STAFF SKILL [E/Q/R/F] CLEANSES PARTY!'
      : `CRIMSON BLOOD CURSE — NO STAFF! USE ${needed}X SKILLS OR SHELTER IN DOME!`;

    soundEngine.playBossAttackExecuteSfx('blood_curse');
    showPhaseAnnounce(rt, b.channelLabel, '#fb7185', 3.2);
    addFloatingText(rt, bx, by - 46, 'BLOOD CURSE BRAND!', '#fb7185', 1.3);
  } else if (kind === 'iron_carapace') {
    const dur = (rt.loopLevel >= 2 ? 4.6 : 5.0) * tw.durMult;
    const needed = Math.max(3, Math.round((alive.length >= 3 ? 6 : 5) * tw.hitScale));
    b.channelKind = 'iron_carapace';
    b.channelTimer = dur;
    b.channelMaxTimer = dur;
    b.channelHits = 0;
    b.channelHitsNeeded = needed;
    b.attackTimer = 0.78 * tw.durMult;
    b.channelLabel = hasGreatsword
      ? `IRON CARAPACE (50% ARMOR) — GREATSWORD SHATTERS 3X FASTER (${needed})!`
      : `IRON CARAPACE — ONLY GREATSWORD OR SKILLS CRACK ARMOR (${needed})!`;

    soundEngine.playBossAttackExecuteSfx('iron_carapace');
    showPhaseAnnounce(rt, b.channelLabel, '#fb7185', 3.2);
    addFloatingText(rt, bx, by - 46, 'ARMORED CARAPACE!', '#fb7185', 1.3);
  } else if (kind === 'obsidian_phalanx') {
    const dur = 5.2 * tw.durMult;
    const needed = Math.max(4, Math.round((alive.length >= 3 ? 7 : 6) * tw.hitScale));
    b.channelKind = 'obsidian_phalanx';
    b.channelTimer = dur;
    b.channelMaxTimer = dur;
    b.channelHits = 0;
    b.channelHitsNeeded = needed;
    b.attackTimer = 0.8 * tw.durMult;
    b.channelLabel = hasGreatsword
      ? `OBSIDIAN PHALANX (75% ARMOR) — GREATSWORD CLEAVES SHATTER (${needed})!`
      : `OBSIDIAN PHALANX (75% ARMOR) — BASIC DEFLECTED! USE SKILLS (${needed})!`;

    soundEngine.playBossAttackExecuteSfx('obsidian_phalanx');
    showPhaseAnnounce(rt, b.channelLabel, '#f43f5e', 3.2);
    addFloatingText(rt, bx, by - 46, 'OBSIDIAN PHALANX 75%!', '#f43f5e', 1.3);
  } else if (kind === 'abyss_tether') {
    const dur = 4.4 * tw.durMult;
    let pA = alive[0];
    let pB = alive.length >= 2 ? alive[alive.length - 1] : undefined;
    if (rt.isTeamworkPractice && alive.length >= 2) {
      const human = alive.find((pl) => pl.id === 1) || alive[0];
      const partner = alive.find((pl) => pl.id !== human.id && !pl.weapon.includes('tank')) || alive.find((pl) => pl.id !== human.id);
      pA = human;
      pB = partner;
    }
    b.channelKind = 'abyss_tether';
    b.channelTimer = dur;
    b.channelMaxTimer = dur;
    b.channelTetherPair = pB ? [pA.id, pB.id] : [pA.id, pA.id];
    b.channelHits = 0;
    b.channelHitsNeeded = 1;
    b.attackTimer = 0.8 * tw.durMult;
    b.channelLabel = pB
      ? `SOUL TETHER (${pA.name.toUpperCase()} & ${pB.name.toUpperCase()}) — SPRINT >340px APART OR TANK [E] PURGE!`
      : `ABYSSAL CHAIN — SPRINT >340px AWAY FROM BOSS TO SNAP TETHER!`;

    soundEngine.playBossTelegraph();
    showPhaseAnnounce(rt, b.channelLabel, '#c084fc', 3.2);
    addFloatingText(rt, pA.x + pA.size / 2, pA.y - 20, 'SOUL TETHERED!', '#c084fc', 1.2);
    if (pB) addFloatingText(rt, pB.x + pB.size / 2, pB.y - 20, 'RUN APART >340px!', '#c084fc', 1.2);
  } else if (kind === 'demon_seal_purge') {
    const dur = 4.6 * tw.durMult;
    const candidates = alive.filter((pl) => pl.weapon !== 'tank_shield' && pl.heroClass !== 'vanguard');
    const poolPlayers = candidates.length > 0 ? candidates : alive;
    const maxSeals = alive.length <= 1 ? 1 : Math.min(2, alive.length - 1);
    const chosen = [...poolPlayers].sort(() => Math.random() - 0.5).slice(0, maxSeals);
    chosen.forEach((tp) => {
      tp.sealed = true;
      tp.sealTimer = dur + 0.5;
      addFloatingText(rt, tp.x + tp.size / 2, tp.y - 24, 'DEMON SEALED!', '#fb923c', 1.2);
    });
    b.channelKind = 'demon_seal_purge';
    b.channelTimer = dur;
    b.channelMaxTimer = dur;
    b.channelHits = 0;
    b.channelHitsNeeded = chosen.length;
    b.attackTimer = 0.55 * tw.durMult;
    b.channelLabel =
      alive.length <= 1
        ? 'CURSED SEAL — MASH [SPACE] TO STRUGGLE FREE BEFORE DETONATION!'
        : hasTank
        ? 'DEMON SEAL SACRIFICE — TANK [E] PURGE OR ALLIES TOUCH SEALED TEAMMATES!'
        : 'DEMON SEAL SACRIFICE — RUN UP TO RESCUE SEALED TEAMMATES BEFORE 0s!';

    soundEngine.playBossTelegraph();
    showPhaseAnnounce(rt, b.channelLabel, '#fb923c', 3.2);
  } else if (kind === 'meteor_soak') {
    const dur = 3.9 * tw.durMult;
    const nonTank = alive.filter((pl) => pl.weapon !== 'tank_shield' && pl.heroClass !== 'vanguard');
    const target =
      (nonTank.length > 0 ? nonTank : alive)[
        Math.floor(Math.random() * (nonTank.length > 0 ? nonTank.length : alive.length))
      ];
    const tx = target.x + target.size / 2;
    const ty = target.y + target.size / 2;
    b.channelKind = 'meteor_soak';
    b.channelTimer = dur;
    b.channelMaxTimer = dur;
    b.channelTargetPlayerId = target.id;
    b.channelSafeX = tx;
    b.channelSafeY = ty;
    b.channelSafeR = rt.difficulty === 'easy' ? 160 : 142;
    b.channelHits = 0;
    b.channelHitsNeeded = 1;
    b.attackTimer = 0.55 * tw.durMult;
    b.channelLabel = hasTank
      ? `METEOR SOAK ON ${target.name.toUpperCase()} — STACK IN GOLD RING & TANK [E]/[R] TO NEUTRALIZE!`
      : `METEOR SOAK ON ${target.name.toUpperCase()} — STACK INSIDE RING TOGETHER TO SPLIT DMG!`;

    soundEngine.playBossTelegraph();
    showPhaseAnnounce(rt, b.channelLabel, '#fbbf24', 3.2);
    addFloatingText(rt, tx, target.y - 26, 'STACK IN METEOR RING!', '#fbbf24', 1.25);
  } else {
    const rawNeeded = alive.length <= 2 ? 2 : Math.min(4, alive.length >= 4 ? 4 : 3);
    const needed = Math.max(2, Math.round(rawNeeded * tw.hitScale));
    const dur = (rt.loopLevel >= 2 ? 3.4 : 3.7) * tw.durMult;
    b.channelKind = 'interrupt';
    b.channelTimer = dur;
    b.channelMaxTimer = dur;
    b.channelHits = 0;
    b.channelHitsNeeded = needed;
    b.channelLabel = `OBLIVION RITUAL — LAND WEAPON SKILLS (${needed}X) TO INTERRUPT!`;
    soundEngine.playBossTelegraph();
    showPhaseAnnounce(rt, b.channelLabel, '#c084fc', 2.8);
    addFloatingText(rt, bx, by - 46, 'INTERRUPT RITUAL!', '#c084fc', 1.25);
  }
}

function registerMiasmaPurge(rt: GameRuntime, player: Player, isStaffCast: boolean) {
  const b = rt.boss;
  if ((b.channelKind !== 'cursed_miasma' && b.channelKind !== 'blood_curse') || (b.channelTimer || 0) <= 0) return;
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;
  const isBlood = b.channelKind === 'blood_curse';
  const step = isStaffCast || player.weapon === 'holy_staff' ? b.channelHitsNeeded || 1 : 1;
  b.channelHits = Math.min(b.channelHitsNeeded || 1, (b.channelHits || 0) + step);
  if ((b.channelHits || 0) >= (b.channelHitsNeeded || 1)) {
    b.channelKind = null;
    b.channelTimer = 0;
    b.channelLabel = '';
    b.channelNodes = [];
    b.channelTargetPlayerId = undefined;
    b.channelTetherPair = undefined;
    b.health = Math.max(1, b.health - 1);
    rt.score += Math.round(480 * getScoreMult(rt));
    rt.tutorialCounterDone = true;
    soundEngine.playMedkit();
    addFloatingText(
      rt,
      cx,
      cy - 52,
      player.weapon === 'holy_staff'
        ? `${player.name.toUpperCase()} PURIFIED ${isBlood ? 'BLOOD CURSE' : 'MIASMA'}!`
        : `${player.name.toUpperCase()} DISPELLED ${isBlood ? 'CURSE' : 'BLIGHT'}!`,
      isBlood ? '#fda4af' : '#a3e635',
      1.3
    );
    triggerBossExposedWindow(rt, isBlood ? 'BLOOD CURSE CLEANSED — 2X STAGGER!' : 'MIASMA PURIFIED — 2X STAGGER!');
  } else {
    addFloatingText(
      rt,
      cx,
      cy - 44,
      `${isBlood ? 'CURSE CLEANSE' : 'BLIGHT DISPEL'} ${b.channelHits}/${b.channelHitsNeeded}!`,
      isBlood ? '#fda4af' : '#a3e635',
      1.15
    );
  }
}

function registerCarapaceBreak(rt: GameRuntime, player: Player, rawHits = 1) {
  const b = rt.boss;
  if ((b.channelKind !== 'iron_carapace' && b.channelKind !== 'obsidian_phalanx') || (b.channelTimer || 0) <= 0) return;
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;
  const isPhalanx = b.channelKind === 'obsidian_phalanx';
  const hits = player.weapon === 'warrior_greatsword' ? Math.max(rawHits, 3) : rawHits;
  b.channelHits = Math.min(b.channelHitsNeeded || 5, (b.channelHits || 0) + hits);
  if ((b.channelHits || 0) >= (b.channelHitsNeeded || 5)) {
    b.channelKind = null;
    b.channelTimer = 0;
    b.channelLabel = '';
    b.channelNodes = [];
    b.channelTargetPlayerId = undefined;
    b.channelTetherPair = undefined;
    b.health = Math.max(1, b.health - 1);
    rt.score += Math.round(540 * getScoreMult(rt));
    rt.tutorialCounterDone = true;
    soundEngine.playShockwave();
    addFloatingText(
      rt,
      cx,
      cy - 52,
      `${player.name.toUpperCase()} SHATTERED ${isPhalanx ? 'PHALANX' : 'CARAPACE'}!`,
      '#fb7185',
      1.32
    );
    triggerBossExposedWindow(rt, isPhalanx ? 'PHALANX SHATTERED — 2X STAGGER!' : 'CARAPACE SHATTERED — 2X STAGGER!');
  } else {
    addFloatingText(
      rt,
      cx,
      cy - 44,
      player.weapon === 'warrior_greatsword'
        ? `HEAVY CRACK ${b.channelHits}/${b.channelHitsNeeded}!`
        : `ARMOR CRACK ${b.channelHits}/${b.channelHitsNeeded}`,
      '#fda4af',
      1.1
    );
  }
}

function registerBossInterrupt(rt: GameRuntime, player: Player, amount = 1) {
  const b = rt.boss;
  if (b.channelKind === 'cursed_miasma' || b.channelKind === 'blood_curse') {
    registerMiasmaPurge(rt, player, player.weapon === 'holy_staff');
    return;
  }
  if (b.channelKind === 'iron_carapace' || b.channelKind === 'obsidian_phalanx') {
    registerCarapaceBreak(rt, player, amount);
    return;
  }
  if (
    (b.channelKind !== 'interrupt' &&
      b.channelKind !== 'hunter_mark' &&
      b.channelKind !== 'emp_interrupt' &&
      b.channelKind !== 'mirage_ambush') ||
    (b.channelTimer || 0) <= 0
  ) {
    return;
  }
  const effectiveAmount =
    (b.channelKind === 'emp_interrupt' || b.channelKind === 'mirage_ambush') && player.weapon === 'assassin_blades'
      ? Math.max(amount, b.channelHitsNeeded || 3)
      : amount;
  b.channelHits = Math.min(b.channelHitsNeeded || 1, (b.channelHits || 0) + effectiveAmount);
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;
  if ((b.channelHits || 0) >= (b.channelHitsNeeded || 1)) {
    const prevKind = b.channelKind;
    b.channelKind = null;
    b.channelTimer = 0;
    b.channelLabel = '';
    b.channelNodes = [];
    b.channelTargetPlayerId = undefined;
    b.channelTetherPair = undefined;
    b.health = Math.max(1, b.health - 1);
    rt.score += Math.round(480 * getScoreMult(rt));
    rt.tutorialCounterDone = true;
    addFloatingText(
      rt,
      cx,
      cy - 52,
      prevKind === 'hunter_mark'
        ? `${player.name.toUpperCase()} BROKE LOCK!`
        : prevKind === 'emp_interrupt'
        ? `${player.name.toUpperCase()} COUNTERED EMP!`
        : prevKind === 'mirage_ambush'
        ? `${player.name.toUpperCase()} SHATTERED MIRAGE!`
        : `${player.name.toUpperCase()} INTERRUPTED!`,
      prevKind === 'emp_interrupt' || prevKind === 'mirage_ambush' ? '#e879f9' : '#c084fc',
      1.3
    );
    triggerBossExposedWindow(
      rt,
      prevKind === 'hunter_mark'
        ? 'SNIPER LOCK STAGGERED!'
        : prevKind === 'emp_interrupt'
        ? 'UNAVOIDABLE EMP INTERRUPTED — 2X STAGGER!'
        : prevKind === 'mirage_ambush'
        ? 'SHADOW COUNTER BROKEN — 2X STAGGER!'
        : 'RITUAL INTERRUPTED — 2X CRITICAL DMG!'
    );
  } else {
    addFloatingText(
      rt,
      cx,
      cy - 44,
      b.channelKind === 'emp_interrupt'
        ? `EMP BREAK ${b.channelHits}/${b.channelHitsNeeded}!`
        : b.channelKind === 'mirage_ambush'
        ? `MIRAGE BREAK ${b.channelHits}/${b.channelHitsNeeded}!`
        : `STAGGER ${b.channelHits}/${b.channelHitsNeeded}!`,
      '#e879f9',
      1.15
    );
  }
}

function updateBossCounterChannel(rt: GameRuntime, dt: number) {
  const b = rt.boss;
  if (!b.channelKind || b.health <= 0 || b.state === 'dead' || b.state === 'weakened') {
    if (b.state === 'weakened' || b.state === 'dead') {
      b.channelKind = null;
      b.channelTimer = 0;
      b.channelLabel = '';
      b.channelNodes = [];
      b.channelTargetPlayerId = undefined;
      b.channelTetherPair = undefined;
    }
    return;
  }

  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;
  const hasTank = partyHasTank(rt);
  const tw = getTeamworkDiffScale(rt);
  const prevTimer = b.channelTimer || 0;

  if (b.channelKind === 'cursed_floor') {
    b.attackTimer = (b.attackTimer || 0) - dt;
    if (b.attackTimer <= 0) {
      b.attackTimer = (hasTank ? 0.14 : 0.23) * tw.durMult;
      const sx = b.channelSafeX ?? rt.arenaWidth / 2;
      const sy = b.channelSafeY ?? rt.arenaHeight * 0.66;
      const baseAng = Math.atan2(sy - cy, sx - cx);
      const count = hasTank ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const spread =
          hasTank
            ? (i === 0 ? -0.07 : 0.07) + Math.sin(rt.elapsedSeconds * 11 + i) * 0.04
            : Math.sin(rt.elapsedSeconds * 7.5) * 0.18;
        const ang = baseAng + spread;
        const spd = (hasTank ? 7.6 : 6.4) * tw.projSpdMult;
        pushBossProj(rt, {
          uid: rt.nextUid++,
          x: cx,
          y: cy,
          dx: Math.cos(ang) * spd,
          dy: Math.sin(ang) * spd,
          size: 14,
          speed: 1,
          color: '#fb923c',
          damage: Math.max(6, Math.round(18 * tw.dmgMult)),
          shape: 'ember',
        });
      }
      soundEngine.playBossShoot();
    }

    const nextTimerTmp = Math.max(0, prevTimer - dt);
    const maxDur = b.channelMaxTimer || 4.6;
    const lavaStep = 0.55 * tw.durMult;
    if (nextTimerTmp <= maxDur - lavaStep && Math.floor(prevTimer / lavaStep) !== Math.floor(nextTimerTmp / lavaStep)) {
      const sx = b.channelSafeX ?? rt.arenaWidth / 2;
      const sy = b.channelSafeY ?? rt.arenaHeight * 0.66;
      const safeR = b.channelSafeR ?? 98;
      rt.players.forEach((p) => {
        if (p.state !== 'alive') return;
        const pcx = p.x + p.size / 2;
        const pcy = p.y + p.size / 2;
        const onIsland = Math.hypot(pcx - sx, pcy - sy) <= safeR + 10;
        const inSanctuary = rt.skillZones.some(
          (z) =>
            (z.kind === 'sanctuary_dome' || z.kind === 'aegis_beacon') &&
            Math.hypot(pcx - z.x, pcy - z.y) <= z.radius + 10
        );
        if (!onIsland && !inSanctuary) {
          damagePlayer(rt, p, Math.max(5, Math.round(14 * tw.dmgMult)));
        }
      });
    }
  } else if (b.channelKind === 'siege_beam') {
    b.attackTimer = (b.attackTimer || 0) - dt;
    if (b.attackTimer <= 0) {
      b.attackTimer = (hasTank ? 0.32 : 0.42) * tw.durMult;
      const baseAng = b.channelAngle || Math.PI / 2;
      const count = hasTank ? 3 : 4;
      for (let i = 0; i < count; i++) {
        const offset = ((i / Math.max(1, count - 1)) - 0.5) * (hasTank ? 0.44 : 0.88);
        const ang = baseAng + offset + Math.sin(rt.elapsedSeconds * 5 + i) * 0.06;
        const spd = (hasTank ? 6.6 : 7.0) * tw.projSpdMult;
        pushBossProj(rt, {
          uid: rt.nextUid++,
          x: cx,
          y: cy,
          dx: Math.cos(ang) * spd,
          dy: Math.sin(ang) * spd,
          size: 14,
          speed: 1,
          color: '#f43f5e',
          damage: Math.max(6, Math.round(16 * tw.dmgMult)),
          shape: 'lance',
        });
      }
      soundEngine.playBossShoot();
    }
  } else if (b.channelKind === 'gravity_storm') {
    rt.players.forEach((p) => {
      if (p.state !== 'alive' || p.dashImmune) return;
      const pcx = p.x + p.size / 2;
      const pcy = p.y + p.size / 2;
      const inSanctuary = rt.skillZones.some(
        (z) =>
          (z.kind === 'sanctuary_dome' || z.kind === 'aegis_beacon') &&
          Math.hypot(pcx - z.x, pcy - z.y) <= z.radius + 10
      );
      if (inSanctuary) return;
      const dx = cx - pcx;
      const dy = cy - pcy;
      const d = Math.hypot(dx, dy);
      if (d > 48) {
        const pull = 108 * tw.projSpdMult * dt;
        p.x = Math.max(0, Math.min(rt.arenaWidth - p.size, p.x + (dx / d) * pull));
        p.y = Math.max(0, Math.min(rt.arenaHeight - p.size, p.y + (dy / d) * pull));
      }
    });
    b.attackTimer = (b.attackTimer || 0) - dt;
    if (b.attackTimer <= 0) {
      b.attackTimer = 0.42 * tw.durMult;
      const count = rt.difficulty === 'easy' ? 6 : 8;
      const rot = rt.elapsedSeconds * 2.2;
      for (let i = 0; i < count; i++) {
        const ang = rot + (i / count) * Math.PI * 2;
        pushBossProj(rt, {
          uid: rt.nextUid++,
          x: cx,
          y: cy,
          dx: Math.cos(ang) * 5.2 * tw.projSpdMult,
          dy: Math.sin(ang) * 5.2 * tw.projSpdMult,
          size: 14,
          speed: 1,
          color: '#c084fc',
          damage: Math.max(6, Math.round(15 * tw.dmgMult)),
          shape: 'shard',
        });
      }
      soundEngine.playBossShoot();
    }
  } else if (b.channelKind === 'bow_weakpoint' || b.channelKind === 'sky_battery') {
    const isBattery = b.channelKind === 'sky_battery';
    b.attackTimer = (b.attackTimer || 0) - dt;
    if (b.attackTimer <= 0) {
      b.attackTimer = (isBattery ? 0.8 : 0.62) * tw.durMult;
      const shockR = 148;
      rt.energyWaves.push({ x: cx, y: cy, radius: 22, maxRadius: shockR, alpha: 0.72, speed: 340, color: '#fbbf24' });
      rt.players.forEach((pl) => {
        if (pl.state !== 'alive' || pl.dashImmune) return;
        const pcx = pl.x + pl.size / 2;
        const pcy = pl.y + pl.size / 2;
        if (Math.hypot(pcx - cx, pcy - cy) <= shockR) {
          damagePlayer(rt, pl, Math.max(4, Math.round(9 * tw.dmgMult)));
          addFloatingText(rt, pcx, pl.y - 16, 'MELEE SHOCK! STAY RANGED', '#fbbf24', 0.95);
        }
      });
      if (isBattery && b.channelNodes && b.channelNodes.length > 0) {
        const tp = getRandomAlivePlayer(rt);
        const tpx = tp.x + tp.size / 2;
        const tpy = tp.y + tp.size / 2;
        b.channelNodes.forEach((node) => {
          if (node.activated) return;
          const ang = Math.atan2(tpy - node.y, tpx - node.x);
          pushBossProj(rt, {
            uid: rt.nextUid++,
            x: node.x,
            y: node.y,
            dx: Math.cos(ang) * 4.8 * tw.projSpdMult,
            dy: Math.sin(ang) * 4.8 * tw.projSpdMult,
            size: 13,
            speed: 1,
            color: '#34d399',
            damage: Math.max(5, Math.round(13 * tw.dmgMult)),
            shape: 'lance',
          });
        });
      } else {
        const orbs = rt.difficulty === 'easy' ? 4 : 6;
        const rot = rt.elapsedSeconds * 1.5;
        for (let i = 0; i < orbs; i++) {
          const ang = rot + (i / orbs) * Math.PI * 2;
          pushBossProj(rt, {
            uid: rt.nextUid++,
            x: cx,
            y: cy,
            dx: Math.cos(ang) * 4.4 * tw.projSpdMult,
            dy: Math.sin(ang) * 4.4 * tw.projSpdMult,
            size: 13,
            speed: 1,
            color: '#34d399',
            damage: Math.max(5, Math.round(13 * tw.dmgMult)),
            shape: 'shard',
          });
        }
      }
    }
  } else if (b.channelKind === 'emp_interrupt' || b.channelKind === 'mirage_ambush') {
    const isMirage = b.channelKind === 'mirage_ambush';
    b.attackTimer = (b.attackTimer || 0) - dt;
    if (b.attackTimer <= 0) {
      b.attackTimer = (isMirage ? 0.68 : 0.75) * tw.durMult;
      rt.energyWaves.push({ x: cx, y: cy, radius: 16, maxRadius: 210, alpha: 0.75, speed: 380, color: isMirage ? '#c084fc' : '#e879f9' });
      if (isMirage) {
        const blades = rt.difficulty === 'easy' ? 5 : 8;
        const rot = rt.elapsedSeconds * 2.1;
        for (let i = 0; i < blades; i++) {
          const ang = rot + (i / blades) * Math.PI * 2;
          pushBossProj(rt, {
            uid: rt.nextUid++,
            x: cx,
            y: cy,
            dx: Math.cos(ang) * 5.1 * tw.projSpdMult,
            dy: Math.sin(ang) * 5.1 * tw.projSpdMult,
            size: 13,
            speed: 1,
            color: '#e879f9',
            damage: Math.max(5, Math.round(14 * tw.dmgMult)),
            shape: 'shard',
          });
        }
      }
    }
  } else if (b.channelKind === 'cursed_miasma' || b.channelKind === 'blood_curse') {
    const isBlood = b.channelKind === 'blood_curse';
    b.attackTimer = (b.attackTimer || 0) - dt;
    if (b.attackTimer <= 0) {
      b.attackTimer = (isBlood ? 0.98 : 1.08) * tw.durMult;
      rt.energyWaves.push({ x: cx, y: cy, radius: 22, maxRadius: 420, alpha: 0.72, speed: 460, color: isBlood ? '#fb7185' : '#a3e635' });
      rt.players.forEach((pl) => {
        if (pl.state !== 'alive' || pl.dashImmune) return;
        const pcx = pl.x + pl.size / 2;
        const pcy = pl.y + pl.size / 2;
        const inHolyGround = rt.skillZones.some(
          (z) =>
            (z.kind === 'holy_ground' || (isBlood && z.kind === 'sanctuary_dome')) &&
            Math.hypot(pcx - z.x, pcy - z.y) <= z.radius + 12
        );
        if (!inHolyGround) {
          damagePlayer(rt, pl, Math.max(4, Math.round((isBlood ? 9 : 8) * tw.dmgMult)));
        }
      });
      const orbs = rt.difficulty === 'easy' ? 4 : 6;
      const rot = rt.elapsedSeconds * 1.4;
      for (let i = 0; i < orbs; i++) {
        const ang = rot + (i / orbs) * Math.PI * 2;
        pushBossProj(rt, {
          uid: rt.nextUid++,
          x: cx,
          y: cy,
          dx: Math.cos(ang) * 4.2 * tw.projSpdMult,
          dy: Math.sin(ang) * 4.2 * tw.projSpdMult,
          size: 13,
          speed: 1,
          color: isBlood ? '#fb7185' : '#a3e635',
          damage: Math.max(5, Math.round(12 * tw.dmgMult)),
          shape: 'orb',
        });
      }
    }
  } else if (b.channelKind === 'iron_carapace' || b.channelKind === 'obsidian_phalanx') {
    const isPhalanx = b.channelKind === 'obsidian_phalanx';
    b.attackTimer = (b.attackTimer || 0) - dt;
    if (b.attackTimer <= 0) {
      b.attackTimer = (isPhalanx ? 0.78 : 0.85) * tw.durMult;
      const shards = rt.difficulty === 'easy' ? 5 : isPhalanx ? 10 : 8;
      const rot = rt.elapsedSeconds * (isPhalanx ? 2.2 : 1.9);
      for (let i = 0; i < shards; i++) {
        const ang = rot + (i / shards) * Math.PI * 2;
        pushBossProj(rt, {
          uid: rt.nextUid++,
          x: cx,
          y: cy,
          dx: Math.cos(ang) * (isPhalanx ? 5.4 : 5.0) * tw.projSpdMult,
          dy: Math.sin(ang) * (isPhalanx ? 5.4 : 5.0) * tw.projSpdMult,
          size: 14,
          speed: 1,
          color: isPhalanx ? '#f43f5e' : '#fb7185',
          damage: Math.max(5, Math.round((isPhalanx ? 16 : 14) * tw.dmgMult)),
          shape: 'lance',
        });
      }
      soundEngine.playBossShoot();
    }
  } else if (b.channelKind === 'abyss_tether' && b.channelTetherPair) {
    const [idA, idB] = b.channelTetherPair;
    const pA = rt.players.find((pl) => pl.id === idA && pl.state === 'alive');
    const pB = idB !== idA ? rt.players.find((pl) => pl.id === idB && pl.state === 'alive') : undefined;
    if (!pA || (idB !== idA && !pB)) {
      triggerBossExposedWindow(rt, 'TETHER DISSIPATED — BOSS EXPOSED!');
      return;
    }
    const ax = pA.x + pA.size / 2;
    const ay = pA.y + pA.size / 2;
    const bxT = pB ? pB.x + pB.size / 2 : cx;
    const byT = pB ? pB.y + pB.size / 2 : cy;
    const dist = Math.hypot(bxT - ax, byT - ay);

    // Tank [E] Shield or Sanctuary Dome near either bound ally also purifies the tether!
    const purifiedByTank = rt.players.some((t) => {
      if (t.state !== 'alive' || t.frontShieldTimer <= 0) return false;
      const tx = t.x + t.size / 2;
      const ty = t.y + t.size / 2;
      return Math.hypot(tx - ax, ty - ay) <= 98 || (pB ? Math.hypot(tx - bxT, ty - byT) <= 98 : false);
    });

    if (dist >= 340 || purifiedByTank) {
      soundEngine.playParry();
      rt.score += 480;
      rt.tutorialCounterDone = true;
      rt.energyWaves.push({ x: (ax + bxT) / 2, y: (ay + byT) / 2, radius: 14, maxRadius: 210, alpha: 0.9, speed: 500, color: '#c084fc' });
      addFloatingText(
        rt,
        (ax + bxT) / 2,
        (ay + byT) / 2 - 20,
        purifiedByTank ? 'TANK SEVERED TETHER!' : 'SOUL TETHER SNAPPED!',
        '#22d3ee',
        1.25
      );
      triggerBossExposedWindow(rt, 'TETHER SNAPPED — 2X CRITICAL DMG!');
      return;
    }

    b.attackTimer = (b.attackTimer || 0) - dt;
    if (b.attackTimer <= 0) {
      b.attackTimer = 0.78 * tw.durMult;
      const tDmg = Math.max(4, Math.round(7 * tw.dmgMult));
      damagePlayer(rt, pA, tDmg);
      if (pB) damagePlayer(rt, pB, tDmg);
    }
  } else if (b.channelKind === 'demon_seal_purge') {
    rt.players.forEach((pl) => {
      if (pl.state !== 'alive' || !pl.sealed) return;
      const px = pl.x + pl.size / 2;
      const py = pl.y + pl.size / 2;
      const inSanctuary = rt.skillZones.some(
        (z) =>
          (z.kind === 'sanctuary_dome' || z.kind === 'aegis_beacon') &&
          Math.hypot(px - z.x, py - z.y) <= z.radius + 14
      );
      const nearTankShield = rt.players.some(
        (t) =>
          t.state === 'alive' &&
          t.frontShieldTimer > 0 &&
          Math.hypot(px - (t.x + t.size / 2), py - (t.y + t.size / 2)) <= 120
      );
      if (inSanctuary || nearTankShield) {
        pl.sealed = false;
        pl.sealTimer = 0;
        addFloatingText(rt, px, pl.y - 24, 'SEAL PURGED!', '#22d3ee', 1.05);
      }
    });
    const stillSealed = rt.players.filter((pl) => pl.state === 'alive' && pl.sealed);
    b.channelHits = (b.channelHitsNeeded || 1) - stillSealed.length;
    if (stillSealed.length === 0) {
      soundEngine.playParry();
      rt.score += 460;
      rt.tutorialCounterDone = true;
      triggerBossExposedWindow(rt, 'ALL SEALS PURGED — ONI STAGGERED!');
      return;
    }
  } else if (b.channelKind === 'meteor_soak') {
    const target = rt.players.find((pl) => pl.id === b.channelTargetPlayerId && pl.state === 'alive');
    if (target) {
      b.channelSafeX = target.x + target.size / 2;
      b.channelSafeY = target.y + target.size / 2;
    }
  }

  b.channelTimer = Math.max(0, prevTimer - dt);
  if (b.channelTimer > 0) return;

  const kind = b.channelKind;
  const savedAngle = b.channelAngle || Math.PI / 2;
  const savedSafeX = b.channelSafeX ?? rt.arenaWidth * 0.5;
  const savedSafeY = b.channelSafeY ?? rt.arenaHeight * 0.66;
  const savedSafeR = b.channelSafeR ?? 98;
  const savedTargetId = b.channelTargetPlayerId;
  const savedTetherPair = b.channelTetherPair;
  b.channelKind = null;
  b.channelLabel = '';
  b.channelNodes = [];
  b.channelTargetPlayerId = undefined;
  b.channelTetherPair = undefined;
  if (b.state !== 'phase_transition') {
    b.state = 'idle';
    b.stateTimer = rt.isTeamworkPractice ? 2.4 : 2.0;
  }

  if (kind === 'cursed_floor') {
    soundEngine.playShockwave();
    rt.screenShake = Math.max(rt.screenShake, 22);
    rt.warningFlash = 0.42;
    rt.energyWaves.push({ x: cx, y: cy, radius: 24, maxRadius: 1200, alpha: 0.9, speed: 880, color: '#ef4444' });
    rt.energyWaves.push({ x: savedSafeX, y: savedSafeY, radius: savedSafeR, maxRadius: savedSafeR + 120, alpha: 0.95, speed: 340, color: '#34d399' });

    let survivedCount = 0;
    rt.players.forEach((p) => {
      if (p.state !== 'alive') return;
      const pcx = p.x + p.size / 2;
      const pcy = p.y + p.size / 2;
      const insideIsland = Math.hypot(pcx - savedSafeX, pcy - savedSafeY) <= savedSafeR + 14;
      const inSanctuary = rt.skillZones.some(
        (z) =>
          (z.kind === 'sanctuary_dome' || z.kind === 'aegis_beacon') &&
          Math.hypot(pcx - z.x, pcy - z.y) <= z.radius + 14
      );
      if (insideIsland || inSanctuary) {
        survivedCount++;
        addFloatingText(rt, pcx, p.y - 16, 'PARTY SURVIVED!', '#34d399', 1.15);
      } else {
        damagePlayer(rt, p, Math.max(8, Math.round(24 * tw.dmgMult)));
      }
    });
    if (survivedCount > 0) {
      rt.score += survivedCount * 200;
      soundEngine.playParry();
    }
  } else if (kind === 'siege_beam') {
    soundEngine.playShockwave();
    rt.screenShake = Math.max(rt.screenShake, 26);
    rt.warningFlash = 0.45;
    rt.energyWaves.push({ x: cx, y: cy, radius: 22, maxRadius: 950, alpha: 0.92, speed: 920, color: '#f43f5e' });

    if (hasTank) {
      let blockedCount = 0;
      rt.players.forEach((p) => {
        if (p.state !== 'alive') return;
        const pcx = p.x + p.size / 2;
        const pcy = p.y + p.size / 2;
        const angToPlayer = Math.atan2(pcy - cy, pcx - cx);
        const insideCone = Math.abs(wrapAngleDiff(angToPlayer, savedAngle)) <= 0.64;
        if (!insideCone) return;

        const inSanctuary = rt.skillZones.some(
          (z) =>
            (z.kind === 'sanctuary_dome' || z.kind === 'aegis_beacon') &&
            Math.hypot(pcx - z.x, pcy - z.y) <= z.radius + 12
        );
        if (inSanctuary || isBehindTankShield(rt, p, cx, cy)) {
          blockedCount++;
          rt.tutorialCounterDone = true;
          addFloatingText(rt, pcx, p.y - 16, 'AEGIS COVER!', '#38bdf8', 1.15);
        } else {
          damagePlayer(rt, p, Math.max(10, Math.round(34 * tw.dmgMult)));
        }
      });
      if (blockedCount > 0) {
        rt.score += blockedCount * 240;
        soundEngine.playParry();
        addFloatingText(rt, cx, cy - 42, 'SIEGE CONE DEFLECTED!', '#38bdf8', 1.25);
      }
    } else {
      const waveShots = rt.difficulty === 'easy' ? 10 : 14;
      for (let i = 0; i < waveShots; i++) {
        if (i % 5 === 2) continue;
        const spread = ((i / (waveShots - 1)) - 0.5) * 1.18;
        const ang = savedAngle + spread;
        pushBossProj(rt, {
          uid: rt.nextUid++,
          x: cx,
          y: cy,
          dx: Math.cos(ang) * 7.8 * tw.projSpdMult,
          dy: Math.sin(ang) * 7.8 * tw.projSpdMult,
          size: 15,
          speed: 1,
          color: '#fb7185',
          damage: Math.max(8, Math.round(24 * tw.dmgMult)),
          shape: 'lance',
        });
      }
      addFloatingText(rt, cx, cy - 42, 'CONE BARRAGE UNLEASHED!', '#fb7185', 1.2);
    }
  } else if (kind === 'gravity_storm') {
    soundEngine.playShockwave();
    rt.screenShake = Math.max(rt.screenShake, 24);
    rt.energyWaves.push({ x: cx, y: cy, radius: 18, maxRadius: 420, alpha: 0.94, speed: 640, color: '#c084fc' });
    rt.players.forEach((p) => {
      if (p.state !== 'alive') return;
      const pcx = p.x + p.size / 2;
      const pcy = p.y + p.size / 2;
      const inSanctuary = rt.skillZones.some(
        (z) =>
          (z.kind === 'sanctuary_dome' || z.kind === 'aegis_beacon') &&
          Math.hypot(pcx - z.x, pcy - z.y) <= z.radius + 14
      );
      if (Math.hypot(pcx - cx, pcy - cy) <= 230) {
        if (inSanctuary || isBehindTankShield(rt, p, cx, cy)) {
          addFloatingText(rt, pcx, p.y - 16, 'VORTEX GUARDED!', '#38bdf8', 1.1);
        } else {
          damagePlayer(rt, p, Math.max(9, Math.round(28 * tw.dmgMult)));
        }
      }
    });
    const orbCount = rt.difficulty === 'easy' ? 8 : 12;
    for (let i = 0; i < orbCount; i++) {
      const ang = (i / orbCount) * Math.PI * 2;
      pushBossProj(rt, {
        uid: rt.nextUid++,
        x: cx,
        y: cy,
        dx: Math.cos(ang) * 5.8 * tw.projSpdMult,
        dy: Math.sin(ang) * 5.8 * tw.projSpdMult,
        size: 15,
        speed: 1,
        color: '#c084fc',
        damage: Math.max(7, Math.round(18 * tw.dmgMult)),
        shape: 'orb',
      });
    }
  } else if (kind === 'hunter_mark') {
    const target = rt.players.find((pl) => pl.id === savedTargetId && pl.state === 'alive');
    soundEngine.playShockwave();
    rt.screenShake = Math.max(rt.screenShake, 22);
    if (target) {
      const tx = target.x + target.size / 2;
      const ty = target.y + target.size / 2;
      const inSanctuary = rt.skillZones.some(
        (z) =>
          (z.kind === 'sanctuary_dome' || z.kind === 'aegis_beacon') &&
          Math.hypot(tx - z.x, ty - z.y) <= z.radius + 12
      );
      const intercepted =
        inSanctuary || isBehindTankShield(rt, target, cx, cy) || doesTankInterceptLine(rt, cx, cy, tx, ty);
      rt.comicSlashes.push({
        x: cx,
        y: cy,
        angle: Math.atan2(ty - cy, tx - cx),
        length: Math.hypot(tx - cx, ty - cy) + 40,
        alpha: 0.95,
        thickness: 8,
        timer: 0,
        lifetime: 0.45,
      });
      if (intercepted) {
        soundEngine.playParry();
        rt.score += 360;
        addFloatingText(rt, tx, target.y - 20, 'SNIPER INTERCEPTED BY TANK!', '#38bdf8', 1.25);
      } else {
        damagePlayer(rt, target, Math.max(12, Math.round(42 * tw.dmgMult)));
        addFloatingText(rt, tx, target.y - 20, 'EXECUTION SHOT!', '#ef4444', 1.25);
      }
    }
  } else if (kind === 'bow_weakpoint' || kind === 'sky_battery') {
    const isBattery = kind === 'sky_battery';
    soundEngine.playShockwave();
    rt.screenShake = Math.max(rt.screenShake, 20);
    rt.energyWaves.push({ x: cx, y: cy, radius: 20, maxRadius: 520, alpha: 0.9, speed: 620, color: '#34d399' });
    addFloatingText(rt, cx, cy - 40, isBattery ? 'SKY BATTERY OVERLOAD!' : 'CORE VENTED!', '#34d399', 1.2);
    if (isBattery) {
      rt.players.forEach((p) => {
        if (p.state === 'alive') {
          damagePlayer(rt, p, Math.max(7, Math.round(22 * tw.dmgMult)));
        }
      });
    }
    const burst = rt.difficulty === 'easy' ? 8 : 14;
    for (let i = 0; i < burst; i++) {
      const ang = (i / burst) * Math.PI * 2;
      pushBossProj(rt, {
        uid: rt.nextUid++,
        x: cx,
        y: cy,
        dx: Math.cos(ang) * 5.8 * tw.projSpdMult,
        dy: Math.sin(ang) * 5.8 * tw.projSpdMult,
        size: 14,
        speed: 1,
        color: '#34d399',
        damage: Math.max(6, Math.round(16 * tw.dmgMult)),
        shape: 'shard',
      });
    }
  } else if (kind === 'emp_interrupt' || kind === 'mirage_ambush') {
    const isMirage = kind === 'mirage_ambush';
    soundEngine.playShockwave();
    rt.screenShake = Math.max(rt.screenShake, 28);
    rt.warningFlash = 0.55;
    rt.energyWaves.push({ x: cx, y: cy, radius: 24, maxRadius: 1200, alpha: 0.96, speed: 940, color: '#f43f5e' });
    rt.energyWaves.push({ x: cx, y: cy, radius: 18, maxRadius: 960, alpha: 0.9, speed: 740, color: '#e879f9' });
    addFloatingText(
      rt,
      cx,
      cy - 44,
      isMirage ? 'SHADOW AMBUSH DETONATION!' : 'UNAVOIDABLE EMP DETONATION!',
      '#f43f5e',
      1.35
    );
    const loopDmgMult = 1 + Math.max(0, rt.loopLevel - 1) * 0.16;
    rt.players.forEach((p) => {
      if (p.state !== 'alive' || p.invulnerable || rt.cheats.godMode) return;
      const pcx = p.x + p.size / 2;
      const pcy = p.y + p.size / 2;
      const inSanctuary = rt.skillZones.some(
        (z) =>
          (z.kind === 'sanctuary_dome' || z.kind === 'aegis_beacon') &&
          Math.hypot(pcx - z.x, pcy - z.y) <= z.radius + 14
      );
      const baseEmp = inSanctuary ? 16 : isMirage ? 30 : 34;
      const empDmg = Math.max(7, Math.round(baseEmp * tw.dmgMult * loopDmgMult));
      p.hp = Math.max(0, p.hp - empDmg);
      p.cleanDodgeFailed = true;
      soundEngine.playPlayerHit();
      addFloatingText(rt, pcx, p.y - 18, `${isMirage ? 'AMBUSH' : 'EMP'} -${empDmg}`, '#f43f5e', 1.25);
      if (p.hp <= 0) {
        p.state = 'down';
        p.hp = 0;
        p.reviveProgress = 0;
        p.hasKnife = false;
      }
    });
  } else if (kind === 'cursed_miasma' || kind === 'blood_curse') {
    const isBlood = kind === 'blood_curse';
    soundEngine.playShockwave();
    rt.screenShake = Math.max(rt.screenShake, 22);
    rt.energyWaves.push({ x: cx, y: cy, radius: 22, maxRadius: 720, alpha: 0.92, speed: 620, color: isBlood ? '#fb7185' : '#a3e635' });
    addFloatingText(rt, cx, cy - 44, isBlood ? 'BLOOD CURSE ERUPTION!' : 'PLAGUE ERUPTION!', isBlood ? '#fb7185' : '#a3e635', 1.25);
    if (isBlood) {
      const heal = Math.max(1, Math.round(b.maxHealth * (rt.difficulty === 'easy' ? 0.02 : 0.04)));
      b.health = Math.min(b.maxHealth, b.health + heal);
    }
    rt.players.forEach((p) => {
      if (p.state !== 'alive') return;
      const pcx = p.x + p.size / 2;
      const pcy = p.y + p.size / 2;
      const inHolyGround = rt.skillZones.some(
        (z) =>
          (z.kind === 'holy_ground' || (isBlood && z.kind === 'sanctuary_dome')) &&
          Math.hypot(pcx - z.x, pcy - z.y) <= z.radius + 14
      );
      if (!inHolyGround) {
        damagePlayer(rt, p, Math.max(7, Math.round((isBlood ? 24 : 22) * tw.dmgMult)));
      } else {
        addFloatingText(rt, pcx, p.y - 18, 'BLESSED WARD!', '#fde047', 1.1);
      }
    });
    const orbs = rt.difficulty === 'easy' ? 7 : 10;
    for (let i = 0; i < orbs; i++) {
      const ang = (i / orbs) * Math.PI * 2;
      pushBossProj(rt, {
        uid: rt.nextUid++,
        x: cx,
        y: cy,
        dx: Math.cos(ang) * 4.8 * tw.projSpdMult,
        dy: Math.sin(ang) * 4.8 * tw.projSpdMult,
        size: 14,
        speed: 1,
        color: isBlood ? '#fb7185' : '#a3e635',
        damage: Math.max(6, Math.round(16 * tw.dmgMult)),
        shape: 'orb',
      });
    }
  } else if (kind === 'iron_carapace' || kind === 'obsidian_phalanx') {
    const isPhalanx = kind === 'obsidian_phalanx';
    soundEngine.playShockwave();
    rt.screenShake = Math.max(rt.screenShake, 24);
    rt.energyWaves.push({ x: cx, y: cy, radius: 24, maxRadius: 680, alpha: 0.94, speed: 700, color: '#fb7185' });
    addFloatingText(
      rt,
      cx,
      cy - 44,
      isPhalanx ? 'PHALANX SHATTER WAVE!' : 'CARAPACE SHRAPNEL BLAST!',
      '#fb7185',
      1.25
    );
    rt.players.forEach((p) => {
      if (p.state !== 'alive') return;
      if (Math.hypot(p.x + p.size / 2 - cx, p.y + p.size / 2 - cy) <= (isPhalanx ? 300 : 270)) {
        damagePlayer(rt, p, Math.max(8, Math.round((isPhalanx ? 28 : 26) * tw.dmgMult)));
      }
    });
    const shrapnel = rt.difficulty === 'easy' ? 8 : isPhalanx ? 14 : 12;
    for (let i = 0; i < shrapnel; i++) {
      const ang = (i / shrapnel) * Math.PI * 2;
      pushBossProj(rt, {
        uid: rt.nextUid++,
        x: cx,
        y: cy,
        dx: Math.cos(ang) * 5.6 * tw.projSpdMult,
        dy: Math.sin(ang) * 5.6 * tw.projSpdMult,
        size: 15,
        speed: 1,
        color: '#fb7185',
        damage: Math.max(6, Math.round(17 * tw.dmgMult)),
        shape: 'lance',
      });
    }
  } else if (kind === 'abyss_tether') {
    soundEngine.playShockwave();
    rt.screenShake = Math.max(rt.screenShake, 22);
    const [idA, idB] = savedTetherPair || [1, 1];
    rt.players.forEach((pl) => {
      if (pl.state === 'alive' && (pl.id === idA || pl.id === idB)) {
        damagePlayer(rt, pl, Math.max(10, Math.round(32 * tw.dmgMult)));
        addFloatingText(rt, pl.x + pl.size / 2, pl.y - 18, 'TETHER COLLAPSE!', '#c084fc', 1.2);
      }
    });
    const orbs = rt.difficulty === 'easy' ? 7 : 10;
    for (let i = 0; i < orbs; i++) {
      const ang = (i / orbs) * Math.PI * 2;
      pushBossProj(rt, {
        uid: rt.nextUid++,
        x: cx,
        y: cy,
        dx: Math.cos(ang) * 5.2 * tw.projSpdMult,
        dy: Math.sin(ang) * 5.2 * tw.projSpdMult,
        size: 14,
        speed: 1,
        color: '#c084fc',
        damage: Math.max(6, Math.round(16 * tw.dmgMult)),
        shape: 'shard',
      });
    }
  } else if (kind === 'demon_seal_purge') {
    soundEngine.playShockwave();
    rt.screenShake = Math.max(rt.screenShake, 22);
    rt.players.forEach((pl) => {
      if (pl.state === 'alive' && pl.sealed) {
        pl.sealed = false;
        pl.sealTimer = 0;
        const px = pl.x + pl.size / 2;
        const py = pl.y + pl.size / 2;
        damagePlayer(rt, pl, Math.max(11, Math.round(36 * tw.dmgMult)));
        rt.energyWaves.push({ x: px, y: py, radius: 14, maxRadius: 180, alpha: 0.92, speed: 460, color: '#f97316' });
        addFloatingText(rt, px, pl.y - 20, 'SEAL DETONATED!', '#f97316', 1.25);
        rt.oniCursedZones.push({
          x: px,
          y: py,
          radius: 42,
          maxRadius: 96,
          growthRate: 60,
          lifetime: 4.5,
          damageTimer: 0,
          alpha: 0.72,
          color: '#f97316',
        });
      }
    });
  } else if (kind === 'meteor_soak') {
    soundEngine.playShockwave();
    rt.screenShake = Math.max(rt.screenShake, 26);
    rt.warningFlash = 0.42;
    const soakR = savedSafeR || 142;
    rt.energyWaves.push({ x: savedSafeX, y: savedSafeY, radius: 18, maxRadius: soakR + 110, alpha: 0.96, speed: 620, color: '#fbbf24' });
    const inside = rt.players.filter(
      (pl) =>
        pl.state === 'alive' &&
        Math.hypot(pl.x + pl.size / 2 - savedSafeX, pl.y + pl.size / 2 - savedSafeY) <= soakR + 14
    );
    const hasShieldInRing = inside.some(
      (pl) =>
        pl.frontShieldTimer > 0 ||
        rt.skillZones.some(
          (z) =>
            (z.kind === 'sanctuary_dome' || z.kind === 'aegis_beacon') &&
            Math.hypot(pl.x + pl.size / 2 - z.x, pl.y + pl.size / 2 - z.y) <= z.radius + 16
        )
    );
    if (hasShieldInRing) {
      soundEngine.playParry();
      rt.score += inside.length * 240;
      rt.tutorialCounterDone = true;
      addFloatingText(rt, savedSafeX, savedSafeY - 30, 'METEOR AEGIS GUARDED (0 DMG)!', '#38bdf8', 1.3);
    } else if (inside.length > 0) {
      const splitDmg = Math.max(8, Math.round((68 * tw.dmgMult) / inside.length));
      inside.forEach((pl) => {
        damagePlayer(rt, pl, splitDmg);
        addFloatingText(
          rt,
          pl.x + pl.size / 2,
          pl.y - 16,
          inside.length >= 2 ? `SHARED SOAK -${splitDmg}` : `UNSHARED CRUSH -${splitDmg}!`,
          inside.length >= 2 ? '#fbbf24' : '#ef4444',
          1.15
        );
      });
      if (inside.length >= 2) rt.score += 320;
    }
  } else if (kind === 'interrupt') {
    const heal = Math.max(2, Math.round(b.maxHealth * (rt.difficulty === 'easy' ? 0.03 : 0.06)));
    b.health = Math.min(b.maxHealth, b.health + heal);
    soundEngine.playBossPhase2();
    rt.energyWaves.push({ x: cx, y: cy, radius: 14, maxRadius: 440, alpha: 0.9, speed: 460, color: '#c084fc' });
    addFloatingText(rt, cx, cy - 44, `RITUAL COMPLETE (+${heal} BOSS HP)`, '#f43f5e', 1.2);
    const shards = rt.difficulty === 'easy' ? 9 : 14;
    for (let i = 0; i < shards; i++) {
      const ang = (i / shards) * Math.PI * 2;
      pushBossProj(rt, {
        uid: rt.nextUid++,
        x: cx,
        y: cy,
        dx: Math.cos(ang) * 4.8 * tw.projSpdMult,
        dy: Math.sin(ang) * 4.8 * tw.projSpdMult,
        size: 15,
        speed: 1,
        color: '#c084fc',
        damage: Math.max(6, Math.round(18 * tw.dmgMult)),
        shape: 'shard',
      });
    }
  }
}

function completeBossAttackCycle(rt: GameRuntime, isP2: boolean) {
  const b = rt.boss;
  rt.players.forEach((p) => {
    if (p.state === 'alive' && !p.cleanDodgeFailed) {
      awardCleanDodge(rt, p);
    }
    p.cleanDodgeFailed = false;
  });

  b.attacksBeforeVulnerable++;
  b.attackLabel = '';
  if (b.attacksBeforeVulnerable >= b.attacksNeeded) {
    triggerBossExposedWindow(rt);
    return;
  }

  // Trigger Nightmare / Loop 2+ All-Boss Teamwork Mechanics
  if (!b.channelKind && isTeamworkChaosActive(rt) && b.attacksBeforeVulnerable >= 1) {
    startBossCounterChannel(rt);
  }

  const { pace } = getDiffScale(rt);
  b.state = 'idle';
  b.stateTimer =
    rt.difficulty === 'hard'
      ? isP2
        ? 1.45
        : 1.85
      : (isP2 ? 1.75 : 2.35) / Math.min(1.25, pace);
}

function rtOrNull(rt: GameRuntime): GameRuntime {
  return rt;
}

export function switchTutorialClass(rt: GameRuntime, heroClass: HeroClassId) {
  if (!rt.isTutorial) return;
  const p = rt.players[0];
  const def = HERO_CLASSES.find((c) => c.id === heroClass) || HERO_CLASSES[0];
  rt.isOnlineCampaign = false;
  rt.tutorialWeapon = 'none';
  p.weapon = 'none';
  p.heroClass = heroClass;
  p.unlockedSkillTier = 4;
  p.speed = def.baseSpeed;
  p.dashCooldown = def.dashCooldown;
  p.skillMaxCooldowns = [
    def.skills[0].cooldown,
    def.skills[1].cooldown,
    def.skills[2].cooldown,
    def.skills[3].cooldown,
  ];
  p.skillCooldowns = [0, 0, 0, 0];
  p.abilityCooldown = def.skillCooldown;
  p.dashTime = heroClass === 'ronin' ? 0.18 : 0.16;
  p.maxHp = rt.diffSettings.baseMaxHp + def.bonusHp + (p.bonusMaxHp || 0);
  p.hp = p.maxHp;
  p.hasShield = heroClass === 'vanguard';
  p.shieldRegenTimer = heroClass === 'vanguard' ? 24 : 0;
  p.dashReady = true;
  p.dashCooldownTimer = 0;
  p.abilityReady = true;
  p.abilityCooldownTimer = 0;
  p.cloakTimer = 0;
  p.overdriveTimer = 0;
  rt.playerClasses[1] = heroClass;
  soundEngine.playBoonSelect();
  addFloatingText(rt, p.x + p.size / 2, p.y - 18, `${def.name} EQUIPPED`, def.accent, 1.1);
}

export function switchTutorialWeapon(rt: GameRuntime, weaponId: WeaponId) {
  if (!rt.isTutorial) return;
  const p = rt.players[0];
  rt.tutorialWeapon = weaponId;
  if (weaponId === 'none') {
    switchTutorialClass(rt, p.heroClass);
    return;
  }
  rt.isOnlineCampaign = true;
  p.learnedSkills[weaponId] = [1, 2, 3, 4];
  if (p.weaponCooldowns) delete p.weaponCooldowns[weaponId];
  p.tankShieldReady = true;
  p.shieldRegenTimer = 0;
  equipWeapon(rt, p, weaponId);
  p.unlockedSkillTier = 4;
  p.learnedSkills[weaponId] = [1, 2, 3, 4];
  p.skillCooldowns = [0, 0, 0, 0];
  if (p.weaponCooldowns) p.weaponCooldowns[weaponId] = [0, 0, 0, 0];
  p.abilityReady = true;
  p.abilityCooldownTimer = 0;
  p.hp = p.maxHp;
}

export function switchPracticeWeapon(rt: GameRuntime, playerId: PlayerId, weaponId: WeaponClassId) {
  if (!rt.isTeamworkPractice) return;
  const p = rt.players.find((pl) => pl.id === playerId && pl.state !== 'spectator');
  if (!p) return;
  p.weapon = 'none';
  p.learnedSkills[weaponId] = [1, 2, 3, 4];
  if (p.weaponCooldowns) delete p.weaponCooldowns[weaponId];
  p.tankShieldReady = true;
  p.shieldRegenTimer = 0;
  equipWeapon(rt, p, weaponId);
  p.unlockedSkillTier = 4;
  p.learnedSkills[weaponId] = [1, 2, 3, 4];
  p.skillCooldowns = [0, 0, 0, 0];
  if (p.weaponCooldowns) p.weaponCooldowns[weaponId] = [0, 0, 0, 0];
  p.abilityReady = true;
  p.abilityCooldownTimer = 0;
  p.hp = p.maxHp;
  if (playerId === 1) rt.practiceWeapon = weaponId;
}

export function triggerPracticeAttack(
  rt: GameRuntime,
  kind?: BossChannelKind
) {
  if (!rt.isTeamworkPractice) return;
  rt.boss.channelKind = null;
  rt.boss.channelTimer = 0;
  rt.boss.channelLabel = '';
  rt.boss.channelNodes = [];
  rt.boss.channelTargetPlayerId = undefined;
  rt.boss.channelTetherPair = undefined;
  rt.bossProjectiles = [];
  rt.telegraphLines = [];
  rt.players.forEach((pl) => {
    pl.sealed = false;
    pl.sealTimer = 0;
    if (pl.state === 'alive') {
      pl.skillCooldowns = [0, 0, 0, 0];
      pl.weaponCooldowns = {};
      pl.abilityReady = true;
      pl.abilityCooldownTimer = 0;
    }
  });
  if (rt.boss.state === 'weakened' || rt.boss.state === 'phase_transition') {
    rt.boss.state = 'idle';
    rt.boss.stateTimer = 1.6;
  }
  const pool = getBossTeamworkPool(rt.bossType, rt.boss.variantId);
  const seq = rt.boss.channelSeqCount || 0;
  const chosenKind = kind || pool[seq % pool.length];
  startBossCounterChannel(rt, chosenKind);
  rt.practiceAttackTimer = 5.5;
}

export function switchPracticeBoss(
  rt: GameRuntime,
  stage: 'mechaBoss' | 'voidBoss' | 'oniBoss' | 'eclipseBoss',
  variantId?: BossVariantId
) {
  if (!rt.isTeamworkPractice) return;
  setupBossStage(rt, stage, variantId);
  skipBossIntro(rt);
  rt.introPlaying = false;
  rt.fadeOpacity = 0;
  rt.players.forEach((pl) => {
    if (pl.state === 'spectator') return;
    pl.state = 'alive';
    pl.hp = pl.maxHp;
    pl.y = Math.round(rt.arenaHeight * 0.7);
    pl.invulnerable = false;
    pl.sealed = false;
    pl.sealTimer = 0;
    pl.skillCooldowns = [0, 0, 0, 0];
    pl.abilityReady = true;
    pl.abilityCooldownTimer = 0;
  });
  rt.practiceAttackTimer = 1.5;
}

export function advanceTutorialStep(rt: GameRuntime) {
  if (!rt.isTutorial) return;
  rt.bossProjectiles = [];
  rt.telegraphLines = [];
  rt.enemies = [];
  rt.skillZones = [];
  rt.boss.channelKind = null;
  rt.boss.channelTimer = 0;
  if (rt.tutorialStep < 5) {
    rt.tutorialStep++;
  } else {
    rt.tutorialStep = 1;
    rt.kills = 0;
  }
  rt.tutorialSkillUses = 0;
  rt.tutorialCounterDone = false;
  rt.tutorialGrazesStart = rt.grazes;
  rt.tutorialFireTimer = 0.5;
  const p = rt.players[0];
  p.hp = p.maxHp;
  p.abilityReady = true;
  p.abilityCooldownTimer = 0;
  p.skillCooldowns = [0, 0, 0, 0];
  p.dashReady = true;
  p.cleanDodgeFailed = false;
  if (rt.tutorialStep === 5) {
    p.potions = Math.max(2, p.potions);
    p.hp = Math.max(40, p.hp - 30);
  }
  soundEngine.playParry();

  const titles: Record<number, string> = {
    1: 'DRILL 1 · GRAB BLADE ORB & SLICE',
    2: 'DRILL 2 · CLEAN DODGE WITHOUT TAKING HITS',
    3: 'DRILL 3 · TEST CLASS & WEAPON SKILLS [E/Q/R/F]',
    4: 'DRILL 4 · 100 HP & HEAVY ATTACK TIERS',
    5: 'DRILL 5 · INVENTORY [I], DROP, FLASK [C] & ELITES',
  };
  showPhaseAnnounce(rt, titles[rt.tutorialStep] || 'TRAINING DRILL', '#fbbf24', 2.6);
}

function pushBossProj(rt: GameRuntime, proj: BossProjectile) {
  const cap = rt.difficulty === 'hard' ? 230 : MAX_BOSS_PROJECTILES;
  if (rt.bossProjectiles.length >= cap) {
    rt.bossProjectiles.shift();
  }
  rt.bossProjectiles.push(proj);
}

function addParticle(rt: GameRuntime, p: Particle) {
  if (rt.dustParticles.length >= MAX_PARTICLES) rt.dustParticles.shift();
  rt.dustParticles.push(p);
}

function addFloatingText(rt: GameRuntime, x: number, y: number, text: string, color: string, scale = 1) {
  if (rt.floatingTexts.length > 24) rt.floatingTexts.shift();
  rt.floatingTexts.push({
    x,
    y,
    dy: -48,
    text,
    color,
    alpha: 1,
    lifetime: 0.85,
    scale,
  });
}

function addSlashArc(rt: GameRuntime, x: number, y: number, angle: number, color: string, radius = 44) {
  rt.slashArcs.push({
    x,
    y,
    angle,
    radius,
    color,
    alpha: 1,
    lifetime: 0.24,
    timer: 0,
  });
}

function showPhaseAnnounce(rt: GameRuntime, text: string, color: string, duration = 2.2) {
  rt.phaseAnnounce = { text, color };
  rt.phaseAnnounceTimer = duration;
}

function hasBoon(rt: GameRuntime, boon: BoonId): boolean {
  return rt.activeBoons.includes(boon);
}

export function getBoonChoices(rt: GameRuntime): BoonDef[] {
  const available = BOONS_CATALOG.filter((b) => !rt.activeBoons.includes(b.id));
  const pool = available.length >= 3 ? available : BOONS_CATALOG;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
}

export function applyBoon(rt: GameRuntime, boonId: BoonId) {
  if (!rt.activeBoons.includes(boonId)) {
    rt.activeBoons.push(boonId);
  }
  soundEngine.playBoonSelect();

  rt.players.forEach((p) => {
    if (p.state === 'spectator') return;
    if (!usesWeaponSystem(rt) && p.unlockedSkillTier < 4) {
      p.unlockedSkillTier++;
    }
    if (boonId === 'phantom_step') {
      p.dashCooldown *= 0.72;
      p.abilityCooldown *= 0.72;
      p.skillMaxCooldowns = [
        p.skillMaxCooldowns[0] * 0.78,
        p.skillMaxCooldowns[1] * 0.78,
        p.skillMaxCooldowns[2] * 0.78,
        p.skillMaxCooldowns[3] * 0.78,
      ];
    } else if (boonId === 'vampiric_edge') {
      p.hp = Math.min(p.maxHp, p.hp + 25);
    } else if (boonId === 'twin_spark') {
      p.speed *= 1.18;
    } else if (boonId === 'aegis_core') {
      p.hasShield = true;
    }
  });
}

function getEnemyScaleMult(rt: GameRuntime): number {
  const loopMult = 1 + Math.max(0, rt.loopLevel - 1) * 0.45;
  if (!rt.isOnlineCampaign) return loopMult;
  const activeCount = Math.max(1, rt.players.filter((p) => p.state !== 'spectator').length);
  return (1 + Math.max(0, activeCount - 1) * 0.5) * loopMult;
}

function getBossHpMult(rt: GameRuntime): number {
  const loopMult = 1 + Math.max(0, rt.loopLevel - 1) * 0.78;
  const partyMult = rt.numPlayers <= 1 ? 1 : rt.numPlayers === 2 ? 2.15 : 1 + (rt.numPlayers - 1) * 0.85;
  return partyMult * loopMult;
}

function getCampaignDungeonStage(bossesDefeatedCount: number): StageKey {
  if (bossesDefeatedCount === 0) return 'ironDungeon';
  if (bossesDefeatedCount === 1) return 'voidDungeon';
  return 'oniDungeon';
}

function getNextCampaignBossStage(bossesDefeatedCount: number): {
  stage: 'mechaBoss' | 'voidBoss' | 'oniBoss' | 'eclipseBoss';
  label: string;
} {
  if (bossesDefeatedCount === 0) return { stage: 'mechaBoss', label: 'IRON DESTROYER' };
  if (bossesDefeatedCount === 1) return { stage: 'voidBoss', label: 'VOID PHANTOM' };
  if (bossesDefeatedCount === 2) return { stage: 'oniBoss', label: 'YAMATA-ONI' };
  return { stage: 'eclipseBoss', label: 'ECLIPSE SOVEREIGNS' };
}

function pickRandomWeaponId(rt: GameRuntime, avoidHeld = true): WeaponClassId {
  const held = new Set(rt.players.map((p) => p.weapon).filter((w): w is WeaponClassId => w !== 'none'));
  const dropped = new Set(rt.weaponDrops.map((d) => d.weaponId));
  let candidates = WEAPONS_CATALOG.map((w) => w.id).filter((id) =>
    avoidHeld ? !held.has(id) && !dropped.has(id) : true
  );
  if (candidates.length === 0) {
    candidates = WEAPONS_CATALOG.map((w) => w.id).filter((id) => !dropped.has(id));
  }
  if (candidates.length === 0) {
    candidates = WEAPONS_CATALOG.map((w) => w.id);
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function getLearnedSlots(p: Player, weaponId: WeaponClassId): number[] {
  const existing = p.learnedSkills?.[weaponId];
  if (Array.isArray(existing) && existing.length > 0) {
    return existing.includes(1) ? existing : [1, ...existing];
  }
  return [1];
}

export function hasLearnedSlot(p: Player, weaponId: WeaponClassId, slot: number): boolean {
  if (slot === 1) return true;
  return getLearnedSlots(p, weaponId).includes(slot);
}

function unlockSkillSlot(p: Player, weaponId: WeaponClassId, slot: 2 | 3 | 4): boolean {
  const current = getLearnedSlots(p, weaponId);
  if (current.includes(slot)) return false;
  p.learnedSkills[weaponId] = [...current, slot].sort((a, b) => a - b);
  return true;
}

function pickSpecificScrollTarget(
  rt: GameRuntime,
  excludeKeys?: Set<string>
): { targetWeapon: WeaponClassId; skillSlot: 2 | 3 | 4 } {
  const allWeapons = WEAPONS_CATALOG.map((w) => w.id);
  const slots: (2 | 3 | 4)[] = [2, 3, 4];
  const activeParty = rt.players.filter((p) => p.state !== 'spectator');

  // Collect slots needed by alive teammates for their equipped weapons first
  const heldCandidates: { targetWeapon: WeaponClassId; skillSlot: 2 | 3 | 4 }[] = [];
  for (const pl of activeParty) {
    if (pl.weapon === 'none') continue;
    const w = pl.weapon as WeaponClassId;
    for (const sl of slots) {
      const key = `${w}:${sl}`;
      const inBag = pl.scrollBag.some((sb) => sb.targetWeapon === w && sb.skillSlot === sl);
      if (!hasLearnedSlot(pl, w, sl) && !inBag && (!excludeKeys || !excludeKeys.has(key))) {
        heldCandidates.push({ targetWeapon: w, skillSlot: sl });
      }
    }
  }
  if (heldCandidates.length > 0 && Math.random() < 0.72) {
    return heldCandidates[Math.floor(Math.random() * heldCandidates.length)];
  }

  // Otherwise pick any unlearned weapon+slot combo
  const allCandidates: { targetWeapon: WeaponClassId; skillSlot: 2 | 3 | 4 }[] = [];
  for (const w of allWeapons) {
    for (const sl of slots) {
      const key = `${w}:${sl}`;
      if (!excludeKeys || !excludeKeys.has(key)) {
        allCandidates.push({ targetWeapon: w, skillSlot: sl });
      }
    }
  }
  const pool =
    allCandidates.length > 0
      ? allCandidates
      : [{ targetWeapon: allWeapons[0], skillSlot: 2 as const }];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function equipWeapon(
  rt: GameRuntime,
  p: Player,
  weaponId: WeaponClassId,
  dropPos?: { x: number; y: number }
) {
  const wDef = WEAPONS_CATALOG.find((w) => w.id === weaponId);
  if (!wDef) return;

  if (!p.weaponCooldowns) p.weaponCooldowns = {};

  // Strictly 1 weapon at a time: save active cooldowns & drop previously equipped weapon back onto floor
  if (p.weapon !== 'none' && p.weapon !== weaponId) {
    const oldId = p.weapon;
    p.weaponCooldowns[oldId] = [
      p.skillCooldowns[0] || 0,
      p.skillCooldowns[1] || 0,
      p.skillCooldowns[2] || 0,
      p.skillCooldowns[3] || 0,
    ];
    rt.weaponDrops.push({
      id: rt.nextUid++,
      weaponId: oldId,
      x: dropPos ? dropPos.x : p.x + p.size / 2,
      y: dropPos ? dropPos.y : p.y + p.size / 2,
      size: 28,
      bob: 0,
      swapLockTimer: 0.85,
    });
  }

  p.weapon = weaponId;
  const learned = getLearnedSlots(p, weaponId);
  p.learnedSkills[weaponId] = learned;
  p.unlockedSkillTier = learned.length;

  p.speed = 5.2 * wDef.speedMult * (hasBoon(rt, 'twin_spark') ? 1.18 : 1.0);
  p.dashCooldown = wDef.dashCooldown * (hasBoon(rt, 'phantom_step') ? 0.72 : 1.0);
  const cdFactor = hasBoon(rt, 'phantom_step') ? 0.78 : 1.0;
  p.skillMaxCooldowns = [
    wDef.skills[0].cooldown * cdFactor,
    wDef.skills[1].cooldown * cdFactor,
    wDef.skills[2].cooldown * cdFactor,
    wDef.skills[3].cooldown * cdFactor,
  ];
  p.abilityCooldown = p.skillMaxCooldowns[0];

  // Restore saved cooldowns for this weapon instead of resetting to 0 (prevents unequip/re-equip CD exploit)
  const savedCds = p.weaponCooldowns[weaponId];
  p.skillCooldowns = savedCds
    ? [
        Math.max(0, Math.min(p.skillMaxCooldowns[0], savedCds[0] || 0)),
        Math.max(0, Math.min(p.skillMaxCooldowns[1], savedCds[1] || 0)),
        Math.max(0, Math.min(p.skillMaxCooldowns[2], savedCds[2] || 0)),
        Math.max(0, Math.min(p.skillMaxCooldowns[3], savedCds[3] || 0)),
      ]
    : [0, 0, 0, 0];
  p.weaponCooldowns[weaponId] = [...p.skillCooldowns] as [number, number, number, number];
  p.abilityCooldownTimer = p.skillCooldowns[0];
  p.abilityReady = p.skillCooldowns[0] <= 0;

  // Preserve proportional HP across weapon bonusHp swaps (prevents drop + pickup healing exploit)
  const prevMaxHp = Math.max(1, p.maxHp);
  const targetMaxHp = rt.diffSettings.baseMaxHp + (p.bonusMaxHp || 0) + wDef.bonusHp;
  if (targetMaxHp !== prevMaxHp) {
    const ratio = Math.max(0, Math.min(1, p.hp / prevMaxHp));
    p.maxHp = targetMaxHp;
    p.hp = p.state === 'alive' ? Math.max(1, Math.min(targetMaxHp, Math.round(ratio * targetMaxHp))) : 0;
  }

  // Only grant passive tank shield if its recharge timer has finished (prevents shield reset exploit)
  if (weaponId === 'tank_shield') {
    const ready = p.tankShieldReady !== false && p.shieldRegenTimer <= 0;
    p.hasShield = ready || hasBoon(rt, 'aegis_core');
    if (!ready && p.shieldRegenTimer <= 0) {
      p.shieldRegenTimer = 26;
    }
  } else {
    p.hasShield = hasBoon(rt, 'aegis_core');
  }

  soundEngine.playBoonSelect();
  rt.energyWaves.push({
    x: p.x + p.size / 2,
    y: p.y + p.size / 2,
    radius: 10,
    maxRadius: 96,
    alpha: 0.85,
    speed: 320,
    color: wDef.accent,
  });
  addFloatingText(
    rt,
    p.x + p.size / 2,
    p.y - 18,
    learned.length > 1
      ? `${wDef.shortTag} EQUIPPED · LEARNED (${learned.length}/4)!`
      : `${wDef.shortTag} EQUIPPED · BASE SKILL [E] (1/4)`,
    wDef.accent,
    1.15
  );
}

export function dropEquippedWeapon(rt: GameRuntime, p: Player) {
  if (p.state !== 'alive' || p.weapon === 'none') return;
  const oldId = p.weapon;
  const wDef = WEAPONS_CATALOG.find((w) => w.id === oldId);

  // Persist active cooldowns before unequipping so re-equipping keeps remaining timers
  if (!p.weaponCooldowns) p.weaponCooldowns = {};
  p.weaponCooldowns[oldId] = [
    p.skillCooldowns[0] || 0,
    p.skillCooldowns[1] || 0,
    p.skillCooldowns[2] || 0,
    p.skillCooldowns[3] || 0,
  ];

  rt.weaponDrops.push({
    id: rt.nextUid++,
    weaponId: oldId,
    x: Math.max(60, Math.min(rt.arenaWidth - 60, p.x + p.size / 2 + Math.cos(p.facingAngle) * 24)),
    y: Math.max(70, Math.min(rt.arenaHeight - 70, p.y + p.size / 2 + Math.sin(p.facingAngle) * 24)),
    size: 28,
    bob: 0,
    swapLockTimer: 0.95,
  });
  p.weapon = 'none';
  p.unlockedSkillTier = 1;
  p.abilityReady = false;
  p.abilityCooldownTimer = 0;
  p.skillCooldowns = [0, 0, 0, 0];
  p.hasShield = false;
  // Do NOT wipe p.shieldRegenTimer or p.tankShieldReady so broken shields cannot reset on drop
  p.frontShieldTimer = 0;
  p.fortifyTimer = 0;
  p.speed = 5.2 * (hasBoon(rt, 'twin_spark') ? 1.18 : 1.0);
  p.dashCooldown = 8.8 * (hasBoon(rt, 'phantom_step') ? 0.72 : 1.0);
  const prevMaxHp = Math.max(1, p.maxHp);
  const baseMax = rt.diffSettings.baseMaxHp + (p.bonusMaxHp || 0);
  const ratio = Math.max(0, Math.min(1, p.hp / prevMaxHp));
  p.maxHp = baseMax;
  p.hp = p.state === 'alive' ? Math.max(1, Math.min(baseMax, Math.round(ratio * baseMax))) : 0;
  soundEngine.playUiClick();
  addFloatingText(rt, p.x + p.size / 2, p.y - 16, `DROPPED ${wDef?.shortTag || 'WEAPON'}`, '#94a3b8', 1.05);
}

export function useBagScroll(rt: GameRuntime, p: Player, scrollId: number): boolean {
  if (p.state !== 'alive') return false;
  const idx = p.scrollBag.findIndex((s) => s.id === scrollId);
  if (idx === -1) return false;
  const item = p.scrollBag[idx];
  const wDef = WEAPONS_CATALOG.find((w) => w.id === item.targetWeapon);
  const sk = wDef?.skills[item.skillSlot - 1];
  if (!unlockSkillSlot(p, item.targetWeapon, item.skillSlot)) {
    addFloatingText(
      rt,
      p.x + p.size / 2,
      p.y - 16,
      `${wDef?.shortTag || 'SKILL'} [${sk?.keyLabel || 'Q'}] ALREADY LEARNED!`,
      '#94a3b8',
      1.0
    );
    return false;
  }
  p.scrollBag.splice(idx, 1);
  if (p.weapon === item.targetWeapon) {
    p.unlockedSkillTier = getLearnedSlots(p, item.targetWeapon).length;
  }
  soundEngine.playBoonSelect();
  rt.energyWaves.push({
    x: p.x + p.size / 2,
    y: p.y + p.size / 2,
    radius: 10,
    maxRadius: 110,
    alpha: 0.9,
    speed: 360,
    color: wDef?.accent || '#c084fc',
  });
  addFloatingText(
    rt,
    p.x + p.size / 2,
    p.y - 18,
    `LEARNED ${wDef?.shortTag || ''} [${sk?.keyLabel || ''}]: ${sk?.name.toUpperCase() || 'SKILL'}!`,
    wDef?.accent || '#c084fc',
    1.2
  );
  return true;
}

export function dropBagScroll(rt: GameRuntime, p: Player, scrollId: number): boolean {
  if (p.state !== 'alive') return false;
  const idx = p.scrollBag.findIndex((s) => s.id === scrollId);
  if (idx === -1) return false;
  const item = p.scrollBag[idx];
  p.scrollBag.splice(idx, 1);
  const dropX = Math.max(60, Math.min(rt.arenaWidth - 60, p.x + p.size / 2 + Math.cos(p.facingAngle) * 26));
  const dropY = Math.max(70, Math.min(rt.arenaHeight - 70, p.y + p.size / 2 + Math.sin(p.facingAngle) * 26));
  rt.scrollDrops.push({
    id: rt.nextUid++,
    targetWeapon: item.targetWeapon,
    skillSlot: item.skillSlot,
    x: dropX,
    y: dropY,
    size: 26,
    bob: 0,
    lockTimer: 0.95,
  });
  const wDef = WEAPONS_CATALOG.find((w) => w.id === item.targetWeapon);
  const sk = wDef?.skills[item.skillSlot - 1];
  soundEngine.playUiClick();
  addFloatingText(
    rt,
    p.x + p.size / 2,
    p.y - 16,
    `DROPPED ${wDef?.shortTag || ''} [${sk?.keyLabel || ''}] SCROLL`,
    '#fbbf24',
    1.0
  );
  return true;
}

export function purchaseShopItemById(rt: GameRuntime, p: Player, itemId: number): boolean {
  if (p.state !== 'alive') return false;
  const item = rt.shopItems.find((s) => s.id === itemId);
  if (!item) return false;
  return purchaseShopItem(rt, p, item);
}

export function usePlayerPotion(rt: GameRuntime, p: Player) {
  if (p.state !== 'alive' || p.potionCooldownTimer > 0) return;
  if (p.potions <= 0) {
    addFloatingText(rt, p.x + p.size / 2, p.y - 14, 'NO FLASKS LEFT!', '#94a3b8', 0.9);
    return;
  }
  if (p.hp >= p.maxHp) {
    addFloatingText(rt, p.x + p.size / 2, p.y - 14, 'HP ALREADY FULL!', '#34d399', 0.9);
    return;
  }
  p.potions--;
  p.potionCooldownTimer = 90;
  p.hp = Math.min(p.maxHp, p.hp + 45);
  soundEngine.playMedkit();
  rt.energyWaves.push({
    x: p.x + p.size / 2,
    y: p.y + p.size / 2,
    radius: 10,
    maxRadius: 95,
    alpha: 0.9,
    speed: 340,
    color: '#34d399',
  });
  addFloatingText(rt, p.x + p.size / 2, p.y - 18, `+45 HP FLASK (${p.potions}/2 · 90s CD)`, '#34d399', 1.15);
}

function spawnSkillScroll(
  rt: GameRuntime,
  x: number,
  y: number,
  targetWeapon?: WeaponClassId,
  skillSlot?: 2 | 3 | 4,
  popOpts?: {
    popFromX: number;
    popFromY: number;
    popDuration?: number;
    popArcHeight?: number;
    lockTimer?: number;
  }
) {
  const sx = Math.max(85, Math.min(rt.arenaWidth - 85, x));
  const sy = Math.max(95, Math.min(rt.arenaHeight - 95, y));
  const picked = targetWeapon && skillSlot
    ? { targetWeapon, skillSlot }
    : pickSpecificScrollTarget(rt);
  const popDuration = popOpts?.popDuration ?? 0;
  rt.scrollDrops.push({
    id: rt.nextUid++,
    targetWeapon: targetWeapon || picked.targetWeapon,
    skillSlot: skillSlot || picked.skillSlot,
    x: sx,
    y: sy,
    size: 26,
    bob: Math.random() * Math.PI * 2,
    lockTimer: popOpts?.lockTimer ?? 0,
    popTimer: popDuration > 0 ? popDuration : undefined,
    popDuration: popDuration > 0 ? popDuration : undefined,
    popFromX: popOpts?.popFromX,
    popFromY: popOpts?.popFromY,
    popArcHeight: popOpts?.popArcHeight,
  });
}

function spawnRoomChest(
  rt: GameRuntime,
  x: number,
  y: number,
  forcedKind?: 'coins' | 'weapon' | 'treasure'
) {
  const activeCount = Math.max(1, rt.players.filter((p) => p.state !== 'spectator').length);
  const noWeaponHeld = rt.players.some((p) => p.state !== 'spectator' && p.weapon === 'none');
  const rewardKind: 'coins' | 'weapon' | 'treasure' =
    forcedKind || (Math.random() < (noWeaponHeld ? 0.36 : 0.22) ? 'weapon' : 'coins');

  const cx = Math.max(100, Math.min(rt.arenaWidth - 100, x));
  const cy = Math.max(120, Math.min(rt.arenaHeight - 120, y));

  const basePerPlayer =
    (rewardKind === 'treasure' ? 16 : rewardKind === 'coins' ? 10 : 6) +
    Math.floor(Math.random() * 3) * 2 +
    Math.min(10, Math.floor(rt.roomDepth * 1.2)) +
    Math.max(0, rt.loopLevel - 1) * 6;

  // Scrolls are genuinely RARE (6% on combat chests, 18% on vault chests)
  const scrollRollChance = rewardKind === 'treasure' ? 0.18 : 0.06;
  const scrollPick = Math.random() < scrollRollChance ? pickSpecificScrollTarget(rt) : undefined;

  if (rewardKind === 'coins' || rewardKind === 'treasure') {
    rt.chests.push({
      id: rt.nextUid++,
      x: cx,
      y: cy,
      size: 36,
      opened: false,
      openAnim: 0,
      rewardKind,
      coinsTotal: basePerPlayer * activeCount,
      bonusPotions: rewardKind === 'treasure' ? (Math.random() < 0.55 ? 1 : 0) : Math.random() < 0.28 ? 1 : 0,
      bonusScrollWeapon: scrollPick?.targetWeapon,
      bonusScrollSlot: scrollPick?.skillSlot,
    });
  } else {
    const weaponId = pickRandomWeaponId(rt, true);
    rt.chests.push({
      id: rt.nextUid++,
      x: cx,
      y: cy,
      size: 36,
      opened: false,
      openAnim: 0,
      rewardKind: 'weapon',
      weaponId,
      coinsTotal: basePerPlayer * activeCount,
      bonusPotions: Math.random() < 0.26 ? 1 : 0,
      bonusScrollWeapon: scrollPick?.targetWeapon,
      bonusScrollSlot: scrollPick?.skillSlot,
    });
  }
}

const OPPOSITE_DIR: Record<GateDir, GateDir> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

const DIR_DELTA: Record<GateDir, { dx: number; dy: number }> = {
  top: { dx: 0, dy: -1 },
  bottom: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

function generateFloorGrid(rt: GameRuntime) {
  const combatStage = getCampaignDungeonStage(rt.bossesDefeatedCount);
  const nextBoss = getNextCampaignBossStage(rt.bossesDefeatedCount);
  const startKey = '2,2';

  const coords: Record<string, { gx: number; gy: number; dist: number; connections: Partial<Record<GateDir, string>> }> = {
    [startKey]: { gx: 2, gy: 2, dist: 0, connections: {} },
  };
  const keysList: string[] = [startKey];

  // Expand a balanced 10-room Soul-Knight floor on a 6x6 grid
  let guard = 0;
  while (keysList.length < 10 && guard < 360) {
    guard++;
    const baseKey = keysList[Math.floor(Math.random() * keysList.length)];
    const base = coords[baseKey];
    const dirs: GateDir[] = (['top', 'bottom', 'left', 'right'] as GateDir[]).sort(() => Math.random() - 0.5);
    for (const dir of dirs) {
      const nx = base.gx + DIR_DELTA[dir].dx;
      const ny = base.gy + DIR_DELTA[dir].dy;
      if (nx < 0 || nx > 5 || ny < 0 || ny > 5) continue;
      const nKey = `${nx},${ny}`;
      if (!coords[nKey]) {
        coords[nKey] = { gx: nx, gy: ny, dist: base.dist + 1, connections: {} };
        coords[baseKey].connections[dir] = nKey;
        coords[nKey].connections[OPPOSITE_DIR[dir]] = baseKey;
        keysList.push(nKey);
        break;
      }
    }
  }

  // Add 1 shortcut link between non-leaf rooms so dungeon wings flow naturally
  let shortcuts = 0;
  for (const k of keysList) {
    if (shortcuts >= 1) break;
    const node = coords[k];
    if (Object.keys(node.connections).length <= 1) continue;
    for (const dir of ['right', 'bottom'] as GateDir[]) {
      const nx = node.gx + DIR_DELTA[dir].dx;
      const ny = node.gy + DIR_DELTA[dir].dy;
      const nKey = `${nx},${ny}`;
      if (
        coords[nKey] &&
        Object.keys(coords[nKey].connections).length > 1 &&
        !node.connections[dir] &&
        k !== startKey &&
        nKey !== startKey &&
        Math.random() < 0.35
      ) {
        node.connections[dir] = nKey;
        coords[nKey].connections[OPPOSITE_DIR[dir]] = k;
        shortcuts++;
      }
    }
  }

  // BFS distances from startKey
  const distMap: Record<string, number> = { [startKey]: 0 };
  const queue = [startKey];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const cNode = coords[cur];
    Object.values(cNode.connections).forEach((nk) => {
      if (nk && distMap[nk] === undefined) {
        distMap[nk] = distMap[cur] + 1;
        queue.push(nk);
      }
    });
  }

  const others = keysList.filter((k) => k !== startKey).sort((a, b) => (distMap[b] || 0) - (distMap[a] || 0));
  const leafOthers = others.filter((k) => Object.keys(coords[k].connections).length === 1);
  const bossKey = leafOthers[0] || others[0];
  const nonBossOthers = others.filter((k) => k !== bossKey).sort(() => Math.random() - 0.5);
  const shopKeys = new Set(nonBossOthers.slice(0, 1));
  const vaultCount = Math.random() < 0.55 ? 1 : 0;
  const treasureKeys = new Set(nonBossOthers.slice(shopKeys.size, shopKeys.size + vaultCount));

  const grid: Record<string, PersistedRoomState> = {};
  const bossTypeForFloor: BossType =
    nextBoss.stage === 'mechaBoss'
      ? 'mecha'
      : nextBoss.stage === 'voidBoss'
      ? 'void'
      : nextBoss.stage === 'oniBoss'
      ? 'oni'
      : 'eclipse';
  const rolledBossVariantId = rollFloorBossVariant(rt, bossTypeForFloor, rt.lastBossVariantId);

  for (const k of keysList) {
    const c = coords[k];
    let kind: RoomKind = 'combat';
    let label = 'DUNGEON CHAMBER';
    let stage: StageKey = combatStage;
    let bossStage: 'mechaBoss' | 'voidBoss' | 'oniBoss' | 'eclipseBoss' | undefined;
    let bossVariantId: BossVariantId | undefined;

    if (k === startKey) {
      kind = 'start';
      label = 'ENTRY HALL';
    } else if (k === bossKey) {
      kind = 'boss';
      label = nextBoss.label;
      stage = nextBoss.stage;
      bossStage = nextBoss.stage;
      bossVariantId = rolledBossVariantId;
    } else if (shopKeys.has(k)) {
      kind = 'shop';
      label = 'MERCHANT SHOP';
    } else if (treasureKeys.has(k)) {
      kind = 'treasure';
      label = 'TREASURE VAULT';
    }

    grid[k] = {
      key: k,
      gx: c.gx,
      gy: c.gy,
      kind,
      stage,
      bossStage,
      bossVariantId,
      label,
      connections: c.connections,
      visited: k === startKey,
      cleared: false,
      revealed: k === startKey || Object.values(coords[startKey].connections).includes(k),
      enemies: [],
      chests: [],
      weaponDrops: [],
      scrollDrops: [],
      shopItems: [],
      medkits: [],
      relics: [],
      nextFloorPortalOpen: false,
    };
  }

  rt.floorGrid = grid;
  rt.floorMapRev++;
  rt.currentRoomKey = startKey;
  rt.roomKind = 'start';
  rt.roomDepth = 1;
}

function saveCurrentRoomState(rt: GameRuntime) {
  const room = rt.floorGrid[rt.currentRoomKey];
  if (!room) return;
  room.enemies = [...rt.enemies];
  room.chests = [...rt.chests];
  room.weaponDrops = [...rt.weaponDrops];
  room.scrollDrops = [...rt.scrollDrops];
  room.shopItems = [...rt.shopItems];
  room.medkits = [...rt.medkits];
  room.relics = [...rt.relics];
}

function getRoomGateMeta(target: PersistedRoomState): {
  label: string;
  subLabel: string;
  accent: string;
  bossVariantLabel?: string;
  suggestedRoles?: WeaponId[];
} {
  if (!target.revealed && !target.visited) {
    return { label: 'UNKNOWN', subLabel: 'UNEXPLORED ROOM', accent: '#94a3b8' };
  }
  if (target.kind === 'boss') {
    if (!target.cleared && target.bossVariantId) {
      const bType: BossType =
        target.bossStage === 'voidBoss'
          ? 'void'
          : target.bossStage === 'oniBoss'
          ? 'oni'
          : target.bossStage === 'eclipseBoss'
          ? 'eclipse'
          : 'mecha';
      const vDef = getBossVariantDef(bType, target.bossVariantId);
      return {
        label: 'BOSS SANCTUM',
        subLabel: `${vDef.shortName} · ${vDef.suggestedLabel}`,
        bossVariantLabel: vDef.shortName,
        suggestedRoles: [...vDef.suggestedWeapons],
        accent: '#f43f5e',
      };
    }
    return {
      label: 'BOSS SANCTUM',
      subLabel: target.cleared ? 'CLEARED SANCTUM' : target.label,
      accent: '#f43f5e',
    };
  }
  if (target.kind === 'shop') {
    return { label: 'MERCHANT SHOP', subLabel: 'TALK TO BROKER VEX', accent: '#fbbf24' };
  }
  if (target.kind === 'treasure') {
    return {
      label: 'TREASURE VAULT',
      subLabel: target.cleared ? 'VISITED VAULT' : 'CHESTS & RARE SCROLL',
      accent: '#34d399',
    };
  }
  if (target.kind === 'start') {
    return { label: 'ENTRY HALL', subLabel: target.cleared ? 'CLEARED · SAFE' : 'SPAWN HALL', accent: '#38bdf8' };
  }
  return {
    label: 'DUNGEON ROOM',
    subLabel: target.cleared ? 'CLEARED CHAMBER' : 'COMBAT + CHEST',
    accent: '#a855f7',
  };
}

function spawnConnectedGates(rt: GameRuntime, room: PersistedRoomState) {
  rt.gates = [];
  const w = rt.arenaWidth;
  const h = rt.arenaHeight;
  const dirGeom: Record<GateDir, { x: number; y: number; width: number; height: number }> = {
    top: { x: Math.round(w / 2 - 74), y: 0, width: 148, height: 34 },
    bottom: { x: Math.round(w / 2 - 74), y: h - 34, width: 148, height: 34 },
    left: { x: 0, y: Math.round(h / 2 - 74), width: 34, height: 148 },
    right: { x: w - 34, y: Math.round(h / 2 - 74), width: 34, height: 148 },
  };

  let hasUnvisitedDungeonNeighbor = false;

  (['top', 'bottom', 'left', 'right'] as GateDir[]).forEach((dir) => {
    const targetKey = room.connections[dir];
    if (!targetKey) return;
    const target = rt.floorGrid[targetKey];
    if (!target) return;
    target.revealed = true;
    if (target.kind !== 'boss' && !target.visited) {
      hasUnvisitedDungeonNeighbor = true;
    }
    const meta = getRoomGateMeta(target);
    const geom = dirGeom[dir];
    rt.gates.push({
      id: `gate-${dir}`,
      dir,
      targetRoomKey: targetKey,
      visitedTarget: target.visited,
      clearedTarget: target.cleared,
      x: geom.x,
      y: geom.y,
      width: geom.width,
      height: geom.height,
      corridorDepth: 162,
      roomType: target.kind,
      targetStage: target.stage,
      label: meta.label,
      subLabel: meta.subLabel,
      bossVariantLabel: meta.bossVariantLabel,
      suggestedRoles: meta.suggestedRoles,
      accent: meta.accent,
      playersInside: [],
      holdProgress: 0,
    });
  });

  // Offer Stairs Down when players are not ready to enter the Boss or finished unvisited rooms
  if (room.kind !== 'boss' && !room.nextFloorPortalOpen && !hasUnvisitedDungeonNeighbor) {
    const freeDirs = (['top', 'bottom', 'left', 'right'] as GateDir[]).filter((d) => !room.connections[d]);
    if (freeDirs.length > 0) {
      const stairsDir = freeDirs[0];
      const geom = dirGeom[stairsDir];
      rt.gates.push({
        id: `gate-stairs-${stairsDir}`,
        dir: stairsDir,
        isStairsDown: true,
        x: geom.x,
        y: geom.y,
        width: geom.width,
        height: geom.height,
        corridorDepth: 132,
        roomType: 'combat',
        targetStage: getCampaignDungeonStage(rt.bossesDefeatedCount),
        label: 'STAIRS DOWN',
        subLabel: `DESCEND F${rt.floorNumber + 1} (MORE LOOT)`,
        accent: '#a855f7',
        playersInside: [],
        holdProgress: 0,
      });
    }
  }

  if (room.nextFloorPortalOpen) {
    const nextBoss = getNextCampaignBossStage(rt.bossesDefeatedCount);
    rt.gates.push({
      id: 'gate-next-floor',
      dir: 'top',
      isNextFloorPortal: true,
      x: Math.round(w / 2 - 90),
      y: Math.round(h * 0.28),
      width: 180,
      height: 68,
      roomType: 'combat',
      targetStage: getCampaignDungeonStage(rt.bossesDefeatedCount),
      label: `FLOOR ${rt.floorNumber + 1} PORTAL`,
      subLabel: `NEXT ACT: ${nextBoss.label}`,
      accent: '#22d3ee',
      playersInside: [],
      holdProgress: 0,
    });
  }
}

function createShopNpc(rt: GameRuntime): ShopNpc {
  return {
    x: Math.round(rt.arenaWidth / 2),
    y: Math.round(rt.arenaHeight * 0.36),
    name: 'GILDED BROKER VEX',
    radius: 54,
  };
}

function spawnShopItems(rt: GameRuntime) {
  const npc = createShopNpc(rt);
  rt.shopNpc = npc;
  const crateWeapon = pickRandomWeaponId(rt, true);
  const pickA = pickSpecificScrollTarget(rt);
  const defA = WEAPONS_CATALOG.find((w) => w.id === pickA.targetWeapon)!;
  const skA = defA.skills[pickA.skillSlot - 1];

  const items: ShopItem[] = [
    {
      id: rt.nextUid++,
      kind: 'potion',
      label: 'CRIMSON FLASK (MAX 2)',
      subLabel: '+35 HP & +1 BAG FLASK (90s CD)',
      cost: 65,
      x: npc.x,
      y: npc.y,
      size: 36,
      accent: '#34d399',
      purchasedBy: [],
    },
    {
      id: rt.nextUid++,
      kind: 'potion_pack',
      label: 'SANGUINE DRAUGHT',
      subLabel: 'RESTORE +65 HP INSTANTLY',
      cost: 60,
      x: npc.x,
      y: npc.y,
      size: 36,
      accent: '#10b981',
      purchasedBy: [],
    },
    {
      id: rt.nextUid++,
      kind: 'max_hp',
      label: 'VITALITY TONIC',
      subLabel: '+20 MAX HP & +35 HP',
      cost: 95,
      x: npc.x,
      y: npc.y,
      size: 36,
      accent: '#f43f5e',
      purchasedBy: [],
    },
    {
      id: rt.nextUid++,
      kind: 'shield',
      label: 'AEGIS SHIELD CORE',
      subLabel: 'REACTIVE ENERGY SHIELD',
      cost: 75,
      x: npc.x,
      y: npc.y,
      size: 36,
      accent: '#38bdf8',
      purchasedBy: [],
    },
  ];

  // Rare skill scroll (60% stocked, 1 max per shop)
  if (Math.random() < 0.6) {
    items.push({
      id: rt.nextUid++,
      kind: 'skill_scroll',
      label: `${defA.shortTag} [${skA.keyLabel}] SCROLL`,
      subLabel: `LEARN: ${skA.name.toUpperCase()}`,
      cost: 145,
      x: npc.x,
      y: npc.y,
      size: 36,
      accent: defA.accent,
      targetWeapon: pickA.targetWeapon,
      skillSlot: pickA.skillSlot,
      purchasedBy: [],
    });
  }

  // Weapon crate (65% stocked)
  if (Math.random() < 0.65) {
    items.push({
      id: rt.nextUid++,
      kind: 'weapon_crate',
      label: `ARMORY: ${WEAPONS_CATALOG.find((w) => w.id === crateWeapon)?.shortTag || 'WEAPON'}`,
      subLabel: 'DROPS WEAPON FOR PARTY',
      cost: 135,
      x: npc.x,
      y: npc.y,
      size: 36,
      accent: '#fbbf24',
      weaponId: crateWeapon,
      purchasedBy: [],
      globalSold: false,
    });
  }

  rt.shopItems = items;
}

function resetFloorWorkspace(rt: GameRuntime, combatStage: StageKey, healBonus: number) {
  rt.chests = [];
  rt.weaponDrops = [];
  rt.scrollDrops = [];
  rt.coinBursts = [];
  rt.skillZones = [];
  rt.gates = [];
  rt.shopItems = [];
  rt.shopNpc = null;
  rt.lastKilledPos = null;
  rt.enemies = [];
  rt.bossProjectiles = [];
  rt.playerProjectiles = [];
  rt.voidDecoys = [];
  rt.telegraphLines = [];
  rt.medkits = [];
  rt.relics = [];
  rt.stageElapsed = 0;
  rt.isBossLevel = false;
  rt.arenaWidth = DUNGEON_ARENA_WIDTH;
  rt.arenaHeight = DUNGEON_ARENA_HEIGHT;
  rt.stage = combatStage;
  generateFloorGrid(rt);
  rt.ambientMotes = createAmbientMotes(48, rt.arenaWidth, rt.arenaHeight);

  rt.players.forEach((p, idx) => {
    if (p.state === 'spectator') return;
    p.state = 'alive';
    p.invulnerable = false;
    p.invulnFrames = 1.6;
    p.dashImmune = false;
    p.dashTimeLeft = 0;
    p.cloakTimer = 0;
    p.postDashInvulnerability = 0;
    if (healBonus > 0) {
      p.hp = Math.min(p.maxHp, p.hp + healBonus);
    }
    const spread = (idx - (rt.numPlayers - 1) / 2) * 76;
    p.x = Math.round(rt.arenaWidth / 2 - 19 + spread);
    p.y = Math.round(rt.arenaHeight / 2);
    p.safeZoneClosed = true;
    p.inSafeZone = false;
    p.hasKnife = false;
    p.sealed = false;
    p.sealTimer = 0;
  });

  rt.knives = spawnKnivesForPlayers(rt.players, rt.playerColors, rt.arenaWidth, rt.arenaHeight);
  rt.camera = { x: rt.arenaWidth / 2, y: rt.arenaHeight / 2, zoom: 0.72 };
  soundEngine.setMusicTrack(combatStage, false);
  rt.roomTotalWaves = rt.isOnlineCampaign && rt.loopLevel >= 2 ? Math.min(3, rt.loopLevel) : 1;
  rt.roomWave = 1;
  rt.waveNumber = 1;
  spawnWaveEnemies(rt, combatStage, 1);
}

function descendStairsToSubFloor(rt: GameRuntime) {
  const prevBoss = Object.values(rt.floorGrid).find((r) => r.kind === 'boss');
  if (prevBoss?.bossVariantId) {
    rt.lastBossVariantId = prevBoss.bossVariantId;
  }
  rt.floorNumber++;
  const combatStage = getCampaignDungeonStage(rt.bossesDefeatedCount);
  resetFloorWorkspace(rt, combatStage, 12);
  const newBoss = Object.values(rt.floorGrid).find((r) => r.kind === 'boss');
  const vDef = newBoss?.bossVariantId
    ? getBossVariantDef(
        newBoss.bossStage === 'voidBoss' ? 'void' : newBoss.bossStage === 'oniBoss' ? 'oni' : newBoss.bossStage === 'eclipseBoss' ? 'eclipse' : 'mecha',
        newBoss.bossVariantId
      )
    : null;
  showPhaseAnnounce(
    rt,
    vDef
      ? `FLOOR ${rt.floorNumber} · NEW BOSS: ${vDef.shortName} (${vDef.suggestedLabel})`
      : `STAIRS DESCENDED -> FLOOR ${rt.floorNumber} · SEARCH FOR LOOT BEFORE BOSS!`,
    '#a855f7',
    3.4
  );
}

function advanceToNextFloor(rt: GameRuntime) {
  rt.floorNumber++;
  const combatStage = getCampaignDungeonStage(rt.bossesDefeatedCount);
  resetFloorWorkspace(rt, combatStage, 25);
  showPhaseAnnounce(rt, `FLOOR ${rt.floorNumber} · FRESH DUNGEON WING`, '#22d3ee', 3.0);
}

export function advanceToNextLoop(rt: GameRuntime) {
  rt.loopLevel++;
  rt.floorNumber++;
  rt.bossesDefeatedCount = 0;
  rt.finalVote = null;
  rt.finalVoteResolveDelay = 0;
  rt.pendingEvent = null;
  rt.victory = false;
  rt.bossDeadTimer = 0;
  rt.bossDeadBeat = 0;
  rt.chests = [];
  rt.weaponDrops = [];
  rt.scrollDrops = [];
  rt.coinBursts = [];
  rt.skillZones = [];
  rt.gates = [];
  rt.shopItems = [];
  rt.shopNpc = null;
  rt.lastKilledPos = null;
  rt.enemies = [];
  rt.bossProjectiles = [];
  rt.playerProjectiles = [];
  rt.voidDecoys = [];
  rt.telegraphLines = [];
  rt.medkits = [];
  rt.relics = [];
  rt.stageElapsed = 0;
  rt.isBossLevel = false;
  rt.arenaWidth = DUNGEON_ARENA_WIDTH;
  rt.arenaHeight = DUNGEON_ARENA_HEIGHT;
  rt.stage = 'ironDungeon';
  generateFloorGrid(rt);
  rt.ambientMotes = createAmbientMotes(54, rt.arenaWidth, rt.arenaHeight);

  rt.players.forEach((p, idx) => {
    if (p.state === 'spectator') return;
    p.state = 'alive';
    p.invulnerable = false;
    p.invulnFrames = 2.0;
    p.dashImmune = false;
    p.dashTimeLeft = 0;
    p.cloakTimer = 0;
    p.frontShieldTimer = 0;
    p.postDashInvulnerability = 0;
    p.hp = Math.min(p.maxHp, Math.max(Math.round(p.maxHp * 0.6), p.hp + 45));
    const spread = (idx - (rt.numPlayers - 1) / 2) * 76;
    p.x = Math.round(rt.arenaWidth / 2 - 19 + spread);
    p.y = Math.round(rt.arenaHeight / 2);
    p.safeZoneClosed = true;
    p.inSafeZone = false;
    p.hasKnife = false;
    p.sealed = false;
    p.sealTimer = 0;
  });

  rt.knives = spawnKnivesForPlayers(rt.players, rt.playerColors, rt.arenaWidth, rt.arenaHeight);
  rt.camera = { x: rt.arenaWidth / 2, y: rt.arenaHeight / 2, zoom: 0.72 };
  soundEngine.setMusicTrack('ironDungeon', false);
  rt.roomTotalWaves = Math.min(3, rt.loopLevel);
  rt.roomWave = 1;
  rt.waveNumber = 1;
  spawnWaveEnemies(rt, 'ironDungeon', 1);
  showPhaseAnnounce(rt, `ABYSSAL LOOP ${rt.loopLevel} · ${rt.roomTotalWaves} WAVES & MULTI-HP FOES!`, '#f43f5e', 3.4);
}

export function castFinalVote(rt: GameRuntime, playerId: PlayerId, choice: 'end' | 'deeper') {
  if (!rt.finalVote || !rt.finalVote.active) return;
  rt.finalVote.votes[playerId] = choice;
  soundEngine.playUiClick();
  const activeParty = rt.players.filter((p) => p.state !== 'spectator');
  if (activeParty.every((p) => rt.finalVote!.votes[p.id])) {
    rt.finalVoteResolveDelay = 0.75;
  }
}

function enterDungeonGate(rt: GameRuntime, gate: DungeonGate) {
  if (gate.isNextFloorPortal) {
    advanceToNextFloor(rt);
    return;
  }
  if (gate.isStairsDown) {
    descendStairsToSubFloor(rt);
    return;
  }

  saveCurrentRoomState(rt);
  const targetKey = gate.targetRoomKey;

  if (!targetKey || !rt.floorGrid[targetKey]) return;

  const targetRoom = rt.floorGrid[targetKey];
  rt.currentRoomKey = targetKey;
  rt.roomDepth++;
  rt.roomKind = targetRoom.kind;
  targetRoom.visited = true;
  targetRoom.revealed = true;
  Object.values(targetRoom.connections).forEach((nk) => {
    if (nk && rt.floorGrid[nk]) rt.floorGrid[nk].revealed = true;
  });
  rt.floorMapRev++;

  rt.chests = [];
  rt.weaponDrops = [];
  rt.scrollDrops = [];
  rt.coinBursts = [];
  rt.skillZones = [];
  rt.gates = [];
  rt.shopItems = [];
  rt.shopNpc = null;
  rt.lastKilledPos = null;
  rt.enemies = [];
  rt.bossProjectiles = [];
  rt.playerProjectiles = [];
  rt.voidDecoys = [];
  rt.telegraphLines = [];
  rt.medkits = [];
  rt.relics = [];
  rt.stageElapsed = 0;

  if (targetRoom.kind === 'boss' && !targetRoom.cleared) {
    rt.arenaWidth = BOSS_ARENA_WIDTH;
    rt.arenaHeight = BOSS_ARENA_HEIGHT;
    rt.players.forEach((p) => {
      if (p.state === 'spectator') return;
      p.state = 'alive';
      p.hp = Math.min(p.maxHp, p.hp + 20);
      p.x = getSpawnXForPlayer(p.id, rt.numPlayers, rt.arenaWidth, true, false);
      p.y = -180;
      p.hasKnife = false;
      p.sealed = false;
      p.sealTimer = 0;
      p.dashImmune = false;
      p.dashTimeLeft = 0;
      p.cloakTimer = 0;
      p.postDashInvulnerability = 0;
      p.invulnerable = true;
      p.inSafeZone = false;
      p.safeZoneClosed = true;
    });
    rt.introPlaying = true;
    rt.introTimer = 0;
    rt.fadeOpacity = 1;
    const bossStage = targetRoom.bossStage || getNextCampaignBossStage(rt.bossesDefeatedCount).stage;
    setupBossStage(rt, bossStage, targetRoom.bossVariantId);
    rt.lastBossVariantId = rt.boss.variantId;
    return;
  }

  rt.isBossLevel = false;
  rt.arenaWidth = targetRoom.kind === 'boss' ? BOSS_ARENA_WIDTH : DUNGEON_ARENA_WIDTH;
  rt.arenaHeight = targetRoom.kind === 'boss' ? BOSS_ARENA_HEIGHT : DUNGEON_ARENA_HEIGHT;
  const combatStage = getCampaignDungeonStage(rt.bossesDefeatedCount);
  rt.stage = combatStage;
  rt.ambientMotes = createAmbientMotes(48, rt.arenaWidth, rt.arenaHeight);

  const spawnXCenter =
    gate.dir === 'left'
      ? rt.arenaWidth - 88
      : gate.dir === 'right'
      ? 52
      : Math.round(rt.arenaWidth / 2 - 18);
  const spawnYBase =
    gate.dir === 'top'
      ? rt.arenaHeight - 88
      : gate.dir === 'bottom'
      ? 52
      : Math.round(rt.arenaHeight / 2 - 18);

  rt.players.forEach((p, idx) => {
    if (p.state === 'spectator') return;
    p.state = 'alive';
    p.invulnerable = false;
    p.invulnFrames = 1.45;
    p.dashImmune = false;
    p.dashTimeLeft = 0;
    p.cloakTimer = 0;
    p.postDashInvulnerability = 0;
    const spread = (idx - (rt.numPlayers - 1) / 2) * 34;
    if (gate.dir === 'left' || gate.dir === 'right') {
      p.x = spawnXCenter;
      p.y = Math.max(85, Math.min(rt.arenaHeight - 125, spawnYBase + spread));
    } else {
      p.x = Math.max(85, Math.min(rt.arenaWidth - 125, spawnXCenter + spread));
      p.y = spawnYBase;
    }
    p.safeZoneClosed = true;
    p.inSafeZone = false;
    p.hasKnife = false;
    p.sealed = false;
    p.sealTimer = 0;
  });

  rt.p1SafeZone = {
    x: Math.max(40, spawnXCenter - 210),
    y: Math.max(40, spawnYBase - 90),
    width: 420,
    height: 185,
    color: 'rgba(56, 189, 248, 0.08)',
  };
  rt.p2SafeZone = { ...rt.p1SafeZone };
  rt.knives = spawnKnivesForPlayers(rt.players, rt.playerColors, rt.arenaWidth, rt.arenaHeight);
  rt.camera = { x: rt.arenaWidth / 2, y: rt.arenaHeight / 2, zoom: 0.72 };
  soundEngine.setMusicTrack(combatStage, false);

  if (targetRoom.cleared) {
    rt.chests = [...targetRoom.chests];
    rt.weaponDrops = [...targetRoom.weaponDrops];
    rt.scrollDrops = [...targetRoom.scrollDrops];
    rt.shopItems = [...targetRoom.shopItems];
    if (targetRoom.kind === 'shop') {
      rt.shopNpc = createShopNpc(rt);
    }
    rt.medkits = [...targetRoom.medkits];
    rt.relics = [...targetRoom.relics];
    spawnConnectedGates(rt, targetRoom);
    showPhaseAnnounce(rt, `REVISITED · ${targetRoom.label}`, '#94a3b8', 2.0);
    return;
  }

  if (targetRoom.kind === 'shop') {
    targetRoom.cleared = true;
    spawnShopItems(rt);
    spawnConnectedGates(rt, targetRoom);
    showPhaseAnnounce(rt, `MERCHANT BROKER VEX · WALK UP & PRESS [E] TO BROWSE`, '#fbbf24', 2.8);
  } else if (targetRoom.kind === 'treasure') {
    targetRoom.cleared = true;
    rt.floorMapRev++;
    spawnRoomChest(rt, Math.round(rt.arenaWidth / 2 - 110), Math.round(rt.arenaHeight / 2), 'treasure');
    spawnRoomChest(rt, Math.round(rt.arenaWidth / 2 + 110), Math.round(rt.arenaHeight / 2), 'coins');
    if (Math.random() < 0.25) {
      const vaultScroll = pickSpecificScrollTarget(rt);
      spawnSkillScroll(
        rt,
        Math.round(rt.arenaWidth / 2),
        Math.round(rt.arenaHeight / 2 - 75),
        vaultScroll.targetWeapon,
        vaultScroll.skillSlot
      );
    }
    spawnConnectedGates(rt, targetRoom);
    soundEngine.playBoonSelect();
    showPhaseAnnounce(rt, `ANCIENT TREASURE VAULT · GOLD & LOOT CHESTS!`, '#34d399', 2.8);
  } else {
    rt.roomTotalWaves = rt.loopLevel >= 2 ? Math.min(3, rt.loopLevel) : 1;
    rt.roomWave = 1;
    rt.waveNumber = 1;
    spawnWaveEnemies(rt, combatStage, 1);
    showPhaseAnnounce(
      rt,
      rt.roomTotalWaves > 1
        ? `FLOOR ${rt.floorNumber} · ${targetRoom.label} (${rt.roomTotalWaves} WAVES)`
        : `FLOOR ${rt.floorNumber} · ${targetRoom.label} (${Math.round(getEnemyScaleMult(rt) * 10) / 10}X)`,
      '#38bdf8',
      2.6
    );
  }
}

function spawnWaveEnemies(rt: GameRuntime, stage: StageKey, wave: number) {
  rt.enemies = [];
  rt.roomWave = wave;
  const alive = rt.players.filter((p) => p.state === 'alive');

  const pickSafePos = (size: number) => {
    let ex = rt.arenaWidth / 2;
    let ey = rt.arenaHeight / 2;
    for (let att = 0; att < 50; att++) {
      ex = 48 + Math.random() * (rt.arenaWidth - 96 - size);
      ey = 68 + Math.random() * (rt.arenaHeight - 136 - size);
      const farEnough = alive.every((p) => Math.hypot(ex - p.x, ey - p.y) > 175);
      if (farEnough) break;
    }
    return { ex, ey };
  };

  let baseRoster: EnemyType[] = [];
  if (stage === 'ironDungeon') {
    baseRoster =
      wave === 1
        ? ['bouncer', 'bouncer', 'bouncer', 'bouncer', 'splitter', 'splitter', 'charger']
        : ['bouncer', 'bouncer', 'splitter', 'splitter', 'charger', 'charger', 'charger'];
  } else if (stage === 'voidDungeon') {
    baseRoster = ['void_stalker', 'void_stalker', 'void_stalker', 'void_stalker', 'charger', 'charger', 'splitter'];
  } else if (stage === 'oniDungeon') {
    baseRoster = ['oni_acolyte', 'oni_acolyte', 'oni_acolyte', 'oni_acolyte', 'charger', 'charger', 'bouncer'];
  }

  const mult = getEnemyScaleMult(rt);
  const targetCount = Math.max(baseRoster.length, Math.round(baseRoster.length * mult));
  const roster: EnemyType[] = [];
  for (let i = 0; i < targetCount; i++) {
    roster.push(baseRoster[i % baseRoster.length]);
  }

  const loopSpeedBoost = 1 + Math.max(0, rt.loopLevel - 1) * 0.14;
  const enemySpdMult = (rt.difficulty === 'hard' ? 1.32 : rt.difficulty === 'medium' ? 1.24 : 1.1) * loopSpeedBoost;
  const diffHpScale = rt.difficulty === 'hard' ? 1.25 : rt.difficulty === 'easy' ? 0.75 : 1.0;
  const loopHpBonus = Math.max(0, rt.loopLevel - 1) * 2;
  const baseMobHpMap: Record<EnemyType, number> = {
    bouncer: 3,
    void_stalker: 3,
    oni_acolyte: 4,
    splitter: 4,
    charger: 5,
    mini_spark: 2,
  };

  roster.forEach((type, idx) => {
    const isElite =
      (rt.loopLevel >= 2 && idx % 4 === 2) ||
      (rt.loopLevel === 1 && rt.isOnlineCampaign && rt.roomDepth >= 3 && idx === targetCount - 1);
    const baseSize = type === 'splitter' ? 36 : type === 'charger' ? 32 : 30;
    const size = baseSize + (isElite ? 6 : 0);
    const { ex, ey } = pickSafePos(size);
    const angle = Math.random() * Math.PI * 2;
    const baseSpeed =
      (type === 'charger'
        ? 2.2
        : type === 'void_stalker'
        ? 3.2
        : type === 'oni_acolyte'
        ? 2.1
        : 2.7 + Math.random() * 1.2) * enemySpdMult;

    const rawHp = (baseMobHpMap[type] ?? 3) + loopHpBonus + (isElite ? 3 : 0);
    const hpMax = Math.max(2, Math.round(rawHp * diffHpScale));

    rt.enemies.push({
      id: rt.nextUid++,
      type,
      x: ex,
      y: ey,
      size,
      speed: baseSpeed,
      dx: Math.cos(angle),
      dy: Math.sin(angle),
      rotation: Math.random() * Math.PI * 2,
      hp: hpMax,
      maxHp: hpMax,
      isElite,
      hitFlashTimer: 0,
      chargeState: type === 'charger' ? 'roam' : undefined,
      chargeTimer: type === 'charger' ? (1.4 + Math.random() * 1.6) / enemySpdMult : undefined,
      blinkTimer: type === 'void_stalker' ? (2 + Math.random() * 2) / enemySpdMult : undefined,
      alpha: 1,
      shootTimer: type === 'oni_acolyte' ? (1.8 + Math.random() * 1.5) / enemySpdMult : undefined,
    });
  });

  soundEngine.playEnemySpawn();
}

export function transitionToStage(rt: GameRuntime, targetStage: StageKey) {
  rt.pendingEvent = null;
  rt.stageElapsed = 0;
  rt.enemies = [];
  rt.chests = [];
  rt.weaponDrops = [];
  rt.scrollDrops = [];
  rt.skillZones = [];
  rt.gates = [];
  rt.shopItems = [];
  rt.shopNpc = null;
  rt.lastKilledPos = null;
  rt.bossProjectiles = [];
  rt.playerProjectiles = [];
  rt.voidDecoys = [];
  rt.telegraphLines = [];
  rt.comicSlashes = [];
  rt.voidRifts = [];
  rt.energyWaves = [];
  rt.oniShrines = [];
  rt.oniSpiritBombs = [];
  rt.oniCursedZones = [];
  rt.voidTentacles = [];
  rt.eclipseBeacons = [];
  rt.eclipsePylons = [];
  rt.eclipsePrison = null;
  rt.eclipseMirrors = [];
  rt.eclipseMarkedBy = null;
  rt.eclipseMarkTimer = 0;
  rt.eclipseCounterFlashTimer = 0;
  rt.eclipseSyncTimer = 0;
  rt.eclipseTetherTimer = 0;
  rt.eclipseSanctuaryActive = false;
  rt.medkits = [];
  rt.relics = [];
  rt.bossNameReveal = false;
  rt.bossDeadTimer = 0;
  rt.bossDeadBeat = 0;
  rt.bossVoiceLine = null;
  rt.bossVoiceTimer = 0;
  rt.waveNumber = 1;

  const isBossTarget =
    targetStage === 'mechaBoss' ||
    targetStage === 'voidBoss' ||
    targetStage === 'oniBoss' ||
    targetStage === 'eclipseBoss';
  rt.arenaWidth = isBossTarget ? BOSS_ARENA_WIDTH : rt.isOnlineCampaign ? DUNGEON_ARENA_WIDTH : CANVAS_WIDTH;
  rt.arenaHeight = isBossTarget ? BOSS_ARENA_HEIGHT : rt.isOnlineCampaign ? DUNGEON_ARENA_HEIGHT : CANVAS_HEIGHT;
  rt.ambientMotes = createAmbientMotes(isBossTarget ? 52 : 28, rt.arenaWidth, rt.arenaHeight);

  rt.players.forEach((p) => {
    if (p.state === 'spectator') return;
    p.state = 'alive';
    p.invulnerable = true;
    p.invulnFrames = 0;
    p.dashImmune = false;
    p.dashTimeLeft = 0;
    p.postDashInvulnerability = 0;
    p.x = getSpawnXForPlayer(p.id, rt.numPlayers, rt.arenaWidth, isBossTarget, rt.isOnlineCampaign);
    p.y = -220;
    p.hp = Math.min(p.maxHp, p.hp + 30);
    p.dashReady = true;
    p.dashCooldownTimer = 0;
    p.dash2Active = false;
    p.dash2Ready = false;
    p.dash2CooldownTimer = 0;
    p.abilityReady = usesWeaponSystem(rt) ? p.weapon !== 'none' : true;
    p.abilityCooldownTimer = 0;
    p.skillCooldowns = [0, 0, 0, 0];
    p.cloakTimer = 0;
    p.whirlwindTimer = 0;
    p.fortifyTimer = 0;
    p.frontShieldTimer = 0;
    p.bloodlustTimer = 0;
    p.chargeTimer = 0;
    p.empoweredStrike = false;
    p.dashTrail = [];
    p.safeZoneClosed = false;
    p.inSafeZone = true;
    p.hasKnife = false;
    p.sealed = false;
    p.sealTimer = 0;
    p.overdriveTimer = 0;
    p.magnetTimer = 0;
    p.cleanDodgeFailed = false;
    if (hasBoon(rt, 'aegis_core') || (!usesWeaponSystem(rt) && p.heroClass === 'vanguard') || p.weapon === 'tank_shield') {
      p.hasShield = true;
    }
  });

  rt.p1SafeZone = { x: 50, y: 50, width: 200, height: 185, color: 'rgba(56, 189, 248, 0.12)' };
  rt.p2SafeZone = { x: 550, y: 50, width: 200, height: 185, color: 'rgba(244, 63, 94, 0.12)' };
  rt.camera = { x: rt.arenaWidth / 2, y: rt.arenaHeight / 2, zoom: isBossTarget ? 0.65 : rt.isOnlineCampaign ? 0.72 : 1 };

  rt.knives = spawnKnivesForPlayers(rt.players, rt.playerColors, rt.arenaWidth, rt.arenaHeight);
  rt.introPlaying = true;
  rt.introTimer = 0;
  rt.fadeOpacity = 1;
  rt.landingSlowRemaining = 0;
  rt.timeScale = 1;
  rt.screenShake = 0;
  rt.freezeTime = 0;

  if (isBossTarget) {
    setupBossStage(rt, targetStage);
  } else {
    rt.stage = targetStage;
    rt.isBossLevel = false;
    soundEngine.setMusicTrack(targetStage, false);
  }
}

function setupBossStage(
  rt: GameRuntime,
  stage: 'mechaBoss' | 'voidBoss' | 'oniBoss' | 'eclipseBoss',
  forcedVariantId?: BossVariantId
) {
  rt.stage = stage;
  rt.isBossLevel = true;
  rt.arenaWidth = BOSS_ARENA_WIDTH;
  rt.arenaHeight = BOSS_ARENA_HEIGHT;
  rt.bossProjectiles = [];
  rt.telegraphLines = [];
  rt.comicSlashes = [];
  rt.voidRifts = [];
  rt.energyWaves = [];
  rt.eclipseBeacons = [];
  rt.eclipsePylons = [];
  rt.eclipsePrison = null;
  rt.eclipseMirrors = [];
  rt.eclipseMarkedBy = null;
  rt.eclipseMarkTimer = 0;
  rt.eclipseCounterFlashTimer = 0;
  rt.eclipseSyncTimer = 0;
  rt.eclipseTetherTimer = 0;
  rt.eclipseSanctuaryActive = false;
  rt.bossNameReveal = false;
  rt.bossDeadTimer = 0;
  rt.bossDeadBeat = 0;
  rt.bossVoiceLine = null;
  rt.bossVoiceTimer = 0;
  rt.ambientMotes = createAmbientMotes(52, rt.arenaWidth, rt.arenaHeight);

  // Position players cleanly; safeZone is closed in boss stages so players aren't permanently shielded
  const landY = Math.round(rt.arenaHeight * 0.7);
  rt.players.forEach((p) => {
    if (p.state === 'spectator') return;
    p.x = getSpawnXForPlayer(p.id, rt.numPlayers, rt.arenaWidth, true, false);
    if (rt.introPlaying) p.y = -180;
    p.safeZoneClosed = true;
    p.inSafeZone = false;
    p.invulnerable = rt.introPlaying;
    p.dashImmune = false;
    p.dashTimeLeft = 0;
    p.invulnFrames = 0;
    if (hasBoon(rt, 'aegis_core') || (!usesWeaponSystem(rt) && p.heroClass === 'vanguard') || p.weapon === 'tank_shield') {
      p.hasShield = true;
    }
  });
  rt.p1SafeZone =
    rt.numPlayers > 2
      ? {
          x: Math.round(rt.arenaWidth * 0.2),
          y: landY - 75,
          width: Math.round(rt.arenaWidth * 0.6),
          height: 190,
          color: 'rgba(56, 189, 248, 0.1)',
        }
      : {
          x: Math.round(rt.arenaWidth * 0.34) - 80,
          y: landY - 75,
          width: 210,
          height: 190,
          color: 'rgba(56, 189, 248, 0.1)',
        };
  rt.p2SafeZone =
    rt.numPlayers > 2
      ? { ...rt.p1SafeZone }
      : {
          x: Math.round(rt.arenaWidth * 0.64) - 80,
          y: landY - 75,
          width: 210,
          height: 190,
          color: 'rgba(244, 63, 94, 0.1)',
        };
  rt.knives = spawnKnivesForPlayers(rt.players, rt.playerColors, rt.arenaWidth, rt.arenaHeight);
  rt.camera = { x: rt.arenaWidth / 2, y: rt.arenaHeight * 0.52, zoom: 0.64 };

  rt.players.forEach((p) => {
    if (p.state !== 'spectator') p.cleanDodgeFailed = false;
  });
  rt.bossHitCooldowns = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const bx = Math.round(rt.arenaWidth / 2 - 58);
  const duoHpMult = getBossHpMult(rt);
  const bossTypeForStage: BossType =
    stage === 'mechaBoss' ? 'mecha' : stage === 'voidBoss' ? 'void' : stage === 'oniBoss' ? 'oni' : 'eclipse';
  const stageVariants = BOSS_VARIANTS.filter((v) => v.bossType === bossTypeForStage);
  const chosenVariant =
    (forcedVariantId && stageVariants.find((v) => v.id === forcedVariantId)) ||
    stageVariants[(rt.loopLevel + rt.bossesDefeatedCount + (rt.difficulty === 'hard' ? 1 : 0)) % Math.max(1, stageVariants.length)] ||
    stageVariants[0];

  if (stage === 'mechaBoss') {
    rt.bossType = 'mecha';
    const hp = Math.round(rt.diffSettings.mechaHP * duoHpMult);
    rt.boss = {
      ...createEmptyBoss(),
      variantId: chosenVariant?.id || 'mecha_bastion',
      x: bx,
      y: -260,
      targetX: bx,
      size: 116,
      health: hp,
      maxHealth: hp,
      state: 'comic_intro',
      stateTimer: 7.4,
      attackPattern: 'rotary_spiral',
      originalY: 140,
      maxWeakenedHits: 4,
      attacksNeeded: rt.difficulty === 'hard' ? 3 : 2,
    };
  } else if (stage === 'voidBoss') {
    rt.bossType = 'void';
    const hp = Math.round(rt.diffSettings.bossHP * duoHpMult);
    rt.boss = {
      ...createEmptyBoss(),
      variantId: chosenVariant?.id || 'void_reaper',
      x: bx,
      y: 160,
      targetX: bx,
      size: 116,
      health: hp,
      maxHealth: hp,
      state: 'comic_intro',
      stateTimer: 7.4,
      attackPattern: 'void_rifts',
      originalY: 160,
      maxWeakenedHits: 5,
      attacksNeeded: 3,
    };
    initVoidTentacles(rt);
  } else if (stage === 'oniBoss') {
    rt.bossType = 'oni';
    const hp = Math.round(rt.diffSettings.oniHP * duoHpMult);
    const oniY = Math.round(rt.arenaHeight * 0.34);
    rt.boss = {
      ...createEmptyBoss(),
      variantId: chosenVariant?.id || 'oni_shogun',
      x: bx,
      y: oniY,
      targetX: bx,
      size: 116,
      health: hp,
      maxHealth: hp,
      state: 'comic_intro',
      stateTimer: 7.4,
      attackPattern: 'iaijutsu_cut',
      originalY: oniY,
      maxWeakenedHits: 4,
      attacksNeeded: rt.difficulty === 'hard' ? 3 : 2,
    };
  } else {
    rt.bossType = 'eclipse';
    const hp = Math.round(rt.diffSettings.eclipseHP * duoHpMult);
    const ecY = Math.round(rt.arenaHeight * 0.28);
    rt.boss = {
      ...createEmptyBoss(),
      variantId: chosenVariant?.id || 'eclipse_bastion',
      x: bx - 8,
      y: ecY,
      targetX: bx - 8,
      size: 132,
      health: hp,
      maxHealth: hp,
      state: 'comic_intro',
      stateTimer: 7.4,
      attackPattern: 'eclipse_nova',
      originalY: ecY,
      maxWeakenedHits: 4,
      attacksNeeded: rt.difficulty === 'hard' ? 3 : 2,
    };
  }

  soundEngine.setMusicTrack(stage, false);
}

function initVoidTentacles(rt: GameRuntime) {
  rt.voidTentacles = [];
  const isP2 = rt.boss.phase === 2;
  const count = isP2 ? 8 : 6;
  for (let i = 0; i < count; i++) {
    rt.voidTentacles.push({
      baseAngle: (i / count) * Math.PI * 2,
      segments: 8,
      segLength: 24 + Math.random() * 8,
      waveOffset: Math.random() * Math.PI * 2,
      waveSpeed: 1.6 + Math.random() * 0.9,
      thickness: 8 + Math.random() * 4,
      extendFactor: 0,
      extending: false,
      retractTimer: 0,
      damageEnabled: false,
      color: isP2 ? '#a855f7' : '#9333ea',
      glowColor: isP2 ? '#e879f9' : '#c084fc',
    });
  }
}

export function getTentacleSegments(
  t: VoidTentacle,
  cx: number,
  cy: number,
  bossSize: number,
  pulseSize: number,
  animTimer: number
) {
  const segs: { x: number; y: number }[] = [];
  const radius = (bossSize / 2) * pulseSize;
  const baseX = cx + Math.cos(t.baseAngle + animTimer * 0.5) * radius * 0.7;
  const baseY = cy + Math.sin(t.baseAngle + animTimer * 0.5) * radius * 0.7;
  segs.push({ x: baseX, y: baseY });
  let curAng = t.baseAngle + animTimer * 0.5;
  for (let s = 1; s <= t.segments; s++) {
    const wave = Math.sin(t.waveOffset + s * 0.7) * 0.4;
    const extend = t.extendFactor;
    const segLen = t.segLength * (0.5 + extend * 0.5) * (1 - s / (t.segments * 1.5)) * extend;
    curAng += wave * 0.25;
    const prev = segs[segs.length - 1];
    segs.push({
      x: prev.x + Math.cos(curAng) * segLen,
      y: prev.y + Math.sin(curAng) * segLen,
    });
  }
  return segs;
}

function strikeTentacles(rt: GameRuntime, count: number) {
  const shuffled = [...rt.voidTentacles].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const t = shuffled[i];
    t.extending = true;
    t.extendFactor = 0;
    t.retractTimer = 1.15 + Math.random() * 0.35;
    t.damageEnabled = false;
  }
}

function getRandomAlivePlayer(rt: GameRuntime): Player {
  const alive = rt.players.filter((p) => p.state === 'alive');
  if (alive.length > 0) return alive[Math.floor(Math.random() * alive.length)];
  const active = rt.players.filter((p) => p.state !== 'spectator');
  return active[0] || rt.players[0];
}

function createDeathEffect(rt: GameRuntime, x: number, y: number, size: number, color: string) {
  rt.deathEffects.push({
    type: 'shockwave',
    x: x + size / 2,
    y: y + size / 2,
    radius: 0,
    maxRadius: 85,
    alpha: 1,
    color,
    lifetime: 0.7,
  });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const sp = 110 + Math.random() * 140;
    rt.deathEffects.push({
      type: 'particle',
      x: x + size / 2,
      y: y + size / 2,
      dx: Math.cos(a) * sp,
      dy: Math.sin(a) * sp,
      size: 4 + Math.random() * 3,
      alpha: 1,
      color,
      lifetime: 0.85,
    });
  }
}

function updateCombo(rt: GameRuntime, playerId: PlayerId) {
  if (!rt.playerCombos[playerId]) {
    rt.playerCombos[playerId] = { count: 0, timer: 0 };
  }
  const c = rt.playerCombos[playerId];
  c.count++;
  c.timer = 2.6;
  if (c.count > rt.maxCombo) rt.maxCombo = c.count;
  rt.stylePoints = Math.min(100, rt.stylePoints + 8);
  const styleMult = 1 + Math.floor(rt.stylePoints / 20) * 0.15;
  rt.score += Math.round((130 + c.count * 35) * getScoreMult(rt) * styleMult);

  if (hasBoon(rt, 'vampiric_edge') && c.count > 0 && c.count % 6 === 0) {
    const player = rt.players.find((p) => p.id === playerId);
    if (player && player.state === 'alive' && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + 15);
      addFloatingText(rt, player.x + player.size / 2, player.y - 14, '+15 HP HARVEST', '#f43f5e', 1.1);
      soundEngine.playMedkit();
    }
  }
}

function damagePlayer(rt: GameRuntime, player: Player, rawDamage = 18) {
  if (
    rt.cheats.godMode ||
    player.invulnFrames > 0 ||
    player.postDashInvulnerability > 0 ||
    player.invulnerable ||
    player.dashImmune ||
    player.cloakTimer > 0
  ) {
    return;
  }

  if (player.hasShield) {
    player.hasShield = false;
    if (player.weapon === 'tank_shield' || (!usesWeaponSystem(rt) && player.heroClass === 'vanguard')) {
      player.tankShieldReady = false;
      player.shieldRegenTimer = player.weapon === 'tank_shield' ? 26 : 24;
    }
    player.invulnFrames = 1.0;
    rt.screenShake = Math.max(rt.screenShake, 10);
    soundEngine.playParry();
    addFloatingText(rt, player.x + player.size / 2, player.y - 12, 'SHIELD BLOCK!', '#38bdf8', 1.1);
    rt.energyWaves.push({
      x: player.x + player.size / 2,
      y: player.y + player.size / 2,
      radius: 10,
      maxRadius: 120,
      alpha: 0.9,
      speed: 280,
      color: '#38bdf8',
    });
    return;
  }

  const loopDmgMult = 1 + Math.max(0, rt.loopLevel - 1) * 0.18;
  const fortifyFactor = player.fortifyTimer > 0 ? 0.5 : 1.0;
  const dmg = Math.max(
    4,
    Math.round(rawDamage * (rt.isTutorial ? 0.8 : rt.diffSettings.damageMultiplier * loopDmgMult) * fortifyFactor)
  );
  player.hp = Math.max(0, player.hp - dmg);
  player.cleanDodgeFailed = true;
  player.invulnFrames = 0.95;
  rt.stylePoints = Math.max(0, rt.stylePoints - 18);
  rt.screenShake = Math.max(rt.screenShake, dmg >= 28 ? 16 : 11);
  soundEngine.playPlayerHit();
  createDeathEffect(rt, player.x, player.y, player.size, player.color);
  addFloatingText(
    rt,
    player.x + player.size / 2,
    player.y - 12,
    player.fortifyTimer > 0 ? `-${dmg} ARMORED` : `-${dmg} HP`,
    dmg >= 28 ? '#ef4444' : '#fb7185',
    dmg >= 28 ? 1.25 : 1.05
  );

  if (player.fortifyTimer > 0) {
    const cx = player.x + player.size / 2;
    const cy = player.y + player.size / 2;
    rt.energyWaves.push({ x: cx, y: cy, radius: 10, maxRadius: 145, alpha: 0.85, speed: 420, color: '#38bdf8' });
    rt.enemies.forEach((e) => {
      if (Math.hypot(e.x + e.size / 2 - cx, e.y + e.size / 2 - cy) <= 150) {
        e.stunTimer = 1.4;
      }
    });
  }

  if (player.hp <= 0) {
    if (rt.isTutorial) {
      player.hp = player.maxHp;
      player.invulnFrames = 1.5;
      addFloatingText(rt, player.x + player.size / 2, player.y - 26, 'TRAINING RECOVERY!', '#34d399', 1.15);
    } else {
      player.state = 'down';
      player.hasKnife = false;
      repositionKnifeForPlayer(rt, player);
    }
  }
}

function shouldAllowArenaCombatSpawns(rt: GameRuntime): boolean {
  if (rt.isTutorial || rt.introPlaying || rt.bossDeadTimer > 0) return false;
  if (rt.isBossLevel) {
    return rt.boss.health > 0 && rt.boss.state !== 'dead';
  }
  if (rt.isOnlineCampaign) {
    const room = rt.floorGrid[rt.currentRoomKey];
    if (rt.gates.length > 0) return false;
    if (room && (room.cleared || room.kind === 'shop' || room.kind === 'treasure')) return false;
    return rt.enemies.length > 0;
  }
  return rt.enemies.length > 0;
}

function spawnMedkit(rt: GameRuntime) {
  if (!shouldAllowArenaCombatSpawns(rt)) return;
  if (rt.medkits.length >= 2) return;
  rt.medkits.push({
    x: 90 + Math.random() * (rt.arenaWidth - 180),
    y: 110 + Math.random() * (rt.arenaHeight - 220),
    size: 24,
    bob: Math.random() * Math.PI * 2,
  });
  rt.medkitNotif = 'ESTUS KIT DROPPED';
  rt.medkitNotifTimer = 2.4;
}

function spawnRelic(rt: GameRuntime) {
  if (!shouldAllowArenaCombatSpawns(rt)) return;
  if (rt.relics.length >= 2) return;
  const types: RelicType[] = ['overdrive', 'shield', 'magnet', 'nova'];
  const type = types[Math.floor(Math.random() * types.length)];
  rt.relics.push({
    id: rt.nextUid++,
    type,
    x: 100 + Math.random() * (rt.arenaWidth - 200),
    y: 120 + Math.random() * (rt.arenaHeight - 240),
    size: 26,
    lifetime: 14,
    bob: Math.random() * Math.PI * 2,
  });
}

function purchaseShopItem(rt: GameRuntime, p: Player, item: ShopItem): boolean {
  if (item.globalSold || item.purchasedBy.includes(p.id)) return false;
  if (item.kind === 'skill_scroll') {
    const tw = item.targetWeapon || (p.weapon !== 'none' ? p.weapon : undefined);
    const slot = item.skillSlot || 2;
    if (!tw) {
      if (p.scrollBag.length >= 8) {
        addFloatingText(rt, p.x + p.size / 2, p.y - 20, 'SCROLL BAG FULL!', '#94a3b8', 0.9);
        return false;
      }
    } else if (hasLearnedSlot(p, tw, slot) && p.scrollBag.length >= 8) {
      const wDef = WEAPONS_CATALOG.find((w) => w.id === tw);
      addFloatingText(rt, p.x + p.size / 2, p.y - 20, `${wDef?.shortTag || 'SKILL'} ALREADY LEARNED!`, '#c084fc', 0.9);
      return false;
    }
  }
  if (p.coins < item.cost) {
    addFloatingText(rt, p.x + p.size / 2, p.y - 20, `NEED ${item.cost}g`, '#f43f5e', 0.9);
    return false;
  }

  p.coins -= item.cost;
  soundEngine.playBoonSelect();

  if (item.kind === 'potion') {
    item.purchasedBy.push(p.id);
    p.hp = Math.min(p.maxHp, p.hp + 35);
    const prevPot = p.potions;
    p.potions = Math.min(2, p.potions + 1);
    addFloatingText(
      rt,
      p.x + p.size / 2,
      p.y - 16,
      prevPot >= 2 ? '+35 HP (BELT MAX 2 FLASKS)' : '+35 HP & +1 FLASK (MAX 2)!',
      '#34d399',
      1.15
    );
  } else if (item.kind === 'potion_pack') {
    item.purchasedBy.push(p.id);
    p.hp = Math.min(p.maxHp, p.hp + 65);
    addFloatingText(rt, p.x + p.size / 2, p.y - 16, '+65 HP SANGUINE DRAUGHT!', '#10b981', 1.15);
  } else if (item.kind === 'max_hp') {
    item.purchasedBy.push(p.id);
    p.bonusMaxHp += 20;
    p.maxHp += 20;
    p.hp = Math.min(p.maxHp, p.hp + 35);
    addFloatingText(rt, p.x + p.size / 2, p.y - 16, '+20 MAX HP!', '#f43f5e', 1.15);
  } else if (item.kind === 'skill_scroll') {
    const tw = (item.targetWeapon || 'tank_shield') as WeaponClassId;
    const slot = item.skillSlot || 2;
    item.purchasedBy.push(p.id);
    const wDef = WEAPONS_CATALOG.find((w) => w.id === tw);
    const sk = wDef?.skills[slot - 1];
    if (!hasLearnedSlot(p, tw, slot)) {
      unlockSkillSlot(p, tw, slot);
      if (p.weapon === tw) {
        p.unlockedSkillTier = getLearnedSlots(p, tw).length;
      }
      addFloatingText(
        rt,
        p.x + p.size / 2,
        p.y - 20,
        `LEARNED ${wDef?.shortTag || ''} [${sk?.keyLabel || ''}]: ${sk?.name.toUpperCase() || ''}!`,
        wDef?.accent || '#c084fc',
        1.15
      );
    } else if (p.scrollBag.length < 8) {
      p.scrollBag.push({ id: rt.nextUid++, targetWeapon: tw, skillSlot: slot });
      addFloatingText(
        rt,
        p.x + p.size / 2,
        p.y - 20,
        `STORED ${wDef?.shortTag || ''} [${sk?.keyLabel || ''}] IN BAG [I]!`,
        wDef?.accent || '#c084fc',
        1.1
      );
    }
  } else if (item.kind === 'shield') {
    item.purchasedBy.push(p.id);
    p.hasShield = true;
    addFloatingText(rt, p.x + p.size / 2, p.y - 16, 'AEGIS SHIELD!', '#38bdf8', 1.15);
  } else if (item.kind === 'weapon_crate') {
    item.globalSold = true;
    const wid = item.weaponId || pickRandomWeaponId(rt, true);
    rt.weaponDrops.push({
      id: rt.nextUid++,
      weaponId: wid,
      x: p.x + p.size / 2 + 48,
      y: p.y + p.size / 2 + 12,
      size: 28,
      bob: 0,
      swapLockTimer: 0.4,
    });
    addFloatingText(rt, p.x + p.size / 2, p.y - 20, 'ARMORY WEAPON DROPPED!', '#fbbf24', 1.2);
  }
  return true;
}

function triggerSkillSlot(rt: GameRuntime, p: Player, slot: 1 | 2 | 3 | 4) {
  const cx = p.x + p.size / 2;
  const cy = p.y + p.size / 2;
  const idx = slot - 1;

  if (usesWeaponSystem(rt) && p.weapon === 'none') {
    addFloatingText(rt, cx, p.y - 14, 'FIND A WEAPON FIRST!', '#94a3b8', 0.9);
    return;
  }

  if (usesWeaponSystem(rt)) {
    if (!hasLearnedSlot(p, p.weapon as WeaponClassId, slot)) {
      const wDef = WEAPONS_CATALOG.find((w) => w.id === p.weapon);
      const sk = wDef?.skills[slot - 1];
      addFloatingText(rt, cx, p.y - 14, `LOCKED · NEED [${sk?.keyLabel || 'SCRL'}] SCROLL`, '#c084fc', 0.9);
      return;
    }
  } else if (slot > p.unlockedSkillTier) {
    addFloatingText(rt, cx, p.y - 14, `LOCKED · CLEAR STAGE (${slot}/4)`, '#c084fc', 0.9);
    return;
  }

  if (p.skillCooldowns[idx] > 0 && !rt.cheats.zeroCooldowns) {
    return;
  }

  const cd = p.skillMaxCooldowns[idx] || 14;
  p.skillCooldowns[idx] = cd;
  if (slot === 1) {
    p.abilityReady = false;
    p.abilityCooldownTimer = cd;
  }

// Tank exclusive utility: purges enemy projectiles, cursed zones, spirit bombs, telegraphs & ally Seals
function purgeEnemyEffectsInRadius(
  rt: GameRuntime,
  cx: number,
  cy: number,
  radius: number,
  shieldRadius = radius
): { purgedCount: number; cleansedCount: number } {
  let purgedCount = 0;
  let cleansedCount = 0;

  rt.bossProjectiles = rt.bossProjectiles.filter((bp) => {
    if (bp.type === 'phantom_clone') return true;
    if (Math.hypot(bp.x + bp.size / 2 - cx, bp.y + bp.size / 2 - cy) <= radius) {
      purgedCount++;
      return false;
    }
    return true;
  });

  if (rt.oniCursedZones.length > 0) {
    rt.oniCursedZones = rt.oniCursedZones.filter((z) => {
      if (Math.hypot(z.x - cx, z.y - cy) <= radius + z.radius * 0.45) {
        purgedCount++;
        return false;
      }
      return true;
    });
  }

  if (rt.oniSpiritBombs.length > 0) {
    rt.oniSpiritBombs = rt.oniSpiritBombs.filter((b) => {
      if (Math.hypot(b.x - cx, b.y - cy) <= radius) {
        purgedCount++;
        return false;
      }
      return true;
    });
  }

  rt.enemies.forEach((e) => {
    if (Math.hypot(e.x + e.size / 2 - cx, e.y + e.size / 2 - cy) <= radius) {
      if (e.type === 'charger' && e.chargeState === 'telegraph') {
        e.chargeState = 'roam';
        e.chargeTimer = 2.0;
        purgedCount++;
      }
      if (e.type === 'oni_acolyte' && (e.shootTimer || 0) < 1.2) {
        e.shootTimer = 2.6;
        purgedCount++;
      }
    }
  });

  rt.players.forEach((ally) => {
    if (ally.state !== 'alive') return;
    const d = Math.hypot(ally.x + ally.size / 2 - cx, ally.y + ally.size / 2 - cy);
    if (d <= shieldRadius) {
      if (!ally.hasShield) {
        ally.hasShield = true;
        addFloatingText(rt, ally.x + ally.size / 2, ally.y - 12, 'SHIELDED!', '#38bdf8', 0.95);
      }
      if (ally.sealed) {
        ally.sealed = false;
        ally.sealTimer = 0;
        cleansedCount++;
        addFloatingText(rt, ally.x + ally.size / 2, ally.y - 24, 'SEAL PURGED!', '#22d3ee', 1.0);
      }
    }
  });

  if (purgedCount > 0) {
    rt.score += purgedCount * 35;
  }
  return { purgedCount, cleansedCount };
}

  if (usesWeaponSystem(rt)) {
    // === HOLY STAFF (PURE HEALER + PLAGUE MIASMA PURIFIER) ===
    if (p.weapon === 'holy_staff') {
      if (
        rt.isBossLevel &&
        (rt.boss.channelKind === 'cursed_miasma' || rt.boss.channelKind === 'blood_curse') &&
        (rt.boss.channelTimer || 0) > 0
      ) {
        registerMiasmaPurge(rt, p, true);
      }
      if (slot === 1) {
        soundEngine.playMedkit();
        rt.energyWaves.push({ x: cx, y: cy, radius: 14, maxRadius: 260, alpha: 0.9, speed: 440, color: '#fde047' });
        let count = 0;
        rt.players.forEach((ally) => {
          if (ally.state === 'spectator') return;
          if (Math.hypot(ally.x + ally.size / 2 - cx, ally.y + ally.size / 2 - cy) <= 260) {
            if (ally.state === 'alive') {
              ally.hp = Math.min(ally.maxHp, ally.hp + 14);
              count++;
              addFloatingText(rt, ally.x + ally.size / 2, ally.y - 14, '+14 HP', '#fde047', 1.0);
            } else if (ally.state === 'down') {
              ally.reviveProgress = Math.min(REVIVE_TIME, ally.reviveProgress + REVIVE_TIME * 0.25);
              count++;
              addFloatingText(rt, ally.x + ally.size / 2, ally.y - 14, '+25% REVIVE', '#34d399', 1.0);
            }
          }
        });
        addFloatingText(rt, cx, p.y - 24, `SANCTUARY HYMN (${count})`, '#fde047', 1.1);
      } else if (slot === 2) {
        soundEngine.playCoopResonance();
        rt.skillZones.push({
          id: rt.nextUid++,
          ownerId: p.id,
          kind: 'holy_ground',
          x: cx,
          y: cy,
          radius: 185,
          timer: 5.0,
          maxTimer: 5.0,
          tickTimer: 0.45,
          color: '#fde047',
        });
        addFloatingText(rt, cx, p.y - 20, 'CONSECRATED GROUND!', '#fde047', 1.15);
      } else if (slot === 3) {
        soundEngine.playMedkit();
        // Lifebinder Blessing: Burst heal or massive revive on the most-injured ally within 340px
        const candidates = rt.players.filter(
          (ally) =>
            ally.state !== 'spectator' &&
            ally.id !== p.id &&
            Math.hypot(ally.x + ally.size / 2 - cx, ally.y + ally.size / 2 - cy) <= 340
        );
        candidates.sort((a, b) => {
          if (a.state === 'down' && b.state !== 'down') return -1;
          if (b.state === 'down' && a.state !== 'down') return 1;
          return a.hp / Math.max(1, a.maxHp) - b.hp / Math.max(1, b.maxHp);
        });
        const target = candidates[0] || p;
        const tx = target.x + target.size / 2;
        const ty = target.y + target.size / 2;
        p.hp = Math.min(p.maxHp, p.hp + 8);
        rt.energyWaves.push({ x: tx, y: ty, radius: 12, maxRadius: 140, alpha: 0.92, speed: 380, color: '#fef08a' });
        for (let k = 0; k < 8; k++) {
          const tFrac = k / 7;
          addParticle(rt, {
            x: cx + (tx - cx) * tFrac,
            y: cy + (ty - cy) * tFrac,
            dx: (Math.random() - 0.5) * 40,
            dy: -35 - Math.random() * 40,
            alpha: 1,
            size: 4,
            color: '#fde047',
          });
        }
        if (target.state === 'down') {
          target.reviveProgress = Math.min(REVIVE_TIME, target.reviveProgress + REVIVE_TIME * 0.55);
          addFloatingText(rt, tx, target.y - 16, '+55% REVIVE TETHER!', '#34d399', 1.15);
        } else {
          const healAmt = target.id === p.id ? 18 : 24;
          target.hp = Math.min(target.maxHp, target.hp + healAmt);
          addFloatingText(rt, tx, target.y - 16, `+${healAmt} HP BLESSING!`, '#fde047', 1.15);
        }
        addFloatingText(rt, cx, p.y - 24, 'LIFEBINDER BLESSING!', '#fef08a', 1.1);
      } else {
        soundEngine.playCoopResonance();
        rt.energyWaves.push({ x: cx, y: cy, radius: 20, maxRadius: 420, alpha: 0.96, speed: 580, color: '#fde047' });
        rt.players.forEach((ally) => {
          if (ally.state === 'alive') {
            ally.hp = Math.min(ally.maxHp, ally.hp + 20);
            addFloatingText(rt, ally.x + ally.size / 2, ally.y - 14, '+20 HP DAWN!', '#fef08a', 1.05);
          } else if (ally.state === 'down') {
            ally.reviveProgress = Math.min(REVIVE_TIME, ally.reviveProgress + REVIVE_TIME * 0.6);
            addFloatingText(rt, ally.x + ally.size / 2, ally.y - 14, '+60% REVIVE!', '#34d399', 1.1);
          }
        });
        addFloatingText(rt, cx, p.y - 26, 'SERAPHIC REVIVAL!', '#fde047', 1.2);
      }
      return;
    }

    // === TANK SHIELD (EXCLUSIVE: 4s Frontal Aegis Purification + Safe Shadow Behind + Sanctuary Dome) ===
    if (p.weapon === 'tank_shield') {
      if (slot === 1) {
        aimTankAtThreat(rt, p);
        soundEngine.playParry();
        p.frontShieldTimer = 4.0;
        p.hasShield = true;
        if (p.sealed) {
          p.sealed = false;
          p.sealTimer = 0;
        }
        const sx = cx + Math.cos(p.facingAngle) * 52;
        const sy = cy + Math.sin(p.facingAngle) * 52;
        rt.energyWaves.push({ x: sx, y: sy, radius: 10, maxRadius: 115, alpha: 0.92, speed: 480, color: '#38bdf8' });
        const { purgedCount, cleansedCount } = purgeEnemyEffectsInRadius(rt, sx, sy, 128, 120);
        rt.enemies.forEach((e) => {
          if (Math.hypot(e.x + e.size / 2 - sx, e.y + e.size / 2 - sy) <= 130) e.stunTimer = Math.max(e.stunTimer || 0, 1.5);
        });
        const total = purgedCount + cleansedCount;
        addFloatingText(
          rt,
          cx,
          p.y - 18,
          total > 0 ? `FRONTLINE AEGIS 4s (PURGED ${total})` : 'FRONTLINE AEGIS (4.0s)!',
          '#38bdf8',
          1.18
        );
      } else if (slot === 2) {
        soundEngine.playDash();
        p.chargeTimer = 0.55;
        p.invulnFrames = Math.max(p.invulnFrames, 0.7);
        p.dashDirX = Math.cos(p.facingAngle);
        p.dashDirY = Math.sin(p.facingAngle);
        addFloatingText(rt, cx, p.y - 18, 'BULWARK CHARGE!', '#38bdf8', 1.1);
      } else if (slot === 3) {
        soundEngine.playShockwave();
        p.fortifyTimer = 4.5;
        p.hasShield = true;
        rt.screenShake = Math.max(rt.screenShake, 14);
        rt.energyWaves.push({ x: cx, y: cy, radius: 14, maxRadius: 290, alpha: 0.96, speed: 640, color: '#22d3ee' });
        rt.skillZones.push({
          id: rt.nextUid++,
          ownerId: p.id,
          kind: 'sanctuary_dome',
          x: cx,
          y: cy,
          radius: 255,
          timer: 4.5,
          maxTimer: 4.5,
          tickTimer: 0.5,
          color: '#22d3ee',
        });
        const { purgedCount, cleansedCount } = purgeEnemyEffectsInRadius(rt, cx, cy, 290, 255);
        rt.enemies.forEach((e) => {
          if (Math.hypot(e.x + e.size / 2 - cx, e.y + e.size / 2 - cy) <= 255) {
            e.stunTimer = Math.max(e.stunTimer || 0, 2.4);
          }
        });
        if (rt.isBossLevel && rt.boss.health > 0 && rt.boss.state !== 'comic_intro' && rt.boss.state !== 'dead' && rt.boss.state !== 'phase_transition') {
          if (Math.hypot(rt.boss.x + rt.boss.size / 2 - cx, rt.boss.y + rt.boss.size / 2 - cy) <= 265) {
            handleBossHit(rt, p, false, 1);
            registerBossInterrupt(rt, p, 1);
          }
        }
        const total = purgedCount + cleansedCount;
        addFloatingText(rt, cx, p.y - 20, total > 0 ? `BASTION DOME! (PURGED ${total})` : 'BASTION DOME!', '#22d3ee', 1.18);
      } else {
        soundEngine.playShockwave();
        rt.screenShake = Math.max(rt.screenShake, 24);
        rt.energyWaves.push({ x: cx, y: cy, radius: 22, maxRadius: 380, alpha: 0.98, speed: 700, color: '#38bdf8' });
        rt.energyWaves.push({ x: cx, y: cy, radius: 14, maxRadius: 310, alpha: 0.9, speed: 560, color: '#ffffff' });
        rt.skillZones.push({
          id: rt.nextUid++,
          ownerId: p.id,
          kind: 'sanctuary_dome',
          x: cx,
          y: cy,
          radius: 330,
          timer: 5.0,
          maxTimer: 5.0,
          tickTimer: 0.5,
          color: '#38bdf8',
        });
        const { purgedCount } = purgeEnemyEffectsInRadius(rt, cx, cy, 380, 9999);
        rt.enemies.forEach((e) => {
          if (Math.hypot(e.x + e.size / 2 - cx, e.y + e.size / 2 - cy) <= 380) e.stunTimer = 3.8;
        });
        if (rt.isBossLevel && rt.boss.health > 0 && rt.boss.state !== 'comic_intro' && rt.boss.state !== 'dead' && rt.boss.state !== 'phase_transition') {
          if (Math.hypot(rt.boss.x + rt.boss.size / 2 - cx, rt.boss.y + rt.boss.size / 2 - cy) <= 385) {
            handleBossHit(rt, p, false, 2);
            registerBossInterrupt(rt, p, 2);
          }
        }
        addFloatingText(
          rt,
          cx,
          p.y - 22,
          purgedCount > 0 ? `COLOSSUS SANCTUARY (${purgedCount} WIPED!)` : 'COLOSSUS SANCTUARY!',
          '#38bdf8',
          1.25
        );
      }
      return;
    }

    // === ASSASSIN BLADES ===
    if (p.weapon === 'assassin_blades') {
      if (
        rt.isBossLevel &&
        (rt.boss.channelKind === 'emp_interrupt' || rt.boss.channelKind === 'mirage_ambush') &&
        (rt.boss.channelTimer || 0) > 0 &&
        Math.hypot(rt.boss.x + rt.boss.size / 2 - cx, rt.boss.y + rt.boss.size / 2 - cy) <= 440
      ) {
        registerBossInterrupt(rt, p, 3);
      }
      if (slot === 1) {
        soundEngine.playCloak();
        p.cloakTimer = 1.3;
        p.empoweredStrike = true;
        p.dashCooldownTimer = Math.max(0, p.dashCooldownTimer - 3.0);
        if (p.dashCooldownTimer <= 0) p.dashReady = true;
        rt.voidDecoys.push({ x: cx, y: cy, timer: 0.5, maxTimer: 0.5, color: '#a855f7', ownerId: p.id });
        addFloatingText(rt, cx, p.y - 14, 'SHADOW EXECUTION!', '#c084fc', 1.1);
      } else if (slot === 2) {
        soundEngine.playCrescentWave();
        for (const off of [-0.36, -0.18, 0, 0.18, 0.36]) {
          const ang = p.facingAngle + off;
          rt.playerProjectiles.push({
            uid: rt.nextUid++,
            ownerId: p.id,
            kind: 'shadow_kunai',
            x: cx,
            y: cy,
            dx: Math.cos(ang) * 14,
            dy: Math.sin(ang) * 14,
            angle: ang,
            radius: 14,
            color: '#c084fc',
            lifetime: 0.9,
            pierce: 2,
          });
        }
        addFloatingText(rt, cx, p.y - 16, 'KUNAI FAN!', '#c084fc', 1.1);
      } else if (slot === 3) {
        soundEngine.playCloak();
        rt.voidDecoys.push({ x: cx, y: cy, timer: 0.55, maxTimer: 0.55, color: '#a855f7', ownerId: p.id });
        p.x = Math.max(16, Math.min(rt.arenaWidth - p.size - 16, p.x + Math.cos(p.facingAngle) * 195));
        p.y = Math.max(16, Math.min(rt.arenaHeight - p.size - 16, p.y + Math.sin(p.facingAngle) * 195));
        p.invulnFrames = Math.max(p.invulnFrames, 0.45);
        p.dashReady = true;
        p.dashCooldownTimer = 0;
        rt.voidDecoys.push({ x: p.x + p.size / 2, y: p.y + p.size / 2, timer: 0.55, maxTimer: 0.55, color: '#e879f9', ownerId: p.id });
        addFloatingText(rt, p.x + p.size / 2, p.y - 16, 'PHANTOM BLINK!', '#e879f9', 1.15);
      } else {
        soundEngine.playSurge();
        p.bloodlustTimer = 4.5;
        p.empoweredStrike = true;
        for (let k = 0; k < 8; k++) {
          const ang = (k / 8) * Math.PI * 2;
          rt.playerProjectiles.push({
            uid: rt.nextUid++,
            ownerId: p.id,
            kind: 'shadow_kunai',
            x: cx,
            y: cy,
            dx: Math.cos(ang) * 13.5,
            dy: Math.sin(ang) * 13.5,
            angle: ang,
            radius: 16,
            color: '#e879f9',
            lifetime: 0.95,
            pierce: 3,
            bossDamage: 2,
          });
        }
        addFloatingText(rt, cx, p.y - 20, 'NIGHTMARE BLOSSOM!', '#e879f9', 1.25);
      }
      return;
    }

    // === WARRIOR GREATSWORD (PURE HEAVY MELEE & SHOCKWAVE DPS) ===
    if (p.weapon === 'warrior_greatsword') {
      if (slot === 1) {
        soundEngine.playCrescentWave();
        rt.playerProjectiles.push({
          uid: rt.nextUid++,
          ownerId: p.id,
          kind: 'crescent',
          x: cx,
          y: cy,
          dx: Math.cos(p.facingAngle) * 12,
          dy: Math.sin(p.facingAngle) * 12,
          angle: p.facingAngle,
          radius: 40,
          color: p.color,
          lifetime: 1.25,
          pierce: 99,
        });
        addSlashArc(rt, cx, cy, p.facingAngle, '#ef4444', 58);
        addFloatingText(rt, cx, p.y - 14, 'CRESCENT CLEAVE!', '#ef4444', 1.1);
      } else if (slot === 2) {
        soundEngine.playSlash(3);
        p.whirlwindTimer = 2.6;
        addFloatingText(rt, cx, p.y - 16, 'WHIRLWIND TEMPEST!', '#f87171', 1.15);
      } else if (slot === 3) {
        soundEngine.playSurge();
        rt.screenShake = Math.max(rt.screenShake, 12);
        p.bloodlustTimer = 4.5;
        p.empoweredStrike = true;
        rt.energyWaves.push({ x: cx, y: cy, radius: 12, maxRadius: 160, alpha: 0.9, speed: 460, color: '#fb923c' });
        for (const off of [-0.26, 0, 0.26]) {
          const ang = p.facingAngle + off;
          rt.playerProjectiles.push({
            uid: rt.nextUid++,
            ownerId: p.id,
            kind: 'crescent',
            x: cx,
            y: cy,
            dx: Math.cos(ang) * 12.5,
            dy: Math.sin(ang) * 12.5,
            angle: ang,
            radius: 34,
            color: '#fb923c',
            lifetime: 1.2,
            pierce: 99,
          });
        }
        addFloatingText(rt, cx, p.y - 18, 'BLOODLUST ROAR!', '#fb923c', 1.18);
      } else {
        soundEngine.playShockwave();
        rt.screenShake = Math.max(rt.screenShake, 20);
        rt.playerProjectiles.push({
          uid: rt.nextUid++,
          ownerId: p.id,
          kind: 'cataclysm',
          x: cx,
          y: cy,
          dx: Math.cos(p.facingAngle) * 14.5,
          dy: Math.sin(p.facingAngle) * 14.5,
          angle: p.facingAngle,
          radius: 58,
          color: '#ef4444',
          lifetime: 1.35,
          pierce: 99,
          bossDamage: 3,
        });
        addSlashArc(rt, cx, cy, p.facingAngle, '#fde047', 80);
        addFloatingText(rt, cx, p.y - 22, 'CATACLYSM SPLITTER!', '#fde047', 1.25);
      }
      return;
    }

    // === RANGER BOW (BUFFED ARSENAL) ===
    if (p.weapon === 'ranger_bow') {
      if (slot === 1) {
        soundEngine.playSurge();
        p.overdriveTimer = 3.5;
        for (const offset of [-0.24, -0.08, 0.08, 0.24]) {
          const ang = p.facingAngle + offset;
          rt.playerProjectiles.push({
            uid: rt.nextUid++,
            ownerId: p.id,
            kind: 'ranger_arrow',
            x: cx,
            y: cy,
            dx: Math.cos(ang) * 14.5,
            dy: Math.sin(ang) * 14.5,
            angle: ang,
            radius: 17,
            color: '#34d399',
            lifetime: 1.2,
            pierce: 2,
          });
        }
        const knife = rt.knives.find((k) => k.owner === p.id);
        if (knife && !p.hasKnife) {
          knife.x = cx - knife.size / 2;
          knife.y = cy - knife.size / 2;
        }
        addFloatingText(rt, cx, p.y - 14, 'STORM VOLLEY!', '#34d399', 1.12);
      } else if (slot === 2) {
        soundEngine.playPowerup();
        rt.skillZones.push({
          id: rt.nextUid++,
          ownerId: p.id,
          kind: 'frost_trap',
          x: cx,
          y: cy,
          radius: 165,
          timer: 6.0,
          maxTimer: 6.0,
          tickTimer: 0.35,
          color: '#38bdf8',
        });
        addFloatingText(rt, cx, p.y - 16, 'FROST SNARE TRAP!', '#38bdf8', 1.12);
      } else if (slot === 3) {
        soundEngine.playShockwave();
        rt.screenShake = Math.max(rt.screenShake, 15);
        rt.playerProjectiles.push({
          uid: rt.nextUid++,
          ownerId: p.id,
          kind: 'sniper_arrow',
          x: cx,
          y: cy,
          dx: Math.cos(p.facingAngle) * 22.0,
          dy: Math.sin(p.facingAngle) * 22.0,
          angle: p.facingAngle,
          radius: 26,
          color: '#fde047',
          lifetime: 1.05,
          pierce: 99,
          bossDamage: 4,
        });
        addFloatingText(rt, cx, p.y - 20, 'PIERCING RAILSHOT!', '#fde047', 1.24);
      } else {
        soundEngine.playCrescentWave();
        const tx = Math.max(120, Math.min(rt.arenaWidth - 120, cx + Math.cos(p.facingAngle) * 165));
        const ty = Math.max(120, Math.min(rt.arenaHeight - 120, cy + Math.sin(p.facingAngle) * 165));
        rt.skillZones.push({
          id: rt.nextUid++,
          ownerId: p.id,
          kind: 'arrow_rain',
          x: tx,
          y: ty,
          radius: 200,
          timer: 4.2,
          maxTimer: 4.2,
          tickTimer: 0.18,
          color: '#34d399',
        });
        addFloatingText(rt, tx, ty - 20, 'TEMPEST ARROW RAIN!', '#34d399', 1.24);
      }
      return;
    }
  }

  // === CLASSIC SOLO / 2P / BOSS RUSH HERO CLASS 4-SKILL SUPPORT ===
  if (p.heroClass === 'ronin') {
    if (slot === 1) {
      soundEngine.playCrescentWave();
      rt.playerProjectiles.push({
        uid: rt.nextUid++,
        ownerId: p.id,
        kind: 'crescent',
        x: cx,
        y: cy,
        dx: Math.cos(p.facingAngle) * 11.5,
        dy: Math.sin(p.facingAngle) * 11.5,
        angle: p.facingAngle,
        radius: 28,
        color: p.color,
        lifetime: 1.15,
        pierce: 99,
      });
      addSlashArc(rt, cx, cy, p.facingAngle, p.color, 46);
      addFloatingText(rt, cx, p.y - 12, 'CRESCENT WAVE!', p.color, 1.0);
    } else if (slot === 2) {
      soundEngine.playSlash(3);
      p.whirlwindTimer = 2.4;
      addFloatingText(rt, cx, p.y - 14, 'BLADE WHIRL!', p.color, 1.1);
    } else if (slot === 3) {
      soundEngine.playCrescentWave();
      for (const off of [-0.24, 0, 0.24]) {
        const ang = p.facingAngle + off;
        rt.playerProjectiles.push({
          uid: rt.nextUid++,
          ownerId: p.id,
          kind: 'crescent',
          x: cx,
          y: cy,
          dx: Math.cos(ang) * 12,
          dy: Math.sin(ang) * 12,
          angle: ang,
          radius: 30,
          color: p.color,
          lifetime: 1.15,
          pierce: 99,
        });
      }
      addFloatingText(rt, cx, p.y - 16, 'TRIPLE GALE!', p.color, 1.15);
    } else {
      soundEngine.playShockwave();
      rt.playerProjectiles.push({
        uid: rt.nextUid++,
        ownerId: p.id,
        kind: 'cataclysm',
        x: cx,
        y: cy,
        dx: Math.cos(p.facingAngle) * 14.5,
        dy: Math.sin(p.facingAngle) * 14.5,
        angle: p.facingAngle,
        radius: 52,
        color: '#ef4444',
        lifetime: 1.3,
        pierce: 99,
        bossDamage: 3,
      });
      addFloatingText(rt, cx, p.y - 20, 'HEAVENLY SEVER!', '#fde047', 1.25);
    }
  } else if (p.heroClass === 'phantom') {
    if (slot === 1) {
      soundEngine.playCloak();
      p.cloakTimer = 1.4;
      p.empoweredStrike = true;
      addFloatingText(rt, cx, p.y - 12, 'SHADOW CLOAK!', '#c084fc', 1.05);
    } else if (slot === 2) {
      soundEngine.playCrescentWave();
      for (const off of [-0.34, -0.17, 0, 0.17, 0.34]) {
        const ang = p.facingAngle + off;
        rt.playerProjectiles.push({
          uid: rt.nextUid++,
          ownerId: p.id,
          kind: 'shadow_kunai',
          x: cx,
          y: cy,
          dx: Math.cos(ang) * 14,
          dy: Math.sin(ang) * 14,
          angle: ang,
          radius: 14,
          color: '#c084fc',
          lifetime: 0.9,
          pierce: 2,
        });
      }
      addFloatingText(rt, cx, p.y - 14, 'KUNAI SPREAD!', '#c084fc', 1.1);
    } else if (slot === 3) {
      soundEngine.playCloak();
      rt.voidDecoys.push({ x: cx, y: cy, timer: 0.55, maxTimer: 0.55, color: '#a855f7', ownerId: p.id });
      p.x = Math.max(16, Math.min(rt.arenaWidth - p.size - 16, p.x + Math.cos(p.facingAngle) * 185));
      p.y = Math.max(16, Math.min(rt.arenaHeight - p.size - 16, p.y + Math.sin(p.facingAngle) * 185));
      p.invulnFrames = Math.max(p.invulnFrames, 0.4);
      p.dashReady = true;
      p.dashCooldownTimer = 0;
      rt.voidDecoys.push({ x: p.x + p.size / 2, y: p.y + p.size / 2, timer: 0.55, maxTimer: 0.55, color: '#e879f9', ownerId: p.id });
      addFloatingText(rt, p.x + p.size / 2, p.y - 16, 'PHANTOM BLINK!', '#e879f9', 1.15);
    } else {
      soundEngine.playSurge();
      p.bloodlustTimer = 4.5;
      p.empoweredStrike = true;
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2;
        rt.playerProjectiles.push({
          uid: rt.nextUid++,
          ownerId: p.id,
          kind: 'shadow_kunai',
          x: cx,
          y: cy,
          dx: Math.cos(ang) * 13,
          dy: Math.sin(ang) * 13,
          angle: ang,
          radius: 15,
          color: '#e879f9',
          lifetime: 0.95,
          pierce: 3,
        });
      }
      addFloatingText(rt, cx, p.y - 20, 'ECLIPSE LOTUS!', '#e879f9', 1.25);
    }
  } else if (p.heroClass === 'vanguard') {
    if (slot === 1) {
      aimTankAtThreat(rt, p);
      soundEngine.playParry();
      p.frontShieldTimer = 4.0;
      p.hasShield = true;
      const sx = cx + Math.cos(p.facingAngle) * 52;
      const sy = cy + Math.sin(p.facingAngle) * 52;
      rt.energyWaves.push({ x: sx, y: sy, radius: 10, maxRadius: 115, alpha: 0.92, speed: 480, color: '#38bdf8' });
      const { purgedCount, cleansedCount } = purgeEnemyEffectsInRadius(rt, sx, sy, 128, 120);
      rt.enemies.forEach((e) => {
        if (Math.hypot(e.x + e.size / 2 - sx, e.y + e.size / 2 - sy) <= 130) e.stunTimer = Math.max(e.stunTimer || 0, 1.5);
      });
      const total = purgedCount + cleansedCount;
      addFloatingText(rt, cx, p.y - 16, total > 0 ? `VANGUARD BULWARK 4s (PURGED ${total})` : 'VANGUARD BULWARK (4.0s)!', '#38bdf8', 1.15);
    } else if (slot === 2) {
      soundEngine.playDash();
      p.chargeTimer = 0.5;
      p.invulnFrames = Math.max(p.invulnFrames, 0.65);
      p.dashDirX = Math.cos(p.facingAngle);
      p.dashDirY = Math.sin(p.facingAngle);
      addFloatingText(rt, cx, p.y - 14, 'SHIELD RUSH!', '#38bdf8', 1.1);
    } else if (slot === 3) {
      soundEngine.playShockwave();
      p.fortifyTimer = 4.5;
      p.hasShield = true;
      rt.screenShake = Math.max(rt.screenShake, 12);
      rt.energyWaves.push({ x: cx, y: cy, radius: 12, maxRadius: 255, alpha: 0.95, speed: 560, color: '#22d3ee' });
      rt.skillZones.push({
        id: rt.nextUid++,
        ownerId: p.id,
        kind: 'sanctuary_dome',
        x: cx,
        y: cy,
        radius: 245,
        timer: 4.5,
        maxTimer: 4.5,
        tickTimer: 0.5,
        color: '#22d3ee',
      });
      const { purgedCount } = purgeEnemyEffectsInRadius(rt, cx, cy, 245, 245);
      rt.enemies.forEach((e) => {
        if (Math.hypot(e.x + e.size / 2 - cx, e.y + e.size / 2 - cy) <= 235) e.stunTimer = 2.2;
      });
      if (rt.isBossLevel && rt.boss.health > 0 && rt.boss.state !== 'comic_intro' && rt.boss.state !== 'dead' && rt.boss.state !== 'phase_transition') {
        if (Math.hypot(rt.boss.x + rt.boss.size / 2 - cx, rt.boss.y + rt.boss.size / 2 - cy) <= 250) {
          handleBossHit(rt, p, false, 1);
          registerBossInterrupt(rt, p, 1);
        }
      }
      addFloatingText(rt, cx, p.y - 16, purgedCount > 0 ? `BASTION DOME! (${purgedCount} CLEARED)` : 'BASTION DOME!', '#0ea5e9', 1.15);
    } else {
      soundEngine.playShockwave();
      rt.screenShake = Math.max(rt.screenShake, 20);
      rt.energyWaves.push({ x: cx, y: cy, radius: 18, maxRadius: 320, alpha: 0.98, speed: 660, color: '#22d3ee' });
      rt.skillZones.push({
        id: rt.nextUid++,
        ownerId: p.id,
        kind: 'sanctuary_dome',
        x: cx,
        y: cy,
        radius: 310,
        timer: 5.0,
        maxTimer: 5.0,
        tickTimer: 0.5,
        color: '#38bdf8',
      });
      rt.bossProjectiles = rt.bossProjectiles.filter(
        (bp) => bp.type === 'phantom_clone' || Math.hypot(bp.x + bp.size / 2 - cx, bp.y + bp.size / 2 - cy) > 320
      );
      rt.players.forEach((ally) => {
        if (ally.state === 'alive' && Math.hypot(ally.x - p.x, ally.y - p.y) <= 260) ally.hasShield = true;
      });
      rt.enemies.forEach((e) => {
        if (Math.hypot(e.x + e.size / 2 - cx, e.y + e.size / 2 - cy) <= 320) e.stunTimer = 3.2;
      });
      if (rt.isBossLevel && rt.boss.health > 0 && rt.boss.state !== 'comic_intro' && rt.boss.state !== 'dead' && rt.boss.state !== 'phase_transition') {
        if (Math.hypot(rt.boss.x + rt.boss.size / 2 - cx, rt.boss.y + rt.boss.size / 2 - cy) <= 325) {
          handleBossHit(rt, p, false, 2);
          registerBossInterrupt(rt, p, 2);
        }
      }
      addFloatingText(rt, cx, p.y - 20, 'SKYBREAKER SLAM!', '#22d3ee', 1.25);
    }
  } else if (p.heroClass === 'volt') {
    if (slot === 1) {
      soundEngine.playSurge();
      p.overdriveTimer = 4.2;
      p.dashReady = true;
      p.dashCooldownTimer = 0;
      const knife = rt.knives.find((k) => k.owner === p.id);
      if (knife && !p.hasKnife) {
        knife.x = cx - knife.size / 2;
        knife.y = cy - knife.size / 2;
      }
      rt.energyWaves.push({ x: cx, y: cy, radius: 8, maxRadius: 120, alpha: 0.9, speed: 360, color: '#facc15' });
      addFloatingText(rt, cx, p.y - 14, 'OVERCHARGE SURGE!', '#facc15', 1.1);
    } else if (slot === 2) {
      soundEngine.playCrescentWave();
      for (const off of [-0.32, -0.16, 0, 0.16, 0.32]) {
        const ang = p.facingAngle + off;
        rt.playerProjectiles.push({
          uid: rt.nextUid++,
          ownerId: p.id,
          kind: 'arc_bolt',
          x: cx,
          y: cy,
          dx: Math.cos(ang) * 12,
          dy: Math.sin(ang) * 12,
          angle: ang,
          radius: 14,
          color: '#facc15',
          lifetime: 1.0,
          pierce: 2,
        });
      }
      addFloatingText(rt, cx, p.y - 14, 'ARC SCATTER!', '#facc15', 1.1);
    } else if (slot === 3) {
      soundEngine.playPowerup();
      rt.skillZones.push({
        id: rt.nextUid++,
        ownerId: p.id,
        kind: 'frost_trap',
        x: cx,
        y: cy,
        radius: 150,
        timer: 5.0,
        maxTimer: 5.0,
        tickTimer: 0.35,
        color: '#facc15',
      });
      addFloatingText(rt, cx, p.y - 16, 'STATIC FIELD!', '#facc15', 1.15);
    } else {
      soundEngine.playShockwave();
      p.overdriveTimer = Math.max(p.overdriveTimer, 2.5);
      rt.playerProjectiles.push({
        uid: rt.nextUid++,
        ownerId: p.id,
        kind: 'sniper_arrow',
        x: cx,
        y: cy,
        dx: Math.cos(p.facingAngle) * 21,
        dy: Math.sin(p.facingAngle) * 21,
        angle: p.facingAngle,
        radius: 22,
        color: '#facc15',
        lifetime: 1.0,
        pierce: 99,
        bossDamage: 3,
      });
      addFloatingText(rt, cx, p.y - 20, 'RAILGUN OVERLOAD!', '#fde047', 1.25);
    }
  }
}

export interface TouchInputState {
  x: number;
  y: number;
  dash: boolean;
  ability: boolean;
  skill2?: boolean;
  skill3?: boolean;
  skill4?: boolean;
  usePotion?: boolean;
  cycleWeapon?: boolean;
  selectWeaponSlot?: number;
}

function updatePracticeBot(rt: GameRuntime, bot: Player, dt: number) {
  if (bot.state !== 'alive') return;
  bot.animTime += dt;
  if (bot.postDashInvulnerability > 0) bot.postDashInvulnerability -= dt;
  if (bot.invulnFrames > 0) bot.invulnFrames -= dt;
  if (bot.overdriveTimer > 0) bot.overdriveTimer -= dt;
  if (bot.cloakTimer > 0) bot.cloakTimer -= dt;
  if (bot.whirlwindTimer > 0) bot.whirlwindTimer = Math.max(0, bot.whirlwindTimer - dt);
  if (bot.fortifyTimer > 0) bot.fortifyTimer = Math.max(0, bot.fortifyTimer - dt);
  if (bot.frontShieldTimer > 0) bot.frontShieldTimer = Math.max(0, bot.frontShieldTimer - dt);
  if (bot.bloodlustTimer > 0) bot.bloodlustTimer = Math.max(0, bot.bloodlustTimer - dt);
  if (bot.potionCooldownTimer > 0) bot.potionCooldownTimer = Math.max(0, bot.potionCooldownTimer - dt);

  for (let sIdx = 0; sIdx < 4; sIdx++) {
    if (bot.skillCooldowns[sIdx] > 0) {
      bot.skillCooldowns[sIdx] = Math.max(0, bot.skillCooldowns[sIdx] - dt);
    }
  }
  bot.abilityCooldownTimer = bot.skillCooldowns[0];
  bot.abilityReady = bot.skillCooldowns[0] <= 0;

  const b = rt.boss;
  const bcx = b.x + b.size / 2;
  const bcy = b.y + b.size / 2;

  // Dynamic 1P Practice Tank AI Swap: keep a Dummy Tank whenever Player 1 swaps to a non-Tank weapon
  if (rt.numPlayers === 1 && bot.id === 2) {
    const human = rt.players[0];
    if (human && human.weapon !== 'tank_shield' && bot.weapon !== 'tank_shield') {
      switchPracticeWeapon(rt, 2, 'tank_shield');
    } else if (human && human.weapon === 'tank_shield' && bot.weapon === 'tank_shield') {
      switchPracticeWeapon(rt, 2, 'ranger_bow');
    }
  }

  const tankAlly = rt.players.find(
    (pl) => pl.state === 'alive' && pl.id !== bot.id && pl.weapon === 'tank_shield'
  );
  const human = rt.players.find((pl) => pl.id === 1 && pl.state === 'alive');

  let targetX = rt.arenaWidth * 0.5 + Math.sin(rt.elapsedSeconds * 1.15 + bot.id * 2.1) * 190;
  let targetY = rt.arenaHeight * 0.72 + Math.cos(rt.elapsedSeconds * 0.8 + bot.id) * 35;

  if (b.channelKind === 'cursed_floor') {
    const sx = b.channelSafeX ?? rt.arenaWidth / 2;
    const sy = b.channelSafeY ?? rt.arenaHeight * 0.66;
    if (bot.weapon === 'tank_shield') {
      const angBoss = Math.atan2(bcy - sy, bcx - sx);
      targetX = sx + Math.cos(angBoss) * 34;
      targetY = sy + Math.sin(angBoss) * 34;
    } else if (tankAlly && Math.hypot(tankAlly.x + tankAlly.size / 2 - sx, tankAlly.y + tankAlly.size / 2 - sy) <= 130) {
      const tcx = tankAlly.x + tankAlly.size / 2;
      const tcy = tankAlly.y + tankAlly.size / 2;
      const angFromBoss = Math.atan2(tcy - bcy, tcx - bcx);
      targetX = tcx + Math.cos(angFromBoss) * (bot.id === 2 ? 42 : 54) + (bot.id === 2 ? -14 : 14);
      targetY = tcy + Math.sin(angFromBoss) * (bot.id === 2 ? 42 : 54);
    } else {
      targetX = sx + (bot.id === 2 ? -22 : 22);
      targetY = sy + 14;
    }
  } else if (b.channelKind === 'siege_beam') {
    if (bot.weapon === 'tank_shield' && human) {
      const hcx = human.x + human.size / 2;
      const hcy = human.y + human.size / 2;
      const angBossToHuman = Math.atan2(hcy - bcy, hcx - bcx);
      targetX = hcx - Math.cos(angBossToHuman) * 58;
      targetY = hcy - Math.sin(angBossToHuman) * 58;
    } else if (tankAlly) {
      const tcx = tankAlly.x + tankAlly.size / 2;
      const tcy = tankAlly.y + tankAlly.size / 2;
      const angFromBoss = Math.atan2(tcy - bcy, tcx - bcx);
      targetX = tcx + Math.cos(angFromBoss) * 44 + (bot.id === 2 ? -16 : 16);
      targetY = tcy + Math.sin(angFromBoss) * 44;
    } else {
      targetX = rt.arenaWidth * (bot.id === 2 ? 0.25 : 0.75);
      targetY = rt.arenaHeight * 0.76;
    }
  } else if (b.channelKind === 'hunter_mark') {
    const marked = rt.players.find((pl) => pl.id === b.channelTargetPlayerId && pl.state === 'alive');
    if (bot.weapon === 'tank_shield' && marked) {
      const mcx = marked.x + marked.size / 2;
      const mcy = marked.y + marked.size / 2;
      const angBossToMarked = Math.atan2(mcy - bcy, mcx - bcx);
      targetX = mcx - Math.cos(angBossToMarked) * 54;
      targetY = mcy - Math.sin(angBossToMarked) * 54;
    } else if (tankAlly) {
      const tcx = tankAlly.x + tankAlly.size / 2;
      const tcy = tankAlly.y + tankAlly.size / 2;
      const angFromBoss = Math.atan2(tcy - bcy, tcx - bcx);
      targetX = tcx + Math.cos(angFromBoss) * 44;
      targetY = tcy + Math.sin(angFromBoss) * 44;
    }
  } else if (b.channelKind === 'gravity_storm') {
    const curAng = Math.atan2(bot.y - bcy, bot.x - bcx);
    targetX = bcx + Math.cos(curAng) * 420;
    targetY = bcy + Math.sin(curAng) * 420;
  } else if (b.channelKind === 'bow_weakpoint' || b.channelKind === 'sky_battery') {
    const awayAng = Math.atan2(bot.y + bot.size / 2 - bcy, bot.x + bot.size / 2 - bcx);
    targetX = bcx + Math.cos(awayAng) * 280;
    targetY = bcy + Math.sin(awayAng) * 280;
  } else if (b.channelKind === 'emp_interrupt' || b.channelKind === 'mirage_ambush') {
    if (bot.weapon === 'assassin_blades') {
      targetX = bcx;
      targetY = bcy + 95;
      if (Math.hypot(bcx - (bot.x + bot.size / 2), bcy - (bot.y + bot.size / 2)) <= 260 && bot.skillCooldowns[0] <= 0) {
        bot.skillCooldowns[0] = 4;
        registerBossInterrupt(rt, bot, 3);
      }
    } else {
      targetX = bcx + (bot.id === 2 ? -140 : 140);
      targetY = bcy + 140;
    }
  } else if (b.channelKind === 'abyss_tether' && b.channelTetherPair) {
    const [idA, idB] = b.channelTetherPair;
    if (bot.id === idA || bot.id === idB) {
      const otherId = bot.id === idA ? idB : idA;
      const other = rt.players.find((pl) => pl.id === otherId && pl.state === 'alive');
      if (other) {
        const ocx = other.x + other.size / 2;
        const ocy = other.y + other.size / 2;
        const awayAng = Math.atan2(bot.y + bot.size / 2 - ocy, bot.x + bot.size / 2 - ocx);
        targetX = ocx + Math.cos(awayAng) * 430;
        targetY = ocy + Math.sin(awayAng) * 430;
      }
    } else if (bot.weapon === 'tank_shield') {
      const partner = rt.players.find((pl) => (pl.id === idA || pl.id === idB) && pl.state === 'alive');
      if (partner) {
        targetX = partner.x + partner.size / 2;
        targetY = partner.y + partner.size / 2;
      }
    }
  } else if (b.channelKind === 'demon_seal_purge') {
    const sealedAlly = rt.players.find((pl) => pl.state === 'alive' && pl.sealed && pl.id !== bot.id);
    if (sealedAlly) {
      targetX = sealedAlly.x + sealedAlly.size / 2;
      targetY = sealedAlly.y + sealedAlly.size / 2;
    }
  } else if (b.channelKind === 'meteor_soak') {
    targetX = (b.channelSafeX ?? rt.arenaWidth * 0.5) + (bot.id === 2 ? -24 : 24);
    targetY = (b.channelSafeY ?? rt.arenaHeight * 0.7) + 12;
  }

  const dx = targetX - (bot.x + bot.size / 2);
  const dy = targetY - (bot.y + bot.size / 2);
  const dist = Math.hypot(dx, dy);
  if (dist > 8) {
    const baseSpd = bot.speed * 1.05;
    const step = Math.min(dist, baseSpd * (dt * 60));
    bot.vx = (dx / dist) * Math.min(baseSpd, dist);
    bot.vy = (dy / dist) * Math.min(baseSpd, dist);
    bot.x += (dx / dist) * step;
    bot.y += (dy / dist) * step;
  } else {
    bot.vx = 0;
    bot.vy = 0;
  }
  bot.x = Math.max(16, Math.min(rt.arenaWidth - bot.size - 16, bot.x));
  bot.y = Math.max(16, Math.min(rt.arenaHeight - bot.size - 16, bot.y));
  bot.facingAngle = Math.atan2(bcy - (bot.y + bot.size / 2), bcx - (bot.x + bot.size / 2));

  // Auto-break ally Seals on touch in demon_seal_purge
  if (b.channelKind === 'demon_seal_purge') {
    rt.players.forEach((ally) => {
      if (ally.state === 'alive' && ally.sealed && ally.id !== bot.id) {
        if (Math.hypot(ally.x + ally.size / 2 - (bot.x + bot.size / 2), ally.y + ally.size / 2 - (bot.y + bot.size / 2)) < bot.size * 1.45) {
          ally.sealed = false;
          ally.sealTimer = 0;
          soundEngine.playRevive();
          addFloatingText(rt, ally.x + ally.size / 2, ally.y - 16, 'BOT BROKE SEAL!', '#34d399', 1.1);
        }
      }
    });
  }

  // Smart Tank Bot raises [E] Front Shield during teamwork danger windows
  if (bot.weapon === 'tank_shield' && bot.skillCooldowns[0] <= 0 && bot.frontShieldTimer <= 0.1) {
    const dangerChannel =
      b.channelKind === 'cursed_floor' ||
      b.channelKind === 'siege_beam' ||
      b.channelKind === 'hunter_mark' ||
      b.channelKind === 'gravity_storm' ||
      b.channelKind === 'meteor_soak' ||
      b.channelKind === 'demon_seal_purge';
    if (dangerChannel && dist < 85) {
      bot.vx = 0;
      bot.vy = 0;
      triggerSkillSlot(rt, bot, 1);
    }
  }

  if (bot.weapon === 'holy_staff' && bot.skillCooldowns[0] <= 0) {
    const hurtAlly = rt.players.some(
      (pl) => pl.state === 'alive' && pl.hp < pl.maxHp * 0.85
    );
    if (hurtAlly || b.channelKind === 'cursed_miasma' || b.channelKind === 'blood_curse') {
      triggerSkillSlot(rt, bot, 1);
    }
  }

  if (
    bot.weapon === 'warrior_greatsword' &&
    bot.skillCooldowns[0] <= 0 &&
    (b.channelKind === 'iron_carapace' || b.channelKind === 'obsidian_phalanx')
  ) {
    triggerSkillSlot(rt, bot, 1);
  }
}

function updatePlayer(
  rt: GameRuntime,
  p: Player,
  dt: number,
  keys: Record<string, boolean>,
  controls: ControlsConfig['p1'],
  touchInput?: TouchInputState
) {
  if (p.state !== 'alive') return;
  p.animTime += dt;
  if (p.postDashInvulnerability > 0) p.postDashInvulnerability -= dt;
  if (p.invulnFrames > 0) p.invulnFrames -= dt;
  if (p.overdriveTimer > 0) p.overdriveTimer -= dt;
  if (p.magnetTimer > 0) p.magnetTimer -= dt;
  if (p.cloakTimer > 0) p.cloakTimer -= dt;
  if (p.bladeHealCd > 0) p.bladeHealCd = Math.max(0, p.bladeHealCd - dt);
  if (p.whirlwindTimer > 0) p.whirlwindTimer = Math.max(0, p.whirlwindTimer - dt);
  if (p.fortifyTimer > 0) p.fortifyTimer = Math.max(0, p.fortifyTimer - dt);
  if (p.frontShieldTimer > 0) p.frontShieldTimer = Math.max(0, p.frontShieldTimer - dt);
  if (p.bloodlustTimer > 0) p.bloodlustTimer = Math.max(0, p.bloodlustTimer - dt);
  if (p.chargeTimer > 0) p.chargeTimer = Math.max(0, p.chargeTimer - dt);
  if (p.potionCooldownTimer > 0) p.potionCooldownTimer = Math.max(0, p.potionCooldownTimer - dt);
  if (p.swapCooldownTimer > 0) p.swapCooldownTimer = Math.max(0, p.swapCooldownTimer - dt);

  // Forbidden Cheat Overrides
  if (rt.cheats.zeroCooldowns) {
    p.dashReady = true;
    p.dashCooldownTimer = 0;
    p.dash2Ready = true;
    p.dash2CooldownTimer = 0;
    p.abilityReady = true;
    p.abilityCooldownTimer = 0;
    p.skillCooldowns = [0, 0, 0, 0];
    p.weaponCooldowns = {};
    p.tankShieldReady = true;
    p.shieldRegenTimer = 0;
  }
  if (rt.cheats.alwaysArmed) {
    p.hasKnife = true;
  }
  if (rt.cheats.permanentOverdrive) {
    p.overdriveTimer = Math.max(p.overdriveTimer, 1.5);
  }
  if (rt.cheats.vitalityRegen) {
    p.hp = Math.min(p.maxHp, p.hp + 25 * dt);
  }

  // Vanguard / Tank Shield passive shield regen (keeps ticking even if unarmed/swapped)
  const hasShieldRegen = (!usesWeaponSystem(rt) && p.heroClass === 'vanguard') || p.weapon === 'tank_shield';
  if (!p.hasShield && p.shieldRegenTimer > 0) {
    p.shieldRegenTimer -= dt;
    if (p.shieldRegenTimer <= 0) {
      p.shieldRegenTimer = 0;
      p.tankShieldReady = true;
      if (hasShieldRegen) {
        p.hasShield = true;
        soundEngine.playPowerup();
        addFloatingText(rt, p.x + p.size / 2, p.y - 12, 'SHIELD RECHARGED', '#38bdf8', 0.95);
      }
    }
  } else if (hasShieldRegen && !p.hasShield && p.shieldRegenTimer <= 0) {
    p.shieldRegenTimer = p.weapon === 'tank_shield' ? 26 : 24;
  }

  const isVoidP2 = rt.bossType === 'void' && rt.isBossLevel && rt.boss.phase === 2;
  if (isVoidP2 && !p.dash2Active) {
    p.dash2Active = true;
    p.dash2Ready = true;
  }

  const allowArrowMirror = rt.numPlayers === 1 || usesWeaponSystem(rt);
  const upPressed = !!keys[controls.up] || (allowArrowMirror && !touchInput && !!keys['arrowup']);
  const downPressed = !!keys[controls.down] || (allowArrowMirror && !touchInput && !!keys['arrowdown']);
  const leftPressed = !!keys[controls.left] || (allowArrowMirror && !touchInput && !!keys['arrowleft']);
  const rightPressed = !!keys[controls.right] || (allowArrowMirror && !touchInput && !!keys['arrowright']);
  const dashPressed =
    !!keys[controls.dash] ||
    !!touchInput?.dash ||
    (allowArrowMirror && !touchInput && (!!keys['shift'] || !!keys['enter']));
  const abilityPressed =
    !!keys[controls.ability] ||
    !!touchInput?.ability ||
    (allowArrowMirror && !touchInput && !!keys['1']);
  const skill2Pressed =
    !!touchInput?.skill2 ||
    (p.id === 2 && !usesWeaponSystem(rt) ? !!keys['.'] : !!keys['q'] || !!keys['2']);
  const skill3Pressed =
    !!touchInput?.skill3 ||
    (p.id === 2 && !usesWeaponSystem(rt) ? !!keys[';'] : !!keys['r'] || !!keys['3']);
  const skill4Pressed =
    !!touchInput?.skill4 ||
    (p.id === 2 && !usesWeaponSystem(rt) ? !!keys["'"] : !!keys['f'] || !!keys['4']);
  const potionPressed =
    !!touchInput?.usePotion ||
    (p.id === 2 && !usesWeaponSystem(rt) ? !!keys['p'] : !!keys['c'] || !!keys['h']);

  if (p.sealed) {
    p.dashImmune = false;
    p.dashTimeLeft = 0;
    p.dashTrail.forEach((t) => (t.alpha -= dt * 3));
    p.dashTrail = p.dashTrail.filter((t) => t.alpha > 0);
    if (rt.numPlayers === 1 && dashPressed && !p._lastDashPressed) {
      p.sealTimer -= 0.5;
      addFloatingText(rt, p.x + p.size / 2, p.y - 10, 'STRUGGLE!', '#fbbf24', 0.85);
      if (p.sealTimer <= 0) {
        p.sealed = false;
        p.sealTimer = 0;
        addFloatingText(rt, p.x + p.size / 2, p.y - 14, 'SEAL BROKEN!', '#34d399', 1.1);
      }
    }
    p._lastDashPressed = dashPressed;
    p._lastAbilityPressed = abilityPressed;
    p._lastSkill2Pressed = skill2Pressed;
    p._lastSkill3Pressed = skill3Pressed;
    p._lastSkill4Pressed = skill4Pressed;
    if (rt.numPlayers >= 2) {
      const other = rt.players.find((op) => op.id !== p.id && op.state === 'alive');
      if (other) {
        const dist = Math.hypot(other.x + other.size / 2 - (p.x + p.size / 2), other.y + other.size / 2 - (p.y + p.size / 2));
        if (dist < p.size * 1.35) {
          p.sealed = false;
          p.sealTimer = 0;
          soundEngine.playRevive();
          addFloatingText(rt, p.x + p.size / 2, p.y - 14, 'SEAL BROKEN!', '#34d399', 1.15);
        }
      }
    }
    return;
  }

  let dirX = (rightPressed ? 1 : 0) - (leftPressed ? 1 : 0);
  let dirY = (downPressed ? 1 : 0) - (upPressed ? 1 : 0);
  if (dirX === 0 && dirY === 0 && touchInput && (touchInput.x !== 0 || touchInput.y !== 0)) {
    dirX = touchInput.x;
    dirY = touchInput.y;
  }
  if (dirX !== 0 || dirY !== 0) {
    const len = Math.sqrt(dirX * dirX + dirY * dirY);
    if (len > 0) {
      dirX /= len;
      dirY /= len;
    }
    p.facingAngle = Math.atan2(dirY, dirX);
    p.dashDirX = dirX;
    p.dashDirY = dirY;
  }

  // Trigger Weapon Swap or Skill 1 on [E] (Merchant Shop modal handled cleanly in UI on [E])
  if (abilityPressed && !p._lastAbilityPressed) {
    const pcx = p.x + p.size / 2;
    const pcy = p.y + p.size / 2;
    let interacted = false;

    const nearMerchant =
      rt.isOnlineCampaign &&
      rt.shopNpc &&
      Math.hypot(rt.shopNpc.x - pcx, rt.shopNpc.y - pcy) <= 95;
    if (nearMerchant) {
      interacted = true;
    }

    if (!interacted && rt.isOnlineCampaign && rt.weaponDrops.length > 0) {
      const dropIdx = rt.weaponDrops.findIndex(
        (w) => w.swapLockTimer <= 0 && Math.hypot(w.x - pcx, w.y - pcy) <= 44
      );
      if (dropIdx !== -1) {
        const drop = rt.weaponDrops[dropIdx];
        rt.weaponDrops.splice(dropIdx, 1);
        equipWeapon(rt, p, drop.weaponId, { x: drop.x, y: drop.y });
        interacted = true;
      }
    }

    if (!interacted && p.skillCooldowns[0] <= 0) {
      triggerSkillSlot(rt, p, 1);
      if (rt.isTutorial && rt.tutorialStep === 3) {
        rt.tutorialSkillUses++;
      }
    }
  }
  p._lastAbilityPressed = abilityPressed;

  // Trigger Skills 2 / 3 / 4 ([Q] / [R] / [F])
  if (skill2Pressed && !p._lastSkill2Pressed) {
    triggerSkillSlot(rt, p, 2);
  }
  p._lastSkill2Pressed = skill2Pressed;

  if (skill3Pressed && !p._lastSkill3Pressed) {
    triggerSkillSlot(rt, p, 3);
  }
  p._lastSkill3Pressed = skill3Pressed;

  if (skill4Pressed && !p._lastSkill4Pressed) {
    triggerSkillSlot(rt, p, 4);
  }
  p._lastSkill4Pressed = skill4Pressed;

  // Trigger Crimson Flask [C/H]
  if (potionPressed && !p._lastPotionPressed) {
    usePlayerPotion(rt, p);
  }
  p._lastPotionPressed = potionPressed;

  // Trigger Dash
  if (dashPressed && !p._lastDashPressed) {
    const triggerDash = (isSecond: boolean) => {
      if (isSecond) {
        p.dash2Ready = false;
        p.dash2CooldownTimer = hasBoon(rt, 'phantom_step') ? p.dashCooldown * 0.75 : p.dashCooldown;
      } else {
        p.dashReady = false;
        p.dashCooldownTimer = p.dashCooldown;
      }
      p.dashImmune = true;
      p.dashTimeLeft = p.dashTime;
      p.usingDash2 = isSecond;
      p.grazedIds.clear();
      soundEngine.playDash();

      if ((!usesWeaponSystem(rt) && p.heroClass === 'phantom') || p.weapon === 'assassin_blades') {
        rt.voidDecoys.push({
          x: p.x + p.size / 2,
          y: p.y + p.size / 2,
          timer: 0.55,
          maxTimer: 0.55,
          color: '#a855f7',
          ownerId: p.id,
        });
      }
      if (p.weapon === 'ranger_bow') {
        const snapAng = p.facingAngle;
        rt.playerProjectiles.push({
          uid: rt.nextUid++,
          ownerId: p.id,
          kind: 'ranger_arrow',
          x: p.x + p.size / 2,
          y: p.y + p.size / 2,
          dx: Math.cos(snapAng) * 14.5,
          dy: Math.sin(snapAng) * 14.5,
          angle: snapAng,
          radius: 15,
          color: '#34d399',
          lifetime: 0.95,
          pierce: 2,
        });
      }
    };

    if (p.dashReady) triggerDash(false);
    else if (p.dash2Active && p.dash2Ready) triggerDash(true);
  }
  p._lastDashPressed = dashPressed;

  const speedMult =
    (p.overdriveTimer > 0 ? 1.32 : 1.0) *
    (p.cloakTimer > 0 ? 1.26 : 1.0) *
    (p.bloodlustTimer > 0 ? 1.3 : 1.0) *
    (p.fortifyTimer > 0 ? 0.88 : 1.0);

  if (p.chargeTimer > 0) {
    const chargeSpeed = 16.5;
    p.vx = p.dashDirX * chargeSpeed;
    p.vy = p.dashDirY * chargeSpeed;
    p.x += p.vx * (dt * 60);
    p.y += p.vy * (dt * 60);
    if (p.dashTrail.length < 10) {
      p.dashTrail.push({ x: p.x, y: p.y, alpha: 0.75, color: '#38bdf8', angle: p.facingAngle });
    }
  } else if (p.dashImmune && p.dashTimeLeft > 0) {
    const ds = 18.0 * (p.overdriveTimer > 0 ? 1.15 : 1.0);
    const moveX = dirX !== 0 || dirY !== 0 ? dirX : p.dashDirX;
    const moveY = dirX !== 0 || dirY !== 0 ? dirY : p.dashDirY;
    p.x += moveX * ds * (dt * 60);
    p.y += moveY * ds * (dt * 60);
    p.vx = moveX * ds;
    p.vy = moveY * ds;
    if (p.dashTrail.length < 10) {
      p.dashTrail.push({ x: p.x, y: p.y, alpha: 0.85, color: p.color, angle: p.facingAngle });
    }
    p.dashTimeLeft -= dt;
    if (p.dashTimeLeft <= 0) {
      p.dashImmune = false;
      p.postDashInvulnerability = hasBoon(rt, 'phantom_step') ? 0.36 : 0.25;
    }
  } else {
    // Deterministic guard so dashImmune can never linger if dashTimeLeft <= 0
    if (p.dashImmune && p.dashTimeLeft <= 0) {
      p.dashImmune = false;
    }
    const moveSpeed = p.speed * speedMult;
    p.vx = dirX * moveSpeed;
    p.vy = dirY * moveSpeed;
    p.x += p.vx * (dt * 60);
    p.y += p.vy * (dt * 60);
  }

  clampPlayerToArenaAndHallways(p, rt.arenaWidth, rt.arenaHeight, rt.gates);

  if (rt.eclipsePrison && rt.eclipsePrison.targetPlayerId === p.id) {
    const px = p.x + p.size / 2;
    const py = p.y + p.size / 2;
    const dxC = px - rt.eclipsePrison.x;
    const dyC = py - rt.eclipsePrison.y;
    const dC = Math.hypot(dxC, dyC);
    const maxR = 22;
    if (dC > maxR && dC > 0) {
      p.x = rt.eclipsePrison.x + (dxC / dC) * maxR - p.size / 2;
      p.y = rt.eclipsePrison.y + (dyC / dC) * maxR - p.size / 2;
    }
  }

  const cdRate = (p.overdriveTimer > 0 ? 1.8 : 1.0) * (p.bloodlustTimer > 0 ? 1.45 : 1.0) * dt;
  if (!p.dashReady) {
    p.dashCooldownTimer -= cdRate;
    if (p.dashCooldownTimer <= 0) {
      p.dashCooldownTimer = 0;
      p.dashReady = true;
    }
  }
  if (isVoidP2 && !p.dash2Ready && p.dash2CooldownTimer > 0) {
    p.dash2CooldownTimer -= cdRate;
    if (p.dash2CooldownTimer <= 0) {
      p.dash2CooldownTimer = 0;
      p.dash2Ready = true;
    }
  }
  for (let sIdx = 0; sIdx < 4; sIdx++) {
    if (p.skillCooldowns[sIdx] > 0) {
      p.skillCooldowns[sIdx] = Math.max(0, p.skillCooldowns[sIdx] - cdRate);
    }
  }
  if (p.weaponCooldowns) {
    for (const wKey of Object.keys(p.weaponCooldowns) as WeaponClassId[]) {
      const cds = p.weaponCooldowns[wKey];
      if (!cds) continue;
      if (wKey === p.weapon) {
        cds[0] = p.skillCooldowns[0];
        cds[1] = p.skillCooldowns[1];
        cds[2] = p.skillCooldowns[2];
        cds[3] = p.skillCooldowns[3];
      } else {
        for (let i = 0; i < 4; i++) {
          if (cds[i] > 0) cds[i] = Math.max(0, cds[i] - cdRate);
        }
      }
    }
  }
  p.abilityCooldownTimer = p.skillCooldowns[0];
  p.abilityReady = (!usesWeaponSystem(rt) || p.weapon !== 'none') && p.skillCooldowns[0] <= 0;

  for (let ti = p.dashTrail.length - 1; ti >= 0; ti--) {
    p.dashTrail[ti].alpha -= dt * 4.2;
    if (p.dashTrail[ti].alpha <= 0) p.dashTrail.splice(ti, 1);
  }
}

function handleBossHit(
  rt: GameRuntime,
  player: Player,
  consumeKnife = true,
  bonusDamage = 0,
  isBowAttack = false
): 'hit' | 'phase_transition' | 'dead' {
  const b = rt.boss;
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;
  const tw = getTeamworkDiffScale(rt);
  const isWeakened = b.state === 'weakened';
  const wasEmpowered = player.empoweredStrike;
  let baseDmg = (consumeKnife ? 2 : 1) + (hasBoon(rt, 'berserker_blade') ? 1 : 0) + bonusDamage;
  if (wasEmpowered) {
    baseDmg += consumeKnife ? 2 : 1;
    player.empoweredStrike = false;
  }

  const aliveCoopCount = rt.players.filter((pl) => pl.state === 'alive').length;

  // Anti-Cheese Enforcement: basic Blade Orbs (consumeKnife === true) do NOT break role/skill boss channels!
  if (consumeKnife && b.channelKind === 'mirage_ambush' && (b.channelTimer || 0) > 0) {
    soundEngine.playArmorClang();
    damagePlayer(rt, player, Math.max(6, Math.round(18 * tw.dmgMult)));
    addFloatingText(rt, player.x + player.size / 2, player.y - 20, 'PARRIED! USE SKILLS!', '#e879f9', 1.15);
  } else if (
    consumeKnife &&
    (b.channelKind === 'bow_weakpoint' || b.channelKind === 'sky_battery') &&
    (b.channelTimer || 0) > 0
  ) {
    soundEngine.playArmorClang();
    damagePlayer(rt, player, Math.max(4, Math.round(12 * tw.dmgMult)));
    addFloatingText(rt, player.x + player.size / 2, player.y - 20, 'SHOCKED! USE RANGED SKILLS!', '#fbbf24', 1.1);
  } else if (
    !consumeKnife &&
    (b.channelKind === 'interrupt' ||
      b.channelKind === 'hunter_mark' ||
      b.channelKind === 'emp_interrupt' ||
      b.channelKind === 'mirage_ambush' ||
      b.channelKind === 'cursed_miasma' ||
      b.channelKind === 'blood_curse')
  ) {
    registerBossInterrupt(rt, player, 1);
  }

  const carapaceActive =
    (b.channelKind === 'iron_carapace' || b.channelKind === 'obsidian_phalanx') &&
    (b.channelTimer || 0) > 0;
  const isPhalanx = b.channelKind === 'obsidian_phalanx';
  const basicDeflectedByArmor = carapaceActive && consumeKnife && player.weapon !== 'warrior_greatsword';
  if (carapaceActive) {
    if (!basicDeflectedByArmor) {
      registerCarapaceBreak(rt, player, player.weapon === 'warrior_greatsword' ? 3 : bonusDamage > 0 ? 2 : 1);
    } else {
      soundEngine.playArmorClang();
      addFloatingText(
        rt,
        cx,
        cy - 44,
        isPhalanx ? 'PHALANX DEFLECTED! USE SKILLS!' : 'ARMOR DEFLECTED! USE SKILLS!',
        '#fda4af',
        1.05
      );
    }
  }

  const isCoreOrBattery = b.channelKind === 'bow_weakpoint' || b.channelKind === 'sky_battery';
  const bowCoreBonus = isCoreOrBattery && isBowAttack;
  if (isCoreOrBattery && (b.channelTimer || 0) > 0) {
    const coreStep = isBowAttack ? 1 : !consumeKnife && bonusDamage > 0 ? 1 : 0;
    if (coreStep > 0) {
      b.channelHits = Math.min(b.channelHitsNeeded || 4, (b.channelHits || 0) + coreStep);
      if ((b.channelHits || 0) >= (b.channelHitsNeeded || 4)) {
        const wasBattery = b.channelKind === 'sky_battery';
        b.channelKind = null;
        b.channelTimer = 0;
        b.channelLabel = '';
        b.channelNodes = [];
        triggerBossExposedWindow(
          rt,
          wasBattery ? 'SKY BATTERIES SHATTERED — 2X STAGGER!' : 'AERIAL CORE SHATTERED — 2X STAGGER!'
        );
      }
    }
  }

  const bothAliveCoop = rt.numPlayers >= 2 && aliveCoopCount >= 2;
  let crossDetonated = false;
  if (rt.bossType === 'eclipse' && bothAliveCoop) {
    if (rt.eclipseMarkedBy === null) {
      rt.eclipseMarkedBy = player.id;
      rt.eclipseMarkTimer = 3.2;
      addFloatingText(
        rt,
        cx,
        cy - 48,
        player.id % 2 === 1 ? 'SOLAR MARK! ALLY STRIKE!' : 'LUNAR MARK! ALLY STRIKE!',
        player.id % 2 === 1 ? '#fbbf24' : '#38bdf8',
        1.15
      );
    } else if (rt.eclipseMarkedBy !== player.id) {
      rt.eclipseMarkedBy = null;
      rt.eclipseMarkTimer = 0;
      baseDmg += 1;
      crossDetonated = true;
    }
  }

  let dmg = isWeakened ? baseDmg * 2 : baseDmg;
  if (bowCoreBonus) {
    dmg *= 3;
  }
  if (carapaceActive && player.weapon !== 'warrior_greatsword') {
    dmg = Math.max(1, Math.floor(dmg * (isPhalanx || basicDeflectedByArmor ? 0.25 : 0.5)));
  }
  if (rt.cheats.oneHitKill) {
    dmg = Math.max(dmg, b.health);
  }
  b.health = Math.max(0, b.health - dmg);
  if (isWeakened) {
    b.weakenedHits++;
  }
  if (consumeKnife) {
    rt.bossHitCooldowns[player.id] = 0.30;
    player.postDashInvulnerability = Math.max(
      player.postDashInvulnerability,
      rt.numPlayers === 1 ? 0.36 : 0.26
    );
    if (!rt.cheats.alwaysArmed) {
      player.hasKnife = false;
      repositionKnifeForPlayer(rt, player);
    }
  }
  rt.screenShake = Math.max(rt.screenShake, crossDetonated ? 20 : isWeakened ? 16 : 12);
  rt.freezeTime = crossDetonated ? 0.085 : isWeakened ? 0.065 : 0.045;
  rt.stylePoints = Math.min(100, rt.stylePoints + (crossDetonated ? 20 : isWeakened ? 14 : 10));
  rt.score += Math.round((260 * dmg + (crossDetonated ? 450 : 0)) * getScoreMult(rt));
  if (crossDetonated) {
    soundEngine.playCoopResonance();
    rt.energyWaves.push({ x: cx, y: cy, radius: 14, maxRadius: 420, alpha: 0.95, speed: 460, color: '#fbbf24' });
    rt.energyWaves.push({ x: cx, y: cy, radius: 14, maxRadius: 360, alpha: 0.9, speed: 390, color: '#38bdf8' });
    addFloatingText(rt, cx, cy - 52, `TWIN ECLIPSE FINISHER! -${dmg}`, '#fde047', 1.3);
  } else if (bowCoreBonus) {
    soundEngine.playBossDamaged();
    addFloatingText(rt, cx + (Math.random() - 0.5) * 30, cy - 30, `BOW CORE 3X! -${dmg}`, '#34d399', 1.32);
  } else if (isWeakened) {
    soundEngine.playBossDamaged();
    addFloatingText(rt, cx + (Math.random() - 0.5) * 30, cy - 28, `WEAKENED 2X! -${dmg}`, '#22d3ee', 1.3);
  } else if (!basicDeflectedByArmor) {
    soundEngine.playBossDamaged();
    addFloatingText(rt, cx + (Math.random() - 0.5) * 30, cy - 25, `-${dmg} HIT`, '#fbbf24', 1.1);
  }
  addSlashArc(rt, cx, cy, player.facingAngle, isWeakened ? '#22d3ee' : player.color, crossDetonated ? 84 : isWeakened ? 68 : 54);

  const bossAccent =
    rt.bossType === 'mecha'
      ? '#38bdf8'
      : rt.bossType === 'void'
      ? '#c084fc'
      : rt.bossType === 'eclipse'
      ? '#fbbf24'
      : '#f97316';

  for (let i = 0; i < 12; i++) {
    addParticle(rt, {
      x: cx,
      y: cy,
      dx: (Math.random() - 0.5) * 240,
      dy: (Math.random() - 0.5) * 240,
      alpha: 1,
      size: 4,
      color: bossAccent,
    });
  }

  const duoHpMult = getBossHpMult(rt);
  const p2Threshold =
    (rt.bossType === 'mecha'
      ? rt.diffSettings.mechaPhase2HP
      : rt.bossType === 'void'
      ? rt.diffSettings.phase2HP
      : rt.bossType === 'eclipse'
      ? rt.diffSettings.eclipsePhase2HP
      : rt.diffSettings.oniPhase2HP) * duoHpMult;

  if (b.health > 0 && b.health <= p2Threshold && b.phase === 1) {
    b.phase = 2;
    b.state = 'phase_transition';
    b.stateTimer = 2.4;
    b.attackLabel = '';
    b.posture = 0;
    b.postureUnlocked = false;
    b.postureDecayGrace = 0;
    b.attacksBeforeVulnerable = 0;
    b.channelKind = null;
    b.channelTimer = 0;
    b.channelLabel = '';
    b.channelNodes = [];
    b.channelTargetPlayerId = undefined;
    b.channelTetherPair = undefined;
    rt.telegraphLines = [];
    rt.oniCursedZones = [];
    rt.bossProjectiles = [];
    rt.eclipseBeacons = [];
    rt.eclipsePylons = [];
    rt.eclipsePrison = null;
    rt.eclipseMirrors = [];
    rt.eclipseMarkedBy = null;
    rt.eclipseMarkTimer = 0;
    rt.eclipseCounterFlashTimer = 0;
    rt.eclipseTetherTimer = 0;
    rt.eclipseSanctuaryActive = false;
    rt.screenShake = Math.max(rt.screenShake, 18);
    rt.warningFlash = 0.22;
    soundEngine.playBossPhase2();
    soundEngine.setMusicTrack(soundEngine.getBossMusicStage(rt.bossType), true);

    const p2Color =
      rt.bossType === 'mecha'
        ? '#f59e0b'
        : rt.bossType === 'void'
        ? '#c084fc'
        : rt.bossType === 'eclipse'
        ? '#fbbf24'
        : '#fb923c';

    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      addParticle(rt, {
        x: cx,
        y: cy,
        dx: Math.cos(a) * (180 + Math.random() * 140),
        dy: Math.sin(a) * (180 + Math.random() * 140),
        alpha: 1,
        size: 4 + Math.random() * 3,
        color: p2Color,
      });
    }

    if (rt.bossType === 'mecha') {
      showPhaseAnnounce(rt, 'OVERCLOCK PROTOCOL ENGAGED · PHASE II', '#f59e0b', 2.6);
      rt.energyWaves.push({ x: cx, y: cy, radius: 10, maxRadius: 540, alpha: 0.9, speed: 340, color: '#f59e0b' });
    } else if (rt.bossType === 'void') {
      showPhaseAnnounce(rt, 'ABYSS AWAKENED · DOUBLE DASH UNLOCKED', '#c084fc', 2.8);
      rt.players.forEach((p) => {
        if (p.state !== 'spectator') {
          p.dash2Active = true;
          p.dash2Ready = true;
        }
      });
      rt.energyWaves.push({ x: cx, y: cy, radius: 10, maxRadius: 560, alpha: 0.9, speed: 350, color: '#c084fc' });
    } else if (rt.bossType === 'eclipse') {
      showPhaseAnnounce(rt, 'ASTRAL CONVERGENCE · ECLIPSE UNBOUND', '#fbbf24', 2.8);
      rt.players.forEach((p) => {
        if (p.state !== 'spectator') {
          p.dash2Active = true;
          p.dash2Ready = true;
        }
      });
      rt.energyWaves.push({ x: cx, y: cy, radius: 10, maxRadius: 580, alpha: 0.92, speed: 340, color: '#fbbf24' });
      rt.energyWaves.push({ x: cx, y: cy, radius: 10, maxRadius: 460, alpha: 0.85, speed: 280, color: '#38bdf8' });
    } else {
      showPhaseAnnounce(rt, 'SHOGUN WRATH UNLEASHED · PHASE II', '#fb923c', 2.6);
      rt.players.forEach((p) => {
        p.sealed = false;
        p.sealTimer = 0;
      });
      rt.oniSpiritBombs = [];
      rt.oniCursedZones = [];
      rt.energyWaves.push({ x: cx, y: cy, radius: 10, maxRadius: 560, alpha: 0.9, speed: 350, color: '#fb923c' });
    }
    return 'phase_transition';
  }

  if (b.health <= 0) {
    b.state = 'dead';
    b.attackLabel = '';
    b.channelKind = null;
    b.channelTimer = 0;
    b.channelLabel = '';
    b.channelNodes = [];
    b.shakeIntensity = 28;
    rt.bossDeadTimer = 0;
    rt.bossDeadBeat = 0;
    rt.timeScale = 0.22;
    rt.bossProjectiles = [];
    rt.telegraphLines = [];
    rt.oniShrines = [];
    rt.oniSpiritBombs = [];
    rt.oniCursedZones = [];
    rt.eclipseBeacons = [];
    rt.eclipsePylons = [];
    rt.eclipsePrison = null;
    rt.eclipseMirrors = [];
    rt.eclipseMarkedBy = null;
    rt.eclipseMarkTimer = 0;
    rt.eclipseCounterFlashTimer = 0;
    rt.eclipseTetherTimer = 0;
    rt.eclipseSanctuaryActive = false;
    rt.score += Math.round(1600 * rt.diffSettings.scoreMultiplier);
    rt.screenShake = Math.max(rt.screenShake, 30);
    rt.warningFlash = 0.65;
    soundEngine.playBossDefeated(rt.bossType);
    rt.comicSlashes.push({ x: cx - 320, y: cy - 220, angle: 0.6, length: 780, alpha: 1, thickness: 9, timer: 0, lifetime: 0.85 });
    rt.comicSlashes.push({ x: cx - 320, y: cy + 220, angle: -0.6, length: 780, alpha: 1, thickness: 9, timer: 0, lifetime: 0.85 });
    rt.energyWaves.push({ x: cx, y: cy, radius: 18, maxRadius: 420, alpha: 0.96, speed: 440, color: '#ffffff' });
    rt.energyWaves.push({ x: cx, y: cy, radius: 14, maxRadius: 560, alpha: 0.92, speed: 340, color: bossAccent });
    for (let i = 0; i < 48; i++) {
      addParticle(rt, {
        x: cx,
        y: cy,
        dx: (Math.random() - 0.5) * 560,
        dy: (Math.random() - 0.5) * 560,
        alpha: 1,
        size: 5,
        color: i % 3 === 0 ? '#ffffff' : bossAccent,
      });
    }
    return 'dead';
  }
  return 'hit';
}

function triggerBossVoice(rt: GameRuntime, pattern: string) {
  const voiceMap: Record<string, string[]> = {
    twin_railgun: ['Target locked. Vaporize.', 'Railguns charged.'],
    orbital_crosshair: ['Orbital strike engaged.', 'Nowhere to run!'],
    rotary_spiral: ['Spin the rotary core!', 'Hail of iron!'],
    cannon_spread: ['Artillery salvo, fire!', 'Shatter them!'],
    forge_laser_grid: ['Deploying Ion Laser Matrix!', 'Grid locked. Vaporize!'],
    siege_mortars: ['Orbital shells inbound!', 'Rain plasma!'],
    pincer_barrage: ['Crush them in the pincer!', 'Close the trap!'],
    missile_barrage: ['Seekers launched.', 'Evade this!'],
    laser_sweep: ['Overclock active. Burn!', 'Maximum output!'],
    emp_cross: ['Discharge EMP rings!', 'Overload!'],
    void_rifts: ['Rend the fabric!', 'Tear reality!'],
    abyss_blink: ['Behind you, mortal.', 'Vanish into dark!'],
    gravity_ring: ['The abyss closes in!', 'Swallow them whole!'],
    spectral_cross: ['Witness the void cross!', 'Shatter!'],
    tentacle_slash: ['Rise from the abyss!', 'Tear them apart!'],
    void_drain: ['Feel the horizon pull!', 'Come into the dark!'],
    wall: ['No escape from the void!', 'Walls of shadow!'],
    boomerang: ['Reap their souls!', 'Umbral blades!'],
    clone: ['Which one is real?', 'Phantoms, strike!'],
    tentacle_slam: ['Crush them!', 'Abyssal wrath!'],
    void_vortex: ['Drown in the vortex!', 'Consume all!'],
    sniper: ['I see your every move.', 'Piercing dark!'],
    iaijutsu_cut: ['Face my blade!', 'Flash of steel!'],
    thunder_step: ['Too slow!', 'Thunder step!'],
    hellfire_pillars: ['Burn to ash!', 'Hellfire eruption!'],
    eight_gate_lotus: ['Eight Gates, bloom!', 'Crimson lotus!'],
    shrine_shatter: ['Break the seals if you dare!', 'Torii ritual!'],
    katana_wave: ['Sweeping blades!', 'Cut the sky!'],
    oni_barrage: ['Unleash the eight serpents!', 'Oni storm!'],
    spirit_bomb: ['Cursed spirits, hunt!', 'Devour them!'],
    cursed_zone: ['Bleed on consecrated ground!', 'Blood sigils!'],
    soul_seal_combo: ['Your soul is bound!', 'Kneel!'],
    bow_weakpoint: ['Aim true—or feel the core surge!', 'Core exposed! Keep your distance!'],
    sky_battery: ['Sky Batteries armed! Shoot them down!', 'Turrets locked—stay back or burn!'],
    emp_interrupt: ['Arena EMP charging—silence me or fall!', 'Unblockable surge! Interrupt it now!'],
    mirage_ambush: ['Strike blindly and be parried!', 'Shadow counter ready! Show your skill!'],
    obsidian_phalanx: ['Obsidian Phalanx raised! Shatter if you can!', 'Your light blades bounce like sparks!'],
    blood_curse: ['Drink deep of the Blood Curse!', 'Let your veins wither without faith!'],
    eclipse_tether: ['Share one sanctuary, or burn!', 'Eclipse Judgment!'],
    twin_pylons: ['Shatter both pillars in unison!', 'One dies, the other rises!'],
    eclipse_prison: ['Save your ally before the light falls!', 'Astral Stasis!'],
    eclipse_prism_beam: ['Charge the twin mirrors or perish!', 'Eclipse Cataclysm!'],
    celestial_guillotine: ['Twin arcs cleave the sky!', 'Celestial guillotine!'],
    starfall_meteors: ['Heavens fall to ash!', 'Starfall judgment!'],
    eclipse_nova: ['Sun and Moon collide!', 'Bow before the Eclipse!'],
    eclipse_convergence: ['Astral Convergence!', 'Light and dark as one!'],
    solar_lunar_nova: ['Solar flare and lunar tide!', 'Dance in the eclipse!'],
    eclipse_cross_sweep: ['Cross-blades of twilight!', 'Cut through the dusk!'],
    coop_punishment: ['Bond shattered! Witness Eclipse Judgment!', 'Fail together, burn together!', 'Betrayal answered with Cataclysm!'],
  };
  const lines = voiceMap[pattern] || ['Fall to ash!'];
  const line = lines[Math.floor(Math.random() * lines.length)];
  rt.bossVoiceLine = line;
  rt.bossVoiceTimer = 2.4;
  soundEngine.playBossVoiceTelegraph(rt.bossType, pattern, line);
}

function spawnRailgunTelegraphs(rt: GameRuntime, cx: number, cy: number, count: number, telegraphDur = 0.9) {
  const targets = rt.players.filter((p) => p.state === 'alive');
  for (let i = 0; i < count; i++) {
    const tp = targets[i % Math.max(1, targets.length)] || rt.players[0];
    const baseAngle = Math.atan2(tp.y + tp.size / 2 - cy, tp.x + tp.size / 2 - cx);
    const offset = i === 0 ? 0 : (i % 2 === 1 ? 1 : -1) * 0.24 * Math.ceil(i / 2);
    const ang = baseAngle + offset;
    rt.telegraphLines.push({
      x1: cx,
      y1: cy,
      x2: cx + Math.cos(ang) * 1650,
      y2: cy + Math.sin(ang) * 1650,
      timer: telegraphDur,
      maxTimer: telegraphDur,
      width: 15,
      color: '#ef4444',
      kind: 'railgun',
      triggered: false,
    });
  }
}

function updateMechaBoss(rt: GameRuntime, dt: number) {
  const b = rt.boss;
  if (b.health <= 0) return;
  const isP2 = b.phase === 2;
  b.animationTimer += dt;
  b.stateTimer -= dt;
  b.pulseSize = 1 + Math.sin(b.animationTimer * 3) * 0.06;
  b.rotationAngle += dt * (isP2 ? 3.5 : 2);
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;

  // Tick Orbital Plasma Salvo target locks & impact zones
  for (let zi = rt.oniCursedZones.length - 1; zi >= 0; zi--) {
    const zone = rt.oniCursedZones[zi];
    if (zone.telegraphTimer && zone.telegraphTimer > 0) {
      zone.telegraphTimer -= dt;
      if (zone.telegraphTimer <= 0) {
        zone.telegraphTimer = 0;
        const burstCount = zone.detonateProjCount ?? 6;
        const burstSpeed = zone.detonateProjSpeed ?? 4.2;
        const burstColor = zone.detonateProjColor ?? '#fbbf24';
        const burstDamage = zone.detonateProjDamage ?? 16;
        const spinOffset = b.attackTimer;
        for (let r = 0; r < burstCount; r++) {
          const ang = (r / burstCount) * Math.PI * 2 + spinOffset;
          pushBossProj(rt, {
            uid: rt.nextUid++,
            x: zone.x,
            y: zone.y,
            dx: Math.cos(ang) * burstSpeed,
            dy: Math.sin(ang) * burstSpeed,
            size: 14,
            speed: 1,
            color: burstColor,
            damage: burstDamage,
            shape: 'ember',
          });
        }
        rt.energyWaves.push({
          x: zone.x,
          y: zone.y,
          radius: 12,
          maxRadius: zone.maxRadius * 1.35,
          alpha: 0.9,
          speed: 360,
          color: '#f97316',
        });
        rt.screenShake = Math.max(rt.screenShake, 6);
        soundEngine.playBossAttackExecuteSfx('siege_mortars');
      }
      continue;
    }
    zone.lifetime -= dt;
    if (zone.lifetime <= 0) {
      rt.oniCursedZones.splice(zi, 1);
      continue;
    }
    zone.alpha = Math.min(1, zone.lifetime / 1.1) * 0.68;
    if (zone.radius < zone.maxRadius) zone.radius += zone.growthRate * dt;
    zone.damageTimer += dt;
    if (zone.damageTimer > 0.78) {
      zone.damageTimer = 0;
      rt.players.forEach((p) => {
        if (p.state === 'alive' && !p.dashImmune && p.invulnFrames <= 0 && p.cloakTimer <= 0) {
          if (Math.hypot(p.x + p.size / 2 - zone.x, p.y + p.size / 2 - zone.y) < zone.radius) {
            damagePlayer(rt, p, 20);
          }
        }
      });
    }
  }

  if (b.channelKind) {
    b.pulseSize = 1.08 + Math.sin(b.animationTimer * 12) * 0.1;
    b.attackLabel = '';
    return;
  }

  switch (b.state) {
    case 'comic_intro':
      if (b.entryPhase === 0) {
        soundEngine.playBossCinematicIntro('mecha', 'Protocol: Extermination. All targets marked for annihilation.');
        b.entryPhase = 1;
        rt.screenShake = Math.max(rt.screenShake, 10);
      } else if (b.entryPhase === 1) {
        // Act I: Orbital satellite lock sweeps over drop zone while mecha drops slowly above radar horizon
        b.y = Math.min(b.originalY - 230, b.y + 32 * dt);
        if (Math.random() < 0.72) {
          addParticle(rt, {
            x: cx + (Math.random() - 0.5) * 90,
            y: b.originalY + b.size / 2,
            dx: (Math.random() - 0.5) * 140,
            dy: -90 - Math.random() * 120,
            alpha: 0.92,
            size: 3.5,
            color: Math.random() < 0.55 ? '#ef4444' : '#38bdf8',
          });
        }
        if (b.stateTimer <= 4.55) {
          b.entryPhase = 2;
        }
      } else if (b.entryPhase === 2) {
        // Act II: Supersonic drop slam
        b.y += 1280 * dt;
        if (Math.random() < 0.9) {
          addParticle(rt, {
            x: cx + (Math.random() - 0.5) * 80,
            y: b.y,
            dx: (Math.random() - 0.5) * 160,
            dy: -240 - Math.random() * 160,
            alpha: 0.95,
            size: 4.5,
            color: Math.random() < 0.55 ? '#38bdf8' : '#f97316',
          });
        }
        if (b.y >= b.originalY) {
          b.y = b.originalY;
          b.entryPhase = 3;
          b.shakeIntensity = 30;
          rt.screenShake = Math.max(rt.screenShake, 28);
          rt.warningFlash = 0.44;
          soundEngine.playLanding();
          rt.energyWaves.push({ x: cx, y: b.originalY + b.size / 2, radius: 16, maxRadius: 680, alpha: 0.96, speed: 420, color: '#38bdf8' });
          rt.energyWaves.push({ x: cx, y: b.originalY + b.size / 2, radius: 16, maxRadius: 500, alpha: 0.92, speed: 320, color: '#ef4444' });
          rt.comicSlashes.push({ x: cx - 380, y: b.originalY + b.size / 2, angle: 0, length: 760, alpha: 0.96, thickness: 7, timer: 0, lifetime: 0.55 });
          for (let i = 0; i < 36; i++) {
            const a = (i / 36) * Math.PI * 2;
            const sp = 220 + Math.random() * 160;
            addParticle(rt, { x: cx, y: b.originalY + b.size / 2, dx: Math.cos(a) * sp, dy: Math.sin(a) * sp, alpha: 1, size: 4.5, color: i % 2 === 0 ? '#fbbf24' : '#38bdf8' });
          }
        }
      } else {
        // Act III: True Dreadnought reveal + anime title card glare
        b.shakeIntensity = Math.max(0, b.shakeIntensity - dt * 28);
        if (Math.random() < 0.4) {
          const a = Math.random() * Math.PI * 2;
          addParticle(rt, { x: cx + Math.cos(a) * 68, y: cy + Math.sin(a) * 68, dx: Math.cos(a) * 140, dy: Math.sin(a) * 140, alpha: 0.85, size: 3.5, color: '#38bdf8' });
        }
      }
      rt.bossNameReveal = b.stateTimer <= 3.1 && b.stateTimer > 0.3;
      if (b.stateTimer <= 0) {
        b.y = b.originalY;
        b.state = 'idle';
        b.stateTimer = 1.5;
        rt.bossNameReveal = false;
      }
      break;

    case 'phase_transition':
      b.pulseSize = 1.1 + Math.sin(b.animationTimer * 6) * 0.08;
      if (Math.random() < 0.6) {
        const a = Math.random() * Math.PI * 2;
        addParticle(rt, { x: cx, y: cy, dx: Math.cos(a) * 200, dy: Math.sin(a) * 200, alpha: 1, size: 4, color: '#f59e0b' });
      }
      if (b.stateTimer <= 0) {
        b.state = 'idle';
        b.stateTimer = 1.6;
      }
      break;

    case 'idle':
      if (b.stateTimer <= 0) {
        const isNightmare = rt.difficulty === 'hard';
        const { pace: diffPace } = getDiffScale(rt);
        b.state = 'telegraph';
        b.stateTimer = isNightmare ? (isP2 ? 0.95 : 1.15) : (isP2 ? 1.1 : 1.35) / Math.min(1.25, diffPace);
        const p1 = ['twin_railgun', 'rotary_spiral', 'cannon_spread', 'forge_laser_grid', 'missile_barrage', 'pincer_barrage', 'siege_mortars'];
        const p2 = ['twin_railgun', 'orbital_crosshair', 'rotary_spiral', 'forge_laser_grid', 'laser_sweep', 'emp_cross', 'missile_barrage', 'pincer_barrage', 'siege_mortars'];
        const pool = isP2 ? p2 : p1;
        b.attackPattern = pool[Math.floor(Math.random() * pool.length)];
        const labelMap: Record<string, string> = {
          twin_railgun: isNightmare ? 'OMEGA RAILGUN LOCK' : 'TWIN RAILGUN LOCK',
          orbital_crosshair: isNightmare ? 'HYPER ORBITAL STRIKE' : 'ORBITAL RAIL STRIKE',
          rotary_spiral: isNightmare ? 'COUNTER-ROTARY HELIX' : 'ROTARY HELIX',
          cannon_spread: isNightmare ? 'STAGGERED SHRAPNEL STORM' : 'HEAVY SHRAPNEL FAN',
          forge_laser_grid: isNightmare ? 'OMEGA ION MATRIX' : 'ANVIL LASER MATRIX',
          siege_mortars: isNightmare ? 'HELLFIRE PLASMA SALVO' : 'ORBITAL PLASMA SALVO',
          pincer_barrage: isNightmare ? 'TWIN TITAN PINCER' : 'TITAN PINCER VOLLEY',
          missile_barrage: isNightmare ? 'FLANKING SEEKER SALVO' : 'SEEKER WARHEADS',
          laser_sweep: isNightmare ? 'OVERCLOCK HYPER-SWEEP' : 'OVERCLOCK SWEEP',
          emp_cross: isNightmare ? 'CONCENTRIC EMP MATRIX' : 'EMP SHOCK RINGS',
        };
        b.attackLabel = labelMap[b.attackPattern] || '';
        triggerBossVoice(rt, b.attackPattern);
        if (b.attackPattern === 'twin_railgun' || b.attackPattern === 'orbital_crosshair') {
          const beamCount = b.attackPattern === 'orbital_crosshair' ? (isNightmare ? 6 : 4) : isNightmare ? (isP2 ? 5 : 4) : isP2 ? 3 : 2;
          const railDur = b.attackPattern === 'orbital_crosshair'
            ? (isNightmare ? 0.86 : 1.0 / diffPace)
            : (isNightmare ? 0.74 : 0.9 / diffPace);
          spawnRailgunTelegraphs(rt, cx, cy, beamCount, railDur);
        } else if (b.attackPattern === 'forge_laser_grid') {
          const gridDur = isNightmare ? 0.74 : 0.88 / diffPace;
          for (let g = 0; g < 3; g++) {
            const horiz = g % 2 === 0;
            const pos = horiz ? 190 + g * 190 : 250 + g * 290;
            rt.telegraphLines.push({
              x1: horiz ? 0 : pos,
              y1: horiz ? pos : 0,
              x2: horiz ? rt.arenaWidth : pos,
              y2: horiz ? pos : rt.arenaHeight,
              timer: gridDur,
              maxTimer: gridDur,
              width: 15,
              color: '#38bdf8',
              kind: 'railgun',
              triggered: false,
            });
          }
        }
      }
      break;

    case 'telegraph':
      b.pulseSize = 1 + Math.sin(b.animationTimer * 10) * 0.2;
      if (b.stateTimer <= 0) {
        b.state = 'attacking';
        b.stateTimer = rt.difficulty === 'hard' ? (isP2 ? 2.9 : 3.2) : isP2 ? 2.6 : 3.0;
        b.attackTimer = 0;
      }
      break;

    case 'attacking': {
      b.attackTimer += dt;
      const isNightmare = rt.difficulty === 'hard';
      const { spd: diffSpd, pace: diffPace } = getDiffScale(rt);
      const spdMult = (isP2 ? 1.32 : 1.05) * (isNightmare ? 1.18 : diffSpd);

      // Subtle lateral patrol in bigger arena
      b.x += Math.cos(b.animationTimer * (isNightmare ? 1.45 : 1.1)) * (isNightmare ? 120 : 90) * dt;
      b.x = Math.max(180, Math.min(rt.arenaWidth - b.size - 180, b.x));

      if (b.attackPattern === 'twin_railgun' || b.attackPattern === 'orbital_crosshair') {
        const interval = isNightmare
          ? (b.attackPattern === 'orbital_crosshair' ? 0.94 : 0.88)
          : (b.attackPattern === 'orbital_crosshair' ? 1.05 : 1.1) / diffPace;
        if (Math.floor(b.attackTimer / interval) > Math.floor((b.attackTimer - dt) / interval)) {
          const beamCount = b.attackPattern === 'orbital_crosshair' ? (isNightmare ? 6 : 4) : isNightmare ? (isP2 ? 5 : 4) : isP2 ? 3 : 2;
          const railDur = b.attackPattern === 'orbital_crosshair'
            ? (isNightmare ? 0.86 : 1.0 / diffPace)
            : (isNightmare ? 0.74 : 0.9 / diffPace);
          spawnRailgunTelegraphs(rt, cx, cy, beamCount, railDur);
          if (isNightmare) {
            for (let ri = 0; ri < 10; ri++) {
              const ang = (ri / 10) * Math.PI * 2 + b.attackTimer;
              pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(ang) * 4.9, dy: Math.sin(ang) * 4.9, size: 14, speed: 1, color: '#38bdf8', damage: 16, shape: 'orb' });
            }
          }
        }
      } else if (b.attackPattern === 'forge_laser_grid') {
        const iv = isNightmare ? 0.76 : 0.95 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const step = Math.floor(b.attackTimer / iv);
          const gridDur = isNightmare ? 0.72 : 0.86 / diffPace;
          const horiz = step % 2 === 0;
          const linesCount = isNightmare ? 4 : 3;
          for (let li = 0; li < linesCount; li++) {
            const laneBase = horiz
              ? 135 + (li / linesCount) * (rt.arenaHeight - 270)
              : 170 + (li / linesCount) * (rt.arenaWidth - 340);
            const pos = laneBase + (step % 3) * 32;
            rt.telegraphLines.push({
              x1: horiz ? 0 : pos,
              y1: horiz ? pos : 0,
              x2: horiz ? rt.arenaWidth : pos,
              y2: horiz ? pos : rt.arenaHeight,
              timer: gridDur,
              maxTimer: gridDur,
              width: 15,
              color: step % 2 === 0 ? '#38bdf8' : '#f97316',
              kind: 'railgun',
              triggered: false,
            });
          }
          const orbN = isNightmare ? 16 : 12;
          for (let ri = 0; ri < orbN; ri++) {
            const ang = (ri / orbN) * Math.PI * 2 + step * 0.28;
            pushBossProj(rt, {
              uid: rt.nextUid++,
              x: cx,
              y: cy,
              dx: Math.cos(ang) * 4.7 * spdMult,
              dy: Math.sin(ang) * 4.7 * spdMult,
              size: 14,
              speed: 1,
              color: '#38bdf8',
              damage: 16,
              shape: 'orb',
            });
          }
          soundEngine.playBossAttackExecuteSfx('forge_laser_grid');
        }
      } else if (b.attackPattern === 'rotary_spiral') {
        const iv = isNightmare ? 0.13 : 0.16 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const arms = isP2 ? 4 : 3;
          const baseAng = b.attackTimer * (isNightmare ? 2.85 : 2.6);
          for (let i = 0; i < arms; i++) {
            const ang = baseAng + (i / arms) * Math.PI * 2;
            pushBossProj(rt, {
              uid: rt.nextUid++,
              x: cx,
              y: cy,
              dx: Math.cos(ang) * 5.2 * spdMult,
              dy: Math.sin(ang) * 5.2 * spdMult,
              size: 14,
              speed: 1,
              color: isP2 ? '#f97316' : '#38bdf8',
              damage: 14,
              shape: 'orb',
            });
          }
          // Nightmare counter-rotating outer helix creates weaving dodge lanes
          if (isNightmare) {
            const counterArms = isP2 ? 4 : 3;
            const revAng = -b.attackTimer * 1.95;
            for (let i = 0; i < counterArms; i++) {
              const ang = revAng + (i / counterArms) * Math.PI * 2;
              pushBossProj(rt, {
                uid: rt.nextUid++,
                x: cx,
                y: cy,
                dx: Math.cos(ang) * 4.15 * spdMult,
                dy: Math.sin(ang) * 4.15 * spdMult,
                size: 13,
                speed: 1,
                color: '#ef4444',
                damage: 14,
                shape: 'shard',
              });
            }
          }
          if (Math.random() < 0.4) soundEngine.playBossAttackExecuteSfx('rotary_spiral');
        }
      } else if (b.attackPattern === 'cannon_spread') {
        const iv = isNightmare ? 0.42 : 0.6 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const wave = Math.floor(b.attackTimer / iv);
          const np = isNightmare ? (isP2 ? 15 : 13) : isP2 ? 13 : 10;
          const shift = (wave % 2) * 0.09;
          for (let i = 0; i < np; i++) {
            const ang = Math.PI * 0.08 + shift + (i / (np - 1)) * Math.PI * 0.84;
            const sp = (wave % 2 === 0 ? 5.5 : 4.6) * spdMult;
            pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(ang) * sp, dy: Math.sin(ang) * sp, size: 15, speed: 1, color: wave % 2 === 0 ? '#38bdf8' : '#fbbf24', damage: 16, shape: 'orb' });
          }
          if (isNightmare) {
            const tp = getRandomAlivePlayer(rt);
            const aim = Math.atan2(tp.y + tp.size / 2 - cy, tp.x + tp.size / 2 - cx);
            for (const off of [-0.26, 0.26]) {
              pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(aim + off) * 7.6, dy: Math.sin(aim + off) * 7.6, size: 15, speed: 1, color: '#ef4444', damage: 18, shape: 'lance' });
            }
          }
          soundEngine.playBossAttackExecuteSfx('cannon_spread');
        }
      } else if (b.attackPattern === 'pincer_barrage') {
        const iv = isNightmare ? 0.17 : 0.24 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const sweep = Math.sin(b.attackTimer * (isNightmare ? 3.5 : 3.0)) * 0.42;
          const leftAng = Math.PI * 0.4 + sweep;
          const rightAng = Math.PI * 0.6 - sweep;
          pushBossProj(rt, { uid: rt.nextUid++, x: cx - 55, y: cy, dx: Math.cos(leftAng) * 6.0 * spdMult, dy: Math.sin(leftAng) * 6.0 * spdMult, size: 15, speed: 1, color: '#38bdf8', damage: 18, shape: 'lance' });
          pushBossProj(rt, { uid: rt.nextUid++, x: cx + 55, y: cy, dx: Math.cos(rightAng) * 6.0 * spdMult, dy: Math.sin(rightAng) * 6.0 * spdMult, size: 15, speed: 1, color: '#f97316', damage: 18, shape: 'lance' });
          if (isNightmare) {
            pushBossProj(rt, { uid: rt.nextUid++, x: cx - 75, y: cy, dx: Math.cos(leftAng - 0.25) * 4.8 * spdMult, dy: Math.sin(leftAng - 0.25) * 4.8 * spdMult, size: 14, speed: 1, color: '#fbbf24', damage: 16, shape: 'orb' });
            pushBossProj(rt, { uid: rt.nextUid++, x: cx + 75, y: cy, dx: Math.cos(rightAng + 0.25) * 4.8 * spdMult, dy: Math.sin(rightAng + 0.25) * 4.8 * spdMult, size: 14, speed: 1, color: '#fbbf24', damage: 16, shape: 'orb' });
          }
          if (Math.random() < 0.5) soundEngine.playBossAttackExecuteSfx('pincer_barrage');
        }
      } else if (b.attackPattern === 'siege_mortars') {
        const iv = isNightmare ? 0.72 : 0.92 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const tp = getRandomAlivePlayer(rt);
          const mx = Math.max(110, Math.min(rt.arenaWidth - 110, tp.x + tp.size / 2 + (Math.random() - 0.5) * 180));
          const my = Math.max(130, Math.min(rt.arenaHeight - 110, tp.y + tp.size / 2 + (Math.random() - 0.5) * 160));
          const lockDur = isNightmare ? 0.9 : 1.05;
          rt.oniCursedZones.push({
            x: mx,
            y: my,
            radius: 26,
            maxRadius: isNightmare ? 110 : isP2 ? 98 : 84,
            growthRate: isNightmare ? 56 : 46,
            alpha: 0.75,
            lifetime: 2.9,
            color: 'rgba(249, 115, 22, 0.85)',
            damageTimer: 0,
            telegraphTimer: lockDur,
            maxTelegraphTimer: lockDur,
            detonateProjCount: isNightmare ? 10 : 6,
            detonateProjSpeed: (isNightmare ? 4.4 : 3.9) * spdMult,
            detonateProjColor: '#fbbf24',
            detonateProjDamage: 16,
          });
          const aim = Math.atan2(tp.y + tp.size / 2 - cy, tp.x + tp.size / 2 - cx);
          const halfFan = isNightmare ? 3 : 2;
          for (let k = -halfFan; k <= halfFan; k++) {
            pushBossProj(rt, {
              uid: rt.nextUid++,
              x: cx,
              y: cy,
              dx: Math.cos(aim + k * 0.2) * 5.6 * spdMult,
              dy: Math.sin(aim + k * 0.2) * 5.6 * spdMult,
              size: 15,
              speed: 1,
              color: Math.abs(k) % 2 === 0 ? '#f97316' : '#38bdf8',
              damage: 18,
              shape: 'lance',
            });
          }
          soundEngine.playBossAttackExecuteSfx('rotary_spiral');
        }
      } else if (b.attackPattern === 'missile_barrage') {
        const iv = isNightmare ? 0.46 : 0.6 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const tp = getRandomAlivePlayer(rt);
          const aim = Math.atan2(tp.y + tp.size / 2 - cy, tp.x + tp.size / 2 - cx);
          const offsets = isNightmare ? [-0.42, 0.42] : [0];
          offsets.forEach((off) => {
            pushBossProj(rt, {
              uid: rt.nextUid++,
              x: cx,
              y: cy,
              dx: Math.cos(aim + off) * 3.8 * spdMult,
              dy: Math.sin(aim + off) * 3.8 * spdMult,
              size: 19,
              speed: 1,
              color: '#fb7185',
              type: 'homing',
              shape: 'missile',
              damage: 24,
              homingStr: isNightmare ? 0.115 : isP2 ? 0.1 : 0.075,
            });
          });
          soundEngine.playBossAttackExecuteSfx('missile_barrage');
        }
      } else if (b.attackPattern === 'laser_sweep') {
        const iv = isNightmare ? 0.095 : 0.11 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const arms = isNightmare ? 5 : 3;
          const sweepA = b.attackTimer * (isNightmare ? 3.55 : 3.2);
          for (let i = 0; i < arms; i++) {
            const ang = sweepA + i * ((Math.PI * 2) / arms);
            pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(ang) * (isNightmare ? 7.4 : 6.8 * diffSpd), dy: Math.sin(ang) * (isNightmare ? 7.4 : 6.8 * diffSpd), size: 14, speed: 1, color: i % 2 === 0 ? '#fbbf24' : '#ef4444', damage: 16, shape: 'lance' });
          }
          if (isNightmare && Math.floor(b.attackTimer / 0.72) > Math.floor((b.attackTimer - dt) / 0.72)) {
            for (let r = 0; r < 12; r++) {
              const ang = (r / 12) * Math.PI * 2;
              pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(ang) * 4.4, dy: Math.sin(ang) * 4.4, size: 14, speed: 1, color: '#38bdf8', damage: 16, shape: 'orb' });
            }
          }
          if (Math.random() < 0.25) soundEngine.playBossAttackExecuteSfx('laser_sweep');
        }
      } else if (b.attackPattern === 'emp_cross') {
        const iv = isNightmare ? 0.42 : 0.55 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const phase = Math.floor(b.attackTimer / iv) % 2;
          const count = isNightmare ? 20 : 16;
          const offset = phase * (Math.PI / count);
          const ringSpd = isNightmare ? (phase === 0 ? 6.2 : 4.2) : 5.2 * diffSpd;
          for (let i = 0; i < count; i++) {
            const ang = offset + (i / count) * Math.PI * 2;
            pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(ang) * ringSpd, dy: Math.sin(ang) * ringSpd, size: 15, speed: 1, color: phase === 0 ? '#f97316' : '#38bdf8', damage: 20, shape: 'orb' });
          }
          soundEngine.playBossAttackExecuteSfx('emp_cross');
        }
      }

      if (b.stateTimer <= 0) {
        completeBossAttackCycle(rt, isP2);
      }
      break;
    }

    case 'weakened':
      b.pulseSize = 0.84 + Math.sin(b.animationTimer * 6) * 0.14;
      emitBossWeakenedSparks(rt);
      if (b.stateTimer <= 0 || b.weakenedHits >= b.maxWeakenedHits) {
        b.state = 'idle';
        b.stateTimer = 1.9;
        b.attackLabel = '';
      }
      break;
  }
}

function spawnVoidRiftLines(rt: GameRuntime, count: number, telegraphDur = 0.9) {
  for (let i = 0; i < count; i++) {
    const horizontal = i % 2 === 0;
    const pos = horizontal
      ? 140 + Math.random() * (rt.arenaHeight - 280)
      : 140 + Math.random() * (rt.arenaWidth - 280);
    rt.telegraphLines.push({
      x1: horizontal ? 0 : pos,
      y1: horizontal ? pos : 0,
      x2: horizontal ? rt.arenaWidth : pos,
      y2: horizontal ? pos : rt.arenaHeight,
      timer: telegraphDur,
      maxTimer: telegraphDur,
      width: 11,
      color: '#c084fc',
      kind: 'void_rift',
      triggered: false,
    });
  }
}

function updateVoidBoss(rt: GameRuntime, dt: number) {
  const b = rt.boss;
  if (b.health <= 0) return;
  const isP2 = b.phase === 2;
  b.animationTimer += dt;
  b.stateTimer -= dt;
  b.pulseSize = 1 + Math.sin(b.animationTimer * 3) * 0.08;
  b.rotationAngle += dt * 2;
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;

  rt.voidTentacles.forEach((t) => {
    t.waveOffset += t.waveSpeed * dt;
    if (t.extending) {
      t.extendFactor = Math.min(1, t.extendFactor + dt * 1.6);
      if (t.extendFactor >= 1) {
        t.damageEnabled = true;
        t.retractTimer -= dt;
        if (t.retractTimer <= 0) {
          t.extending = false;
          t.damageEnabled = false;
        }
      }
    } else {
      t.extendFactor = Math.max(0, t.extendFactor - dt * 2.5);
    }
    if (t.damageEnabled) {
      const segs = getTentacleSegments(t, cx, cy, b.size, b.pulseSize, b.animationTimer);
      const tip = segs[segs.length - 1];
      rt.players.forEach((p) => {
        if (p.state === 'alive' && !p.dashImmune && p.invulnFrames <= 0 && p.postDashInvulnerability <= 0 && p.cloakTimer <= 0) {
          const dist = Math.hypot(p.x + p.size / 2 - tip.x, p.y + p.size / 2 - tip.y);
          if (dist < p.size / 2 + 16) damagePlayer(rt, p, 28);
        }
      });
    }
  });

  if (b.channelKind) {
    b.pulseSize = 1.08 + Math.sin(b.animationTimer * 12) * 0.1;
    b.attackLabel = '';
    return;
  }

  switch (b.state) {
    case 'comic_intro':
      if (b.entryPhase === 0) {
        soundEngine.playBossCinematicIntro('void', 'The abyss gazes back... and finds you wanting.');
        rt.voidRifts.push({ x: cx, y: cy, size: 14, maxSize: 240, alpha: 0.96, rotation: 0, growthRate: 155 });
        b.entryPhase = 1;
      } else if (b.entryPhase === 1) {
        if (Math.random() < 0.85) {
          const a = Math.random() * Math.PI * 2;
          addParticle(rt, { x: cx + Math.cos(a) * 230, y: cy + Math.sin(a) * 230, dx: -Math.cos(a) * 210, dy: -Math.sin(a) * 210, alpha: 0.94, size: 4, color: Math.random() < 0.7 ? '#c084fc' : '#f43f5e' });
        }
        if (b.stateTimer <= 4.85) {
          b.entryPhase = 2;
        }
      } else if (b.entryPhase === 2) {
        // Act II Horror Blackout Breath: Singularity shrinks inward until slit eye snaps open
        if (b.stateTimer <= 4.15) {
          b.entryPhase = 3;
          b.shakeIntensity = 30;
          rt.screenShake = Math.max(rt.screenShake, 28);
          rt.warningFlash = 0.44;
          soundEngine.playLanding();
          strikeTentacles(rt, 6);
          rt.comicSlashes.push({ x: cx - 340, y: cy - 160, angle: 0.44, length: 740, alpha: 0.96, thickness: 6, timer: 0, lifetime: 0.6 });
          rt.comicSlashes.push({ x: cx - 340, y: cy + 160, angle: -0.44, length: 740, alpha: 0.96, thickness: 6, timer: 0, lifetime: 0.6 });
          rt.energyWaves.push({ x: cx, y: cy, radius: 18, maxRadius: 640, alpha: 0.96, speed: 400, color: '#a855f7' });
          rt.energyWaves.push({ x: cx, y: cy, radius: 18, maxRadius: 460, alpha: 0.9, speed: 300, color: '#f43f5e' });
        }
      } else {
        b.shakeIntensity = Math.max(0, b.shakeIntensity - dt * 26);
        if (Math.random() < 0.4) {
          const a = Math.random() * Math.PI * 2;
          addParticle(rt, { x: cx + Math.cos(a) * 70, y: cy + Math.sin(a) * 70, dx: Math.cos(a) * 140, dy: Math.sin(a) * 140, alpha: 0.85, size: 3.5, color: '#e879f9' });
        }
      }
      rt.bossNameReveal = b.stateTimer <= 3.1 && b.stateTimer > 0.3;
      if (b.stateTimer <= 0) {
        b.state = 'idle';
        b.stateTimer = 1.5;
        rt.bossNameReveal = false;
      }
      break;

    case 'phase_transition':
      b.pulseSize = 1.1 + Math.sin(b.animationTimer * 6) * 0.08;
      if (Math.random() < 0.65) {
        const a = Math.random() * Math.PI * 2;
        addParticle(rt, { x: cx, y: cy, dx: Math.cos(a) * 210, dy: Math.sin(a) * 210, alpha: 1, size: 4, color: '#c084fc' });
      }
      if (b.stateTimer <= 0) {
        b.state = 'idle';
        b.stateTimer = 1.6;
        initVoidTentacles(rt);
      }
      break;

    case 'idle':
      if (b.stateTimer <= 0) {
        const isNightmare = rt.difficulty === 'hard';
        const { pace: diffPace } = getDiffScale(rt);
        b.state = 'telegraph';
        b.stateTimer = isNightmare ? (isP2 ? 1.0 : 1.2) : (isP2 ? 1.15 : 1.4) / Math.min(1.25, diffPace);
        const p1 = ['void_rifts', 'tentacle_slash', 'void_drain', 'wall', 'boomerang', 'clone', 'abyss_blink', 'gravity_ring'];
        const p2 = ['void_rifts', 'tentacle_slam', 'void_vortex', 'wall', 'clone', 'sniper', 'abyss_blink', 'gravity_ring', 'spectral_cross'];
        const pool = isP2 ? p2 : p1;
        b.attackPattern = pool[Math.floor(Math.random() * pool.length)];

        const labelMap: Record<string, string> = {
          void_rifts: isNightmare ? 'CATACLYSMIC RIFT GRID' : 'DIMENSIONAL RIFT SLASH',
          abyss_blink: isNightmare ? 'HYPER BLINK AMBUSH' : 'DIMENSIONAL BLINK AMBUSH',
          gravity_ring: isNightmare ? 'TWIN COLLAPSING RINGS' : 'COLLAPSING VOID RING',
          spectral_cross: isNightmare ? 'HEX-ABYSS CROSS' : 'QUADRANT ABYSS CROSS',
          tentacle_slash: 'ABYSSAL TENTACLES',
          void_drain: 'EVENT HORIZON PULL',
          wall: isNightmare ? 'DOUBLE VOID CURTAIN' : 'VOID CURTAIN',
          boomerang: isNightmare ? 'STORM OF GLAIVES' : 'UMBRAL GLAIVES',
          clone: isNightmare ? 'LEGION OF MIRAGES' : 'PHANTOM MIRAGE',
          tentacle_slam: 'ALL TENTACLES SLAM',
          void_vortex: 'ABYSS VORTEX',
          sniper: isNightmare ? 'TRIPLE VOID SNIPER' : 'VOID SNIPER VOLLEY',
        };
        b.attackLabel = labelMap[b.attackPattern] || '';

        if (b.attackPattern === 'wall') {
          if (Math.random() > 0.5) {
            const sx = Math.random() > 0.5 ? -20 : rt.arenaWidth + 20;
            b.wallDirection = { isHorizontal: true, startX: sx, dirX: sx < 0 ? 1 : -1 };
          } else {
            const sy = Math.random() > 0.5 ? -20 : rt.arenaHeight + 20;
            b.wallDirection = { isHorizontal: false, startY: sy, dirY: sy < 0 ? 1 : -1 };
          }
        } else {
          b.wallDirection = null;
        }
        if (b.attackPattern === 'void_rifts') {
          spawnVoidRiftLines(rt, isNightmare ? (isP2 ? 7 : 6) : isP2 ? 5 : 4, isNightmare ? 0.78 : 0.9 / diffPace);
        }
        triggerBossVoice(rt, b.attackPattern);
      }
      break;

    case 'telegraph':
      b.pulseSize = 1 + Math.sin(b.animationTimer * 10) * 0.2;
      if (b.stateTimer <= 0) {
        b.state = 'attacking';
        b.stateTimer = rt.difficulty === 'hard' ? (isP2 ? 3.1 : 3.4) : isP2 ? 2.8 : 3.2;
        b.attackTimer = 0;
      }
      break;

    case 'attacking': {
      b.attackTimer += dt;
      const isNightmare = rt.difficulty === 'hard';
      const { spd: diffSpd, pace: diffPace } = getDiffScale(rt);
      const nSpd = isNightmare ? 1.18 : diffSpd;

      if (b.attackPattern === 'void_rifts') {
        const iv = isNightmare ? 1.02 : 1.3 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          spawnVoidRiftLines(rt, isNightmare ? (isP2 ? 7 : 6) : isP2 ? 5 : 4, isNightmare ? 0.78 : 0.9 / diffPace);
        }
      } else if (b.attackPattern === 'abyss_blink') {
        const iv = isNightmare ? 0.86 : 1.25 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          rt.voidRifts.push({ x: cx, y: cy, size: 12, maxSize: 70, alpha: 0.9, rotation: 0, growthRate: 160 });
          b.x = 180 + Math.random() * (rt.arenaWidth - b.size - 360);
          b.y = 140 + Math.random() * (rt.arenaHeight - b.size - 280);
          const ncx = b.x + b.size / 2;
          const ncy = b.y + b.size / 2;
          const ringCount = isNightmare ? 16 : 12;
          for (let i = 0; i < ringCount; i++) {
            const ang = (i / ringCount) * Math.PI * 2;
            pushBossProj(rt, { uid: rt.nextUid++, x: ncx, y: ncy, dx: Math.cos(ang) * 5.2 * nSpd, dy: Math.sin(ang) * 5.2 * nSpd, size: 15, speed: 1, color: '#e879f9', damage: 18, shape: 'shard' });
          }
          if (isNightmare) {
            const tp = getRandomAlivePlayer(rt);
            const aim = Math.atan2(tp.y + tp.size / 2 - ncy, tp.x + tp.size / 2 - ncx);
            for (const off of [-0.22, 0, 0.22]) {
              pushBossProj(rt, { uid: rt.nextUid++, x: ncx, y: ncy, dx: Math.cos(aim + off) * 8.2, dy: Math.sin(aim + off) * 8.2, size: 15, speed: 1, color: '#f43f5e', damage: 22, shape: 'lance' });
            }
          }
          soundEngine.playBossAttackExecuteSfx('abyss_blink');
        }
      } else if (b.attackPattern === 'gravity_ring') {
        const iv = isNightmare ? 0.92 : 1.15 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const tp = getRandomAlivePlayer(rt);
          const tx = tp.x + tp.size / 2;
          const ty = tp.y + tp.size / 2;
          const ringR = 330;
          const count = isNightmare ? (isP2 ? 22 : 18) : isP2 ? 18 : 14;
          const gapIdx = Math.floor(Math.random() * count);
          for (let i = 0; i < count; i++) {
            if (i === gapIdx || i === (gapIdx + 1) % count || (isNightmare && i === (gapIdx + 2) % count)) continue;
            const ang = (i / count) * Math.PI * 2;
            const sx = tx + Math.cos(ang) * ringR;
            const sy = ty + Math.sin(ang) * ringR;
            pushBossProj(rt, { uid: rt.nextUid++, x: sx, y: sy, dx: -Math.cos(ang) * 3.7 * nSpd, dy: -Math.sin(ang) * 3.7 * nSpd, size: 15, speed: 1, color: '#c084fc', damage: 22, shape: 'shard' });
          }
          // Nightmare adds an aligned inner ring with the exact same escape gap!
          if (isNightmare) {
            const innerR = 230;
            for (let i = 0; i < count; i++) {
              if (i === gapIdx || i === (gapIdx + 1) % count || i === (gapIdx + 2) % count) continue;
              const ang = (i / count) * Math.PI * 2;
              const sx = tx + Math.cos(ang) * innerR;
              const sy = ty + Math.sin(ang) * innerR;
              pushBossProj(rt, { uid: rt.nextUid++, x: sx, y: sy, dx: -Math.cos(ang) * 3.1, dy: -Math.sin(ang) * 3.1, size: 14, speed: 1, color: '#f43f5e', damage: 18, shape: 'shard' });
            }
          }
          soundEngine.playBossAttackExecuteSfx('gravity_ring');
        }
      } else if (b.attackPattern === 'spectral_cross') {
        const iv = isNightmare ? 0.14 : 0.18 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const arms = isNightmare ? 6 : 4;
          const base = b.attackTimer * (isNightmare ? 2.6 : 2.2);
          for (let i = 0; i < arms; i++) {
            const ang = base + (i * Math.PI * 2) / arms;
            pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(ang) * 5.6 * nSpd, dy: Math.sin(ang) * 5.6 * nSpd, size: 15, speed: 1, color: i % 2 === 0 ? '#a855f7' : '#f43f5e', damage: 15, shape: 'shard' });
          }
          if (isNightmare && Math.floor(b.attackTimer / 0.72) > Math.floor((b.attackTimer - dt) / 0.72)) {
            for (let r = 0; r < 12; r++) {
              const ang = (r / 12) * Math.PI * 2;
              pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(ang) * 4.5, dy: Math.sin(ang) * 4.5, size: 14, speed: 1, color: '#e879f9', damage: 16, shape: 'orb' });
            }
          }
          if (Math.random() < 0.35) soundEngine.playBossAttackExecuteSfx('spectral_cross');
        }
      } else if (b.attackPattern === 'boomerang') {
        const iv = isNightmare ? 0.42 : 0.5 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const nd = isNightmare ? (isP2 ? 16 : 13) : isP2 ? 12 : 9;
          const phaseOffset = (Math.floor(b.attackTimer / iv) % 2) * (Math.PI / nd);
          for (let i = 0; i < nd; i++) {
            const ang = phaseOffset + (i / nd) * Math.PI * 2;
            const spd = (isP2 ? 7.2 : 6.2) * nSpd;
            pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(ang) * spd, dy: Math.sin(ang) * spd, size: 19, speed: 1, color: '#22d3ee', type: 'boomerang', damage: 24, age: 0, turnTime: isNightmare ? 0.62 : 0.72 });
          }
          soundEngine.playBossAttackExecuteSfx('boomerang');
        }
      } else if (b.attackPattern === 'wall' && b.wallDirection) {
        const iv = isNightmare ? 0.62 : 0.85 / diffPace;
        if (b.attackTimer > 0.2 && Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const waveNum = Math.floor(b.attackTimer / iv);
          const np = isNightmare ? (isP2 ? 26 : 22) : isP2 ? 22 : 18;
          soundEngine.playBossAttackExecuteSfx('wall');
          const gapShift = isNightmare ? (waveNum % 2) * 3 : 0;
          const g1 = 4 + gapShift;
          const g2 = np - 5 - gapShift;
          if (b.wallDirection.isHorizontal) {
            for (let i = 0; i < np; i++) {
              if (i === g1 || i === g1 + 1 || i === g2 || i === g2 - 1) continue;
              pushBossProj(rt, { uid: rt.nextUid++, x: b.wallDirection.startX!, y: (i / np) * rt.arenaHeight, dx: b.wallDirection.dirX! * (isP2 ? 5.2 : 4.2) * nSpd, dy: 0, size: 19, speed: 1, color: '#c084fc', damage: 26, shape: 'shard' });
            }
          } else {
            for (let i = 0; i < np; i++) {
              if (i === g1 || i === g1 + 1 || i === g2 || i === g2 - 1) continue;
              pushBossProj(rt, { uid: rt.nextUid++, x: (i / np) * rt.arenaWidth, y: b.wallDirection.startY!, dx: 0, dy: b.wallDirection.dirY! * (isP2 ? 5.2 : 4.2) * nSpd, size: 19, speed: 1, color: '#c084fc', damage: 26, shape: 'shard' });
            }
          }
        }
      } else if (b.attackPattern === 'sniper') {
        const si = isNightmare ? 0.34 : 0.42 / diffPace;
        if (Math.floor(b.attackTimer / si) > Math.floor((b.attackTimer - dt) / si)) {
          const tp = getRandomAlivePlayer(rt);
          const aim = Math.atan2(tp.y + tp.size / 2 - cy, tp.x + tp.size / 2 - cx);
          const offsets = isNightmare ? [-0.16, 0, 0.16] : [0];
          const spd = isNightmare ? 12.6 : 11.2 * diffSpd;
          offsets.forEach((off) => {
            pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(aim + off) * spd, dy: Math.sin(aim + off) * spd, size: 19, speed: 1, color: '#f43f5e', damage: 30, shape: 'lance' });
          });
          soundEngine.playBossAttackExecuteSfx('sniper');
        }
      } else if (b.attackPattern === 'clone') {
        if (b.attackTimer > 0.3 && b.attackTimer - dt <= 0.3) {
          const posList =
            isP2 || isNightmare
              ? [
                  { x: 160, y: 160 },
                  { x: rt.arenaWidth - 220, y: 160 },
                  { x: 160, y: rt.arenaHeight - 220 },
                  { x: rt.arenaWidth - 220, y: rt.arenaHeight - 220 },
                  ...(isNightmare ? [{ x: rt.arenaWidth / 2 - 27, y: 120 }] : []),
                ]
              : [
                  { x: 220, y: 200 },
                  { x: rt.arenaWidth - 280, y: 200 },
                  { x: rt.arenaWidth / 2 - 30, y: rt.arenaHeight - 220 },
                ];
          posList.forEach((pos) => {
            pushBossProj(rt, { uid: rt.nextUid++, x: pos.x, y: pos.y, dx: 0, dy: 0, size: 54, speed: 1, color: '#a855f7', type: 'phantom_clone', damage: 18, lifetime: isNightmare ? 3.1 : 2.7, shootTimer: 0.35, shootInterval: isNightmare ? 0.42 : (isP2 ? 0.5 : 0.65) / diffPace, canDamage: false, spawnInvulnerability: 0.55 });
          });
          soundEngine.playBossAttackExecuteSfx('clone');
        }
      } else if (b.attackPattern === 'tentacle_slash') {
        const iv = isNightmare ? 0.68 : 0.85 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          strikeTentacles(rt, isNightmare ? 6 : isP2 ? 5 : 3);
          const sc = isNightmare ? 16 : 12;
          for (let i = 0; i < sc; i++) {
            const ang = (i / sc) * Math.PI * 2 + b.attackTimer;
            pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(ang) * 4.6 * nSpd, dy: Math.sin(ang) * 4.6 * nSpd, size: 15, speed: 1, color: '#c084fc', damage: 18, shape: 'shard' });
          }
          soundEngine.playBossAttackExecuteSfx('tentacle_slash');
        }
      } else if (b.attackPattern === 'void_drain') {
        rt.players.forEach((p) => {
          if (p.state === 'alive' && !p.dashImmune) {
            const pdx = cx - (p.x + p.size / 2);
            const pdy = cy - (p.y + p.size / 2);
            const pd = Math.hypot(pdx, pdy) || 1;
            const pull = (isP2 ? 105 : 80) * (isNightmare ? 1.25 : diffSpd);
            p.x += (pdx / pd) * pull * dt;
            p.y += (pdy / pd) * pull * dt;
          }
        });
        const iv = isNightmare ? 0.16 : 0.22 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const ang = (b.attackTimer * 4.8) % (Math.PI * 2);
          const od = 125 + Math.sin(b.attackTimer * 3) * 24;
          pushBossProj(rt, { uid: rt.nextUid++, x: cx + Math.cos(ang) * od, y: cy + Math.sin(ang) * od, dx: Math.cos(ang + Math.PI / 2) * 4.8 * nSpd, dy: Math.sin(ang + Math.PI / 2) * 4.8 * nSpd, size: 15, speed: 1, color: '#a855f7', damage: 16, shape: 'shard' });
          if (isNightmare) {
            pushBossProj(rt, { uid: rt.nextUid++, x: cx - Math.cos(ang) * od, y: cy - Math.sin(ang) * od, dx: Math.cos(ang - Math.PI / 2) * 4.8 * nSpd, dy: Math.sin(ang - Math.PI / 2) * 4.8 * nSpd, size: 15, speed: 1, color: '#f43f5e', damage: 16, shape: 'shard' });
          }
        }
      } else if (b.attackPattern === 'tentacle_slam') {
        if (b.attackTimer - dt <= 0) {
          strikeTentacles(rt, rt.voidTentacles.length);
          soundEngine.playBossAttackExecuteSfx('tentacle_slam');
          rt.screenShake = Math.max(rt.screenShake, 12);
        }
        const iv = isNightmare ? 0.52 : 0.65 / diffPace;
        if (b.attackTimer > 0.65 && Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const sc = isNightmare ? 20 : 16;
          for (let i = 0; i < sc; i++) {
            const ang = (i / sc) * Math.PI * 2 + (isNightmare ? b.attackTimer * 0.4 : 0);
            pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(ang) * 5.8 * nSpd, dy: Math.sin(ang) * 5.8 * nSpd, size: 15, speed: 1, color: '#f43f5e', damage: 22, shape: 'shard' });
          }
          soundEngine.playBossAttackExecuteSfx('tentacle_slam');
        }
      } else if (b.attackPattern === 'void_vortex') {
        if (b.attackTimer - dt <= 0) strikeTentacles(rt, isNightmare ? 5 : 3);
        const iv = isNightmare ? 0.13 : 0.16 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const spiralAng = b.attackTimer * (isNightmare ? 7.8 : 7.2);
          const arms = isNightmare ? 3 : 2;
          for (let a = 0; a < arms; a++) {
            const ang = spiralAng + (a / arms) * Math.PI * 2;
            pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(ang) * 6.5 * nSpd, dy: Math.sin(ang) * 6.5 * nSpd, size: 15, speed: 1, color: a % 2 === 0 ? '#f43f5e' : '#a855f7', damage: 18, shape: 'shard' });
          }
        }
      }

      if (b.stateTimer <= 0) {
        completeBossAttackCycle(rt, isP2);
      }
      break;
    }

    case 'weakened':
      b.pulseSize = 0.82 + Math.sin(b.animationTimer * 6) * 0.14;
      emitBossWeakenedSparks(rt);
      if (b.stateTimer <= 0 || b.weakenedHits >= b.maxWeakenedHits) {
        b.state = 'idle';
        b.stateTimer = 1.9;
        b.attackLabel = '';
      }
      break;
  }
}

function spawnOniShrines(rt: GameRuntime) {
  rt.oniShrines = [];
  const positions =
    rt.numPlayers >= 2
      ? [{ x: 180, y: 180 }, { x: rt.arenaWidth - 220, y: 180 }]
      : [{ x: 180, y: 180 }, { x: rt.arenaWidth - 220, y: rt.arenaHeight - 220 }];
  const hp = rt.boss.phase === 2 ? 3 : 2;
  positions.forEach((pos, idx) => {
    rt.oniShrines.push({ x: pos.x + 20, y: pos.y + 20, size: 36, active: true, health: hp, maxHealth: hp, index: idx });
  });
}

function spawnKatanaCuts(rt: GameRuntime, count: number, telegraphDur = 0.88) {
  const targets = rt.players.filter((p) => p.state === 'alive');
  for (let i = 0; i < count; i++) {
    const tp = targets[i % Math.max(1, targets.length)] || rt.players[0];
    const px = tp.x + tp.size / 2;
    const py = tp.y + tp.size / 2;
    const ang = (i * Math.PI) / count + Math.random() * 0.5;
    rt.telegraphLines.push({
      x1: px - Math.cos(ang) * 950,
      y1: py - Math.sin(ang) * 950,
      x2: px + Math.cos(ang) * 950,
      y2: py + Math.sin(ang) * 950,
      timer: telegraphDur,
      maxTimer: telegraphDur,
      width: 13,
      color: '#f97316',
      kind: 'katana',
      triggered: false,
    });
  }
}

function updateOniBoss(rt: GameRuntime, dt: number) {
  const b = rt.boss;
  if (b.health <= 0) return;
  const isP2 = b.phase === 2;
  b.animationTimer += dt;
  b.stateTimer -= dt;
  b.pulseSize = 1 + Math.sin(b.animationTimer * 3) * 0.08;
  b.rotationAngle += dt * (isP2 ? 2.2 : 1.1);
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;

  rt.players.forEach((p) => {
    if (p.sealed) {
      p.sealTimer -= dt;
      if (b.channelKind === 'demon_seal_purge') {
        if (p.sealTimer < 0.1) p.sealTimer = 0.1;
      } else if (p.sealTimer <= 0) {
        p.sealed = false;
        p.sealTimer = 0;
      }
    }
  });

  for (let si = rt.oniSpiritBombs.length - 1; si >= 0; si--) {
    const bomb = rt.oniSpiritBombs[si];
    bomb.lifetime -= dt;
    if (bomb.lifetime <= 0) {
      rt.oniSpiritBombs.splice(si, 1);
      continue;
    }
    const tp = getRandomAlivePlayer(rt);
    const bdx = tp.x + tp.size / 2 - bomb.x;
    const bdy = tp.y + tp.size / 2 - bomb.y;
    const bd = Math.hypot(bdx, bdy) || 1;
    bomb.vx += (bdx / bd) * bomb.homingStr * dt * 0.055;
    bomb.vy += (bdy / bd) * bomb.homingStr * dt * 0.055;
    const bspd = Math.hypot(bomb.vx, bomb.vy);
    if (bspd > bomb.maxSpeed) {
      bomb.vx = (bomb.vx / bspd) * bomb.maxSpeed;
      bomb.vy = (bomb.vy / bspd) * bomb.maxSpeed;
    }
    bomb.x += bomb.vx * (dt * 60);
    bomb.y += bomb.vy * (dt * 60);
    if (bomb.x < bomb.radius) bomb.vx = Math.abs(bomb.vx);
    if (bomb.x > rt.arenaWidth - bomb.radius) bomb.vx = -Math.abs(bomb.vx);
    if (bomb.y < bomb.radius) bomb.vy = Math.abs(bomb.vy);
    if (bomb.y > rt.arenaHeight - bomb.radius) bomb.vy = -Math.abs(bomb.vy);

    let hit = false;
    for (const t of rt.players) {
      if (doesFrontShieldInterceptPoint(t, bomb.x, bomb.y, bomb.radius)) {
        soundEngine.playParry();
        rt.score += 80;
        rt.energyWaves.push({ x: bomb.x, y: bomb.y, radius: 10, maxRadius: 72, alpha: 0.85, speed: 320, color: '#38bdf8' });
        addFloatingText(rt, bomb.x, bomb.y - 16, 'BOMB PURIFIED!', '#38bdf8', 1.1);
        hit = true;
        break;
      }
    }
    if (hit) {
      rt.oniSpiritBombs.splice(si, 1);
      continue;
    }

    rt.players.forEach((p) => {
      if (!hit && p.state === 'alive' && !p.dashImmune && p.invulnFrames <= 0 && p.postDashInvulnerability <= 0 && p.cloakTimer <= 0) {
        const dist = Math.hypot(p.x + p.size / 2 - bomb.x, p.y + p.size / 2 - bomb.y);
        if (dist < bomb.radius + p.size / 2) {
          damagePlayer(rt, p, 34);
          for (let pi = 0; pi < 8; pi++) {
            const ba = (pi / 8) * Math.PI * 2;
            pushBossProj(rt, { uid: rt.nextUid++, x: bomb.x, y: bomb.y, dx: Math.cos(ba) * 4, dy: Math.sin(ba) * 4, size: 14, speed: 1, color: '#f97316', damage: 18, shape: 'ember' });
          }
          hit = true;
        }
      }
    });
    if (hit) rt.oniSpiritBombs.splice(si, 1);
  }

  for (let zi = rt.oniCursedZones.length - 1; zi >= 0; zi--) {
    const zone = rt.oniCursedZones[zi];
    zone.lifetime -= dt;
    if (zone.lifetime <= 0) {
      rt.oniCursedZones.splice(zi, 1);
      continue;
    }
    zone.alpha = Math.min(1, zone.lifetime / 1.5) * 0.65;
    if (zone.radius < zone.maxRadius) zone.radius += zone.growthRate * dt;
    zone.damageTimer += dt;
    if (zone.damageTimer > 0.9) {
      zone.damageTimer = 0;
      rt.players.forEach((p) => {
        if (p.state === 'alive' && !p.dashImmune && p.invulnFrames <= 0 && p.cloakTimer <= 0) {
          if (Math.hypot(p.x + p.size / 2 - zone.x, p.y + p.size / 2 - zone.y) < zone.radius) {
            damagePlayer(rt, p, 18);
          }
        }
      });
    }
  }

  rt.oniShrines.forEach((shrine) => {
    if (!shrine.active) return;
    rt.players.forEach((player) => {
      if (
        player.state === 'alive' &&
        player.hasKnife &&
        Math.abs(player.x + player.size / 2 - shrine.x) < shrine.size &&
        Math.abs(player.y + player.size / 2 - shrine.y) < shrine.size
      ) {
        const dmg = hasBoon(rt, 'berserker_blade') ? shrine.health : 1;
        shrine.health -= dmg;
        if (!rt.cheats.alwaysArmed) {
          player.hasKnife = false;
          repositionKnifeForPlayer(rt, player);
        }
        rt.screenShake = Math.max(rt.screenShake, 10);
        soundEngine.playBossDamaged();
        addSlashArc(rt, shrine.x, shrine.y, player.facingAngle, '#f97316', 48);
        if (shrine.health <= 0) {
          shrine.active = false;
          soundEngine.playParry();
          rt.score += Math.round(220 * rt.diffSettings.scoreMultiplier);
          addFloatingText(rt, shrine.x, shrine.y - 24, 'SHRINE SHATTERED!', '#fbbf24', 1.1);
        }
      }
    });
  });

  if (b.channelKind) {
    b.pulseSize = 1.08 + Math.sin(b.animationTimer * 12) * 0.1;
    b.attackLabel = '';
    return;
  }

  switch (b.state) {
    case 'comic_intro':
      if (b.entryPhase === 0) {
        soundEngine.playBossCinematicIntro('oni', 'Eight Gates of Slaughter open. Kneel before steel and ash!');
        b.entryPhase = 1;
      } else if (b.entryPhase === 1) {
        if (Math.random() < 0.78) {
          addParticle(rt, {
            x: cx + (Math.random() - 0.5) * 165,
            y: cy + 68,
            dx: (Math.random() - 0.5) * 90,
            dy: -200 - Math.random() * 170,
            alpha: 0.95,
            size: 4 + Math.random() * 3,
            color: Math.random() < 0.5 ? '#ef4444' : '#fbbf24',
          });
        }
        if (b.stateTimer <= 4.25) {
          b.entryPhase = 3;
          b.shakeIntensity = 30;
          rt.screenShake = Math.max(rt.screenShake, 26);
          rt.warningFlash = 0.42;
          soundEngine.playLanding();
          rt.comicSlashes.push({ x: cx - 360, y: cy - 200, angle: 0.62, length: 840, alpha: 0.97, thickness: 7, timer: 0, lifetime: 0.6 });
          rt.comicSlashes.push({ x: cx - 360, y: cy + 200, angle: -0.62, length: 840, alpha: 0.97, thickness: 7, timer: 0, lifetime: 0.6 });
          rt.energyWaves.push({ x: cx, y: cy, radius: 15, maxRadius: 640, alpha: 0.96, speed: 390, color: '#f97316' });
          rt.energyWaves.push({ x: cx, y: cy, radius: 15, maxRadius: 480, alpha: 0.9, speed: 310, color: '#ef4444' });
          for (let i = 0; i < 32; i++) {
            const a = (i / 32) * Math.PI * 2;
            const sp = 210 + Math.random() * 160;
            addParticle(rt, { x: cx, y: cy, dx: Math.cos(a) * sp, dy: Math.sin(a) * sp, alpha: 1, size: 4.5, color: i % 2 === 0 ? '#f97316' : '#fef08a' });
          }
        }
      } else {
        b.shakeIntensity = Math.max(0, b.shakeIntensity - dt * 28);
        if (Math.random() < 0.4) {
          const a = Math.random() * Math.PI * 2;
          addParticle(rt, { x: cx + Math.cos(a) * 65, y: cy + Math.sin(a) * 65, dx: Math.cos(a) * 140, dy: Math.sin(a) * 140, alpha: 0.85, size: 3.5, color: '#fb923c' });
        }
      }
      rt.bossNameReveal = b.stateTimer <= 3.1 && b.stateTimer > 0.3;
      if (b.stateTimer <= 0) {
        b.state = 'idle';
        b.stateTimer = 1.5;
        rt.bossNameReveal = false;
      }
      break;

    case 'phase_transition':
      b.pulseSize = 1.1 + Math.sin(b.animationTimer * 6) * 0.08;
      if (Math.random() < 0.65) {
        const a = Math.random() * Math.PI * 2;
        addParticle(rt, { x: cx, y: cy, dx: Math.cos(a) * 220, dy: Math.sin(a) * 220, alpha: 1, size: 4, color: '#fb923c' });
      }
      if (b.stateTimer <= 0) {
        b.state = 'idle';
        b.stateTimer = 1.6;
      }
      break;

    case 'idle':
      if (b.stateTimer <= 0) {
        const isNightmare = rt.difficulty === 'hard';
        const { pace: diffPace } = getDiffScale(rt);
        b.state = 'telegraph';
        b.stateTimer = isNightmare ? (isP2 ? 0.98 : 1.18) : (isP2 ? 1.12 : 1.38) / Math.min(1.25, diffPace);
        const p1 = ['iaijutsu_cut', 'thunder_step', 'shrine_shatter', 'katana_wave', 'oni_barrage', 'spirit_bomb', 'hellfire_pillars'];
        const p2 = ['iaijutsu_cut', 'thunder_step', 'shrine_shatter', 'katana_wave', 'eight_gate_lotus', 'oni_barrage', 'cursed_zone', 'hellfire_pillars', 'soul_seal_combo'];
        const pool = isP2 ? p2 : p1;
        b.attackPattern = pool[Math.floor(Math.random() * pool.length)];

        const labelMap: Record<string, string> = {
          iaijutsu_cut: isNightmare ? 'SHOGUN MULTI-SLASH' : 'IAIJUTSU CROSS-SLASH',
          thunder_step: isNightmare ? 'LIGHTNING BLITZ IAIDO' : 'DEMON STEP IAIDO',
          hellfire_pillars: isNightmare ? 'TWIN HELLFIRE ERUPTION' : 'HELLFIRE ERUPTION',
          eight_gate_lotus: isNightmare ? 'TWELVE-PETAL LOTUS' : 'EIGHT-GATE LOTUS',
          shrine_shatter: 'TORII SEAL RITUAL',
          katana_wave: isNightmare ? 'WHIRLWIND BLADE STORM' : 'FOUR-QUADRANT BLADE FAN',
          oni_barrage: isNightmare ? 'SERPENT WEAVE BARRAGE' : 'EIGHT-SERPENT SPIRAL',
          spirit_bomb: 'HOMING ONI ORBS',
          cursed_zone: 'CRIMSON BLOOD SIGILS',
          soul_seal_combo: 'SOUL BINDING CURSE',
        };
        b.attackLabel = labelMap[b.attackPattern] || '';
        if (b.attackPattern === 'iaijutsu_cut') {
          spawnKatanaCuts(rt, isNightmare ? (isP2 ? 6 : 5) : isP2 ? 4 : 3, isNightmare ? 0.74 : 0.88 / diffPace);
        }
        triggerBossVoice(rt, b.attackPattern);
      }
      break;

    case 'telegraph':
      b.pulseSize = 1 + Math.sin(b.animationTimer * 10) * 0.25;
      if (b.stateTimer <= 0) {
        b.state = 'attacking';
        b.stateTimer = b.attackPattern === 'shrine_shatter' ? (rt.difficulty === 'hard' ? 5.6 : 6.0) : rt.difficulty === 'hard' ? (isP2 ? 3.0 : 3.3) : isP2 ? 2.7 : 3.1;
        b.attackTimer = 0;
        if (b.attackPattern === 'shrine_shatter') {
          spawnOniShrines(rt);
          showPhaseAnnounce(rt, 'SHATTER BOTH TORII SHRINES!', '#f97316', 2.2);
        } else if (b.attackPattern === 'soul_seal_combo') {
          showPhaseAnnounce(
            rt,
            rt.numPlayers === 2 ? 'SOUL SEALED — TOUCH YOUR PARTNER!' : 'SOUL SEALED — MASH DASH!',
            '#f43f5e',
            2.2
          );
        }
      }
      break;

    case 'attacking': {
      b.attackTimer += dt;
      const isNightmare = rt.difficulty === 'hard';
      const { spd: diffSpd, pace: diffPace } = getDiffScale(rt);
      const spd = (isP2 ? 1.3 : 1.05) * (isNightmare ? 1.15 : diffSpd);

      if (b.attackPattern === 'iaijutsu_cut') {
        const iv = isNightmare ? 0.98 : 1.3 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          spawnKatanaCuts(rt, isNightmare ? (isP2 ? 6 : 5) : isP2 ? 4 : 3, isNightmare ? 0.74 : 0.88 / diffPace);
        }
      } else if (b.attackPattern === 'thunder_step') {
        const iv = isNightmare ? 0.68 : 1.05 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const oldX = cx;
          const oldY = cy;
          b.x = 200 + Math.random() * (rt.arenaWidth - b.size - 400);
          b.y = 180 + Math.random() * (rt.arenaHeight - b.size - 360);
          const newX = b.x + b.size / 2;
          const newY = b.y + b.size / 2;
          rt.telegraphLines.push({
            x1: oldX,
            y1: oldY,
            x2: newX,
            y2: newY,
            timer: isNightmare ? 0.64 : 0.72,
            maxTimer: isNightmare ? 0.64 : 0.72,
            width: 16,
            color: '#ef4444',
            kind: 'katana',
            triggered: false,
          });
          if (isNightmare) {
            for (let i = 0; i < 10; i++) {
              const ang = (i / 10) * Math.PI * 2;
              pushBossProj(rt, { uid: rt.nextUid++, x: newX, y: newY, dx: Math.cos(ang) * 4.8, dy: Math.sin(ang) * 4.8, size: 14, speed: 1, color: '#fbbf24', damage: 18, shape: 'ember' });
            }
          }
          soundEngine.playBossAttackExecuteSfx('thunder_step');
        }
      } else if (b.attackPattern === 'hellfire_pillars') {
        const iv = isNightmare ? 0.72 : 0.95 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const count = isNightmare ? 2 : 1;
          for (let c = 0; c < count; c++) {
            const tp = getRandomAlivePlayer(rt);
            const px = Math.max(90, Math.min(rt.arenaWidth - 90, tp.x + tp.size / 2 + (Math.random() - 0.5) * (c === 0 ? 130 : 240)));
            const py = Math.max(90, Math.min(rt.arenaHeight - 90, tp.y + tp.size / 2 + (Math.random() - 0.5) * (c === 0 ? 130 : 240)));
            rt.oniCursedZones.push({
              x: px,
              y: py,
              radius: 24,
              maxRadius: isNightmare ? 115 : isP2 ? 105 : 85,
              growthRate: isNightmare ? 56 : 45,
              alpha: 0.85,
              lifetime: 4.5,
              color: 'rgba(239,68,68,0.85)',
              damageTimer: 0,
            });
            const burst = isNightmare ? 12 : 8;
            for (let i = 0; i < burst; i++) {
              const ang = (i / burst) * Math.PI * 2;
              pushBossProj(rt, { uid: rt.nextUid++, x: px, y: py, dx: Math.cos(ang) * (isNightmare ? 5.1 : 4.4 * diffSpd), dy: Math.sin(ang) * (isNightmare ? 5.1 : 4.4 * diffSpd), size: 15, speed: 1, color: '#f97316', damage: 22, shape: 'ember' });
            }
          }
          soundEngine.playBossAttackExecuteSfx('hellfire_pillars');
        }
      } else if (b.attackPattern === 'eight_gate_lotus') {
        const iv = isNightmare ? 0.18 : 0.24 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const step = Math.floor(b.attackTimer / iv);
          const petals = isNightmare ? 12 : 8;
          const base = step * 0.28 * (step % 2 === 0 ? 1 : -1);
          for (let i = 0; i < petals; i++) {
            const ang = base + (i / petals) * Math.PI * 2;
            pushBossProj(rt, {
              uid: rt.nextUid++,
              x: cx,
              y: cy,
              dx: Math.cos(ang) * 5.6 * spd,
              dy: Math.sin(ang) * 5.6 * spd,
              size: 15,
              speed: 1,
              color: step % 2 === 0 ? '#fbbf24' : '#f43f5e',
              damage: 16,
              shape: 'ember',
            });
          }
          if (step % 2 === 0) soundEngine.playBossAttackExecuteSfx('eight_gate_lotus');
        }
      } else if (b.attackPattern === 'shrine_shatter') {
        if (rt.oniShrines.every((s) => !s.active)) {
          triggerBossExposedWindow(rt, 'SANCTUM BROKEN — 2X DAMAGE!');
          return;
        }
        const iv = isNightmare ? 1.3 : 1.8 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const tp = getRandomAlivePlayer(rt);
          const aim = Math.atan2(tp.y + tp.size / 2 - cy, tp.x + tp.size / 2 - cx);
          const offsets = isNightmare ? [-0.32, 0.32] : [0];
          offsets.forEach((off) => {
            pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(aim + off) * 3.8 * diffSpd, dy: Math.sin(aim + off) * 3.8 * diffSpd, size: 18, speed: 1, color: '#f97316', type: 'homing', homingStr: isNightmare ? 0.08 : 0.055, damage: 24, shape: 'missile' });
          });
          if (isNightmare) {
            for (let i = 0; i < 10; i++) {
              const ang = (i / 10) * Math.PI * 2;
              pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(ang) * 4.4, dy: Math.sin(ang) * 4.4, size: 14, speed: 1, color: '#fbbf24', damage: 16, shape: 'ember' });
            }
          }
          soundEngine.playBossAttackExecuteSfx('shrine_shatter');
        }
        if (b.stateTimer <= 0) {
          rt.oniShrines = [];
          b.state = 'idle';
          b.stateTimer = 1.0;
          b.attackLabel = '';
        }
      } else if (b.attackPattern === 'spirit_bomb') {
        const iv = isNightmare ? 1.02 : 1.3 / diffPace;
        if (b.attackTimer > 0.25 && Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const nb = isNightmare ? (isP2 ? 4 : 3) : isP2 ? 3 : 2;
          for (let i = 0; i < nb; i++) {
            const angle = Math.random() * Math.PI * 2;
            rt.oniSpiritBombs.push({ x: cx + Math.cos(angle) * 55, y: cy + Math.sin(angle) * 55, vx: Math.cos(angle) * 1.6, vy: Math.sin(angle) * 1.6, radius: 26, maxSpeed: (isNightmare ? 4.0 : isP2 ? 3.5 : 2.7) * diffSpd, homingStr: isNightmare ? 118 : isP2 ? 98 : 74, lifetime: 5.5 });
          }
          soundEngine.playBossAttackExecuteSfx('spirit_bomb');
        }
      } else if (b.attackPattern === 'cursed_zone') {
        const iv = isNightmare ? 0.68 : 0.85 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const np = isNightmare ? 5 : isP2 ? 4 : 3;
          for (let i = 0; i < np; i++) {
            rt.oniCursedZones.push({ x: 140 + Math.random() * (rt.arenaWidth - 280), y: 140 + Math.random() * (rt.arenaHeight - 280), radius: 22, maxRadius: isNightmare ? 108 : isP2 ? 98 : 78, growthRate: 38, alpha: 0.7, lifetime: 5.5, color: isP2 ? 'rgba(244,63,94,0.8)' : 'rgba(234,88,12,0.8)', damageTimer: 0 });
          }
          if (isNightmare) {
            for (let i = 0; i < 8; i++) {
              const ang = (i / 8) * Math.PI * 2 + b.attackTimer;
              pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(ang) * 4.9, dy: Math.sin(ang) * 4.9, size: 15, speed: 1, color: '#ef4444', damage: 18, shape: 'ember' });
            }
          }
          soundEngine.playBossAttackExecuteSfx('cursed_zone');
        }
      } else if (b.attackPattern === 'katana_wave') {
        const iv = isNightmare ? 0.52 : 0.7 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const waveNum = Math.floor(b.attackTimer / iv);
          const waveAngles = [waveNum * 0.45, waveNum * 0.45 + Math.PI / 2, waveNum * 0.45 + Math.PI, waveNum * 0.45 + (Math.PI * 3) / 2];
          const safeIdx = waveNum % 4;
          const np = isNightmare ? 12 : isP2 ? 10 : 8;
          waveAngles.forEach((baseAng, idx) => {
            if (idx === safeIdx) return;
            for (let i = 0; i < np; i++) {
              const spread = (i - np / 2) * (isNightmare ? 0.075 : 0.085);
              pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(baseAng + spread) * 6.4 * spd, dy: Math.sin(baseAng + spread) * 6.4 * spd, size: 16, speed: 1, color: isP2 ? '#f43f5e' : '#f97316', damage: 20, shape: 'lance' });
            }
          });
          soundEngine.playBossAttackExecuteSfx('katana_wave');
        }
      } else if (b.attackPattern === 'oni_barrage') {
        const iv = isNightmare ? 0.36 : 0.5 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const isFast = Math.floor(b.attackTimer / iv) % 2 === 0;
          const count = isNightmare ? 14 : 10;
          for (let i = 0; i < count; i++) {
            const ang = (i / count) * Math.PI * 2 + b.attackTimer * 0.55;
            pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(ang) * (isFast ? 7.5 * spd : 3.0 * spd), dy: Math.sin(ang) * (isFast ? 7.5 * spd : 3.0 * spd), size: isFast ? 14 : 18, speed: 1, color: isFast ? '#fbbf24' : '#ef4444', damage: isFast ? 16 : 24, shape: isFast ? 'lance' : 'ember' });
          }
          soundEngine.playBossAttackExecuteSfx('oni_barrage');
        }
      } else if (b.attackPattern === 'soul_seal_combo') {
        if (b.attackTimer - dt <= 0) {
          soundEngine.playBossAttackExecuteSfx('soul_seal_combo');
          rt.players.forEach((p) => {
            if (p.state === 'alive') {
              p.sealed = true;
              p.sealTimer = rt.numPlayers === 1 ? 1.7 : 2.5;
            }
          });
        }
        if (isNightmare && Math.floor(b.attackTimer / 0.8) > Math.floor((b.attackTimer - dt) / 0.8)) {
          for (let i = 0; i < 10; i++) {
            const ang = (i / 10) * Math.PI * 2 + b.attackTimer;
            pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(ang) * 4.4, dy: Math.sin(ang) * 4.4, size: 15, speed: 1, color: '#f97316', damage: 16, shape: 'ember' });
          }
        }
      }

      if (b.stateTimer <= 0 && b.attackPattern !== 'shrine_shatter') {
        completeBossAttackCycle(rt, isP2);
      }
      break;
    }

    case 'weakened':
      b.pulseSize = 0.82 + Math.sin(b.animationTimer * 6) * 0.14;
      emitBossWeakenedSparks(rt);
      if (b.stateTimer <= 0 || b.weakenedHits >= b.maxWeakenedHits) {
        b.state = 'idle';
        b.stateTimer = 1.9;
        b.attackLabel = '';
        rt.oniShrines = [];
      }
      break;
  }
}

function grantCoopResonance(rt: GameRuntime, announceText: string, color: string) {
  const cx = rt.boss.x + rt.boss.size / 2;
  const cy = rt.boss.y + rt.boss.size / 2;
  soundEngine.playCoopResonance();
  rt.bossProjectiles = [];
  rt.score += Math.round(480 * rt.diffSettings.scoreMultiplier);
  rt.stylePoints = Math.min(100, rt.stylePoints + 16);
  rt.eclipseCounterFlashTimer = 0.65;
  rt.players.forEach((p) => {
    if (p.state === 'alive') {
      p.hp = Math.min(p.maxHp, p.hp + 10);
      p.overdriveTimer = Math.max(p.overdriveTimer, 2.2);
      addFloatingText(rt, p.x + p.size / 2, p.y - 16, '+10 HP · RESONANCE', '#34d399', 1.0);
    }
  });
  addFloatingText(rt, cx, cy - 66, announceText, color, 1.25);
}

function triggerCoopPunishment(rt: GameRuntime, reasonBanner: string, punishPlayers: Player[], backlashDmg: number) {
  const b = rt.boss;
  const isNightmare = rt.difficulty === 'hard';
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;

  rt.eclipseBeacons = [];
  rt.eclipsePylons = [];
  rt.eclipsePrison = null;
  rt.eclipseMirrors = [];
  rt.eclipseSyncTimer = 0;
  rt.eclipseTetherTimer = 0;
  rt.eclipseSanctuaryActive = false;

  // Punish failed teamwork: reset boss exposure progress, empower boss slightly, and trigger backlash
  b.attacksBeforeVulnerable = 0;
  b.posture = 0;
  b.postureUnlocked = false;
  b.postureDecayGrace = 0;
  b.health = Math.min(b.maxHealth, b.health + (isNightmare ? 6 : 4));
  rt.warningFlash = 0.55;
  rt.screenShake = Math.max(rt.screenShake, 22);
  soundEngine.playBossAttackExecuteSfx('coop_punishment');
  triggerBossVoice(rt, 'coop_punishment');
  showPhaseAnnounce(rt, reasonBanner, '#ef4444', 2.8);
  addFloatingText(rt, cx, cy - 68, 'TEAMWORK FAILED — JUDGMENT!', '#ef4444', 1.35);

  rt.energyWaves.push({ x: cx, y: cy, radius: 18, maxRadius: 960, alpha: 0.95, speed: 680, color: '#ef4444' });
  rt.energyWaves.push({ x: cx, y: cy, radius: 12, maxRadius: 820, alpha: 0.9, speed: 560, color: '#fbbf24' });

  punishPlayers.forEach((p) => {
    if (p.state === 'alive') {
      p.invulnFrames = 0;
      p.dashImmune = false;
      p.postDashInvulnerability = 0;
      damagePlayer(rt, p, backlashDmg);
    }
  });

  // Launch immediate Dual Polarity Shock Ring + converging Celestial Guillotine slashes at both players
  const burstCount = isNightmare ? 22 : 16;
  for (let i = 0; i < burstCount; i++) {
    const ang = (i / burstCount) * Math.PI * 2;
    pushBossProj(rt, {
      uid: rt.nextUid++,
      x: cx,
      y: cy,
      dx: Math.cos(ang) * (isNightmare ? 6.2 : 5.2),
      dy: Math.sin(ang) * (isNightmare ? 6.2 : 5.2),
      size: 16,
      speed: 1,
      color: i % 2 === 0 ? '#ef4444' : '#fbbf24',
      damage: 22,
      shape: 'ember',
    });
  }

  const cutsPerPlayer = isNightmare ? 3 : 2;
  rt.players.forEach((tp) => {
    if (tp.state !== 'alive') return;
    const px = tp.x + tp.size / 2;
    const py = tp.y + tp.size / 2;
    for (let c = 0; c < cutsPerPlayer; c++) {
      const ang = (c / cutsPerPlayer) * Math.PI + (Math.random() - 0.5) * 0.35;
      rt.telegraphLines.push({
        x1: px - Math.cos(ang) * 760,
        y1: py - Math.sin(ang) * 760,
        x2: px + Math.cos(ang) * 760,
        y2: py + Math.sin(ang) * 760,
        timer: isNightmare ? 0.82 : 0.94,
        maxTimer: isNightmare ? 0.82 : 0.94,
        width: 15,
        color: '#ef4444',
        kind: 'katana',
        triggered: false,
      });
    }
  });

  b.attackPattern = 'coop_punishment';
  b.attackLabel = 'JUDGMENT: BROKEN BOND!';
  b.state = 'attacking';
  b.stateTimer = isNightmare ? 4.4 : 3.6;
  b.attackTimer = 0;
}

function updateEclipseBoss(rt: GameRuntime, dt: number) {
  const b = rt.boss;
  if (b.health <= 0) return;
  const isP2 = b.phase === 2;
  b.animationTimer += dt;
  b.stateTimer -= dt;
  b.pulseSize = 1 + Math.sin(b.animationTimer * 2.6) * 0.06;
  b.rotationAngle += dt * (isP2 ? 1.85 : 1.05);
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;

  if (rt.eclipseCounterFlashTimer > 0) {
    rt.eclipseCounterFlashTimer = Math.max(0, rt.eclipseCounterFlashTimer - dt);
  }
  if (rt.eclipseMarkTimer > 0) {
    rt.eclipseMarkTimer -= dt;
    if (rt.eclipseMarkTimer <= 0) {
      rt.eclipseMarkedBy = null;
      rt.eclipseMarkTimer = 0;
    }
  }

  const aliveCoopPlayers = rt.players.filter((p) => p.state === 'alive');
  const bothAliveCoop = rt.numPlayers >= 2 && aliveCoopPlayers.length >= 2;

  // Update Starfall Meteor zones
  for (let zi = rt.oniCursedZones.length - 1; zi >= 0; zi--) {
    const zone = rt.oniCursedZones[zi];
    zone.lifetime -= dt;
    if (zone.lifetime <= 0) {
      rt.oniCursedZones.splice(zi, 1);
      continue;
    }
    zone.alpha = Math.min(1, zone.lifetime / 1.2) * 0.65;
    if (zone.radius < zone.maxRadius) zone.radius += zone.growthRate * dt;
    zone.damageTimer += dt;
    if (zone.damageTimer > 0.85) {
      zone.damageTimer = 0;
      rt.players.forEach((p) => {
        if (p.state === 'alive' && !p.dashImmune && p.invulnFrames <= 0 && p.cloakTimer <= 0) {
          if (Math.hypot(p.x + p.size / 2 - zone.x, p.y + p.size / 2 - zone.y) < zone.radius) {
            damagePlayer(rt, p, 18);
          }
        }
      });
    }
  }

  // Update Eclipse Pylons (2P Polarity-Attuned synchronized shattering; 1P single pylon)
  rt.eclipsePylons.forEach((pylon) => {
    if (!pylon.active) {
      if (bothAliveCoop && pylon.rekindleTimer > 0) {
        pylon.rekindleTimer -= dt;
        if (pylon.rekindleTimer <= 0 && rt.eclipsePylons.some((other) => other.active)) {
          pylon.active = true;
          pylon.hp = 1;
          soundEngine.playEnemySpawn();
          addFloatingText(rt, pylon.x, pylon.y - 28, 'REKINDLED!', pylon.role === 'solar' ? '#fbbf24' : '#38bdf8', 1.0);
        }
      }
      return;
    }
    rt.players.forEach((player) => {
      if (
        player.state === 'alive' &&
        player.hasKnife &&
        Math.hypot(player.x + player.size / 2 - pylon.x, player.y + player.size / 2 - pylon.y) <
          pylon.size + player.size * 0.55
      ) {
        const polarityMatch =
          bothAliveCoop &&
          ((pylon.role === 'solar' && player.id % 2 === 1) || (pylon.role === 'lunar' && player.id % 2 === 0));
        const dmg = hasBoon(rt, 'berserker_blade') || polarityMatch ? pylon.hp : 1;
        pylon.hp = Math.max(0, pylon.hp - dmg);
        if (!rt.cheats.alwaysArmed) {
          player.hasKnife = false;
          repositionKnifeForPlayer(rt, player);
        }
        rt.screenShake = Math.max(rt.screenShake, 10);
        soundEngine.playBossDamaged();
        addSlashArc(rt, pylon.x, pylon.y, player.facingAngle, pylon.role === 'lunar' ? '#38bdf8' : '#fbbf24', 52);
        if (pylon.hp <= 0) {
          pylon.active = false;
          pylon.rekindleTimer = bothAliveCoop ? 4.0 : 0;
          soundEngine.playParry();
          rt.score += Math.round(240 * rt.diffSettings.scoreMultiplier);
          addFloatingText(
            rt,
            pylon.x,
            pylon.y - 26,
            polarityMatch ? 'POLARITY SHATTER!' : 'PYLON SHATTERED!',
            '#fde047',
            1.05
          );
        } else {
          addFloatingText(rt, pylon.x, pylon.y - 24, 'WRONG POLARITY (-1)', '#cbd5e1', 0.9);
        }
      }
    });
  });

  // Check Party Sanctuary Proximity during eclipse_tether
  if (b.state === 'attacking' && b.attackPattern === 'eclipse_tether' && bothAliveCoop) {
    let linked = false;
    for (let i = 0; i < aliveCoopPlayers.length && !linked; i++) {
      for (let j = i + 1; j < aliveCoopPlayers.length; j++) {
        const a = aliveCoopPlayers[i];
        const c = aliveCoopPlayers[j];
        if (Math.hypot(a.x + a.size / 2 - (c.x + c.size / 2), a.y + a.size / 2 - (c.y + c.size / 2)) <= 215) {
          linked = true;
          break;
        }
      }
    }
    rt.eclipseSanctuaryActive = linked;
  } else {
    rt.eclipseSanctuaryActive = false;
  }

  if (b.channelKind) {
    b.pulseSize = 1.08 + Math.sin(b.animationTimer * 12) * 0.1;
    b.attackLabel = '';
    return;
  }

  switch (b.state) {
    case 'comic_intro':
      if (b.entryPhase === 0) {
        soundEngine.playBossCinematicIntro('eclipse', 'Sun and Moon as one. Witness the eclipse of all souls.');
        b.entryPhase = 1;
      } else if (b.entryPhase === 1) {
        if (Math.random() < 0.78) {
          const a = Math.random() * Math.PI * 2;
          const isSolar = Math.random() < 0.5;
          addParticle(rt, {
            x: cx + Math.cos(a) * 220,
            y: cy + Math.sin(a) * 220,
            dx: -Math.cos(a) * 195,
            dy: -Math.sin(a) * 195,
            alpha: 0.95,
            size: 4.5,
            color: isSolar ? '#fbbf24' : '#38bdf8',
          });
        }
        if (b.stateTimer <= 4.2) {
          b.entryPhase = 3;
          b.shakeIntensity = 26;
          rt.screenShake = Math.max(rt.screenShake, 26);
          rt.warningFlash = 0.44;
          soundEngine.playLanding();
          rt.energyWaves.push({ x: cx, y: cy, radius: 15, maxRadius: 680, alpha: 0.95, speed: 400, color: '#fbbf24' });
          rt.energyWaves.push({ x: cx, y: cy, radius: 15, maxRadius: 560, alpha: 0.92, speed: 340, color: '#38bdf8' });
          rt.energyWaves.push({ x: cx, y: cy, radius: 15, maxRadius: 400, alpha: 0.88, speed: 280, color: '#ffffff' });
          for (let i = 0; i < 32; i++) {
            const a = (i / 32) * Math.PI * 2;
            const sp = 210 + Math.random() * 160;
            addParticle(rt, { x: cx, y: cy, dx: Math.cos(a) * sp, dy: Math.sin(a) * sp, alpha: 1, size: 4.5, color: i % 2 === 0 ? '#fbbf24' : '#38bdf8' });
          }
        }
      } else {
        b.shakeIntensity = Math.max(0, b.shakeIntensity - dt * 26);
        if (Math.random() < 0.42) {
          const a = Math.random() * Math.PI * 2;
          addParticle(rt, { x: cx + Math.cos(a) * 76, y: cy + Math.sin(a) * 76, dx: Math.cos(a) * 135, dy: Math.sin(a) * 135, alpha: 0.85, size: 3.5, color: Math.random() < 0.5 ? '#fbbf24' : '#38bdf8' });
        }
      }
      rt.bossNameReveal = b.stateTimer <= 3.1 && b.stateTimer > 0.3;
      if (b.stateTimer <= 0) {
        b.state = 'idle';
        b.stateTimer = 1.5;
        rt.bossNameReveal = false;
      }
      break;

    case 'phase_transition':
      b.pulseSize = 1.08 + Math.sin(b.animationTimer * 6) * 0.06;
      if (Math.random() < 0.6) {
        const a = Math.random() * Math.PI * 2;
        addParticle(rt, {
          x: cx,
          y: cy,
          dx: Math.cos(a) * 210,
          dy: Math.sin(a) * 210,
          alpha: 0.95,
          size: 4,
          color: Math.random() < 0.5 ? '#fbbf24' : '#38bdf8',
        });
      }
      if (b.stateTimer <= 0) {
        b.state = 'idle';
        b.stateTimer = 1.6;
      }
      break;

    case 'idle':
      if (b.stateTimer <= 0) {
        const isNightmare = rt.difficulty === 'hard';
        const { pace: diffPace } = getDiffScale(rt);
        b.state = 'telegraph';
        b.stateTimer = isNightmare ? (isP2 ? 1.02 : 1.22) : (isP2 ? 1.15 : 1.4) / Math.min(1.25, diffPace);

        const coopPoolP1 = [
          'eclipse_prison',
          'eclipse_prism_beam',
          'eclipse_tether',
          'twin_pylons',
          'eclipse_nova',
          'celestial_guillotine',
          'starfall_meteors',
        ];
        const coopPoolP2 = [
          'eclipse_prism_beam',
          'eclipse_prison',
          'eclipse_tether',
          'twin_pylons',
          'eclipse_convergence',
          'celestial_guillotine',
          'starfall_meteors',
        ];
        const soloPoolP1 = ['solar_lunar_nova', 'celestial_guillotine', 'eclipse_cross_sweep', 'twin_pylons', 'starfall_meteors', 'eclipse_nova'];
        const soloPoolP2 = ['eclipse_convergence', 'solar_lunar_nova', 'celestial_guillotine', 'eclipse_cross_sweep', 'twin_pylons', 'starfall_meteors', 'eclipse_nova'];

        const pool = bothAliveCoop ? (isP2 ? coopPoolP2 : coopPoolP1) : isP2 ? soloPoolP2 : soloPoolP1;
        let nextPattern = pool[Math.floor(Math.random() * pool.length)];
        if (pool.length > 1 && nextPattern === b.attackPattern) {
          nextPattern = pool[(pool.indexOf(nextPattern) + 1) % pool.length];
        }
        b.attackPattern = nextPattern;

        const labelMap: Record<string, string> = {
          eclipse_tether: 'CO-OP: SOUL-LINK SANCTUARY',
          twin_pylons: bothAliveCoop ? 'CO-OP: POLARITY ECLIPSE PYLONS' : 'ECLIPSE PYLON RITUAL',
          eclipse_prison: 'CO-OP: ASTRAL STASIS RESCUE',
          eclipse_prism_beam: 'CO-OP: MIRROR COUNTER-BEAM',
          celestial_guillotine: isNightmare ? 'CATACLYSM GUILLOTINE' : 'CELESTIAL GUILLOTINE',
          starfall_meteors: isNightmare ? 'APOCALYPSE STARFALL' : 'STARFALL METEORS',
          eclipse_nova: isNightmare ? 'DUAL ECLIPSE TEMPEST' : 'SOLAR & LUNAR NOVA',
          eclipse_convergence: isNightmare ? 'QUAD-ARM CONVERGENCE' : 'ASTRAL CONVERGENCE',
          solar_lunar_nova: isNightmare ? 'SUPER-ECLIPSE TIDE' : 'SOLAR-LUNAR CRESCENT TIDE',
          eclipse_cross_sweep: isNightmare ? 'TWILIGHT BLADE DELUGE' : 'TWILIGHT CROSS-CLEAVE',
        };
        b.attackLabel = labelMap[b.attackPattern] || '';

        if (b.attackPattern === 'celestial_guillotine') {
          const cuts = isNightmare ? (isP2 ? 6 : 5) : isP2 ? 4 : 3;
          for (let i = 0; i < cuts; i++) {
            const tp = getRandomAlivePlayer(rt);
            const ang = (i / cuts) * Math.PI + (Math.random() - 0.5) * 0.4;
            const px = tp.x + tp.size / 2;
            const py = tp.y + tp.size / 2;
            rt.telegraphLines.push({
              x1: px - Math.cos(ang) * 760,
              y1: py - Math.sin(ang) * 760,
              x2: px + Math.cos(ang) * 760,
              y2: py + Math.sin(ang) * 760,
              timer: isNightmare ? 0.82 : 1.0,
              maxTimer: isNightmare ? 0.82 : 1.0,
              width: 14,
              color: i % 2 === 0 ? '#fbbf24' : '#38bdf8',
              kind: i % 2 === 0 ? 'katana' : 'void_rift',
              triggered: false,
            });
          }
        } else if (b.attackPattern === 'eclipse_cross_sweep') {
          const dirs = isNightmare
            ? [0, Math.PI / 6, Math.PI / 3, Math.PI / 2, (2 * Math.PI) / 3, (5 * Math.PI) / 6]
            : [Math.PI / 4, (3 * Math.PI) / 4, 0, Math.PI / 2];
          dirs.forEach((ang, idx) => {
            rt.telegraphLines.push({
              x1: cx - Math.cos(ang) * 780,
              y1: cy - Math.sin(ang) * 780,
              x2: cx + Math.cos(ang) * 780,
              y2: cy + Math.sin(ang) * 780,
              timer: isNightmare ? 0.85 : 1.05,
              maxTimer: isNightmare ? 0.85 : 1.05,
              width: 14,
              color: idx % 2 === 0 ? '#fbbf24' : '#38bdf8',
              kind: 'katana',
              triggered: false,
            });
          });
        }
        triggerBossVoice(rt, b.attackPattern);
      }
      break;

    case 'telegraph':
      b.pulseSize = 1 + Math.sin(b.animationTimer * 8) * 0.14;
      if (b.stateTimer <= 0) {
        b.state = 'attacking';
        b.attackTimer = 0;

        if (b.attackPattern === 'eclipse_tether') {
          if (!bothAliveCoop) {
            b.attackPattern = 'eclipse_cross_sweep';
            b.stateTimer = isP2 ? 2.7 : 3.1;
          } else {
            b.stateTimer = 4.0;
            rt.eclipseTetherTimer = 3.8;
            showPhaseAnnounce(rt, 'UNITE FOR SANCTUARY & SLICE BULLETS WITH THE LINK!', '#34d399', 2.5);
          }
        } else if (b.attackPattern === 'twin_pylons') {
          b.stateTimer = 7.5;
          const yPos = Math.round(rt.arenaHeight * 0.56);
          if (bothAliveCoop) {
            rt.eclipsePylons = [
              { x: 260, y: yPos, size: 32, hp: 2, maxHp: 2, role: 'solar', active: true, rekindleTimer: 0 },
              { x: rt.arenaWidth - 260, y: yPos, size: 32, hp: 2, maxHp: 2, role: 'lunar', active: true, rekindleTimer: 0 },
            ];
            showPhaseAnnounce(rt, 'P1 BREAK SOLAR · P2 BREAK LUNAR IN UNISON!', '#fde047', 2.5);
          } else {
            rt.eclipsePylons = [
              { x: Math.round(rt.arenaWidth / 2), y: yPos, size: 34, hp: 2, maxHp: 2, role: 'solo', active: true, rekindleTimer: 0 },
            ];
            showPhaseAnnounce(rt, 'SHATTER THE ECLIPSE PYLON!', '#fde047', 2.0);
          }
        } else if (b.attackPattern === 'eclipse_prison') {
          if (!bothAliveCoop) {
            b.attackPattern = 'celestial_guillotine';
            b.stateTimer = isP2 ? 2.8 : 3.2;
          } else {
            const victim = aliveCoopPlayers[Math.floor(Math.random() * aliveCoopPlayers.length)] || rt.players[0];
            const vx = Math.max(140, Math.min(rt.arenaWidth - 140, victim.x + victim.size / 2));
            const vy = Math.max(180, Math.min(rt.arenaHeight - 140, victim.y + victim.size / 2));
            victim.x = vx - victim.size / 2;
            victim.y = vy - victim.size / 2;
            rt.eclipsePrison = {
              targetPlayerId: victim.id,
              x: vx,
              y: vy,
              radius: 56,
              timer: isP2 ? 3.8 : 4.4,
              maxTimer: isP2 ? 3.8 : 4.4,
            };
            b.stateTimer = isP2 ? 4.2 : 4.8;
            showPhaseAnnounce(rt, `P${victim.id} CAGED! ALLIES DASH OR SLASH THE PRISON!`, '#fbbf24', 2.5);
          }
        } else if (b.attackPattern === 'eclipse_prism_beam') {
          if (!bothAliveCoop) {
            b.attackPattern = 'eclipse_convergence';
            b.stateTimer = isP2 ? 2.9 : 3.3;
          } else {
            b.stateTimer = isP2 ? 5.2 : 5.8;
            const my = Math.round(rt.arenaHeight * 0.52);
            rt.eclipseMirrors = [
              { role: 'solar', ownerId: 1, x: 240, y: my, radius: 52, charge: 0, locked: false },
              { role: 'lunar', ownerId: 2, x: rt.arenaWidth - 240, y: my, radius: 52, charge: 0, locked: false },
            ];
            showPhaseAnnounce(rt, 'CHARGE BOTH ASTRAL MIRRORS TO DEFLECT THE BEAM!', '#38bdf8', 2.5);
          }
        } else {
          b.stateTimer = rt.difficulty === 'hard' ? (isP2 ? 3.1 : 3.4) : isP2 ? 2.8 : 3.2;
        }
      }
      break;

    case 'attacking': {
      b.attackTimer += dt;
      const isNightmare = rt.difficulty === 'hard';
      const { spd: diffSpd, pace: diffPace } = getDiffScale(rt);
      const spd = (isP2 ? 1.24 : 1.02) * (isNightmare ? 1.18 : diffSpd);

      if (b.attackPattern === 'eclipse_tether') {
        rt.eclipseTetherTimer = Math.max(0, rt.eclipseTetherTimer - dt);
        const iv = isNightmare ? 0.68 : 0.95;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const tp = getRandomAlivePlayer(rt);
          const ang = Math.atan2(tp.y + tp.size / 2 - cy, tp.x + tp.size / 2 - cx);
          const halfSpan = isNightmare ? 3 : 2;
          for (let k = -halfSpan; k <= halfSpan; k++) {
            pushBossProj(rt, {
              uid: rt.nextUid++,
              x: cx,
              y: cy,
              dx: Math.cos(ang + k * 0.24) * 4.3 * (isNightmare ? 1.15 : 1),
              dy: Math.sin(ang + k * 0.24) * 4.3 * (isNightmare ? 1.15 : 1),
              size: 15,
              speed: 1,
              color: k % 2 === 0 ? '#fbbf24' : '#38bdf8',
              damage: 16,
              shape: 'shard',
            });
          }
        }
        if (rt.eclipseTetherTimer <= 0) {
          soundEngine.playBossAttackExecuteSfx('eclipse_tether');
          rt.energyWaves.push({ x: cx, y: cy, radius: 20, maxRadius: 920, alpha: 0.95, speed: 620, color: '#fbbf24' });
          rt.energyWaves.push({ x: cx, y: cy, radius: 10, maxRadius: 820, alpha: 0.9, speed: 520, color: '#38bdf8' });
          rt.screenShake = Math.max(rt.screenShake, 18);

          if (rt.eclipseSanctuaryActive) {
            grantCoopResonance(rt, 'SANCTUARY COUNTER — EXPOSED!', '#34d399');
            rt.eclipseTetherTimer = 0;
            rt.eclipseSanctuaryActive = false;
            triggerBossExposedWindow(rt, 'SANCTUARY COUNTER — 2X DAMAGE!');
            return;
          } else {
            if (bothAliveCoop) {
              triggerCoopPunishment(rt, 'SANCTUARY FAILED — ECLIPSE JUDGMENT UNLEASHED!', rt.players, isNightmare ? 28 : 22);
              return;
            }
            rt.players.forEach((p) => {
              if (p.state === 'alive' && !p.dashImmune && p.invulnFrames <= 0 && p.cloakTimer <= 0) {
                damagePlayer(rt, p, 28);
              }
            });
            b.state = 'idle';
            b.stateTimer = 0.85;
            b.attackLabel = '';
            rt.eclipseTetherTimer = 0;
            rt.eclipseSanctuaryActive = false;
          }
        }
      } else if (b.attackPattern === 'twin_pylons') {
        if (rt.eclipsePylons.length > 0 && rt.eclipsePylons.every((py) => !py.active)) {
          rt.eclipsePylons = [];
          if (bothAliveCoop) {
            grantCoopResonance(rt, 'POLARITY PYLONS SHATTERED!', '#fde047');
          } else {
            rt.bossProjectiles = [];
            rt.score += Math.round(450 * rt.diffSettings.scoreMultiplier);
            soundEngine.playBossWeakened();
            addFloatingText(rt, cx, cy - 64, 'ECLIPSE WARD SHATTERED!', '#22d3ee', 1.25);
          }
          triggerBossExposedWindow(rt, 'PYLONS SHATTERED — 2X DAMAGE!');
          return;
        }
        const iv = isNightmare ? 0.95 : 1.45 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const tp = getRandomAlivePlayer(rt);
          const ang = Math.atan2(tp.y + tp.size / 2 - cy, tp.x + tp.size / 2 - cx);
          const halfSpan = isNightmare ? 3 : 2;
          for (let i = -halfSpan; i <= halfSpan; i++) {
            pushBossProj(rt, {
              uid: rt.nextUid++,
              x: cx,
              y: cy,
              dx: Math.cos(ang + i * 0.22) * 4.5 * spd,
              dy: Math.sin(ang + i * 0.22) * 4.5 * spd,
              size: 15,
              speed: 1,
              color: i % 2 === 0 ? '#fbbf24' : '#38bdf8',
              damage: 16,
              shape: 'shard',
            });
          }
          soundEngine.playBossAttackExecuteSfx('twin_pylons');
        }
        if (b.stateTimer <= 0) {
          // Remaining un-shattered Pylons erupt!
          rt.eclipsePylons.forEach((py) => {
            if (!py.active) return;
            for (let k = 0; k < 10; k++) {
              const ang = (k / 10) * Math.PI * 2;
              pushBossProj(rt, {
                uid: rt.nextUid++,
                x: py.x,
                y: py.y,
                dx: Math.cos(ang) * 5.2,
                dy: Math.sin(ang) * 5.2,
                size: 16,
                speed: 1,
                color: py.role === 'lunar' ? '#38bdf8' : '#fbbf24',
                damage: 20,
                shape: 'shard',
              });
            }
          });
          if (bothAliveCoop) {
            triggerCoopPunishment(rt, 'PYLONS UNBROKEN — ECLIPSE JUDGMENT UNLEASHED!', rt.players, isNightmare ? 26 : 20);
            return;
          }
          rt.eclipsePylons = [];
          b.state = 'idle';
          b.stateTimer = 0.9;
          b.attackLabel = '';
        }
      } else if (b.attackPattern === 'eclipse_prison') {
        if (!bothAliveCoop || !rt.eclipsePrison) {
          rt.eclipsePrison = null;
          b.state = 'idle';
          b.stateTimer = 0.7;
          b.attackLabel = '';
          return;
        }
        const prison = rt.eclipsePrison;
        prison.timer -= dt;
        const rescuer = rt.players.find((p) => p.id !== prison.targetPlayerId && p.state === 'alive');

        // Rescuer saves trapped ally by dashing into the prison or striking it with their blade!
        if (rescuer) {
          const distR = Math.hypot(
            rescuer.x + rescuer.size / 2 - prison.x,
            rescuer.y + rescuer.size / 2 - prison.y
          );
          if (distR <= prison.radius + rescuer.size * 0.55 && (rescuer.dashImmune || rescuer.hasKnife)) {
            if (rescuer.hasKnife && !rescuer.dashImmune && !rt.cheats.alwaysArmed) {
              rescuer.hasKnife = false;
              repositionKnifeForPlayer(rt, rescuer);
            }
            addSlashArc(rt, prison.x, prison.y, rescuer.facingAngle, rescuer.color, 66);
            rt.energyWaves.push({ x: prison.x, y: prison.y, radius: 10, maxRadius: 260, alpha: 0.95, speed: 420, color: '#34d399' });
            rt.eclipsePrison = null;
            grantCoopResonance(rt, 'ALLY FREED — BOSS EXPOSED!', '#34d399');
            triggerBossExposedWindow(rt, 'ALLY FREED — 2X DAMAGE!');
            return;
          }
        }

        // Spiral pressure aimed toward the free rescuer
        const iv = isNightmare ? 0.52 : 0.68 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const base = rescuer
            ? Math.atan2(rescuer.y + rescuer.size / 2 - cy, rescuer.x + rescuer.size / 2 - cx)
            : b.attackTimer;
          const halfSpan = isNightmare ? 3 : 2;
          for (let i = -halfSpan; i <= halfSpan; i++) {
            pushBossProj(rt, {
              uid: rt.nextUid++,
              x: cx,
              y: cy,
              dx: Math.cos(base + i * 0.25) * 4.4 * spd,
              dy: Math.sin(base + i * 0.25) * 4.4 * spd,
              size: 14,
              speed: 1,
              color: i % 2 === 0 ? '#fbbf24' : '#38bdf8',
              damage: 15,
              shape: 'shard',
            });
          }
          soundEngine.playBossAttackExecuteSfx('eclipse_prison');
        }

        if (prison.timer <= 0) {
          rt.energyWaves.push({ x: prison.x, y: prison.y, radius: 12, maxRadius: 240, alpha: 0.9, speed: 380, color: '#ef4444' });
          triggerCoopPunishment(rt, 'ALLY ABANDONED — ECLIPSE JUDGMENT UNLEASHED!', rt.players, isNightmare ? 30 : 24);
          return;
        }
      } else if (b.attackPattern === 'eclipse_prism_beam') {
        if (!bothAliveCoop || rt.eclipseMirrors.length < 2) {
          rt.eclipseMirrors = [];
          b.state = 'idle';
          b.stateTimer = 0.7;
          b.attackLabel = '';
          return;
        }
        rt.eclipseMirrors.forEach((m) => {
          const chargedByAny = aliveCoopPlayers.some(
            (owner) => Math.hypot(owner.x + owner.size / 2 - m.x, owner.y + owner.size / 2 - m.y) <= m.radius + owner.size * 0.45
          );
          if (chargedByAny) {
            m.charge = Math.min(1, m.charge + dt * 1.15);
            if (m.charge >= 1 && !m.locked) {
              m.locked = true;
              soundEngine.playParry();
              addFloatingText(
                rt,
                m.x,
                m.y - 32,
                m.role === 'solar' ? 'SOLAR MIRROR LOCKED!' : 'LUNAR MIRROR LOCKED!',
                m.role === 'solar' ? '#fbbf24' : '#38bdf8',
                1.05
              );
            }
          } else if (!m.locked) {
            m.charge = Math.max(0, m.charge - dt * 0.25);
          }
        });

        // Both Mirrors Locked -> Twin Counter-Lasers fire straight back into the boss!
        if (rt.eclipseMirrors.every((m) => m.locked)) {
          rt.eclipseMirrors.forEach((m) => {
            rt.energyWaves.push({
              x: m.x,
              y: m.y,
              radius: 12,
              maxRadius: 320,
              alpha: 0.9,
              speed: 440,
              color: m.role === 'solar' ? '#fbbf24' : '#38bdf8',
            });
          });
          rt.energyWaves.push({ x: cx, y: cy, radius: 15, maxRadius: 520, alpha: 0.95, speed: 500, color: '#fde047' });
          grantCoopResonance(rt, 'PRISM COUNTER-BEAM — SOVEREIGNS HIT!', '#38bdf8');
          const outcome = handleBossHit(rt, aliveCoopPlayers[0] || rt.players[0], false);
          rt.eclipseMirrors = [];
          rt.eclipseCounterFlashTimer = 0.75;
          if (outcome === 'hit') {
            triggerBossExposedWindow(rt, 'PRISM COUNTER — 2X DAMAGE!');
          }
          return;
        }

        // Sweeping astral orbs while players charge their mirrors
        const iv = isNightmare ? 0.56 : 0.75 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const step = Math.floor(b.attackTimer / iv);
          const orbCount = isNightmare ? 12 : 8;
          for (let i = 0; i < orbCount; i++) {
            const ang = (i / orbCount) * Math.PI * 2 + step * 0.35;
            pushBossProj(rt, {
              uid: rt.nextUid++,
              x: cx,
              y: cy,
              dx: Math.cos(ang) * 4.2 * spd,
              dy: Math.sin(ang) * 4.2 * spd,
              size: 14,
              speed: 1,
              color: i % 2 === 0 ? '#fbbf24' : '#38bdf8',
              damage: 14,
              shape: 'orb',
            });
          }
          soundEngine.playBossAttackExecuteSfx('eclipse_prism_beam');
        }

        if (b.stateTimer <= 0) {
          triggerCoopPunishment(rt, 'MIRRORS FAILED — ECLIPSE JUDGMENT UNLEASHED!', rt.players, isNightmare ? 30 : 24);
          return;
        }
      } else if (b.attackPattern === 'coop_punishment') {
        // Relentless yet dodgeable Punishment Storm after failing 2P teamwork
        const spiralIv = isNightmare ? 0.15 : 0.21;
        if (Math.floor(b.attackTimer / spiralIv) > Math.floor((b.attackTimer - dt) / spiralIv)) {
          const step = Math.floor(b.attackTimer / spiralIv);
          const arms = isNightmare ? 4 : 3;
          for (let a = 0; a < arms; a++) {
            const solarAng = step * 0.34 + (a / arms) * Math.PI * 2;
            const lunarAng = -step * 0.32 + (a / arms) * Math.PI * 2;
            pushBossProj(rt, {
              uid: rt.nextUid++,
              x: cx,
              y: cy,
              dx: Math.cos(solarAng) * (isNightmare ? 6.0 : 5.2),
              dy: Math.sin(solarAng) * (isNightmare ? 6.0 : 5.2),
              size: 15,
              speed: 1,
              color: '#fbbf24',
              damage: 20,
              shape: 'ember',
            });
            pushBossProj(rt, {
              uid: rt.nextUid++,
              x: cx,
              y: cy,
              dx: Math.cos(lunarAng) * (isNightmare ? 5.3 : 4.5),
              dy: Math.sin(lunarAng) * (isNightmare ? 5.3 : 4.5),
              size: 15,
              speed: 1,
              color: '#ef4444',
              damage: 20,
              shape: 'shard',
            });
          }
        }
        const huntIv = isNightmare ? 0.68 : 0.9;
        if (Math.floor(b.attackTimer / huntIv) > Math.floor((b.attackTimer - dt) / huntIv)) {
          rt.players.forEach((tp, idx) => {
            if (tp.state !== 'alive') return;
            const aim = Math.atan2(tp.y + tp.size / 2 - cy, tp.x + tp.size / 2 - cx);
            for (const off of [-0.18, 0.18]) {
              pushBossProj(rt, {
                uid: rt.nextUid++,
                x: cx,
                y: cy,
                dx: Math.cos(aim + off) * (isNightmare ? 7.4 : 6.4),
                dy: Math.sin(aim + off) * (isNightmare ? 7.4 : 6.4),
                size: 16,
                speed: 1,
                color: idx === 0 ? '#ef4444' : '#38bdf8',
                damage: 22,
                shape: 'lance',
              });
            }
          });
          soundEngine.playBossAttackExecuteSfx('coop_punishment');
        }
        if (b.stateTimer <= 0) {
          b.state = 'idle';
          b.stateTimer = 0.7;
          b.attackLabel = '';
          return;
        }
      } else if (b.attackPattern === 'celestial_guillotine') {
        const iv = isNightmare ? 0.92 : 1.2;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const cuts = isNightmare ? (isP2 ? 5 : 4) : isP2 ? 3 : 2;
          for (let i = 0; i < cuts; i++) {
            const tp = getRandomAlivePlayer(rt);
            const ang = Math.random() * Math.PI;
            const px = tp.x + tp.size / 2;
            const py = tp.y + tp.size / 2;
            rt.telegraphLines.push({
              x1: px - Math.cos(ang) * 760,
              y1: py - Math.sin(ang) * 760,
              x2: px + Math.cos(ang) * 760,
              y2: py + Math.sin(ang) * 760,
              timer: isNightmare ? 0.78 : 0.95,
              maxTimer: isNightmare ? 0.78 : 0.95,
              width: 14,
              color: i % 2 === 0 ? '#fbbf24' : '#38bdf8',
              kind: i % 2 === 0 ? 'katana' : 'void_rift',
              triggered: false,
            });
          }
        }
      } else if (b.attackPattern === 'starfall_meteors') {
        const iv = isNightmare ? 0.65 : 0.85 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const meteors = isNightmare ? 2 : 1;
          for (let m = 0; m < meteors; m++) {
            const tp = getRandomAlivePlayer(rt);
            const mx = Math.max(90, Math.min(rt.arenaWidth - 90, tp.x + tp.size / 2 + (Math.random() - 0.5) * (m === 0 ? 140 : 250)));
            const my = Math.max(90, Math.min(rt.arenaHeight - 90, tp.y + tp.size / 2 + (Math.random() - 0.5) * (m === 0 ? 140 : 250)));
            const isSolar = (m + Math.floor(b.attackTimer * 2)) % 2 === 0;
            rt.oniCursedZones.push({
              x: mx,
              y: my,
              radius: 22,
              maxRadius: isNightmare ? 115 : isP2 ? 105 : 88,
              growthRate: isNightmare ? 58 : 48,
              alpha: 0.8,
              lifetime: 4.0,
              color: isSolar ? 'rgba(251, 191, 36, 0.82)' : 'rgba(56, 189, 248, 0.82)',
              damageTimer: 0,
            });
            const shards = isNightmare ? 12 : 8;
            for (let i = 0; i < shards; i++) {
              const ang = (i / shards) * Math.PI * 2 + b.attackTimer;
              pushBossProj(rt, {
                uid: rt.nextUid++,
                x: mx,
                y: my,
                dx: Math.cos(ang) * (isNightmare ? 5.1 : 4.5 * diffSpd),
                dy: Math.sin(ang) * (isNightmare ? 5.1 : 4.5 * diffSpd),
                size: 15,
                speed: 1,
                color: isSolar ? '#fbbf24' : '#38bdf8',
                damage: 18,
                shape: 'shard',
              });
            }
          }
          soundEngine.playBossAttackExecuteSfx('starfall_meteors');
        }
      } else if (b.attackPattern === 'eclipse_nova' || b.attackPattern === 'solar_lunar_nova') {
        const iv = isNightmare ? 0.33 : 0.42 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const step = Math.floor(b.attackTimer / iv);
          const isSolar = step % 2 === 0;
          const count = isNightmare ? (isP2 ? 20 : 18) : isP2 ? 14 : 12;
          const gapIdx = (step * 3) % count;
          for (let i = 0; i < count; i++) {
            if (i === gapIdx || i === (gapIdx + 1) % count || (isNightmare && i === (gapIdx + 2) % count)) continue;
            const ang = (i / count) * Math.PI * 2 + step * 0.26 * (isSolar ? 1 : -1);
            pushBossProj(rt, {
              uid: rt.nextUid++,
              x: cx,
              y: cy,
              dx: Math.cos(ang) * (isSolar ? 5.3 : 4.7) * spd,
              dy: Math.sin(ang) * (isSolar ? 5.3 : 4.7) * spd,
              size: isSolar ? 16 : 15,
              speed: 1,
              color: isSolar ? '#fbbf24' : '#38bdf8',
              damage: 18,
              shape: isSolar ? 'ember' : 'shard',
            });
          }
          if (step % 2 === 0) soundEngine.playBossAttackExecuteSfx('eclipse_nova');
        }
      } else if (b.attackPattern === 'eclipse_cross_sweep') {
        const iv = isNightmare ? 0.85 : 1.15 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const tp = getRandomAlivePlayer(rt);
          const ang = Math.atan2(tp.y + tp.size / 2 - cy, tp.x + tp.size / 2 - cx);
          const halfSpan = isNightmare ? 4 : 3;
          for (let i = -halfSpan; i <= halfSpan; i++) {
            pushBossProj(rt, {
              uid: rt.nextUid++,
              x: cx,
              y: cy,
              dx: Math.cos(ang + i * 0.14) * 6.0 * spd,
              dy: Math.sin(ang + i * 0.14) * 6.0 * spd,
              size: 16,
              speed: 1,
              color: Math.abs(i) % 2 === 0 ? '#fbbf24' : '#38bdf8',
              damage: 20,
              shape: 'lance',
            });
          }
          if (isNightmare) {
            for (let r = 0; r < 10; r++) {
              const ringA = (r / 10) * Math.PI * 2 + b.attackTimer;
              pushBossProj(rt, { uid: rt.nextUid++, x: cx, y: cy, dx: Math.cos(ringA) * 4.5, dy: Math.sin(ringA) * 4.5, size: 14, speed: 1, color: '#ef4444', damage: 16, shape: 'orb' });
            }
          }
          soundEngine.playBossAttackExecuteSfx('eclipse_cross_sweep');
        }
      } else if (b.attackPattern === 'eclipse_convergence') {
        const iv = isNightmare ? 0.16 : 0.22 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const step = Math.floor(b.attackTimer / iv);
          const orbitAng = b.animationTimer * (isNightmare ? 2.65 : 2.2);
          const solarX = cx + Math.cos(orbitAng) * 95;
          const solarY = cy + Math.sin(orbitAng) * 95;
          const lunarX = cx - Math.cos(orbitAng) * 95;
          const lunarY = cy - Math.sin(orbitAng) * 95;
          const arms = isNightmare ? 4 : 3;
          for (let arm = 0; arm < arms; arm++) {
            const sa = step * 0.34 + (arm / arms) * Math.PI * 2;
            const la = -step * 0.34 + (arm / arms) * Math.PI * 2;
            pushBossProj(rt, {
              uid: rt.nextUid++,
              x: solarX,
              y: solarY,
              dx: Math.cos(sa) * 5.6 * spd,
              dy: Math.sin(sa) * 5.6 * spd,
              size: 14,
              speed: 1,
              color: '#fbbf24',
              damage: 16,
              shape: 'lance',
            });
            pushBossProj(rt, {
              uid: rt.nextUid++,
              x: lunarX,
              y: lunarY,
              dx: Math.cos(la) * 5.6 * spd,
              dy: Math.sin(la) * 5.6 * spd,
              size: 14,
              speed: 1,
              color: '#38bdf8',
              damage: 16,
              shape: 'shard',
            });
          }
          if (step % 3 === 0) soundEngine.playBossAttackExecuteSfx('eclipse_convergence');
        }
      }

      const selfTimed =
        b.attackPattern === 'eclipse_tether' ||
        b.attackPattern === 'twin_pylons' ||
        b.attackPattern === 'eclipse_prison' ||
        b.attackPattern === 'eclipse_prism_beam' ||
        b.attackPattern === 'coop_punishment';

      if (b.stateTimer <= 0 && !selfTimed) {
        completeBossAttackCycle(rt, isP2);
      }
      break;
    }

    case 'weakened':
      b.pulseSize = 0.84 + Math.sin(b.animationTimer * 6) * 0.1;
      emitBossWeakenedSparks(rt);
      if (b.stateTimer <= 0 || b.weakenedHits >= b.maxWeakenedHits) {
        b.state = 'idle';
        b.stateTimer = 1.9;
        b.attackLabel = '';
        rt.eclipseBeacons = [];
        rt.eclipsePylons = [];
        rt.eclipsePrison = null;
        rt.eclipseMirrors = [];
        rt.eclipseMarkedBy = null;
        rt.eclipseMarkTimer = 0;
      }
      break;
  }
}

function pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function updateCamera(rt: GameRuntime, dt: number) {
  if (!rt.isBossLevel && rt.arenaWidth <= CANVAS_WIDTH) {
    rt.camera.x = CANVAS_WIDTH / 2;
    rt.camera.y = CANVAS_HEIGHT / 2;
    rt.camera.zoom = 1;
    return;
  }

  const pts: { x: number; y: number }[] = [];
  rt.players.forEach((p) => {
    if (p.state === 'alive') {
      pts.push({ x: p.x + p.size / 2, y: p.y + p.size / 2 });
    }
  });
  if (pts.length === 0) {
    pts.push({ x: rt.arenaWidth / 2, y: rt.arenaHeight * 0.6 });
  }

  const b = rt.boss;
  const bx = b.x + b.size / 2;
  const by = Math.max(80, b.y + b.size / 2);

  if (rt.isBossLevel) {
    pts.push({ x: bx, y: by });
  } else {
    rt.chests.forEach((ch) => {
      if (!ch.opened) pts.push({ x: ch.x, y: ch.y });
    });
    if (rt.shopNpc) {
      pts.push({ x: rt.shopNpc.x, y: rt.shopNpc.y });
    } else if (rt.shopItems.length > 0) {
      pts.push({ x: rt.arenaWidth / 2, y: rt.arenaHeight / 2 });
    }
  }

  let minX = pts[0].x;
  let maxX = pts[0].x;
  let minY = pts[0].y;
  let maxY = pts[0].y;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].x < minX) minX = pts[i].x;
    if (pts[i].x > maxX) maxX = pts[i].x;
    if (pts[i].y < minY) minY = pts[i].y;
    if (pts[i].y > maxY) maxY = pts[i].y;
  }

  let tx = (minX + maxX) / 2;
  let ty = (minY + maxY) / 2;

  let padX = rt.isBossLevel ? 360 : 390;
  let padY = rt.isBossLevel ? 280 : 300;
  let maxZoom = rt.isBossLevel ? 1.02 : 0.94;
  let minZoom = rt.isBossLevel ? 0.58 : 0.64;
  let arenaCenterWeight = 0;

  if (!rt.isBossLevel) {
    if (rt.gates.length > 0 && rt.enemies.length === 0) {
      maxZoom = 0.74;
      padX = 480;
      padY = 360;
      arenaCenterWeight = 0.35;
    } else if (rt.introPlaying) {
      tx = rt.arenaWidth / 2;
      ty = rt.arenaHeight / 2;
      maxZoom = 0.72;
    }
  } else {
    const activePattern = b.state === 'telegraph' || b.state === 'attacking' ? b.attackPattern : '';

    if (b.state === 'comic_intro') {
      const focusY = Math.max(120, b.originalY + b.size / 2);
      tx = bx;
      ty = focusY + (b.stateTimer < 3.1 ? 30 : 0);
      if (rt.bossType === 'mecha') {
        if (b.entryPhase <= 1) {
          ty = focusY - 40;
          maxZoom = 0.78;
        } else if (b.entryPhase === 2) {
          ty = Math.max(110, (by + focusY) / 2);
          maxZoom = 0.98;
        } else {
          maxZoom = 0.96;
        }
      } else if (rt.bossType === 'void') {
        if (b.stateTimer > 4.85) {
          const prog = Math.max(0, Math.min(1, (7.4 - b.stateTimer) / 2.55));
          maxZoom = 0.76 + prog * 0.34;
        } else if (b.stateTimer > 4.15) {
          maxZoom = 1.24;
        } else {
          maxZoom = 0.9;
        }
      } else if (rt.bossType === 'oni') {
        if (b.stateTimer > 4.25) {
          maxZoom = 0.76;
          ty = focusY + 45;
        } else if (b.stateTimer > 3.1) {
          maxZoom = 1.15;
        } else {
          maxZoom = 0.92;
        }
      } else {
        if (b.stateTimer > 4.2) {
          const prog = Math.max(0, Math.min(1, (7.4 - b.stateTimer) / 3.2));
          maxZoom = 0.68 + prog * 0.24;
        } else if (b.stateTimer > 3.1) {
          maxZoom = 1.1;
        } else {
          maxZoom = 0.88;
        }
      }
      padX = 320;
      padY = 260;
    } else if (b.state === 'dead') {
      tx = bx;
      ty = by;
      maxZoom = rt.bossDeadTimer < 2.5 ? 0.96 : 0.78;
      padX = 340;
      padY = 260;
    } else if (b.state === 'weakened') {
      maxZoom = 0.94;
      padX = 340;
      padY = 260;
    } else if (
      activePattern === 'wall' ||
      activePattern === 'void_rifts' ||
      activePattern === 'iaijutsu_cut' ||
      activePattern === 'orbital_crosshair' ||
      activePattern === 'clone' ||
      activePattern === 'shrine_shatter' ||
      activePattern === 'twin_pylons' ||
      activePattern === 'eclipse_tether' ||
      activePattern === 'celestial_guillotine' ||
      activePattern === 'forge_laser_grid'
    ) {
      maxZoom = 0.585;
      minZoom = 0.58;
      padX = 560;
      padY = 420;
      arenaCenterWeight = activePattern === 'wall' ? 0.9 : 0.78;
    } else if (
      activePattern === 'gravity_ring' ||
      activePattern === 'boomerang' ||
      activePattern === 'abyss_blink' ||
      activePattern === 'thunder_step' ||
      activePattern === 'siege_mortars' ||
      activePattern === 'laser_sweep' ||
      activePattern === 'katana_wave' ||
      activePattern === 'cursed_zone' ||
      activePattern === 'hellfire_pillars' ||
      activePattern === 'spirit_bomb' ||
      activePattern === 'coop_punishment'
    ) {
      maxZoom = 0.72;
      padX = 480;
      padY = 360;
      arenaCenterWeight = 0.25;
    } else if (activePattern) {
      maxZoom = 0.86;
      padX = 410;
      padY = 310;
    }
  }

  if (arenaCenterWeight > 0) {
    tx = tx * (1 - arenaCenterWeight) + (rt.arenaWidth / 2) * arenaCenterWeight;
    ty = ty * (1 - arenaCenterWeight) + (rt.arenaHeight / 2) * arenaCenterWeight;
  }

  // Headroom offset during active boss fights so top Boss HP bar never sits on top of the Boss sprite (esp. Mobile)
  if (rt.isBossLevel && b.state !== 'comic_intro' && b.state !== 'dead') {
    ty -= 42;
  }

  const spanW = Math.max(480, maxX - minX + padX);
  const spanH = Math.max(380, maxY - minY + padY);
  const targetZoom = Math.min(maxZoom, Math.max(minZoom, Math.min(CANVAS_WIDTH / spanW, CANVAS_HEIGHT / spanH)));

  const halfW = CANVAS_WIDTH / (2 * targetZoom);
  const halfH = CANVAS_HEIGHT / (2 * targetZoom);
  const hasHallways = !rt.isBossLevel && rt.gates.some((g) => !g.isNextFloorPortal);
  const edgeExtraX = hasHallways ? 175 : 24;
  const edgeExtraY = hasHallways ? 175 : 24;
  if (halfW * 2 >= rt.arenaWidth + (hasHallways ? 160 : 0)) {
    tx = rt.arenaWidth / 2;
  } else {
    tx = Math.max(halfW - edgeExtraX, Math.min(rt.arenaWidth - halfW + edgeExtraX, tx));
  }
  if (halfH * 2 >= rt.arenaHeight + (hasHallways ? 160 : 0)) {
    ty = rt.arenaHeight / 2;
  } else {
    ty = Math.max(halfH - edgeExtraY - (rt.isBossLevel ? 44 : 0), Math.min(rt.arenaHeight - halfH + edgeExtraY, ty));
  }

  const zoomRate = targetZoom < rt.camera.zoom ? 6.5 : 4.5;
  rt.camera.zoom += (targetZoom - rt.camera.zoom) * (1 - Math.exp(-zoomRate * dt));
  const panDamp = 1 - Math.exp(-5.8 * dt);
  rt.camera.x += (tx - rt.camera.x) * panDamp;
  rt.camera.y += (ty - rt.camera.y) * panDamp;
}

function damageEnemy(
  rt: GameRuntime,
  enemyIndex: number,
  ownerId: PlayerId,
  dmg: number,
  fxAngle: number,
  fxColor: string
): boolean {
  const e = rt.enemies[enemyIndex];
  if (!e) return false;
  const ecx = e.x + e.size / 2;
  const ecy = e.y + e.size / 2;
  e.hp = (e.hp ?? 1) - Math.max(1, dmg);
  e.maxHp = e.maxHp ?? 1;

  if (e.hp > 0) {
    e.hitFlashTimer = 0.22;
    e.x = Math.max(0, Math.min(rt.arenaWidth - e.size, e.x + Math.cos(fxAngle) * 14));
    e.y = Math.max(0, Math.min(rt.arenaHeight - e.size, e.y + Math.sin(fxAngle) * 14));
    soundEngine.playBossDamaged();
    addSlashArc(rt, ecx, ecy, fxAngle, fxColor, 32);
    addFloatingText(rt, ecx, e.y - 8, `-${dmg} (${e.hp}/${e.maxHp})`, '#fde047', 0.92);
    return false;
  }

  rt.lastKilledPos = { x: ecx, y: ecy };
  rt.enemies.splice(enemyIndex, 1);
  rt.kills++;
  updateCombo(rt, ownerId);
  const comboVal = rt.playerCombos[ownerId]?.count || 1;
  soundEngine.playSlash(comboVal);
  addSlashArc(rt, ecx, ecy, fxAngle, fxColor, 42);
  addFloatingText(
    rt,
    ecx,
    e.y - 6,
    e.isElite ? 'ELITE VANQUISHED!' : comboVal > 1 ? `${comboVal}x EXECUTE!` : 'SLICED!',
    e.isElite ? '#fbbf24' : fxColor,
    e.isElite ? 1.15 : 1.0
  );

  if (e.type === 'splitter') {
    const sparkHp = rt.difficulty === 'easy' ? 1 : 2 + Math.max(0, rt.loopLevel - 1);
    for (let s = 0; s < 2; s++) {
      const sAng = Math.random() * Math.PI * 2;
      rt.enemies.push({
        id: rt.nextUid++,
        type: 'mini_spark',
        x: e.x + s * 10,
        y: e.y,
        size: 20,
        speed: 3.9,
        dx: Math.cos(sAng),
        dy: Math.sin(sAng),
        rotation: 0,
        hp: sparkHp,
        maxHp: sparkHp,
        hitFlashTimer: 0,
      });
    }
  }

  if (e.isElite && rt.isOnlineCampaign && !rt.isTutorial) {
    const activeParty = rt.players.filter((pl) => pl.state !== 'spectator');
    const perPlayer = Math.max(5, Math.round(14 / Math.max(1, activeParty.length)));
    activeParty.forEach((pl) => {
      pl.coins += perPlayer;
    });
    const killer = rt.players.find((pl) => pl.id === ownerId);
    if (killer && killer.state === 'alive') {
      killer.potions = Math.min(2, killer.potions + 1);
    }
    addFloatingText(rt, ecx, ecy - 22, `ELITE LOOT: +${perPlayer}g & +1 FLASK!`, '#fbbf24', 1.2);
    if (Math.random() < 0.08) {
      spawnSkillScroll(rt, ecx, ecy);
    }
  }

  return true;
}

export function stepGame(
  rt: GameRuntime,
  rawDt: number,
  keys: Record<string, boolean>,
  controls: ControlsConfig,
  touchInput?: TouchInputState,
  remoteInputs?: Record<number, TouchInputState> | TouchInputState
) {
  if (rt.pendingEvent) return;
  const dt = Math.max(0, Math.min(Number.isFinite(rawDt) ? rawDt : 0.016, 0.05));

  // Post-Eclipse Abyssal Vote handling in Online Campaign
  if (rt.finalVote && rt.finalVote.active) {
    rt.finalVote.timer = Math.max(0, rt.finalVote.timer - dt);
    if (rt.finalVoteResolveDelay > 0) {
      rt.finalVoteResolveDelay -= dt;
    }
    const activeParty = rt.players.filter((p) => p.state !== 'spectator');
    const allVoted = activeParty.length > 0 && activeParty.every((p) => rt.finalVote!.votes[p.id]);
    const shouldResolve = rt.finalVote.timer <= 0 || (allVoted && rt.finalVoteResolveDelay <= 0);
    if (shouldResolve) {
      let deeperCount = 0;
      let endCount = 0;
      activeParty.forEach((p) => {
        const v = rt.finalVote!.votes[p.id];
        if (v === 'deeper') deeperCount++;
        else if (v === 'end') endCount++;
      });
      if (deeperCount > endCount) {
        advanceToNextLoop(rt);
      } else {
        rt.finalVote = null;
        rt.victory = true;
        soundEngine.stopMusic();
        soundEngine.playVictory();
        rt.pendingEvent = { type: 'VICTORY' };
      }
    }
    return;
  }

  rt.elapsedSeconds += dt;
  rt.stageElapsed += dt;
  rt.stylePoints = Math.max(0, rt.stylePoints - dt * 2.4);
  for (let pid = 1; pid <= 5; pid++) {
    rt.bossHitCooldowns[pid] = Math.max(0, (rt.bossHitCooldowns[pid] || 0) - dt);
    rt.bossProjBurstCooldowns[pid] = Math.max(0, (rt.bossProjBurstCooldowns[pid] || 0) - dt);
  }

  if (rt.bossVoiceTimer > 0) {
    rt.bossVoiceTimer -= dt;
    if (rt.bossVoiceTimer <= 0) rt.bossVoiceLine = null;
  }

  if (rt.warningFlash > 0) {
    rt.warningFlash = Math.max(0, rt.warningFlash - dt * 1.4);
  }

  updateCamera(rt, dt);

  rt.ambientMotes.forEach((m) => {
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    m.phase += dt * 2;
    if (m.y < -10) {
      m.y = rt.arenaHeight + 10;
      m.x = Math.random() * rt.arenaWidth;
    }
  });

  if (rt.phaseAnnounceTimer > 0) {
    rt.phaseAnnounceTimer -= dt;
    if (rt.phaseAnnounceTimer <= 0) rt.phaseAnnounce = null;
  }
  if (rt.medkitNotifTimer > 0) {
    rt.medkitNotifTimer -= dt;
    if (rt.medkitNotifTimer <= 0) rt.medkitNotif = null;
  }
  for (let bi = rt.coinBursts.length - 1; bi >= 0; bi--) {
    rt.coinBursts[bi].ttl -= dt;
    if (rt.coinBursts[bi].ttl <= 0) {
      rt.coinBursts.splice(bi, 1);
    }
  }

  const dtS = dt * rt.timeScale;

  if (rt.fadeOpacity > 0) {
    rt.fadeOpacity = Math.max(0, rt.fadeOpacity - dt * 1.4);
  }

  if (rt.introPlaying) {
    rt.introTimer += dt;
    let landedNow = false;
    const landTarget = rt.isBossLevel ? Math.round(rt.arenaHeight * 0.7) : LANDING_TARGET_Y;
    rt.players.forEach((p) => {
      if (p.state === 'spectator') return;
      if (p.y < landTarget) {
        p.y += (rt.isBossLevel ? 760 : 340) * dtS;
        if (p.y >= landTarget) {
          p.y = landTarget;
          landedNow = true;
        }
      }
    });
    if (landedNow && rt.landingSlowRemaining <= 0) {
      rt.screenShake = Math.max(rt.screenShake, 8);
      soundEngine.playLanding();
      rt.timeScale = 0.35;
      rt.landingSlowRemaining = 0.35;
    }
    if (rt.landingSlowRemaining > 0) {
      rt.landingSlowRemaining -= dt;
      if (rt.landingSlowRemaining <= 0) {
        rt.timeScale = 1;
        rt.landingSlowRemaining = 0;
      }
    }
    if (rt.introTimer >= (rt.isBossLevel ? 0.6 : INTRO_DURATION)) {
      rt.introPlaying = false;
      rt.fadeOpacity = 0;
      rt.warningFlash = 0;
      rt.players.forEach((p) => {
        if (p.state !== 'spectator') p.invulnerable = false;
      });
      if (!rt.isBossLevel && !rt.isTutorial) {
        spawnWaveEnemies(rt, rt.stage, rt.waveNumber);
      }
    }
  }

  // Visual FX updates
  for (let i = rt.dustParticles.length - 1; i >= 0; i--) {
    const d = rt.dustParticles[i];
    d.x += d.dx * dtS;
    d.y += d.dy * dtS;
    d.alpha -= dt * 1.8;
    if (d.alpha <= 0) rt.dustParticles.splice(i, 1);
  }
  for (let i = rt.slashArcs.length - 1; i >= 0; i--) {
    const a = rt.slashArcs[i];
    a.timer += dt;
    a.alpha = Math.max(0, 1 - a.timer / a.lifetime);
    if (a.alpha <= 0) rt.slashArcs.splice(i, 1);
  }
  for (let i = rt.floatingTexts.length - 1; i >= 0; i--) {
    const f = rt.floatingTexts[i];
    f.y += f.dy * dt;
    f.lifetime -= dt;
    f.alpha = Math.max(0, Math.min(1, f.lifetime / 0.35));
    if (f.lifetime <= 0) rt.floatingTexts.splice(i, 1);
  }
  for (let i = rt.energyWaves.length - 1; i >= 0; i--) {
    const w = rt.energyWaves[i];
    w.radius += w.speed * dt;
    w.alpha -= dt * 1.1;
    if (w.alpha <= 0 || w.radius >= w.maxRadius) rt.energyWaves.splice(i, 1);
  }
  for (let i = rt.deathEffects.length - 1; i >= 0; i--) {
    const e = rt.deathEffects[i];
    e.lifetime -= dt;
    if (e.type === 'shockwave') {
      e.radius = (e.radius || 0) + 230 * dt;
      e.alpha = 1 - e.radius / (e.maxRadius || 80);
      if (e.radius >= (e.maxRadius || 80)) rt.deathEffects.splice(i, 1);
    } else {
      e.x += (e.dx || 0) * dt;
      e.y += (e.dy || 0) * dt;
      e.dy = (e.dy || 0) + 260 * dt;
      e.alpha = Math.max(0, e.lifetime);
      if (e.lifetime <= 0) rt.deathEffects.splice(i, 1);
    }
  }
  for (let i = rt.comicSlashes.length - 1; i >= 0; i--) {
    const cs = rt.comicSlashes[i];
    cs.timer += dt;
    cs.alpha = Math.max(0, 1 - cs.timer / cs.lifetime);
    if (cs.alpha <= 0) rt.comicSlashes.splice(i, 1);
  }
  for (let i = rt.voidRifts.length - 1; i >= 0; i--) {
    const vr = rt.voidRifts[i];
    if (vr.size < vr.maxSize) vr.size = Math.min(vr.maxSize, vr.size + vr.growthRate * dt);
    vr.rotation += dt * 1.4;
    vr.alpha -= dt * 0.28;
    if (vr.alpha <= 0) rt.voidRifts.splice(i, 1);
  }

  if (rt.introPlaying) return;

  if (!Number.isFinite(rt.freezeTime) || rt.freezeTime < 0) rt.freezeTime = 0;
  if (rt.freezeTime > 0) {
    rt.freezeTime = Math.min(0.25, rt.freezeTime - dt);
    return;
  }

  const remoteMap: Record<number, TouchInputState> =
    remoteInputs && typeof (remoteInputs as TouchInputState).x === 'number'
      ? { 2: remoteInputs as TouchInputState }
      : ((remoteInputs as Record<number, TouchInputState>) || {});

  rt.players.forEach((pl) => {
    if (pl.state === 'spectator') return;
    if (pl.isBot) {
      updatePracticeBot(rt, pl, dt);
    } else if (pl.id === 1) {
      updatePlayer(rt, pl, dt, keys, controls.p1, touchInput);
    } else {
      const rem = remoteMap[pl.id];
      const useLocalP2Keys = !usesWeaponSystem(rt) && pl.id === 2 && !rem;
      updatePlayer(
        rt,
        pl,
        dt,
        useLocalP2Keys ? keys : {},
        pl.id === 2 ? controls.p2 : controls.p1,
        rem
      );
    }
  });

  // Void Decoys (Phantom passive)
  for (let di = rt.voidDecoys.length - 1; di >= 0; di--) {
    const d = rt.voidDecoys[di];
    d.timer -= dt;
    if (d.timer <= 0) {
      soundEngine.playShockwave();
      rt.energyWaves.push({ x: d.x, y: d.y, radius: 8, maxRadius: 110, alpha: 0.85, speed: 340, color: '#a855f7' });
      rt.bossProjectiles = rt.bossProjectiles.filter((bp) => {
        if (bp.type === 'phantom_clone') return true;
        return Math.hypot(bp.x + bp.size / 2 - d.x, bp.y + bp.size / 2 - d.y) > 105;
      });
      if (
        rt.isBossLevel &&
        rt.boss.health > 0 &&
        rt.boss.state !== 'comic_intro' &&
        rt.boss.state !== 'phase_transition' &&
        rt.boss.state !== 'dead'
      ) {
        const bcx = rt.boss.x + rt.boss.size / 2;
        const bcy = rt.boss.y + rt.boss.size / 2;
        if (Math.hypot(bcx - d.x, bcy - d.y) <= 175) {
          const owner = rt.players.find((pl) => pl.id === d.ownerId) || rt.players[0];
          handleBossHit(rt, owner, false);
          registerBossInterrupt(rt, owner, 1);
        }
      }
      rt.voidDecoys.splice(di, 1);
    }
  }

  // Skill Zones (Sacred Ground, Frost Trap / Static Field, Arrow Rain)
  for (let zi = rt.skillZones.length - 1; zi >= 0; zi--) {
    const z = rt.skillZones[zi];
    z.timer -= dt;
    z.tickTimer -= dt;
    if (z.timer <= 0) {
      rt.skillZones.splice(zi, 1);
      continue;
    }
    if (z.tickTimer <= 0) {
      if (z.kind === 'holy_ground') {
        z.tickTimer = 1.0;
        if (rt.isBossLevel && (rt.boss.channelKind === 'cursed_miasma' || rt.boss.channelKind === 'blood_curse')) {
          const staffOwner = rt.players.find((pl) => pl.id === z.ownerId) || rt.players[0];
          if (staffOwner) registerMiasmaPurge(rt, staffOwner, true);
        }
        rt.players.forEach((ally) => {
          if (ally.state === 'alive' && Math.hypot(ally.x + ally.size / 2 - z.x, ally.y + ally.size / 2 - z.y) <= z.radius) {
            ally.hp = Math.min(ally.maxHp, ally.hp + 4);
            addFloatingText(rt, ally.x + ally.size / 2, ally.y - 10, '+4 HP', '#fde047', 0.8);
          }
        });
      } else if (z.kind === 'frost_trap') {
        z.tickTimer = 0.45;
        let hitTarget: { x: number; y: number } | null = null;
        for (let ei = rt.enemies.length - 1; ei >= 0; ei--) {
          const e = rt.enemies[ei];
          if (!e) continue;
          if (Math.hypot(e.x + e.size / 2 - z.x, e.y + e.size / 2 - z.y) <= z.radius) {
            e.stunTimer = Math.max(e.stunTimer || 0, 0.75);
            if (!hitTarget) hitTarget = { x: e.x + e.size / 2, y: e.y + e.size / 2 };
            damageEnemy(rt, ei, z.ownerId, 1, Math.PI / 2, z.color);
          }
        }
        if (!hitTarget && rt.isBossLevel && rt.boss.health > 0 && rt.boss.state !== 'comic_intro' && rt.boss.state !== 'dead') {
          const bcx = rt.boss.x + rt.boss.size / 2;
          const bcy = rt.boss.y + rt.boss.size / 2;
          if (Math.hypot(bcx - z.x, bcy - z.y) <= z.radius + 95) {
            hitTarget = { x: bcx, y: bcy };
          }
        }
        if (hitTarget) {
          const ang = Math.atan2(hitTarget.y - z.y, hitTarget.x - z.x);
          rt.playerProjectiles.push({
            uid: rt.nextUid++,
            ownerId: z.ownerId,
            kind: 'frost_shard',
            x: z.x,
            y: z.y,
            dx: Math.cos(ang) * 13,
            dy: Math.sin(ang) * 13,
            angle: ang,
            radius: 14,
            color: z.color,
            lifetime: 0.85,
            pierce: 2,
          });
        }
      } else if (z.kind === 'arrow_rain') {
        z.tickTimer = 0.24;
        let rainHits = 0;
        for (let ei = rt.enemies.length - 1; ei >= 0; ei--) {
          const e = rt.enemies[ei];
          if (!e) continue;
          if (Math.hypot(e.x + e.size / 2 - z.x, e.y + e.size / 2 - z.y) <= z.radius) {
            damageEnemy(rt, ei, z.ownerId, 2, Math.PI / 2, '#34d399');
            rainHits++;
            if (rainHits >= 3) break;
          }
        }
        if (rt.isBossLevel && rt.boss.health > 0 && rt.boss.state !== 'comic_intro' && rt.boss.state !== 'dead' && rt.boss.state !== 'phase_transition') {
          const bcx = rt.boss.x + rt.boss.size / 2;
          const bcy = rt.boss.y + rt.boss.size / 2;
          const isBowCh = rt.boss.channelKind === 'bow_weakpoint' || rt.boss.channelKind === 'sky_battery';
          if (Math.hypot(bcx - z.x, bcy - z.y) <= z.radius + rt.boss.size / 2 && rt.bossHitCooldowns[z.ownerId] <= 0) {
            const owner = rt.players.find((pl) => pl.id === z.ownerId) || rt.players[0];
            handleBossHit(rt, owner, false, 0, true);
            registerBossInterrupt(rt, owner, 1);
            rt.bossHitCooldowns[z.ownerId] = isBowCh ? 0.28 : 0.42;
          }
        }
      }
    }
  }

  // Active Whirlwind & Charge close-quarters collision checks
  rt.players.forEach((pl) => {
    if (pl.state !== 'alive') return;
    const pcx = pl.x + pl.size / 2;
    const pcy = pl.y + pl.size / 2;
    if (pl.whirlwindTimer > 0) {
      const whirlDmg = pl.weapon === 'warrior_greatsword' || (!usesWeaponSystem(rt) && pl.heroClass === 'ronin') ? 2 : 1;
      for (let ei = rt.enemies.length - 1; ei >= 0; ei--) {
        const e = rt.enemies[ei];
        if (!e || (e.hitFlashTimer || 0) > 0) continue;
        if (Math.hypot(e.x + e.size / 2 - pcx, e.y + e.size / 2 - pcy) <= 84) {
          damageEnemy(rt, ei, pl.id, whirlDmg, pl.animTime * 10, pl.color);
        }
      }
      if (
        rt.isBossLevel &&
        rt.boss.health > 0 &&
        rt.boss.state !== 'comic_intro' &&
        rt.boss.state !== 'dead' &&
        rt.boss.state !== 'phase_transition'
      ) {
        const bcx = rt.boss.x + rt.boss.size / 2;
        const bcy = rt.boss.y + rt.boss.size / 2;
        if (Math.hypot(bcx - pcx, bcy - pcy) <= rt.boss.size / 2 + 84 && rt.bossHitCooldowns[pl.id] <= 0) {
          handleBossHit(rt, pl, false, 1);
          registerBossInterrupt(rt, pl, 1);
          rt.bossHitCooldowns[pl.id] = 0.42;
        }
      }
    }
    if (pl.chargeTimer > 0) {
      const beforeCharge = rt.bossProjectiles.length;
      rt.bossProjectiles = rt.bossProjectiles.filter(
        (bp) => bp.type === 'phantom_clone' || Math.hypot(bp.x + bp.size / 2 - pcx, bp.y + bp.size / 2 - pcy) > 58
      );
      const shatteredCount = beforeCharge - rt.bossProjectiles.length;
      if (shatteredCount > 0) {
        rt.score += shatteredCount * 35;
      }
      rt.enemies.forEach((e) => {
        if (Math.hypot(e.x + e.size / 2 - pcx, e.y + e.size / 2 - pcy) <= 68) {
          e.stunTimer = 2.2;
        }
      });
      if (rt.isBossLevel && rt.boss.health > 0 && rt.boss.state !== 'comic_intro' && rt.boss.state !== 'dead' && rt.boss.state !== 'phase_transition') {
        const bcx = rt.boss.x + rt.boss.size / 2;
        const bcy = rt.boss.y + rt.boss.size / 2;
        if (Math.hypot(bcx - pcx, bcy - pcy) <= rt.boss.size / 2 + 42 && rt.bossHitCooldowns[pl.id] <= 0) {
          handleBossHit(rt, pl, false, 1);
          registerBossInterrupt(rt, pl, 1);
          pl.chargeTimer = 0;
          rt.bossHitCooldowns[pl.id] = 0.5;
        }
      }
    }
  });

  // Player Projectiles (Crescent Wave, Cataclysm, Arc Bolts, Arrows, Railshot, Kunai, Frost Shards)
  for (let pi = rt.playerProjectiles.length - 1; pi >= 0; pi--) {
    const pp = rt.playerProjectiles[pi];
    pp.lifetime -= dt;
    pp.x += pp.dx * (dt * 60);
    pp.y += pp.dy * (dt * 60);
    if (pp.lifetime <= 0 || pp.x < -80 || pp.x > rt.arenaWidth + 80 || pp.y < -80 || pp.y > rt.arenaHeight + 80) {
      rt.playerProjectiles.splice(pi, 1);
      continue;
    }

    // Hit enemies (multi-HP aware)
    const projDmg =
      pp.bossDamage ||
      (pp.kind === 'sniper_arrow'
        ? 4
        : pp.kind === 'crescent' || pp.kind === 'cataclysm' || pp.kind === 'ranger_arrow'
        ? 2
        : 1);
    for (let ei = rt.enemies.length - 1; ei >= 0; ei--) {
      const e = rt.enemies[ei];
      if (!e) continue;
      if ((e.hitFlashTimer || 0) > 0 && pp.pierce > 2) continue;
      if (Math.hypot(e.x + e.size / 2 - pp.x, e.y + e.size / 2 - pp.y) < pp.radius + e.size / 2) {
        damageEnemy(rt, ei, pp.ownerId, projDmg, pp.angle, pp.color);
        pp.pierce--;
        if (pp.pierce <= 0) break;
      }
    }

    // Hit Oni Shrines & Eclipse Pylons
    rt.oniShrines.forEach((sh) => {
      if (sh.active && Math.hypot(sh.x - pp.x, sh.y - pp.y) < pp.radius + sh.size * 0.7) {
        sh.health--;
        pp.pierce--;
        soundEngine.playBossDamaged();
        if (sh.health <= 0) {
          sh.active = false;
          addFloatingText(rt, sh.x, sh.y - 20, 'SHRINE SHATTERED!', '#fbbf24', 1.05);
        }
      }
    });

    rt.eclipsePylons.forEach((py) => {
      if (py.active && Math.hypot(py.x - pp.x, py.y - pp.y) < pp.radius + py.size * 0.85) {
        py.hp--;
        pp.pierce--;
        soundEngine.playBossDamaged();
        if (py.hp <= 0) {
          py.active = false;
          py.rekindleTimer = rt.numPlayers >= 2 ? 3.5 : 0;
          addFloatingText(rt, py.x, py.y - 24, 'PYLON SHATTERED!', '#fde047', 1.05);
        }
      }
    });

    // Hit Sky Battery Turret Nodes with Player Projectiles
    if (
      rt.isBossLevel &&
      rt.boss.channelKind === 'sky_battery' &&
      (rt.boss.channelTimer || 0) > 0 &&
      rt.boss.channelNodes &&
      pp.pierce > 0
    ) {
      for (const node of rt.boss.channelNodes) {
        if (node.activated) continue;
        if (Math.hypot(node.x - pp.x, node.y - pp.y) < pp.radius + node.r) {
          node.activated = true;
          pp.pierce--;
          soundEngine.playBossDamaged();
          rt.energyWaves.push({ x: node.x, y: node.y, radius: 10, maxRadius: 90, alpha: 0.9, speed: 340, color: '#34d399' });
          addFloatingText(rt, node.x, node.y - 20, 'TURRET DOWN!', '#34d399', 1.05);
          rt.boss.channelHits = Math.min(rt.boss.channelHitsNeeded || 4, (rt.boss.channelHits || 0) + 1);
          if ((rt.boss.channelHits || 0) >= (rt.boss.channelHitsNeeded || 4)) {
            rt.boss.channelKind = null;
            rt.boss.channelTimer = 0;
            rt.boss.channelLabel = '';
            rt.boss.channelNodes = [];
            triggerBossExposedWindow(rt, 'SKY BATTERIES SHATTERED — 2X STAGGER!');
          }
          break;
        }
      }
    }

    // Hit Active or Weakened Boss directly with Player Projectiles
    if (
      rt.isBossLevel &&
      rt.boss.health > 0 &&
      rt.boss.state !== 'comic_intro' &&
      rt.boss.state !== 'phase_transition' &&
      rt.boss.state !== 'dead' &&
      pp.pierce > 0
    ) {
      const bcx = rt.boss.x + rt.boss.size / 2;
      const bcy = rt.boss.y + rt.boss.size / 2;
      if (Math.hypot(bcx - pp.x, bcy - pp.y) < rt.boss.size / 2 + pp.radius) {
        const owner = rt.players.find((pl) => pl.id === pp.ownerId) || rt.players[0];
        const isBowShot = pp.kind === 'ranger_arrow' || pp.kind === 'sniper_arrow';
        const isBowCh = rt.boss.channelKind === 'bow_weakpoint' || rt.boss.channelKind === 'sky_battery';
        const allowBurstBypass = pp.kind === 'ranger_arrow' || (isBowCh && isBowShot);
        if ((rt.bossProjBurstCooldowns[pp.ownerId] || 0) <= 0 || allowBurstBypass) {
          handleBossHit(rt, owner, false, Math.max(0, (pp.bossDamage || 1) - 1), isBowShot);
          registerBossInterrupt(
            rt,
            owner,
            pp.kind === 'shadow_kunai' || pp.kind === 'sniper_arrow' || pp.kind === 'cataclysm' ? 2 : 1
          );
          if (pp.kind !== 'ranger_arrow') {
            rt.bossProjBurstCooldowns[pp.ownerId] = isBowCh && isBowShot ? 0.16 : 0.35;
          }
        }
        pp.pierce = 0;
      }
    }

    if (pp.pierce <= 0) {
      rt.playerProjectiles.splice(pi, 1);
    }
  }

  // Telegraph Lines (Railgun, Katana Cuts, Void Rifts)
  for (let ti = rt.telegraphLines.length - 1; ti >= 0; ti--) {
    const tl = rt.telegraphLines[ti];
    tl.timer -= dt;
    if (tl.timer <= 0 && !tl.triggered) {
      tl.triggered = true;
      soundEngine.playBossAttackExecuteSfx(rt.boss.attackPattern || tl.kind);
      rt.screenShake = Math.max(rt.screenShake, 8);

      if (tl.kind === 'railgun') {
        const ang = Math.atan2(tl.y2 - tl.y1, tl.x2 - tl.x1);
        for (let s = 0; s < 5; s++) {
          const sp = 11.5 + s * 1.4;
          pushBossProj(rt, {
            uid: rt.nextUid++,
            x: tl.x1,
            y: tl.y1,
            dx: Math.cos(ang) * sp,
            dy: Math.sin(ang) * sp,
            size: 16,
            speed: 1,
            color: '#ef4444',
            damage: 26,
            shape: 'lance',
          });
        }
        // Instant beam hit check (Heavy Signature Telegraph Attack: 36 DMG; Tank Frontal Shield blocks!)
        rt.players.forEach((p) => {
          if (p.state === 'alive' && pointToSegmentDist(p.x + p.size / 2, p.y + p.size / 2, tl.x1, tl.y1, tl.x2, tl.y2) < p.size * 0.45) {
            if (isBehindTankShield(rt, p, tl.x1, tl.y1)) {
              soundEngine.playParry();
              addFloatingText(rt, p.x + p.size / 2, p.y - 16, 'AEGIS BLOCK!', '#38bdf8', 1.15);
            } else {
              damagePlayer(rt, p, 36);
            }
          }
        });
      } else if (tl.kind === 'void_rift' || tl.kind === 'katana') {
        const steps = 8;
        const ang = Math.atan2(tl.y2 - tl.y1, tl.x2 - tl.x1);
        const perp = ang + Math.PI / 2;
        const splitShape = tl.kind === 'void_rift' ? 'shard' : 'ember';
        for (let s = 1; s < steps; s++) {
          const frac = s / steps;
          const sx = tl.x1 + (tl.x2 - tl.x1) * frac;
          const sy = tl.y1 + (tl.y2 - tl.y1) * frac;
          if (sx < 0 || sx > rt.arenaWidth || sy < 0 || sy > rt.arenaHeight) continue;
          pushBossProj(rt, {
            uid: rt.nextUid++,
            x: sx,
            y: sy,
            dx: Math.cos(perp) * 4.6,
            dy: Math.sin(perp) * 4.6,
            size: 15,
            speed: 1,
            color: tl.color,
            damage: 22,
            shape: splitShape,
          });
          pushBossProj(rt, {
            uid: rt.nextUid++,
            x: sx,
            y: sy,
            dx: -Math.cos(perp) * 4.6,
            dy: -Math.sin(perp) * 4.6,
            size: 15,
            speed: 1,
            color: tl.color,
            damage: 22,
            shape: splitShape,
          });
        }
      }
    }
    if (tl.timer <= -0.18) {
      rt.telegraphLines.splice(ti, 1);
    }
  }

  // Tank 4s Frontal Greatshield actively purifies enemy ground hazard zones on contact
  if (rt.oniCursedZones.length > 0) {
    const shieldHolders = rt.players.filter((pl) => pl.state === 'alive' && pl.frontShieldTimer > 0);
    if (shieldHolders.length > 0) {
      for (let zi = rt.oniCursedZones.length - 1; zi >= 0; zi--) {
        const z = rt.oniCursedZones[zi];
        if (shieldHolders.some((t) => doesFrontShieldInterceptPoint(t, z.x, z.y, z.radius * 0.6))) {
          z.radius -= 115 * dt;
          if (z.radius < 22) {
            rt.score += 65;
            rt.oniCursedZones.splice(zi, 1);
          }
        }
      }
    }
  }

  // Boss logic
  if (rt.isBossLevel) {
    if (rt.bossType === 'mecha') updateMechaBoss(rt, dt);
    else if (rt.bossType === 'void') updateVoidBoss(rt, dt);
    else if (rt.bossType === 'eclipse') updateEclipseBoss(rt, dt);
    else updateOniBoss(rt, dt);

    updateBossCounterChannel(rt, dt);

    const b = rt.boss;
    // Always Attackable Bosses: armed players can strike the boss in any active phase (2x DMG during weakened)
    if (
      b.health > 0 &&
      b.state !== 'comic_intro' &&
      b.state !== 'phase_transition' &&
      b.state !== 'dead'
    ) {
      for (const player of rt.players) {
        if (
          player.state === 'alive' &&
          player.hasKnife &&
          rt.bossHitCooldowns[player.id] <= 0
        ) {
          const reach =
            player.dashImmune &&
            (hasBoon(rt, 'twin_spark') ||
              (!usesWeaponSystem(rt) && player.heroClass === 'ronin') ||
              (usesWeaponSystem(rt) && player.weapon === 'warrior_greatsword'))
              ? 18
              : 0;
          if (
            player.x - reach < b.x + b.size &&
            player.x + player.size + reach > b.x &&
            player.y - reach < b.y + b.size &&
            player.y + player.size + reach > b.y
          ) {
            const outcome = handleBossHit(rt, player, true);
            if (outcome !== 'hit') break;
          }
        }
      }
    }
  }

  // Medkit & Relic Spawns (only during active combat; suppressed in cleared rooms, shops, vaults & tutorial)
  if (shouldAllowArenaCombatSpawns(rt)) {
    rt.medkitSpawnTimer -= dt;
    if (rt.medkitSpawnTimer <= 0) {
      spawnMedkit(rt);
      rt.medkitSpawnTimer = 20 + Math.random() * 18;
    }
    rt.relicSpawnTimer -= dt;
    if (rt.relicSpawnTimer <= 0) {
      spawnRelic(rt);
      rt.relicSpawnTimer = 14 + Math.random() * 10;
    }
  }

  // Medkit pickups (+35 HP Estus Restore)
  for (let mi = rt.medkits.length - 1; mi >= 0; mi--) {
    const m = rt.medkits[mi];
    let picked = false;
    rt.players.forEach((p) => {
      if (picked || p.state !== 'alive') return;
      if (Math.hypot(p.x + p.size / 2 - (m.x + m.size / 2), p.y + p.size / 2 - (m.y + m.size / 2)) < p.size * 0.75 + m.size / 2) {
        if (rt.difficulty === 'hard' && !rt.isTutorial) {
          rt.medkitInventoryCount++;
          p.hp = Math.min(p.maxHp, p.hp + 25);
          addFloatingText(rt, m.x + 12, m.y, '+25 HP & +1 KIT', '#34d399', 1.0);
        } else {
          p.hp = Math.min(p.maxHp, p.hp + 35);
          addFloatingText(rt, p.x + p.size / 2, p.y - 10, '+35 HP ESTUS', '#34d399', 1.1);
        }
        soundEngine.playMedkit();
        rt.medkits.splice(mi, 1);
        picked = true;
      }
    });
  }

  // Relic pickups
  for (let ri = rt.relics.length - 1; ri >= 0; ri--) {
    const r = rt.relics[ri];
    r.lifetime -= dt;
    if (r.lifetime <= 0) {
      rt.relics.splice(ri, 1);
      continue;
    }
    let picked = false;
    rt.players.forEach((p) => {
      if (picked || p.state !== 'alive') return;
      if (Math.hypot(p.x + p.size / 2 - (r.x + r.size / 2), p.y + p.size / 2 - (r.y + r.size / 2)) < p.size * 0.75 + r.size / 2) {
        soundEngine.playPowerup();
        rt.score += Math.round(160 * rt.diffSettings.scoreMultiplier);
        if (r.type === 'overdrive') {
          p.overdriveTimer = 7.0;
          addFloatingText(rt, p.x + p.size / 2, p.y - 12, 'OVERDRIVE!', '#fbbf24', 1.15);
        } else if (r.type === 'shield') {
          p.hasShield = true;
          addFloatingText(rt, p.x + p.size / 2, p.y - 12, 'AEGIS SHIELD!', '#38bdf8', 1.15);
        } else if (r.type === 'magnet') {
          p.magnetTimer = 10.0;
          addFloatingText(rt, p.x + p.size / 2, p.y - 12, 'BLADE MAGNET!', '#c084fc', 1.15);
        } else if (r.type === 'nova') {
          const cleared = rt.bossProjectiles.filter((bp) => bp.type !== 'phantom_clone').length;
          rt.bossProjectiles = rt.bossProjectiles.filter((bp) => bp.type === 'phantom_clone');
          rt.energyWaves.push({ x: p.x + p.size / 2, y: p.y + p.size / 2, radius: 10, maxRadius: 480, alpha: 0.95, speed: 520, color: '#22d3ee' });
          rt.screenShake = Math.max(rt.screenShake, 12);
          addFloatingText(rt, p.x + p.size / 2, p.y - 14, cleared > 0 ? `NOVA! ${cleared} CLEARED` : 'NOVA PULSE!', '#22d3ee', 1.2);
        }
        rt.relics.splice(ri, 1);
        picked = true;
      }
    });
  }

  // Combo timers
  ([1, 2, 3, 4, 5] as const).forEach((pid) => {
    const c = rt.playerCombos[pid];
    if (c && c.timer > 0) {
      c.timer -= dt;
      if (c.timer <= 0) {
        c.count = 0;
        c.timer = 0;
      }
    }
  });

  // Safe zones (explicitly clear invulnerable & auto-expire after 3.5s in Online Campaign so Bug #1 never recurs)
  rt.players.forEach((p) => {
    if (p.state === 'spectator') return;
    const sz = p.id === 1 ? rt.p1SafeZone : rt.p2SafeZone;
    const outOfBox = p.x > sz.x + sz.width || p.y > sz.y + sz.height || p.x + p.size < sz.x || p.y + p.size < sz.y;
    const expiredCampaignPad = rt.isOnlineCampaign && rt.stageElapsed > 3.5;
    if (!p.safeZoneClosed && (outOfBox || expiredCampaignPad)) {
      p.inSafeZone = false;
      p.safeZoneClosed = true;
      p.invulnerable = false;
    }
  });

  // Co-op revive (deterministic invulnFrames instead of setTimeout; nerfed Holy Staff passive revive bonus)
  const alivePlayers = rt.players.filter((p) => p.state === 'alive');
  const downPlayers = rt.players.filter((p) => p.state === 'down');
  if (rt.numPlayers >= 2 && alivePlayers.length > 0 && downPlayers.length > 0) {
    downPlayers.forEach((downP) => {
      let reviving = false;
      alivePlayers.forEach((aliveP) => {
        const dist = Math.hypot(aliveP.x + aliveP.size / 2 - (downP.x + downP.size / 2), aliveP.y + aliveP.size / 2 - (downP.y + downP.size / 2));
        const canRevive = rt.difficulty !== 'hard' || rt.medkitInventoryCount > 0;
        if (dist < aliveP.size * 1.25 && canRevive) {
          reviving = true;
          const reviveMult = aliveP.weapon === 'holy_staff' ? 1.25 : 1.0;
          downP.reviveProgress += dt * reviveMult;
          if (downP.reviveProgress >= REVIVE_TIME) {
            if (rt.difficulty === 'hard') rt.medkitInventoryCount = Math.max(0, rt.medkitInventoryCount - 1);
            downP.state = 'alive';
            downP.invulnerable = false;
            downP.invulnFrames = 2.0;
            downP.reviveProgress = 0;
            downP.hp = Math.min(downP.maxHp, 50);
            soundEngine.playRevive();
            addFloatingText(rt, downP.x + downP.size / 2, downP.y - 12, 'REVIVED!', '#34d399', 1.2);
          }
        }
      });
      if (!reviving) downP.reviveProgress = Math.max(0, downP.reviveProgress - dt * 0.5);
    });
  }

  // Boss Projectiles + Graze mechanic
  for (let i = rt.bossProjectiles.length - 1; i >= 0; i--) {
    const proj = rt.bossProjectiles[i];
    if (!proj) continue;

    if (proj.type === 'boomerang') {
      proj.age = (proj.age || 0) + dt;
      if (proj.age > (proj.turnTime || 0.7) && !proj.returned) {
        const cx2 = rt.boss.x + rt.boss.size / 2;
        const cy2 = rt.boss.y + rt.boss.size / 2;
        const tbx = cx2 - proj.x;
        const tby = cy2 - proj.y;
        const td = Math.hypot(tbx, tby) || 1;
        const bsp = Math.hypot(proj.dx, proj.dy);
        proj.dx = (tbx / td) * bsp * 1.15;
        proj.dy = (tby / td) * bsp * 1.15;
        proj.returned = true;
      }
    } else if (proj.type === 'mine') {
      proj.timer = (proj.timer || 0) + dt;
      proj.lifetime = (proj.lifetime || 5) - dt;
      if (proj.lifetime <= 0) {
        rt.bossProjectiles.splice(i, 1);
        continue;
      }
      if (proj.timer > (proj.warningTime || 1.7)) proj.armed = true;
      if (proj.armed) {
        let exploded = false;
        rt.players.forEach((player) => {
          if (!exploded && player.state === 'alive') {
            if (Math.hypot(player.x + player.size / 2 - (proj.x + proj.size / 2), player.y + player.size / 2 - (proj.y + proj.size / 2)) < 58) {
              const shrapnelCount = rt.difficulty === 'hard' ? 12 : 8;
              for (let j = 0; j < shrapnelCount; j++) {
                const ba = (j / shrapnelCount) * Math.PI * 2;
                pushBossProj(rt, { uid: rt.nextUid++, x: proj.x, y: proj.y, dx: Math.cos(ba) * 4.6, dy: Math.sin(ba) * 4.6, size: 14, speed: 1, color: '#f97316', damage: 22, shape: 'ember' });
              }
              soundEngine.playBossShoot();
              exploded = true;
            }
          }
        });
        if (exploded) {
          rt.bossProjectiles.splice(i, 1);
          continue;
        }
      }
    } else if (proj.type === 'homing') {
      const tp = getRandomAlivePlayer(rt);
      const dx2 = tp.x + tp.size / 2 - proj.x;
      const dy2 = tp.y + tp.size / 2 - proj.y;
      const d2 = Math.hypot(dx2, dy2) || 1;
      const hs = proj.homingStr || 0.08;
      proj.dx += (dx2 / d2) * hs;
      proj.dy += (dy2 / d2) * hs;
      const sp2 = Math.hypot(proj.dx, proj.dy);
      if (sp2 > 5.6) {
        proj.dx = (proj.dx / sp2) * 5.6;
        proj.dy = (proj.dy / sp2) * 5.6;
      }
    } else if (proj.type === 'phantom_clone') {
      proj.lifetime = (proj.lifetime || 0) - dt;
      if (proj.lifetime <= 0) {
        rt.bossProjectiles.splice(i, 1);
        continue;
      }
      if (!proj.canDamage) {
        proj.spawnInvulnerability = (proj.spawnInvulnerability || 0.6) - dt;
        if (proj.spawnInvulnerability <= 0) proj.canDamage = true;
      }
      proj.shootTimer = (proj.shootTimer || 0) - dt;
      if (proj.shootTimer <= 0) {
        proj.shootTimer = proj.shootInterval || 0.55;
        const tp2 = getRandomAlivePlayer(rt);
        const dx3 = tp2.x + tp2.size / 2 - (proj.x + proj.size / 2);
        const dy3 = tp2.y + tp2.size / 2 - (proj.y + proj.size / 2);
        const d4 = Math.hypot(dx3, dy3) || 1;
        pushBossProj(rt, { uid: rt.nextUid++, x: proj.x + proj.size / 2, y: proj.y + proj.size / 2, dx: (dx3 / d4) * 6.2, dy: (dy3 / d4) * 6.2, size: 14, speed: 1, color: rt.boss.phase === 2 ? '#f43f5e' : '#c084fc', damage: 15, shape: 'shard' });
        soundEngine.playBossShoot();
      }
      continue;
    }

    if (proj.type !== 'mine') {
      const bulletTimeScale = rt.cheats.chronoSlowBullets ? 0.25 : 1;
      proj.x += proj.dx * proj.speed * bulletTimeScale * (dt * 60);
      proj.y += proj.dy * proj.speed * bulletTimeScale * (dt * 60);
    }

    if (proj.x < -proj.size * 2 || proj.x > rt.arenaWidth + proj.size * 2 || proj.y < -proj.size * 2 || proj.y > rt.arenaHeight + proj.size * 2) {
      rt.bossProjectiles.splice(i, 1);
      continue;
    }

    // Active Sanctuary Tether Beam between nearby Co-op teammates physically vaporizes incoming projectiles!
    if (rt.eclipseSanctuaryActive && alivePlayers.length >= 2) {
      let vaporized = false;
      for (let a = 0; a < alivePlayers.length && !vaporized; a++) {
        for (let bIdx = a + 1; bIdx < alivePlayers.length; bIdx++) {
          const pa = alivePlayers[a];
          const pb = alivePlayers[bIdx];
          if (Math.hypot(pa.x - pb.x, pa.y - pb.y) > 225) continue;
          const beamDist = pointToSegmentDist(
            proj.x + proj.size / 2,
            proj.y + proj.size / 2,
            pa.x + pa.size / 2,
            pa.y + pa.size / 2,
            pb.x + pb.size / 2,
            pb.y + pb.size / 2
          );
          if (beamDist < proj.size * 0.65 + 14) {
            vaporized = true;
            break;
          }
        }
      }
      if (vaporized) {
        rt.score += 35;
        addParticle(rt, {
          x: proj.x + proj.size / 2,
          y: proj.y + proj.size / 2,
          dx: (Math.random() - 0.5) * 120,
          dy: (Math.random() - 0.5) * 120,
          alpha: 1,
          size: 4,
          color: '#34d399',
        });
        rt.bossProjectiles.splice(i, 1);
        continue;
      }
    }

    // Tank 4s Frontal Greatshield deletes & purifies incoming enemy projectiles
    {
      const px = proj.x + proj.size / 2;
      const py = proj.y + proj.size / 2;
      const blocker = rt.players.find((pl) => doesFrontShieldInterceptPoint(pl, px, py, proj.size * 0.45));
      if (blocker) {
        rt.score += 25;
        addParticle(rt, {
          x: px,
          y: py,
          dx: (Math.random() - 0.5) * 140,
          dy: (Math.random() - 0.5) * 140,
          alpha: 1,
          size: 4.5,
          color: '#7dd3fc',
        });
        if (!rt.floatingTexts.some((ft) => ft.text === 'PURIFIED!' && ft.lifetime > 0.65)) {
          addFloatingText(rt, blocker.x + blocker.size / 2, blocker.y - 16, 'PURIFIED!', '#38bdf8', 0.95);
        }
        rt.bossProjectiles.splice(i, 1);
        continue;
      }
    }

    for (const player of rt.players) {
      if (player.state !== 'alive') continue;
      const isHittable =
        !player.dashImmune &&
        player.cloakTimer <= 0 &&
        !player.invulnerable &&
        player.postDashInvulnerability <= 0 &&
        player.invulnFrames <= 0;
      const canDmg = proj.canDamage !== false;
      if (
        isHittable &&
        canDmg &&
        player.x < proj.x + proj.size &&
        player.x + player.size > proj.x &&
        player.y < proj.y + proj.size &&
        player.y + player.size > proj.y
      ) {
        damagePlayer(rt, player, proj.damage ?? 16);
        rt.bossProjectiles.splice(i, 1);
        break;
      }
    }
  }

  // Enemies
  for (let i = rt.enemies.length - 1; i >= 0; i--) {
    const e = rt.enemies[i];
    if (!e) continue;
    if (e.hitFlashTimer && e.hitFlashTimer > 0) {
      e.hitFlashTimer = Math.max(0, e.hitFlashTimer - dt);
    }
    const isStunned = Boolean(e.stunTimer && e.stunTimer > 0);
    if (isStunned) {
      e.stunTimer = Math.max(0, (e.stunTimer || 0) - dt);
    } else {
      e.rotation += dt * 4.5;

      const zoneSlow = rt.skillZones.some(
        (z) => z.kind === 'holy_ground' && Math.hypot(e.x + e.size / 2 - z.x, e.y + e.size / 2 - z.y) <= z.radius
      )
        ? 0.6
        : 1;

      if (e.type === 'charger') {
        e.chargeTimer = (e.chargeTimer || 0) - dt;
        if (e.chargeState === 'roam') {
          e.x += e.dx * e.speed * (dt * 60) * zoneSlow;
          e.y += e.dy * e.speed * (dt * 60) * zoneSlow;
          if (e.chargeTimer <= 0) {
            e.chargeState = 'telegraph';
            e.chargeTimer = 0.65;
            const tp = getRandomAlivePlayer(rt);
            e.chargeTargetX = tp.x + tp.size / 2;
            e.chargeTargetY = tp.y + tp.size / 2;
          }
        } else if (e.chargeState === 'telegraph') {
          if (e.chargeTimer <= 0) {
            e.chargeState = 'lunge';
            e.chargeTimer = 0.55;
            const dx = (e.chargeTargetX || rt.arenaWidth / 2) - (e.x + e.size / 2);
            const dy = (e.chargeTargetY || rt.arenaHeight / 2) - (e.y + e.size / 2);
            const d = Math.hypot(dx, dy) || 1;
            e.dx = dx / d;
            e.dy = dy / d;
          }
        } else if (e.chargeState === 'lunge') {
          e.x += e.dx * e.speed * 3.4 * (dt * 60) * zoneSlow;
          e.y += e.dy * e.speed * 3.4 * (dt * 60) * zoneSlow;
          if (e.chargeTimer <= 0) {
            e.chargeState = 'roam';
            e.chargeTimer = 1.6 + Math.random() * 1.4;
          }
        }
      } else if (e.type === 'void_stalker') {
        e.x += e.dx * e.speed * (dt * 60) * zoneSlow;
        e.y += e.dy * e.speed * (dt * 60) * zoneSlow;
        e.blinkTimer = (e.blinkTimer || 2) - dt;
        e.alpha = e.blinkTimer < 0.4 ? 0.35 : 1.0;
        if (e.blinkTimer <= 0) {
          e.blinkTimer = 2.4 + Math.random() * 1.6;
          const tp = getRandomAlivePlayer(rt);
          const angle = Math.random() * Math.PI * 2;
          e.x = Math.max(20, Math.min(rt.arenaWidth - e.size - 20, tp.x + Math.cos(angle) * 140));
          e.y = Math.max(20, Math.min(rt.arenaHeight - e.size - 20, tp.y + Math.sin(angle) * 140));
        }
      } else if (e.type === 'oni_acolyte') {
        e.x += e.dx * e.speed * (dt * 60) * zoneSlow;
        e.y += e.dy * e.speed * (dt * 60) * zoneSlow;
        e.shootTimer = (e.shootTimer || 2) - dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = 2.6 + Math.random() * 1.2;
          const tp = getRandomAlivePlayer(rt);
          const dx = tp.x + tp.size / 2 - (e.x + e.size / 2);
          const dy = tp.y + tp.size / 2 - (e.y + e.size / 2);
          const d = Math.hypot(dx, dy) || 1;
          pushBossProj(rt, { uid: rt.nextUid++, x: e.x + e.size / 2, y: e.y + e.size / 2, dx: (dx / d) * 3.8, dy: (dy / d) * 3.8, size: 13, speed: 1, color: '#f97316', damage: 15, shape: 'ember' });
          soundEngine.playBossShoot();
        }
      } else {
        e.x += e.dx * e.speed * (dt * 60) * zoneSlow;
        e.y += e.dy * e.speed * (dt * 60) * zoneSlow;
      }

      if (e.x <= 0) { e.x = 0; e.dx = Math.abs(e.dx); }
      if (e.x + e.size >= rt.arenaWidth) { e.x = rt.arenaWidth - e.size; e.dx = -Math.abs(e.dx); }
      if (e.y <= 0) { e.y = 0; e.dy = Math.abs(e.dy); }
      if (e.y + e.size >= rt.arenaHeight) { e.y = rt.arenaHeight - e.size; e.dy = -Math.abs(e.dy); }
    }

    for (const player of rt.players) {
      if (player.state !== 'alive') continue;
      const bladeReach =
        player.hasKnife && player.dashImmune
          ? (hasBoon(rt, 'twin_spark') ? 22 : 12) +
            ((!usesWeaponSystem(rt) && player.heroClass === 'ronin') ||
            (usesWeaponSystem(rt) && player.weapon === 'warrior_greatsword')
              ? 14
              : 0)
          : 0;
      const overlaps =
        player.x - bladeReach < e.x + e.size &&
        player.x + player.size + bladeReach > e.x &&
        player.y - bladeReach < e.y + e.size &&
        player.y + player.size + bladeReach > e.y;

      if (overlaps) {
        if (player.hasKnife) {
          const strikeDmg =
            2 +
            (player.empoweredStrike ? 2 : 0) +
            (hasBoon(rt, 'berserker_blade') ? 1 : 0) +
            (player.weapon === 'warrior_greatsword' || (!usesWeaponSystem(rt) && player.heroClass === 'ronin') ? 1 : 0);
          if (player.empoweredStrike) player.empoweredStrike = false;
          if (!rt.cheats.alwaysArmed) {
            player.hasKnife = false;
            repositionKnifeForPlayer(rt, player);
          }
          player.postDashInvulnerability = Math.max(player.postDashInvulnerability, 0.28);
          rt.screenShake = Math.max(rt.screenShake, 8);
          rt.freezeTime = 0.045;
          const hitX = e.x + e.size / 2;
          const hitY = e.y + e.size / 2;
          const cleaveTargets = rt.enemies.filter(
            (other) =>
              other &&
              other !== e &&
              Math.hypot(other.x + other.size / 2 - hitX, other.y + other.size / 2 - hitY) <= 58
          );
          damageEnemy(rt, i, player.id, strikeDmg, player.facingAngle, player.color);
          addSlashArc(rt, hitX, hitY, player.facingAngle, player.color, 58);
          // Blade Orb Cleave AoE Splash to nearby dungeon enemies within 58px
          for (const target of cleaveTargets) {
            const tIdx = rt.enemies.indexOf(target);
            if (tIdx === -1) continue;
            const killedCleave = damageEnemy(rt, tIdx, player.id, 1, player.facingAngle, player.color);
            if (killedCleave && tIdx < i) {
              i--;
            }
          }
          i = Math.min(i, rt.enemies.length);
          break;
        } else if (
          !isStunned &&
          !player.inSafeZone &&
          !player.invulnerable &&
          !player.dashImmune &&
          player.cloakTimer <= 0 &&
          player.postDashInvulnerability <= 0 &&
          player.invulnFrames <= 0
        ) {
          damagePlayer(rt, player, e.type === 'charger' && e.chargeState === 'lunge' ? 24 : 16);
        }
      }
    }
  }

  // Knives pickup + magnet + hidden 6.5s lucky-spawn expiration
  rt.players.forEach((player) => {
    if (player.state !== 'alive') return;
    rt.knives.forEach((knife) => {
      if (knife.owner !== player.id) return;
      knife.bobPhase += dt * 4;

      if (!player.hasKnife && knife.luckyTimer && knife.luckyTimer > 0) {
        knife.luckyTimer -= dt;
        if (knife.luckyTimer <= 0) {
          knife.luckyTimer = 0;
          const pos = getStandardKnifePos(rt, knife.size);
          knife.x = pos.x;
          knife.y = pos.y;
        }
      }

      if (!player.hasKnife) {
        const dx = player.x + player.size / 2 - (knife.x + knife.size / 2);
        const dy = player.y + player.size / 2 - (knife.y + knife.size / 2);
        const dist = Math.hypot(dx, dy) || 1;
        const hasMagnet = player.magnetTimer > 0 || hasBoon(rt, 'blade_magnet');
        if (hasMagnet || dist <= 78) {
          const pullSpeed = player.magnetTimer > 0 ? 295 : hasBoon(rt, 'blade_magnet') ? 210 : 190;
          knife.x += (dx / dist) * pullSpeed * dt;
          knife.y += (dy / dist) * pullSpeed * dt;
        }
      }

      const pickPad = 6;
      if (
        !player.hasKnife &&
        player.x - pickPad < knife.x + knife.size &&
        player.x + player.size + pickPad > knife.x &&
        player.y - pickPad < knife.y + knife.size &&
        player.y + player.size + pickPad > knife.y
      ) {
        player.hasKnife = true;
        knife.luckyTimer = 0;
        soundEngine.playBladePickup();
        // Holy Staff nerfed passive: +2 HP on Blade pickup (3.5s internal cooldown)
        if (player.weapon === 'holy_staff' && player.bladeHealCd <= 0 && player.hp < player.maxHp) {
          player.hp = Math.min(player.maxHp, player.hp + 2);
          player.bladeHealCd = 3.5;
          addFloatingText(rt, player.x + player.size / 2, player.y - 10, '+2 HP GRACE', '#fde047', 0.8);
        }
      }
    });
  });

  // Online Campaign Interactive Props: Chests, Weapon Drops, Skill Scrolls, Shop Pedestals & Persistent Connected Gates
  if (rt.isOnlineCampaign) {
    // 1. Weapon Drops (pop-out arc + auto-equip if unarmed; press [E] near drop to swap)
    for (let wi = rt.weaponDrops.length - 1; wi >= 0; wi--) {
      const wd = rt.weaponDrops[wi];
      wd.bob += dt * 3.5;
      if (wd.popTimer && wd.popTimer > 0) {
        wd.popTimer = Math.max(0, wd.popTimer - dt);
      }
      if (wd.swapLockTimer > 0) wd.swapLockTimer = Math.max(0, wd.swapLockTimer - dt);
      if (wd.swapLockTimer <= 0 && (!wd.popTimer || wd.popTimer <= 0.08)) {
        const unarmedFinder = rt.players.find(
          (pl) => pl.state === 'alive' && pl.weapon === 'none' && Math.hypot(pl.x + pl.size / 2 - wd.x, pl.y + pl.size / 2 - wd.y) <= 38
        );
        if (unarmedFinder) {
          rt.weaponDrops.splice(wi, 1);
          equipWeapon(rt, unarmedFinder, wd.weaponId);
        }
      }
    }

    // 1b. Specific Skill Scrolls (pop-out arc + pickup into Minecraft-style Scroll Bag [I])
    for (let si = rt.scrollDrops.length - 1; si >= 0; si--) {
      const sd = rt.scrollDrops[si];
      sd.bob += dt * 4.2;
      if (sd.popTimer && sd.popTimer > 0) {
        sd.popTimer = Math.max(0, sd.popTimer - dt);
      }
      if (sd.lockTimer > 0) sd.lockTimer = Math.max(0, sd.lockTimer - dt);
      if (sd.lockTimer > 0 || (sd.popTimer && sd.popTimer > 0.08)) continue;

      const tw = sd.targetWeapon;
      const slot = sd.skillSlot || 2;
      const wDef = WEAPONS_CATALOG.find((w) => w.id === tw);
      const sk = wDef?.skills[slot - 1];
      const holderNeedsIt = rt.players.some(
        (tm) =>
          tm.state === 'alive' &&
          tm.weapon === tw &&
          tm.scrollBag.length < 8 &&
          !hasLearnedSlot(tm, tw, slot)
      );
      const picker = rt.players.find((pl) => {
        if (pl.state !== 'alive') return false;
        if (pl.scrollBag.length >= 8) return false;
        if (Math.hypot(pl.x + pl.size / 2 - sd.x, pl.y + pl.size / 2 - sd.y) > 40) return false;
        if (holderNeedsIt && pl.weapon !== tw) return false;
        return true;
      });
      if (picker) {
        rt.scrollDrops.splice(si, 1);
        soundEngine.playPowerup();
        const scrollColor = wDef?.accent || '#c084fc';
        rt.energyWaves.push({ x: sd.x, y: sd.y, radius: 10, maxRadius: 110, alpha: 0.9, speed: 360, color: scrollColor });
        picker.scrollBag.push({
          id: rt.nextUid++,
          targetWeapon: tw,
          skillSlot: slot,
        });
        addFloatingText(
          rt,
          sd.x,
          sd.y - 18,
          `+SCROLL: ${wDef?.shortTag || 'SKILL'} [${sk?.keyLabel || 'Q'}] -> BAG [I]`,
          scrollColor,
          1.2
        );
      }
    }

    // 2. Chests (pre-open tremble -> spring lid burst -> pop-out drops & flying gold coin burst)
    rt.chests.forEach((ch) => {
      if (ch.opened) {
        ch.openAnim = Math.min(1, ch.openAnim + dt * 1.55);
        if (ch.openAnim >= 0.4 && !ch.lootSpawned) {
          ch.lootSpawned = true;
          soundEngine.playBoonSelect();
          rt.energyWaves.push({ x: ch.x, y: ch.y - 4, radius: 10, maxRadius: 165, alpha: 0.95, speed: 360, color: '#fbbf24' });
          for (let k = 0; k < 18; k++) {
            const a = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7 + (Math.random() - 0.5) * 0.9;
            const sp = 95 + Math.random() * 190;
            addParticle(rt, {
              x: ch.x + (Math.random() - 0.5) * 14,
              y: ch.y - 8,
              dx: Math.cos(a) * sp,
              dy: Math.sin(a) * sp - 35,
              alpha: 1,
              size: 3 + Math.random() * 2.5,
              color: k % 3 === 0 ? '#ffffff' : k % 2 === 0 ? '#fde047' : '#fb923c',
            });
          }

          const activeParty = rt.players.filter((pl) => pl.state !== 'spectator');
          const perPlayer = Math.max(4, Math.round((ch.coinsTotal || 14) / Math.max(1, activeParty.length)));
          activeParty.forEach((pl) => {
            pl.coins += perPlayer;
          });
          rt.coinBursts.push({
            id: rt.nextUid++,
            x: ch.x,
            y: ch.y - 12,
            amount: perPlayer,
            ttl: 0.7,
          });

          if (ch.rewardKind === 'weapon') {
            const wid = ch.weaponId || pickRandomWeaponId(rt, true);
            const dropAngle = (Math.random() - 0.5) * 0.9 + Math.PI / 2;
            const destX = Math.max(80, Math.min(rt.arenaWidth - 80, ch.x + Math.cos(dropAngle) * 44));
            const destY = Math.max(95, Math.min(rt.arenaHeight - 95, ch.y + 38));
            rt.weaponDrops.push({
              id: rt.nextUid++,
              weaponId: wid,
              x: destX,
              y: destY,
              size: 28,
              bob: 0,
              swapLockTimer: 0.58,
              popTimer: 0.58,
              popDuration: 0.58,
              popFromX: ch.x,
              popFromY: ch.y - 6,
              popArcHeight: 48,
            });
            const wDef = WEAPONS_CATALOG.find((w) => w.id === wid);
            addFloatingText(
              rt,
              ch.x,
              ch.y - 28,
              `CHEST: ${wDef?.name.toUpperCase() || 'WEAPON'} +${perPlayer}g EACH!`,
              wDef?.accent || '#38bdf8',
              1.25
            );
          } else {
            addFloatingText(
              rt,
              ch.x,
              ch.y - 28,
              ch.rewardKind === 'treasure' ? `VAULT TREASURE: +${perPlayer}g EACH!` : `+${perPlayer}g EACH PLAYER!`,
              '#fbbf24',
              1.3
            );
          }

          const opener =
            rt.players.find((pl) => pl.state === 'alive' && Math.hypot(pl.x + pl.size / 2 - ch.x, pl.y + pl.size / 2 - ch.y) <= 95) ||
            rt.players.find((pl) => pl.state === 'alive') ||
            rt.players[0];

          if (ch.bonusPotions && ch.bonusPotions > 0) {
            if (ch.rewardKind === 'treasure') {
              activeParty.forEach((pl) => {
                pl.potions = Math.min(2, pl.potions + ch.bonusPotions!);
              });
              addFloatingText(rt, ch.x, ch.y - 44, `+${ch.bonusPotions} PARTY FLASK (MAX 2)!`, '#34d399', 1.15);
            } else if (opener) {
              opener.potions = Math.min(2, opener.potions + ch.bonusPotions);
              addFloatingText(rt, opener.x + opener.size / 2, opener.y - 22, `+${ch.bonusPotions} FLASK [C] (MAX 2)`, '#34d399', 1.15);
            }
          }

          if (ch.bonusScrollWeapon) {
            spawnSkillScroll(rt, ch.x + 62, ch.y + 16, ch.bonusScrollWeapon, ch.bonusScrollSlot || 2, {
              popFromX: ch.x,
              popFromY: ch.y - 8,
              popDuration: 0.62,
              popArcHeight: 54,
              lockTimer: 0.62,
            });
          }
        }
        return;
      }

      const opener = rt.players.find(
        (pl) => pl.state === 'alive' && Math.hypot(pl.x + pl.size / 2 - ch.x, pl.y + pl.size / 2 - ch.y) <= 44
      );
      if (opener) {
        ch.opened = true;
        ch.openAnim = 0;
        ch.lootSpawned = false;
        soundEngine.playUiClick();
      }
    });

    // 3. Connected Floor Hallways (walk down the stone corridor through the far threshold)
    if (rt.gates.length > 0 && alivePlayers.length > 0) {
      let enteredGate: DungeonGate | null = null;
      rt.gates.forEach((g) => {
        g.playersInside = [];
        let thresholdHits = 0;
        const hb = getGateHallwayBounds(g, rt.arenaWidth, rt.arenaHeight);

        alivePlayers.forEach((pl) => {
          const pcx = pl.x + pl.size / 2;
          const pcy = pl.y + pl.size / 2;
          if (!hb) {
            if (pcx >= g.x - 10 && pcx <= g.x + g.width + 10 && pcy >= g.y - 10 && pcy <= g.y + g.height + 10) {
              g.playersInside.push(pl.id);
              thresholdHits++;
            }
          } else {
            const inCorridor =
              pcx >= hb.corridorX - 6 &&
              pcx <= hb.corridorX + hb.corridorW + 6 &&
              pcy >= hb.corridorY - 6 &&
              pcy <= hb.corridorY + hb.corridorH + 6;
            if (inCorridor) {
              g.playersInside.push(pl.id);
              const atThreshold =
                pcx >= hb.thresholdX - 8 &&
                pcx <= hb.thresholdX + hb.thresholdW + 8 &&
                pcy >= hb.thresholdY - 8 &&
                pcy <= hb.thresholdY + hb.thresholdH + 8;
              if (atThreshold) {
                thresholdHits++;
              }
            }
          }
        });

        const allInHallway = g.playersInside.length === alivePlayers.length;
        const readyToCross =
          alivePlayers.length === 1
            ? thresholdHits >= 1
            : allInHallway && thresholdHits >= 1;

        if (readyToCross) {
          const fillTime = !hb ? 0.65 : alivePlayers.length === 1 ? 0.14 : 0.38;
          g.holdProgress = Math.min(1, g.holdProgress + dt / fillTime);
          if (g.holdProgress >= 1 && !enteredGate) {
            enteredGate = g;
          }
        } else {
          g.holdProgress = Math.max(0, g.holdProgress - dt * 1.6);
        }
      });
      if (enteredGate) {
        soundEngine.playParry();
        enterDungeonGate(rt, enteredGate);
        return;
      }
    }
  }

  // Dungeon Wave Clean-Dodge cadence (reward staying unhit during enemy skirmishes)
  if (!rt.isBossLevel && !rt.isTutorial && rt.enemies.length > 0 && !rt.introPlaying) {
    rt.dungeonCleanDodgeTimer += dt;
    if (rt.dungeonCleanDodgeTimer >= 5.0) {
      rt.dungeonCleanDodgeTimer = 0;
      rt.players.forEach((p) => {
        if (p.state === 'alive' && !p.cleanDodgeFailed) {
          awardCleanDodge(rt, p);
        }
        p.cleanDodgeFailed = false;
      });
    }
  }

  // Tutorial mode uses interactive training drills instead of Game Over / Stage Progression
  if (rt.isTutorial) {
    stepTutorial(rt, dt);
    return;
  }

  // Boss Teamwork Practice Mode: Auto-revive downed players/bots, refill boss HP, and auto-cycle Teamwork Attacks
  if (rt.isTeamworkPractice) {
    rt.players.forEach((pl) => {
      if (pl.state === 'down') {
        pl.reviveProgress += dt;
        if (pl.reviveProgress >= 1.8) {
          pl.state = 'alive';
          pl.hp = pl.maxHp;
          pl.reviveProgress = 0;
          pl.invulnFrames = 1.6;
          soundEngine.playRevive();
          addFloatingText(rt, pl.x + pl.size / 2, pl.y - 14, 'PRACTICE REVIVED!', '#34d399', 1.1);
        }
      }
    });
    if (rt.boss.health < Math.max(10, rt.boss.maxHealth * 0.15)) {
      rt.boss.health = rt.boss.maxHealth;
      rt.boss.phase = 1;
      addFloatingText(rt, rt.boss.x + rt.boss.size / 2, rt.boss.y - 20, 'BOSS HP RESET!', '#38bdf8', 1.15);
    }
    if (rt.boss.state === 'weakened' && rt.boss.stateTimer > 2.4) {
      rt.boss.stateTimer = 2.4;
    }
    if (!rt.boss.channelKind && !rt.introPlaying && rt.boss.state !== 'comic_intro' && rt.boss.state !== 'dead') {
      rt.practiceAttackTimer -= dt;
      if (rt.practiceAttackTimer <= 0) {
        if (rt.boss.state === 'weakened' || rt.boss.state === 'phase_transition') {
          rt.boss.state = 'idle';
          rt.boss.stateTimer = 1.6;
        }
        startBossCounterChannel(rt);
        rt.boss.attacksBeforeVulnerable++;
        rt.practiceAttackTimer = 5.5;
      }
    }
    return;
  }

  // Game Over check
  const activePlayers = rt.players.filter((p) => p.state !== 'spectator');
  if (!rt.gameOver && activePlayers.every((p) => p.state === 'down')) {
    rt.gameOver = true;
    soundEngine.stopMusic();
    soundEngine.playLose();
    rt.pendingEvent = { type: 'GAME_OVER' };
    return;
  }

  // Wave & Stage progression
  if (!rt.isBossLevel && rt.enemies.length === 0 && !rt.introPlaying) {
    if (rt.isOnlineCampaign) {
      const room = rt.floorGrid[rt.currentRoomKey];
      if (room && !room.cleared && (room.kind === 'combat' || room.kind === 'start') && rt.gates.length === 0) {
        if (rt.roomWave < rt.roomTotalWaves) {
          rt.roomWave++;
          rt.waveNumber = rt.roomWave;
          spawnWaveEnemies(rt, rt.stage, rt.roomWave);
          showPhaseAnnounce(rt, `WAVE ${rt.roomWave}/${rt.roomTotalWaves} INCOMING!`, '#fb923c', 2.4);
        } else {
          room.cleared = true;
          rt.floorMapRev++;
          rt.bossProjectiles = [];
          const cxDrop = rt.lastKilledPos ? rt.lastKilledPos.x : rt.arenaWidth / 2;
          const cyDrop = rt.lastKilledPos ? rt.lastKilledPos.y : rt.arenaHeight / 2;
          spawnRoomChest(rt, cxDrop, cyDrop);
          saveCurrentRoomState(rt);
          spawnConnectedGates(rt, room);
          soundEngine.playParry();
          showPhaseAnnounce(rt, 'ROOM CLEARED! OPEN CHEST & CHOOSE A GATE!', '#34d399', 2.8);
        }
      }
    } else if (rt.stage === 'ironDungeon' && rt.waveNumber === 1) {
      rt.waveNumber = 2;
      showPhaseAnnounce(rt, 'WAVE 2 — VANGUARD DEPLOYED', '#38bdf8', 2.0);
      spawnWaveEnemies(rt, 'ironDungeon', 2);
    } else if (rt.stage === 'ironDungeon') {
      setupBossStage(rt, 'mechaBoss');
      rt.introPlaying = true;
      rt.introTimer = 0;
    } else if (rt.stage === 'voidDungeon') {
      setupBossStage(rt, 'voidBoss');
      rt.introPlaying = true;
      rt.introTimer = 0;
    } else if (rt.stage === 'oniDungeon') {
      setupBossStage(rt, 'oniBoss');
      rt.introPlaying = true;
      rt.introTimer = 0;
    }
  }

  // Boss defeated -> Dramatic Multi-Stage Collapse, Chain Detonations & Supernova
  if (rt.isBossLevel && rt.boss.state === 'dead') {
    const b = rt.boss;
    const cx = b.x + b.size / 2;
    const cy = b.y + b.size / 2;
    const bossAccent =
      rt.bossType === 'mecha'
        ? '#38bdf8'
        : rt.bossType === 'void'
        ? '#c084fc'
        : rt.bossType === 'eclipse'
        ? '#fbbf24'
        : '#f97316';

    rt.players.forEach((p) => {
      if (p.state === 'alive') p.invulnerable = true;
    });

    rt.bossDeadTimer += dt;
    rt.timeScale = rt.bossDeadTimer < 0.55 ? 0.22 : 1;
    b.shakeIntensity = rt.bossDeadTimer < 2.5 ? 10 + rt.bossDeadTimer * 9 : 0;

    // Chain Core Overload Ruptures (0.5s -> 2.4s)
    if (rt.bossDeadTimer >= 0.5 && rt.bossDeadTimer < 2.45) {
      const beat = Math.floor((rt.bossDeadTimer - 0.5) / 0.34) + 1;
      if (beat > rt.bossDeadBeat) {
        rt.bossDeadBeat = beat;
        const ox = cx + (Math.random() - 0.5) * b.size * 0.75;
        const oy = cy + (Math.random() - 0.5) * b.size * 0.75;
        rt.screenShake = Math.max(rt.screenShake, 14);
        rt.energyWaves.push({ x: ox, y: oy, radius: 10, maxRadius: 240, alpha: 0.9, speed: 380, color: beat % 2 === 0 ? '#ffffff' : bossAccent });
        rt.comicSlashes.push({ x: ox - 120, y: oy, angle: Math.random() * Math.PI, length: 240, alpha: 0.95, thickness: 4, timer: 0, lifetime: 0.4 });
        for (let k = 0; k < 14; k++) {
          const a = (k / 14) * Math.PI * 2 + Math.random() * 0.3;
          const sp = 140 + Math.random() * 220;
          addParticle(rt, { x: ox, y: oy, dx: Math.cos(a) * sp, dy: Math.sin(a) * sp, alpha: 1, size: 4, color: k % 2 === 0 ? '#fde047' : bossAccent });
        }
      }
    }

    // Final Soul-Shatter Supernova at 2.5s
    if (rt.bossDeadTimer >= 2.5 && rt.bossDeadBeat < 99) {
      rt.bossDeadBeat = 99;
      rt.warningFlash = 0.78;
      rt.screenShake = 34;
      rt.energyWaves.push({ x: cx, y: cy, radius: 22, maxRadius: 860, alpha: 1, speed: 520, color: '#ffffff' });
      rt.energyWaves.push({ x: cx, y: cy, radius: 18, maxRadius: 680, alpha: 0.95, speed: 420, color: '#fde047' });
      rt.energyWaves.push({ x: cx, y: cy, radius: 14, maxRadius: 520, alpha: 0.9, speed: 340, color: bossAccent });
      rt.deathEffects.push({ type: 'shockwave', x: cx, y: cy, radius: 16, maxRadius: 420, alpha: 1, color: '#ffffff', lifetime: 1.2 });
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        const sp = 160 + Math.random() * 360;
        addParticle(rt, {
          x: cx + (Math.random() - 0.5) * 40,
          y: cy + (Math.random() - 0.5) * 40,
          dx: Math.cos(a) * sp * 0.65,
          dy: Math.sin(a) * sp * 0.45 - 90 - Math.random() * 140,
          alpha: 1,
          size: 4 + Math.random() * 4,
          color: i % 3 === 0 ? '#ffffff' : i % 2 === 0 ? '#fde047' : bossAccent,
        });
      }
    }

    if (rt.bossDeadTimer >= BOSS_DEAD_DELAY) {
      rt.timeScale = 1;
      if (rt.isOnlineCampaign && rt.stage !== 'eclipseBoss') {
        rt.bossesDefeatedCount++;
        rt.isBossLevel = false;
        rt.roomKind = 'boss';
        rt.bossProjectiles = [];
        rt.telegraphLines = [];
        rt.oniCursedZones = [];
        rt.oniSpiritBombs = [];
        rt.oniShrines = [];
        rt.voidTentacles = [];
        rt.eclipseBeacons = [];
        rt.eclipsePylons = [];
        rt.eclipsePrison = null;
        rt.eclipseMirrors = [];
        rt.bossDeadTimer = 0;
        rt.bossDeadBeat = 0;
        const bossCoinBonus = 18 + Math.max(0, rt.loopLevel - 1) * 8;
        rt.players.forEach((pl) => {
          if (pl.state !== 'spectator') {
            pl.state = 'alive';
            pl.invulnerable = false;
            pl.invulnFrames = 1.5;
            pl.hp = Math.min(pl.maxHp, pl.hp + 30);
            pl.coins += bossCoinBonus;
          }
        });
        rt.coinBursts.push({
          id: rt.nextUid++,
          x: cx,
          y: cy - 12,
          amount: bossCoinBonus,
          ttl: 0.7,
        });
        spawnRoomChest(rt, cx - 55, cy, 'weapon');
        spawnSkillScroll(rt, cx + 55, cy, undefined, undefined, {
          popFromX: cx,
          popFromY: cy,
          popDuration: 0.58,
          popArcHeight: 46,
          lockTimer: 0.58,
        });
        const room = rt.floorGrid[rt.currentRoomKey];
        if (room) {
          room.cleared = true;
          room.nextFloorPortalOpen = true;
          rt.floorMapRev++;
          saveCurrentRoomState(rt);
          spawnConnectedGates(rt, room);
        }
        soundEngine.setMusicTrack(getCampaignDungeonStage(rt.bossesDefeatedCount), false);
        showPhaseAnnounce(rt, 'BOSS VANQUISHED! LOOT CHEST, SCROLL & ENTER NEXT FLOOR PORTAL!', '#fbbf24', 3.4);
      } else if (rt.isOnlineCampaign && rt.stage === 'eclipseBoss') {
        const room = rt.floorGrid[rt.currentRoomKey];
        if (room) {
          room.cleared = true;
          rt.floorMapRev++;
        }
        rt.bossDeadTimer = 0;
        rt.bossDeadBeat = 0;
        rt.bossProjectiles = [];
        rt.players.forEach((pl) => {
          if (pl.state !== 'spectator') {
            pl.state = 'alive';
            pl.invulnerable = false;
          }
        });
        rt.finalVote = {
          active: true,
          timer: 20,
          votes: {},
          loopLevel: rt.loopLevel,
        };
        rt.finalVoteResolveDelay = 0;
      } else if (rt.stage === 'mechaBoss') {
        const nextStage: StageKey = rt.mode === 'boss_rush' ? 'voidBoss' : 'voidDungeon';
        rt.pendingEvent = { type: 'STAGE_CLEARED', clearedStage: 'mechaBoss', nextStage, offerBoons: true };
      } else if (rt.stage === 'voidBoss') {
        const nextStage: StageKey = rt.mode === 'boss_rush' ? 'oniBoss' : 'oniDungeon';
        rt.pendingEvent = { type: 'STAGE_CLEARED', clearedStage: 'voidBoss', nextStage, offerBoons: true };
      } else if (rt.stage === 'oniBoss') {
        rt.pendingEvent = { type: 'STAGE_CLEARED', clearedStage: 'oniBoss', nextStage: 'eclipseBoss', offerBoons: true };
      } else if (rt.stage === 'eclipseBoss') {
        rt.victory = true;
        soundEngine.stopMusic();
        soundEngine.playVictory();
        rt.pendingEvent = { type: 'VICTORY' };
      }
    }
  }
}

function spawnTrainingDummy(rt: GameRuntime, x: number, y: number) {
  const ang = Math.random() * Math.PI * 2;
  rt.enemies.push({
    id: rt.nextUid++,
    type: 'bouncer',
    x,
    y,
    size: 32,
    speed: 0.65,
    dx: Math.cos(ang),
    dy: Math.sin(ang),
    rotation: 0,
  });
}

function stepTutorial(rt: GameRuntime, dt: number) {
  const p = rt.players[0];
  p.safeZoneClosed = true;
  p.inSafeZone = false;

  if (rt.tutorialStep === 1) {
    // Drill 1: Grab Blade Orb & Slice 2 Training Dummies
    while (rt.enemies.length < 2) {
      spawnTrainingDummy(rt, 220 + Math.random() * 360, 150 + Math.random() * 140);
    }
    if (rt.kills >= 2) {
      soundEngine.playParry();
      addFloatingText(rt, p.x + p.size / 2, p.y - 24, 'DRILL 1 COMPLETE!', '#34d399', 1.2);
      advanceTutorialStep(rt);
    }
  } else if (rt.tutorialStep === 2) {
    // Drill 2: Clean Dodge 3 Orb Waves without taking damage
    rt.tutorialFireTimer -= dt;
    if (rt.tutorialFireTimer <= 0) {
      if (rt.bossProjectiles.length > 0) {
        if (!p.cleanDodgeFailed) {
          awardCleanDodge(rt, p);
        }
        p.cleanDodgeFailed = false;
      }
      rt.tutorialFireTimer = 1.65;
      const ox = 400;
      const oy = 150;
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + rt.elapsedSeconds * 0.4;
        pushBossProj(rt, {
          uid: rt.nextUid++,
          x: ox,
          y: oy,
          dx: Math.cos(ang) * 2.8,
          dy: Math.sin(ang) * 2.8,
          size: 16,
          speed: 1,
          color: '#38bdf8',
          damage: 10,
          shape: 'orb',
        });
      }
      soundEngine.playBossShoot();
    }
    if (rt.grazes - rt.tutorialGrazesStart >= 3) {
      soundEngine.playParry();
      addFloatingText(rt, p.x + p.size / 2, p.y - 24, 'DRILL 2 COMPLETE!', '#34d399', 1.2);
      advanceTutorialStep(rt);
    }
  } else if (rt.tutorialStep === 3) {
    // Drill 3: Test All 4 Classes, Passives & [E] Skills
    if (rt.enemies.length < 1) {
      spawnTrainingDummy(rt, 400, 190);
    }
    rt.tutorialFireTimer -= dt;
    if (rt.tutorialFireTimer <= 0) {
      rt.tutorialFireTimer = 1.65;
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + rt.elapsedSeconds * 0.5;
        pushBossProj(rt, {
          uid: rt.nextUid++,
          x: 400,
          y: 160,
          dx: Math.cos(ang) * 2.6,
          dy: Math.sin(ang) * 2.6,
          size: 15,
          speed: 1,
          color: '#c084fc',
          damage: 10,
          shape: 'shard',
        });
      }
    }
    if (rt.tutorialSkillUses >= 2) {
      soundEngine.playParry();
      addFloatingText(rt, p.x + p.size / 2, p.y - 24, 'DRILL 3 COMPLETE!', '#34d399', 1.2);
      advanceTutorialStep(rt);
    }
  } else if (rt.tutorialStep === 4) {
    // Drill 4: 100-HP & Attack-Dependent Damage Tiers + Estus Healing
    if (rt.medkits.length === 0) {
      rt.medkits.push({ x: 180, y: 420, size: 24, bob: 0 });
    }
    rt.tutorialFireTimer -= dt;
    if (rt.tutorialFireTimer <= 0) {
      rt.tutorialFireTimer = 2.1;
      const cycle = Math.floor(rt.elapsedSeconds / 2.1) % 3;
      const dx = p.x + p.size / 2 - 400;
      const dy = p.y + p.size / 2 - 120;
      const ang = Math.atan2(dy, dx);
      if (cycle === 0) {
        pushBossProj(rt, { uid: rt.nextUid++, x: 400, y: 120, dx: Math.cos(ang) * 3.8, dy: Math.sin(ang) * 3.8, size: 15, speed: 1, color: '#38bdf8', damage: 12, shape: 'orb' });
        addFloatingText(rt, 400, 100, 'LIGHT ORB (12 DMG)', '#38bdf8', 0.85);
      } else if (cycle === 1) {
        pushBossProj(rt, { uid: rt.nextUid++, x: 400, y: 120, dx: Math.cos(ang) * 3.4, dy: Math.sin(ang) * 3.4, size: 20, speed: 1, color: '#f97316', damage: 24, shape: 'ember' });
        addFloatingText(rt, 400, 100, 'HEAVY EMBER (24 DMG)', '#f97316', 0.85);
      } else {
        rt.telegraphLines.push({
          x1: 400,
          y1: 120,
          x2: 400 + Math.cos(ang) * 760,
          y2: 120 + Math.sin(ang) * 760,
          timer: 1.35,
          maxTimer: 1.35,
          width: 14,
          color: '#ef4444',
          kind: 'railgun',
          triggered: false,
        });
        addFloatingText(rt, 400, 100, 'RAILGUN LOCK (36 DMG)', '#ef4444', 0.85);
      }
      soundEngine.playBossShoot();
    }
  } else {
    // Drill 5: Inventory [I], Rare Scrolls, Drop, Flask [C] & Multi-HP Elites
    if (p.weapon === 'none') {
      p.learnedSkills.tank_shield = [1, 2, 3, 4];
      p.scrollBag = [
        { id: rt.nextUid++, targetWeapon: 'warrior_greatsword', skillSlot: 2 },
        { id: rt.nextUid++, targetWeapon: 'assassin_blades', skillSlot: 3 },
      ];
      rt.isOnlineCampaign = true;
      equipWeapon(rt, p, 'tank_shield');
    }
    if (p.potions <= 0) {
      p.potions = 2;
    }
    while (rt.enemies.length < 1) {
      rt.enemies.push({
        id: rt.nextUid++,
        type: 'bouncer',
        x: 400 + (Math.random() - 0.5) * 220,
        y: 165,
        size: 38,
        speed: 0.75,
        dx: 0.7,
        dy: 0.5,
        rotation: 0,
        hp: 3,
        maxHp: 3,
        isElite: true,
        hitFlashTimer: 0,
      });
    }
  }
}

export function extractHudSnapshot(rt: GameRuntime): HudSnapshot {
  const stageLabels: Record<StageKey, string> = {
    ironDungeon: 'STAGE 1 · IRON DEPTHS',
    mechaBoss: 'BOSS 1 · IRON DESTROYER',
    voidDungeon: 'STAGE 2 · THE VOID',
    voidBoss: 'BOSS 2 · VOID PHANTOM',
    oniDungeon: 'STAGE 3 · ONI SANCTUM',
    oniBoss: 'BOSS 3 · YAMATA-ONI',
    eclipseBoss: 'FINAL ACT · ECLIPSE SANCTUM',
  };

  const bossName =
    rt.bossType === 'mecha'
      ? rt.boss.phase === 2
        ? 'IRON DESTROYER [OVERCLOCK]'
        : 'IRON DESTROYER'
      : rt.bossType === 'void'
      ? rt.boss.phase === 2
        ? 'VOID PHANTOM [AWAKENED]'
        : 'VOID PHANTOM'
      : rt.bossType === 'eclipse'
      ? rt.boss.phase === 2
        ? 'SOLARIS & LUNARIS [UNBOUND]'
        : 'SOLARIS & LUNARIS'
      : rt.boss.phase === 2
      ? 'YAMATA-ONI [UNLEASHED]'
      : 'YAMATA-ONI';

  let coopPrompt: string | null = null;
  if (rt.isBossLevel && rt.bossType === 'eclipse' && rt.numPlayers >= 2) {
    if (rt.boss.state === 'weakened' && rt.eclipseMarkedBy) {
      coopPrompt = `CO-OP COMBO: ALLY STRIKE NOW TO DETONATE TWIN ECLIPSE FINISHER!`;
    } else if (rt.boss.state === 'attacking') {
      if (rt.boss.attackPattern === 'eclipse_tether') {
        coopPrompt = rt.eclipseSanctuaryActive
          ? `SANCTUARY LINK ACTIVE! BLOCKING ORBS (${rt.eclipseTetherTimer.toFixed(1)}s)`
          : `CO-OP: GROUP UP TO FORGE SANCTUARY BARRIER! (${rt.eclipseTetherTimer.toFixed(1)}s)`;
      } else if (rt.boss.attackPattern === 'twin_pylons') {
        coopPrompt = 'CO-OP: ODD PLAYERS BREAK SOLAR · EVEN PLAYERS BREAK LUNAR!';
      } else if (rt.boss.attackPattern === 'eclipse_prison' && rt.eclipsePrison) {
        coopPrompt = `CO-OP RESCUE: DASH OR SLASH P${rt.eclipsePrison.targetPlayerId}'S STASIS CAGE! (${rt.eclipsePrison.timer.toFixed(1)}s)`;
      } else if (rt.boss.attackPattern === 'eclipse_prism_beam' && rt.eclipseMirrors.length === 2) {
        const m1 = rt.eclipseMirrors[0];
        const m2 = rt.eclipseMirrors[1];
        coopPrompt = `CO-OP MIRRORS: SOLAR ${Math.round(m1.charge * 100)}%  ·  LUNAR ${Math.round(m2.charge * 100)}%`;
      } else if (rt.boss.attackPattern === 'coop_punishment') {
        coopPrompt = 'TEAMWORK FAILED! SURVIVE ECLIPSE JUDGMENT!';
      }
    }
  } else if (rt.isOnlineCampaign) {
    const aliveCnt = rt.players.filter((p) => p.state === 'alive').length;
    const activeGate = rt.gates.find((g) => g.playersInside.length > 0);
    if (activeGate) {
      coopPrompt = `${activeGate.dir.toUpperCase()} GATE (${activeGate.label}): ${activeGate.playersInside.length}/${aliveCnt} IN POSITION`;
    } else if (rt.chests.some((c) => !c.opened)) {
      coopPrompt = 'WALK OVER CHEST TO OPEN · PRESS [I] FOR INVENTORY · CHOOSE A GATE!';
    } else if (rt.weaponDrops.length > 0) {
      coopPrompt = '1 WEAPON MAX · WALK OVER OR PRESS [E] TO SWAP WEAPON · [I] INVENTORY';
    } else if (rt.roomKind === 'shop' && rt.shopNpc) {
      coopPrompt = 'WALK UP TO MERCHANT VEX & PRESS [E] TO BROWSE ITEMS & SCROLLS!';
    } else if (rt.gates.length > 0) {
      coopPrompt = 'PARTY CHOICE: ENTER ANY DUNGEON GATE OR TAKE STAIRS DOWN FOR MORE LOOT!';
    }
  } else if (rt.isTeamworkPractice) {
    coopPrompt = rt.boss.channelKind
      ? rt.boss.channelLabel || 'PRACTICE COUNTER: EXECUTE PARTY TEAMWORK MECHANIC!'
      : 'TEAMWORK PRACTICE · SWAP WEAPONS OR TRIGGER BOSS MECHANICS ON SANDBOX PANEL';
  }

  const tutorialMeta: Record<number, { title: string; obj: string; prog: number; total: number }> = {
    1: {
      title: 'DRILL 1 · BLADE EXECUTION',
      obj: 'Grab the glowing Blade Orb & slice 2 Training Dummies',
      prog: Math.min(2, rt.kills),
      total: 2,
    },
    2: {
      title: 'DRILL 2 · CLEAN DODGE',
      obj: 'Dodge 3 orb waves cleanly without taking a hit to Empower your Blade',
      prog: Math.min(3, Math.max(0, rt.grazes - rt.tutorialGrazesStart)),
      total: 3,
    },
    3: {
      title: 'DRILL 3 · CLASSES & CAMPAIGN WEAPONS',
      obj: 'Switch Classes or Campaign Weapons below & press [E] / [Q] / [R] / [F]',
      prog: Math.min(2, rt.tutorialSkillUses),
      total: 2,
    },
    4: {
      title: 'DRILL 4 · 100 HP & DAMAGE TIERS',
      obj: 'Light (12) / Heavy (24) / Railgun (36) · Grab Estus (+35 HP)',
      prog: 1,
      total: 1,
    },
    5: {
      title: 'DRILL 5 · INVENTORY [I], DROP & ELITES',
      obj: 'Press [I] to open Minecraft Inventory (Drop weapon / Learn Scrolls) & [C] for Flasks',
      prog: 1,
      total: 1,
    },
  };
  const tm = tutorialMeta[rt.tutorialStep] || tutorialMeta[1];

  const toPlayerHud = (pl: Player): PlayerHudState => ({
    id: pl.id,
    name: pl.name || `P${pl.id}`,
    isBot: pl.isBot,
    heroClass: pl.heroClass,
    weapon: pl.weapon,
    scrollBag: pl.scrollBag.map((s) => ({ ...s })),
    potions: pl.potions,
    potionCooldown: Math.ceil(pl.potionCooldownTimer),
    potionCooldownExact: Math.round((pl.potionCooldownTimer || 0) * 10) / 10,
    coins: pl.coins,
    color: pl.color,
    hp: Math.round(pl.hp),
    maxHp: pl.maxHp,
    bonusMaxHp: pl.bonusMaxHp,
    state: pl.state,
    dashReady: pl.dashReady,
    dashCooldown: Math.ceil(pl.dashCooldownTimer),
    dashCooldownExact: Math.round((pl.dashCooldownTimer || 0) * 10) / 10,
    dashMaxCooldown: pl.dashCooldown || 8.8,
    dash2Active: pl.dash2Active,
    dash2Ready: pl.dash2Ready,
    dash2Cooldown: Math.ceil(pl.dash2CooldownTimer),
    abilityReady: pl.abilityReady,
    abilityCooldown: Math.ceil(pl.abilityCooldownTimer),
    unlockedSkillTier: pl.unlockedSkillTier,
    learnedSkills: { ...pl.learnedSkills },
    nearMerchant: Boolean(
      rt.shopNpc &&
        pl.state === 'alive' &&
        Math.hypot(pl.x + pl.size / 2 - rt.shopNpc.x, pl.y + pl.size / 2 - rt.shopNpc.y) <= 95
    ),
    skillCooldowns: [
      Math.ceil(pl.skillCooldowns[0] || 0),
      Math.ceil(pl.skillCooldowns[1] || 0),
      Math.ceil(pl.skillCooldowns[2] || 0),
      Math.ceil(pl.skillCooldowns[3] || 0),
    ],
    skillCooldownsExact: [
      Math.round((pl.skillCooldowns[0] || 0) * 10) / 10,
      Math.round((pl.skillCooldowns[1] || 0) * 10) / 10,
      Math.round((pl.skillCooldowns[2] || 0) * 10) / 10,
      Math.round((pl.skillCooldowns[3] || 0) * 10) / 10,
    ],
    skillMaxCooldowns: [
      pl.skillMaxCooldowns[0] || 12,
      pl.skillMaxCooldowns[1] || 15,
      pl.skillMaxCooldowns[2] || 18,
      pl.skillMaxCooldowns[3] || 22,
    ],
    hasKnife: pl.hasKnife,
    hasShield: pl.hasShield,
    frontShield: Math.round(pl.frontShieldTimer * 10) / 10,
    empowered: pl.empoweredStrike,
    overdrive: pl.overdriveTimer,
    cloak: pl.cloakTimer,
    sealed: pl.sealed,
    combo: rt.playerCombos[pl.id]?.count || 0,
  });

  const activePlayerHuds = rt.players
    .filter((pl) => pl.state !== 'spectator')
    .map(toPlayerHud);

  const p1 = rt.players[0];
  const p2 = rt.players[1] || rt.players[0];

  const floorMap: FloorMapHudSnapshot | undefined = rt.isOnlineCampaign
    ? {
        floorNumber: rt.floorNumber,
        loopLevel: rt.loopLevel,
        currentRoomKey: rt.currentRoomKey,
        gridSize: 6,
        nodes: Object.values(rt.floorGrid).map((r) => ({
          key: r.key,
          gx: r.gx,
          gy: r.gy,
          kind: r.kind,
          bossVariantId: r.bossVariantId,
          visited: r.visited,
          cleared: r.cleared,
          revealed: r.revealed,
          connections: { ...r.connections },
        })),
      }
    : undefined;

  return {
    stage: rt.stage,
    stageLabel: rt.isTutorial
      ? 'TRAINING GROUNDS'
      : rt.isTeamworkPractice
      ? `PRACTICE · ${bossName}`
      : rt.isOnlineCampaign
      ? rt.isBossLevel
        ? stageLabels[rt.stage]
        : `FLOOR ${rt.floorNumber} · ${(rt.floorGrid[rt.currentRoomKey]?.label || rt.roomKind.toUpperCase())}`
      : stageLabels[rt.stage],
    waveText: rt.isTutorial
      ? `DRILL ${rt.tutorialStep}/5`
      : rt.isTeamworkPractice
      ? 'TEAMWORK DRILL'
      : rt.isBossLevel
      ? 'BOSS ENCOUNTER'
      : rt.isOnlineCampaign
      ? rt.gates.length > 0
        ? 'GATES OPEN'
        : rt.roomTotalWaves > 1
        ? `WAVE ${rt.roomWave}/${rt.roomTotalWaves} (${Math.round(getEnemyScaleMult(rt) * 10) / 10}X)`
        : `COMBAT (${Math.round(getEnemyScaleMult(rt) * 10) / 10}X)`
      : rt.stage === 'ironDungeon'
      ? `WAVE ${rt.waveNumber}/2`
      : 'VANGUARD WAVE',
    isOnlineCampaign: rt.isOnlineCampaign,
    isTeamworkPractice: Boolean(rt.isTeamworkPractice),
    roomKind: rt.roomKind,
    roomDepth: rt.roomDepth,
    roomWave: rt.roomWave,
    roomTotalWaves: rt.roomTotalWaves,
    loopLevel: rt.loopLevel,
    floorMap,
    finalVote: rt.finalVote
      ? {
          active: rt.finalVote.active,
          timer: Math.ceil(rt.finalVote.timer),
          votes: { ...rt.finalVote.votes },
          loopLevel: rt.finalVote.loopLevel,
        }
      : null,
    bossesDefeatedCount: rt.bossesDefeatedCount,
    gatesActive: rt.gates.length > 0,
    enemiesRemaining: rt.enemies.length,
    score: Math.round(rt.score),
    styleRank: getStyleRank(rt.stylePoints),
    grazes: rt.grazes,
    kills: rt.kills,
    elapsedSeconds: rt.elapsedSeconds,
    maxCombo: rt.maxCombo,
    comboP1: rt.playerCombos[1]?.count || 0,
    comboP2: rt.playerCombos[2]?.count || 0,
    isBossLevel: rt.isBossLevel,
    bossType: rt.bossType,
    bossVariantId: rt.boss.variantId,
    bossVariantName: rt.isBossLevel ? getBossVariantDef(rt.bossType, rt.boss.variantId).shortName : undefined,
    bossSuggestedWeapons: rt.isBossLevel ? getBossVariantDef(rt.bossType, rt.boss.variantId).suggestedWeapons : undefined,
    bossSuggestionText: rt.isBossLevel ? getBossVariantDef(rt.bossType, rt.boss.variantId).mechanicSummary : undefined,
    bossHardshipNote: rt.isBossLevel ? getBossVariantDef(rt.bossType, rt.boss.variantId).hardshipNote : undefined,
    bossName: rt.isBossLevel
      ? `${getBossVariantDef(rt.bossType, rt.boss.variantId).name}${rt.boss.phase === 2 ? ' [P2]' : ''}`
      : bossName,
    bossAttackLabel: rt.boss.attackLabel,
    bossVoiceLine: rt.bossVoiceLine,
    bossHealth: rt.boss.health,
    bossMaxHealth: rt.boss.maxHealth,
    bossPhase: rt.boss.phase,
    bossState: rt.boss.state,
    bossChannel: rt.boss.channelKind
      ? {
          kind: rt.boss.channelKind,
          timer: Math.max(0, Math.ceil((rt.boss.channelTimer || 0) * 10) / 10),
          maxTimer: rt.boss.channelMaxTimer || 3.5,
          hits: rt.boss.channelHits || 0,
          hitsNeeded: rt.boss.channelHitsNeeded || 1,
          label: rt.boss.channelLabel || '',
          targetPlayerId: rt.boss.channelTargetPlayerId,
        }
      : null,
    shopCatalog: rt.shopNpc ? rt.shopItems.map((it) => ({ ...it, purchasedBy: [...it.purchasedBy] })) : undefined,
    shopNpcName: rt.shopNpc?.name,
    medkitInventoryCount: rt.medkitInventoryCount,
    medkitNotif: rt.medkitNotif,
    phaseAnnounce: rt.phaseAnnounce,
    activeBoons: [...rt.activeBoons],
    coopPrompt,
    cheatsUsed: rt.cheatsUsed || Object.values(rt.cheats).some(Boolean),
    isTutorial: rt.isTutorial,
    tutorialStep: rt.tutorialStep,
    tutorialWeapon: rt.tutorialWeapon,
    tutorialTitle: tm.title,
    tutorialObjective: tm.obj,
    tutorialProgress: tm.prog,
    tutorialTotal: tm.total,
    players: activePlayerHuds,
    p1: toPlayerHud(p1),
    p2: toPlayerHud(p2),
    cameraState: { ...rt.camera },
    coinBursts: rt.coinBursts.map((b) => ({ id: b.id, x: b.x, y: b.y, amount: b.amount })),
  };
}

export const ONLINE_CHECKPOINT_STORAGE_KEY = 'dungeon_bouncer_online_checkpoint_v1';

export interface OnlineCheckpointPlayerData {
  id: PlayerId;
  name: string;
  heroClass: HeroClassId;
  color: string;
  weapon: WeaponId;
  scrollBag: SkillScrollItem[];
  learnedSkills: Partial<Record<WeaponClassId, number[]>>;
  potions: number;
  coins: number;
  hp: number;
  maxHp: number;
  bonusMaxHp: number;
}

export interface OnlineCampaignCheckpoint {
  version: 1;
  roomCode?: string;
  difficulty: DifficultyKey;
  floorNumber: number;
  loopLevel: number;
  bossesDefeatedCount: number;
  activeBoons: BoonId[];
  score: number;
  kills: number;
  grazes: number;
  elapsedSeconds: number;
  savedAt: number;
  players: OnlineCheckpointPlayerData[];
}

export function createOnlineCampaignCheckpoint(
  rt: GameRuntime,
  roomCode?: string
): OnlineCampaignCheckpoint | null {
  if (!rt.isOnlineCampaign || rt.isTutorial || rt.isTeamworkPractice || rt.gameOver || rt.victory) {
    return null;
  }
  const players: OnlineCheckpointPlayerData[] = rt.players
    .filter((p) => !p.isBot && (p.state !== 'spectator' || p.weapon !== 'none' || p.coins > 0 || p.scrollBag.length > 0))
    .map((p) => {
      const learnedSkills: Partial<Record<WeaponClassId, number[]>> = {};
      for (const [k, v] of Object.entries(p.learnedSkills || {})) {
        if (Array.isArray(v)) learnedSkills[k as WeaponClassId] = [...v];
      }
      return {
        id: p.id,
        name: p.name,
        heroClass: p.heroClass,
        color: p.color,
        weapon: p.weapon,
        scrollBag: p.scrollBag.map((s) => ({ ...s })),
        learnedSkills,
        potions: p.potions,
        coins: p.coins,
        hp: Math.round(p.hp),
        maxHp: p.maxHp,
        bonusMaxHp: p.bonusMaxHp,
      };
    });

  return {
    version: 1,
    roomCode,
    difficulty: rt.difficulty,
    floorNumber: rt.floorNumber,
    loopLevel: rt.loopLevel,
    bossesDefeatedCount: rt.bossesDefeatedCount,
    activeBoons: [...rt.activeBoons],
    score: Math.round(rt.score),
    kills: rt.kills,
    grazes: rt.grazes,
    elapsedSeconds: rt.elapsedSeconds,
    savedAt: Date.now(),
    players,
  };
}

export function saveOnlineCheckpoint(rt: GameRuntime, roomCode?: string): OnlineCampaignCheckpoint | null {
  const cp = createOnlineCampaignCheckpoint(rt, roomCode);
  if (!cp) return null;
  try {
    localStorage.setItem(ONLINE_CHECKPOINT_STORAGE_KEY, JSON.stringify(cp));
  } catch {
    // ignore storage quota errors
  }
  return cp;
}

export function loadOnlineCheckpoint(): OnlineCampaignCheckpoint | null {
  try {
    const raw = localStorage.getItem(ONLINE_CHECKPOINT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnlineCampaignCheckpoint;
    if (!parsed || parsed.version !== 1 || typeof parsed.floorNumber !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearOnlineCheckpoint(): void {
  try {
    localStorage.removeItem(ONLINE_CHECKPOINT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function applyOnlineCheckpointToRuntime(rt: GameRuntime, cp: OnlineCampaignCheckpoint): void {
  if (!rt.isOnlineCampaign) return;
  rt.floorNumber = Math.max(1, cp.floorNumber);
  rt.loopLevel = Math.max(1, cp.loopLevel);
  rt.bossesDefeatedCount = Math.max(0, Math.min(3, cp.bossesDefeatedCount));
  rt.score = Math.max(0, cp.score || 0);
  rt.kills = Math.max(0, cp.kills || 0);
  rt.grazes = Math.max(0, cp.grazes || 0);
  rt.elapsedSeconds = Math.max(0, cp.elapsedSeconds || 0);

  for (const boonId of cp.activeBoons || []) {
    if (!rt.activeBoons.includes(boonId)) {
      applyBoon(rt, boonId);
    }
  }

  for (const pl of rt.players) {
    if (pl.state === 'spectator') continue;
    const saved = cp.players.find((sp) => sp.id === pl.id);
    if (!saved) continue;
    pl.bonusMaxHp = saved.bonusMaxHp || 0;
    pl.maxHp = Math.max(pl.maxHp, saved.maxHp || pl.maxHp);
    pl.hp = Math.max(Math.round(pl.maxHp * 0.65), Math.min(pl.maxHp, saved.hp || pl.maxHp));
    pl.coins = Math.max(0, saved.coins || 0);
    pl.potions = Math.max(0, Math.min(2, saved.potions ?? 2));
    pl.scrollBag = Array.isArray(saved.scrollBag) ? saved.scrollBag.map((s) => ({ ...s })) : [];
    if (saved.weapon && saved.weapon !== 'none') {
      equipWeapon(rt, pl, saved.weapon);
    }
    if (saved.learnedSkills) {
      const copied: Partial<Record<WeaponClassId, number[]>> = {};
      for (const [k, v] of Object.entries(saved.learnedSkills)) {
        if (Array.isArray(v)) copied[k as WeaponClassId] = [...v];
      }
      pl.learnedSkills = copied;
      if (pl.weapon !== 'none') {
        const tiers = copied[pl.weapon] || [1];
        pl.unlockedSkillTier = Math.max(1, Math.min(4, Math.max(...tiers)));
      }
    }
  }

  const combatStage = getCampaignDungeonStage(rt.bossesDefeatedCount);
  resetFloorWorkspace(rt, combatStage, 15);
  showPhaseAnnounce(rt, `RESUMED FLOOR ${rt.floorNumber} · CHECKPOINT RESTORED!`, '#34d399', 3.4);
}

export function disconnectOnlinePlayerSlot(rt: GameRuntime, playerId: PlayerId): void {
  if (playerId === 1) return;
  const slot = rt.players.find((p) => p.id === playerId);
  if (!slot) return;
  const wasActive = slot.state !== 'spectator';
  slot.state = 'spectator';
  slot.hasKnife = false;
  slot.vx = 0;
  slot.vy = 0;
  slot.dashTimeLeft = 0;
  slot.dashImmune = false;
  slot.cloakTimer = 0;
  slot.invulnerable = false;
  slot.frontShieldTimer = 0;
  rt.knives = rt.knives.filter((k) => k.owner !== playerId);
  rt.numPlayers = Math.max(1, rt.players.filter((p) => p.state !== 'spectator').length);
  if (wasActive) {
    showPhaseAnnounce(rt, `${(slot.name || `P${playerId}`).toUpperCase()} DISCONNECTED`, '#f59e0b', 2.4);
  }
}

export function kickOnlinePlayerSlot(rt: GameRuntime, playerId: PlayerId): void {
  if (playerId === 1) return;
  const slot = rt.players.find((p) => p.id === playerId);
  if (!slot) return;
  const displayName = (slot.name || `P${playerId}`).toUpperCase();
  if (slot.state === 'alive' && slot.weapon !== 'none') {
    dropEquippedWeapon(rt, slot);
  }
  slot.state = 'spectator';
  slot.weapon = 'none';
  slot.scrollBag = [];
  slot.hasKnife = false;
  slot.vx = 0;
  slot.vy = 0;
  slot.dashTimeLeft = 0;
  slot.dashImmune = false;
  slot.cloakTimer = 0;
  slot.invulnerable = false;
  slot.frontShieldTimer = 0;
  rt.knives = rt.knives.filter((k) => k.owner !== playerId);
  rt.numPlayers = Math.max(1, rt.players.filter((p) => p.state !== 'spectator').length);
  showPhaseAnnounce(rt, `${displayName} WAS KICKED BY HOST`, '#f43f5e', 2.8);
}

export function restoreOnlinePlayerSlot(
  rt: GameRuntime,
  playerId: PlayerId,
  info?: { playerName?: string; colorHex?: string; heroClass?: HeroClassId }
): Player {
  // Deduplicate if any corrupted state left multiple entries for same playerId
  const matching = rt.players.filter((p) => p.id === playerId);
  let slot = matching[0];
  if (matching.length > 1) {
    rt.players = rt.players.filter((p) => p.id !== playerId || p === slot);
  }

  const usesWeapons = usesWeaponSystem(rt);
  const colorHex = info?.colorHex || rt.playerColors[playerId] || slot?.color || '#22d3ee';
  const resolvedName = info?.playerName?.trim().slice(0, 14) || slot?.name || `Player ${playerId}`;
  rt.playerColors[playerId] = colorHex;
  rt.playerNames[playerId] = resolvedName;

  const anchor = rt.players.find((p) => p.id !== playerId && p.state === 'alive');
  const spawnX = anchor
    ? Math.max(48, Math.min(rt.arenaWidth - 88, anchor.x + 48))
    : Math.round(rt.arenaWidth / 2 - 19);
  const spawnY = anchor
    ? Math.max(64, Math.min(rt.arenaHeight - 88, anchor.y + 12))
    : Math.round(rt.arenaHeight * 0.65);

  if (!slot) {
    slot = createPlayer(
      playerId,
      info?.heroClass || rt.playerClasses[playerId] || 'phantom',
      spawnX,
      spawnY,
      colorHex,
      rt.diffSettings,
      Math.max(rt.numPlayers + 1, playerId),
      usesWeapons,
      resolvedName,
      false
    );
    rt.players.push(slot);
    rt.players.sort((a, b) => a.id - b.id);
  } else {
    slot.name = resolvedName;
    slot.color = colorHex;
    slot.state = 'alive';
    slot.hp = Math.max(Math.min(slot.maxHp, 35), slot.hp > 0 ? slot.hp : Math.round(slot.maxHp * 0.65));
    slot.x = spawnX;
    slot.y = spawnY;
    slot.vx = 0;
    slot.vy = 0;
    slot.invulnFrames = 2.5;
    slot.sealed = false;
    slot.sealTimer = 0;
    slot.dashImmune = false;
    slot.dashTimeLeft = 0;
    slot.cloakTimer = 0;
    slot.invulnerable = false;
  }

  slot.hasKnife = true;
  rt.knives = rt.knives.filter((k) => k.owner !== playerId);
  const pos = getStandardKnifePos(rt, 22);
  rt.knives.push({
    x: pos.x,
    y: pos.y,
    size: 22,
    color: colorHex,
    owner: playerId,
    bobPhase: playerId * 1.1,
    luckyTimer: 0,
  });

  rt.numPlayers = Math.max(1, rt.players.filter((p) => p.state !== 'spectator').length);
  showPhaseAnnounce(rt, `${slot.name.toUpperCase()} RECONNECTED!`, '#34d399', 2.8);
  return slot;
}

