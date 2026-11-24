import React, { useEffect, useState } from 'react';
import {
  Pause,
  Volume2,
  VolumeX,
  Keyboard,
  Swords,
  Shield,
  Zap,
  ChevronRight,
  LogOut,
  Users,
  FastForward,
  Gamepad2,
  Maximize2,
  Minimize2,
  Wifi,
  Coins,
  Lock,
  Map as MapIcon,
  Flame,
  Briefcase,
  FlaskConical,
  AlertTriangle,
  Store,
} from 'lucide-react';
import {
  BOONS_CATALOG,
  BossChannelKind,
  ClassSkillDef,
  DifficultyKey,
  FloorMapHudSnapshot,
  FloorMapNodeHud,
  HERO_CLASSES,
  HeroClassId,
  HudSnapshot,
  PlayerHudState,
  PlayerId,
  WeaponClassId,
  WeaponId,
  WEAPONS_CATALOG,
} from '../game/types';
import { formatDuration } from './PixelHeart';
import { MobileControls } from './MobileControls';

interface GameHudProps {
  hud: HudSnapshot;
  difficulty: DifficultyKey;
  numPlayers: number;
  localPlayerNum?: PlayerId;
  isOnline?: boolean;
  playerColors: Record<number, string>;
  pingByPlayer?: Record<number, number | null>;
  isMuted: boolean;
  isFullscreen: boolean;
  showTouchControls: boolean;
  onToggleFullscreen: () => void;
  onToggleTouchControls: () => void;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenControls: () => void;
  onSwitchTutorialClass?: (cls: HeroClassId) => void;
  onSwitchTutorialWeapon?: (weapon: WeaponId) => void;
  onSwitchPracticeWeapon?: (weapon: WeaponClassId) => void;
  onTriggerPracticeAttack?: (attackKind?: BossChannelKind) => void;
  onSwitchPracticeBoss?: (bossStage: 'mechaBoss' | 'voidBoss' | 'oniBoss' | 'eclipseBoss') => void;
  onUsePotion?: () => void;
  onOpenInventory?: () => void;
  onOpenShop?: () => void;
  onNextTutorialStep?: () => void;
  onExitTutorial?: () => void;
  onSkipIntro?: () => void;
  onTouchMove: (x: number, y: number) => void;
  onTouchDash: (pressed: boolean) => void;
  onTouchAbility: (pressed: boolean) => void;
  onTouchSkillSlot?: (slot: 2 | 3 | 4, pressed: boolean) => void;
  children: React.ReactNode;
}

const STYLE_COLORS: Record<HudSnapshot['styleRank'], string> = {
  D: '#78716c',
  C: '#38bdf8',
  B: '#34d399',
  A: '#facc15',
  S: '#f97316',
  SS: '#ef4444',
  SSS: '#e879f9',
};

function pingTextColor(ms: number | null): string {
  if (ms === null) return 'text-stone-400';
  if (ms <= 70) return 'text-emerald-300';
  if (ms <= 140) return 'text-amber-300';
  return 'text-rose-300';
}

function getRoomSymbol(node: FloorMapNodeHud): string {
  if (node.kind === 'boss') return '☠';
  if (node.kind === 'shop') return '$';
  if (node.kind === 'treasure') return '◈';
  if (node.kind === 'start') return '⌂';
  if (node.cleared) return '✓';
  return node.visited ? '⚔' : '?';
}

const FloorMinimapCard: React.FC<{ floorMap: FloorMapHudSnapshot; compact?: boolean }> = React.memo(({
  floorMap,
  compact = false,
}) => {
  const nodeMap = new Map<string, FloorMapNodeHud>();
  floorMap.nodes.forEach((n) => nodeMap.set(`${n.gx},${n.gy}`, n));
  const size = floorMap.gridSize || 5;

  return (
    <div className="bg-[#0b0a0e] border border-stone-800 rounded-md p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-souls text-[11px] font-bold text-stone-100 tracking-wider truncate">
            FLOOR {floorMap.floorNumber} MAP
          </span>
        </div>
        {floorMap.loopLevel > 1 ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/70 border border-rose-500/70 font-mono-num text-[9px] font-bold text-rose-300 shrink-0">
            <Flame className="w-2.5 h-2.5" />
            LOOP {floorMap.loopLevel}
          </span>
        ) : (
          <span className="font-mono-num text-[9px] text-stone-400 shrink-0">{size}×{size} GRID</span>
        )}
      </div>

      {/* Soul Knight Style Room Grid */}
      <div
        className={`bg-black/80 border border-stone-800/90 rounded p-2 grid gap-1.5 ${
          compact ? 'max-w-[190px] mx-auto' : 'w-full'
        }`}
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: size * size }, (_, idx) => {
          const gx = idx % size;
          const gy = Math.floor(idx / size);
          const node = nodeMap.get(`${gx},${gy}`);
          if (!node || !node.revealed) {
            return (
              <div
                key={`${gx},${gy}`}
                className="aspect-square rounded-[3px] bg-stone-950/25 border border-stone-900/30"
              />
            );
          }

          const isCurrent = node.key === floorMap.currentRoomKey;
          const isBoss = node.kind === 'boss';
          const isShop = node.kind === 'shop';
          const isTreasure = node.kind === 'treasure';
          const isStart = node.kind === 'start';

          let cellStyle = 'bg-stone-900/90 border-stone-600/80 text-stone-300';
          if (isBoss) {
            cellStyle = node.cleared
              ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300'
              : 'bg-rose-950/75 border-rose-500/90 text-rose-300';
          } else if (isShop) {
            cellStyle = 'bg-amber-950/65 border-amber-500/85 text-amber-300';
          } else if (isTreasure) {
            cellStyle = 'bg-purple-950/65 border-purple-500/85 text-purple-300';
          } else if (isStart) {
            cellStyle = 'bg-cyan-950/60 border-cyan-500/80 text-cyan-300';
          } else if (node.cleared) {
            cellStyle = 'bg-emerald-950/45 border-emerald-600/75 text-emerald-300';
          } else if (!node.visited) {
            cellStyle = 'bg-slate-950/80 border-slate-700/70 border-dashed text-slate-400';
          }

          return (
            <div key={node.key} className="relative aspect-square">
              {/* Corridor Bridges */}
              {node.connections.right && (
                <span className="pointer-events-none absolute -right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-[2px] bg-stone-500/80 z-0" />
              )}
              {node.connections.bottom && (
                <span className="pointer-events-none absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-[2px] h-1.5 bg-stone-500/80 z-0" />
              )}

              <div
                title={`${node.kind.toUpperCase()}${node.cleared ? ' (CLEARED)' : node.visited ? ' (VISITED)' : ' (UNEXPLORED)'}`}
                className={`relative z-10 w-full h-full rounded-[3px] border flex items-center justify-center font-mono-num text-[10px] font-bold transition-all ${cellStyle} ${
                  isCurrent ? 'ring-2 ring-white shadow-[0_0_10px_rgba(255,255,255,0.6)] scale-105' : ''
                }`}
              >
                {getRoomSymbol(node)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compact Legend */}
      <div className="flex items-center justify-between text-[9px] font-mono-num text-stone-400 pt-0.5">
        <span className="text-amber-300">$ Shop</span>
        <span className="text-purple-300">◈ Vault</span>
        <span className="text-rose-300">☠ Boss</span>
        <span className="text-emerald-300">✓ Clear</span>
      </div>
    </div>
  );
});

interface PlayerCardProps {
  label: string;
  p: PlayerHudState;
  color: string;
  combo: number;
  skillKeyLabel: string;
  isOnlineCampaign?: boolean;
  isOnline?: boolean;
  pingMs?: number | null;
  compact?: boolean;
  highlighted?: boolean;
}

