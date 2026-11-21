export type DifficultyKey = 'easy' | 'medium' | 'hard';
export type GameMode = 'campaign' | 'boss_rush' | 'tutorial';
export type HeroClassId = 'ronin' | 'phantom' | 'vanguard' | 'volt';

export type AppScreen =
  | 'TITLE_MENU'
  | 'HERO_SETUP'
  | 'PLAYING'
  | 'PAUSED'
  | 'BOON_DRAFT'
  | 'STAGE_TRANSITION'
  | 'GAME_OVER'
  | 'VICTORY';

export type StageKey =
  | 'ironDungeon'
  | 'mechaBoss'
  | 'voidDungeon'
  | 'voidBoss'
  | 'oniDungeon'
  | 'oniBoss'
  | 'eclipseBoss';

export type BossType = 'mecha' | 'void' | 'oni' | 'eclipse';

export type EnemyType =
  | 'bouncer'
  | 'charger'
  | 'splitter'
  | 'mini_spark'
  | 'void_stalker'
  | 'oni_acolyte';

export type RelicType = 'overdrive' | 'shield' | 'magnet' | 'nova';

export type BoonId =
  | 'phantom_step'
  | 'vampiric_edge'
  | 'twin_spark'
  | 'aegis_core'
  | 'berserker_blade'
  | 'blade_magnet';

export interface HeroClassDef {
  id: HeroClassId;
  name: string;
  codename: string;
  role: string;
  passiveName: string;
  passiveDesc: string;
  skillName: string;
  skillDesc: string;
  skillCooldown: number;
  dashCooldown: number;
  baseSpeed: number;
  bonusHp: number;
  accent: string;
}

export interface BoonDef {
  id: BoonId;
  name: string;
  subtitle: string;
  description: string;
  accent: string;
  icon: string;
}

export interface ColorOption {
  hex: string;
  name: string;
  glow: string;
}

export interface DifficultyConfig {
  key: DifficultyKey;
  label: string;
  baseMaxHp: number;
  damageMultiplier: number;
  mechaHP: number;
  mechaPhase2HP: number;
  bossHP: number;
  phase2HP: number;
  oniHP: number;
  oniPhase2HP: number;
  eclipseHP: number;
  eclipsePhase2HP: number;
  scoreMultiplier: number;
  bulletSpeedMult: number;
  cadenceMult: number;
  color: string;
  borderColor: string;
  summary: string;
}

export interface PlayerControls {
  up: string;
  down: string;
  left: string;
  right: string;
  dash: string;
  ability: string;
}

export interface ControlsConfig {
  p1: PlayerControls;
  p2: PlayerControls;
}

export interface DashTrailPoint {
  x: number;
  y: number;
  alpha: number;
  color: string;
  angle: number;
}

export interface Player {
  id: 1 | 2;
  heroClass: HeroClassId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facingAngle: number;
  size: number;
  speed: number;
  color: string;
  hasKnife: boolean;
  state: 'alive' | 'down' | 'spectator';
  reviveProgress: number;
  invulnerable: boolean;
  inSafeZone: boolean;
  safeZoneClosed: boolean;
  dashReady: boolean;
  dashTime: number;
  dashCooldown: number;
  dashImmune: boolean;
  dashTrail: DashTrailPoint[];
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
  _lastDashPressed: boolean;
  _lastAbilityPressed: boolean;
  // Class active skill
  abilityReady: boolean;
  abilityCooldown: number;
  abilityCooldownTimer: number;
  cloakTimer: number;
  empoweredStrike: boolean;
  shieldRegenTimer: number;
  // Status & buffs
  sealed: boolean;
  sealTimer: number;
  hasShield: boolean;
  overdriveTimer: number;
  magnetTimer: number;
  grazedIds: Set<number>;
  dashDirX: number;
  dashDirY: number;
  animTime: number;
  cleanDodgeFailed: boolean;
}

export interface PlayerProjectile {
  uid: number;
  ownerId: 1 | 2;
  kind: 'crescent' | 'arc_bolt';
  x: number;
  y: number;
  dx: number;
  dy: number;
  angle: number;
  radius: number;
  color: string;
  lifetime: number;
  pierce: number;
}

