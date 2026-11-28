import { CosmeticId, DifficultyKey, GameMode, SkillEffectId } from './types';

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface RarityMeta {
  id: ItemRarity;
  label: string;
  color: string;
  bg: string;
  border: string;
  weight: number;
  refundRatio: number;
}

export const RARITY_META: Record<ItemRarity, RarityMeta> = {
  common: {
    id: 'common',
    label: 'MIL-SPEC',
    color: '#60a5fa',
    bg: 'rgba(30, 58, 138, 0.32)',
    border: 'rgba(96, 165, 250, 0.55)',
    weight: 46,
    refundRatio: 0.3,
  },
  rare: {
    id: 'rare',
    label: 'RESTRICTED',
    color: '#a855f7',
    bg: 'rgba(88, 28, 135, 0.34)',
    border: 'rgba(168, 85, 247, 0.6)',
    weight: 28,
    refundRatio: 0.4,
  },
  epic: {
    id: 'epic',
    label: 'CLASSIFIED',
    color: '#ec4899',
    bg: 'rgba(131, 24, 67, 0.35)',
    border: 'rgba(236, 72, 153, 0.65)',
    weight: 17,
    refundRatio: 0.5,
  },
  legendary: {
    id: 'legendary',
    label: 'COVERT',
    color: '#ef4444',
    bg: 'rgba(127, 29, 29, 0.38)',
    border: 'rgba(239, 68, 68, 0.72)',
    weight: 7,
    refundRatio: 0.65,
  },
  mythic: {
    id: 'mythic',
    label: 'EXCEEDINGLY RARE',
    color: '#fbbf24',
    bg: 'rgba(120, 53, 15, 0.42)',
    border: 'rgba(251, 191, 36, 0.85)',
    weight: 2,
    refundRatio: 0.8,
  },
};

export const COSMETIC_CASE_COST = 1000;
export const SKILL_EFFECT_CASE_COST = 10000;

export interface CosmeticDef {
  id: CosmeticId;
  name: string;
  subtitle: string;
  description: string;
  rarity: ItemRarity;
  primary: string;
  secondary: string;
}

export interface SkillEffectDef {
  id: SkillEffectId;
  name: string;
  subtitle: string;
  description: string;
  rarity: ItemRarity;
  primary: string;
  secondary: string;
  core: string;
  prismatic?: boolean;
}