const PlayerSideCard: React.FC<PlayerCardProps> = React.memo(({
  label,
  p,
  color,
  combo,
  skillKeyLabel,
  isOnlineCampaign = false,
  isOnline = false,
  pingMs = null,
  compact = false,
  highlighted = false,
}) => {
  const clsDef = HERO_CLASSES.find((c) => c.id === p.heroClass);
  const weaponDef =
    isOnlineCampaign && p.weapon !== 'none'
      ? WEAPONS_CATALOG.find((w) => w.id === p.weapon)
      : undefined;
  const hpPct = p.maxHp > 0 ? Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100)) : 0;

  const learnedCount =
    isOnlineCampaign && weaponDef
      ? Math.max(1, (p.learnedSkills?.[weaponDef.id] || [1]).length)
      : p.unlockedSkillTier || 1;

  const titleRole = isOnlineCampaign
    ? weaponDef
      ? weaponDef.shortTag
      : 'ADVENTURER'
    : clsDef?.name || 'HERO';

  const subtitleText = isOnlineCampaign
    ? weaponDef
      ? `${weaponDef.roleLabel} · ${learnedCount}/4 Skills`
      : 'Unarmed · Loot Weapon Drop'
    : `${clsDef?.passiveName || ''} · ${learnedCount}/4 Skills`;

  return (
    <div
      className={`bg-[#0b0a0e] rounded-md ${compact ? 'p-2 space-y-1.5' : 'p-2.5 space-y-1.5'} ${
        highlighted ? 'border-2' : 'border'
      }`}
      style={{
        borderColor: highlighted ? color : `${color}88`,
        boxShadow: highlighted ? `0 0 18px ${color}33` : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          {highlighted && (
            <div
              className="font-mono-num text-[9px] font-bold tracking-widest uppercase mb-0.5"
              style={{ color }}
            >
              ★ YOUR FRAME · P{p.id}
            </div>
          )}
          <div className="font-souls text-xs font-bold truncate" style={{ color }}>
            {label} · <span style={{ color: weaponDef ? weaponDef.accent : undefined }}>{titleRole}</span>
          </div>
          {!compact && (
            <div className="font-mono-num text-[10px] text-stone-400 truncate">
              {subtitleText}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isOnlineCampaign && (
            <span className="inline-flex items-center gap-0.5 font-mono-num text-[10px] font-bold text-amber-300">
              <Coins className="w-3 h-3" />
              {p.coins}g
            </span>
          )}
          {isOnline && (
            <span className={`font-mono-num text-[10px] font-bold ${pingTextColor(pingMs)}`}>
              {pingMs === null ? '--ms' : `${pingMs}ms`}
            </span>
          )}
          {combo > 1 && (
            <span className="font-arcade text-[10px] text-amber-300 shrink-0">{combo}x</span>
          )}
        </div>
      </div>

      {/* 100-HP Crimson Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between font-mono-num text-[11px]">
          <span className="text-stone-400">{compact ? 'HP' : 'VITALITY'}</span>
          <span className="font-bold text-stone-100">
            {p.hp} / {p.maxHp}
          </span>
        </div>
        <div className={`relative w-full ${compact ? 'h-2' : 'h-2.5'} bg-stone-950 border border-stone-700/90 overflow-hidden`}>
          <div
            className="absolute inset-y-0 left-0 bg-amber-400/80 transition-all duration-500 ease-out"
            style={{ width: `${hpPct}%` }}
          />
          <div
            className="relative h-full transition-all duration-150"
            style={{
              width: `${hpPct}%`,
              background: 'linear-gradient(90deg, #7f1d1d, #dc2626, #ef4444)',
            }}
          />
        </div>
      </div>

      {p.state === 'down' ? (
        <div className="font-mono-num text-[11px] text-rose-400 font-semibold py-0.5">
          DOWNED · Stand nearby to revive
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 font-mono-num text-[10px]">
          <div
            className={`px-2 py-1 rounded border truncate ${
              p.dashReady
                ? 'bg-emerald-950/35 border-emerald-700/60 text-emerald-300'
                : 'bg-black/60 border-stone-800 text-stone-400'
            }`}
          >
            {p.dashReady
              ? p.dash2Active && p.dash2Ready
                ? 'DASH x2'
                : 'DASH OK'
              : `DASH ${p.dashCooldown}s`}
          </div>
          <div
            className={`px-2 py-1 rounded border truncate ${
              isOnlineCampaign && p.weapon === 'none'
                ? 'bg-black/60 border-stone-800 text-stone-400'
                : p.abilityReady
                ? 'bg-amber-950/35 border-amber-700/60 text-amber-300 font-semibold'
                : 'bg-black/60 border-stone-800 text-stone-400'
            }`}
          >
            {isOnlineCampaign && p.weapon === 'none'
              ? `NO WPN [${skillKeyLabel}]`
              : p.abilityReady
              ? `${weaponDef ? weaponDef.shortTag : 'SKILL'} · ${learnedCount}/4`
              : `S1 ${p.abilityCooldown}s · ${learnedCount}/4`}
          </div>
        </div>
      )}

      {/* Status Badges */}
      {(p.hasKnife || p.empowered || p.hasShield || (p.frontShield || 0) > 0 || p.overdrive > 0 || p.cloak > 0 || p.sealed) && (
        <div className="flex flex-wrap gap-1.5 font-mono-num text-[10px]">
          {p.hasKnife && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-700/60 text-cyan-300 font-semibold">
              <Swords className="w-3 h-3" /> ARMED
            </span>
          )}
          {p.empowered && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-500/70 text-amber-300 font-semibold">
              <Zap className="w-3 h-3" /> EMPOWERED
            </span>
          )}
          {(p.frontShield || 0) > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-900/80 border border-sky-400 text-sky-100 font-bold">
              <Shield className="w-3 h-3 text-sky-300" /> WALL {p.frontShield?.toFixed(1)}s
            </span>
          )}
          {p.hasShield && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-700/60 text-sky-300">
              <Shield className="w-3 h-3" /> AEGIS
            </span>
          )}
          {p.overdrive > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-950/60 border border-yellow-700/60 text-yellow-300">
              <Zap className="w-3 h-3" /> {Math.ceil(p.overdrive)}s
            </span>
          )}
          {p.cloak > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-700/60 text-purple-300">
              CLOAK
            </span>
          )}
          {p.sealed && (
            <span className="px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-700/60 text-rose-300">
              SEALED
            </span>
          )}
        </div>
      )}
    </div>
  );
});

