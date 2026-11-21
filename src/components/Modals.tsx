import React, { useEffect, useState } from 'react';
import { RotateCcw, Home, Play, Sparkles, Trophy, Volume2, Skull, Flame, AlertTriangle, Shield, Swords, Zap, Clock, HeartPulse, X, Maximize2, Minimize2, Gamepad2 } from 'lucide-react';
import { BoonDef, CheatsConfig, ControlsConfig, DEFAULT_CHEATS, PlayerControls, RunSummary, StageKey } from '../game/types';
import { formatDuration } from './PixelHeart';
import { soundEngine } from '../game/soundEngine';

function formatKeyName(key: string): string {
  if (key === ' ') return 'SPACE';
  if (key === 'arrowup') return '↑';
  if (key === 'arrowdown') return '↓';
  if (key === 'arrowleft') return '←';
  if (key === 'arrowright') return '→';
  return key.toUpperCase();
}

interface ControlsModalProps {
  controls: ControlsConfig;
  numPlayers: 1 | 2;
  onChange: (next: ControlsConfig) => void;
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({ controls, numPlayers, onChange, onClose }) => {
  const [listening, setListening] = useState<{ player: 1 | 2; action: keyof PlayerControls } | null>(null);

  useEffect(() => {
    if (!listening) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const key = e.key.toLowerCase();
      const next: ControlsConfig = {
        p1: { ...controls.p1 },
        p2: { ...controls.p2 },
      };
      if (listening.player === 1) next.p1[listening.action] = key;
      else next.p2[listening.action] = key;
      onChange(next);
      setListening(null);
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [listening, controls, onChange]);

  const actions: { key: keyof PlayerControls; label: string }[] = [
    { key: 'up', label: 'Move Up' },
    { key: 'down', label: 'Move Down' },
    { key: 'left', label: 'Move Left' },
    { key: 'right', label: 'Move Right' },
    { key: 'dash', label: 'Dash' },
    { key: 'ability', label: 'Hero Skill' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#09090e] border border-slate-700 rounded-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-arcade text-sm text-white">CUSTOMIZE CONTROLS</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className={`grid gap-5 ${numPlayers === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {([1, ...(numPlayers === 2 ? [2] : [])] as (1 | 2)[]).map((pid) => {
            const pCtrl = pid === 1 ? controls.p1 : controls.p2;
            return (
              <div key={pid} className="space-y-2.5">
                <h3 className="font-arcade text-[10px] text-red-400">PLAYER {pid}</h3>
                {actions.map((act) => {
                  const isL = listening?.player === pid && listening?.action === act.key;
                  return (
                    <div key={act.key} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{act.label}</span>
                      <button
                        type="button"
                        onClick={() => setListening({ player: pid, action: act.key })}
                        className={`min-w-[74px] py-1.5 px-2.5 rounded border font-mono-num text-xs cursor-pointer ${
                          isL
                            ? 'bg-amber-600 border-amber-400 text-white animate-pulse'
                            : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-red-400'
                        }`}
                      >
                        {isL ? 'KEY...' : formatKeyName(pCtrl[act.key])}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
        >
          Save &amp; Return
        </button>
      </div>
    </div>
  );
};

interface PauseModalProps {
  musicVol: number;
  sfxVol: number;
  isFullscreen: boolean;
  fullscreenNote?: string | null;
  showTouchControls: boolean;
  onMusicChange: (v: number) => void;
  onSfxChange: (v: number) => void;
  onToggleFullscreen: () => void;
  onToggleTouchControls: () => void;
  onResume: () => void;
  onControls: () => void;
  onCheats: () => void;
  cheatsActive?: boolean;
  onRestart: () => void;
  onMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  musicVol,
  sfxVol,
  isFullscreen,
  fullscreenNote,
  showTouchControls,
  onMusicChange,
  onSfxChange,
  onToggleFullscreen,
  onToggleTouchControls,
  onResume,
  onControls,
  onCheats,
  cheatsActive,
  onRestart,
  onMenu,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#09090e] border border-slate-700 rounded-lg p-6 space-y-5 max-h-[92dvh] overflow-y-auto">
        <h2 className="font-arcade text-base text-center text-white">PAUSED · SETTINGS</h2>

        <div className="space-y-3 bg-black/70 border border-slate-800 rounded-md p-3.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Volume2 className="w-3.5 h-3.5" /> Music
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={musicVol}
              onChange={(e) => onMusicChange(parseFloat(e.target.value))}
              className="w-36 accent-red-500"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Volume2 className="w-3.5 h-3.5" /> SFX
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={sfxVol}
              onChange={(e) => onSfxChange(parseFloat(e.target.value))}
              className="w-36 accent-cyan-400"
            />
          </div>

          <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onToggleFullscreen}
              className={`min-h-[42px] px-2.5 py-2 rounded border font-semibold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                isFullscreen
                  ? 'bg-cyan-950/50 border-cyan-500/70 text-cyan-200 hover:bg-cyan-900/50'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 shrink-0" /> : <Maximize2 className="w-3.5 h-3.5 shrink-0" />}
              <span>{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
            </button>
            <button
              type="button"
              onClick={onToggleTouchControls}
              className={`min-h-[42px] px-2.5 py-2 rounded border font-semibold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                showTouchControls
                  ? 'bg-amber-950/50 border-amber-500/70 text-amber-200 hover:bg-amber-900/50'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
              <span>{showTouchControls ? 'Touch: ON' : 'Touch: OFF'}</span>
            </button>
          </div>
          {fullscreenNote && (
            <p className="text-[11px] text-amber-300/90 text-center leading-snug">{fullscreenNote}</p>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 rounded-md bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4" /> Resume
          </button>
          <button
            type="button"
            onClick={onControls}
            className="w-full py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Customize Controls
          </button>
          <button
            type="button"
            onClick={onCheats}
            className={`w-full py-2.5 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              cheatsActive
                ? 'bg-red-950/60 hover:bg-red-900/60 border-red-600/80 text-amber-300'
                : 'bg-slate-900 hover:bg-slate-800 border-amber-700/60 text-amber-300'
            }`}
          >
            <Skull className="w-3.5 h-3.5 text-red-400" />
            <span>{cheatsActive ? 'Cheats (SHAME ON YOU)' : 'Cheats & Forbidden Tome'}</span>
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restart Run
          </button>
          <button
            type="button"
            onClick={onMenu}
            className="w-full py-2.5 rounded-md bg-black hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" /> Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

interface CheatsModalProps {
  cheats: CheatsConfig;
  cheatsUsed: boolean;
  inRun: boolean;
  onChange: (next: CheatsConfig) => void;
  onHealParty?: () => void;
  onClearExpose?: () => void;
  onWarpStage?: (stage: StageKey) => void;
  onClose: () => void;
}

const CHEAT_OPTIONS: {
  key: keyof CheatsConfig;
  label: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
}[] = [
  {
    key: 'godMode',
    label: 'Undying Vessel (God Mode)',
    desc: 'Immune to all enemy blades, orbs, beams & hazards.',
    icon: <Shield className="w-4 h-4 text-sky-400" />,
    accent: '#38bdf8',
  },
  {
    key: 'oneHitKill',
    label: 'Mortal Blade (One-Hit Boss Kill)',
    desc: 'Strike bosses in any phase and fell them in a single blow.',
    icon: <Swords className="w-4 h-4 text-red-400" />,
    accent: '#f87171',
  },
  {
    key: 'zeroCooldowns',
    label: 'Endless Stamina (Zero Cooldowns)',
    desc: 'Instant Dash & Hero Skill recharge with zero wait.',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    accent: '#fbbf24',
  },
  {
    key: 'alwaysArmed',
    label: 'Bound Blade (Always Armed)',
    desc: 'Your Blade never disarms after slicing foes or bosses.',
    icon: <Flame className="w-4 h-4 text-orange-400" />,
    accent: '#fb923c',
  },
  {
    key: 'permanentOverdrive',
    label: 'Abyssal Overdrive',
    desc: 'Permanent +35% speed surge & golden afterimage aura.',
    icon: <Sparkles className="w-4 h-4 text-yellow-300" />,
    accent: '#fde047',
  },
  {
    key: 'chronoSlowBullets',
    label: 'Chrono-Stasis (Slow Bullets)',
    desc: 'Slows all hostile projectiles to 25% velocity.',
    icon: <Clock className="w-4 h-4 text-cyan-300" />,
    accent: '#22d3ee',
  },
  {
    key: 'vitalityRegen',
    label: 'Crimson Regeneration',
    desc: 'Continuously restores +25 HP per second during combat.',
    icon: <HeartPulse className="w-4 h-4 text-emerald-400" />,
    accent: '#34d399',
  },
  {
    key: 'allRelics',
    label: 'All Soul Relics Unlocked',
    desc: 'Bestows all 6 permanent Boss Soul Relics & Aegis Shield.',
    icon: <Trophy className="w-4 h-4 text-purple-400" />,
    accent: '#c084fc',
  },
];

export const CheatsModal: React.FC<CheatsModalProps> = ({
  cheats,
  cheatsUsed,
  inRun,
  onChange,
  onHealParty,
  onClearExpose,
  onWarpStage,
  onClose,
}) => {
  const anyOn = Object.values(cheats).some(Boolean);
  const showShame = anyOn || cheatsUsed;

  const toggle = (key: keyof CheatsConfig) => {
    soundEngine.playUiClick();
    onChange({ ...cheats, [key]: !cheats[key] });
  };

  const setAll = (val: boolean) => {
    soundEngine.playUiClick();
    const next = { ...DEFAULT_CHEATS };
    (Object.keys(next) as (keyof CheatsConfig)[]).forEach((k) => {
      next[k] = val;
    });
    onChange(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/88 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[92dvh] bg-[#09080c] border border-stone-700 rounded-lg p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Skull className="w-5 h-5 text-red-500" />
            <div>
              <h2 className="font-souls text-lg font-bold text-stone-100 tracking-wider">
                FORBIDDEN TOME · CHEATS
              </h2>
              <p className="text-[11px] text-stone-400">
                Bend the laws of the Iron Depths at the cost of your honor.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-white cursor-pointer"
            aria-label="Close Cheats"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prominent SHAME ON YOU Banner whenever cheats are activated */}
        {showShame && (
          <div className="rounded-md border-2 border-red-600/80 bg-gradient-to-r from-red-950/80 via-[#1a080c] to-amber-950/60 px-4 py-3 text-center space-y-1 shadow-[0_0_24px_rgba(220,38,38,0.25)]">
            <div className="flex items-center justify-center gap-2 text-red-400 font-souls text-xl sm:text-2xl font-extrabold tracking-[0.2em]">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>SHAME ON YOU</span>
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            </div>
            <p className="text-xs text-amber-200/85 font-mono-num">
              The First Flame scorns thy dishonor... yet permits thee to cheat anyway.
            </p>
          </div>
        )}

        {/* Quick Toggle All */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-mono-num text-stone-400">
            Active Mods: <strong className="text-amber-300">{Object.values(cheats).filter(Boolean).length}/8</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAll(true)}
              className="px-2.5 py-1 rounded bg-red-950/70 hover:bg-red-900/70 border border-red-700/70 text-red-200 font-semibold cursor-pointer"
            >
              Unleash All
            </button>
            <button
              type="button"
              onClick={() => setAll(false)}
              className="px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-semibold cursor-pointer"
            >
              Disable All
            </button>
          </div>
        </div>

        {/* 8 Toggleable Cheats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {CHEAT_OPTIONS.map((opt) => {
            const on = cheats[opt.key];
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggle(opt.key)}
                className={`text-left p-3 rounded-md border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  on
                    ? 'bg-stone-900/95 border-amber-500/80 shadow-[0_0_16px_rgba(245,158,11,0.14)]'
                    : 'bg-black/70 border-stone-800 hover:border-stone-600'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0">{opt.icon}</div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-stone-100">{opt.label}</div>
                    <div className="text-[11px] text-stone-400 leading-snug mt-0.5">{opt.desc}</div>
                  </div>
                </div>
                <span
                  className={`font-mono-num text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                    on ? 'bg-amber-500 text-black' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {on ? 'ON' : 'OFF'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Instant In-Run Forbidden Actions */}
        {inRun && (
          <div className="border-t border-stone-800 pt-3.5 space-y-2.5">
            <div className="font-mono-num text-[10px] tracking-wider text-stone-400 uppercase">
              Instant Arena Commands
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  onHealParty?.();
                }}
                className="py-2 px-3 rounded bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-700/70 text-emerald-200 text-xs font-semibold cursor-pointer"
              >
                Full Heal, Shield &amp; +10 Estus Kits
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  onClearExpose?.();
                }}
                className="py-2 px-3 rounded bg-amber-950/60 hover:bg-amber-900/70 border border-amber-700/70 text-amber-200 text-xs font-semibold cursor-pointer"
              >
                Wipe Bullets / Expose Boss Now
              </button>
            </div>
            {onWarpStage && (
              <div className="space-y-1.5">
                <div className="font-mono-num text-[10px] text-stone-500 uppercase">Warp to Boss Fog Gate</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(
                    [
                      { stage: 'mechaBoss', label: 'Iron Destroyer' },
                      { stage: 'voidBoss', label: 'Void Phantom' },
                      { stage: 'oniBoss', label: 'Yamata-Oni' },
                      { stage: 'eclipseBoss', label: 'Solaris & Lunaris' },
                    ] as { stage: StageKey; label: string }[]
                  ).map((w) => (
                    <button
                      key={w.stage}
                      type="button"
                      onClick={() => {
                        soundEngine.playUiClick();
                        onWarpStage(w.stage);
                      }}
                      className="py-1.5 px-2 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-500 text-stone-200 text-[11px] font-semibold cursor-pointer truncate"
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-md bg-red-700 hover:bg-red-600 text-white text-xs font-semibold cursor-pointer"
        >
          {showShame ? 'Accept Shame & Continue' : 'Close Forbidden Tome'}
        </button>
      </div>
    </div>
  );
};

interface BoonDraftModalProps {
  clearedStage: StageKey;
  choices: BoonDef[];
  onPick: (boon: BoonDef) => void;
}

export const BoonDraftModal: React.FC<BoonDraftModalProps> = ({ clearedStage, choices, onPick }) => {
  const title =
    clearedStage === 'mechaBoss'
      ? 'HEIR OF IRON DESTROYED'
      : clearedStage === 'voidBoss'
      ? 'SOVEREIGN OF THE ABYSS FELLED'
      : 'DEMON SHOGUN FELLED';

  return (
    <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono-num text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>{title}</span>
          </div>
          <h2 className="font-souls text-2xl sm:text-3xl font-bold text-stone-100">CHOOSE A BOSS SOUL RELIC</h2>
          <p className="text-xs text-stone-400">
            Kindle your frame before traversing the next fog gate (+30 HP restored).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {choices.map((boon) => (
            <button
              key={boon.id}
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                onPick(boon);
              }}
              className="text-left p-5 rounded bg-[#0b0a0e] border border-stone-700 hover:border-amber-400 transition-all cursor-pointer flex flex-col gap-3 hover:-translate-y-1"
              style={{ boxShadow: `0 0 24px ${boon.accent}22` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl" style={{ color: boon.accent }}>
                  {boon.icon}
                </span>
                <span className="font-mono-num text-[10px] tracking-wider text-stone-400">
                  {boon.subtitle}
                </span>
              </div>
              <h3 className="font-souls text-sm font-bold text-white leading-relaxed">{boon.name}</h3>
              <p className="text-xs text-stone-300 leading-relaxed flex-1">{boon.description}</p>
              <div className="pt-2 border-t border-stone-800 text-xs font-semibold" style={{ color: boon.accent }}>
                Absorb Relic →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface StageTransitionModalProps {
  nextStage: StageKey;
}

export const StageTransitionModal: React.FC<StageTransitionModalProps> = ({ nextStage }) => {
  const isVoid = nextStage === 'voidDungeon' || nextStage === 'voidBoss';
  const isEclipse = nextStage === 'eclipseBoss';
  const title = isEclipse
    ? 'THE ECLIPSE SANCTUM'
    : isVoid
    ? 'THE ABYSSAL VOID'
    : 'THE ONI SANCTUM';
  const sub = isEclipse
    ? 'Solaris & Lunaris, the Twin Sovereigns, descend at the zenith of ash.'
    : isVoid
    ? 'You traverse the fog. Void Phantom stirs in the dark.'
    : 'War drums echo beyond the ash. Yamata-Oni awaits.';

  return (
    <div className="fixed inset-0 z-40 bg-black/95 flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div
        className={`w-full max-w-xl py-4 border-y bg-gradient-to-r from-transparent via-black to-transparent font-souls text-xl sm:text-3xl font-bold ${
          isEclipse
            ? 'text-amber-300 border-sky-500/60'
            : isVoid
            ? 'text-purple-300 border-purple-700/60'
            : 'text-amber-400 border-amber-700/60'
        }`}
      >
        {title}
      </div>
      <p className="text-sm text-stone-400 max-w-md">{sub}</p>
      <div className="font-mono-num text-xs text-stone-500 animate-pulse pt-1">TRAVERSING THE FOG...</div>
    </div>
  );
};

interface EndScreenModalProps {
  summary: RunSummary;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const EndScreenModal: React.FC<EndScreenModalProps> = ({ summary, onPlayAgain, onMainMenu }) => {
  return (
    <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0b0a0e] border border-stone-700 rounded p-6 space-y-5 text-center">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Trophy className={`w-6 h-6 ${summary.victory ? 'text-amber-400' : 'text-red-600'}`} />
          </div>
          <div
            className={`py-2 border-y bg-gradient-to-r from-transparent to-transparent ${
              summary.victory
                ? 'via-amber-950/50 border-amber-600/60'
                : 'via-red-950/70 border-red-800/70'
            }`}
          >
            <h2
              className={`font-souls text-3xl font-extrabold tracking-widest ${
                summary.victory ? 'text-amber-300' : 'text-red-500'
              }`}
            >
              {summary.victory ? 'VICTORY ACHIEVED' : 'YOU DIED'}
            </h2>
          </div>
          <p className="text-xs text-stone-400">
            {summary.victory
              ? 'All four lords of ash—including the Twin Sovereigns—have fallen before your blade.'
              : 'Your ember fades into the dark. Rise again at the bonfire.'}
          </p>
          {summary.cheated && (
            <div className="mt-2 py-1.5 px-3 rounded border border-red-600/80 bg-red-950/60 text-red-300 font-souls text-xs font-bold tracking-widest">
              SHAME ON YOU · FORBIDDEN ARTS INVOKED
            </div>
          )}
        </div>

        {/* Rank & Score */}
        <div className="bg-black/80 border border-stone-800 rounded p-4 flex items-center justify-around">
          <div>
            <div className="text-[11px] text-stone-400 uppercase">Rank</div>
            <div
              className={`font-souls text-3xl font-bold mt-1 ${
                summary.rank === 'S'
                  ? 'text-amber-400'
                  : summary.rank === 'A'
                  ? 'text-red-400'
                  : 'text-stone-200'
              }`}
            >
              {summary.rank}
            </div>
          </div>
          <div className="h-12 w-px bg-stone-800" />
          <div>
            <div className="text-[11px] text-stone-400 uppercase">Souls Harvested</div>
            <div className="font-mono-num text-2xl font-bold text-white mt-1">
              {summary.score.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-xs font-mono-num">
          <div className="bg-black/70 border border-stone-800 rounded p-2.5">
            <div className="text-stone-500 text-[10px]">TIME</div>
            <div className="text-white font-semibold mt-0.5">{formatDuration(summary.elapsedSeconds)}</div>
          </div>
          <div className="bg-black/70 border border-stone-800 rounded p-2.5">
            <div className="text-stone-500 text-[10px]">MAX COMBO</div>
            <div className="text-amber-300 font-semibold mt-0.5">{summary.maxCombo}x</div>
          </div>
          <div className="bg-black/70 border border-stone-800 rounded p-2.5">
            <div className="text-stone-500 text-[10px]">CLEAN DODGES</div>
            <div className="text-cyan-300 font-semibold mt-0.5">{summary.grazes}</div>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 py-3 rounded bg-red-700 hover:bg-red-600 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Rise Again
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="flex-1 py-3 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" /> Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