export const COSMETICS_CATALOG: CosmeticDef[] = [
  {
    id: 'ember_halo',
    name: 'Ashen Halo Ring',
    subtitle: 'Sleek overhead ember ring',
    description: 'Thin tilted ring of glowing ash hovering above your silhouette.',
    rarity: 'common',
    primary: '#f97316',
    secondary: '#fde047',
  },
  {
    id: 'frost_diadem',
    name: 'Cryo Crest',
    subtitle: 'Minimalist ice brow sigil',
    description: 'Sharp frosted diamond sigil resting cleanly on your visor brow.',
    rarity: 'common',
    primary: '#38bdf8',
    secondary: '#e0f2fe',
  },
  {
    id: 'jade_charm',
    name: 'Jade Orbit Rune',
    subtitle: 'Compact shoulder talisman',
    description: 'Single crisp glowing jade sigil gliding cleanly around your frame.',
    rarity: 'common',
    primary: '#34d399',
    secondary: '#a7f3d0',
  },
  {
    id: 'cyber_rings',
    name: 'Gyro Wire Rings',
    subtitle: 'Dual hairline orbit rings',
    description: 'Twin ultra-thin rotating cybernetic halos tracking your core.',
    rarity: 'rare',
    primary: '#22d3ee',
    secondary: '#a5f3fc',
  },
  {
    id: 'oni_mini_horns',
    name: 'Shogun Hornlets',
    subtitle: 'Sharp curved crimson horns',
    description: 'Sleek razor-tipped mini Oni horns framing your helmet.',
    rarity: 'rare',
    primary: '#ef4444',
    secondary: '#fbbf24',
  },
  {
    id: 'phantom_scarf',
    name: 'Wraith Silk Stream',
    subtitle: 'Trailing energy ribbon',
    description: 'Fluid twin-tail phantom scarf streaming smoothly as you dash.',
    rarity: 'rare',
    primary: '#c084fc',
    secondary: '#f0abfc',
  },
  {
    id: 'void_motes',
    name: 'Abyssal Twin Stars',
    subtitle: '2 orbiting void motes',
    description: 'Twin compact dark-matter stars circling on a hairline orbit.',
    rarity: 'epic',
    primary: '#a855f7',
    secondary: '#e879f9',
  },
  {
    id: 'crimson_visor',
    name: 'Bloodmoon Optics',
    subtitle: 'Piercing crimson eye trail',
    description: 'Razor-sharp glowing crimson optics with crisp corner light glints.',
    rarity: 'epic',
    primary: '#f43f5e',
    secondary: '#fecdd3',
  },
  {
    id: 'seraph_winglets',
    name: 'Seraph Pinions',
    subtitle: 'Compact crystalline wings',
    description: 'Lightweight geometric shoulder pinions that flare gently in motion.',
    rarity: 'epic',
    primary: '#fde047',
    secondary: '#fef9c3',
  },
  {
    id: 'eclipse_crown',
    name: 'Twin Eclipse Crown',
    subtitle: 'Solar-Lunar filigree crown',
    description: 'Minimalist split gold-and-cyan crown floating lightly above your head.',
    rarity: 'legendary',
    primary: '#fbbf24',
    secondary: '#38bdf8',
  },
  {
    id: 'thunder_crest',
    name: 'Raijin Arc Aura',
    subtitle: 'Crackling perimeter arcs',
    description: 'Crisp miniature lightning filaments dancing cleanly along your armor trim.',
    rarity: 'legendary',
    primary: '#facc15',
    secondary: '#38bdf8',
  },
  {
    id: 'sovereign_prism',
    name: 'Sovereign Prism Core',
    subtitle: 'Iridescent diamond halo',
    description: 'Sleek shifting prismatic halo & micro-sparks radiating Sovereign light.',
    rarity: 'mythic',
    primary: '#fbbf24',
    secondary: '#22d3ee',
  },
  {
    id: 'valkyrie_plume',
    name: 'Valkyrie Winglet Crest',
    subtitle: 'Swept silver-cyan helm feathers',
    description: 'Clean aerodynamic twin winglet plumes tucked neatly behind your temples.',
    rarity: 'rare',
    primary: '#7dd3fc',
    secondary: '#f8fafc',
  },
  {
    id: 'samurai_crest',
    name: 'Shogun Crescent Crest',
    subtitle: 'Razor gold kabuto horn',
    description: 'Minimalist crescent moon ornament mounted sharply on your helmet brow.',
    rarity: 'rare',
    primary: '#fbbf24',
    secondary: '#fef3c7',
  },
  {
    id: 'kitsune_spirit',
    name: 'Kitsune Foxfire Ears',
    subtitle: 'Spirit ears + foxfire wisp',
    description: 'Sleek spirit fox ears paired with a tiny circling azure foxfire flame.',
    rarity: 'epic',
    primary: '#38bdf8',
    secondary: '#f472b6',
  },
  {
    id: 'frost_orbitals',
    name: 'Glacial Needle Orbit',
    subtitle: '3 orbiting ice shards',
    description: 'Three razor-thin crystalline frost needles gliding calmly around your core.',
    rarity: 'epic',
    primary: '#67e8f9',
    secondary: '#e0f2fe',
  },
  {
    id: 'demon_third_eye',
    name: 'Oni Third-Eye Sigil',
    subtitle: 'Awakened demon brow eye',
    description: 'Piercing crimson-gold third eye hovering above your helm with dark trim.',
    rarity: 'legendary',
    primary: '#f43f5e',
    secondary: '#fde047',
  },
  {
    id: 'astral_wings',
    name: 'Astral Blade Pinions',
    subtitle: 'Sleek energy blade wings',
    description: 'Weightless geometric light-blade wings fanning cleanly without blocking view.',
    rarity: 'legendary',
    primary: '#a855f7',
    secondary: '#38bdf8',
  },
  {
    id: 'abyss_crown',
    name: 'Abyssal Sovereign Horns',
    subtitle: 'Obsidian-violet horns + halo',
    description: 'Sweeping void-forged horns cradling a razor-thin fractured rift halo.',
    rarity: 'mythic',
    primary: '#c084fc',
    secondary: '#f43f5e',
  },
  {
    id: 'celestial_astrolabe',
    name: 'Celestial Astrolabe',
    subtitle: 'Spinning star-chart rings',
    description: 'Twin counter-rotating golden hairline star rings with 4 twinkling motes.',
    rarity: 'mythic',
    primary: '#fde047',
    secondary: '#f8fafc',
  },
];

