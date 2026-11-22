import { soundEngine } from './soundEngine';
import {
  AmbientMote,
  BOONS_CATALOG,
  BoonDef,
  BoonId,
  Boss,
  BOSS_ARENA_HEIGHT,
  BOSS_ARENA_WIDTH,
  BossProjectile,
  BossType,
  CameraState,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CheatsConfig,
  ChestDrop,
  ClassSkillDef,
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
  SkillScrollDrop,
  SkillZone,
  SlashArc,
  StageKey,
  TelegraphLine,
  VoidDecoy,
  VoidRift,
  VoidTentacle,
  WEAPONS_CATALOG,
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
  roomKind: RoomKind;
  roomDepth: number;
  floorNumber: number;
  loopLevel: number;
  currentRoomKey: string;
  floorGrid: Record<string, PersistedRoomState>;
  bossesDefeatedCount: number;
  chests: ChestDrop[];
  weaponDrops: WeaponDrop[];
  scrollDrops: SkillScrollDrop[];
  skillZones: SkillZone[];
  gates: DungeonGate[];
  shopItems: ShopItem[];
  lastKilledPos: { x: number; y: number } | null;
  shopBuyTimers: Record<string, number>;
  finalVote: FinalVoteState | null;
  finalVoteResolveDelay: number;
  pingByPlayer: Record<number, number | null>;
  playerColors: Record<number, string>;
  playerClasses: Record<number, HeroClassId>;
  stage: StageKey;
  waveNumber: number;
  bossType: BossType;
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
  cheats: CheatsConfig;
  cheatsUsed: boolean;
  bossHitCooldowns: Record<number, number>;
  dungeonCleanDodgeTimer: number;
  pendingEvent:
    | null
    | { type: 'STAGE_CLEARED'; clearedStage: StageKey; nextStage: StageKey; offerBoons: boolean }
    | { type: 'GAME_OVER' }
    | { type: 'VICTORY' };
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
  isOnlineCampaign: boolean
): Player {
  const classDef = HERO_CLASSES.find((c) => c.id === heroClass) || HERO_CLASSES[0];
  const isActive = id <= numPlayers;
  const maxHp = isOnlineCampaign ? diffSettings.baseMaxHp : diffSettings.baseMaxHp + classDef.bonusHp;

  const sMax: [number, number, number, number] = isOnlineCampaign
    ? [12, 16, 20, 26]
    : [
        classDef.skills[0].cooldown,
        classDef.skills[1].cooldown,
        classDef.skills[2].cooldown,
        classDef.skills[3].cooldown,
      ];

  return {
    id,
    heroClass,
    weapon: 'none',
    coins: 0,
    x,
    y,
    vx: 0,
    vy: 0,
    facingAngle: Math.PI / 2,
    size: 38,
    speed: isOnlineCampaign ? 5.2 : classDef.baseSpeed,
    color,
    hasKnife: false,
    state: isActive ? 'alive' : 'spectator',
    reviveProgress: 0,
    invulnerable: true,
    inSafeZone: true,
    safeZoneClosed: false,
    dashReady: true,
    dashTime: !isOnlineCampaign && heroClass === 'ronin' ? 0.18 : 0.16,
    dashCooldown: isOnlineCampaign ? 8.8 : classDef.dashCooldown,
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
    unlockedSkillTier: 1,
    skillCooldowns: [0, 0, 0, 0],
    skillMaxCooldowns: sMax,
    abilityReady: isOnlineCampaign ? false : true,
    abilityCooldown: isOnlineCampaign ? 12.0 : classDef.skillCooldown,
    abilityCooldownTimer: 0,
    cloakTimer: 0,
    empoweredStrike: false,
    shieldRegenTimer: !isOnlineCampaign && heroClass === 'vanguard' ? 28 : 0,
    bladeHealCd: 0,
    whirlwindTimer: 0,
    fortifyTimer: 0,
    bloodlustTimer: 0,
    chargeTimer: 0,
    sealed: false,
    sealTimer: 0,
    hasShield: !isOnlineCampaign && heroClass === 'vanguard',
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
      size: 22,
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
      size: 22,
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
  if (player.state === 'alive' && Math.random() < 0.2) {
    const px = player.x + player.size / 2;
    const py = player.y + player.size / 2;
    const minDist = 68;
    const maxDist = 165;
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
    knife.luckyTimer = 6.0;
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
  isOnlineCampaign?: boolean;
  activePlayerIds?: PlayerId[];
  cheats?: CheatsConfig;
}): GameRuntime {
  const activeCheats: CheatsConfig = { ...DEFAULT_CHEATS, ...(params.cheats || {}) };
  const anyCheat = Object.values(activeCheats).some(Boolean);
  const diffSettings = DIFFICULTY_SETTINGS[params.difficulty];
  const isTutorial = params.mode === 'tutorial';
  const isBossStart = params.mode === 'boss_rush';
  const isOnlineCampaign = Boolean(params.isOnlineCampaign && params.mode === 'campaign');
  const startW = isBossStart ? BOSS_ARENA_WIDTH : isOnlineCampaign ? DUNGEON_ARENA_WIDTH : CANVAS_WIDTH;
  const startH = isBossStart ? BOSS_ARENA_HEIGHT : isOnlineCampaign ? DUNGEON_ARENA_HEIGHT : CANVAS_HEIGHT;

  const activeSet = params.activePlayerIds && params.activePlayerIds.length > 0 ? new Set(params.activePlayerIds) : null;
  const maxActiveId = activeSet ? Math.max(...Array.from(activeSet)) : params.numPlayers;
  const slotCount = isOnlineCampaign
    ? Math.max(1, Math.min(5, maxActiveId))
    : Math.max(2, Math.min(5, Math.max(params.numPlayers, maxActiveId)));
  const players: Player[] = [];
  for (let i = 1; i <= slotCount; i++) {
    const pid = i as PlayerId;
    const isIncluded = activeSet ? activeSet.has(pid) : i <= params.numPlayers;
    const xPos = getSpawnXForPlayer(pid, params.numPlayers, startW, isBossStart, isOnlineCampaign);
    const pl = createPlayer(
      pid,
      params.playerClasses[pid] || 'ronin',
      xPos,
      -60,
      params.playerColors[pid] || '#ef4444',
      diffSettings,
      isIncluded ? Math.max(params.numPlayers, pid) : 0,
      isOnlineCampaign
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
    numPlayers: params.numPlayers,
    isOnlineCampaign,
    roomKind: 'combat',
    roomDepth: 1,
    floorNumber: 1,
    loopLevel: 1,
    currentRoomKey: '2,2',
    floorGrid: {},
    bossesDefeatedCount: 0,
    chests: [],
    weaponDrops: [],
    scrollDrops: [],
    skillZones: [],
    gates: [],
    shopItems: [],
    lastKilledPos: null,
    shopBuyTimers: {},
    finalVote: null,
    finalVoteResolveDelay: 0,
    pingByPlayer: { 1: 1 },
    playerColors: { ...params.playerColors },
    playerClasses: { ...params.playerClasses },
    stage: startStage,
    waveNumber: 1,
    bossType: 'mecha',
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
    cheats: activeCheats,
    cheatsUsed: anyCheat,
    bossHitCooldowns: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
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
  b.stateTimer = 0.65;
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

  // Volt class passive: Static Arc bolt on Clean Dodge!
  if (player.heroClass === 'volt') {
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

  const { pace } = getDiffScale(rt);
  b.state = 'idle';
  b.stateTimer = rt.difficulty === 'hard' ? (isP2 ? 0.34 : 0.54) : (isP2 ? 0.45 : 0.78) / pace;
}

function rtOrNull(rt: GameRuntime): GameRuntime {
  return rt;
}

export function switchTutorialClass(rt: GameRuntime, heroClass: HeroClassId) {
  if (!rt.isTutorial) return;
  const p = rt.players[0];
  const def = HERO_CLASSES.find((c) => c.id === heroClass) || HERO_CLASSES[0];
  p.heroClass = heroClass;
  p.speed = def.baseSpeed;
  p.dashCooldown = def.dashCooldown;
  p.abilityCooldown = def.skillCooldown;
  p.dashTime = heroClass === 'ronin' ? 0.18 : 0.16;
  p.maxHp = rt.diffSettings.baseMaxHp + def.bonusHp;
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

export function advanceTutorialStep(rt: GameRuntime) {
  if (!rt.isTutorial) return;
  rt.bossProjectiles = [];
  rt.telegraphLines = [];
  rt.enemies = [];
  if (rt.tutorialStep < 4) {
    rt.tutorialStep++;
  } else {
    rt.tutorialStep = 1;
    rt.kills = 0;
  }
  rt.tutorialSkillUses = 0;
  rt.tutorialGrazesStart = rt.grazes;
  rt.tutorialFireTimer = 0.5;
  rt.players[0].hp = rt.players[0].maxHp;
  rt.players[0].abilityReady = true;
  rt.players[0].abilityCooldownTimer = 0;
  rt.players[0].dashReady = true;
  rt.players[0].cleanDodgeFailed = false;
  soundEngine.playParry();

  const titles: Record<number, string> = {
    1: 'DRILL 1 · GRAB BLADE ORB & SLICE',
    2: 'DRILL 2 · CLEAN DODGE WITHOUT TAKING HITS',
    3: 'DRILL 3 · TEST CLASS PASSIVES & [E] SKILL',
    4: 'DRILL 4 · 100 HP & HEAVY ATTACK TIERS',
  };
  showPhaseAnnounce(rt, titles[rt.tutorialStep] || 'TRAINING DRILL', '#fbbf24', 2.4);
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
    if (!rt.isOnlineCampaign && p.unlockedSkillTier < 4) {
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
  const loopMult = 1 + Math.max(0, rt.loopLevel - 1) * 0.65;
  const partyMult = rt.numPlayers <= 1 ? 1 : rt.numPlayers === 2 ? 2 : 1 + (rt.numPlayers - 1) * 0.65;
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

function pickRandomWeaponId(rt: GameRuntime, avoidHeld = true): Exclude<WeaponId, 'none'> {
  const held = new Set(rt.players.map((p) => p.weapon).filter((w) => w !== 'none'));
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

export function equipWeapon(
  rt: GameRuntime,
  p: Player,
  weaponId: Exclude<WeaponId, 'none'>,
  dropPos?: { x: number; y: number }
) {
  const wDef = WEAPONS_CATALOG.find((w) => w.id === weaponId);
  if (!wDef) return;

  if (p.weapon !== 'none' && p.weapon !== weaponId) {
    const oldId = p.weapon as Exclude<WeaponId, 'none'>;
    rt.weaponDrops.push({
      id: rt.nextUid++,
      weaponId: oldId,
      x: dropPos ? dropPos.x : p.x + p.size / 2,
      y: dropPos ? dropPos.y : p.y + p.size / 2,
      size: 28,
      bob: 0,
      swapLockTimer: 0.75,
    });
  }

  p.weapon = weaponId;
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
  p.skillCooldowns = [0, 0, 0, 0];
  p.abilityCooldownTimer = 0;
  p.abilityReady = true;

  // Preserve purchased Vitality Tonic / bonusMaxHp when swapping weapons!
  const targetMaxHp = rt.diffSettings.baseMaxHp + (p.bonusMaxHp || 0) + wDef.bonusHp;
  const diff = targetMaxHp - p.maxHp;
  p.maxHp = targetMaxHp;
  if (diff > 0) {
    p.hp = Math.min(p.maxHp, p.hp + diff);
  } else {
    p.hp = Math.min(p.maxHp, p.hp);
  }

  if (weaponId === 'tank_shield') {
    p.hasShield = true;
    p.shieldRegenTimer = 24;
  } else {
    p.shieldRegenTimer = 0;
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
    `EQUIPPED ${wDef.shortTag} · ${wDef.skills[0].name.toUpperCase()}!`,
    wDef.accent,
    1.15
  );
}

function spawnSkillScroll(rt: GameRuntime, x: number, y: number, _label = 'SKILL SCROLL') {
  const sx = Math.max(85, Math.min(rt.arenaWidth - 85, x));
  const sy = Math.max(95, Math.min(rt.arenaHeight - 95, y));
  rt.scrollDrops.push({
    id: rt.nextUid++,
    x: sx,
    y: sy,
    size: 26,
    bob: Math.random() * Math.PI * 2,
    lockTimer: 0,
  });
}

function spawnRoomChest(
  rt: GameRuntime,
  x: number,
  y: number,
  forcedKind?: 'coins' | 'weapon'
) {
  const activeCount = Math.max(1, rt.players.filter((p) => p.state !== 'spectator').length);
  const noWeaponHeld = rt.players.some((p) => p.state !== 'spectator' && p.weapon === 'none');
  const rewardKind: 'coins' | 'weapon' =
    forcedKind || (Math.random() < (noWeaponHeld ? 0.68 : 0.55) ? 'weapon' : 'coins');

  const cx = Math.max(100, Math.min(rt.arenaWidth - 100, x));
  const cy = Math.max(120, Math.min(rt.arenaHeight - 120, y));

  if (rewardKind === 'coins') {
    const perPlayer =
      22 +
      Math.floor(Math.random() * 4) * 5 +
      Math.min(25, rt.roomDepth * 4) +
      Math.max(0, rt.loopLevel - 1) * 10;
    rt.chests.push({
      id: rt.nextUid++,
      x: cx,
      y: cy,
      size: 36,
      opened: false,
      openAnim: 0,
      rewardKind: 'coins',
      coinsTotal: perPlayer * activeCount,
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

  // Expand a connected 9-room Soul-Knight floor on a 5x5 grid
  let guard = 0;
  while (keysList.length < 9 && guard < 200) {
    guard++;
    const baseKey = keysList[Math.floor(Math.random() * keysList.length)];
    const base = coords[baseKey];
    const dirs: GateDir[] = (['top', 'bottom', 'left', 'right'] as GateDir[]).sort(() => Math.random() - 0.5);
    for (const dir of dirs) {
      const nx = base.gx + DIR_DELTA[dir].dx;
      const ny = base.gy + DIR_DELTA[dir].dy;
      if (nx < 0 || nx > 4 || ny < 0 || ny > 4) continue;
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

  // Add 1-2 extra shortcut links between adjacent existing rooms (excluding center-to-boss)
  let shortcuts = 0;
  for (const k of keysList) {
    if (shortcuts >= 2) break;
    const node = coords[k];
    for (const dir of ['right', 'bottom'] as GateDir[]) {
      const nx = node.gx + DIR_DELTA[dir].dx;
      const ny = node.gy + DIR_DELTA[dir].dy;
      const nKey = `${nx},${ny}`;
      if (coords[nKey] && !node.connections[dir] && k !== startKey && nKey !== startKey && Math.random() < 0.35) {
        node.connections[dir] = nKey;
        coords[nKey].connections[OPPOSITE_DIR[dir]] = k;
        shortcuts++;
      }
    }
  }

  // BFS distance from startKey so Boss is genuinely farthest away
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
  const bossKey = others[0];
  const nonBossOthers = others.slice(1).sort(() => Math.random() - 0.5);
  const shopKey = nonBossOthers[0];
  const treasureKeys = new Set(nonBossOthers.slice(1, nonBossOthers.length >= 4 ? 3 : 2));

  const grid: Record<string, PersistedRoomState> = {};
  for (const k of keysList) {
    const c = coords[k];
    let kind: RoomKind = 'combat';
    let label = 'DUNGEON CHAMBER';
    let stage: StageKey = combatStage;
    let bossStage: 'mechaBoss' | 'voidBoss' | 'oniBoss' | 'eclipseBoss' | undefined;

    if (k === startKey) {
      kind = 'start';
      label = 'ENTRY HALL';
    } else if (k === bossKey) {
      kind = 'boss';
      label = nextBoss.label;
      stage = nextBoss.stage;
      bossStage = nextBoss.stage;
    } else if (k === shopKey) {
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

function getRoomGateMeta(target: PersistedRoomState): { label: string; subLabel: string; accent: string } {
  if (!target.revealed && !target.visited) {
    return { label: 'UNKNOWN', subLabel: 'UNEXPLORED ROOM', accent: '#94a3b8' };
  }
  if (target.kind === 'boss') {
    return {
      label: 'BOSS SANCTUM',
      subLabel: target.cleared ? 'CLEARED SANCTUM' : target.label,
      accent: '#f43f5e',
    };
  }
  if (target.kind === 'shop') {
    return { label: 'MERCHANT SHOP', subLabel: 'POTIONS · SCROLL · CRATE', accent: '#fbbf24' };
  }
  if (target.kind === 'treasure') {
    return {
      label: 'TREASURE VAULT',
      subLabel: target.cleared ? 'VISITED VAULT' : 'CHESTS & SKILL SCROLL',
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
    top: { x: Math.round(w / 2 - 76), y: 12, width: 152, height: 52 },
    bottom: { x: Math.round(w / 2 - 76), y: h - 64, width: 152, height: 52 },
    left: { x: 12, y: Math.round(h / 2 - 76), width: 52, height: 152 },
    right: { x: w - 64, y: Math.round(h / 2 - 76), width: 52, height: 152 },
  };

  (['top', 'bottom', 'left', 'right'] as GateDir[]).forEach((dir) => {
    const targetKey = room.connections[dir];
    if (!targetKey) return;
    const target = rt.floorGrid[targetKey];
    if (!target) return;
    target.revealed = true;
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
      roomType: target.kind,
      targetStage: target.stage,
      label: meta.label,
      subLabel: meta.subLabel,
      accent: meta.accent,
      playersInside: [],
      holdProgress: 0,
    });
  });

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

function spawnShopItems(rt: GameRuntime) {
  const cx = Math.round(rt.arenaWidth / 2);
  const cy = Math.round(rt.arenaHeight / 2);
  const crateWeapon = pickRandomWeaponId(rt, true);
  rt.shopItems = [
    {
      id: rt.nextUid++,
      kind: 'potion',
      label: 'HEALING POTION',
      subLabel: '+45 HP + CLEANSE',
      cost: 25,
      x: cx - 320,
      y: cy + 30,
      size: 38,
      accent: '#34d399',
      purchasedBy: [],
    },
    {
      id: rt.nextUid++,
      kind: 'max_hp',
      label: 'VITALITY TONIC',
      subLabel: '+20 MAX HP & +35 HP',
      cost: 50,
      x: cx - 160,
      y: cy + 30,
      size: 38,
      accent: '#f43f5e',
      purchasedBy: [],
    },
    {
      id: rt.nextUid++,
      kind: 'skill_scroll',
      label: 'SKILL SCROLL',
      subLabel: 'UNLOCK NEXT SKILL [Q/R/F]',
      cost: 40,
      x: cx,
      y: cy + 30,
      size: 38,
      accent: '#a855f7',
      purchasedBy: [],
    },
    {
      id: rt.nextUid++,
      kind: 'shield',
      label: 'AEGIS CORE',
      subLabel: 'ENERGY SHIELD',
      cost: 35,
      x: cx + 160,
      y: cy + 30,
      size: 38,
      accent: '#38bdf8',
      purchasedBy: [],
    },
    {
      id: rt.nextUid++,
      kind: 'weapon_crate',
      label: 'ARMORY CRATE',
      subLabel: `DROP: ${WEAPONS_CATALOG.find((w) => w.id === crateWeapon)?.shortTag || 'WEAPON'}`,
      cost: 45,
      x: cx + 320,
      y: cy + 30,
      size: 38,
      accent: '#fbbf24',
      weaponId: crateWeapon,
      purchasedBy: [],
      globalSold: false,
    },
  ];
}

function advanceToNextFloor(rt: GameRuntime) {
  rt.floorNumber++;
  rt.chests = [];
  rt.weaponDrops = [];
  rt.scrollDrops = [];
  rt.skillZones = [];
  rt.gates = [];
  rt.shopItems = [];
  rt.shopBuyTimers = {};
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
  const combatStage = getCampaignDungeonStage(rt.bossesDefeatedCount);
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
    p.hp = Math.min(p.maxHp, p.hp + 25);
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
  spawnWaveEnemies(rt, combatStage, 1);
  showPhaseAnnounce(rt, `FLOOR ${rt.floorNumber} · FRESH MAP GENERATED`, '#22d3ee', 3.0);
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
  rt.skillZones = [];
  rt.gates = [];
  rt.shopItems = [];
  rt.shopBuyTimers = {};
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
  spawnWaveEnemies(rt, 'ironDungeon', 1);
  showPhaseAnnounce(rt, `ABYSSAL LOOP ${rt.loopLevel} · EVERYTHING GROWS DEADLIER!`, '#f43f5e', 3.4);
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

  rt.chests = [];
  rt.weaponDrops = [];
  rt.scrollDrops = [];
  rt.skillZones = [];
  rt.gates = [];
  rt.shopItems = [];
  rt.shopBuyTimers = {};
  rt.lastKilledPos = null;
  rt.enemies = [];
  rt.bossProjectiles = [];
  rt.playerProjectiles = [];
  rt.voidDecoys = [];
  rt.telegraphLines = [];
  rt.medkits = [];
  rt.relics = [];
  rt.stageElapsed = 0;

  // Uncleared Boss Room transitions into the Boss Sanctum battle
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
    setupBossStage(rt, bossStage);
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
      ? rt.arenaWidth - 190
      : gate.dir === 'right'
      ? 160
      : Math.round(rt.arenaWidth / 2);
  const spawnYBase =
    gate.dir === 'top'
      ? rt.arenaHeight - 165
      : gate.dir === 'bottom'
      ? 135
      : Math.round(rt.arenaHeight / 2);

  // Bug #1 Fix: Never leave p.invulnerable=true on dungeon gate entry; use bounded invulnFrames instead!
  rt.players.forEach((p, idx) => {
    if (p.state === 'spectator') return;
    p.state = 'alive';
    p.invulnerable = false;
    p.invulnFrames = 1.45;
    p.dashImmune = false;
    p.dashTimeLeft = 0;
    p.cloakTimer = 0;
    p.postDashInvulnerability = 0;
    const spread = (idx - (rt.numPlayers - 1) / 2) * 58;
    if (gate.dir === 'left' || gate.dir === 'right') {
      p.x = spawnXCenter;
      p.y = Math.max(95, Math.min(rt.arenaHeight - 135, spawnYBase + spread));
    } else {
      p.x = Math.max(95, Math.min(rt.arenaWidth - 135, spawnXCenter + spread));
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
    showPhaseAnnounce(rt, `MERCHANT OUTPOST (STAND OR [E] TO BUY)`, '#fbbf24', 2.8);
  } else if (targetRoom.kind === 'treasure') {
    targetRoom.cleared = true;
    spawnRoomChest(rt, Math.round(rt.arenaWidth / 2 - 120), Math.round(rt.arenaHeight / 2), 'weapon');
    spawnRoomChest(rt, Math.round(rt.arenaWidth / 2 + 120), Math.round(rt.arenaHeight / 2), 'coins');
    spawnSkillScroll(rt, Math.round(rt.arenaWidth / 2), Math.round(rt.arenaHeight / 2 - 70), 'ANCIENT SKILL SCROLL');
    spawnConnectedGates(rt, targetRoom);
    soundEngine.playBoonSelect();
    showPhaseAnnounce(rt, `ANCIENT TREASURE VAULT · CHESTS & SKILL SCROLL!`, '#34d399', 2.8);
  } else {
    rt.waveNumber = 1;
    spawnWaveEnemies(rt, combatStage, 1);
    showPhaseAnnounce(
      rt,
      `FLOOR ${rt.floorNumber} · ${targetRoom.label} (${Math.round(getEnemyScaleMult(rt) * 10) / 10}X)`,
      '#38bdf8',
      2.6
    );
  }
}

function spawnWaveEnemies(rt: GameRuntime, stage: StageKey, wave: number) {
  rt.enemies = [];
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

  roster.forEach((type) => {
    const size = type === 'splitter' ? 36 : type === 'charger' ? 32 : 30;
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
  rt.shopBuyTimers = {};
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
    p.abilityReady = rt.isOnlineCampaign ? p.weapon !== 'none' : true;
    p.abilityCooldownTimer = 0;
    p.skillCooldowns = [0, 0, 0, 0];
    p.cloakTimer = 0;
    p.whirlwindTimer = 0;
    p.fortifyTimer = 0;
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
    if (hasBoon(rt, 'aegis_core') || (!rt.isOnlineCampaign && p.heroClass === 'vanguard') || p.weapon === 'tank_shield') {
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

function setupBossStage(rt: GameRuntime, stage: 'mechaBoss' | 'voidBoss' | 'oniBoss' | 'eclipseBoss') {
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
    if (hasBoon(rt, 'aegis_core') || (!rt.isOnlineCampaign && p.heroClass === 'vanguard') || p.weapon === 'tank_shield') {
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
  if (stage === 'mechaBoss') {
    rt.bossType = 'mecha';
    const hp = Math.round(rt.diffSettings.mechaHP * duoHpMult);
    rt.boss = {
      ...createEmptyBoss(),
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

function spawnMedkit(rt: GameRuntime) {
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
  if (item.kind === 'skill_scroll' && p.unlockedSkillTier >= 4) {
    addFloatingText(rt, item.x, item.y - 24, 'ALL 4 SKILLS UNLOCKED!', '#c084fc', 0.9);
    return false;
  }
  if (p.coins < item.cost) {
    addFloatingText(rt, item.x, item.y - 24, `NEED ${item.cost}g`, '#f43f5e', 0.9);
    return false;
  }

  p.coins -= item.cost;
  soundEngine.playBoonSelect();

  if (item.kind === 'potion') {
    item.purchasedBy.push(p.id);
    p.hp = Math.min(p.maxHp, p.hp + 45);
    p.sealed = false;
    p.sealTimer = 0;
    addFloatingText(rt, p.x + p.size / 2, p.y - 16, '+45 HP POTION!', '#34d399', 1.15);
  } else if (item.kind === 'max_hp') {
    item.purchasedBy.push(p.id);
    // Bug #2 Fix: Persist Vitality Tonic in p.bonusMaxHp so weapon swaps never erase purchased HP!
    p.bonusMaxHp += 20;
    p.maxHp += 20;
    p.hp = Math.min(p.maxHp, p.hp + 35);
    addFloatingText(rt, p.x + p.size / 2, p.y - 16, '+20 MAX HP!', '#f43f5e', 1.15);
  } else if (item.kind === 'skill_scroll') {
    item.purchasedBy.push(p.id);
    p.unlockedSkillTier = Math.min(4, p.unlockedSkillTier + 1);
    const wDef = WEAPONS_CATALOG.find((w) => w.id === p.weapon);
    const sk = wDef?.skills[p.unlockedSkillTier - 1];
    addFloatingText(
      rt,
      p.x + p.size / 2,
      p.y - 20,
      sk ? `UNLOCKED [${sk.keyLabel}]: ${sk.name.toUpperCase()}!` : `SKILL SLOT ${p.unlockedSkillTier} UNLOCKED!`,
      '#c084fc',
      1.15
    );
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
      x: item.x,
      y: item.y + 18,
      size: 28,
      bob: 0,
      swapLockTimer: 0.4,
    });
    addFloatingText(rt, item.x, item.y - 20, 'WEAPON UNLOCKED!', '#fbbf24', 1.2);
  }
  return true;
}

function triggerSkillSlot(rt: GameRuntime, p: Player, slot: 1 | 2 | 3 | 4) {
  const cx = p.x + p.size / 2;
  const cy = p.y + p.size / 2;
  const idx = slot - 1;

  if (rt.isOnlineCampaign && p.weapon === 'none') {
    addFloatingText(rt, cx, p.y - 14, 'FIND A WEAPON FIRST!', '#94a3b8', 0.9);
    return;
  }

  if (slot > p.unlockedSkillTier) {
    addFloatingText(rt, cx, p.y - 14, `LOCKED · FIND SCROLL (${slot}/4)`, '#c084fc', 0.9);
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

  if (rt.isOnlineCampaign) {
    // === HOLY STAFF (NERFED & REBALANCED 4-SKILL SUPPORT) ===
    if (p.weapon === 'holy_staff') {
      if (slot === 1) {
        soundEngine.playMedkit();
        rt.energyWaves.push({ x: cx, y: cy, radius: 14, maxRadius: 260, alpha: 0.9, speed: 440, color: '#fde047' });
        let count = 0;
        rt.players.forEach((ally) => {
          if (ally.state === 'spectator') return;
          if (Math.hypot(ally.x + ally.size / 2 - cx, ally.y + ally.size / 2 - cy) <= 260) {
            if (ally.state === 'alive') {
              ally.hp = Math.min(ally.maxHp, ally.hp + 14);
              ally.sealed = false;
              ally.sealTimer = 0;
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
        soundEngine.playShockwave();
        rt.energyWaves.push({ x: cx, y: cy, radius: 14, maxRadius: 225, alpha: 0.92, speed: 520, color: '#fef08a' });
        let cleared = 0;
        rt.bossProjectiles = rt.bossProjectiles.filter((bp) => {
          if (bp.type === 'phantom_clone') return true;
          if (Math.hypot(bp.x + bp.size / 2 - cx, bp.y + bp.size / 2 - cy) <= 225) {
            cleared++;
            return false;
          }
          return true;
        });
        rt.enemies.forEach((e) => {
          if (Math.hypot(e.x + e.size / 2 - cx, e.y + e.size / 2 - cy) <= 225) e.stunTimer = 2.0;
        });
        rt.players.forEach((ally) => {
          if (ally.state === 'alive' && Math.hypot(ally.x + ally.size / 2 - cx, ally.y + ally.size / 2 - cy) <= 225) {
            ally.hp = Math.min(ally.maxHp, ally.hp + 8);
          }
        });
        addFloatingText(rt, cx, p.y - 20, cleared > 0 ? `PURIFYING NOVA! (${cleared})` : 'PURIFYING NOVA!', '#fef08a', 1.1);
      } else if (slot === 3) {
        soundEngine.playCoopResonance();
        rt.skillZones.push({
          id: rt.nextUid++,
          ownerId: p.id,
          kind: 'holy_ground',
          x: cx,
          y: cy,
          radius: 170,
          timer: 5.0,
          maxTimer: 5.0,
          tickTimer: 0.35,
          color: '#fde047',
        });
        addFloatingText(rt, cx, p.y - 20, 'SACRED GROUND DEPLOYED!', '#fde047', 1.1);
      } else {
        soundEngine.playCoopResonance();
        rt.energyWaves.push({ x: cx, y: cy, radius: 18, maxRadius: 340, alpha: 0.96, speed: 540, color: '#fde047' });
        rt.players.forEach((ally) => {
          if (ally.state === 'alive') {
            ally.invulnFrames = Math.max(ally.invulnFrames, 1.6);
            ally.hp = Math.min(ally.maxHp, ally.hp + 12);
            addFloatingText(rt, ally.x + ally.size / 2, ally.y - 14, "ANGEL'S GRACE!", '#fef08a', 1.05);
          } else if (ally.state === 'down') {
            ally.reviveProgress = Math.min(REVIVE_TIME, ally.reviveProgress + REVIVE_TIME * 0.45);
          }
        });
        addFloatingText(rt, cx, p.y - 26, "ANGEL'S GRACE!", '#fde047', 1.2);
      }
      return;
    }

    // === TANK SHIELD ===
    if (p.weapon === 'tank_shield') {
      if (slot === 1) {
        soundEngine.playShockwave();
        rt.screenShake = Math.max(rt.screenShake, 14);
        rt.energyWaves.push({ x: cx, y: cy, radius: 16, maxRadius: 260, alpha: 0.96, speed: 620, color: '#38bdf8' });
        let cleared = 0;
        rt.bossProjectiles = rt.bossProjectiles.filter((bp) => {
          if (bp.type === 'phantom_clone') return true;
          if (Math.hypot(bp.x + bp.size / 2 - cx, bp.y + bp.size / 2 - cy) <= 260) {
            cleared++;
            return false;
          }
          return true;
        });
        rt.players.forEach((ally) => {
          if (ally.state === 'alive' && Math.hypot(ally.x + ally.size / 2 - cx, ally.y + ally.size / 2 - cy) <= 240) {
            ally.hasShield = true;
            if (ally.id !== p.id) addFloatingText(rt, ally.x + ally.size / 2, ally.y - 12, 'SHIELDED!', '#38bdf8', 0.95);
          }
        });
        rt.enemies.forEach((e) => {
          if (Math.hypot(e.x + e.size / 2 - cx, e.y + e.size / 2 - cy) <= 260) e.stunTimer = 2.6;
        });
        if (cleared > 0) rt.score += cleared * 35;
        if (rt.isBossLevel && rt.boss.health > 0 && rt.boss.state !== 'comic_intro' && rt.boss.state !== 'dead' && rt.boss.state !== 'phase_transition') {
          if (Math.hypot(rt.boss.x + rt.boss.size / 2 - cx, rt.boss.y + rt.boss.size / 2 - cy) <= 265) {
            handleBossHit(rt, p, false, 1);
          }
        }
        addFloatingText(rt, cx, p.y - 18, cleared > 0 ? `BASTION DOME (${cleared})` : 'BASTION DOME!', '#38bdf8', 1.15);
      } else if (slot === 2) {
        soundEngine.playDash();
        p.chargeTimer = 0.55;
        p.invulnFrames = Math.max(p.invulnFrames, 0.7);
        p.dashDirX = Math.cos(p.facingAngle);
        p.dashDirY = Math.sin(p.facingAngle);
        addFloatingText(rt, cx, p.y - 18, 'AEGIS CHARGE!', '#38bdf8', 1.1);
      } else if (slot === 3) {
        soundEngine.playPowerup();
        p.fortifyTimer = 4.5;
        p.hasShield = true;
        rt.energyWaves.push({ x: cx, y: cy, radius: 10, maxRadius: 150, alpha: 0.9, speed: 380, color: '#0ea5e9' });
        addFloatingText(rt, cx, p.y - 18, 'IRON FORTRESS!', '#0ea5e9', 1.15);
      } else {
        soundEngine.playShockwave();
        rt.screenShake = Math.max(rt.screenShake, 22);
        rt.energyWaves.push({ x: cx, y: cy, radius: 18, maxRadius: 320, alpha: 0.98, speed: 680, color: '#22d3ee' });
        rt.bossProjectiles = rt.bossProjectiles.filter(
          (bp) => bp.type === 'phantom_clone' || Math.hypot(bp.x + bp.size / 2 - cx, bp.y + bp.size / 2 - cy) > 320
        );
        rt.enemies.forEach((e) => {
          if (Math.hypot(e.x + e.size / 2 - cx, e.y + e.size / 2 - cy) <= 320) e.stunTimer = 3.5;
        });
        if (rt.isBossLevel && rt.boss.health > 0 && rt.boss.state !== 'comic_intro' && rt.boss.state !== 'dead' && rt.boss.state !== 'phase_transition') {
          if (Math.hypot(rt.boss.x + rt.boss.size / 2 - cx, rt.boss.y + rt.boss.size / 2 - cy) <= 325) {
            handleBossHit(rt, p, false, 2);
          }
        }
        addFloatingText(rt, cx, p.y - 22, 'TECTONIC SLAM!', '#22d3ee', 1.25);
      }
      return;
    }

    // === ASSASSIN BLADES ===
    if (p.weapon === 'assassin_blades') {
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
        p.x = Math.max(16, Math.min(rt.arenaWidth - p.size - 16, p.x + Math.cos(p.facingAngle) * 190));
        p.y = Math.max(16, Math.min(rt.arenaHeight - p.size - 16, p.y + Math.sin(p.facingAngle) * 190));
        p.invulnFrames = Math.max(p.invulnFrames, 0.45);
        p.dashReady = true;
        p.dashCooldownTimer = 0;
        rt.voidDecoys.push({ x: p.x + p.size / 2, y: p.y + p.size / 2, timer: 0.55, maxTimer: 0.55, color: '#e879f9', ownerId: p.id });
        addFloatingText(rt, p.x + p.size / 2, p.y - 16, 'NIGHTFALL AMBUSH!', '#e879f9', 1.15);
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
        addFloatingText(rt, cx, p.y - 20, 'BLOODLUST VORTEX!', '#e879f9', 1.25);
      }
      return;
    }

    // === WARRIOR GREATSWORD ===
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
          radius: 38,
          color: p.color,
          lifetime: 1.25,
          pierce: 99,
        });
        addSlashArc(rt, cx, cy, p.facingAngle, '#ef4444', 56);
        addFloatingText(rt, cx, p.y - 14, 'CRESCENT CLEAVE!', '#ef4444', 1.1);
      } else if (slot === 2) {
        soundEngine.playSlash(3);
        p.whirlwindTimer = 2.6;
        addFloatingText(rt, cx, p.y - 16, 'WHIRLWIND BLADE!', '#f87171', 1.15);
      } else if (slot === 3) {
        soundEngine.playCrescentWave();
        rt.screenShake = Math.max(rt.screenShake, 12);
        for (const off of [-0.25, 0, 0.25]) {
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
        addFloatingText(rt, cx, p.y - 18, 'EARTHSPLITTER!', '#fb923c', 1.15);
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
          radius: 56,
          color: '#ef4444',
          lifetime: 1.35,
          pierce: 99,
          bossDamage: 3,
        });
        addSlashArc(rt, cx, cy, p.facingAngle, '#fde047', 78);
        addFloatingText(rt, cx, p.y - 22, 'CATACLYSM STRIKE!', '#fde047', 1.25);
      }
      return;
    }

    // === RANGER BOW ===
    if (p.weapon === 'ranger_bow') {
      if (slot === 1) {
        soundEngine.playSurge();
        p.overdriveTimer = 3.2;
        for (const offset of [-0.2, 0, 0.2]) {
          const ang = p.facingAngle + offset;
          rt.playerProjectiles.push({
            uid: rt.nextUid++,
            ownerId: p.id,
            kind: 'ranger_arrow',
            x: cx,
            y: cy,
            dx: Math.cos(ang) * 13.5,
            dy: Math.sin(ang) * 13.5,
            angle: ang,
            radius: 16,
            color: '#34d399',
            lifetime: 1.15,
            pierce: 2,
          });
        }
        const knife = rt.knives.find((k) => k.owner === p.id);
        if (knife && !p.hasKnife) {
          knife.x = cx - knife.size / 2;
          knife.y = cy - knife.size / 2;
        }
        addFloatingText(rt, cx, p.y - 14, 'STORM VOLLEY!', '#34d399', 1.1);
      } else if (slot === 2) {
        soundEngine.playPowerup();
        rt.skillZones.push({
          id: rt.nextUid++,
          ownerId: p.id,
          kind: 'frost_trap',
          x: cx,
          y: cy,
          radius: 145,
          timer: 5.5,
          maxTimer: 5.5,
          tickTimer: 0.4,
          color: '#38bdf8',
        });
        addFloatingText(rt, cx, p.y - 16, 'FROST TRAP ARMED!', '#38bdf8', 1.1);
      } else if (slot === 3) {
        soundEngine.playCrescentWave();
        const tx = Math.max(120, Math.min(rt.arenaWidth - 120, cx + Math.cos(p.facingAngle) * 155));
        const ty = Math.max(120, Math.min(rt.arenaHeight - 120, cy + Math.sin(p.facingAngle) * 155));
        rt.skillZones.push({
          id: rt.nextUid++,
          ownerId: p.id,
          kind: 'arrow_rain',
          x: tx,
          y: ty,
          radius: 175,
          timer: 3.5,
          maxTimer: 3.5,
          tickTimer: 0.25,
          color: '#34d399',
        });
        addFloatingText(rt, tx, ty - 20, 'ARROW RAIN!', '#34d399', 1.15);
      } else {
        soundEngine.playShockwave();
        rt.screenShake = Math.max(rt.screenShake, 16);
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
          color: '#fde047',
          lifetime: 1.0,
          pierce: 99,
          bossDamage: 3,
        });
        addFloatingText(rt, cx, p.y - 20, 'PHANTOM RAILSHOT!', '#fde047', 1.25);
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
      soundEngine.playShockwave();
      rt.screenShake = Math.max(rt.screenShake, 12);
      rt.energyWaves.push({ x: cx, y: cy, radius: 12, maxRadius: 215, alpha: 0.95, speed: 560, color: '#38bdf8' });
      let cleared = 0;
      rt.bossProjectiles = rt.bossProjectiles.filter((bp) => {
        if (bp.type === 'phantom_clone') return true;
        if (Math.hypot(bp.x + bp.size / 2 - cx, bp.y + bp.size / 2 - cy) <= 210) {
          cleared++;
          return false;
        }
        return true;
      });
      rt.enemies.forEach((e) => {
        if (Math.hypot(e.x + e.size / 2 - cx, e.y + e.size / 2 - cy) <= 215) e.stunTimer = 2.2;
      });
      if (cleared > 0) rt.score += cleared * 35;
      if (rt.isBossLevel && rt.boss.health > 0 && rt.boss.state !== 'comic_intro' && rt.boss.state !== 'dead' && rt.boss.state !== 'phase_transition') {
        if (Math.hypot(rt.boss.x + rt.boss.size / 2 - cx, rt.boss.y + rt.boss.size / 2 - cy) <= 240) {
          handleBossHit(rt, p, false, 1);
        }
      }
      addFloatingText(rt, cx, p.y - 14, cleared > 0 ? `SHOCKWAVE! ${cleared} CLEARED` : 'AEGIS SLAM!', '#38bdf8', 1.1);
    } else if (slot === 2) {
      soundEngine.playDash();
      p.chargeTimer = 0.5;
      p.invulnFrames = Math.max(p.invulnFrames, 0.65);
      p.dashDirX = Math.cos(p.facingAngle);
      p.dashDirY = Math.sin(p.facingAngle);
      addFloatingText(rt, cx, p.y - 14, 'SHIELD RUSH!', '#38bdf8', 1.1);
    } else if (slot === 3) {
      soundEngine.playPowerup();
      p.fortifyTimer = 4.5;
      p.hasShield = true;
      addFloatingText(rt, cx, p.y - 16, 'BULWARK STANCE!', '#0ea5e9', 1.15);
    } else {
      soundEngine.playShockwave();
      rt.screenShake = Math.max(rt.screenShake, 20);
      rt.energyWaves.push({ x: cx, y: cy, radius: 18, maxRadius: 320, alpha: 0.98, speed: 660, color: '#22d3ee' });
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
  if (p.bloodlustTimer > 0) p.bloodlustTimer = Math.max(0, p.bloodlustTimer - dt);
  if (p.chargeTimer > 0) p.chargeTimer = Math.max(0, p.chargeTimer - dt);

  // Forbidden Cheat Overrides
  if (rt.cheats.zeroCooldowns) {
    p.dashReady = true;
    p.dashCooldownTimer = 0;
    p.dash2Ready = true;
    p.dash2CooldownTimer = 0;
    p.abilityReady = true;
    p.abilityCooldownTimer = 0;
    p.skillCooldowns = [0, 0, 0, 0];
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

  // Vanguard / Tank Shield passive shield regen
  const hasShieldRegen = (!rt.isOnlineCampaign && p.heroClass === 'vanguard') || p.weapon === 'tank_shield';
  if (hasShieldRegen && !p.hasShield) {
    p.shieldRegenTimer -= dt;
    if (p.shieldRegenTimer <= 0) {
      p.hasShield = true;
      p.shieldRegenTimer = 24;
      soundEngine.playPowerup();
      addFloatingText(rt, p.x + p.size / 2, p.y - 12, 'SHIELD RECHARGED', '#38bdf8', 0.95);
    }
  }

  const isVoidP2 = rt.bossType === 'void' && rt.isBossLevel && rt.boss.phase === 2;
  if (isVoidP2 && !p.dash2Active) {
    p.dash2Active = true;
    p.dash2Ready = true;
  }

  const allowArrowMirror = rt.numPlayers === 1 || rt.isOnlineCampaign;
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
    (p.id === 2 && !rt.isOnlineCampaign ? !!keys['.'] : !!keys['q'] || !!keys['2']);
  const skill3Pressed =
    !!touchInput?.skill3 ||
    (p.id === 2 && !rt.isOnlineCampaign ? !!keys[';'] : !!keys['r'] || !!keys['3']);
  const skill4Pressed =
    !!touchInput?.skill4 ||
    (p.id === 2 && !rt.isOnlineCampaign ? !!keys["'"] : !!keys['f'] || !!keys['4']);

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

  // Trigger Shop Purchase / Weapon Swap / Skill 1 on [E]
  if (abilityPressed && !p._lastAbilityPressed) {
    const pcx = p.x + p.size / 2;
    const pcy = p.y + p.size / 2;
    let interacted = false;

    if (rt.isOnlineCampaign && rt.shopItems.length > 0) {
      const nearShop = rt.shopItems.find(
        (s) => !s.globalSold && !s.purchasedBy.includes(p.id) && Math.hypot(s.x - pcx, s.y - pcy) <= 46
      );
      if (nearShop) {
        purchaseShopItem(rt, p, nearShop);
        interacted = true;
      }
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

      if ((!rt.isOnlineCampaign && p.heroClass === 'phantom') || p.weapon === 'assassin_blades') {
        rt.voidDecoys.push({
          x: p.x + p.size / 2,
          y: p.y + p.size / 2,
          timer: 0.55,
          maxTimer: 0.55,
          color: '#a855f7',
          ownerId: p.id,
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
    p.vx = p.dashDirX * chargeSpeed * (dt * 60);
    p.vy = p.dashDirY * chargeSpeed * (dt * 60);
    p.x += p.vx;
    p.y += p.vy;
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
    const moveSpeed = p.speed * speedMult * (dt * 60);
    p.vx = dirX * moveSpeed;
    p.vy = dirY * moveSpeed;
    p.x += p.vx;
    p.y += p.vy;
  }

  p.x = Math.max(0, Math.min(rt.arenaWidth - p.size, p.x));
  p.y = Math.max(0, Math.min(rt.arenaHeight - p.size, p.y));

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
  p.abilityCooldownTimer = p.skillCooldowns[0];
  p.abilityReady = (!rt.isOnlineCampaign || p.weapon !== 'none') && p.skillCooldowns[0] <= 0;

  for (let ti = p.dashTrail.length - 1; ti >= 0; ti--) {
    p.dashTrail[ti].alpha -= dt * 4.2;
    if (p.dashTrail[ti].alpha <= 0) p.dashTrail.splice(ti, 1);
  }
}

function handleBossHit(
  rt: GameRuntime,
  player: Player,
  consumeKnife = true,
  bonusDamage = 0
): 'hit' | 'phase_transition' | 'dead' {
  const b = rt.boss;
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;
  const isWeakened = b.state === 'weakened';
  let baseDmg = (hasBoon(rt, 'berserker_blade') ? 2 : 1) + bonusDamage;
  if (player.empoweredStrike) {
    baseDmg += 1;
    player.empoweredStrike = false;
  }

  const aliveCoopCount = rt.players.filter((pl) => pl.state === 'alive').length;
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
  if (rt.cheats.oneHitKill) {
    dmg = Math.max(dmg, b.health);
  }
  b.health = Math.max(0, b.health - dmg);
  if (isWeakened) {
    b.weakenedHits++;
  }
  if (consumeKnife) {
    rt.bossHitCooldowns[player.id] = 0.42;
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
  } else if (isWeakened) {
    soundEngine.playBossDamaged();
    addFloatingText(rt, cx + (Math.random() - 0.5) * 30, cy - 28, `WEAKENED 2X! -${dmg}`, '#22d3ee', 1.3);
  } else {
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
    twin_beacons: ['Unite Solar and Lunar seals!', 'Prove your bond!'],
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
        b.stateTimer = 0.85;
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
        b.stateTimer = 0.85;
      }
      break;

    case 'idle':
      if (b.stateTimer <= 0) {
        const isNightmare = rt.difficulty === 'hard';
        const { pace: diffPace } = getDiffScale(rt);
        b.state = 'telegraph';
        b.stateTimer = isNightmare ? (isP2 ? 0.65 : 0.78) : (isP2 ? 0.78 : 0.98) / diffPace;
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
        b.stateTimer = 0.9;
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
        b.stateTimer = 0.9;
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
        b.stateTimer = 0.85;
        initVoidTentacles(rt);
      }
      break;

    case 'idle':
      if (b.stateTimer <= 0) {
        const isNightmare = rt.difficulty === 'hard';
        const { pace: diffPace } = getDiffScale(rt);
        b.state = 'telegraph';
        b.stateTimer = isNightmare ? (isP2 ? 0.7 : 0.85) : (isP2 ? 0.85 : 1.1) / diffPace;
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
        b.stateTimer = 0.9;
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
      if (p.sealTimer <= 0) {
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
        b.stateTimer = 0.85;
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
        b.stateTimer = 0.9;
      }
      break;

    case 'idle':
      if (b.stateTimer <= 0) {
        const isNightmare = rt.difficulty === 'hard';
        const { pace: diffPace } = getDiffScale(rt);
        b.state = 'telegraph';
        b.stateTimer = isNightmare ? (isP2 ? 0.68 : 0.82) : (isP2 ? 0.8 : 1.05) / diffPace;
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
        b.stateTimer = 0.95;
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
        b.stateTimer = 0.85;
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
        b.stateTimer = 0.85;
      }
      break;

    case 'idle':
      if (b.stateTimer <= 0) {
        const isNightmare = rt.difficulty === 'hard';
        const { pace: diffPace } = getDiffScale(rt);
        b.state = 'telegraph';
        b.stateTimer = isNightmare ? (isP2 ? 0.72 : 0.86) : (isP2 ? 0.85 : 1.05) / diffPace;

        const coopPoolP1 = [
          'eclipse_prison',
          'twin_beacons',
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
          'twin_beacons',
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
          twin_beacons: 'CO-OP: SOLAR & LUNAR SEALS',
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

        if (b.attackPattern === 'twin_beacons') {
          if (!bothAliveCoop) {
            b.attackPattern = 'solar_lunar_nova';
            b.stateTimer = isP2 ? 2.8 : 3.2;
          } else {
            b.stateTimer = 6.5;
            rt.eclipseSyncTimer = 0;
            const yPos = Math.round(rt.arenaHeight * 0.65);
            rt.eclipseBeacons = [
              { x: 260, y: yPos, radius: 76, role: 'solar', ownerId: 1, active: true, occupied: false },
              { x: rt.arenaWidth - 260, y: yPos, radius: 76, role: 'lunar', ownerId: 2, active: true, occupied: false },
            ];
            showPhaseAnnounce(rt, 'CHANNEL SOLAR & LUNAR SEALS TOGETHER!', '#fbbf24', 2.4);
          }
        } else if (b.attackPattern === 'eclipse_tether') {
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

      if (b.attackPattern === 'twin_beacons') {
        if (!bothAliveCoop) {
          rt.eclipseBeacons = [];
          b.state = 'idle';
          b.stateTimer = 0.7;
          b.attackLabel = '';
          return;
        }
        const b1 = rt.eclipseBeacons[0];
        const b2 = rt.eclipseBeacons[1];
        if (b1 && b2) {
          b1.occupied = aliveCoopPlayers.some(
            (pl) => Math.hypot(pl.x + pl.size / 2 - b1.x, pl.y + pl.size / 2 - b1.y) <= b1.radius
          );
          b2.occupied = aliveCoopPlayers.some(
            (pl) => Math.hypot(pl.x + pl.size / 2 - b2.x, pl.y + pl.size / 2 - b2.y) <= b2.radius
          );
          if (b1.occupied && b2.occupied) {
            rt.eclipseSyncTimer += dt;
            if (rt.eclipseSyncTimer >= 0.65) {
              rt.eclipseBeacons = [];
              rt.eclipseSyncTimer = 0;
              rt.energyWaves.push({ x: b1.x, y: b1.y, radius: 10, maxRadius: 420, alpha: 0.9, speed: 340, color: '#fbbf24' });
              rt.energyWaves.push({ x: b2.x, y: b2.y, radius: 10, maxRadius: 420, alpha: 0.9, speed: 340, color: '#38bdf8' });
              grantCoopResonance(rt, 'SOUL RESONANCE — EXPOSED!', '#fde047');
              triggerBossExposedWindow(rt, 'SOUL RESONANCE — 2X DAMAGE!');
              return;
            }
          } else {
            rt.eclipseSyncTimer = Math.max(0, rt.eclipseSyncTimer - dt * 0.6);
          }
        }

        const iv = isNightmare ? 0.62 : 0.85 / diffPace;
        if (Math.floor(b.attackTimer / iv) > Math.floor((b.attackTimer - dt) / iv)) {
          const orbCount = isNightmare ? 14 : 10;
          for (let i = 0; i < orbCount; i++) {
            const ang = (i / orbCount) * Math.PI * 2 + b.attackTimer * 0.45;
            pushBossProj(rt, {
              uid: rt.nextUid++,
              x: cx,
              y: cy,
              dx: Math.cos(ang) * 4.0 * spd,
              dy: Math.sin(ang) * 4.0 * spd,
              size: 14,
              speed: 1,
              color: i % 2 === 0 ? '#fbbf24' : '#38bdf8',
              damage: 14,
              shape: 'orb',
            });
          }
          soundEngine.playBossAttackExecuteSfx('eclipse_nova');
        }

        if (b.stateTimer <= 0) {
          triggerCoopPunishment(
            rt,
            'SEALS FAILED — ECLIPSE JUDGMENT UNLEASHED!',
            aliveCoopPlayers,
            isNightmare ? 26 : 20
          );
          return;
        }
      } else if (b.attackPattern === 'eclipse_tether') {
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
        b.attackPattern === 'twin_beacons' ||
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
        b.stateTimer = 0.9;
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

function updateCamera(rt: GameRuntime, dt: number) {
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
    if (rt.shopItems.length > 0) {
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
      activePattern === 'twin_beacons' ||
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

  const spanW = Math.max(480, maxX - minX + padX);
  const spanH = Math.max(380, maxY - minY + padY);
  const targetZoom = Math.min(maxZoom, Math.max(minZoom, Math.min(CANVAS_WIDTH / spanW, CANVAS_HEIGHT / spanH)));

  const halfW = CANVAS_WIDTH / (2 * targetZoom);
  const halfH = CANVAS_HEIGHT / (2 * targetZoom);
  if (halfW * 2 >= rt.arenaWidth) {
    tx = rt.arenaWidth / 2;
  } else {
    tx = Math.max(halfW - 24, Math.min(rt.arenaWidth - halfW + 24, tx));
  }
  if (halfH * 2 >= rt.arenaHeight) {
    ty = rt.arenaHeight / 2;
  } else {
    ty = Math.max(halfH - 24, Math.min(rt.arenaHeight - halfH + 24, ty));
  }

  const zoomRate = targetZoom < rt.camera.zoom ? 6.5 : 4.5;
  rt.camera.zoom += (targetZoom - rt.camera.zoom) * (1 - Math.exp(-zoomRate * dt));
  const panDamp = 1 - Math.exp(-5.8 * dt);
  rt.camera.x += (tx - rt.camera.x) * panDamp;
  rt.camera.y += (ty - rt.camera.y) * panDamp;
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
  const dt = Math.min(rawDt, 0.05);

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

  const dtS = dt * rt.timeScale;

  if (rt.introPlaying) {
    rt.introTimer += dt;
    if (rt.fadeOpacity > 0) rt.fadeOpacity = Math.max(0, rt.fadeOpacity - dt * 0.75);
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

  if (rt.freezeTime > 0) {
    rt.freezeTime -= dt;
    return;
  }

  const remoteMap: Record<number, TouchInputState> =
    remoteInputs && typeof (remoteInputs as TouchInputState).x === 'number'
      ? { 2: remoteInputs as TouchInputState }
      : ((remoteInputs as Record<number, TouchInputState>) || {});

  rt.players.forEach((pl) => {
    if (pl.state === 'spectator') return;
    if (pl.id === 1) {
      updatePlayer(rt, pl, dt, keys, controls.p1, touchInput);
    } else {
      const rem = remoteMap[pl.id];
      const useLocalP2Keys = !rt.isOnlineCampaign && pl.id === 2 && !rem;
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
        rt.players.forEach((ally) => {
          if (ally.state === 'alive' && Math.hypot(ally.x + ally.size / 2 - z.x, ally.y + ally.size / 2 - z.y) <= z.radius) {
            ally.hp = Math.min(ally.maxHp, ally.hp + 4);
            addFloatingText(rt, ally.x + ally.size / 2, ally.y - 10, '+4 HP', '#fde047', 0.8);
          }
        });
        rt.enemies.forEach((e) => {
          if (Math.hypot(e.x + e.size / 2 - z.x, e.y + e.size / 2 - z.y) <= z.radius) {
            e.dx *= 0.85;
            e.dy *= 0.85;
          }
        });
      } else if (z.kind === 'frost_trap') {
        z.tickTimer = 0.65;
        let hitTarget: { x: number; y: number } | null = null;
        for (const e of rt.enemies) {
          if (Math.hypot(e.x + e.size / 2 - z.x, e.y + e.size / 2 - z.y) <= z.radius) {
            e.stunTimer = Math.max(e.stunTimer || 0, 0.45);
            hitTarget = { x: e.x + e.size / 2, y: e.y + e.size / 2 };
            break;
          }
        }
        if (!hitTarget && rt.isBossLevel && rt.boss.health > 0 && rt.boss.state !== 'comic_intro' && rt.boss.state !== 'dead') {
          const bcx = rt.boss.x + rt.boss.size / 2;
          const bcy = rt.boss.y + rt.boss.size / 2;
          if (Math.hypot(bcx - z.x, bcy - z.y) <= z.radius + 90) {
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
            dx: Math.cos(ang) * 11,
            dy: Math.sin(ang) * 11,
            angle: ang,
            radius: 13,
            color: z.color,
            lifetime: 0.75,
            pierce: 1,
          });
        }
      } else if (z.kind === 'arrow_rain') {
        z.tickTimer = 0.38;
        for (let ei = rt.enemies.length - 1; ei >= 0; ei--) {
          const e = rt.enemies[ei];
          if (Math.hypot(e.x + e.size / 2 - z.x, e.y + e.size / 2 - z.y) <= z.radius) {
            rt.lastKilledPos = { x: e.x + e.size / 2, y: e.y + e.size / 2 };
            rt.enemies.splice(ei, 1);
            rt.kills++;
            updateCombo(rt, z.ownerId);
            soundEngine.playSlash(1);
            addSlashArc(rt, e.x + e.size / 2, e.y + e.size / 2, Math.PI / 2, '#34d399', 26);
            break;
          }
        }
        if (rt.isBossLevel && rt.boss.health > 0 && rt.boss.state !== 'comic_intro' && rt.boss.state !== 'dead' && rt.boss.state !== 'phase_transition') {
          const bcx = rt.boss.x + rt.boss.size / 2;
          const bcy = rt.boss.y + rt.boss.size / 2;
          if (Math.hypot(bcx - z.x, bcy - z.y) <= z.radius + rt.boss.size / 2 && rt.bossHitCooldowns[z.ownerId] <= 0) {
            const owner = rt.players.find((pl) => pl.id === z.ownerId) || rt.players[0];
            handleBossHit(rt, owner, false);
            rt.bossHitCooldowns[z.ownerId] = 0.65;
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
      rt.bossProjectiles = rt.bossProjectiles.filter(
        (bp) => bp.type === 'phantom_clone' || Math.hypot(bp.x + bp.size / 2 - pcx, bp.y + bp.size / 2 - pcy) > 84
      );
      for (let ei = rt.enemies.length - 1; ei >= 0; ei--) {
        const e = rt.enemies[ei];
        if (Math.hypot(e.x + e.size / 2 - pcx, e.y + e.size / 2 - pcy) <= 84) {
          rt.lastKilledPos = { x: e.x + e.size / 2, y: e.y + e.size / 2 };
          rt.enemies.splice(ei, 1);
          rt.kills++;
          updateCombo(rt, pl.id);
          soundEngine.playSlash(2);
          addSlashArc(rt, e.x + e.size / 2, e.y + e.size / 2, pl.animTime * 10, pl.color, 34);
        }
      }
    }
    if (pl.chargeTimer > 0) {
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
          pl.chargeTimer = 0;
          rt.bossHitCooldowns[pl.id] = 0.5;
        }
      }
    }
  });

  // Player Projectiles (Crescent Wave, Cataclysm, Arc Bolts, Arrows, Kunai, Frost Shards)
  for (let pi = rt.playerProjectiles.length - 1; pi >= 0; pi--) {
    const pp = rt.playerProjectiles[pi];
    pp.lifetime -= dt;
    pp.x += pp.dx * (dt * 60);
    pp.y += pp.dy * (dt * 60);
    if (pp.lifetime <= 0 || pp.x < -80 || pp.x > rt.arenaWidth + 80 || pp.y < -80 || pp.y > rt.arenaHeight + 80) {
      rt.playerProjectiles.splice(pi, 1);
      continue;
    }

    // Slice boss bullets in path (Crescent & Cataclysm)
    if (pp.kind === 'crescent' || pp.kind === 'cataclysm') {
      rt.bossProjectiles = rt.bossProjectiles.filter((bp) => {
        if (bp.type === 'phantom_clone') return true;
        return Math.hypot(bp.x + bp.size / 2 - pp.x, bp.y + bp.size / 2 - pp.y) > pp.radius + bp.size / 2;
      });
    }

    // Hit enemies
    for (let ei = rt.enemies.length - 1; ei >= 0; ei--) {
      const e = rt.enemies[ei];
      if (Math.hypot(e.x + e.size / 2 - pp.x, e.y + e.size / 2 - pp.y) < pp.radius + e.size / 2) {
        rt.lastKilledPos = { x: e.x + e.size / 2, y: e.y + e.size / 2 };
        rt.enemies.splice(ei, 1);
        rt.kills++;
        updateCombo(rt, pp.ownerId);
        soundEngine.playSlash(rt.playerCombos[pp.ownerId]?.count || 1);
        addSlashArc(rt, e.x + e.size / 2, e.y + e.size / 2, pp.angle, pp.color, 36);
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
        handleBossHit(rt, owner, false, Math.max(0, (pp.bossDamage || 1) - 1));
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
        // Instant beam hit check (Heavy Signature Telegraph Attack: 36 DMG)
        rt.players.forEach((p) => {
          if (p.state === 'alive' && pointToSegmentDist(p.x + p.size / 2, p.y + p.size / 2, tl.x1, tl.y1, tl.x2, tl.y2) < p.size * 0.45) {
            damagePlayer(rt, p, 36);
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

  // Boss logic
  if (rt.isBossLevel) {
    if (rt.bossType === 'mecha') updateMechaBoss(rt, dt);
    else if (rt.bossType === 'void') updateVoidBoss(rt, dt);
    else if (rt.bossType === 'eclipse') updateEclipseBoss(rt, dt);
    else updateOniBoss(rt, dt);

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
              (!rt.isOnlineCampaign && player.heroClass === 'ronin') ||
              (rt.isOnlineCampaign && player.weapon === 'warrior_greatsword'))
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

  // Medkit & Relic Spawns (suppressed during early tutorial steps)
  if (!rt.isTutorial) {
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
          const reviveMult = aliveP.weapon === 'holy_staff' ? 1.22 : 1.0;
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
    if (e.stunTimer && e.stunTimer > 0) {
      e.stunTimer -= dt;
      continue;
    }
    e.rotation += dt * 4.5;

    if (e.type === 'charger') {
      e.chargeTimer = (e.chargeTimer || 0) - dt;
      if (e.chargeState === 'roam') {
        e.x += e.dx * e.speed * (dt * 60);
        e.y += e.dy * e.speed * (dt * 60);
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
        e.x += e.dx * e.speed * 3.4 * (dt * 60);
        e.y += e.dy * e.speed * 3.4 * (dt * 60);
        if (e.chargeTimer <= 0) {
          e.chargeState = 'roam';
          e.chargeTimer = 1.6 + Math.random() * 1.4;
        }
      }
    } else if (e.type === 'void_stalker') {
      e.x += e.dx * e.speed * (dt * 60);
      e.y += e.dy * e.speed * (dt * 60);
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
      e.x += e.dx * e.speed * (dt * 60);
      e.y += e.dy * e.speed * (dt * 60);
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
      e.x += e.dx * e.speed * (dt * 60);
      e.y += e.dy * e.speed * (dt * 60);
    }

    if (e.x <= 0) { e.x = 0; e.dx = Math.abs(e.dx); }
    if (e.x + e.size >= rt.arenaWidth) { e.x = rt.arenaWidth - e.size; e.dx = -Math.abs(e.dx); }
    if (e.y <= 0) { e.y = 0; e.dy = Math.abs(e.dy); }
    if (e.y + e.size >= rt.arenaHeight) { e.y = rt.arenaHeight - e.size; e.dy = -Math.abs(e.dy); }

    let sliced = false;
    for (const player of rt.players) {
      if (player.state !== 'alive') continue;
      const bladeReach =
        player.hasKnife && player.dashImmune
          ? (hasBoon(rt, 'twin_spark') ? 22 : 12) +
            ((!rt.isOnlineCampaign && player.heroClass === 'ronin') ||
            (rt.isOnlineCampaign && player.weapon === 'warrior_greatsword')
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
          sliced = true;
          rt.lastKilledPos = { x: e.x + e.size / 2, y: e.y + e.size / 2 };
          if (!rt.cheats.alwaysArmed) {
            player.hasKnife = false;
            repositionKnifeForPlayer(rt, player);
          }
          rt.kills++;
          rt.screenShake = Math.max(rt.screenShake, 8);
          rt.freezeTime = 0.045;
          updateCombo(rt, player.id);
          const comboVal = rt.playerCombos[player.id]?.count || 1;
          soundEngine.playSlash(comboVal);
          addSlashArc(rt, e.x + e.size / 2, e.y + e.size / 2, player.facingAngle, player.color, 44);
          addFloatingText(rt, e.x + e.size / 2, e.y - 6, comboVal > 1 ? `${comboVal}x EXECUTE!` : 'SLICED!', player.color, 1.0);

          if (e.type === 'splitter') {
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
              });
            }
          }
          break;
        } else if (
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
    if (sliced) rt.enemies.splice(i, 1);
  }

  // Knives pickup + magnet + hidden 6s lucky-spawn expiration
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

      if (!player.hasKnife && (player.magnetTimer > 0 || hasBoon(rt, 'blade_magnet'))) {
        const dx = player.x + player.size / 2 - (knife.x + knife.size / 2);
        const dy = player.y + player.size / 2 - (knife.y + knife.size / 2);
        const dist = Math.hypot(dx, dy) || 1;
        const pullSpeed = player.magnetTimer > 0 ? 210 : 95;
        knife.x += (dx / dist) * pullSpeed * dt;
        knife.y += (dy / dist) * pullSpeed * dt;
      }

      if (
        !player.hasKnife &&
        player.x < knife.x + knife.size &&
        player.x + player.size > knife.x &&
        player.y < knife.y + knife.size &&
        player.y + player.size > knife.y
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
    // 1. Weapon Drops (auto-equip if unarmed; press [E] near drop to swap)
    for (let wi = rt.weaponDrops.length - 1; wi >= 0; wi--) {
      const wd = rt.weaponDrops[wi];
      wd.bob += dt * 3.5;
      if (wd.swapLockTimer > 0) wd.swapLockTimer = Math.max(0, wd.swapLockTimer - dt);
      if (wd.swapLockTimer <= 0) {
        const unarmedFinder = rt.players.find(
          (pl) => pl.state === 'alive' && pl.weapon === 'none' && Math.hypot(pl.x + pl.size / 2 - wd.x, pl.y + pl.size / 2 - wd.y) <= 38
        );
        if (unarmedFinder) {
          rt.weaponDrops.splice(wi, 1);
          equipWeapon(rt, unarmedFinder, wd.weaponId);
        }
      }
    }

    // 1b. Skill Scroll Drops (walk over to unlock next Skill Slot [Q]/[R]/[F], or +15g if already 4/4)
    for (let si = rt.scrollDrops.length - 1; si >= 0; si--) {
      const sd = rt.scrollDrops[si];
      sd.bob += dt * 4.2;
      const picker = rt.players.find(
        (pl) => pl.state === 'alive' && Math.hypot(pl.x + pl.size / 2 - sd.x, pl.y + pl.size / 2 - sd.y) <= 40
      );
      if (picker) {
        rt.scrollDrops.splice(si, 1);
        soundEngine.playBoonSelect();
        rt.energyWaves.push({ x: sd.x, y: sd.y, radius: 10, maxRadius: 120, alpha: 0.9, speed: 360, color: '#c084fc' });
        if (picker.unlockedSkillTier < 4) {
          picker.unlockedSkillTier++;
          const wDef = WEAPONS_CATALOG.find((w) => w.id === picker.weapon);
          const sk = wDef?.skills[picker.unlockedSkillTier - 1];
          addFloatingText(
            rt,
            sd.x,
            sd.y - 18,
            sk ? `SCROLL: ${sk.name.toUpperCase()} [${sk.keyLabel}]!` : `SKILL SLOT ${picker.unlockedSkillTier} UNLOCKED!`,
            '#c084fc',
            1.25
          );
        } else {
          picker.coins += 15;
          addFloatingText(rt, sd.x, sd.y - 18, 'SCROLL CONVERTED +15g', '#fbbf24', 1.1);
        }
      }
    }

    // 2. Chests (walk over to open -> equal Gold share OR exclusive Weapon drop + bonus Skill Scroll chance)
    rt.chests.forEach((ch) => {
      if (ch.opened) {
        ch.openAnim = Math.min(1, ch.openAnim + dt * 3.2);
        return;
      }
      const opener = rt.players.find(
        (pl) => pl.state === 'alive' && Math.hypot(pl.x + pl.size / 2 - ch.x, pl.y + pl.size / 2 - ch.y) <= 44
      );
      if (opener) {
        ch.opened = true;
        soundEngine.playBoonSelect();
        rt.energyWaves.push({ x: ch.x, y: ch.y, radius: 10, maxRadius: 150, alpha: 0.9, speed: 340, color: '#fbbf24' });
        if (ch.rewardKind === 'coins') {
          const activeParty = rt.players.filter((pl) => pl.state !== 'spectator');
          const perPlayer = Math.max(10, Math.round((ch.coinsTotal || 40) / Math.max(1, activeParty.length)));
          activeParty.forEach((pl) => {
            pl.coins += perPlayer;
          });
          addFloatingText(rt, ch.x, ch.y - 26, `+${perPlayer}g EACH PLAYER!`, '#fbbf24', 1.3);
        } else {
          const wid = ch.weaponId || pickRandomWeaponId(rt, true);
          rt.weaponDrops.push({
            id: rt.nextUid++,
            weaponId: wid,
            x: ch.x,
            y: ch.y + 24,
            size: 28,
            bob: 0,
            swapLockTimer: 0.35,
          });
          const wDef = WEAPONS_CATALOG.find((w) => w.id === wid);
          addFloatingText(rt, ch.x, ch.y - 26, `CHEST: ${wDef?.name.toUpperCase() || 'WEAPON'}!`, wDef?.accent || '#38bdf8', 1.25);
        }

        const someoneNeedsScroll = rt.players.some((pl) => pl.state !== 'spectator' && pl.unlockedSkillTier < 4);
        if (someoneNeedsScroll && Math.random() < 0.55) {
          spawnSkillScroll(rt, ch.x + 56, ch.y - 12, 'RELIC SCROLL');
        }
      }
    });

    // 3. Shop Pedestals (stand 0.65s or press [E] to purchase)
    rt.shopItems.forEach((item) => {
      if (item.globalSold) return;
      rt.players.forEach((pl) => {
        const key = `${pl.id}-${item.id}`;
        if (pl.state !== 'alive' || item.purchasedBy.includes(pl.id)) {
          delete rt.shopBuyTimers[key];
          return;
        }
        const dist = Math.hypot(pl.x + pl.size / 2 - item.x, pl.y + pl.size / 2 - item.y);
        if (dist <= 40 && pl.coins >= item.cost) {
          rt.shopBuyTimers[key] = (rt.shopBuyTimers[key] || 0) + dt;
          if (rt.shopBuyTimers[key] >= 0.65) {
            delete rt.shopBuyTimers[key];
            purchaseShopItem(rt, pl, item);
          }
        } else {
          delete rt.shopBuyTimers[key];
        }
      });
    });

    // 4. Connected Floor Gates (stand all alive party members inside chosen gate)
    if (rt.gates.length > 0 && alivePlayers.length > 0) {
      let enteredGate: DungeonGate | null = null;
      rt.gates.forEach((g) => {
        g.playersInside = [];
        alivePlayers.forEach((pl) => {
          const pcx = pl.x + pl.size / 2;
          const pcy = pl.y + pl.size / 2;
          if (pcx >= g.x - 10 && pcx <= g.x + g.width + 10 && pcy >= g.y - 10 && pcy <= g.y + g.height + 10) {
            g.playersInside.push(pl.id);
          }
        });
        if (g.playersInside.length === alivePlayers.length) {
          g.holdProgress = Math.min(1, g.holdProgress + dt / 0.85);
          if (g.holdProgress >= 1 && !enteredGate) {
            enteredGate = g;
          }
        } else {
          g.holdProgress = Math.max(0, g.holdProgress - dt * 1.4);
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
        room.cleared = true;
        rt.bossProjectiles = [];
        const cxDrop = rt.lastKilledPos ? rt.lastKilledPos.x : rt.arenaWidth / 2;
        const cyDrop = rt.lastKilledPos ? rt.lastKilledPos.y : rt.arenaHeight / 2;
        spawnRoomChest(rt, cxDrop, cyDrop);
        saveCurrentRoomState(rt);
        spawnConnectedGates(rt, room);
        soundEngine.playParry();
        showPhaseAnnounce(rt, 'ROOM CLEARED! OPEN CHEST & CHOOSE A GATE!', '#34d399', 2.8);
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
        rt.players.forEach((pl) => {
          if (pl.state !== 'spectator') {
            pl.state = 'alive';
            pl.invulnerable = false;
            pl.invulnFrames = 1.5;
            pl.hp = Math.min(pl.maxHp, pl.hp + 30);
            pl.coins += 35 + Math.max(0, rt.loopLevel - 1) * 15;
          }
        });
        spawnRoomChest(rt, cx - 55, cy, 'weapon');
        spawnSkillScroll(rt, cx + 55, cy, 'BOSS SKILL SCROLL');
        const room = rt.floorGrid[rt.currentRoomKey];
        if (room) {
          room.cleared = true;
          room.nextFloorPortalOpen = true;
          saveCurrentRoomState(rt);
          spawnConnectedGates(rt, room);
        }
        soundEngine.setMusicTrack(getCampaignDungeonStage(rt.bossesDefeatedCount), false);
        showPhaseAnnounce(rt, 'BOSS VANQUISHED! LOOT CHEST, SCROLL & ENTER NEXT FLOOR PORTAL!', '#fbbf24', 3.4);
      } else if (rt.isOnlineCampaign && rt.stage === 'eclipseBoss') {
        const room = rt.floorGrid[rt.currentRoomKey];
        if (room) room.cleared = true;
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
  } else {
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
        // Light Orb (12 DMG)
        pushBossProj(rt, { uid: rt.nextUid++, x: 400, y: 120, dx: Math.cos(ang) * 3.8, dy: Math.sin(ang) * 3.8, size: 15, speed: 1, color: '#38bdf8', damage: 12, shape: 'orb' });
        addFloatingText(rt, 400, 100, 'LIGHT ORB (12 DMG)', '#38bdf8', 0.85);
      } else if (cycle === 1) {
        // Heavy Ember (24 DMG)
        pushBossProj(rt, { uid: rt.nextUid++, x: 400, y: 120, dx: Math.cos(ang) * 3.4, dy: Math.sin(ang) * 3.4, size: 20, speed: 1, color: '#f97316', damage: 24, shape: 'ember' });
        addFloatingText(rt, 400, 100, 'HEAVY EMBER (24 DMG)', '#f97316', 0.85);
      } else {
        // Telegraph Lance Beam (36 DMG)
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
      if (rt.boss.attackPattern === 'twin_beacons' && rt.eclipseBeacons.length === 2) {
        coopPrompt =
          rt.eclipseSyncTimer > 0
            ? `RESONANCE LOCKING... ${Math.round((rt.eclipseSyncTimer / 0.65) * 100)}%`
            : 'CO-OP: STAND ON BOTH SOLAR (GOLD) & LUNAR (CYAN) SEALS TOGETHER!';
      } else if (rt.boss.attackPattern === 'eclipse_tether') {
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
      coopPrompt = 'WALK OVER CHEST TO OPEN · THEN CHOOSE TOP / BOTTOM / LEFT / RIGHT GATE!';
    } else if (rt.weaponDrops.length > 0) {
      coopPrompt = 'WALK OVER WEAPON TO EQUIP (OR PRESS [E] TO SWAP) · ENTER A GATE TO ADVANCE';
    } else if (rt.roomKind === 'shop') {
      coopPrompt = 'MERCHANT SHOP: STAND OR PRESS [E] ON PEDESTALS TO BUY · ENTER ANY GATE WHEN READY';
    } else if (rt.gates.length > 0) {
      coopPrompt = 'PARTY CHOICE: GATHER ALL PLAYERS INSIDE TOP, BOTTOM, LEFT, OR RIGHT GATE!';
    }
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
      title: 'DRILL 3 · CLASS PASSIVES & [E] SKILL',
      obj: 'Switch frames below & press [E] Skill twice to test abilities',
      prog: Math.min(2, rt.tutorialSkillUses),
      total: 2,
    },
    4: {
      title: 'DRILL 4 · 100 HP & DAMAGE TIERS',
      obj: 'Light (12) / Heavy (24) / Railgun (36) · Grab Estus (+35 HP)',
      prog: 1,
      total: 1,
    },
  };
  const tm = tutorialMeta[rt.tutorialStep] || tutorialMeta[1];

  const toPlayerHud = (pl: Player): PlayerHudState => ({
    id: pl.id,
    heroClass: pl.heroClass,
    weapon: pl.weapon,
    coins: pl.coins,
    color: pl.color,
    hp: Math.round(pl.hp),
    maxHp: pl.maxHp,
    bonusMaxHp: pl.bonusMaxHp,
    state: pl.state,
    dashReady: pl.dashReady,
    dashCooldown: Math.ceil(pl.dashCooldownTimer),
    dash2Active: pl.dash2Active,
    dash2Ready: pl.dash2Ready,
    dash2Cooldown: Math.ceil(pl.dash2CooldownTimer),
    abilityReady: pl.abilityReady,
    abilityCooldown: Math.ceil(pl.abilityCooldownTimer),
    unlockedSkillTier: pl.unlockedSkillTier,
    skillCooldowns: [
      Math.ceil(pl.skillCooldowns[0] || 0),
      Math.ceil(pl.skillCooldowns[1] || 0),
      Math.ceil(pl.skillCooldowns[2] || 0),
      Math.ceil(pl.skillCooldowns[3] || 0),
    ],
    skillMaxCooldowns: [
      pl.skillMaxCooldowns[0] || 12,
      pl.skillMaxCooldowns[1] || 15,
      pl.skillMaxCooldowns[2] || 18,
      pl.skillMaxCooldowns[3] || 22,
    ],
    hasKnife: pl.hasKnife,
    hasShield: pl.hasShield,
    empowered: pl.empoweredStrike,
    overdrive: pl.overdriveTimer,
    cloak: pl.cloakTimer,
    sealed: pl.sealed,
    combo: rt.playerCombos[pl.id]?.count || 0,
  });

  const activePlayerHuds = rt.players
    .filter((pl) => pl.id <= rt.numPlayers || pl.state !== 'spectator')
    .map(toPlayerHud);

  const p1 = rt.players[0];
  const p2 = rt.players[1] || rt.players[0];

  const floorMap: FloorMapHudSnapshot | undefined = rt.isOnlineCampaign
    ? {
        floorNumber: rt.floorNumber,
        loopLevel: rt.loopLevel,
        currentRoomKey: rt.currentRoomKey,
        gridSize: 5,
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
      }
    : undefined;

  return {
    stage: rt.stage,
    stageLabel: rt.isTutorial
      ? 'TRAINING GROUNDS'
      : rt.isOnlineCampaign
      ? rt.isBossLevel
        ? stageLabels[rt.stage]
        : `FLOOR ${rt.floorNumber} · ${(rt.floorGrid[rt.currentRoomKey]?.label || rt.roomKind.toUpperCase())}`
      : stageLabels[rt.stage],
    waveText: rt.isTutorial
      ? `DRILL ${rt.tutorialStep}/4`
      : rt.isBossLevel
      ? 'BOSS ENCOUNTER'
      : rt.isOnlineCampaign
      ? rt.gates.length > 0
        ? 'GATES OPEN'
        : `COMBAT (${Math.round(getEnemyScaleMult(rt) * 10) / 10}X)`
      : rt.stage === 'ironDungeon'
      ? `WAVE ${rt.waveNumber}/2`
      : 'VANGUARD WAVE',
    isOnlineCampaign: rt.isOnlineCampaign,
    roomKind: rt.roomKind,
    roomDepth: rt.roomDepth,
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
    bossName,
    bossAttackLabel: rt.boss.attackLabel,
    bossVoiceLine: rt.bossVoiceLine,
    bossHealth: rt.boss.health,
    bossMaxHealth: rt.boss.maxHealth,
    bossPhase: rt.boss.phase,
    bossState: rt.boss.state,
    medkitInventoryCount: rt.medkitInventoryCount,
    medkitNotif: rt.medkitNotif,
    phaseAnnounce: rt.phaseAnnounce,
    activeBoons: [...rt.activeBoons],
    coopPrompt,
    cheatsUsed: rt.cheatsUsed || Object.values(rt.cheats).some(Boolean),
    isTutorial: rt.isTutorial,
    tutorialStep: rt.tutorialStep,
    tutorialTitle: tm.title,
    tutorialObjective: tm.obj,
    tutorialProgress: tm.prog,
    tutorialTotal: tm.total,
    players: activePlayerHuds,
    p1: toPlayerHud(p1),
    p2: toPlayerHud(p2),
  };
}