export interface VoidDecoy {
  x: number;
  y: number;
  timer: number;
  maxTimer: number;
  color: string;
  ownerId: 1 | 2;
}

export interface TelegraphLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  timer: number;
  maxTimer: number;
  width: number;
  color: string;
  kind: 'railgun' | 'katana' | 'void_rift';
  triggered: boolean;
}

export interface Knife {
  x: number;
  y: number;
  size: number;
  color: string;
  owner: 1 | 2;
  bobPhase: number;
  luckyTimer?: number;
}

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  size: number;
  speed: number;
  dx: number;
  dy: number;
  rotation: number;
  stunTimer?: number;
  chargeState?: 'roam' | 'telegraph' | 'lunge';
  chargeTimer?: number;
  chargeTargetX?: number;
  chargeTargetY?: number;
  blinkTimer?: number;
  alpha?: number;
  shootTimer?: number;
}

export interface Boss {
  x: number;
  y: number;
  size: number;
  health: number;
  maxHealth: number;
  state: 'comic_intro' | 'phase_transition' | 'idle' | 'telegraph' | 'attacking' | 'weakened' | 'dead';
  stateTimer: number;
  attackPattern: string;
  attackLabel: string;
  attackTimer: number;
  targetX: number;
  targetY: number;
  animationTimer: number;
  pulseSize: number;
  rotationAngle: number;
  flashIntensity: number;
  weakenedHits: number;
  maxWeakenedHits: number;
  entryPhase: number;
  originalY: number;
  shakeIntensity: number;
  phase: 1 | 2;
  attacksBeforeVulnerable: number;
  attacksNeeded: number;
  posture: number;
  maxPosture: number;
  postureDecayGrace: number;
  postureUnlocked: boolean;
  wallDirection: { isHorizontal: boolean; startX?: number; dirX?: number; startY?: number; dirY?: number } | null;
}

export interface BossProjectile {
  uid: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  speed: number;
  color: string;
  damage?: number;
  shape?: 'orb' | 'shard' | 'ember' | 'missile' | 'lance';
  type?: 'normal' | 'boomerang' | 'mine' | 'homing' | 'teleporter' | 'phantom_clone';
  age?: number;
  turnTime?: number;
  returned?: boolean;
  timer?: number;
  armed?: boolean;
  warningTime?: number;
  lifetime?: number;
  homingStr?: number;
  teleportTimer?: number;
  teleported?: boolean;
  stunTimer?: number;
  chaseSpeed?: number;
  canDamage?: boolean;
  invulnerabilityTimer?: number;
  shootTimer?: number;
  shootInterval?: number;
  spawnInvulnerability?: number;
}

export interface Medkit {
  x: number;
  y: number;
  size: number;
  bob: number;
}

export interface RelicDrop {
  id: number;
  type: RelicType;
  x: number;
  y: number;
  size: number;
  lifetime: number;
  bob: number;
}

export interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  alpha: number;
  color: string;
  size: number;
}

export interface SlashArc {
  x: number;
  y: number;
  angle: number;
  radius: number;
  color: string;
  alpha: number;
  lifetime: number;
  timer: number;
}

export interface FloatingText {
  x: number;
  y: number;
  dy: number;
  text: string;
  color: string;
  alpha: number;
  lifetime: number;
  scale: number;
}

export interface DeathEffect {
  type: 'shockwave' | 'particle';
  x: number;
  y: number;
  radius?: number;
  maxRadius?: number;
  dx?: number;
  dy?: number;
  size?: number;
  alpha: number;
  color: string;
  lifetime: number;
}

export interface ComicSlash {
  x: number;
  y: number;
  angle: number;
  length: number;
  alpha: number;
  lifetime: number;
  timer: number;
  thickness: number;
}

export interface VoidRift {
  x: number;
  y: number;
  size: number;
  maxSize: number;
  alpha: number;
  rotation: number;
  growthRate: number;
}

export interface EnergyWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
  color: string;
}