export const SKILL_EFFECTS_CATALOG: SkillEffectDef[] = [
  {
    id: 'ember_forge',
    name: 'Cinder Forge',
    subtitle: 'Molten orange skill flames',
    description: 'Recolors slash arcs, dash trails, projectiles & waves in molten forge fire.',
    rarity: 'common',
    primary: '#f97316',
    secondary: '#fde047',
    core: '#fff7ed',
  },
  {
    id: 'glacial_frost',
    name: 'Glacial Shatter',
    subtitle: 'Crystalline frost trails',
    description: 'Turns skills and dash streams into sharp glacial frostlight.',
    rarity: 'common',
    primary: '#38bdf8',
    secondary: '#bae6fd',
    core: '#f0f9ff',
  },
  {
    id: 'venom_jade',
    name: 'Venom Viper',
    subtitle: 'Emerald-acid skill essence',
    description: 'Infuses weapon waves, zones and dashes with luminous jade energy.',
    rarity: 'common',
    primary: '#22c55e',
    secondary: '#bef264',
    core: '#ecfccb',
  },
  {
    id: 'crimson_bloodmoon',
    name: 'Crimson Bloodmoon',
    subtitle: 'Blood-scarlet edge streaks',
    description: 'Razor scarlet arcs and crimson shockwave ripples on every skill cast.',
    rarity: 'rare',
    primary: '#e11d48',
    secondary: '#fda4af',
    core: '#fff1f2',
  },
  {
    id: 'cyber_neon',
    name: 'Hypergrid Neon',
    subtitle: 'Cyan-magenta synth pulses',
    description: 'Dual cyan & neon-pink laser edges across projectiles, arcs & dash echoes.',
    rarity: 'rare',
    primary: '#06b6d4',
    secondary: '#f472b6',
    core: '#ecfeff',
  },
  {
    id: 'storm_sakura',
    name: 'Sakura Tempest',
    subtitle: 'Blossom-pink slash winds',
    description: 'Laces slash arcs and shockwaves with radiant sakura petal accents.',
    rarity: 'epic',
    primary: '#ec4899',
    secondary: '#fbcfe8',
    core: '#ffffff',
  },
  {
    id: 'void_riftfire',
    name: 'Abyssal Voidfire',
    subtitle: 'Rift-purple starlight bursts',
    description: 'Surrounds skills, zones & crescents with crackling ultraviolet void rings.',
    rarity: 'epic',
    primary: '#9333ea',
    secondary: '#e879f9',
    core: '#fae8ff',
  },
  {
    id: 'celestial_gold',
    name: 'Celestial Seraph',
    subtitle: 'Radiant golden divine flare',
    description: 'Gilded golden-white halos, gleaming arrows & sacred shockwave rings.',
    rarity: 'legendary',
    primary: '#f59e0b',
    secondary: '#fef08a',
    core: '#ffffff',
  },
  {
    id: 'eclipse_duality',
    name: 'Eclipse Duality',
    subtitle: 'Twin Solar & Lunar arcs',
    description: 'Intertwines solar gold and lunar cyan dual rings across all skill FX.',
    rarity: 'legendary',
    primary: '#fbbf24',
    secondary: '#38bdf8',
    core: '#ffffff',
  },
  {
    id: 'cosmic_prismatic',
    name: 'Sovereign Prismatic',
    subtitle: 'Spectrum-shifting mythic FX',
    description: 'Continuously shifts every slash, wave, zone & dash through Sovereign spectrum.',
    rarity: 'mythic',
    primary: '#fbbf24',
    secondary: '#22d3ee',
    core: '#ffffff',
    prismatic: true,
  },
];

export interface SoulsProfile {
  souls: number;
  unlockedCosmetics: CosmeticId[];
  equippedCosmetic: CosmeticId | null;
  unlockedSkillEffects: SkillEffectId[];
  equippedSkillEffect: SkillEffectId | null;
  totalRuns: number;
  totalChestsOpened: number;
}

const SOULS_PROFILE_KEY = 'dungeon_bouncer_souls_profile_v1';

