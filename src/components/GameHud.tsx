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
} from 'lucide-react';
import { BOONS_CATALOG, DifficultyKey, HERO_CLASSES, HeroClassId, HudSnapshot, PlayerHudState } from '../game/types';
import { formatDuration } from './PixelHeart';
import { MobileControls } from './MobileControls';

interface GameHudProps {
  hud: HudSnapshot;
  difficulty: DifficultyKey;
  numPlayers: 1 | 2;
  playerColors: { 1: string; 2: string };
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

interface PlayerCardProps {
  label: string;
  p: PlayerHudState;
  color: string;
  combo: number;
  skillKeyLabel: string;
}

const PlayerSideCard: React.FC<PlayerCardProps> = ({ label, p, color, combo, skillKeyLabel }) => {
  const clsDef = HERO_CLASSES.find((c) => c.id === p.heroClass);
  const hpPct = p.maxHp > 0 ? Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100)) : 0;

  return (
    <div
      className="bg-[#0b0a0e] border rounded-md p-3 space-y-2.5"
      style={{ borderColor: `${color}88` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="font-souls text-xs font-bold truncate" style={{ color }}>
            {label} · {clsDef?.name || 'HERO'}
          </div>
          <div className="font-mono-num text-[10px] text-stone-400 truncate">
            {clsDef?.passiveName || ''}
          </div>
        </div>
        {combo > 1 && (
          <span className="font-arcade text-[10px] text-amber-300 shrink-0">{combo}x</span>
        )}
      </div>

      {/* 100-HP Crimson Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between font-mono-num text-[11px]">
          <span className="text-stone-400">VITALITY</span>
          <span className="font-bold text-stone-100">
            {p.hp} / {p.maxHp}
          </span>
        </div>
        <div className="relative w-full h-2.5 bg-stone-950 border border-stone-700/90 overflow-hidden">
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
        <div className="font-mono-num text-[11px] text-rose-400 font-semibold py-1">
          DOWNED · Stand nearby to revive
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 font-mono-num text-[11px]">
          <div
            className={`px-2 py-1 rounded border ${
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
            className={`px-2 py-1 rounded border ${
              p.abilityReady
                ? 'bg-amber-950/35 border-amber-700/60 text-amber-300 font-semibold'
                : 'bg-black/60 border-stone-800 text-stone-400'
            }`}
          >
            {p.abilityReady ? `SKILL [${skillKeyLabel}]` : `CD ${p.abilityCooldown}s`}
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

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  difficulty,
  numPlayers,
  playerColors,
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
  children,
}) => {
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);

  useEffect(() => {
    const updateOrientation = () => {
      setIsLandscapeMobile(window.innerWidth > window.innerHeight && window.innerHeight < 560);
    };
    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    return () => window.removeEventListener('resize', updateOrientation);
  }, []);

  const bossPct = hud.bossMaxHealth > 0 ? Math.max(0, (hud.bossHealth / hud.bossMaxHealth) * 100) : 0;
  const showBossBar = hud.isBossLevel && hud.bossHealth > 0 && hud.bossState !== 'comic_intro';
  const bossStatusText =
    hud.bossState === 'weakened'
      ? 'WEAKENED — 2X CRITICAL DAMAGE!'
      : `PHASE ${hud.bossPhase === 2 ? 'II' : 'I'} · ATTACK ANYTIME · DODGE CLEANLY FOR 2X OPENING`;

  const renderMobileQuickButtons = () => (
    <div className="flex lg:hidden items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={onToggleFullscreen}
        className={`p-1.5 rounded border cursor-pointer ${
          isFullscreen
            ? 'bg-cyan-950/60 border-cyan-500/70 text-cyan-300'
            : 'bg-stone-900 border-stone-700 text-stone-300'
        }`}
        aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
      </button>
      <button
        type="button"
        onClick={onToggleTouchControls}
        className={`p-1.5 rounded border cursor-pointer ${
          showTouchControls
            ? 'bg-amber-950/60 border-amber-500/70 text-amber-300'
            : 'bg-stone-900 border-stone-700 text-stone-400'
        }`}
        aria-label="Toggle Touch Controls"
        title="Toggle On-Screen Touch Buttons"
      >
        <Gamepad2 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={onToggleMute}
        className="p-1.5 rounded bg-stone-900 border border-stone-700 text-stone-300 cursor-pointer"
        aria-label="Toggle Mute"
      >
        {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
      </button>
      <button
        type="button"
        onClick={onPause}
        className="px-2 py-1 rounded bg-stone-900 border border-stone-700 text-[10px] font-semibold text-stone-200 cursor-pointer"
      >
        Pause
      </button>
    </div>
  );

  return (
    <div className="h-dvh w-full overflow-hidden bg-[#050406] p-2 lg:px-3 lg:py-2 select-none flex flex-col lg:grid lg:grid-cols-[232px_minmax(0,1fr)_232px] xl:grid-cols-[252px_minmax(0,1fr)_252px] gap-2.5 items-stretch">
      {/* ── LEFT SIDEBAR (Desktop) ───────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col gap-2.5 min-h-0 overflow-y-auto pr-0.5">
        {/* Stage & Run Metrics */}
        <div className="bg-[#0b0a0e] border border-stone-800 rounded-md p-3 space-y-2.5">
          <div>
            <div className="font-souls text-xs font-bold text-amber-400 tracking-wider leading-snug">
              {hud.stageLabel}
            </div>
            <div className="font-mono-num text-[11px] text-stone-400 mt-0.5">
              {hud.isBossLevel ? hud.waveText : `${hud.waveText} · ${hud.enemiesRemaining} Remaining`}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-stone-800/80 font-mono-num text-xs">
            <div className="bg-black/60 border border-stone-800/80 rounded p-2">
              <div className="text-[9px] text-stone-500">SOULS</div>
              <div className="text-amber-300 font-bold text-sm">{hud.score.toLocaleString()}</div>
            </div>
            <div className="bg-black/60 border border-stone-800/80 rounded p-2">
              <div className="text-[9px] text-stone-500">STYLE RANK</div>
              <div className="font-arcade text-sm mt-0.5" style={{ color: STYLE_COLORS[hud.styleRank] }}>
                {hud.styleRank}
              </div>
            </div>
            <div className="bg-black/60 border border-stone-800/80 rounded p-2">
              <div className="text-[9px] text-stone-500">DODGES</div>
              <div className="text-cyan-300 font-semibold">{hud.grazes}</div>
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

        {/* P1 Card */}
        <PlayerSideCard
          label="PLAYER 1"
          p={hud.p1}
          color={playerColors[1]}
          combo={hud.comboP1}
          skillKeyLabel="E"
        />

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
      <main className="flex-1 min-w-0 min-h-0 flex flex-col items-center justify-center gap-1.5">
        {/* Compact Top Boss HP + Stage Strip */}
        <div className="w-full max-w-[1160px] min-h-[44px] py-1 shrink-0 bg-[#0b0a0e] border border-stone-800 rounded px-2.5 sm:px-3 flex flex-col justify-center">
          {showBossBar ? (
            <>
              <div className="flex items-center justify-between gap-2 mb-0.5 min-w-0">
                <span className="font-souls text-[11px] sm:text-xs font-bold text-stone-100 tracking-wider truncate shrink-0">
                  {hud.bossName}
                </span>
                <div className="flex items-center gap-2 min-w-0 truncate">
                  {hud.bossAttackLabel && (
                    <span className="font-mono-num text-[10px] font-bold tracking-wider text-amber-300 animate-pulse shrink-0">
                      ▲ {hud.bossAttackLabel} ▲
                    </span>
                  )}
                  {hud.bossVoiceLine && (
                    <span className="font-souls italic text-[11px] text-amber-200/85 truncate hidden sm:inline">
                      “{hud.bossVoiceLine}”
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono-num text-[11px] text-stone-300">
                    {hud.bossHealth} / {hud.bossMaxHealth}
                  </span>
                  {renderMobileQuickButtons()}
                </div>
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
            <div className="flex items-center justify-between gap-2 text-xs font-mono-num text-stone-300">
              <span className="font-souls text-[11px] text-amber-400/90 tracking-wider truncate">
                {hud.isBossLevel ? 'TRAVERSING THE FOG...' : hud.stageLabel}
              </span>
              <span className="text-[11px] text-stone-400 hidden sm:inline truncate">
                Grab Blade Orb to Strike · [Space] Clean Dodge · [E] Skill
              </span>
              {renderMobileQuickButtons()}
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
                  ? 'min(100%, calc((100dvh - 256px) * 4 / 3))'
                  : 'min(100%, calc((100dvh - 76px) * 4 / 3))',
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

            {/* Clear Co-op Teamwork Objective Strip during Eclipse Co-op Patterns */}
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

        {/* Narrow-screen Player Vital & Score Strip (< lg) */}
        <div className="flex lg:hidden w-full items-center justify-between gap-2 bg-[#0b0a0e] border border-stone-800 rounded px-3 py-1.5 text-[11px] font-mono-num shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span style={{ color: playerColors[1] }} className="font-bold whitespace-nowrap">
              P1: {hud.p1.hp}/{hud.p1.maxHp}
            </span>
            {hud.p1.hasKnife && <span className="text-cyan-300 font-bold text-[10px]">ARMED</span>}
            {hud.p1.empowered && <span className="text-amber-300 font-bold text-[10px]">EMP</span>}
            {numPlayers === 2 && (
              <span style={{ color: playerColors[2] }} className="font-bold whitespace-nowrap">
                P2: {hud.p2.hp}/{hud.p2.maxHp}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-arcade text-[10px]" style={{ color: STYLE_COLORS[hud.styleRank] }}>
              {hud.styleRank}
            </span>
            <span className="text-amber-300 font-bold">{hud.score.toLocaleString()}</span>
          </div>
        </div>

        {/* Mobile Touch Controls Deck (Portrait docked below arena OR Landscape corner overlay) */}
        {showTouchControls && (
          <div
            className={
              isLandscapeMobile
                ? 'fixed bottom-2 inset-x-2 z-20 pointer-events-none'
                : 'w-full shrink-0 pt-1 pb-2'
            }
          >
            <MobileControls
              p1={hud.p1}
              playerColor={playerColors[1]}
              compact={isLandscapeMobile}
              showSkipIntro={hud.isBossLevel && hud.bossState === 'comic_intro'}
              onMoveChange={onTouchMove}
              onDashChange={onTouchDash}
              onAbilityChange={onTouchAbility}
              onSkipIntro={onSkipIntro}
            />
          </div>
        )}
      </main>

      {/* ── RIGHT SIDEBAR (Desktop) ──────────────────────────────────── */}
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

        {/* P2 Card in 2P Co-op OR Combat Field Guide in 1P */}
        {numPlayers === 2 ? (
          <PlayerSideCard
            label="PLAYER 2"
            p={hud.p2}
            color={playerColors[2]}
            combo={hud.comboP2}
            skillKeyLabel="/"
          />
        ) : (
          <div className="bg-[#0b0a0e] border border-stone-800 rounded-md p-3 space-y-2 text-[11px] font-mono-num">
            <div className="text-[10px] text-stone-500 uppercase tracking-wider">Threat &amp; Sustenance</div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Difficulty</span>
              <span className="text-amber-300 font-bold uppercase">{difficulty}</span>
            </div>
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
        <div className="flex-1 bg-[#0b0a0e] border border-stone-800 rounded-md p-3 flex flex-col gap-2 min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-num text-stone-500 uppercase tracking-wider">Soul Relics</span>
            {numPlayers === 2 && difficulty === 'hard' && (
              <span className="text-[10px] font-mono-num text-emerald-400">Kits: {hud.medkitInventoryCount}</span>
            )}
          </div>
          {hud.activeBoons.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-[11px] text-stone-500 font-mono-num">
              Slay Lords of Ash to absorb permanent Soul Relics.
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