export interface VoidTentacle {
  baseAngle: number;
  segments: number;
  segLength: number;
  waveOffset: number;
  waveSpeed: number;
  thickness: number;
  extendFactor: number;
  extending: boolean;
  retractTimer: number;
  damageEnabled: boolean;
  color: string;
  glowColor: string;
}

export interface OniShrine {
  x: number;
  y: number;
  size: number;
  active: boolean;
  health: number;
  maxHealth: number;
  index: number;
}

export interface OniCursedZone {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  growthRate: number;
  alpha: number;
  lifetime: number;
  color: string;
  damageTimer: number;
  telegraphTimer?: number;
  maxTelegraphTimer?: number;
  detonateProjCount?: number;
  detonateProjSpeed?: number;
  detonateProjColor?: string;
  detonateProjDamage?: number;
}

export interface OniSpiritBomb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  maxSpeed: number;
  homingStr: number;
  lifetime: number;
}

export interface EclipseBeacon {
  x: number;
  y: number;
  radius: number;
  role: 'solar' | 'lunar' | 'solo';
  ownerId: 1 | 2 | null;
  active: boolean;
  occupied: boolean;
}

export interface EclipsePylon {
  x: number;
  y: number;
  size: number;
  hp: number;
  maxHp: number;
  role: 'solar' | 'lunar' | 'solo';
  active: boolean;
  rekindleTimer: number;
}

export interface EclipsePrison {
  targetPlayerId: 1 | 2;
  x: number;
  y: number;
  radius: number;
  timer: number;
  maxTimer: number;
}

export interface EclipseMirror {
  role: 'solar' | 'lunar';
  ownerId: 1 | 2;
  x: number;
  y: number;
  radius: number;
  charge: number;
  locked: boolean;
}

export interface AmbientMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
}

export interface PlayerHudState {
  heroClass: HeroClassId;
  hp: number;
  maxHp: number;
  state: Player['state'];
  dashReady: boolean;
  dashCooldown: number;
  dash2Active: boolean;
  dash2Ready: boolean;
  dash2Cooldown: number;
  abilityReady: boolean;
  abilityCooldown: number;
  hasKnife: boolean;
  hasShield: boolean;
  empowered: boolean;
  overdrive: number;
  cloak: number;
  sealed: boolean;
}

export interface HudSnapshot {
  stage: StageKey;
  stageLabel: string;
  waveText: string;
  enemiesRemaining: number;
  score: number;
  styleRank: 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';
  grazes: number;
  kills: number;
  elapsedSeconds: number;
  maxCombo: number;
  comboP1: number;
  comboP2: number;
  isBossLevel: boolean;
  bossType: BossType;
  bossName: string;
  bossAttackLabel: string;
  bossVoiceLine: string | null;
  bossHealth: number;
  bossMaxHealth: number;
  bossPhase: 1 | 2;
  bossState: Boss['state'];
  medkitInventoryCount: number;
  medkitNotif: string | null;
  phaseAnnounce: { text: string; color: string } | null;
  activeBoons: BoonId[];
  coopPrompt: string | null;
  cheatsUsed: boolean;
  isTutorial: boolean;
  tutorialStep: number;
  tutorialTitle: string;
  tutorialObjective: string;
  tutorialProgress: number;
  tutorialTotal: number;
  p1: PlayerHudState;
  p2: PlayerHudState;
}

export interface CheatsConfig {
  godMode: boolean;
  oneHitKill: boolean;
  zeroCooldowns: boolean;
  alwaysArmed: boolean;
  permanentOverdrive: boolean;
  chronoSlowBullets: boolean;
  vitalityRegen: boolean;
  allRelics: boolean;
}

export const DEFAULT_CHEATS: CheatsConfig = {
  godMode: false,
  oneHitKill: false,
  zeroCooldowns: false,
  alwaysArmed: false,
  permanentOverdrive: false,
  chronoSlowBullets: false,
  vitalityRegen: false,
  allRelics: false,
};