const DEFAULT_SOULS_PROFILE: SoulsProfile = {
  souls: 0,
  unlockedCosmetics: [],
  equippedCosmetic: null,
  unlockedSkillEffects: [],
  equippedSkillEffect: null,
  totalRuns: 0,
  totalChestsOpened: 0,
};

export function loadSoulsProfile(): SoulsProfile {
  try {
    const raw = localStorage.getItem(SOULS_PROFILE_KEY);
    if (!raw) return { ...DEFAULT_SOULS_PROFILE };
    const parsed = JSON.parse(raw) || {};
    const validCosIds = new Set(COSMETICS_CATALOG.map((c) => c.id));
    const validFxIds = new Set(SKILL_EFFECTS_CATALOG.map((e) => e.id));
    const unlockedCosmetics = Array.isArray(parsed.unlockedCosmetics)
      ? parsed.unlockedCosmetics.filter((id: CosmeticId) => validCosIds.has(id))
      : [];
    const unlockedSkillEffects = Array.isArray(parsed.unlockedSkillEffects)
      ? parsed.unlockedSkillEffects.filter((id: SkillEffectId) => validFxIds.has(id))
      : [];
    const equippedCosmetic =
      parsed.equippedCosmetic && unlockedCosmetics.includes(parsed.equippedCosmetic)
        ? parsed.equippedCosmetic
        : null;
    const equippedSkillEffect =
      parsed.equippedSkillEffect && unlockedSkillEffects.includes(parsed.equippedSkillEffect)
        ? parsed.equippedSkillEffect
        : null;
    return {
      souls: Math.max(0, Math.floor(Number(parsed.souls) || 0)),
      unlockedCosmetics,
      equippedCosmetic,
      unlockedSkillEffects,
      equippedSkillEffect,
      totalRuns: Math.max(0, Math.floor(Number(parsed.totalRuns) || 0)),
      totalChestsOpened: Math.max(0, Math.floor(Number(parsed.totalChestsOpened) || 0)),
    };
  } catch {
    return { ...DEFAULT_SOULS_PROFILE };
  }
}

