import React, { useMemo, useState } from 'react';
import { Swords, Trophy, Users, User, Flame, Shield, Zap, ChevronRight, ArrowLeft, Crosshair, BookOpen, Skull, Maximize2, Minimize2, Volume2, VolumeX, Globe, Copy, Check, Link2, RefreshCw, Wifi, CheckCircle2, Clock, Compass, PackageOpen } from 'lucide-react';
import {
  COLOR_OPTIONS,
  ColorOption,
  DIFFICULTY_SETTINGS,
  DifficultyKey,
  GameMode,
  HERO_CLASSES,
  HeroClassId,
  LeaderboardEntry,
  LobbyPlayerInfo,
  PlayerId,
  WEAPONS_CATALOG,
} from '../game/types';
import { formatDuration } from './PixelHeart';
import { soundEngine } from '../game/soundEngine';
import {
  CoopMode,
  getInviteLink,
  OnlineConnectionStatus,
  sanitizeRoomCode,
} from '../game/onlineSync';

interface TitleMenuProps {
  difficulty: DifficultyKey;
  onSelectDifficulty: (d: DifficultyKey) => void;
  mode: GameMode;
  onSelectMode: (m: GameMode) => void;
  onContinue: () => void;
  onOpenTutorial: () => void;
  onOpenCheats: () => void;
  onBackToSplash?: () => void;
  anyCheatActive: boolean;
  isMuted: boolean;
  menuAudioBlocked: boolean;
  onToggleMute: () => void;
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
  onBackToSplash,
  anyCheatActive,
  isMuted,
  menuAudioBlocked,
  onToggleMute,
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
    <div className="relative h-dvh w-full bg-[#040407] flex flex-col items-center p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
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

      <div className="relative z-10 w-full max-w-5xl my-auto flex flex-col gap-5 sm:gap-6">
        {/* Arranged 3-Zone Top Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            {onBackToSplash && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.unlock();
                  soundEngine.playUiClick();
                  onBackToSplash();
                }}
                className="min-h-[40px] px-3 py-1.5 rounded-md bg-[#09090e]/90 border border-slate-800 hover:border-slate-600 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                title="Return to Title Screen"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Title</span>
              </button>
            )}
            <div className="min-w-0">
              <h1 className="font-souls text-xl sm:text-3xl font-extrabold text-stone-100 tracking-widest truncate">
                DUNGEON BOUNCER
              </h1>
              <p className="font-mono-num text-[11px] text-amber-400/85 truncate">
                Preparation Sanctum · Choose Mode &amp; Threat Level
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (menuAudioBlocked && !isMuted) {
                  soundEngine.unlock();
                  soundEngine.playMenuMusic();
                } else {
                  soundEngine.unlock();
                  onToggleMute();
                }
                soundEngine.playUiClick();
              }}
              className={`min-h-[40px] px-2.5 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                isMuted
                  ? 'bg-red-950/40 border-red-700/70 text-red-300 hover:bg-red-900/50'
                  : menuAudioBlocked
                  ? 'bg-amber-950/60 border-amber-500/80 text-amber-200 animate-pulse hover:bg-amber-900/60'
                  : 'bg-[#09090e]/90 border-slate-700 text-amber-300 hover:border-slate-500'
              }`}
              aria-label={
                isMuted ? 'Unmute Menu Music' : menuAudioBlocked ? 'Tap to Play Menu Music' : 'Mute Menu Music'
              }
              title={isMuted ? 'Unmute Music' : menuAudioBlocked ? 'Tap to Play Music' : 'Mute Music'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {!isMuted && menuAudioBlocked && <span>Play Music</span>}
            </button>
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
                  {mode === 'campaign'
                    ? 'Dungeon + Stairs Down + 4 Bosses'
                    : mode === 'teamwork_practice'
                    ? '1P AI Dummies or 1–5P Boss Drills'
                    : '4 Bosses Back-to-Back'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 p-1 bg-black/80 border border-slate-800 rounded-md">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.unlock();
                    soundEngine.playUiClick();
                    onSelectMode('campaign');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    mode === 'campaign'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Swords className="w-4 h-4 shrink-0" />
                  <span>Campaign</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.unlock();
                    soundEngine.playUiClick();
                    onSelectMode('boss_rush');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    mode === 'boss_rush'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Flame className="w-4 h-4 shrink-0" />
                  <span>Boss Rush</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.unlock();
                    soundEngine.playUiClick();
                    onSelectMode('teamwork_practice');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    mode === 'teamwork_practice'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>Practice</span>
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

        {/* Version Footer */}
        <footer className="flex items-center justify-between gap-4 pt-2 border-t border-slate-900/90 font-mono-num text-[11px] text-slate-500">
          <span>DUNGEON BOUNCER · BY SPROKOZ</span>
          <span className="text-amber-400/80 font-semibold tracking-wider uppercase">
            beta test 0.0.8
          </span>
        </footer>
      </div>
    </div>
  );
};