export interface RunSummary {
  victory: boolean;
  score: number;
  elapsedSeconds: number;
  maxCombo: number;
  grazes: number;
  kills: number;
  difficulty: DifficultyKey;
  mode: GameMode;
  numPlayers: 1 | 2;
  rank: 'S' | 'A' | 'B' | 'C';
  boons: BoonId[];
  cheated?: boolean;
}

export interface LeaderboardEntry {
  id: string;
  score: number;
  rank: 'S' | 'A' | 'B' | 'C';
  difficulty: DifficultyKey;
  mode: GameMode;
  numPlayers: 1 | 2;
  elapsedSeconds: number;
  maxCombo: number;
  victory: boolean;
  date: string;
  cheated?: boolean;
}

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const BOSS_ARENA_WIDTH = 1360;
export const BOSS_ARENA_HEIGHT = 960;

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export const HERO_CLASSES: HeroClassDef[] = [
  {
    id: 'ronin',
    name: 'KUROGANE',
    codename: 'BLADE RONIN',
    role: 'Aggressive Duelist',
    passiveName: 'Iaido Reach',
    passiveDesc: 'Dashing while armed cuts with an extended +18px blade arc.',
    skillName: 'Crescent Wave',
    skillDesc: 'Fires a piercing slash wave that slices bullets & bosses.',
    skillCooldown: 7.5,
    dashCooldown: 8.5,
    baseSpeed: 5.2,
    bonusHp: 0,
    accent: '#ef4444',
  },
  {
    id: 'phantom',
    name: 'VESPER',
    codename: 'VOID STALKER',
    role: 'Evasive Assassin',
    passiveName: 'Blink Decoy',
    passiveDesc: 'Fastest Dash (6.5s). Dashing leaves a void bomb decoy.',
    skillName: 'Shadow Cloak',
    skillDesc: 'Phase-shift invulnerable for 1.6s + empower next strike.',
    skillCooldown: 10.5,
    dashCooldown: 6.5,
    baseSpeed: 5.4,
    bonusHp: 0,
    accent: '#a855f7',
  },
  {
    id: 'vanguard',
    name: 'TITAN-X',
    codename: 'IRON BASTION',
    role: 'Armored Juggernaut',
    passiveName: 'Reactive Armor',
    passiveDesc: '+25 Max HP (125 total) & auto-regenerates Aegis Shield every 24s.',
    skillName: 'Aegis Shockwave',
    skillDesc: 'Emits a pulse that vaporizes nearby bullets & stuns foes.',
    skillCooldown: 9.5,
    dashCooldown: 9.5,
    baseSpeed: 4.7,
    bonusHp: 25,
    accent: '#38bdf8',
  },
  {
    id: 'volt',
    name: 'RAIDEN',
    codename: 'ARC STRIKER',
    role: 'High-Speed Skirmisher',
    passiveName: 'Static Arc',
    passiveDesc: '+18% Move Speed. Clean Dodges fire homing Arc Bolts at foes.',
    skillName: 'Overcharge Surge',
    skillDesc: '4.5s Overdrive + pulls Blade to you + resets Dash CD.',
    skillCooldown: 11.5,
    dashCooldown: 8.0,
    baseSpeed: 5.9,
    bonusHp: 0,
    accent: '#facc15',
  },
];

export const COLOR_OPTIONS: ColorOption[] = [
  { hex: '#ef4444', name: 'BLOODSTEEL', glow: '#991b1b' },
  { hex: '#22d3ee', name: 'ARC CYAN', glow: '#0891b2' },
  { hex: '#a855f7', name: 'ABYSS VIOLET', glow: '#6b21a8' },
  { hex: '#f97316', name: 'HELLFIRE', glow: '#9a3412' },
  { hex: '#eab308', name: 'SOLAR GOLD', glow: '#854d0e' },
  { hex: '#10b981', name: 'VENOM JADE', glow: '#065f46' },
  { hex: '#e2e8f0', name: 'OBSIDIAN SILVER', glow: '#475569' },
  { hex: '#ec4899', name: 'CRIMSON NEON', glow: '#9d174d' },
];