const SkillHotbarCard: React.FC<{ p: PlayerHudState; isOnlineCampaign: boolean }> = React.memo(({
  p,
  isOnlineCampaign,
}) => {
  const clsDef = HERO_CLASSES.find((c) => c.id === p.heroClass);
  const weaponDef =
    isOnlineCampaign && p.weapon !== 'none'
      ? WEAPONS_CATALOG.find((w) => w.id === p.weapon)
      : undefined;

  const skills: ClassSkillDef[] = isOnlineCampaign
    ? weaponDef?.skills || []
    : clsDef?.skills || [];
  const accent = isOnlineCampaign ? weaponDef?.accent || '#38bdf8' : clsDef?.accent || '#f59e0b';
  const unlockedTier = p.unlockedSkillTier || 1;
  const learnedArr = isOnlineCampaign && weaponDef ? p.learnedSkills?.[weaponDef.id] || [1] : [];
  const learnedTotal = isOnlineCampaign ? (weaponDef ? learnedArr.length : 0) : unlockedTier;
  const learnedWeaponIds = Object.keys(p.learnedSkills || {}).filter(
    (wid) => (p.learnedSkills?.[wid as keyof typeof p.learnedSkills]?.length || 0) > 0
  );

  return (
    <div className="bg-[#0b0a0e] border border-stone-800 rounded-md p-2.5 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono-num text-stone-400 uppercase tracking-wider font-bold">
          4-SKILL ARSENAL
        </span>
        <span className="font-mono-num text-[10px] text-purple-300 font-bold">
          {isOnlineCampaign && p.weapon === 'none' ? 'UNARMED' : `${learnedTotal}/4 UNLOCKED`}
        </span>
      </div>

      {isOnlineCampaign && p.weapon === 'none' ? (
        <div className="p-2 rounded bg-black/60 border border-stone-800/80 font-mono-num text-[10px] text-stone-400 text-center">
          Open Chests or Shop to equip a Weapon &amp; unlock 4 class skills!
        </div>
      ) : (
        <div className="space-y-1">
          {skills.map((sk, idx) => {
            const slot = idx + 1;
            const unlocked = isOnlineCampaign
              ? p.weapon !== 'none' && (slot === 1 || learnedArr.includes(slot))
              : unlockedTier >= slot;
            const cd = p.skillCooldowns?.[idx] || 0;
            const maxCd = Math.max(1, p.skillMaxCooldowns?.[idx] || sk.cooldown);
            const ready = unlocked && cd <= 0;
            const pctReady = unlocked ? Math.max(0, Math.min(100, ((maxCd - cd) / maxCd) * 100)) : 0;

            return (
              <div
                key={sk.slot}
                title={sk.desc}
                className={`relative rounded border px-2 py-1 overflow-hidden ${
                  !unlocked
                    ? 'bg-stone-950/60 border-stone-800/70 opacity-65'
                    : ready
                    ? 'bg-black/80 border-stone-700'
                    : 'bg-black/60 border-stone-800'
                }`}
                style={{ borderColor: ready ? `${accent}88` : undefined }}
              >
                {unlocked && !ready && (
                  <div
                    className="absolute inset-y-0 left-0 bg-stone-800/40 pointer-events-none"
                    style={{ width: `${pctReady}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between gap-2 font-mono-num text-[10px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="px-1 py-0.5 rounded bg-stone-900 border border-stone-700 text-[9px] font-bold shrink-0"
                      style={{ color: unlocked ? accent : '#71717a' }}
                    >
                      {sk.keyLabel}
                    </span>
                    <span className={`truncate font-semibold ${unlocked ? 'text-stone-200' : 'text-stone-500'}`}>
                      {sk.name}
                    </span>
                  </div>
                  {!unlocked ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] text-purple-300 shrink-0">
                      <Lock className="w-2.5 h-2.5" />
                      SCROLL
                    </span>
                  ) : ready ? (
                    <span className="text-[9px] font-bold text-emerald-300 shrink-0">READY</span>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-300 shrink-0">{cd}s</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isOnlineCampaign && learnedWeaponIds.length > 0 && (
        <div className="pt-1 border-t border-stone-800/80 flex flex-wrap items-center gap-1 font-mono-num text-[9px]">
          <span className="text-stone-500 mr-0.5">CODEX:</span>
          {WEAPONS_CATALOG.map((w) => {
            const arr = p.learnedSkills?.[w.id];
            if (!arr || arr.length === 0) return null;
            const isEquipped = p.weapon === w.id;
            return (
              <span
                key={w.id}
                className={`px-1 py-0.5 rounded border ${
                  isEquipped ? 'bg-stone-800 border-stone-500 font-bold' : 'bg-black/60 border-stone-800 text-stone-400'
                }`}
                style={{ color: isEquipped ? w.accent : undefined }}
                title={`${w.name}: ${arr.length}/4 skills learned (persists when equipped)`}
              >
                {w.shortTag} {arr.length}/4
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
});

const InventoryCard: React.FC<{
  p: PlayerHudState;
  isOnlineCampaign: boolean;
  onUsePotion?: () => void;
  onOpenInventory?: () => void;
  onOpenShop?: () => void;
}> = React.memo(({ p, isOnlineCampaign, onUsePotion, onOpenInventory, onOpenShop }) => {
  const potionReady = p.potions > 0 && p.potionCooldown <= 0 && p.hp < p.maxHp && p.state === 'alive';
  const wDef =
    isOnlineCampaign && p.weapon !== 'none'
      ? WEAPONS_CATALOG.find((w) => w.id === p.weapon)
      : undefined;
  const bagCount = (p.scrollBag || []).length;

  return (
    <div className="bg-[#0b0a0e] border border-stone-800 rounded-md p-2.5 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-mono-num text-stone-400 uppercase tracking-wider font-bold">
          <Briefcase className="w-3 h-3 text-amber-400" />
          <span>BELT &amp; INVENTORY</span>
        </span>
        {isOnlineCampaign && (
          <span className="font-mono-num text-[10px] text-stone-400">
            [I] Bag · [C] Flask
          </span>
        )}
      </div>

      {/* Crimson Flask Row */}
      <button
        type="button"
        onClick={() => onUsePotion?.()}
        disabled={!potionReady}
        title="Drink Crimson Flask [C] to restore +45 HP"
        className={`w-full px-2.5 py-1.5 rounded border flex items-center justify-between font-mono-num text-[10px] transition-colors ${
          potionReady
            ? 'bg-rose-950/55 hover:bg-rose-900/60 border-rose-500/75 text-rose-100 cursor-pointer'
            : 'bg-black/60 border-stone-800 text-stone-500 cursor-default'
        }`}
      >
        <span className="inline-flex items-center gap-1.5 font-bold">
          <FlaskConical className={`w-3.5 h-3.5 ${p.potions > 0 ? 'text-rose-400' : 'text-stone-600'}`} />
          <span>FLASK [C] · +45 HP</span>
        </span>
        <span className="font-bold">
          {p.potionCooldown > 0
            ? `${p.potionCooldown}s`
            : `x${p.potions}/2`}
        </span>
      </button>

      {/* 1-Weapon Slot + Inventory Menu Button */}
      {isOnlineCampaign && (
        <>
          <button
            type="button"
            onClick={() => onOpenInventory?.()}
            className="w-full px-2.5 py-1.5 rounded border border-stone-700 hover:border-amber-400/80 bg-black/75 hover:bg-stone-900 flex items-center justify-between font-mono-num text-[10px] transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5 truncate">
              <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-bold truncate" style={{ color: wDef ? wDef.accent : '#a8a29e' }}>
                {wDef ? wDef.shortTag : 'UNARMED'}
              </span>
              <span className="text-stone-400">· BAG [I]</span>
            </span>
            <span className="text-purple-300 font-bold shrink-0">
              {bagCount}/8 SCRL
            </span>
          </button>

          {p.nearMerchant && onOpenShop && (
            <button
              type="button"
              onClick={() => onOpenShop()}
              className="w-full px-2.5 py-1.5 rounded border border-amber-400 bg-amber-950/75 hover:bg-amber-900/80 text-amber-200 flex items-center justify-between font-mono-num text-[10px] font-bold cursor-pointer animate-pulse"
            >
              <span className="inline-flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-300" />
                <span>TALK TO VEX [E]</span>
              </span>
              <span className="text-amber-300">SHOP</span>
            </button>
          )}
        </>
      )}
    </div>
  );
});

const SquadVitalityStrip: React.FC<{
  players: PlayerHudState[];
  localPlayerId: PlayerId;
  playerColors: Record<number, string>;
  isOnlineCampaign: boolean;
  isOnline: boolean;
  resolvePing: (id: PlayerId) => number | null;
}> = React.memo(({ players, localPlayerId, playerColors, isOnlineCampaign, isOnline, resolvePing }) => {
  return (
    <div className="bg-[#0b0a0e] border border-stone-800 rounded-md p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono-num text-stone-400 uppercase tracking-wider font-bold">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>SQUAD VITALITY ({players.length})</span>
        </span>
      </div>

      <div className="space-y-1.5">
        {players.map((pl) => {
          const isMe = pl.id === localPlayerId;
          const col = playerColors[pl.id] || pl.color;
          const hpPct = pl.maxHp > 0 ? Math.max(0, Math.min(100, (pl.hp / pl.maxHp) * 100)) : 0;
          const wDef =
            isOnlineCampaign && pl.weapon !== 'none'
              ? WEAPONS_CATALOG.find((w) => w.id === pl.weapon)
              : undefined;
          const clsDef = HERO_CLASSES.find((c) => c.id === pl.heroClass);
          const pingMs = resolvePing(pl.id);
          const roleTag = isOnlineCampaign
            ? wDef
              ? wDef.shortTag
              : 'NONE'
            : clsDef?.name.slice(0, 5).toUpperCase() || 'HERO';

          return (
            <div
              key={pl.id}
              className={`rounded border px-2 py-1.5 space-y-1 ${
                isMe ? 'bg-stone-900/90' : 'bg-black/65 border-stone-800/90'
              }`}
              style={{ borderColor: isMe ? `${col}cc` : undefined }}
            >
              <div className="flex items-center justify-between gap-1.5 font-mono-num text-[10px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0 border border-white/50"
                    style={{ backgroundColor: col }}
                  />
                  <span className="font-bold text-stone-100 truncate">
                    {isMe ? `YOU · ${pl.name || `P${pl.id}`}` : `${pl.isBot ? '[BOT] ' : ''}${pl.name || `P${pl.id}`}`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {pl.hasShield && <span title="Aegis Shield Active" className="text-sky-300 text-[9px]">⛨</span>}
                  <span
                    className="text-[9px] font-bold"
                    style={{ color: wDef ? wDef.accent : '#a8a29e' }}
                  >
                    {roleTag}
                  </span>
                  {isOnline && (
                    <span className={`text-[9px] ${pingTextColor(pingMs)}`}>
                      {pingMs === null ? '--' : `${pingMs}ms`}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-stone-950 border border-stone-800 overflow-hidden">
                  <div
                    className="h-full transition-all duration-150"
                    style={{
                      width: `${hpPct}%`,
                      background:
                        pl.state === 'down'
                          ? '#71717a'
                          : 'linear-gradient(90deg, #991b1b, #ef4444)',
                    }}
                  />
                </div>
                <span
                  className={`font-mono-num text-[9px] font-bold w-14 text-right shrink-0 ${
                    pl.state === 'down' ? 'text-rose-400 animate-pulse' : 'text-stone-200'
                  }`}
                >
                  {pl.state === 'down' ? 'DOWN' : `${pl.hp}/${pl.maxHp}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  difficulty,
  numPlayers,
  localPlayerNum = 1,
  isOnline = false,
  playerColors,
  pingByPlayer,
  isMuted,
  isFullscreen,
  showTouchControls,
  onToggleFullscreen,
  onToggleTouchControls,
  onToggleMute,
  onPause,
  onOpenControls,
  onSwitchTutorialClass,
  onSwitchTutorialWeapon,
  onSwitchPracticeWeapon,
  onTriggerPracticeAttack,
  onSwitchPracticeBoss,
  onUsePotion,
  onOpenInventory,
  onOpenShop,
  onNextTutorialStep,
  onExitTutorial,
  onSkipIntro,
  onTouchMove,
  onTouchDash,
  onTouchAbility,
  onTouchSkillSlot,
  children,
}) => {
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);
  const [showMobileMap, setShowMobileMap] = useState(false);

  useEffect(() => {
    const updateOrientation = () => {
      setIsLandscapeMobile(window.innerWidth > window.innerHeight && window.innerHeight < 560);
    };
    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    return () => window.removeEventListener('resize', updateOrientation);
  }, []);

  const activePlayers = hud.players && hud.players.length > 0 ? hud.players : [hud.p1];
  const localPlayer = activePlayers.find((pl) => pl.id === localPlayerNum) || activePlayers[0] || hud.p1;
  const teammates = activePlayers.filter((pl) => pl.id !== localPlayer.id);
  const usesWeapons = hud.isOnlineCampaign || Boolean(hud.isTeamworkPractice);

  const resolvePing = (pid: PlayerId): number | null => {
    if (pid === 1) return isOnline ? 0 : null;
    if (pingByPlayer && pingByPlayer[pid] !== undefined) return pingByPlayer[pid];
    return null;
  };
  const myPingMs = resolvePing(localPlayer.id);

  const clsDefLocal = HERO_CLASSES.find((c) => c.id === localPlayer.heroClass);
  const wpnDefLocal =
    usesWeapons && localPlayer.weapon !== 'none'
      ? WEAPONS_CATALOG.find((w) => w.id === localPlayer.weapon)
      : undefined;
  const localSkillsList = usesWeapons ? wpnDefLocal?.skills || [] : clsDefLocal?.skills || [];

  const bossPct = hud.bossMaxHealth > 0 ? Math.max(0, (hud.bossHealth / hud.bossMaxHealth) * 100) : 0;
  const showBossBar = hud.isBossLevel && hud.bossHealth > 0 && hud.bossState !== 'comic_intro';
  const bossStatusText =
    hud.bossState === 'weakened'
      ? 'WEAKENED — 2X CRITICAL DAMAGE!'
      : `PHASE ${hud.bossPhase === 2 ? 'II' : 'I'} · ATTACK ANYTIME · DODGE CLEANLY FOR 2X OPENING`;

  const mobileQuickButtons = (
    <div className="flex lg:hidden w-full items-center justify-between gap-1.5 bg-[#0b0a0e] border border-stone-800 rounded px-2 py-1 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono-num text-[10px] font-bold tracking-wider text-amber-400/90 uppercase truncate">
          {hud.isTutorial
            ? 'TRAINING ARENA'
            : hud.isOnlineCampaign
            ? `F${hud.floorMap?.floorNumber || 1}${hud.loopLevel > 1 ? `·L${hud.loopLevel}` : ''} · ${numPlayers}P`
            : `${difficulty} · ${numPlayers}P`}
        </span>
        {isOnline && (
          <span className={`font-mono-num text-[10px] font-bold shrink-0 ${pingTextColor(myPingMs)}`}>
            {myPingMs === null ? '--ms' : `${myPingMs}ms`}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {hud.isOnlineCampaign && !hud.isTutorial && localPlayer.nearMerchant && onOpenShop && (
          <button
            type="button"
            onClick={() => onOpenShop()}
            className="min-h-[32px] px-2 py-1 rounded border border-amber-400 bg-amber-950/85 text-amber-200 text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer animate-pulse"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Shop</span>
          </button>
        )}
        {hud.isOnlineCampaign && !hud.isTutorial && onOpenInventory && (
          <button
            type="button"
            onClick={() => onOpenInventory()}
            className="min-h-[32px] px-2 py-1 rounded border bg-stone-900 border-stone-600 text-stone-200 text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            <span>Bag</span>
          </button>
        )}
        {hud.isOnlineCampaign && hud.floorMap && (
          <button
            type="button"
            onClick={() => setShowMobileMap((v) => !v)}
            className={`min-h-[32px] px-2 py-1 rounded border text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer ${
              showMobileMap
                ? 'bg-cyan-950/70 border-cyan-500/70 text-cyan-200'
                : 'bg-stone-900 border-stone-700 text-stone-200'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
        )}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className={`min-h-[32px] px-2 py-1 rounded border text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer ${
            isFullscreen
              ? 'bg-cyan-950/70 border-cyan-500/70 text-cyan-200'
              : 'bg-stone-900 border-stone-700 text-stone-200'
          }`}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 shrink-0" /> : <Maximize2 className="w-3.5 h-3.5 shrink-0" />}
          <span className="hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
        </button>
        <button
          type="button"
          onClick={onToggleTouchControls}
          className={`min-h-[32px] p-1.5 rounded border cursor-pointer flex items-center justify-center ${
            showTouchControls
              ? 'bg-amber-950/60 border-amber-500/70 text-amber-300'
              : 'bg-stone-900 border-stone-700 text-stone-400'
          }`}
          aria-label="Toggle Touch Controls"
          title="Toggle On-Screen Touch Buttons"
        >
          <Gamepad2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onToggleMute}
          className="min-h-[32px] p-1.5 rounded bg-stone-900 border border-stone-700 text-stone-300 cursor-pointer flex items-center justify-center"
          aria-label="Toggle Mute"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
        </button>
        <button
          type="button"
          onClick={onPause}
          className="min-h-[32px] px-2.5 py-1 rounded bg-stone-900 border border-stone-700 text-[11px] font-semibold text-stone-100 cursor-pointer"
        >
          Pause
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:h-dvh w-full overflow-y-auto lg:overflow-hidden bg-[#050406] p-2 lg:px-3 lg:py-2 select-none flex flex-col lg:grid lg:grid-rows-[minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)_240px] xl:grid-cols-[260px_minmax(0,1fr)_260px] gap-2.5 items-stretch">
      {/* ── LEFT SIDEBAR (Scrolls below arena on < lg) ──────────────── */}
      <aside className="flex order-2 lg:order-1 flex-col gap-2 min-h-0 lg:overflow-y-auto pr-0.5">
        {/* Stage & Run Metrics */}
        <div className="bg-[#0b0a0e] border border-stone-800 rounded-md p-2.5 space-y-2">
          <div>
            <div className="flex items-center justify-between gap-1.5">
              <div className="font-souls text-xs font-bold text-amber-400 tracking-wider leading-snug truncate">
                {hud.isOnlineCampaign
                  ? `F${hud.floorMap?.floorNumber || 1} · ${hud.roomKind.toUpperCase()}`
                  : hud.stageLabel}
              </div>
              {isOnline && (
                <span className={`inline-flex items-center gap-1 font-mono-num text-[10px] font-bold shrink-0 ${pingTextColor(myPingMs)}`}>
                  <Wifi className="w-3 h-3" />
                  {myPingMs === null ? '--ms' : `${myPingMs}ms`}
                </span>
              )}
            </div>
            <div className="font-mono-num text-[11px] text-stone-400 mt-0.5 truncate flex items-center justify-between gap-2">
              <span className="truncate">
                {hud.isBossLevel
                  ? hud.waveText
                  : hud.gatesActive
                  ? 'Gates Open · Pick Direction'
                  : `${hud.waveText} · ${hud.enemiesRemaining} Left`}
              </span>
              {hud.loopLevel > 1 && (
                <span className="text-rose-400 font-bold shrink-0">LOOP {hud.loopLevel}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-stone-800/80 font-mono-num text-xs">
            <div className="bg-black/60 border border-stone-800/80 rounded p-2">
              <div className="text-[9px] text-stone-500">
                {hud.isOnlineCampaign ? 'GOLD COINS' : 'SOULS'}
              </div>
              <div className="text-amber-300 font-bold text-sm">
                {hud.isOnlineCampaign ? `${localPlayer.coins}g` : hud.score.toLocaleString()}
              </div>
            </div>
            <div className="bg-black/60 border border-stone-800/80 rounded p-2">
              <div className="text-[9px] text-stone-500">STYLE RANK</div>
              <div className="font-arcade text-sm mt-0.5" style={{ color: STYLE_COLORS[hud.styleRank] }}>
                {hud.styleRank}
              </div>
            </div>
            <div className="bg-black/60 border border-stone-800/80 rounded p-2">
              <div className="text-[9px] text-stone-500">
                {hud.isOnlineCampaign ? 'BOSSES SLAIN' : 'DODGES'}
              </div>
              <div className="text-cyan-300 font-semibold">
                {hud.isOnlineCampaign ? `${hud.bossesDefeatedCount}` : hud.grazes}
              </div>
            </div>
            <div className="bg-black/60 border border-stone-800/80 rounded p-2">
              <div className="text-[9px] text-stone-500">TIME</div>
              <div className="text-stone-200 font-semibold">{formatDuration(hud.elapsedSeconds)}</div>
            </div>
          </div>
        </div>

        {hud.cheatsUsed && (
          <div className="bg-red-950/60 border border-red-600/80 rounded-md px-3 py-2 text-center">
            <div className="font-souls text-xs font-extrabold tracking-widest text-red-400">
              SHAME ON YOU
            </div>
            <div className="font-mono-num text-[10px] text-amber-200/80">
              Forbidden Cheats Invoked
            </div>
          </div>
        )}

        {/* Highlighted YOUR UI Card */}
        <PlayerSideCard
          label={localPlayer.name || `PLAYER ${localPlayer.id}`}
          p={localPlayer}
          color={playerColors[localPlayer.id] || localPlayer.color}
          combo={localPlayer.combo}
          skillKeyLabel="E"
          isOnlineCampaign={usesWeapons}
          isOnline={isOnline}
          pingMs={myPingMs}
          highlighted
        />

        {/* Inventory: Crimson Flask + 1-Weapon Bag + Merchant Button */}
        {!hud.isTutorial && (
          <InventoryCard
            p={localPlayer}
            isOnlineCampaign={hud.isOnlineCampaign}
            onUsePotion={onUsePotion}
            onOpenInventory={onOpenInventory}
            onOpenShop={onOpenShop}
          />
        )}

        {/* 4-Skill Arsenal Loadout */}
        {!hud.isTutorial && (
          <SkillHotbarCard p={localPlayer} isOnlineCampaign={usesWeapons} />
        )}

        {/* Boss Teamwork Practice Panel (Weapon Swap + Mechanic Triggers + Boss Select) */}
        {hud.isTeamworkPractice && (
          <div className="bg-[#0b0a0e] border border-cyan-600/70 rounded-md p-2.5 space-y-2.5">
            <div className="flex items-center justify-between gap-1.5 border-b border-stone-800 pb-1.5">
              <span className="inline-flex items-center gap-1.5 font-souls text-[11px] font-bold text-cyan-300 tracking-wider">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>PRACTICE SANDBOX</span>
              </span>
              <span className="font-mono-num text-[9px] text-emerald-300 font-bold">
                {isOnline ? 'CO-OP DRILL' : '1P + 2 BOTS'}
              </span>
            </div>

            {/* Instant Weapon Switch */}
            <div className="space-y-1">
              <div className="text-[9px] font-mono-num text-stone-400 uppercase tracking-wider">
                My Class Weapon (All 4 Skills)
              </div>
              <div className="grid grid-cols-2 gap-1">
                {WEAPONS_CATALOG.map((w) => {
                  const active = localPlayer.weapon === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => onSwitchPracticeWeapon?.(w.id)}
                      className={`px-2 py-1 rounded border text-[9px] font-mono-num font-bold transition-colors cursor-pointer truncate ${
                        active ? 'bg-stone-800 text-white' : 'bg-black/75 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                      style={{ borderColor: active ? w.accent : undefined, color: active ? w.accent : undefined }}
                    >
                      {w.shortTag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trigger Boss Teamwork Attacks */}
            <div className="space-y-1 pt-1 border-t border-stone-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono-num text-amber-300 uppercase tracking-wider">
                  Trigger Boss Mechanic
                </span>
                {isOnline && localPlayer.id !== 1 && (
                  <span className="text-[8px] font-mono-num text-stone-500">HOST</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1">
                {(hud.bossType === 'mecha'
                  ? ([
                      { id: 'cursed_floor', label: 'Safe Island' },
                      { id: 'siege_beam', label: 'Apoc Cone' },
                      { id: 'overload_pylons', label: 'Reactor Pylons' },
                    ] as const)
                  : hud.bossType === 'void'
                  ? ([
                      { id: 'hunter_mark', label: 'Hunter Mark' },
                      { id: 'gravity_storm', label: 'Gravity Vortex' },
                      { id: 'abyss_tether', label: 'Soul Tether' },
                    ] as const)
                  : hud.bossType === 'oni'
                  ? ([
                      { id: 'cursed_floor', label: 'Calamity Island' },
                      { id: 'demon_seal_purge', label: 'Seal Purge' },
                      { id: 'meteor_soak', label: 'Meteor Soak' },
                    ] as const)
                  : ([
                      { id: 'meteor_soak', label: 'Supernova Soak' },
                      { id: 'siege_beam', label: 'Eclipse Cone' },
                      { id: 'interrupt', label: 'Oblivion Ritual' },
                    ] as const)
                ).map((atk) => {
                  const guestLocked = isOnline && localPlayer.id !== 1;
                  return (
                    <button
                      key={atk.id}
                      type="button"
                      disabled={guestLocked}
                      onClick={() => onTriggerPracticeAttack?.(atk.id)}
                      className="px-2 py-1 rounded border border-amber-700/60 bg-amber-950/35 hover:bg-amber-900/50 text-amber-200 text-[9px] font-mono-num font-bold transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed truncate"
                    >
                      {atk.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={isOnline && localPlayer.id !== 1}
                  onClick={() => onTriggerPracticeAttack?.()}
                  className="px-2 py-1 rounded border border-cyan-700/70 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-200 text-[9px] font-mono-num font-bold transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed truncate"
                >
                  Next Attack ↻
                </button>
              </div>
            </div>

            {/* Switch Boss */}
            <div className="space-y-1 pt-1 border-t border-stone-800/80">
              <div className="text-[9px] font-mono-num text-rose-300 uppercase tracking-wider">
                Practice Boss Arena
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(
                  [
                    { stage: 'mechaBoss', label: 'Mecha' },
                    { stage: 'voidBoss', label: 'Void' },
                    { stage: 'oniBoss', label: 'Oni' },
                    { stage: 'eclipseBoss', label: 'Eclipse' },
                  ] as const
                ).map((b) => {
                  const guestLocked = isOnline && localPlayer.id !== 1;
                  return (
                    <button
                      key={b.stage}
                      type="button"
                      disabled={guestLocked}
                      onClick={() => onSwitchPracticeBoss?.(b.stage)}
                      className="px-1.5 py-1 rounded border border-rose-800/60 bg-rose-950/30 hover:bg-rose-900/50 text-rose-200 text-[9px] font-mono-num font-bold transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed truncate"
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tutorial Drill, Class & Campaign Weapon Switcher */}
        {hud.isTutorial && (
          <div className="bg-[#0b0a0e] border border-amber-700/60 rounded-md p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-souls text-[11px] font-bold text-amber-300 tracking-wider">
                {hud.tutorialTitle}
              </span>
              <span className="font-mono-num text-[10px] text-cyan-300 shrink-0">
                {hud.tutorialProgress}/{hud.tutorialTotal}
              </span>
            </div>
            <p className="font-mono-num text-[11px] text-stone-300 leading-snug">{hud.tutorialObjective}</p>

            <div className="space-y-1 pt-1">
              <div className="text-[9px] font-mono-num text-stone-400 uppercase tracking-wider">Hero Classes</div>
              <div className="grid grid-cols-2 gap-1.5">
                {HERO_CLASSES.map((cls) => {
                  const active = hud.p1.heroClass === cls.id && hud.p1.weapon === 'none';
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => onSwitchTutorialClass?.(cls.id)}
                      className={`px-2 py-1.5 rounded border text-[10px] font-mono-num font-bold transition-all cursor-pointer truncate ${
                        active ? 'bg-stone-800 text-white' : 'bg-black/70 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                      style={{ borderColor: active ? cls.accent : undefined, color: active ? cls.accent : undefined }}
                      title={`Switch to ${cls.name}: ${cls.passiveName}`}
                    >
                      {cls.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {onSwitchTutorialWeapon && (
              <div className="space-y-1 pt-1 border-t border-stone-800/80">
                <div className="text-[9px] font-mono-num text-cyan-300 uppercase tracking-wider">
                  Campaign Weapons (All 4 Skills)
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {WEAPONS_CATALOG.map((w) => {
                    const active = hud.p1.weapon === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => onSwitchTutorialWeapon(w.id)}
                        className={`px-2 py-1 rounded border text-[9px] font-mono-num font-bold transition-all cursor-pointer truncate ${
                          active ? 'bg-stone-800 text-white' : 'bg-black/70 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                        style={{ borderColor: active ? w.accent : undefined, color: active ? w.accent : undefined }}
                        title={`${w.name} (${w.roleLabel})`}
                      >
                        {w.shortTag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ── CENTER MAXIMIZED BATTLEFIELD COLUMN ──────────────────────── */}
      <main className="order-1 lg:order-2 flex-1 min-w-0 min-h-0 flex flex-col items-center justify-center gap-1.5 relative">
        {/* Dedicated Mobile Quick Actions Bar (< lg) */}
        {mobileQuickButtons}

        {/* Narrow-Screen Floating Floor Map Drawer (< lg) */}
        {showMobileMap && hud.isOnlineCampaign && hud.floorMap && (
          <div className="lg:hidden absolute top-11 right-2 z-30 w-56 shadow-2xl">
            <FloorMinimapCard floorMap={hud.floorMap} compact />
          </div>
        )}

        {/* Compact Top Boss HP + Stage Strip */}
        <div className="w-full max-w-[1160px] min-h-[40px] py-1 shrink-0 bg-[#0b0a0e] border border-stone-800 rounded px-2.5 sm:px-3 flex flex-col justify-center overflow-hidden">
          {showBossBar ? (
            <>
              <div className="flex items-center justify-between gap-2 mb-0.5 min-w-0">
                <span className="font-souls text-[11px] sm:text-xs font-bold text-stone-100 tracking-wider truncate min-w-0">
                  {hud.bossName}
                  {hud.loopLevel > 1 ? ` · LOOP ${hud.loopLevel}` : ''}
                </span>
                <div className="flex items-center gap-2 min-w-0 truncate">
                  {hud.bossAttackLabel && (
                    <span className="font-mono-num text-[10px] font-bold tracking-wider text-amber-300 animate-pulse truncate">
                      ▲ {hud.bossAttackLabel} ▲
                    </span>
                  )}
                  {hud.bossVoiceLine && (
                    <span className="font-souls italic text-[11px] text-amber-200/85 truncate hidden sm:inline">
                      “{hud.bossVoiceLine}”
                    </span>
                  )}
                </div>
                <span className="font-mono-num text-[11px] text-stone-300 shrink-0">
                  {hud.bossHealth} / {hud.bossMaxHealth}
                </span>
              </div>
              <div className="relative w-full h-2 bg-stone-950 border border-stone-700/90 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-amber-400/75 transition-all duration-500 ease-out"
                  style={{ width: `${bossPct}%` }}
                />
                <div
                  className="relative h-full transition-all duration-150"
                  style={{
                    width: `${bossPct}%`,
                    background:
                      hud.bossPhase === 2
                        ? 'linear-gradient(90deg, #92400e, #dc2626, #f59e0b)'
                        : 'linear-gradient(90deg, #5c0a0a, #991b1b, #dc2626)',
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span
                  className={`font-mono-num text-[9px] sm:text-[10px] font-bold tracking-wider truncate ${
                    hud.bossState === 'weakened' ? 'text-cyan-300 animate-pulse' : 'text-stone-400'
                  }`}
                >
                  {bossStatusText}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-2 text-xs font-mono-num text-stone-300 min-w-0">
              <span className="font-souls text-[11px] text-amber-400/90 tracking-wider truncate">
                {hud.isBossLevel
                  ? 'TRAVERSING THE FOG...'
                  : `${hud.stageLabel}${hud.loopLevel > 1 ? ` · LOOP ${hud.loopLevel}` : ''}`}
              </span>
              <span className="text-[11px] text-stone-400 hidden sm:inline truncate">
                {usesWeapons
                  ? '[E/Q/R/F] Skills · [I] Bag · [C] Flask'
                  : 'Grab Blade Orb · [Space] Dodge · [E/Q/R/F] 4 Skills'}
              </span>
            </div>
          )}
        </div>

        {/* Boss Teamwork Counter Warning Strip */}
        {hud.bossChannel && (
          <div
            className={`w-full max-w-[1160px] shrink-0 rounded px-3 py-1.5 border flex items-center justify-between gap-2 font-mono-num text-[11px] font-bold animate-pulse ${
              hud.bossChannel.kind === 'siege_beam' || hud.bossChannel.kind === 'overload_pylons'
                ? 'bg-sky-950/85 border-sky-400 text-sky-100'
                : hud.bossChannel.kind === 'cursed_floor' ||
                  hud.bossChannel.kind === 'meteor_soak' ||
                  hud.bossChannel.kind === 'demon_seal_purge'
                ? 'bg-orange-950/85 border-amber-400 text-amber-100'
                : hud.bossChannel.kind === 'hunter_mark'
                ? 'bg-rose-950/85 border-rose-400 text-rose-100'
                : 'bg-purple-950/85 border-purple-400 text-purple-100'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle
                className={`w-4 h-4 shrink-0 ${
                  hud.bossChannel.kind === 'siege_beam' || hud.bossChannel.kind === 'overload_pylons'
                    ? 'text-sky-300'
                    : hud.bossChannel.kind === 'cursed_floor' ||
                      hud.bossChannel.kind === 'meteor_soak' ||
                      hud.bossChannel.kind === 'demon_seal_purge'
                    ? 'text-amber-300'
                    : hud.bossChannel.kind === 'hunter_mark'
                    ? 'text-rose-300'
                    : 'text-purple-300'
                }`}
              />
              <span className="truncate">{hud.bossChannel.label}</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              {(hud.bossChannel.kind === 'interrupt' ||
                hud.bossChannel.kind === 'hunter_mark' ||
                hud.bossChannel.kind === 'overload_pylons' ||
                hud.bossChannel.kind === 'demon_seal_purge') && (
                <span className="text-amber-300">
                  {hud.bossChannel.hits}/{hud.bossChannel.hitsNeeded}{' '}
                  {hud.bossChannel.kind === 'overload_pylons'
                    ? 'PYLONS'
                    : hud.bossChannel.kind === 'demon_seal_purge'
                    ? 'PURGED'
                    : 'HITS'}
                </span>
              )}
              <span className="text-white">{hud.bossChannel.timer}s</span>
            </div>
          </div>
        )}

        {/* Mobile Tutorial Quick Objective & Drill Bar (< lg) */}
        {hud.isTutorial && (
          <div className="flex lg:hidden w-full items-center justify-between gap-2 bg-[#0b0a0e] border border-amber-700/60 rounded px-2.5 py-1.5 text-[10px] font-mono-num shrink-0">
            <span className="text-amber-300 font-bold truncate">
              {hud.tutorialTitle} ({hud.tutorialProgress}/{hud.tutorialTotal})
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onNextTutorialStep?.()}
                className="px-2 py-1 rounded bg-amber-600 text-white font-semibold cursor-pointer"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => onExitTutorial?.()}
                className="px-2 py-1 rounded bg-stone-800 text-stone-200 cursor-pointer"
              >
                Exit
              </button>
            </div>
          </div>
        )}

        {/* Maximized 4:3 Battlefield Viewport */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div
            className="relative rounded border border-stone-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] bg-black overflow-hidden"
            style={{
              width:
                showTouchControls && !isLandscapeMobile
                  ? 'min(100%, calc((100dvh - 308px) * 4 / 3))'
                  : 'min(100%, calc((100dvh - 116px) * 4 / 3))',
              aspectRatio: '4 / 3',
            }}
          >
            {children}

            {/* Skip Cinematic Boss Intro Button */}
            {hud.isBossLevel && hud.bossState === 'comic_intro' && onSkipIntro && (
              <button
                type="button"
                onClick={onSkipIntro}
                className="absolute bottom-3 right-3 z-20 px-4 py-2 rounded bg-black/85 hover:bg-stone-900 border border-amber-500/70 text-amber-200 font-mono-num text-xs font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer shadow-lg transition-colors"
              >
                <FastForward className="w-3.5 h-3.5 text-amber-400" />
                <span>Skip Intro [Tab]</span>
              </button>
            )}

            {/* Subtle Translucent Notifications */}
            {hud.medkitNotif && (
              <div className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-black/75 border-y border-emerald-500/60 font-souls text-[11px] font-bold text-emerald-300 tracking-widest">
                {hud.medkitNotif}
              </div>
            )}

            {hud.phaseAnnounce && (
              <div
                className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 px-4 sm:px-6 py-1.5 bg-gradient-to-r from-transparent via-black/85 to-transparent border-y border-amber-500/40 font-souls text-xs sm:text-sm font-bold text-center whitespace-nowrap max-w-[95%] truncate"
                style={{ color: hud.phaseAnnounce.color, textShadow: `0 0 14px ${hud.phaseAnnounce.color}` }}
              >
                {hud.phaseAnnounce.text}
              </div>
            )}

            {/* Clear Co-op Teamwork Objective Strip */}
            {hud.coopPrompt && (
              <div
                className={`pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1.5 rounded flex items-center gap-2 font-mono-num text-[10px] sm:text-[11px] font-bold whitespace-nowrap max-w-[95%] truncate shadow-lg ${
                  hud.coopPrompt.includes('FAILED')
                    ? 'bg-red-950/90 border border-red-500 text-red-200 animate-pulse'
                    : 'bg-black/85 border border-amber-400/60 text-amber-200'
                }`}
              >
                <Users className={`w-3.5 h-3.5 shrink-0 ${hud.coopPrompt.includes('FAILED') ? 'text-red-400' : 'text-cyan-300'}`} />
                <span className="truncate">{hud.coopPrompt}</span>
              </div>
            )}
          </div>
        </div>

        {/* Narrow-screen Player Vital, 4-Skill Pips & Score Strip (< lg) */}
        <div className="flex lg:hidden w-full items-center justify-between gap-2 bg-[#0b0a0e] border border-stone-800 rounded px-2.5 py-1.5 text-[10px] font-mono-num shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            {activePlayers.map((pl) => {
              const pCol = playerColors[pl.id] || pl.color;
              const pWpn = usesWeapons && pl.weapon !== 'none'
                ? WEAPONS_CATALOG.find((w) => w.id === pl.weapon)?.shortTag
                : null;
              const isMe = pl.id === localPlayer.id;
              return (
                <span
                  key={pl.id}
                  style={{ color: pCol }}
                  className={`font-bold whitespace-nowrap ${isMe ? 'underline decoration-white/60 underline-offset-2' : ''}`}
                >
                  {isMe ? '★' : ''}
                  {pl.name || `P${pl.id}`}: {pl.state === 'down' ? 'DOWN' : `${pl.hp}HP`}
                  {pWpn ? `(${pWpn})` : ''}
                </span>
              );
            })}
            {hud.isOnlineCampaign && (
              <span className="text-amber-300 font-bold whitespace-nowrap">{localPlayer.coins}g</span>
            )}
            <span className="text-rose-300 font-bold whitespace-nowrap">⚗{localPlayer.potions}/2</span>
            {localSkillsList.length > 0 && (!usesWeapons || localPlayer.weapon !== 'none') && (
              <div className="hidden sm:flex items-center gap-1">
                {localSkillsList.map((sk, idx) => {
                  const learnedArr =
                    usesWeapons && localPlayer.weapon !== 'none'
                      ? localPlayer.learnedSkills?.[localPlayer.weapon] || [1]
                      : [];
                  const unlocked = usesWeapons
                    ? localPlayer.weapon !== 'none' && (idx === 0 || learnedArr.includes(idx + 1))
                    : (localPlayer.unlockedSkillTier || 1) >= idx + 1;
                  const cd = localPlayer.skillCooldowns?.[idx] || 0;
                  return (
                    <span
                      key={sk.slot}
                      className={`px-1 py-0.5 rounded border text-[9px] ${
                        !unlocked
                          ? 'border-stone-800 text-stone-600'
                          : cd <= 0
                          ? 'border-emerald-700/70 text-emerald-300'
                          : 'border-stone-700 text-amber-300'
                      }`}
                    >
                      {sk.keyLabel}:{!unlocked ? '🔒' : cd <= 0 ? 'OK' : `${cd}s`}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-arcade text-[10px]" style={{ color: STYLE_COLORS[hud.styleRank] }}>
              {hud.styleRank}
            </span>
            <span className="text-amber-300 font-bold">{hud.score.toLocaleString()}</span>
          </div>
        </div>

        {/* Mobile Touch Controls Deck */}
        {showTouchControls && (
          <div
            className={
              isLandscapeMobile
                ? 'fixed bottom-2 inset-x-2 z-20 pointer-events-none'
                : 'w-full shrink-0 pt-1 pb-2'
            }
          >
            <MobileControls
              p1={localPlayer}
              playerColor={playerColors[localPlayer.id] || localPlayer.color}
              isOnlineCampaign={usesWeapons}
              compact={isLandscapeMobile}
              showSkipIntro={hud.isBossLevel && hud.bossState === 'comic_intro'}
              onMoveChange={onTouchMove}
              onDashChange={onTouchDash}
              onAbilityChange={onTouchAbility}
              onSkillSlotChange={onTouchSkillSlot}
              onUsePotion={onUsePotion}
              onOpenInventory={hud.isOnlineCampaign ? onOpenInventory : undefined}
              onOpenShop={hud.isOnlineCampaign ? onOpenShop : undefined}
              onSkipIntro={onSkipIntro}
            />
          </div>
        )}
      </main>

      {/* ── RIGHT SIDEBAR (Minimap, Party Roster, Relics) ─────────────── */}
      <aside className="flex order-3 flex-col gap-2 min-h-0 lg:overflow-y-auto pl-0.5">
        {/* Quick System Controls */}
        <div className="bg-[#0b0a0e] border border-stone-800 rounded-md p-2.5 flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={onOpenControls}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs text-stone-300 cursor-pointer"
            title="Customize Controls"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Keys</span>
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            className={`p-1.5 rounded border cursor-pointer ${
              isFullscreen
                ? 'bg-cyan-950/60 border-cyan-500/70 text-cyan-300'
                : 'bg-stone-900 hover:bg-stone-800 border-stone-700 text-stone-300'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onPause}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs text-stone-200 cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pause</span>
          </button>
        </div>

        {/* Right-Side Soul Knight Persistent Floor Map (Online Campaign) */}
        {hud.isOnlineCampaign && hud.floorMap && <FloorMinimapCard floorMap={hud.floorMap} />}

        {/* Squad Vitality Strip (All Active Players) OR Solo Threat Info */}
        {(activePlayers.length > 1 || usesWeapons) && (
          <SquadVitalityStrip
            players={activePlayers}
            localPlayerId={localPlayer.id}
            playerColors={playerColors}
            isOnlineCampaign={usesWeapons}
            isOnline={isOnline}
            resolvePing={resolvePing}
          />
        )}

        {activePlayers.length === 1 && (
          <div className="bg-[#0b0a0e] border border-stone-800 rounded-md p-3 space-y-2 text-[11px] font-mono-num">
            <div className="text-[10px] text-stone-500 uppercase tracking-wider">Threat &amp; Sustenance</div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Difficulty</span>
              <span className="text-amber-300 font-bold uppercase">{difficulty}</span>
            </div>
            {hud.isOnlineCampaign && (
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Weapon</span>
                <span className="text-cyan-300 font-bold">
                  {localPlayer.weapon === 'none'
                    ? 'UNARMED'
                    : WEAPONS_CATALOG.find((w) => w.id === localPlayer.weapon)?.shortTag || 'ARMED'}
                </span>
              </div>
            )}
            {difficulty === 'hard' && (
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Estus Kits</span>
                <span className="text-emerald-400 font-bold">{hud.medkitInventoryCount}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Max Combo</span>
              <span className="text-stone-200 font-semibold">{hud.maxCombo}x</span>
            </div>
          </div>
        )}

        {/* Active Soul Relics */}
        <div className="flex-1 bg-[#0b0a0e] border border-stone-800 rounded-md p-3 flex flex-col gap-2 min-h-[100px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-num text-stone-500 uppercase tracking-wider">Soul Relics</span>
            {numPlayers === 2 && difficulty === 'hard' && (
              <span className="text-[10px] font-mono-num text-emerald-400">Kits: {hud.medkitInventoryCount}</span>
            )}
          </div>
          {hud.activeBoons.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-[11px] text-stone-500 font-mono-num">
              {hud.isOnlineCampaign
                ? 'Collect Skill Scrolls & Slay Lords of Ash.'
                : 'Slay Lords of Ash to absorb permanent Soul Relics.'}
            </div>
          ) : (
            <div className="space-y-1.5 overflow-y-auto">
              {hud.activeBoons.map((bid) => {
                const b = BOONS_CATALOG.find((x) => x.id === bid);
                return (
                  <div
                    key={bid}
                    className="flex items-start gap-2 p-2 rounded bg-black/70 border border-stone-800"
                    title={b?.description}
                  >
                    <span className="text-sm leading-none mt-0.5" style={{ color: b?.accent || '#fff' }}>
                      {b?.icon || '★'}
                    </span>
                    <div className="min-w-0">
                      <div className="font-souls text-[11px] font-bold text-stone-200 truncate">
                        {b?.name || bid}
                      </div>
                      <div className="text-[10px] text-stone-400 leading-tight mt-0.5">
                        {b?.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tutorial Next / Exit */}
        {hud.isTutorial && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onNextTutorialStep?.()}
              className="w-full flex items-center justify-center gap-1 py-2 rounded bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
            >
              <span>Next Drill</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onExitTutorial?.()}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Training</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