function pingBadgeClass(ms: number | null): string {
  if (ms === null) return 'text-slate-400 border-slate-700 bg-slate-900/70';
  if (ms <= 70) return 'text-emerald-300 border-emerald-600/60 bg-emerald-950/50';
  if (ms <= 140) return 'text-amber-300 border-amber-600/60 bg-amber-950/50';
  return 'text-rose-300 border-rose-600/60 bg-rose-950/50';
}

function formatPingLabel(ms: number | null, isHostSlot = false): string {
  if (isHostSlot && (ms === null || ms <= 1)) return 'HOST · 0 ms';
  if (ms === null) return '-- ms';
  return `${ms} ms`;
}

interface HeroSetupProps {
  coopMode: CoopMode;
  onSelectCoopMode: (m: CoopMode) => void;
  onlineRole: 'host' | 'guest';
  onSelectOnlineRole: (r: 'host' | 'guest') => void;
  roomCode: string;
  joinInput: string;
  onChangeJoinInput: (val: string) => void;
  onlineStatus: OnlineConnectionStatus;
  onlineError: string | null;
  lobbyRoster: LobbyPlayerInfo[];
  localPlayerId: PlayerId;
  localReady: boolean;
  onToggleReady: () => void;
  pingByPlayer: Record<number, number | null>;
  onHostCreateRoom: () => void;
  onGuestJoinRoom: () => void;
  onDisconnectOnline: () => void;
  difficulty: DifficultyKey;
  mode: GameMode;
  playerColors: Record<number, ColorOption>;
  onSelectColor: (playerNum: PlayerId, col: ColorOption) => void;
  playerClasses: Record<number, HeroClassId>;
  onSelectClass: (playerNum: PlayerId, cls: HeroClassId) => void;
  localPlayerName: string;
  onChangeLocalPlayerName: (val: string) => void;
  p2LocalName?: string;
  onChangeP2LocalName?: (val: string) => void;
  isMuted: boolean;
  menuAudioBlocked: boolean;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onBack: () => void;
  onStart: () => void;
}