export const DIFFICULTY_SETTINGS: Record<DifficultyKey, DifficultyConfig> = {
  easy: {
    key: 'easy',
    label: 'RECRUIT',
    baseMaxHp: 100,
    damageMultiplier: 0.9,
    mechaHP: 42,
    mechaPhase2HP: 21,
    bossHP: 46,
    phase2HP: 23,
    oniHP: 54,
    oniPhase2HP: 27,
    eclipseHP: 64,
    eclipsePhase2HP: 32,
    scoreMultiplier: 1.0,
    bulletSpeedMult: 1.1,
    cadenceMult: 1.12,
    color: '#34d399',
    borderColor: '#059669',
    summary: '100 Base HP · 0.90x DMG · Balanced Boss HP & Pace · Free Co-op Revive',
  },
  medium: {
    key: 'medium',
    label: 'SLAYER',
    baseMaxHp: 100,
    damageMultiplier: 1.2,
    mechaHP: 66,
    mechaPhase2HP: 33,
    bossHP: 76,
    phase2HP: 38,
    oniHP: 88,
    oniPhase2HP: 44,
    eclipseHP: 100,
    eclipsePhase2HP: 50,
    scoreMultiplier: 1.5,
    bulletSpeedMult: 1.24,
    cadenceMult: 1.26,
    color: '#fbbf24',
    borderColor: '#b45309',
    summary: '100 Base HP · 1.20x DMG · +50% Intensity & Scaled Boss HP · 1.5x Score',
  },
  hard: {
    key: 'hard',
    label: 'NIGHTMARE',
    baseMaxHp: 100,
    damageMultiplier: 1.4,
    mechaHP: 84,
    mechaPhase2HP: 42,
    bossHP: 96,
    phase2HP: 48,
    oniHP: 110,
    oniPhase2HP: 55,
    eclipseHP: 126,
    eclipsePhase2HP: 63,
    scoreMultiplier: 2.5,
    bulletSpeedMult: 1.0,
    cadenceMult: 1.0,
    color: '#f43f5e',
    borderColor: '#be123c',
    summary: '100 Base HP · Extreme Dodgeable Boss Patterns · 1.40x DMG · Medkit Revive · 2.5x Score',
  },
};

export const BOONS_CATALOG: BoonDef[] = [
  {
    id: 'phantom_step',
    name: 'Shadow Reflex',
    subtitle: 'MOBILITY RELIC',
    description: 'Reduces Dash & Skill cooldowns by 28% and extends post-dash grace.',
    accent: '#22d3ee',
    icon: '⚡',
  },
  {
    id: 'vampiric_edge',
    name: 'Blood Harvest',
    subtitle: 'SUSTAIN RELIC',
    description: 'Restore +25 HP now and gain +15 HP on every 6x Kill Combo.',
    accent: '#f43f5e',
    icon: '🩸',
  },
  {
    id: 'twin_spark',
    name: 'Execution Tempo',
    subtitle: 'AGILITY RELIC',
    description: '+18% Move Speed and wider slash reach during Dash.',
    accent: '#fbbf24',
    icon: '⚔',
  },
  {
    id: 'aegis_core',
    name: 'Bastion Core',
    subtitle: 'DEFENSE RELIC',
    description: 'Grants an Aegis Energy Shield immediately and before every boss.',
    accent: '#38bdf8',
    icon: '⛨',
  },
  {
    id: 'berserker_blade',
    name: 'Executioner Edge',
    subtitle: 'OFFENSE RELIC',
    description: 'Strikes deal +1 bonus damage (+2 when Weakened) and shatter Oni Shrines in 1 hit.',
    accent: '#f97316',
    icon: '☠',
  },
  {
    id: 'blade_magnet',
    name: 'Magnetic Recall',
    subtitle: 'UTILITY RELIC',
    description: 'Your spawned Blade drifts toward you and Clean Dodges shave 2.5s off Dash CD.',
    accent: '#c084fc',
    icon: '◎',
  },
];

export const DEFAULT_CONTROLS: ControlsConfig = {
  p1: { up: 'w', down: 's', left: 'a', right: 'd', dash: ' ', ability: 'e' },
  p2: { up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', dash: 'enter', ability: '/' },
};
