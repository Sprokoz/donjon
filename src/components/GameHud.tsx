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
} from 'lucide-react';
import {
  BOONS_CATALOG,
  ClassSkillDef,
  DifficultyKey,
  FloorMapHudSnapshot,
  FloorMapNodeHud,
  HERO_CLASSES,
  HeroClassId,
  HudSnapshot,
  PlayerHudState,
  PlayerId,
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

const FloorMinimapCard: React.FC<{ floorMap: FloorMapHudSnapshot; compact?: boolean }> = ({
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
          <span className="font-mono-num text-[9px] text-stone-400 shrink-0">5×5 GRID</span>
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
};

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
}

const PlayerSideCard: React.FC<PlayerCardProps> = ({
  label,
  p,
  color,
  combo,
  skillKeyLabel,
  isOnlineCampaign = false,
  isOnline = false,
  pingMs = null,
  compact = false,
}) => {
  const clsDef = HERO_CLASSES.find((c) => c.id === p.heroClass);
  const weaponDef =
    isOnlineCampaign && p.weapon !== 'none'
      ? WEAPONS_CATALOG.find((w) => w.id === p.weapon)
      : undefined;
  const hpPct = p.maxHp > 0 ? Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100)) : 0;

  const titleRole = isOnlineCampaign
    ? weaponDef
      ? weaponDef.shortTag
      : 'ADVENTURER'
    : clsDef?.name || 'HERO';

  const subtitleText = isOnlineCampaign
    ? weaponDef
      ? `${weaponDef.roleLabel} · ${p.unlockedSkillTier}/4 Skills`
      : 'Unarmed · Loot Weapon Drop'
    : `${clsDef?.passiveName || ''} · ${p.unlockedSkillTier}/4 Skills`;

  return (
    <div
      className={`bg-[#0b0a0e] border rounded-md ${compact ? 'p-2.5 space-y-1.5' : 'p-3 space-y-2'}`}
      style={{ borderColor: `${color}88` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
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
              ? `${weaponDef ? weaponDef.shortTag : 'SKILL'} · ${p.unlockedSkillTier}/4`
              : `S1 ${p.abilityCooldown}s · ${p.unlockedSkillTier}/4`}
          </div>
        </div>
      )}

      {/* Status Badges */}
      {(p.hasKnife || p.empowered || p.hasShield || p.overdrive > 0 || p.cloak > 0 || p.sealed) && (
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
};

const SkillHotbarCard: React.FC<{ p: PlayerHudState; isOnlineCampaign: boolean }> = ({
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

  return (
    <div className="bg-[#0b0a0e] border border-stone-800 rounded-md p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono-num text-stone-400 uppercase tracking-wider font-bold">
          4-SKILL ARSENAL
        </span>
        <span className="font-mono-num text-[10px] text-purple-300 font-bold">
          {isOnlineCampaign && p.weapon === 'none' ? 'UNARMED' : `${unlockedTier}/4 UNLOCKED`}
        </span>
      </div>

      {isOnlineCampaign && p.weapon === 'none' ? (
        <div className="p-2 rounded bg-black/60 border border-stone-800/80 font-mono-num text-[10px] text-stone-400 text-center">
          Open Chests or Shop to equip a Weapon &amp; unlock 4 class skills!
        </div>
      ) : (
        <div className="space-y-1.5">
          {skills.map((sk, idx) => {
            const slot = idx + 1;
            const unlocked = unlockedTier >= slot;
            const cd = p.skillCooldowns?.[idx] || 0;
            const maxCd = Math.max(1, p.skillMaxCooldowns?.[idx] || sk.cooldown);
            const ready = unlocked && cd <= 0;
            const pctReady = unlocked ? Math.max(0, Math.min(100, ((maxCd - cd) / maxCd) * 100)) : 0;

            return (
              <div
                key={sk.slot}
                title={sk.desc}
                className={`relative rounded border px-2 py-1.5 overflow-hidden ${
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
    </div>
  );
};

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

  const resolvePing = (pid: PlayerId): number | null => {
    if (pid === 1) return isOnline ? 0 : null;
    if (pingByPlayer && pingByPlayer[pid] !== undefined) return pingByPlayer[pid];
    return null;
  };
  const myPingMs = resolvePing(localPlayer.id);

  const clsDefLocal = HERO_CLASSES.find((c) => c.id === localPlayer.heroClass);
  const wpnDefLocal =
    hud.isOnlineCampaign && localPlayer.weapon !== 'none'
      ? WEAPONS_CATALOG.find((w) => w.id === localPlayer.weapon)
      : undefined;
  const localSkillsList = hud.isOnlineCampaign ? wpnDefLocal?.skills || [] : clsDefLocal?.skills || [];

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
    <div className="h-dvh w-full overflow-hidden bg-[#050406] p-2 lg:px-3 lg:py-2 select-none flex flex-col lg:grid lg:grid-cols-[240px_minmax(0,1fr)_240px] xl:grid-cols-[260px_minmax(0,1fr)_260px] gap-2.5 items-stretch">
      {/* ── LEFT SIDEBAR (Desktop) ───────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col gap-2.5 min-h-0 overflow-y-auto pr-0.5">
        {/* Stage & Run Metrics */}
        <div className="bg-[#0b0a0e] border border-stone-800 rounded-md p-3 space-y-2.5">
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

        {/* Local Player Card */}
        <PlayerSideCard
          label={isOnline || teammates.length > 0 ? `PLAYER ${localPlayer.id} (YOU)` : 'PLAYER 1'}
          p={localPlayer}
          color={playerColors[localPlayer.id] || localPlayer.color}
          combo={localPlayer.combo}
          skillKeyLabel="E"
          isOnlineCampaign={hud.isOnlineCampaign}
          isOnline={isOnline}
          pingMs={myPingMs}
        />

        {/* 4-Skill Arsenal Loadout */}
        {!hud.isTutorial && (
          <SkillHotbarCard p={localPlayer} isOnlineCampaign={hud.isOnlineCampaign} />
        )}

        {/* Tutorial Drill & Frame Switcher */}
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
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {HERO_CLASSES.map((cls) => {
                const active = hud.p1.heroClass === cls.id;
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
        )}
      </aside>

      {/* ── CENTER MAXIMIZED BATTLEFIELD COLUMN ──────────────────────── */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col items-center justify-center gap-1.5 relative">
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
                Grab Blade Orb · [Space] Dodge · [E/Q/R/F] 4 Skills
              </span>
            </div>
          )}
        </div>

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
              const pWpn = hud.isOnlineCampaign && pl.weapon !== 'none'
                ? WEAPONS_CATALOG.find((w) => w.id === pl.weapon)?.shortTag
                : null;
              return (
                <span key={pl.id} style={{ color: pCol }} className="font-bold whitespace-nowrap">
                  P{pl.id}: {pl.state === 'down' ? 'DOWN' : `${pl.hp}HP`}
                  {pWpn ? `(${pWpn})` : ''}
                </span>
              );
            })}
            {hud.isOnlineCampaign && (
              <span className="text-amber-300 font-bold whitespace-nowrap">{localPlayer.coins}g</span>
            )}
            {localSkillsList.length > 0 && (!hud.isOnlineCampaign || localPlayer.weapon !== 'none') && (
              <div className="hidden sm:flex items-center gap-1">
                {localSkillsList.map((sk, idx) => {
                  const unlocked = (localPlayer.unlockedSkillTier || 1) >= idx + 1;
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
              isOnlineCampaign={hud.isOnlineCampaign}
              compact={isLandscapeMobile}
              showSkipIntro={hud.isBossLevel && hud.bossState === 'comic_intro'}
              onMoveChange={onTouchMove}
              onDashChange={onTouchDash}
              onAbilityChange={onTouchAbility}
              onSkillSlotChange={onTouchSkillSlot}
              onSkipIntro={onSkipIntro}
            />
          </div>
        )}
      </main>

      {/* ── RIGHT SIDEBAR (Desktop: Minimap, Party Roster, Relics) ───── */}
      <aside className="hidden lg:flex flex-col gap-2.5 min-h-0 overflow-y-auto pl-0.5">
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

        {/* Teammates in Co-op OR Solo Threat & Weapon Info */}
        {teammates.length > 0 ? (
          <div className="flex flex-col gap-2">
            {teammates.map((tm) => (
              <PlayerSideCard
                key={tm.id}
                label={`PLAYER ${tm.id}`}
                p={tm}
                color={playerColors[tm.id] || tm.color}
                combo={tm.combo}
                skillKeyLabel={isOnline ? 'ONLINE' : '/'}
                isOnlineCampaign={hud.isOnlineCampaign}
                isOnline={isOnline}
                pingMs={resolvePing(tm.id)}
                compact={teammates.length >= 2 || Boolean(hud.floorMap)}
              />
            ))}
          </div>
        ) : (
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