export function saveSoulsProfile(profile: SoulsProfile): SoulsProfile {
  try {
    localStorage.setItem(SOULS_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage quota errors
  }
  return profile;
}

export function getCosmeticDef(id?: CosmeticId | null): CosmeticDef | null {
  if (!id) return null;
  return COSMETICS_CATALOG.find((c) => c.id === id) || null;
}

export function getSkillEffectDef(id?: SkillEffectId | null): SkillEffectDef | null {
  if (!id) return null;
  return SKILL_EFFECTS_CATALOG.find((e) => e.id === id) || null;
}

export interface SkillEffectPalette {
  primary: string;
  secondary: string;
  core: string;
  prismatic: boolean;
}

const PRISM_PALETTES: readonly SkillEffectPalette[] = [
  { primary: '#fbbf24', secondary: '#c084fc', core: '#ffffff', prismatic: true },
  { primary: '#38bdf8', secondary: '#f43f5e', core: '#ffffff', prismatic: true },
  { primary: '#c084fc', secondary: '#34d399', core: '#ffffff', prismatic: true },
  { primary: '#f43f5e', secondary: '#fbbf24', core: '#ffffff', prismatic: true },
  { primary: '#34d399', secondary: '#38bdf8', core: '#ffffff', prismatic: true },
];

const STATIC_EFFECT_PALETTES: Partial<Record<SkillEffectId, SkillEffectPalette>> = {};
for (const def of SKILL_EFFECTS_CATALOG) {
  if (!def.prismatic) {
    STATIC_EFFECT_PALETTES[def.id] = {
      primary: def.primary,
      secondary: def.secondary,
      core: def.core,
      prismatic: false,
    };
  }
}

export function getSkillEffectPalette(
  effectId?: SkillEffectId | null,
  nowMs = 0
): SkillEffectPalette | null {
  if (!effectId) return null;
  const cached = STATIC_EFFECT_PALETTES[effectId];
  if (cached) return cached;
  const def = getSkillEffectDef(effectId);
  if (!def) return null;
  if (def.prismatic) {
    const idx = Math.floor(nowMs / 180) % PRISM_PALETTES.length;
    return PRISM_PALETTES[idx < 0 ? 0 : idx];
  }
  return null;
}

export interface RunSoulsResult {
  totalSouls: number;
  breakdown: {
    base: number;
    bosses: number;
    combat: number;
    technique: number;
    victory: number;
    multiplier: number;
  };
}

/**
 * Calibrated so a Slayer ('medium') run defeating the 1st boss averages ~700 Souls,
 * while partial runs still reward players cleanly and deeper/Nightmare clears scale up.
 */
export function computeRunSoulsAward(params: {
  difficulty: DifficultyKey;
  mode: GameMode;
  bossesDefeated: number;
  score: number;
  kills: number;
  grazes: number;
  maxCombo: number;
  roomDepth: number;
  victory: boolean;
  cheated?: boolean;
}): RunSoulsResult {
  if (params.cheated || params.mode === 'tutorial' || params.mode === 'teamwork_practice') {
    return {
      totalSouls: 0,
      breakdown: { base: 0, bosses: 0, combat: 0, technique: 0, victory: 0, multiplier: 1 },
    };
  }

  const multiplier =
    params.difficulty === 'easy' ? 0.75 : params.difficulty === 'hard' ? 1.4 : 1.0;

  const bosses = Math.max(0, params.bossesDefeated);
  const base = 60;
  const bossBonus = bosses * 340;
  const combatRaw = Math.min(165, Math.round(params.score / 36));
  const depthOffset = params.mode === 'boss_rush' ? bosses * 50 : Math.min(85, Math.max(0, params.roomDepth - 1) * 14);
  const combat = combatRaw + depthOffset;
  const technique = Math.min(155, Math.round(params.kills * 1.8 + params.grazes * 7 + params.maxCombo * 5));
  const victory = params.victory ? 260 : 0;

  const subtotal = base + bossBonus + combat + technique + victory;
  const totalSouls = Math.max(40, Math.round(subtotal * multiplier));

  return {
    totalSouls,
    breakdown: {
      base: Math.round(base * multiplier),
      bosses: Math.round(bossBonus * multiplier),
      combat: Math.round(combat * multiplier),
      technique: Math.round(technique * multiplier),
      victory: Math.round(victory * multiplier),
      multiplier,
    },
  };
}

export type CaseKind = 'cosmetic' | 'skill_effect';

export type CaseItem =
  | { kind: 'cosmetic'; def: CosmeticDef }
  | { kind: 'skill_effect'; def: SkillEffectDef };

export interface CaseRollOutcome {
  kind: CaseKind;
  cost: number;
  winner: CaseItem;
  reelItems: CaseItem[];
  winningIndex: number;
  isDuplicate: boolean;
  refundSouls: number;
}

function pickWeightedItem<T extends { rarity: ItemRarity }>(catalog: T[]): T {
  const rarities: ItemRarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];
  const totalWeight = rarities.reduce((acc, r) => acc + RARITY_META[r].weight, 0);
  let rRoll = Math.random() * totalWeight;
  let chosenRarity: ItemRarity = 'common';
  for (const r of rarities) {
    rRoll -= RARITY_META[r].weight;
    if (rRoll <= 0) {
      chosenRarity = r;
      break;
    }
  }
  const pool = catalog.filter((item) => item.rarity === chosenRarity);
  const finalPool = pool.length > 0 ? pool : catalog;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

export function buildCaseRoll(kind: CaseKind, profile: SoulsProfile): CaseRollOutcome {
  const cost = kind === 'cosmetic' ? COSMETIC_CASE_COST : SKILL_EFFECT_CASE_COST;
  const reelCount = 48;
  const winningIndex = 39;

  const pickItem = (): CaseItem =>
    kind === 'cosmetic'
      ? { kind: 'cosmetic', def: pickWeightedItem(COSMETICS_CATALOG) }
      : { kind: 'skill_effect', def: pickWeightedItem(SKILL_EFFECTS_CATALOG) };

  const winner = pickItem();
  const reelItems: CaseItem[] = [];
  for (let i = 0; i < reelCount; i++) {
    reelItems.push(i === winningIndex ? winner : pickItem());
  }

  const isDuplicate =
    winner.kind === 'cosmetic'
      ? profile.unlockedCosmetics.includes(winner.def.id)
      : profile.unlockedSkillEffects.includes(winner.def.id);

  const refundSouls = isDuplicate
    ? Math.round(cost * RARITY_META[winner.def.rarity].refundRatio)
    : 0;

  return {
    kind,
    cost,
    winner,
    reelItems,
    winningIndex,
    isDuplicate,
    refundSouls,
  };
}
