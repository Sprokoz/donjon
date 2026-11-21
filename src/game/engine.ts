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
  ComicSlash,
  ControlsConfig,
  DeathEffect,
  DEFAULT_CHEATS,
  DIFFICULTY_SETTINGS,
  DifficultyConfig,
  DifficultyKey,
  EclipseBeacon,
  EclipseMirror,
  EclipsePrison,
  EclipsePylon,
  Enemy,
  EnemyType,
  EnergyWave,
  FloatingText,
  GameMode,
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
  PlayerProjectile,
  RelicDrop,
  RelicType,
  RunSummary,
  SlashArc,
  StageKey,
  TelegraphLine,
  VoidDecoy,
  VoidRift,
  VoidTentacle,
} from './types';

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
  numPlayers: 1 | 2;
  playerColors: { 1: string; 2: string };
  playerClasses: { 1: HeroClassId; 2: HeroClassId };
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
  eclipseMarkedBy: null | 1 | 2;
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
  playerCombos: { 1: { count: number; timer: number }; 2: { count: number; timer: number } };
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
  bossHitCooldowns: { 1: number; 2: number };
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
  id: 1 | 2,
  heroClass: HeroClassId,
  x: number,
  y: number,
  color: string,
  diffSettings: DifficultyConfig,
  numPlayers: 1 | 2
): Player {
  const classDef = HERO_CLASSES.find((c) => c.id === heroClass) || HERO_CLASSES[0];
  const isActive = id === 1 || numPlayers === 2;
  const maxHp = diffSettings.baseMaxHp + classDef.bonusHp;

  return {
    id,
    heroClass,
    x,
    y,
    vx: 0,
    vy: 0,
    facingAngle: Math.PI / 2,
    size: 38,
    speed: classDef.baseSpeed,
    color,
    hasKnife: false,
    state: isActive ? 'alive' : 'spectator',
    reviveProgress: 0,
    invulnerable: true,
    inSafeZone: true,
    safeZoneClosed: false,
    dashReady: true,
    dashTime: heroClass === 'ronin' ? 0.18 : 0.16,
    dashCooldown: classDef.dashCooldown,
    dashImmune: false,
    dashTrail: [],
    dashTimeLeft: 0,
    dashCooldownTimer: 0,
    postDashInvulnerability: 0,
    hp: maxHp,
    maxHp,
    dash2Ready: false,
    dash2CooldownTimer: 0,
    dash2Active: false,
    usingDash2: false,
    invulnFrames: 0,
    _lastDashPressed: false,
    _lastAbilityPressed: false,
    abilityReady: true,
    abilityCooldown: classDef.skillCooldown,
    abilityCooldownTimer: 0,
    cloakTimer: 0,
    empoweredStrike: false,
    shieldRegenTimer: heroClass === 'vanguard' ? 24 : 0,
    sealed: false,
    sealTimer: 0,
    hasShield: heroClass === 'vanguard',
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

function spawnKnives(
  numPlayers: 1 | 2,
  playerColors: { 1: string; 2: string },
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT
): Knife[] {
  const k1: Knife = {
    x: width * 0.2 + Math.random() * (width * 0.26),
    y: height * 0.28 + Math.random() * (height * 0.44),
    size: 22,
    color: playerColors[1],
    owner: 1,
    bobPhase: 0,
    luckyTimer: 0,
  };
  if (numPlayers === 1) return [k1];
  const k2: Knife = {
    x: width * 0.54 + Math.random() * (width * 0.26),
    y: height * 0.28 + Math.random() * (height * 0.44),
    size: 22,
    color: playerColors[2],
    owner: 2,
    bobPhase: Math.PI,
    luckyTimer: 0,
  };
  return [k1, k2];
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
  // Hidden 20% luck: spawn blade near the player (max ~5 meters / 165px) for 6 seconds
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

export function createInitialGameRuntime(params: {
  difficulty: DifficultyKey;
  mode: GameMode;
  numPlayers: 1 | 2;
  playerColors: { 1: string; 2: string };
  playerClasses: { 1: HeroClassId; 2: HeroClassId };
  cheats?: CheatsConfig;
}): GameRuntime {
  const activeCheats: CheatsConfig = { ...DEFAULT_CHEATS, ...(params.cheats || {}) };
  const anyCheat = Object.values(activeCheats).some(Boolean);
  const diffSettings = DIFFICULTY_SETTINGS[params.difficulty];
  const isTutorial = params.mode === 'tutorial';
  const isBossStart = params.mode === 'boss_rush';
  const startW = isBossStart ? BOSS_ARENA_WIDTH : CANVAS_WIDTH;
  const startH = isBossStart ? BOSS_ARENA_HEIGHT : CANVAS_HEIGHT;

  const players: Player[] = [
    createPlayer(1, params.playerClasses[1], isBossStart ? startW * 0.34 : 130, -60, params.playerColors[1], diffSettings, params.numPlayers),
    createPlayer(2, params.playerClasses[2], isBossStart ? startW * 0.64 : 630, -60, params.playerColors[2], diffSettings, params.numPlayers),
  ];

  const startStage: StageKey = isBossStart ? 'mechaBoss' : 'ironDungeon';

  const runtime: GameRuntime = {
    difficulty: params.difficulty,
    diffSettings,
    mode: params.mode,
    numPlayers: params.numPlayers,
    playerColors: params.playerColors,
    playerClasses: params.playerClasses,
    stage: startStage,
    waveNumber: 1,
    bossType: 'mecha',
    isBossLevel: isBossStart,
    arenaWidth: startW,
    arenaHeight: startH,
    camera: isBossStart ? { x: startW / 2, y: startH * 0.52, zoom: 0.65 } : { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, zoom: 1 },
    bossVoiceLine: null,
    bossVoiceTimer: 0,
    players,
    playerProjectiles: [],
    voidDecoys: [],
    telegraphLines: [],
    knives: spawnKnives(params.numPlayers, params.playerColors, startW, startH),
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
    ambientMotes: createAmbientMotes(isBossStart ? 52 : 28, startW, startH),
    activeBoons: [],
    score: 0,
    stylePoints: 0,
    grazes: 0,
    kills: 0,
    elapsedSeconds: 0,
    stageElapsed: 0,
    maxCombo: 0,
    playerCombos: { 1: { count: 0, timer: 0 }, 2: { count: 0, timer: 0 } },
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
    p1SafeZone: { x: 50, y: 50, width: 200, height: 185, color: 'rgba(56, 189, 248, 0.12)' },
    p2SafeZone: { x: 550, y: 50, width: 200, height: 185, color: 'rgba(244, 63, 94, 0.12)' },
    isTutorial,
    tutorialStep: 1,
    tutorialSkillUses: 0,
    tutorialGrazesStart: 0,
    tutorialFireTimer: 0.8,
    cheats: activeCheats,
    cheatsUsed: anyCheat,
    bossHitCooldowns: { 1: 0, 2: 0 },
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
  return {
    spd: rt.diffSettings.bulletSpeedMult,
    pace: rt.diffSettings.cadenceMult,
  };
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
  rt.score += Math.round(150 * rt.diffSettings.scoreMultiplier);
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
    if (boonId === 'phantom_step') {
      p.dashCooldown *= 0.72;
      p.abilityCooldown *= 0.72;
    } else if (boonId === 'vampiric_edge') {
      p.hp = Math.min(p.maxHp, p.hp + 25);
    } else if (boonId === 'twin_spark') {
      p.speed *= 1.18;
    } else if (boonId === 'aegis_core') {
      p.hasShield = true;
    }
  });
}

function spawnWaveEnemies(rt: GameRuntime, stage: StageKey, wave: number) {
  rt.enemies = [];
  const alive = rt.players.filter((p) => p.state === 'alive');

  const pickSafePos = (size: number) => {
    let ex = 400;
    let ey = 300;
    for (let att = 0; att < 50; att++) {
      ex = 40 + Math.random() * (CANVAS_WIDTH - 80 - size);
      ey = 60 + Math.random() * (CANVAS_HEIGHT - 120 - size);
      const farEnough = alive.every((p) => Math.hypot(ex - p.x, ey - p.y) > 165);
      if (farEnough) break;
    }
    return { ex, ey };
  };

  let roster: EnemyType[] = [];
  if (stage === 'ironDungeon') {
    roster =
      wave === 1
        ? ['bouncer', 'bouncer', 'bouncer', 'bouncer', 'splitter', 'splitter', 'charger']
        : ['bouncer', 'bouncer', 'splitter', 'splitter', 'charger', 'charger', 'charger'];
  } else if (stage === 'voidDungeon') {
    roster = ['void_stalker', 'void_stalker', 'void_stalker', 'void_stalker', 'charger', 'charger', 'splitter'];
  } else if (stage === 'oniDungeon') {
    roster = ['oni_acolyte', 'oni_acolyte', 'oni_acolyte', 'oni_acolyte', 'charger', 'charger', 'bouncer'];
  }

  const enemySpdMult = rt.difficulty === 'hard' ? 1.32 : rt.difficulty === 'medium' ? 1.24 : 1.1;

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
  rt.arenaWidth = isBossTarget ? BOSS_ARENA_WIDTH : CANVAS_WIDTH;
  rt.arenaHeight = isBossTarget ? BOSS_ARENA_HEIGHT : CANVAS_HEIGHT;
  rt.ambientMotes = createAmbientMotes(isBossTarget ? 52 : 28, rt.arenaWidth, rt.arenaHeight);

  rt.players.forEach((p) => {
    if (p.state === 'spectator') return;
    p.state = 'alive';
    p.invulnerable = true;
    p.invulnFrames = 0;
    p.x = isBossTarget ? (p.id === 1 ? rt.arenaWidth * 0.34 : rt.arenaWidth * 0.64) : (p.id === 1 ? 130 : 630);
    p.y = -220;
    p.hp = Math.min(p.maxHp, p.hp + 30);
    p.dashReady = true;
    p.dashCooldownTimer = 0;
    p.dash2Active = false;
    p.dash2Ready = false;
    p.dash2CooldownTimer = 0;
    p.abilityReady = true;
    p.abilityCooldownTimer = 0;
    p.cloakTimer = 0;
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
    if (hasBoon(rt, 'aegis_core') || p.heroClass === 'vanguard') {
      p.hasShield = true;
    }
  });

  rt.p1SafeZone = { x: 50, y: 50, width: 200, height: 185, color: 'rgba(56, 189, 248, 0.12)' };
  rt.p2SafeZone = { x: 550, y: 50, width: 200, height: 185, color: 'rgba(244, 63, 94, 0.12)' };
  rt.camera = { x: rt.arenaWidth / 2, y: rt.arenaHeight / 2, zoom: isBossTarget ? 0.65 : 1 };

  rt.knives = spawnKnives(rt.numPlayers, rt.playerColors, rt.arenaWidth, rt.arenaHeight);
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

  // Position players & safe zones inside the larger boss battlefield
  const landY = Math.round(rt.arenaHeight * 0.7);
  rt.players.forEach((p) => {
    if (p.state === 'spectator') return;
    p.x = p.id === 1 ? Math.round(rt.arenaWidth * 0.34) : Math.round(rt.arenaWidth * 0.64);
    if (rt.introPlaying) p.y = -180;
    p.safeZoneClosed = false;
    p.inSafeZone = true;
    p.invulnerable = true;
    if (hasBoon(rt, 'aegis_core') || p.heroClass === 'vanguard') {
      p.hasShield = true;
    }
  });
  rt.p1SafeZone = {
    x: Math.round(rt.arenaWidth * 0.34) - 80,
    y: landY - 75,
    width: 210,
    height: 190,
    color: 'rgba(56, 189, 248, 0.1)',
  };
  rt.p2SafeZone = {
    x: Math.round(rt.arenaWidth * 0.64) - 80,
    y: landY - 75,
    width: 210,
    height: 190,
    color: 'rgba(244, 63, 94, 0.1)',
  };
  rt.knives = spawnKnives(rt.numPlayers, rt.playerColors, rt.arenaWidth, rt.arenaHeight);
  rt.camera = { x: rt.arenaWidth / 2, y: rt.arenaHeight * 0.52, zoom: 0.64 };

  rt.players.forEach((p) => {
    if (p.state !== 'spectator') p.cleanDodgeFailed = false;
  });
  rt.bossHitCooldowns = { 1: 0, 2: 0 };
  const bx = Math.round(rt.arenaWidth / 2 - 58);
  const duoHpMult = rt.numPlayers === 2 ? 2 : 1;
  if (stage === 'mechaBoss') {
    rt.bossType = 'mecha';
    const hp = rt.diffSettings.mechaHP * duoHpMult;
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
    const hp = rt.diffSettings.bossHP * duoHpMult;
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
    const hp = rt.diffSettings.oniHP * duoHpMult;
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
    const hp = rt.diffSettings.eclipseHP * duoHpMult;
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

function updateCombo(rt: GameRuntime, playerId: 1 | 2) {
  const c = rt.playerCombos[playerId];
  c.count++;
  c.timer = 2.6;
  if (c.count > rt.maxCombo) rt.maxCombo = c.count;
  rt.stylePoints = Math.min(100, rt.stylePoints + 8);
  const styleMult = 1 + Math.floor(rt.stylePoints / 20) * 0.15;
  rt.score += Math.round((130 + c.count * 35) * rt.diffSettings.scoreMultiplier * styleMult);

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

  const dmg = Math.max(5, Math.round(rawDamage * (rt.isTutorial ? 0.8 : rt.diffSettings.damageMultiplier)));
  player.hp = Math.max(0, player.hp - dmg);
  player.cleanDodgeFailed = true;
  player.invulnFrames = 0.95;
  rt.stylePoints = Math.max(0, rt.stylePoints - 18);
  rt.screenShake = Math.max(rt.screenShake, dmg >= 28 ? 16 : 11);
  soundEngine.playPlayerHit();
  createDeathEffect(rt, player.x, player.y, player.size, player.color);
  addFloatingText(rt, player.x + player.size / 2, player.y - 12, `-${dmg} HP`, dmg >= 28 ? '#ef4444' : '#fb7185', dmg >= 28 ? 1.25 : 1.05);

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

function triggerHeroAbility(rt: GameRuntime, p: Player) {
  const cx = p.x + p.size / 2;
  const cy = p.y + p.size / 2;
  p.abilityReady = false;
  p.abilityCooldownTimer = p.abilityCooldown;

  if (p.heroClass === 'ronin') {
    // Crescent Wave: fast piercing slash wave forward
    soundEngine.playCrescentWave();
    const spd = 11.5;
    rt.playerProjectiles.push({
      uid: rt.nextUid++,
      ownerId: p.id,
      kind: 'crescent',
      x: cx,
      y: cy,
      dx: Math.cos(p.facingAngle) * spd,
      dy: Math.sin(p.facingAngle) * spd,
      angle: p.facingAngle,
      radius: 28,
      color: p.color,
      lifetime: 1.15,
      pierce: 99,
    });
    addSlashArc(rt, cx, cy, p.facingAngle, p.color, 46);
    addFloatingText(rt, cx, p.y - 12, 'CRESCENT WAVE!', p.color, 1.0);
  } else if (p.heroClass === 'phantom') {
    // Shadow Cloak: 1.6s phase shift + empowered strike
    soundEngine.playCloak();
    p.cloakTimer = 1.6;
    p.empoweredStrike = true;
    addFloatingText(rt, cx, p.y - 12, 'SHADOW CLOAK!', '#c084fc', 1.05);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      addParticle(rt, { x: cx, y: cy, dx: Math.cos(a) * 140, dy: Math.sin(a) * 140, alpha: 1, color: '#a855f7', size: 4 });
    }
  } else if (p.heroClass === 'vanguard') {
    // Aegis Shockwave: vaporize bullets in 200px radius + stun enemies
    soundEngine.playShockwave();
    rt.screenShake = Math.max(rt.screenShake, 12);
    rt.energyWaves.push({ x: cx, y: cy, radius: 12, maxRadius: 210, alpha: 0.95, speed: 560, color: '#38bdf8' });
    let cleared = 0;
    rt.bossProjectiles = rt.bossProjectiles.filter((bp) => {
      if (bp.type === 'phantom_clone') return true;
      const dist = Math.hypot(bp.x + bp.size / 2 - cx, bp.y + bp.size / 2 - cy);
      if (dist <= 205) {
        cleared++;
        return false;
      }
      return true;
    });
    rt.enemies.forEach((e) => {
      const dist = Math.hypot(e.x + e.size / 2 - cx, e.y + e.size / 2 - cy);
      if (dist <= 210) {
        e.stunTimer = 2.2;
      }
    });
    if (cleared > 0) rt.score += cleared * 35;
    if (
      rt.isBossLevel &&
      rt.boss.health > 0 &&
      rt.boss.state !== 'comic_intro' &&
      rt.boss.state !== 'dead' &&
      rt.boss.state !== 'phase_transition'
    ) {
      const bcx = rt.boss.x + rt.boss.size / 2;
      const bcy = rt.boss.y + rt.boss.size / 2;
      if (Math.hypot(bcx - cx, bcy - cy) <= 240) {
        handleBossHit(rt, p, false);
      }
    }
    addFloatingText(rt, cx, p.y - 14, cleared > 0 ? `SHOCKWAVE! ${cleared} CLEARED` : 'AEGIS SLAM!', '#38bdf8', 1.1);
  } else if (p.heroClass === 'volt') {
    // Overcharge Surge: instant Overdrive + blade snap + Dash reset
    soundEngine.playSurge();
    p.overdriveTimer = 4.5;
    p.dashReady = true;
    p.dashCooldownTimer = 0;
    const knife = rt.knives.find((k) => k.owner === p.id);
    if (knife && !p.hasKnife) {
      knife.x = cx - knife.size / 2;
      knife.y = cy - knife.size / 2;
    }
    rt.energyWaves.push({ x: cx, y: cy, radius: 8, maxRadius: 120, alpha: 0.9, speed: 360, color: '#facc15' });
    addFloatingText(rt, cx, p.y - 14, 'OVERCHARGE SURGE!', '#facc15', 1.1);
  }
}

export interface TouchInputState {
  x: number;
  y: number;
  dash: boolean;
  ability: boolean;
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

  // Forbidden Cheat Overrides
  if (rt.cheats.zeroCooldowns) {
    p.dashReady = true;
    p.dashCooldownTimer = 0;
    p.dash2Ready = true;
    p.dash2CooldownTimer = 0;
    p.abilityReady = true;
    p.abilityCooldownTimer = 0;
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

  // Vanguard passive shield regen
  if (p.heroClass === 'vanguard' && !p.hasShield) {
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

  const upPressed = !!keys[controls.up] || (rt.numPlayers === 1 && !!keys['arrowup']);
  const downPressed = !!keys[controls.down] || (rt.numPlayers === 1 && !!keys['arrowdown']);
  const leftPressed = !!keys[controls.left] || (rt.numPlayers === 1 && !!keys['arrowleft']);
  const rightPressed = !!keys[controls.right] || (rt.numPlayers === 1 && !!keys['arrowright']);
  const dashPressed =
    !!keys[controls.dash] ||
    !!touchInput?.dash ||
    (rt.numPlayers === 1 && (!!keys['shift'] || !!keys['enter']));
  const abilityPressed =
    !!keys[controls.ability] ||
    !!touchInput?.ability ||
    (rt.numPlayers === 1 && (!!keys['q'] || !!keys['f']));

  if (p.sealed) {
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
    if (rt.numPlayers === 2) {
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

  // Trigger Class Active Ability
  if (abilityPressed && !p._lastAbilityPressed && p.abilityReady) {
    triggerHeroAbility(rt, p);
    if (rt.isTutorial && rt.tutorialStep === 3) {
      rt.tutorialSkillUses++;
    }
  }
  p._lastAbilityPressed = abilityPressed;

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

      // Phantom class drops a Void Decoy on dash!
      if (p.heroClass === 'phantom') {
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

  const speedMult = (p.overdriveTimer > 0 ? 1.35 : 1.0) * (p.cloakTimer > 0 ? 1.3 : 1.0);

  if (p.dashImmune && p.dashTimeLeft > 0) {
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
    const moveSpeed = p.speed * speedMult * (dt * 60);
    p.vx = dirX * moveSpeed;
    p.vy = dirY * moveSpeed;
    p.x += p.vx;
    p.y += p.vy;
  }

  p.x = Math.max(0, Math.min(rt.arenaWidth - p.size, p.x));
  p.y = Math.max(0, Math.min(rt.arenaHeight - p.size, p.y));

  // If trapped inside Solaris & Lunaris Astral Stasis Prison, confine movement to cage radius until ally rescues
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

  const cdRate = p.overdriveTimer > 0 ? dt * 2.0 : dt;
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
  if (!p.abilityReady) {
    p.abilityCooldownTimer -= cdRate;
    if (p.abilityCooldownTimer <= 0) {
      p.abilityCooldownTimer = 0;
      p.abilityReady = true;
    }
  }

  for (let ti = p.dashTrail.length - 1; ti >= 0; ti--) {
    p.dashTrail[ti].alpha -= dt * 4.2;
    if (p.dashTrail[ti].alpha <= 0) p.dashTrail.splice(ti, 1);
  }
}

function handleBossHit(rt: GameRuntime, player: Player, consumeKnife = true): 'hit' | 'phase_transition' | 'dead' {
  const b = rt.boss;
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;
  const isWeakened = b.state === 'weakened';
  let baseDmg = hasBoon(rt, 'berserker_blade') ? 2 : 1;
  if (player.empoweredStrike) {
    baseDmg += 1;
    player.empoweredStrike = false;
  }

  // Dual-Blade Cross-Execution in 2P Co-op against Solaris & Lunaris
  const bothAliveCoop =
    rt.numPlayers === 2 && rt.players[0].state === 'alive' && rt.players[1].state === 'alive';
  let crossDetonated = false;
  if (rt.bossType === 'eclipse' && bothAliveCoop) {
    if (rt.eclipseMarkedBy === null) {
      rt.eclipseMarkedBy = player.id;
      rt.eclipseMarkTimer = 3.2;
      addFloatingText(
        rt,
        cx,
        cy - 48,
        player.id === 1 ? 'SOLAR MARK! P2 STRIKE!' : 'LUNAR MARK! P1 STRIKE!',
        player.id === 1 ? '#fbbf24' : '#38bdf8',
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
  rt.score += Math.round((260 * dmg + (crossDetonated ? 450 : 0)) * rt.diffSettings.scoreMultiplier);
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

  const duoHpMult = rt.numPlayers === 2 ? 2 : 1;
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
    rt.numPlayers === 2
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

  const bothAliveCoop =
    rt.numPlayers === 2 && rt.players[0].state === 'alive' && rt.players[1].state === 'alive';

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
          ((pylon.role === 'solar' && player.id === 1) || (pylon.role === 'lunar' && player.id === 2));
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

  // Check 2P Sanctuary Proximity during eclipse_tether
  if (b.state === 'attacking' && b.attackPattern === 'eclipse_tether' && bothAliveCoop) {
    const p1 = rt.players[0];
    const p2 = rt.players[1];
    const dist = Math.hypot(p1.x + p1.size / 2 - (p2.x + p2.size / 2), p1.y + p1.size / 2 - (p2.y + p2.size / 2));
    rt.eclipseSanctuaryActive = dist <= 215;
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
            const victim = Math.random() < 0.5 ? rt.players[0] : rt.players[1];
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
            const rescuerId = victim.id === 1 ? 2 : 1;
            showPhaseAnnounce(rt, `P${victim.id} CAGED! P${rescuerId} DASH OR SLASH THE PRISON!`, '#fbbf24', 2.5);
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
        const p1 = rt.players[0];
        const p2 = rt.players[1];
        const b1 = rt.eclipseBeacons[0];
        const b2 = rt.eclipseBeacons[1];
        if (b1 && b2) {
          b1.occupied = Math.hypot(p1.x + p1.size / 2 - b1.x, p1.y + p1.size / 2 - b1.y) <= b1.radius;
          b2.occupied = Math.hypot(p2.x + p2.size / 2 - b2.x, p2.y + p2.size / 2 - b2.y) <= b2.radius;
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
          const failedPlayers = [p1, p2].filter((_, idx) => !(rt.eclipseBeacons[idx] && rt.eclipseBeacons[idx].occupied));
          triggerCoopPunishment(
            rt,
            'SEALS FAILED — ECLIPSE JUDGMENT UNLEASHED!',
            failedPlayers.length > 0 ? failedPlayers : [p1, p2],
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
        const p1 = rt.players[0];
        const p2 = rt.players[1];
        rt.eclipseMirrors.forEach((m) => {
          const owner = m.ownerId === 1 ? p1 : p2;
          const dist = Math.hypot(owner.x + owner.size / 2 - m.x, owner.y + owner.size / 2 - m.y);
          if (dist <= m.radius + owner.size * 0.4) {
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
          const outcome = handleBossHit(rt, p1, false);
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
  if (!rt.isBossLevel) {
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
    pts.push({ x: rt.arenaWidth / 2, y: rt.arenaHeight * 0.7 });
  }

  const b = rt.boss;
  const bx = b.x + b.size / 2;
  const by = Math.max(80, b.y + b.size / 2);
  pts.push({ x: bx, y: by });

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

  let padX = 360;
  let padY = 280;
  let maxZoom = 1.02;
  let minZoom = 0.58;
  let arenaCenterWeight = 0;

  const activePattern = b.state === 'telegraph' || b.state === 'attacking' ? b.attackPattern : '';

  if (b.state === 'comic_intro') {
    const focusY = Math.max(120, b.originalY + b.size / 2);
    tx = bx;
    ty = focusY + (b.stateTimer < 3.1 ? 30 : 0);
    if (rt.bossType === 'mecha') {
      // Tactical orbital drop tracking: wide ground lock -> high tracking drop -> sharp chest-up close-up
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
      // Horror pull-in onto dark singularity slit-eye -> sudden shatter snap
      if (b.stateTimer > 4.85) {
        const prog = Math.max(0, Math.min(1, (7.4 - b.stateTimer) / 2.55));
        maxZoom = 0.76 + prog * 0.34;
      } else if (b.stateTimer > 4.15) {
        maxZoom = 1.24;
      } else {
        maxZoom = 0.9;
      }
    } else if (rt.bossType === 'oni') {
      // Low wide Torii sanctum -> sudden razor close-up on X-slash -> dramatic low-angle warlord framing
      if (b.stateTimer > 4.25) {
        maxZoom = 0.76;
        ty = focusY + 45;
      } else if (b.stateTimer > 3.1) {
        maxZoom = 1.15;
      } else {
        maxZoom = 0.92;
      }
    } else {
      // Eclipse: Wide celestial horizon framing Sun & Moon -> converging tight collision -> royal centerpiece
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
    // Edge-spawning curtains, co-op seals/pylons/tether, corner clones, and laser grids require full battlefield visibility
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
    // Wide radial rings, zone eruptions, sweeps, and punishment storms benefit from generous peripheral camera pull-back
    maxZoom = 0.72;
    padX = 480;
    padY = 360;
    arenaCenterWeight = 0.25;
  } else if (activePattern) {
    // Standard close/medium bullet patterns keep clean dodging headroom
    maxZoom = 0.86;
    padX = 410;
    padY = 310;
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
  touchInput?: TouchInputState
) {
  if (rt.pendingEvent) return;
  const dt = Math.min(rawDt, 0.05);
  rt.elapsedSeconds += dt;
  rt.stageElapsed += dt;
  rt.stylePoints = Math.max(0, rt.stylePoints - dt * 2.4);
  rt.bossHitCooldowns[1] = Math.max(0, rt.bossHitCooldowns[1] - dt);
  rt.bossHitCooldowns[2] = Math.max(0, rt.bossHitCooldowns[2] - dt);

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

  updatePlayer(rt, rt.players[0], dt, keys, controls.p1, touchInput);
  if (rt.numPlayers === 2) updatePlayer(rt, rt.players[1], dt, keys, controls.p2);

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

  // Player Projectiles (Ronin Crescent Wave & Volt Arc Bolts)
  for (let pi = rt.playerProjectiles.length - 1; pi >= 0; pi--) {
    const pp = rt.playerProjectiles[pi];
    pp.lifetime -= dt;
    pp.x += pp.dx * (dt * 60);
    pp.y += pp.dy * (dt * 60);
    if (pp.lifetime <= 0 || pp.x < -60 || pp.x > rt.arenaWidth + 60 || pp.y < -60 || pp.y > rt.arenaHeight + 60) {
      rt.playerProjectiles.splice(pi, 1);
      continue;
    }

    // Slice boss bullets in path (Ronin Crescent)
    if (pp.kind === 'crescent') {
      rt.bossProjectiles = rt.bossProjectiles.filter((bp) => {
        if (bp.type === 'phantom_clone') return true;
        return Math.hypot(bp.x + bp.size / 2 - pp.x, bp.y + bp.size / 2 - pp.y) > pp.radius + bp.size / 2;
      });
    }

    // Hit enemies
    for (let ei = rt.enemies.length - 1; ei >= 0; ei--) {
      const e = rt.enemies[ei];
      if (Math.hypot(e.x + e.size / 2 - pp.x, e.y + e.size / 2 - pp.y) < pp.radius + e.size / 2) {
        rt.enemies.splice(ei, 1);
        rt.kills++;
        updateCombo(rt, pp.ownerId);
        soundEngine.playSlash(rt.playerCombos[pp.ownerId].count);
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
          py.rekindleTimer = rt.numPlayers === 2 ? 3.5 : 0;
          addFloatingText(rt, py.x, py.y - 24, 'PYLON SHATTERED!', '#fde047', 1.05);
        }
      }
    });

    // Hit Active or Weakened Boss directly with Crescent Wave / Arc Bolt
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
        handleBossHit(rt, owner, false);
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
            player.dashImmune && (hasBoon(rt, 'twin_spark') || player.heroClass === 'ronin') ? 18 : 0;
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
  ([1, 2] as const).forEach((pid) => {
    const c = rt.playerCombos[pid];
    if (c.timer > 0) {
      c.timer -= dt;
      if (c.timer <= 0) {
        c.count = 0;
        c.timer = 0;
      }
    }
  });

  // Safe zones
  rt.players.forEach((p) => {
    if (p.state === 'spectator') return;
    const sz = p.id === 1 ? rt.p1SafeZone : rt.p2SafeZone;
    if (!p.safeZoneClosed && (p.x > sz.x + sz.width || p.y > sz.y + sz.height || p.x + p.size < sz.x || p.y + p.size < sz.y)) {
      p.inSafeZone = false;
      p.safeZoneClosed = true;
    }
  });

  // Co-op revive
  const alivePlayers = rt.players.filter((p) => p.state === 'alive');
  const downPlayers = rt.players.filter((p) => p.state === 'down');
  if (rt.numPlayers === 2 && alivePlayers.length > 0 && downPlayers.length > 0) {
    downPlayers.forEach((downP) => {
      let reviving = false;
      alivePlayers.forEach((aliveP) => {
        const dist = Math.hypot(aliveP.x + aliveP.size / 2 - (downP.x + downP.size / 2), aliveP.y + aliveP.size / 2 - (downP.y + downP.size / 2));
        const canRevive = rt.difficulty !== 'hard' || rt.medkitInventoryCount > 0;
        if (dist < aliveP.size * 1.25 && canRevive) {
          reviving = true;
          downP.reviveProgress += dt;
          if (downP.reviveProgress >= REVIVE_TIME) {
            if (rt.difficulty === 'hard') rt.medkitInventoryCount = Math.max(0, rt.medkitInventoryCount - 1);
            downP.state = 'alive';
            downP.invulnerable = true;
            downP.reviveProgress = 0;
            downP.hp = Math.min(downP.maxHp, 50);
            soundEngine.playRevive();
            addFloatingText(rt, downP.x + downP.size / 2, downP.y - 12, 'REVIVED!', '#34d399', 1.2);
            setTimeout(() => {
              downP.invulnerable = false;
            }, 2000);
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

    // Active Sanctuary Tether Beam between P1 & P2 physically vaporizes incoming projectiles!
    if (
      rt.eclipseSanctuaryActive &&
      rt.numPlayers === 2 &&
      rt.players[0].state === 'alive' &&
      rt.players[1].state === 'alive'
    ) {
      const p1 = rt.players[0];
      const p2 = rt.players[1];
      const beamDist = pointToSegmentDist(
        proj.x + proj.size / 2,
        proj.y + proj.size / 2,
        p1.x + p1.size / 2,
        p1.y + p1.size / 2,
        p2.x + p2.size / 2,
        p2.y + p2.size / 2
      );
      if (beamDist < proj.size * 0.65 + 14) {
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
          const dx = (e.chargeTargetX || CANVAS_WIDTH / 2) - (e.x + e.size / 2);
          const dy = (e.chargeTargetY || CANVAS_HEIGHT / 2) - (e.y + e.size / 2);
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
        e.x = Math.max(20, Math.min(CANVAS_WIDTH - e.size - 20, tp.x + Math.cos(angle) * 140));
        e.y = Math.max(20, Math.min(CANVAS_HEIGHT - e.size - 20, tp.y + Math.sin(angle) * 140));
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
    if (e.x + e.size >= CANVAS_WIDTH) { e.x = CANVAS_WIDTH - e.size; e.dx = -Math.abs(e.dx); }
    if (e.y <= 0) { e.y = 0; e.dy = Math.abs(e.dy); }
    if (e.y + e.size >= CANVAS_HEIGHT) { e.y = CANVAS_HEIGHT - e.size; e.dy = -Math.abs(e.dy); }

    let sliced = false;
    for (const player of rt.players) {
      if (player.state !== 'alive') continue;
      const bladeReach =
        player.hasKnife && player.dashImmune
          ? (hasBoon(rt, 'twin_spark') ? 22 : 12) + (player.heroClass === 'ronin' ? 12 : 0)
          : 0;
      const overlaps =
        player.x - bladeReach < e.x + e.size &&
        player.x + player.size + bladeReach > e.x &&
        player.y - bladeReach < e.y + e.size &&
        player.y + player.size + bladeReach > e.y;

      if (overlaps) {
        if (player.hasKnife) {
          sliced = true;
          if (!rt.cheats.alwaysArmed) {
            player.hasKnife = false;
            repositionKnifeForPlayer(rt, player);
          }
          rt.kills++;
          rt.screenShake = Math.max(rt.screenShake, 8);
          rt.freezeTime = 0.045;
          updateCombo(rt, player.id);
          const comboVal = rt.playerCombos[player.id].count;
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
      }
    });
  });

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
    if (rt.stage === 'ironDungeon' && rt.waveNumber === 1) {
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
      if (rt.stage === 'mechaBoss') {
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
  if (rt.isBossLevel && rt.bossType === 'eclipse' && rt.numPlayers === 2) {
    if (rt.boss.state === 'weakened' && rt.eclipseMarkedBy) {
      coopPrompt =
        rt.eclipseMarkedBy === 1
          ? 'CO-OP COMBO: P2 STRIKE NOW TO DETONATE TWIN ECLIPSE FINISHER!'
          : 'CO-OP COMBO: P1 STRIKE NOW TO DETONATE TWIN ECLIPSE FINISHER!';
    } else if (rt.boss.state === 'attacking') {
      if (rt.boss.attackPattern === 'twin_beacons' && rt.eclipseBeacons.length === 2) {
        coopPrompt =
          rt.eclipseSyncTimer > 0
            ? `RESONANCE LOCKING... ${Math.round((rt.eclipseSyncTimer / 0.65) * 100)}%`
            : 'CO-OP: P1 → SOLAR SEAL (GOLD)  ·  P2 → LUNAR SEAL (CYAN)';
      } else if (rt.boss.attackPattern === 'eclipse_tether') {
        coopPrompt = rt.eclipseSanctuaryActive
          ? `SANCTUARY LINK ACTIVE! BLOCKING ORBS (${rt.eclipseTetherTimer.toFixed(1)}s)`
          : `CO-OP: GROUP UP TO FORGE SANCTUARY BARRIER! (${rt.eclipseTetherTimer.toFixed(1)}s)`;
      } else if (rt.boss.attackPattern === 'twin_pylons') {
        coopPrompt = 'CO-OP: P1 BREAK SOLAR · P2 BREAK LUNAR WITHIN 4.0s!';
      } else if (rt.boss.attackPattern === 'eclipse_prison' && rt.eclipsePrison) {
        const rescuer = rt.eclipsePrison.targetPlayerId === 1 ? 2 : 1;
        coopPrompt = `CO-OP RESCUE: P${rescuer} DASH OR SLASH THE STASIS CAGE! (${rt.eclipsePrison.timer.toFixed(1)}s)`;
      } else if (rt.boss.attackPattern === 'eclipse_prism_beam' && rt.eclipseMirrors.length === 2) {
        const m1 = rt.eclipseMirrors[0];
        const m2 = rt.eclipseMirrors[1];
        coopPrompt = `CO-OP MIRRORS: P1 SOLAR ${Math.round(m1.charge * 100)}%  ·  P2 LUNAR ${Math.round(m2.charge * 100)}%`;
      } else if (rt.boss.attackPattern === 'coop_punishment') {
        coopPrompt = 'TEAMWORK FAILED! SURVIVE ECLIPSE JUDGMENT!';
      }
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

  const p1 = rt.players[0];
  const p2 = rt.players[1];

  return {
    stage: rt.stage,
    stageLabel: rt.isTutorial ? 'TRAINING GROUNDS' : stageLabels[rt.stage],
    waveText: rt.isTutorial
      ? `DRILL ${rt.tutorialStep}/4`
      : rt.isBossLevel
      ? 'BOSS ENCOUNTER'
      : rt.stage === 'ironDungeon'
      ? `WAVE ${rt.waveNumber}/2`
      : 'VANGUARD WAVE',
    enemiesRemaining: rt.enemies.length,
    score: Math.round(rt.score),
    styleRank: getStyleRank(rt.stylePoints),
    grazes: rt.grazes,
    kills: rt.kills,
    elapsedSeconds: rt.elapsedSeconds,
    maxCombo: rt.maxCombo,
    comboP1: rt.playerCombos[1].count,
    comboP2: rt.playerCombos[2].count,
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
    p1: {
      heroClass: p1.heroClass,
      hp: Math.round(p1.hp),
      maxHp: p1.maxHp,
      state: p1.state,
      dashReady: p1.dashReady,
      dashCooldown: Math.ceil(p1.dashCooldownTimer),
      dash2Active: p1.dash2Active,
      dash2Ready: p1.dash2Ready,
      dash2Cooldown: Math.ceil(p1.dash2CooldownTimer),
      abilityReady: p1.abilityReady,
      abilityCooldown: Math.ceil(p1.abilityCooldownTimer),
      hasKnife: p1.hasKnife,
      hasShield: p1.hasShield,
      empowered: p1.empoweredStrike,
      overdrive: p1.overdriveTimer,
      cloak: p1.cloakTimer,
      sealed: p1.sealed,
    },
    p2: {
      heroClass: p2.heroClass,
      hp: Math.round(p2.hp),
      maxHp: p2.maxHp,
      state: p2.state,
      dashReady: p2.dashReady,
      dashCooldown: Math.ceil(p2.dashCooldownTimer),
      dash2Active: p2.dash2Active,
      dash2Ready: p2.dash2Ready,
      dash2Cooldown: Math.ceil(p2.dash2CooldownTimer),
      abilityReady: p2.abilityReady,
      abilityCooldown: Math.ceil(p2.abilityCooldownTimer),
      hasKnife: p2.hasKnife,
      hasShield: p2.hasShield,
      empowered: p2.empoweredStrike,
      overdrive: p2.overdriveTimer,
      cloak: p2.cloakTimer,
      sealed: p2.sealed,
    },
  };
}