export const HeroSetup: React.FC<HeroSetupProps> = ({
  coopMode,
  onSelectCoopMode,
  onlineRole,
  onSelectOnlineRole,
  roomCode,
  joinInput,
  onChangeJoinInput,
  onlineStatus,
  onlineError,
  lobbyRoster,
  localPlayerId,
  localReady,
  onToggleReady,
  pingByPlayer,
  onHostCreateRoom,
  onGuestJoinRoom,
  onDisconnectOnline,
  difficulty,
  mode,
  playerColors,
  onSelectColor,
  playerClasses,
  onSelectClass,
  localPlayerName,
  onChangeLocalPlayerName,
  p2LocalName = 'Partner',
  onChangeP2LocalName,
  isMuted,
  menuAudioBlocked,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  onBack,
  onStart,
}) => {
  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);

  const numPlayers: 1 | 2 = coopMode === 'solo' ? 1 : 2;
  const isOnline = coopMode === 'online';
  const isOnlineCampaign = isOnline && mode === 'campaign';
  const isPracticeMode = mode === 'teamwork_practice';
  const isMultiOnline = isOnline && (mode === 'campaign' || isPracticeMode);
  const usesWeaponLoadout = isOnlineCampaign || isPracticeMode;
  const isOnlineConnected = onlineStatus === 'connected';
  const maxOnlineSlots = isMultiOnline ? 5 : 2;

  const connectedRoster = lobbyRoster.filter((r) => r.connected);
  const connectedCount = connectedRoster.length;
  const allConnectedReady = connectedCount > 0 && connectedRoster.every((r) => r.ready);
  const notReadyPlayers = connectedRoster.filter((r) => !r.ready);

  const canHostDeploy = !isOnline
    ? true
    : isMultiOnline
    ? allConnectedReady
    : connectedCount >= 2 && allConnectedReady;

  const localPingMs =
    onlineRole === 'host'
      ? 0
      : pingByPlayer[localPlayerId] ??
        lobbyRoster.find((r) => r.id === localPlayerId)?.pingMs ??
        null;

  const localEditablePid: PlayerId | null = !isOnline ? null : localPlayerId;

  const copyText = (value: string, kind: 'code' | 'link') => {
    if (!value) return;
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedType(kind);
    window.setTimeout(() => setCopiedType((cur) => (cur === kind ? null : cur)), 2000);
  };

  return (
    <div className="relative h-dvh w-full bg-[#040407] flex flex-col items-center p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
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
            {isOnlineCampaign
              ? 'ONLINE CAMPAIGN LOBBY'
              : isPracticeMode
              ? 'BOSS TEAMWORK PRACTICE'
              : 'COMBAT FRAME LOADOUT'}
          </h2>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (menuAudioBlocked && !isMuted) {
                  soundEngine.unlock();
                  soundEngine.playMenuMusic();
                } else {
                  soundEngine.unlock();
                  onToggleMute();
                }
                soundEngine.playUiClick();
              }}
              className={`min-h-[36px] px-2 py-1 rounded border text-xs font-semibold flex items-center gap-1 justify-center cursor-pointer transition-colors ${
                isMuted
                  ? 'bg-red-950/40 border-red-700/70 text-red-300'
                  : menuAudioBlocked
                  ? 'bg-amber-950/60 border-amber-500/80 text-amber-200 animate-pulse'
                  : 'bg-black/80 border-slate-700 text-amber-300 hover:border-slate-500'
              }`}
              aria-label={
                isMuted ? 'Unmute Menu Music' : menuAudioBlocked ? 'Tap to Play Menu Music' : 'Mute Menu Music'
              }
              title={isMuted ? 'Unmute Music' : menuAudioBlocked ? 'Tap to Play Music' : 'Mute Music'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {!isMuted && menuAudioBlocked && <span className="hidden sm:inline">Play</span>}
            </button>
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
        </div>

        {/* 1P / 2P Local / Online Co-op Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onSelectCoopMode('solo');
            }}
            className={`p-3.5 rounded-md border text-left transition-all cursor-pointer flex items-center gap-3 ${
              coopMode === 'solo'
                ? 'bg-red-950/25 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.16)]'
                : 'bg-black/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="p-2.5 rounded bg-red-500/15 text-red-400 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-arcade text-xs text-white">1 PLAYER</div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">Solo Arena</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onSelectCoopMode('local');
            }}
            className={`p-3.5 rounded-md border text-left transition-all cursor-pointer flex items-center gap-3 ${
              coopMode === 'local'
                ? 'bg-cyan-950/25 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.16)]'
                : 'bg-black/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="p-2.5 rounded bg-cyan-500/15 text-cyan-300 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-arcade text-xs text-white">2P LOCAL</div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">Same Keyboard Co-op</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onSelectCoopMode('online');
            }}
            className={`p-3.5 rounded-md border text-left transition-all cursor-pointer flex items-center gap-3 ${
              coopMode === 'online'
                ? 'bg-emerald-950/25 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.16)]'
                : 'bg-black/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="p-2.5 rounded bg-emerald-500/15 text-emerald-300 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-arcade text-xs text-white">ONLINE CO-OP</div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">
                {mode === 'campaign' ? '1–5P Dungeon Campaign' : '2P Boss Rush'}
              </div>
            </div>
          </button>
        </div>

        {/* Online Room Bar + Party Roster */}
        {isOnline && (
          <div className="bg-black/80 border border-emerald-700/50 rounded-md p-4 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-md">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    onSelectOnlineRole('host');
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                    onlineRole === 'host'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Host Room
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    onSelectOnlineRole('guest');
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                    onlineRole === 'guest'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Join Room
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono-num">
                {/* Live Ping / ms Meter */}
                {(onlineRole === 'host' || isOnlineConnected) && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-bold ${pingBadgeClass(
                      localPingMs
                    )}`}
                    title="Live WebRTC Round-Trip Latency"
                  >
                    <Wifi className="w-3.5 h-3.5" />
                    <span>{formatPingLabel(localPingMs, onlineRole === 'host')}</span>
                  </span>
                )}

                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnlineConnected
                      ? 'bg-emerald-400'
                      : onlineStatus === 'error'
                      ? 'bg-red-500'
                      : onlineStatus === 'idle'
                      ? 'bg-slate-600'
                      : 'bg-amber-400 animate-pulse'
                  }`}
                />
                <span
                  className={
                    isOnlineConnected
                      ? 'text-emerald-300 font-semibold'
                      : onlineStatus === 'error'
                      ? 'text-red-400'
                      : 'text-slate-300'
                  }
                >
                  {onlineRole === 'host'
                    ? isMultiOnline
                      ? `Party ${connectedCount}/5 · ${DIFFICULTY_SETTINGS[difficulty].label}`
                      : isOnlineConnected
                      ? '2/2 Joined · Ready Check'
                      : onlineStatus === 'creating'
                      ? 'Opening room...'
                      : onlineStatus === 'waiting'
                      ? 'Waiting for partner (1/2)...'
                      : onlineStatus === 'error'
                      ? 'Room error'
                      : 'Preparing room...'
                    : isOnlineConnected
                    ? `Joined as P${localPlayerId} · ${DIFFICULTY_SETTINGS[difficulty].label} · ${
                        mode === 'boss_rush'
                          ? 'Boss Rush'
                          : mode === 'teamwork_practice'
                          ? 'Teamwork Practice'
                          : 'Campaign'
                      }`
                    : onlineStatus === 'connecting'
                    ? 'Joining room...'
                    : onlineStatus === 'error'
                    ? 'Connection failed'
                    : 'Enter Host Room Code'}
                </span>
              </div>
            </div>

            {onlineRole === 'host' ? (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono-num uppercase">Room Code</span>
                  <span className="font-arcade text-base sm:text-lg tracking-[0.22em] px-3 py-1.5 rounded bg-slate-950 border border-emerald-500/60 text-emerald-300 select-all">
                    {roomCode || '-----'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playUiClick();
                      copyText(roomCode, 'code');
                    }}
                    disabled={!roomCode}
                    className="px-3 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 whitespace-nowrap"
                  >
                    {copiedType === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'code' ? 'Copied Code' : 'Copy Code'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playUiClick();
                      copyText(getInviteLink(roomCode), 'link');
                    }}
                    disabled={!roomCode}
                    className="px-3 py-2 rounded bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/60 text-xs text-emerald-200 font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 whitespace-nowrap"
                  >
                    {copiedType === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'link' ? 'Link Copied' : 'Copy Invite Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playUiClick();
                      onHostCreateRoom();
                    }}
                    className="px-2.5 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                    title="New Room Code"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <input
                  type="text"
                  value={joinInput}
                  onChange={(e) => onChangeJoinInput(sanitizeRoomCode(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && joinInput.length >= 4 && !isOnlineConnected) {
                      soundEngine.playUiClick();
                      onGuestJoinRoom();
                    }
                  }}
                  placeholder="ROOM CODE"
                  maxLength={8}
                  disabled={isOnlineConnected}
                  className="w-40 px-3 py-2 rounded bg-slate-950 border border-slate-700 focus:border-cyan-400 outline-none font-arcade text-sm tracking-[0.2em] text-cyan-200 uppercase text-center disabled:opacity-70"
                />
                {!isOnlineConnected ? (
                  <button
                    type="button"
                    disabled={joinInput.length < 4 || onlineStatus === 'connecting'}
                    onClick={() => {
                      soundEngine.playUiClick();
                      onGuestJoinRoom();
                    }}
                    className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
                  >
                    {onlineStatus === 'connecting' ? 'Connecting...' : 'Connect'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playUiClick();
                      onDisconnectOnline();
                    }}
                    className="px-4 py-2 rounded bg-slate-900 hover:bg-red-950/60 border border-slate-700 hover:border-red-600/70 text-slate-300 hover:text-red-200 text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
                  >
                    Leave Room
                  </button>
                )}
              </div>
            )}

            {/* Connected Party Slots + Ping + Ready Roster (1–5P Campaign or 2P Boss Rush) */}
            {(onlineRole === 'host' || isOnlineConnected) && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono-num text-slate-400">
                  <span>
                    PARTY ROSTER ({connectedCount}/{maxOnlineSlots} JOINED ·{' '}
                    {isMultiOnline
                      ? isPracticeMode
                        ? 'TEAMWORK DRILLS'
                        : `${Math.round((1 + Math.max(0, connectedCount - 1) * 0.5) * 10) / 10}x MOBS`
                      : '2P CO-OP'}
                    )
                  </span>
                  <span>
                    {allConnectedReady
                      ? 'ALL PLAYERS READY'
                      : `${notReadyPlayers.length} WAITING ON READY`}
                  </span>
                </div>

                <div
                  className={`grid gap-2 ${
                    maxOnlineSlots >= 5
                      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
                      : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {Array.from({ length: maxOnlineSlots }, (_, idx) => {
                    const slotId = (idx + 1) as PlayerId;
                    const info = lobbyRoster.find((r) => r.id === slotId && r.connected);
                    if (!info) {
                      return (
                        <div
                          key={slotId}
                          className="p-2.5 rounded border border-dashed border-slate-800 bg-slate-950/40 flex flex-col justify-center gap-1 min-h-[68px]"
                        >
                          <div className="font-mono-num text-[10px] text-slate-600 font-bold">
                            SLOT P{slotId} · OPEN
                          </div>
                          <div className="font-mono-num text-[10px] text-slate-600">
                            Waiting for join...
                          </div>
                        </div>
                      );
                    }
                    const isYou = info.id === localPlayerId;
                    const clsInfo = HERO_CLASSES.find((c) => c.id === info.heroClass);
                    const slotPing =
                      info.isHost ? 0 : pingByPlayer[info.id] ?? info.pingMs ?? null;
                    return (
                      <div
                        key={slotId}
                        className={`p-2.5 rounded border flex flex-col justify-between gap-2 min-h-[68px] ${
                          info.ready
                            ? 'bg-emerald-950/20 border-emerald-500/60'
                            : 'bg-slate-950/80 border-slate-700/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 border border-white/60"
                              style={{ backgroundColor: info.colorHex }}
                            />
                            <span className="font-arcade text-[10px] text-white truncate">
                              {info.playerName?.trim() || `P${info.id}`}
                              {info.isHost ? ' ★' : ''}
                              {isYou ? ' (YOU)' : ''}
                            </span>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded border font-mono-num text-[9px] font-bold shrink-0 ${pingBadgeClass(
                              slotPing
                            )}`}
                          >
                            {slotPing === null ? '--ms' : `${slotPing}ms`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-mono-num text-[10px] text-slate-400 truncate">
                            P{info.id} · {usesWeaponLoadout ? 'Adventurer' : clsInfo?.name || 'HERO'}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono-num text-[9px] font-bold shrink-0 ${
                              info.ready
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {info.ready ? (
                              <>
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>READY</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-2.5 h-2.5" />
                                <span>WAIT</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {onlineError && (
              <p className="text-xs text-red-400 font-mono-num">{onlineError}</p>
            )}
          </div>
        )}

        {/* CAMPAIGN ONLINE OR TEAMWORK PRACTICE: Color + Name + Ready Check + Mode Overview */}
        {usesWeaponLoadout ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Your Color Swatch & Ready Toggle */}
            <div className="lg:col-span-6 p-4 sm:p-5 rounded-md bg-black/75 border border-slate-800 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="font-arcade text-xs shrink-0"
                      style={{ color: (playerColors[localPlayerId] || COLOR_OPTIONS[0]).hex }}
                    >
                      {localPlayerName.trim() || `PLAYER ${localPlayerId}`} (YOU)
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="font-mono-num text-xs text-stone-200 font-semibold truncate">
                      P{localPlayerId} ADVENTURER
                    </span>
                  </div>
                  <span className="font-mono-num text-[10px] text-amber-300/90 shrink-0">
                    COLOR &amp; NAME
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono-num text-slate-300 uppercase tracking-wider">
                    Display Name (Shown Above Hero &amp; HUD)
                  </label>
                  <input
                    type="text"
                    value={localPlayerName}
                    onChange={(e) => onChangeLocalPlayerName(e.target.value.slice(0, 14))}
                    placeholder={`Player ${localPlayerId}`}
                    maxLength={14}
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 focus:border-cyan-400 outline-none font-mono-num text-xs text-white"
                  />
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {isPracticeMode ? (
                    <>
                      Practice Boss Teamwork attacks in <strong className="text-cyan-300">1P Solo (with AI Dummies)</strong> or <strong className="text-emerald-300">1–5P Online Co-op</strong>. Swap weapons &amp; trigger mechanics anytime!
                    </>
                  ) : (
                    <>
                      Classes are locked out before entering the dungeon. Pick your armor color below — carry <strong className="text-stone-200">1 Weapon</strong> at a time, manage your <strong className="text-purple-300">Scroll Bag [I]</strong>, and sip <strong className="text-rose-300">Crimson Flasks [C] (Max 2 · 90s CD)</strong>.
                    </>
                  )}
                </p>

                {/* Color Swatches */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono-num text-slate-300">
                    <span>ARMOR COAT</span>
                    <span style={{ color: (playerColors[localPlayerId] || COLOR_OPTIONS[0]).hex }}>
                      {(playerColors[localPlayerId] || COLOR_OPTIONS[0]).name}
                    </span>
                  </div>
                  <div className="grid grid-cols-8 gap-2">
                    {COLOR_OPTIONS.map((col) => {
                      const activeCol = playerColors[localPlayerId] || COLOR_OPTIONS[0];
                      const isSel = activeCol.hex === col.hex;
                      const lockedGuest = isOnline && onlineRole === 'guest' && !isOnlineConnected;
                      return (
                        <button
                          key={col.hex}
                          type="button"
                          disabled={lockedGuest}
                          title={col.name}
                          onClick={() => {
                            if (lockedGuest) return;
                            soundEngine.playUiClick();
                            onSelectColor(localPlayerId, col);
                          }}
                          className={`h-8 rounded border-2 transition-transform ${
                            lockedGuest ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                          } ${
                            isSel ? 'border-white scale-105' : 'border-transparent opacity-75 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: col.hex,
                            boxShadow: isSel ? `0 0 12px ${col.hex}` : undefined,
                          }}
                          aria-label={`Player ${localPlayerId} ${col.name}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Player Ready Button (Online Only) */}
              {isOnline ? (
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <button
                    type="button"
                    disabled={onlineRole === 'guest' && !isOnlineConnected}
                    onClick={() => {
                      soundEngine.playUiClick();
                      onToggleReady();
                    }}
                    className={`w-full py-3.5 px-4 rounded-md border font-arcade text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                      localReady
                        ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                        : 'bg-amber-600/90 hover:bg-amber-500 border-amber-400 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{localReady ? 'READY! (CLICK TO UNREADY)' : 'CLICK TO MARK READY'}</span>
                  </button>
                  <p className="text-center font-mono-num text-[11px] text-slate-400">
                    {allConnectedReady
                      ? 'Everyone is Ready! Host may now deploy.'
                      : 'Host can launch once all joined players mark Ready.'}
                  </p>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-800/80 font-mono-num text-[11px] text-cyan-300 text-center">
                  2 AI Practice Allies (Dummy Ranger &amp; Dummy Cleric) will automatically join you!
                </div>
              )}
            </div>

            {/* Right: Campaign or Teamwork Practice Rules */}
            {isPracticeMode ? (
              <div className="lg:col-span-6 p-4 sm:p-5 rounded-md bg-black/75 border border-cyan-800/70 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 text-cyan-300 font-souls text-sm font-bold tracking-wider">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>BOSS TEAMWORK PRACTICE DRILLS</span>
                  </div>
                  <span className="font-mono-num text-[10px] text-emerald-300">
                    {isOnline ? '1–5P CO-OP' : '1P + AI DUMMIES'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="p-2.5 rounded bg-slate-950/90 border border-slate-800/90">
                    <div className="font-semibold text-white">All 5 Weapons &amp; 4 Skills Unlocked</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Switch instantly between <strong className="text-sky-300">Tank Aegis</strong>, <strong className="text-amber-300">Cleric Staff</strong>, <strong className="text-fuchsia-300">Twin Blades</strong>, <strong className="text-rose-300">Warblade</strong> &amp; <strong className="text-emerald-300">Longbow</strong> anytime using the Practice Panel.
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950/90 border border-slate-800/90">
                    <div className="font-semibold text-amber-200">
                      Trigger Abyssal Meltdown, Apocalypse Cone &amp; Hunter Mark
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Practice standing on the cramped <strong className="text-emerald-300">Safe Island</strong> with Tank&apos;s <strong className="text-sky-300">[E] 4s Front Shield</strong> to purify barrages while AI Dummies or friends shelter behind you!
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950/90 border border-slate-800/90">
                    <div className="font-semibold text-cyan-200">Zero Penalty · Instant Respawn</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Downed players &amp; dummies auto-revive after 3s, and you can swap between all 4 Nightmare Bosses on demand.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-6 p-4 sm:p-5 rounded-md bg-black/75 border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 text-amber-300 font-souls text-sm font-bold tracking-wider">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <span>SOUL KNIGHT EXPEDITION RULES</span>
                  </div>
                  <span className="font-mono-num text-[10px] text-emerald-300">1–5P SCALED</span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="p-2.5 rounded bg-slate-950/90 border border-slate-800/90">
                    <div className="font-semibold text-white">Persistent Floor Grid &amp; Stairs Down</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Explore 10 connected rooms (1 Shop, 0–1 Vault, Combat Chambers &amp; Boss). Take <strong className="text-purple-300">STAIRS DOWN</strong> anytime to descend to deeper sub-floors for more rare Weapons &amp; Scrolls before the Boss!
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950/90 border border-slate-800/90">
                    <div className="font-semibold text-amber-200 flex items-center gap-1.5">
                      <PackageOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>1 Weapon + Bag [I] · Max 2 Flasks (90s CD)</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Press <strong className="text-white">[I]</strong> to drop your Weapon or learn rare <strong className="text-purple-300">[Q/R/F] Scrolls</strong>. Scrolls &amp; Weapons are rare — talk to <strong className="text-amber-300">Merchant Vex [E]</strong> in Shops!
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                    {WEAPONS_CATALOG.map((w) => (
                      <div
                        key={w.id}
                        className="p-1.5 rounded bg-black/80 border border-slate-800 text-center"
                        title={`${w.name} (${w.roleLabel}): ${w.skillDesc}`}
                      >
                        <div className="font-mono-num text-[10px] font-bold" style={{ color: w.accent }}>
                          {w.shortTag}
                        </div>
                        <div className="text-[9px] text-slate-300 truncate mt-0.5">
                          {w.roleLabel}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2.5 rounded bg-slate-950/90 border border-slate-800/90">
                    <div className="font-semibold text-cyan-200">True Boss Teamwork &amp; Loop 2+ Escalation</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Gather on the <strong className="text-emerald-300">Safe Island</strong> behind <strong className="text-sky-300">Tank [E] Front Shield</strong> during Abyssal Meltdown barrages &amp; Hunter Marks. Going Deeper spawns Multi-HP Waves!
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* SOLO, 2P LOCAL, OR 2P ONLINE BOSS RUSH: Classic Class + Color Selection (+ Online Ready Button) */
          <div className={`grid gap-5 ${numPlayers === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {([1, ...(numPlayers === 2 ? [2] : [])] as PlayerId[]).map((pid) => {
              const selectedColor = playerColors[pid] || COLOR_OPTIONS[0];
              const selectedClassId = playerClasses[pid] || 'ronin';
              const selectedClass = HERO_CLASSES.find((c) => c.id === selectedClassId) || HERO_CLASSES[0];
              const lockedForLocalUser = isOnline && localEditablePid !== pid;
              const rosterEntry = lobbyRoster.find((r) => r.id === pid);
              const roleBadge = !isOnline
                ? pid === 1
                  ? 'WASD · Space Dash · E Skill'
                  : 'Arrows · Enter Dash · / Skill'
                : localEditablePid === pid
                ? 'YOUR FRAME · WASD/Arrows or Touch'
                : pid === 1
                ? 'HOST FRAME'
                : isOnlineConnected
                ? 'PARTNER FRAME'
                : 'WAITING FOR PARTNER';

              return (
                <div
                  key={pid}
                  className={`p-4 rounded-md bg-black/75 border space-y-4 ${
                    lockedForLocalUser ? 'border-slate-800/80 opacity-90' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-arcade text-xs shrink-0" style={{ color: selectedColor.hex }}>
                        {pid === 1 && !isOnline
                          ? localPlayerName.trim() || 'PLAYER 1'
                          : pid === 2 && !isOnline
                          ? p2LocalName.trim() || 'PLAYER 2'
                          : rosterEntry?.playerName?.trim() || (localEditablePid === pid ? localPlayerName.trim() || `PLAYER ${pid}` : `PLAYER ${pid}`)}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono-num text-xs text-white font-semibold truncate">
                        {selectedClass.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isOnline && rosterEntry?.connected && (
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono-num text-[9px] font-bold ${
                            rosterEntry.ready
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {rosterEntry.ready ? 'READY' : 'WAIT'}
                        </span>
                      )}
                      <span className="text-[10px] font-mono-num text-slate-400 truncate">
                        {roleBadge}
                      </span>
                    </div>
                  </div>

                  {/* Display Name Input for Local Editable Player */}
                  {!lockedForLocalUser && (
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-mono-num text-slate-400 uppercase shrink-0">NAME</span>
                      <input
                        type="text"
                        value={pid === 2 && !isOnline ? p2LocalName : localPlayerName}
                        onChange={(e) => {
                          const clean = e.target.value.slice(0, 14);
                          if (pid === 2 && !isOnline) {
                            onChangeP2LocalName?.(clean);
                          } else {
                            onChangeLocalPlayerName(clean);
                          }
                        }}
                        placeholder={`Player ${pid}`}
                        maxLength={14}
                        className="flex-1 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 focus:border-cyan-400 outline-none font-mono-num text-xs text-white"
                      />
                    </div>
                  )}

                  {/* 4 Hero Class Selector */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {HERO_CLASSES.map((cls) => {
                      const active = cls.id === selectedClassId;
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          disabled={lockedForLocalUser}
                          onClick={() => {
                            if (lockedForLocalUser) return;
                            soundEngine.playUiClick();
                            onSelectClass(pid, cls.id);
                          }}
                          className={`p-2.5 rounded border text-left transition-all ${
                            lockedForLocalUser ? 'cursor-default' : 'cursor-pointer'
                          } ${
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
                            disabled={lockedForLocalUser}
                            title={col.name}
                            onClick={() => {
                              if (lockedForLocalUser) return;
                              soundEngine.playUiClick();
                              onSelectColor(pid, col);
                            }}
                            className={`h-7 rounded border-2 transition-transform ${
                              lockedForLocalUser ? 'cursor-default' : 'cursor-pointer'
                            } ${
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

                  {/* Ready Button for Local Online Player in Online Boss Rush */}
                  {isOnline && localEditablePid === pid && (
                    <button
                      type="button"
                      disabled={onlineRole === 'guest' && !isOnlineConnected}
                      onClick={() => {
                        soundEngine.playUiClick();
                        onToggleReady();
                      }}
                      className={`w-full py-2.5 px-3 rounded border font-arcade text-[11px] tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
                        localReady
                          ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white'
                          : 'bg-amber-600/90 hover:bg-amber-500 border-amber-400 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{localReady ? 'READY! (CLICK TO UNREADY)' : 'MARK READY'}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isOnline && onlineRole === 'guest' ? (
          <div className="w-full py-4 px-4 rounded-md bg-slate-900/90 border border-cyan-700/50 text-center font-arcade text-xs text-cyan-200 tracking-wider">
            {!isOnlineConnected
              ? 'ENTER A ROOM CODE TO JOIN AN ONLINE MATCH'
              : !localReady
              ? 'CLICK READY SO THE HOST CAN DEPLOY'
              : allConnectedReady
              ? 'ALL READY · WAITING FOR HOST TO DEPLOY'
              : `READY! WAITING ON ${notReadyPlayers.length} PLAYER(S)...`}
          </div>
        ) : (
          <button
            type="button"
            disabled={!canHostDeploy}
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playBoonSelect();
              onStart();
            }}
            className="w-full py-4 rounded-md bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none text-white font-arcade text-sm tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed shadow-[0_0_24px_rgba(220,38,38,0.35)] whitespace-nowrap"
          >
            {isOnline && !isMultiOnline && connectedCount < 2
              ? 'WAITING FOR PARTNER TO JOIN...'
              : isOnline && !allConnectedReady
              ? !localReady
                ? 'MARK YOURSELF READY TO DEPLOY'
                : `WAITING ON ${notReadyPlayers.length} PLAYER(S) TO READY...`
              : isPracticeMode
              ? isOnline
                ? `LAUNCH ${connectedCount}P TEAMWORK PRACTICE`
                : 'LAUNCH TEAMWORK PRACTICE'
              : isOnlineCampaign
              ? `DEPLOY ${connectedCount}P EXPEDITION`
              : 'DEPLOY INTO ARENA'}
          </button>
        )}
      </div>
    </div>
  );
};
