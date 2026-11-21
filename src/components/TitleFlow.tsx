import React, { useMemo } from 'react';
import { Swords, Trophy, Users, User, Flame, Shield, Zap, ChevronRight, ArrowLeft, Crosshair, BookOpen, Skull, Maximize2, Minimize2 } from 'lucide-react';
import {
  COLOR_OPTIONS,
  ColorOption,
  DIFFICULTY_SETTINGS,
  DifficultyKey,
  GameMode,
  HERO_CLASSES,
  HeroClassId,
  LeaderboardEntry,
} from '../game/types';
import { formatDuration } from './PixelHeart';
import { soundEngine } from '../game/soundEngine';

interface TitleMenuProps {
  difficulty: DifficultyKey;
  onSelectDifficulty: (d: DifficultyKey) => void;
  mode: GameMode;
  onSelectMode: (m: GameMode) => void;
  onContinue: () => void;
  onOpenTutorial: () => void;
  onOpenCheats: () => void;
  anyCheatActive: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  leaderboard: LeaderboardEntry[];
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  difficulty,
  onSelectDifficulty,
  mode,
  onSelectMode,
  onContinue,
  onOpenTutorial,
  onOpenCheats,
  anyCheatActive,
  isFullscreen,
  onToggleFullscreen,
  leaderboard,
}) => {
  const embers = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        top: `${(i * 53) % 100}%`,
        size: i % 4 === 0 ? 3 : 2,
        dur: `${1.8 + (i % 5) * 0.6}s`,
        del: `${(i % 7) * 0.4}s`,
        crimson: i % 3 === 0,
      })),
    []
  );

  const diffs: DifficultyKey[] = ['easy', 'medium', 'hard'];

  return (
    <div className="relative min-h-dvh w-full bg-[#040407] flex flex-col items-center p-4 sm:p-6 overflow-y-auto">
      {/* Dark atmospheric embers */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {embers.map((s) => (
          <div
            key={s.id}
            className={`absolute ${s.crimson ? 'bg-red-500/60' : 'bg-slate-400/50'}`}
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animation: `starTwinkle ${s.dur} ${s.del} infinite`,
            }}
          />
        ))}
        <div className="arcade-scanlines absolute inset-0" />
      </div>

      <div className="relative z-10 w-full max-w-4xl my-auto flex flex-col gap-5 sm:gap-6">
        {/* Title Header */}
        <header className="relative text-center space-y-2">
          <div className="flex justify-end sm:absolute sm:right-0 sm:top-0 mb-1 sm:mb-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.unlock();
                soundEngine.playUiClick();
                onToggleFullscreen();
              }}
              className={`min-h-[40px] px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                isFullscreen
                  ? 'bg-cyan-950/60 border-cyan-500/70 text-cyan-200 hover:bg-cyan-900/60'
                  : 'bg-[#09090e]/90 border-slate-700 text-slate-200 hover:border-slate-500'
              }`}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            </button>
          </div>
          <p className="font-mono-num text-xs tracking-[0.26em] text-amber-400/85 uppercase">
            Iron Depths · The Abyss · Oni Sanctum · Eclipse Zenith
          </p>
          <h1 className="font-souls text-3xl sm:text-5xl font-extrabold text-stone-100 tracking-widest drop-shadow-[0_0_24px_rgba(217,119,6,0.35)]">
            DUNGEON BOUNCER
          </h1>
          <p className="text-sm text-stone-400 max-w-xl mx-auto">
            Select your combat frame, dash through bullet hell to trigger Graze, and fell the four Lords of Ash.
          </p>
        </header>

        {/* Main 2-Column Setup Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left: Mode & Difficulty Selection */}
          <div className="lg:col-span-7 bg-[#09090e]/95 border border-slate-800 rounded-lg p-5 flex flex-col gap-5">
            {/* Mode Switch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">Deployment Mode</span>
                <span className="text-xs text-slate-500">
                  {mode === 'campaign' ? 'Enemy Waves + 4 Bosses' : '4 Bosses Back-to-Back'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 p-1 bg-black/80 border border-slate-800 rounded-md">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.unlock();
                    soundEngine.playUiClick();
                    onSelectMode('campaign');
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    mode === 'campaign'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Swords className="w-4 h-4" />
                  <span>Campaign</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.unlock();
                    soundEngine.playUiClick();
                    onSelectMode('boss_rush');
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    mode === 'boss_rush'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  <span>Boss Rush</span>
                </button>
              </div>
            </div>

            {/* Difficulty Cards */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase block">
                Threat Level
              </span>
              <div className="flex flex-col gap-2.5">
                {diffs.map((dKey) => {
                  const cfg = DIFFICULTY_SETTINGS[dKey];
                  const active = difficulty === dKey;
                  return (
                    <button
                      key={dKey}
                      type="button"
                      onClick={() => {
                        soundEngine.unlock();
                        soundEngine.playUiClick();
                        onSelectDifficulty(dKey);
                      }}
                      className={`w-full text-left p-3.5 rounded-md border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        active
                          ? 'bg-slate-900/95 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.16)]'
                          : 'bg-black/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-arcade text-xs" style={{ color: cfg.color }}>
                            {cfg.label}
                          </span>
                          <span
                            className="font-mono-num text-[11px] font-semibold"
                            style={{ color: cfg.color }}
                          >
                            {cfg.baseMaxHp} HP · {cfg.damageMultiplier}x DMG
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{cfg.summary}</p>
                      </div>
                      <div className="text-right shrink-0 font-mono-num text-[11px] text-slate-400">
                        <div>Mecha {cfg.mechaHP} · Void {cfg.bossHP}</div>
                        <div>Oni {cfg.oniHP} · Eclipse {cfg.eclipseHP}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.unlock();
                soundEngine.playUiClick();
                onContinue();
              }}
              className="mt-auto w-full py-3.5 px-5 rounded-md bg-red-600 hover:bg-red-500 text-white font-arcade text-xs tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>SELECT COMBAT FRAME</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Tutorial Button + Combat Guide + Top Scores */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Optional Tutorial Mode & Class Codex Side Button */}
            <button
              type="button"
              onClick={() => {
                soundEngine.unlock();
                soundEngine.playUiClick();
                onOpenTutorial();
              }}
              className="w-full text-left bg-[#0d0b12] hover:bg-[#14101c] border border-amber-600/60 hover:border-amber-400 rounded-lg p-4 flex items-center justify-between gap-3 transition-all cursor-pointer shadow-[0_0_24px_rgba(217,119,6,0.12)]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-400 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-souls text-sm font-bold text-amber-300 tracking-wider">
                    TUTORIAL &amp; CLASS CODEX
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    Learn passives, 100-HP damage tiers &amp; launch Training Arena
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
            </button>

            {/* Cheats / Forbidden Tome Button */}
            <button
              type="button"
              onClick={() => {
                soundEngine.unlock();
                soundEngine.playUiClick();
                onOpenCheats();
              }}
              className={`w-full text-left rounded-lg p-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer border ${
                anyCheatActive
                  ? 'bg-red-950/45 hover:bg-red-950/65 border-red-600/80 shadow-[0_0_20px_rgba(220,38,38,0.2)]'
                  : 'bg-[#0b0910] hover:bg-[#14101a] border-stone-700 hover:border-red-500/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-red-500/15 border border-red-500/40 text-red-400 shrink-0">
                  <Skull className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-souls text-xs font-bold text-stone-100 tracking-wider flex items-center gap-2">
                    <span>CHEATS &amp; FORBIDDEN TOME</span>
                    {anyCheatActive && (
                      <span className="font-mono-num text-[10px] text-red-400 font-extrabold tracking-widest">
                        [SHAME ON YOU]
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    God Mode, One-Hit Boss Kill, Zero Cooldowns &amp; more
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400 shrink-0" />
            </button>

            <div className="bg-[#09090e]/95 border border-slate-800 rounded-lg p-4 space-y-3">
              <h2 className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
                Combat Systems
              </h2>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <Swords className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Arm &amp; Execute:</span> Grab your Blade Orb to slice foes and punish exposed bosses.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Crosshair className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Hero Skill &amp; Style Rank:</span> Press your Skill key (E) for unique class abilities and chain hits/dodges up to SSS Rank.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Clean Dodge:</span> Evade boss waves cleanly without getting hit to shave Dash CD and Empower your Blade.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Relics &amp; Boons:</span> Claim field relics and draft permanent upgrades between boss realms.
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="flex-1 bg-[#09090e]/95 border border-slate-800 rounded-lg p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h2 className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
                    Hall of Champions
                  </h2>
                </div>
                <span className="text-[11px] text-slate-500">Local Best</span>
              </div>
              {leaderboard.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500 text-center py-6">
                  No completed runs yet. Enter the Iron Depths to set a record.
                </div>
              ) : (
                <div className="space-y-1.5 overflow-y-auto max-h-48">
                  {leaderboard.slice(0, 5).map((entry, idx) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-black/70 border border-slate-800/80"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono-num text-slate-500 w-4">#{idx + 1}</span>
                        <span
                          className={`font-arcade text-[10px] w-4 text-center ${
                            entry.rank === 'S'
                              ? 'text-amber-400'
                              : entry.rank === 'A'
                              ? 'text-red-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {entry.rank}
                        </span>
                        <span className="text-slate-300 capitalize">
                          {entry.difficulty} · {entry.numPlayers}P
                        </span>
                        {entry.cheated && (
                          <span className="font-mono-num text-[9px] px-1.5 py-0.5 rounded bg-red-950/80 border border-red-700/70 text-red-400 font-bold">
                            SHAME
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 font-mono-num">
                        <span className="text-slate-500">{formatDuration(entry.elapsedSeconds)}</span>
                        <span className="text-white font-semibold">{entry.score.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface HeroSetupProps {
  numPlayers: 1 | 2;
  onSelectPlayers: (n: 1 | 2) => void;
  playerColors: { 1: ColorOption; 2: ColorOption };
  onSelectColor: (playerNum: 1 | 2, col: ColorOption) => void;
  playerClasses: { 1: HeroClassId; 2: HeroClassId };
  onSelectClass: (playerNum: 1 | 2, cls: HeroClassId) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onBack: () => void;
  onStart: () => void;
}

export const HeroSetup: React.FC<HeroSetupProps> = ({
  numPlayers,
  onSelectPlayers,
  playerColors,
  onSelectColor,
  playerClasses,
  onSelectClass,
  isFullscreen,
  onToggleFullscreen,
  onBack,
  onStart,
}) => {
  return (
    <div className="relative min-h-dvh w-full bg-[#040407] flex flex-col items-center p-4 sm:p-6 overflow-y-auto">
      <div className="arcade-scanlines pointer-events-none fixed inset-0" />

      <div className="relative z-10 w-full max-w-5xl my-auto bg-[#09090e]/95 border border-slate-800 rounded-lg p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onBack();
            }}
            className="min-h-[36px] flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h2 className="font-arcade text-xs sm:text-base text-white tracking-wider text-center truncate">
            COMBAT FRAME LOADOUT
          </h2>
          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playUiClick();
              onToggleFullscreen();
            }}
            className={`min-h-[36px] px-2.5 py-1 rounded border text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              isFullscreen
                ? 'bg-cyan-950/60 border-cyan-500/70 text-cyan-200 hover:bg-cyan-900/60'
                : 'bg-black/80 border-slate-700 text-slate-200 hover:border-slate-500'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            <span className="sm:hidden">{isFullscreen ? 'Exit' : 'Full'}</span>
          </button>
        </div>

        {/* 1P / 2P Toggle */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onSelectPlayers(1);
            }}
            className={`p-3.5 rounded-md border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
              numPlayers === 1
                ? 'bg-red-950/25 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.16)]'
                : 'bg-black/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="p-2.5 rounded bg-red-500/15 text-red-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="font-arcade text-xs text-white">1 PLAYER</div>
              <div className="text-xs text-slate-400 mt-1">WASD/Arrows · Space Dash · E Skill</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onSelectPlayers(2);
            }}
            className={`p-3.5 rounded-md border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
              numPlayers === 2
                ? 'bg-cyan-950/25 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.16)]'
                : 'bg-black/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="p-2.5 rounded bg-cyan-500/15 text-cyan-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="font-arcade text-xs text-white">2 PLAYERS</div>
              <div className="text-xs text-slate-400 mt-1">Local Co-op · 2x Boss HP · Shared Arena &amp; Revives</div>
            </div>
          </button>
        </div>

        {/* Player Class + Color Selection */}
        <div className={`grid gap-5 ${numPlayers === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {([1, ...(numPlayers === 2 ? [2] : [])] as (1 | 2)[]).map((pid) => {
            const selectedColor = playerColors[pid];
            const selectedClassId = playerClasses[pid];
            const selectedClass = HERO_CLASSES.find((c) => c.id === selectedClassId) || HERO_CLASSES[0];

            return (
              <div key={pid} className="p-4 rounded-md bg-black/75 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-arcade text-xs" style={{ color: selectedColor.hex }}>
                      PLAYER {pid}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="font-mono-num text-xs text-white font-semibold">
                      {selectedClass.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono-num text-slate-400">
                    {pid === 1 ? 'WASD · Space Dash · E Skill' : 'Arrows · Enter Dash · / Skill'}
                  </span>
                </div>

                {/* 4 Hero Class Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {HERO_CLASSES.map((cls) => {
                    const active = cls.id === selectedClassId;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playUiClick();
                          onSelectClass(pid, cls.id);
                        }}
                        className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-slate-900 border-white shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'
                        }`}
                        style={{ borderColor: active ? cls.accent : undefined }}
                      >
                        <div className="font-arcade text-[10px] truncate" style={{ color: cls.accent }}>
                          {cls.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 truncate">{cls.role}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Class Passive + Skill Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-slate-950/90 border border-slate-800/90 rounded p-3">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono-num text-slate-400 uppercase">
                      Passive · {selectedClass.passiveName}
                    </div>
                    <p className="text-slate-200 leading-snug">{selectedClass.passiveDesc}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono-num uppercase flex items-center justify-between" style={{ color: selectedClass.accent }}>
                      <span>Skill · {selectedClass.skillName}</span>
                      <span>{selectedClass.skillCooldown}s CD</span>
                    </div>
                    <p className="text-slate-200 leading-snug">{selectedClass.skillDesc}</p>
                  </div>
                </div>

                {/* Color Swatches */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 shrink-0 font-mono-num">ARMOR COAT</span>
                  <div className="grid grid-cols-8 gap-1.5 flex-1">
                    {COLOR_OPTIONS.map((col) => {
                      const isSel = selectedColor.hex === col.hex;
                      return (
                        <button
                          key={col.hex}
                          type="button"
                          title={col.name}
                          onClick={() => {
                            soundEngine.playUiClick();
                            onSelectColor(pid, col);
                          }}
                          className={`h-7 rounded border-2 transition-transform cursor-pointer ${
                            isSel ? 'border-white scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: col.hex,
                            boxShadow: isSel ? `0 0 10px ${col.hex}` : undefined,
                          }}
                          aria-label={`Player ${pid} ${col.name}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.unlock();
            soundEngine.playBoonSelect();
            onStart();
          }}
          className="w-full py-4 rounded-md bg-red-600 hover:bg-red-500 text-white font-arcade text-sm tracking-wider transition-all cursor-pointer shadow-[0_0_24px_rgba(220,38,38,0.35)]"
        >
          DEPLOY INTO ARENA
        </button>
      </div>
    </div>
  );
};
