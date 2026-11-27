import React, { useEffect, useState } from 'react';
import { RotateCcw, Home, Play, Sparkles, Trophy, Volume2, Skull, Flame, AlertTriangle, Shield, Swords, Zap, Clock, HeartPulse, X, Maximize2, Minimize2, Gamepad2, CheckCircle2, Briefcase, Coins, FlaskConical, ScrollText, Store, Trash2, Wifi, RefreshCw, SlidersHorizontal, Keyboard, Map as MapIcon, Users, Eye, Lightbulb, Lock, Smartphone } from 'lucide-react';
import { BoonDef, CheatsConfig, ControlsConfig, DEFAULT_CHEATS, DEFAULT_HUD_SETTINGS, FinalVoteState, HudSettings, PlayerControls, PlayerHudState, PlayerId, RunSummary, ShopItem, StageKey, WEAPONS_CATALOG, WeaponClassId } from '../game/types';
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
  numPlayers: number;
  hudSettings?: HudSettings;
  onChangeHudSettings?: (next: HudSettings) => void;
  onResetPartyPos?: () => void;
  showTouchControls?: boolean;
  onToggleTouchControls?: () => void;
  optimizeConnection?: boolean;
  onOptimizeConnection?: () => void;
  onOptimizeAllConnections?: () => void;
  onChange: (next: ControlsConfig) => void;
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({
  controls,
  numPlayers,
  hudSettings = DEFAULT_HUD_SETTINGS,
  onChangeHudSettings,
  onResetPartyPos,
  showTouchControls = false,
  onToggleTouchControls,
  optimizeConnection = false,
  onOptimizeConnection,
  onOptimizeAllConnections,
  onChange,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'hud' | 'network'>('controls');
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

  const updateHud = (patch: Partial<HudSettings>) => {
    if (!onChangeHudSettings) return;
    onChangeHudSettings({ ...hudSettings, ...patch });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#09090e] border border-slate-700 rounded-lg p-5 sm:p-6 space-y-4 max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <h2 className="font-arcade text-sm text-white">SETTINGS &amp; HUD</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
            aria-label="Close Settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              setActiveTab('controls');
            }}
            className={`py-2 px-3 rounded border font-mono-num text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'controls'
                ? 'bg-red-950/70 border-red-500 text-white'
                : 'bg-black/70 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Controls</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              setActiveTab('hud');
            }}
            className={`py-2 px-3 rounded border font-mono-num text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'hud'
                ? 'bg-cyan-950/70 border-cyan-500 text-cyan-100'
                : 'bg-black/70 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>HUD Layout</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              setActiveTab('network');
            }}
            className={`py-2 px-3 rounded border font-mono-num text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'network'
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-100'
                : 'bg-black/70 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Network</span>
          </button>
        </div>

        {activeTab === 'controls' && (
          <div className="space-y-4 pt-1">
            {onToggleTouchControls && (
              <div className="bg-black/75 border border-slate-800 rounded-md p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono-num text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 shrink-0" />
                    <span>MOBILE MODE &amp; FLOATING JOYSTICK</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                    Touch anywhere on the left half of the screen to move/dodge with oversized touch buttons.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    onToggleTouchControls();
                  }}
                  className={`min-h-[40px] px-3 py-1.5 rounded border font-mono-num text-xs font-bold shrink-0 cursor-pointer transition-colors ${
                    showTouchControls
                      ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {showTouchControls ? 'ON' : 'OFF'}
                </button>
              </div>
            )}
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
          </div>
        )}

        {activeTab === 'hud' && (
          <div className="space-y-3.5 pt-1">
            {!onChangeHudSettings ? (
              <p className="text-xs text-slate-400">HUD customization saves automatically for all matches.</p>
            ) : (
              <>
                {/* Scale & Opacity Sliders */}
                <div className="bg-black/70 border border-slate-800 rounded-md p-3.5 space-y-3 text-xs font-mono-num">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-300 shrink-0">HUD Scale</span>
                    <div className="flex items-center gap-2 flex-1 max-w-[240px]">
                      <input
                        type="range"
                        min={75}
                        max={120}
                        step={5}
                        value={Math.round(hudSettings.scale * 100)}
                        onChange={(e) => updateHud({ scale: Number(e.target.value) / 100 })}
                        className="flex-1 accent-cyan-400 cursor-pointer"
                      />
                      <span className="w-10 text-right text-cyan-300 font-bold">
                        {Math.round(hudSettings.scale * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-300 shrink-0">HUD Opacity</span>
                    <div className="flex items-center gap-2 flex-1 max-w-[240px]">
                      <input
                        type="range"
                        min={35}
                        max={100}
                        step={5}
                        value={Math.round(hudSettings.opacity * 100)}
                        onChange={(e) => updateHud({ opacity: Number(e.target.value) / 100 })}
                        className="flex-1 accent-purple-400 cursor-pointer"
                      />
                      <span className="w-10 text-right text-purple-300 font-bold">
                        {Math.round(hudSettings.opacity * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-300 shrink-0 flex items-center gap-1.5">
                      <MapIcon className="w-3.5 h-3.5 text-cyan-400" />
                      Map Opacity
                    </span>
                    <div className="flex items-center gap-2 flex-1 max-w-[240px]">
                      <input
                        type="range"
                        min={25}
                        max={100}
                        step={5}
                        value={Math.round(hudSettings.mapOpacity * 100)}
                        onChange={(e) => updateHud({ mapOpacity: Number(e.target.value) / 100 })}
                        className="flex-1 accent-amber-400 cursor-pointer"
                      />
                      <span className="w-10 text-right text-amber-300 font-bold">
                        {Math.round(hudSettings.mapOpacity * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Map Anchor Position */}
                <div className="bg-black/70 border border-slate-800 rounded-md p-3 space-y-2">
                  <div className="font-mono-num text-[10px] text-slate-400 uppercase tracking-wider">
                    Floor Map Corner Position
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'top-left', label: 'Top Left' },
                        { id: 'top-right', label: 'Top Right' },
                        { id: 'bottom-right', label: 'Bottom Right' },
                      ] as const
                    ).map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => updateHud({ mapPosition: pos.id })}
                        className={`py-1.5 px-2 rounded border font-mono-num text-[11px] font-bold cursor-pointer ${
                          hudSettings.mapPosition === pos.id
                            ? 'bg-cyan-950/75 border-cyan-400 text-cyan-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibility Toggles */}
                <div className="grid grid-cols-2 gap-2 font-mono-num text-[11px]">
                  {(
                    [
                      { key: 'showMap', label: 'Floor Map', icon: <MapIcon className="w-3.5 h-3.5" /> },
                      { key: 'showPartyHealth', label: 'Party Health', icon: <Users className="w-3.5 h-3.5" /> },
                      { key: 'showPing', label: 'Ping Meter', icon: <Wifi className="w-3.5 h-3.5" /> },
                      { key: 'showGoldCounter', label: 'Gold Counter', icon: <Coins className="w-3.5 h-3.5" /> },
                      { key: 'showBossBar', label: 'Boss Health Bar', icon: <Skull className="w-3.5 h-3.5" /> },
                      { key: 'showExtraUi', label: 'Extra Metrics', icon: <Sparkles className="w-3.5 h-3.5" /> },
                      { key: 'compactSkills', label: 'Compact Skills', icon: <Zap className="w-3.5 h-3.5" /> },
                    ] as const
                  ).map((tog) => {
                    const active = Boolean(hudSettings[tog.key]);
                    return (
                      <button
                        key={tog.key}
                        type="button"
                        onClick={() => updateHud({ [tog.key]: !active })}
                        className={`px-3 py-2 rounded border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          active
                            ? 'bg-emerald-950/45 border-emerald-500/75 text-emerald-100'
                            : 'bg-black/65 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          {tog.icon}
                          <span className="truncate">{tog.label}</span>
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            active ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {active ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Reset Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {onResetPartyPos && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playUiClick();
                        onResetPartyPos();
                      }}
                      className="py-2 px-3 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-mono-num text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Party Pos</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playUiClick();
                      onChangeHudSettings(DEFAULT_HUD_SETTINGS);
                      onResetPartyPos?.();
                    }}
                    className="py-2 px-3 rounded border border-amber-700/70 bg-amber-950/45 hover:bg-amber-900/60 text-amber-200 font-mono-num text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset HUD Defaults</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'network' && (
          <div className="space-y-3 pt-1">
            {onOptimizeAllConnections && (
              <div className="bg-emerald-950/25 border border-emerald-500/70 rounded-md p-3.5 space-y-2">
                <div className="font-mono-num text-xs font-bold text-emerald-300 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 shrink-0" />
                  <span>PARTY CONNECTION OPTIMIZER (PAUSE + SYNC)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Pauses the match for everyone, flushes congested WebRTC queues, rebuilds peer stream channels, and broadcasts a clean authoritative keyframe.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    onClose();
                    onOptimizeAllConnections();
                  }}
                  className="w-full py-2.5 px-3 rounded border border-emerald-400 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Optimize All Connections Now</span>
                </button>
              </div>
            )}

            {onOptimizeConnection && (
              <div className="bg-black/75 border border-emerald-800/60 rounded-md p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <Wifi className="w-4 h-4 shrink-0" />
                    <span>LOW-BANDWIDTH PACKET COMPRESSION</span>
                  </div>
                  <span
                    className={`font-mono-num text-[10px] font-bold px-2 py-0.5 rounded border ${
                      optimizeConnection
                        ? 'bg-emerald-950/70 border-emerald-500/70 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    {optimizeConnection ? 'LOW-PING ON' : 'STANDARD'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Strips cosmetic particles from sync packets, caps WebRTC queue depth to stop ping spikes, and refreshes your stream channel.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    onOptimizeConnection();
                  }}
                  className={`w-full py-2.5 px-3 rounded border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    optimizeConnection
                      ? 'bg-emerald-700 hover:bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-emerald-950/60 hover:bg-emerald-900/70 border-emerald-600/70 text-emerald-200'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{optimizeConnection ? 'Low-Bandwidth Mode ON (Toggle)' : 'Enable Low-Bandwidth Mode'}</span>
                </button>
              </div>
            )}
          </div>
        )}

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
  onlineRole?: 'none' | 'host' | 'guest';
  roomCode?: string;
  optimizeConnection?: boolean;
  onOptimizeConnection?: () => void;
  onOptimizeAllConnections?: () => void;
  pausedBy?: PlayerId;
  pausedByName?: string;
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
  onlineRole = 'none',
  roomCode,
  optimizeConnection = false,
  onOptimizeConnection,
  onOptimizeAllConnections,
  pausedBy,
  pausedByName,
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
  const isOnline = onlineRole !== 'none';

  return (
    <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#09090e] border border-slate-700 rounded-lg p-6 space-y-5 max-h-[92dvh] overflow-y-auto">
        <div className="text-center space-y-1">
          <h2 className="font-arcade text-base text-white">PAUSED · SETTINGS</h2>
          {isOnline && roomCode && (
            <p className="font-mono-num text-[11px] text-emerald-300 font-bold tracking-wider">
              ROOM CODE: <span className="select-all text-white">{roomCode}</span>
            </p>
          )}
          {isOnline && pausedBy && (
            <p className="font-mono-num text-[11px] text-amber-300">
              Paused by {pausedByName || `Player ${pausedBy}`}
            </p>
          )}
        </div>

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
              <span>{showTouchControls ? 'Mobile: ON' : 'Mobile: OFF'}</span>
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
            className="w-full py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>HUD &amp; Controls Settings</span>
          </button>
          {isOnline && onOptimizeAllConnections ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                onOptimizeAllConnections();
              }}
              className="w-full py-2.5 rounded-md border border-emerald-400 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-[0_0_18px_rgba(16,185,129,0.28)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Optimize All Connections (Fix Lag/Ping)</span>
            </button>
          ) : (
            onOptimizeConnection && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  onOptimizeConnection();
                }}
                className={`w-full py-2.5 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  optimizeConnection
                    ? 'bg-emerald-700 hover:bg-emerald-600 border-emerald-400 text-white'
                    : 'bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-600/70 text-emerald-200'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>{optimizeConnection ? 'Optimize Connection: ON (Re-Sync)' : 'Optimize Connection (Bad Ping)'}</span>
              </button>
            )
          )}
          {!isOnline && (
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
          )}
          {onlineRole !== 'guest' && (
            <button
              type="button"
              onClick={onRestart}
              className="w-full py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restart Run
            </button>
          )}
          <button
            type="button"
            onClick={onMenu}
            className="w-full py-2.5 rounded-md bg-black hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" /> {isOnline ? 'Leave Online Match' : 'Main Menu'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const OptimizeLoadingModal: React.FC<{
  step: string;
  progress: number;
  players?: PlayerHudState[];
  pingByPlayer?: Record<number, number | null>;
}> = ({ step, progress, players = [], pingByPlayer = {} }) => {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <div className="fixed inset-0 z-55 bg-black/88 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#09080f] border-2 border-emerald-500/75 rounded-lg p-6 space-y-5 shadow-[0_0_50px_rgba(16,185,129,0.25)]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-md bg-emerald-950/75 border border-emerald-400/70 flex items-center justify-center shrink-0">
            <RefreshCw className={`w-5 h-5 text-emerald-300 ${pct < 100 ? 'animate-spin' : ''}`} />
          </div>
          <div className="min-w-0">
            <h2 className="font-arcade text-xs sm:text-sm text-emerald-200 tracking-wide">
              OPTIMIZING CONNECTIONS
            </h2>
            <p className="font-mono-num text-[11px] text-slate-400 mt-0.5 truncate">
              {step}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-sm bg-black border border-emerald-800/80 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-cyan-300 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between font-mono-num text-[11px]">
            <span className="text-emerald-300 font-bold">{pct < 100 ? 'CALIBRATING PARTY LINKS...' : 'COMPLETE'}</span>
            <span className="text-white font-bold">{pct}%</span>
          </div>
        </div>

        {players.length > 0 && (
          <div className="bg-black/75 border border-slate-800 rounded p-3 space-y-1.5">
            <div className="font-mono-num text-[10px] text-slate-400 uppercase tracking-wider">
              Live Party Ping
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {players.map((pl) => {
                const ms = pl.id === 1 ? 0 : pingByPlayer[pl.id] ?? null;
                return (
                  <div
                    key={pl.id}
                    className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-stone-950/85 border border-stone-800 font-mono-num text-[10px]"
                  >
                    <span className="text-stone-200 font-semibold truncate">{pl.name || `P${pl.id}`}</span>
                    <span
                      className={`font-bold ${
                        ms === null
                          ? 'text-stone-400'
                          : ms <= 70
                          ? 'text-emerald-300'
                          : ms <= 140
                          ? 'text-amber-300'
                          : 'text-rose-300'
                      }`}
                    >
                      {ms === null ? '--ms' : `${ms}ms`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
  isWaitingForHost?: boolean;
  onPick: (boon: BoonDef) => void;
}

export const BoonDraftModal: React.FC<BoonDraftModalProps> = ({
  clearedStage,
  choices,
  isWaitingForHost = false,
  onPick,
}) => {
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
          <h2 className="font-souls text-2xl sm:text-3xl font-bold text-stone-100">
            {isWaitingForHost ? 'HOST IS CHOOSING A RELIC...' : 'CHOOSE A BOSS SOUL RELIC'}
          </h2>
          <p className="text-xs text-stone-400">
            Kindle your frame before traversing the next fog gate (+30 HP restored).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {choices.map((boon) => (
            <button
              key={boon.id}
              type="button"
              disabled={isWaitingForHost}
              onClick={() => {
                if (isWaitingForHost) return;
                soundEngine.playUiClick();
                onPick(boon);
              }}
              className={`text-left p-5 rounded bg-[#0b0a0e] border border-stone-700 transition-all flex flex-col gap-3 ${
                isWaitingForHost
                  ? 'opacity-80 cursor-default'
                  : 'hover:border-amber-400 cursor-pointer hover:-translate-y-1'
              }`}
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
                {isWaitingForHost ? 'Host Selecting...' : 'Absorb Relic →'}
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
  onlineRole?: 'none' | 'host' | 'guest';
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const EndScreenModal: React.FC<EndScreenModalProps> = ({
  summary,
  onlineRole = 'none',
  onPlayAgain,
  onMainMenu,
}) => {
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

        {onlineRole === 'guest' && (
          <div className="font-mono-num text-xs text-cyan-300 animate-pulse">
            Waiting for Host to Restart or Leave...
          </div>
        )}

        <div className="flex gap-3 pt-1">
          {onlineRole !== 'guest' && (
            <button
              type="button"
              onClick={onPlayAgain}
              className="flex-1 py-3 rounded bg-red-700 hover:bg-red-600 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Rise Again
            </button>
          )}
          <button
            type="button"
            onClick={onMainMenu}
            className="flex-1 py-3 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" /> {onlineRole !== 'none' ? 'Leave Online Match' : 'Main Menu'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface OnlineDisconnectModalProps {
  isHost: boolean;
  roomCode?: string;
  floorNumber?: number;
  isReconnecting?: boolean;
  reconnectError?: string | null;
  onWaitForReconnect?: () => void;
  onReconnect?: () => void;
  onContinueSolo?: () => void;
  onReturnToMenu: () => void;
}

export const OnlineDisconnectModal: React.FC<OnlineDisconnectModalProps> = ({
  isHost,
  roomCode,
  floorNumber,
  isReconnecting = false,
  reconnectError,
  onWaitForReconnect,
  onReconnect,
  onContinueSolo,
  onReturnToMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/88 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#09090e] border border-red-700/70 rounded-lg p-6 space-y-4 text-center">
        <div className="flex justify-center">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="font-arcade text-sm text-white">
          {isHost ? 'PLAYERS DISCONNECTED' : 'CONNECTION INTERRUPTED'}
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          {isHost
            ? 'Teammates dropped out. Keep this room open to wait for them to reconnect with their gear, continue solo, or save your floor checkpoint.'
            : 'Connection to the Host dropped. Reconnect to rejoin your exact slot, weapons, scrolls & floor progress.'}
        </p>
        {(roomCode || floorNumber) && (
          <div className="bg-black/75 border border-slate-800 rounded px-3 py-2 font-mono-num text-[11px] flex items-center justify-center gap-3 text-slate-300">
            {roomCode && (
              <span>
                ROOM <strong className="text-emerald-300 select-all">{roomCode}</strong>
              </span>
            )}
            {floorNumber !== undefined && floorNumber > 0 && (
              <span>
                FLOOR <strong className="text-amber-300">{floorNumber}</strong>
              </span>
            )}
          </div>
        )}
        {reconnectError && (
          <p className="font-mono-num text-[11px] text-rose-400">{reconnectError}</p>
        )}
        <div className="flex flex-col gap-2.5 pt-1">
          {!isHost && onReconnect && (
            <button
              type="button"
              disabled={isReconnecting}
              onClick={onReconnect}
              className="w-full py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-950/60 disabled:text-emerald-300 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
              <span>{isReconnecting ? 'Reconnecting to Host...' : 'Reconnect to Match'}</span>
            </button>
          )}
          {isHost && onWaitForReconnect && (
            <button
              type="button"
              onClick={onWaitForReconnect}
              className="w-full py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Wait for Reconnect (Pause Room)</span>
            </button>
          )}
          {isHost && onContinueSolo && (
            <button
              type="button"
              onClick={onContinueSolo}
              className="w-full py-2.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
            >
              Continue Solo
            </button>
          )}
          <button
            type="button"
            onClick={onReturnToMenu}
            className="w-full py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            {isHost ? 'Save Floor & Return to Menu' : 'Return to Main Menu'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface FinalBossVoteModalProps {
  finalVote: FinalVoteState;
  players: PlayerHudState[];
  localPlayerId: PlayerId;
  playerColors: Record<number, string>;
  onVote: (choice: 'end' | 'deeper') => void;
}

export const FinalBossVoteModal: React.FC<FinalBossVoteModalProps> = ({
  finalVote,
  players,
  localPlayerId,
  playerColors,
  onVote,
}) => {
  const activePlayers = players.filter((p) => p.state !== 'spectator');
  const myVote = finalVote.votes[localPlayerId];
  const endVotes = Object.values(finalVote.votes).filter((v) => v === 'end').length;
  const deeperVotes = Object.values(finalVote.votes).filter((v) => v === 'deeper').length;
  const nextLoop = finalVote.loopLevel + 1;

  return (
    <div className="fixed inset-0 z-40 bg-black/82 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#09090e] border border-amber-500/70 rounded-lg p-5 sm:p-6 space-y-5 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
        <div className="flex items-start justify-between gap-3 border-b border-stone-800 pb-3">
          <div>
            <div className="font-mono-num text-[10px] font-bold tracking-widest text-amber-400 uppercase">
              ECLIPSE CONQUERED · PARTY VOTE
            </div>
            <h2 className="font-souls text-xl sm:text-2xl font-bold text-white mt-0.5">
              END THE RUN OR DESCEND DEEPER?
            </h2>
          </div>
          <div className="px-3 py-1.5 rounded bg-stone-900 border border-amber-500/60 font-mono-num text-xs font-bold text-amber-300 flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5" />
            <span>{Math.max(0, finalVote.timer)}s</span>
          </div>
        </div>

        {/* Two Vote Choices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onVote('end');
            }}
            className={`text-left p-4 rounded-md border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              myVote === 'end'
                ? 'bg-amber-950/45 border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.25)]'
                : 'bg-black/75 border-stone-700 hover:border-amber-500/70'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-arcade text-xs text-amber-300">
                  <Trophy className="w-4 h-4" />
                  CLAIM VICTORY
                </span>
                <span className="font-mono-num text-xs font-bold text-amber-200">{endVotes} VOTE(S)</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Seal the Eclipse Sanctum, record your party score on the Leaderboard, and celebrate Victory now.
              </p>
            </div>
            <div className="font-mono-num text-[11px] font-bold text-amber-400 flex items-center gap-1">
              {myVote === 'end' && <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{myVote === 'end' ? 'YOUR VOTE: END RUN' : 'VOTE TO END RUN →'}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onVote('deeper');
            }}
            className={`text-left p-4 rounded-md border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              myVote === 'deeper'
                ? 'bg-rose-950/50 border-rose-500 shadow-[0_0_24px_rgba(244,63,94,0.28)]'
                : 'bg-black/75 border-stone-700 hover:border-rose-500/70'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-arcade text-xs text-rose-300">
                  <Flame className="w-4 h-4" />
                  GO DEEPER (LOOP {nextLoop})
                </span>
                <span className="font-mono-num text-xs font-bold text-rose-200">{deeperVotes} VOTE(S)</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Keep your Equipped Weapon, Flasks, coins, Scroll Bag, Learned Skills &amp; HP buffs. Loop {nextLoop} unleashes <strong className="text-rose-300">Multi-Wave Chambers, Multi-HP &amp; Elite Mobs</strong>, and Boss Teamwork Counters (+50% Score)!
              </p>
            </div>
            <div className="font-mono-num text-[11px] font-bold text-rose-400 flex items-center gap-1">
              {myVote === 'deeper' && <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{myVote === 'deeper' ? `YOUR VOTE: LOOP ${nextLoop}` : `VOTE TO DESCEND →`}</span>
            </div>
          </button>
        </div>

        {/* Live Party Ballots */}
        <div className="bg-black/70 border border-stone-800 rounded p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono-num text-stone-400 uppercase tracking-wider">
            <span>PARTY BALLOTS ({Object.keys(finalVote.votes).length}/{activePlayers.length})</span>
            <span>Majority wins · Ties go Deeper</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {activePlayers.map((pl) => {
              const v = finalVote.votes[pl.id];
              const col = playerColors[pl.id] || pl.color;
              return (
                <div
                  key={pl.id}
                  className="px-2.5 py-2 rounded border border-stone-800 bg-stone-950/80 flex flex-col gap-1"
                >
                  <div className="font-arcade text-[10px] truncate" style={{ color: col }}>
                    {pl.name || `P${pl.id}`}{pl.id === localPlayerId ? ' (YOU)' : ''}
                  </div>
                  <div
                    className={`font-mono-num text-[10px] font-bold ${
                      v === 'deeper'
                        ? 'text-rose-300'
                        : v === 'end'
                        ? 'text-amber-300'
                        : 'text-stone-500 animate-pulse'
                    }`}
                  >
                    {v === 'deeper' ? 'GO DEEPER' : v === 'end' ? 'END RUN' : 'VOTING...'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

interface InventoryModalProps {
  player: PlayerHudState;
  isOnlineCampaign: boolean;
  onDropWeapon: () => void;
  onUseScroll: (scrollId: number) => void;
  onDropScroll: (scrollId: number) => void;
  onUsePotion: () => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  player,
  isOnlineCampaign,
  onDropWeapon,
  onUseScroll,
  onDropScroll,
  onUsePotion,
  onClose,
}) => {
  const wDef =
    player.weapon !== 'none'
      ? WEAPONS_CATALOG.find((w) => w.id === player.weapon)
      : undefined;
  const learnedForEquipped = wDef ? player.learnedSkills?.[wDef.id] || [1] : [];
  const scrollBag = player.scrollBag || [];
  const canUsePotion =
    player.potions > 0 && player.potionCooldown <= 0 && player.hp < player.maxHp && player.state === 'alive';

  return (
    <div
      className="fixed inset-0 z-45 bg-black/82 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0d0c12] border-2 border-stone-600/80 rounded-lg p-5 space-y-4 shadow-[0_0_50px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-souls text-base sm:text-lg font-bold text-stone-100 tracking-wider">
                ADVENTURER INVENTORY [I]
              </h2>
              <p className="font-mono-num text-[11px] text-stone-400">
                1 Equipped Weapon Slot · Learn or Drop Specific Skill Scrolls for Teammates
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isOnlineCampaign && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950/50 border border-amber-500/60 font-mono-num text-xs font-bold text-amber-300">
                <Coins className="w-3.5 h-3.5" />
                {player.coins}g
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 cursor-pointer"
              aria-label="Close Inventory"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Row: Equipped Weapon (1 Slot) + Crimson Flasks */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Single Weapon Slot */}
          <div
            className="sm:col-span-7 rounded-md bg-black/75 border-2 p-3.5 flex flex-col justify-between gap-2.5"
            style={{ borderColor: wDef ? `${wDef.accent}99` : '#3f3f46' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-mono-num text-[10px] text-stone-400 uppercase tracking-wider">
                  EQUIPPED WEAPON (MAX 1)
                </div>
                <div
                  className="font-arcade text-xs sm:text-sm mt-1 truncate"
                  style={{ color: wDef ? wDef.accent : '#78716c' }}
                >
                  {wDef ? wDef.name.toUpperCase() : 'UNARMED'}
                </div>
                <div className="font-mono-num text-[11px] text-stone-300 mt-0.5 truncate">
                  {wDef
                    ? `${wDef.roleLabel} · ${learnedForEquipped.length}/4 Skills Learned`
                    : 'Walk over a Weapon Drop on the floor to equip'}
                </div>
              </div>
              {wDef && (
                <button
                  type="button"
                  disabled={player.state !== 'alive'}
                  onClick={() => {
                    soundEngine.playUiClick();
                    onDropWeapon();
                  }}
                  className="px-3 py-1.5 rounded bg-rose-950/70 hover:bg-rose-900/80 disabled:opacity-40 border border-rose-500/75 text-rose-200 font-mono-num text-[11px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>DROP</span>
                </button>
              )}
            </div>

            {wDef && (
              <div className="grid grid-cols-4 gap-1 pt-1 border-t border-stone-800/80">
                {wDef.skills.map((sk, idx) => {
                  const slotNum = idx + 1;
                  const unlocked = slotNum === 1 || learnedForEquipped.includes(slotNum);
                  return (
                    <div
                      key={sk.slot}
                      className={`px-1.5 py-1 rounded border text-center font-mono-num text-[9px] truncate ${
                        unlocked
                          ? 'bg-stone-900/90 border-stone-600 text-stone-100'
                          : 'bg-stone-950/50 border-stone-800/60 text-stone-500'
                      }`}
                      style={{ borderColor: unlocked ? `${wDef.accent}88` : undefined }}
                      title={`${sk.keyLabel}: ${sk.name} — ${sk.desc}`}
                    >
                      [{sk.keyLabel}] {unlocked ? sk.shortName : 'LOCKED'}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Flask & Vitality Slot */}
          <div className="sm:col-span-5 rounded-md bg-black/75 border border-stone-700 p-3.5 flex flex-col justify-between gap-2.5">
            <div>
              <div className="font-mono-num text-[10px] text-stone-400 uppercase tracking-wider">
                BELT · CRIMSON FLASKS [C]
              </div>
              <div className="flex items-center justify-between mt-1.5 font-mono-num">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-300">
                  <FlaskConical className="w-4 h-4" />
                  x{player.potions} / 2
                </span>
                <span className="text-xs text-stone-300">
                  HP {player.hp}/{player.maxHp}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Restores +45 HP instantly (90s CD · Max 2 carried).
              </p>
            </div>
            <button
              type="button"
              disabled={!canUsePotion}
              onClick={() => {
                soundEngine.playUiClick();
                onUsePotion();
              }}
              className={`w-full py-2 rounded border font-mono-num text-xs font-bold transition-colors ${
                canUsePotion
                  ? 'bg-rose-700 hover:bg-rose-600 border-rose-400 text-white cursor-pointer'
                  : 'bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              {player.potionCooldown > 0
                ? `COOLDOWN (${player.potionCooldown}s)`
                : player.hp >= player.maxHp
                ? 'HP FULL'
                : player.potions <= 0
                ? 'NO FLASKS LEFT'
                : 'DRINK FLASK (+45 HP)'}
            </button>
          </div>
        </div>

        {/* 8-Slot Minecraft-Style Scroll Backpack */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono-num text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-purple-300 font-bold uppercase tracking-wider">
              <ScrollText className="w-4 h-4" />
              SKILL SCROLL BACKPACK ({scrollBag.length}/8)
            </span>
            <span className="text-stone-400 text-[10px]">
              Learn for your Codex or Drop on the floor to trade!
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Array.from({ length: 8 }, (_, slotIdx) => {
              const item = scrollBag[slotIdx];
              if (!item) {
                return (
                  <div
                    key={slotIdx}
                    className="h-[108px] rounded border border-dashed border-stone-800 bg-stone-950/45 flex flex-col items-center justify-center font-mono-num text-[10px] text-stone-600"
                  >
                    EMPTY SLOT
                  </div>
                );
              }
              const twDef = WEAPONS_CATALOG.find((w) => w.id === item.targetWeapon);
              const sk = twDef?.skills[item.skillSlot - 1];
              const alreadyLearned = (player.learnedSkills?.[item.targetWeapon] || [1]).includes(item.skillSlot);
              const isEquippedTarget = player.weapon === item.targetWeapon;

              return (
                <div
                  key={item.id}
                  className="h-[108px] rounded border-2 bg-black/85 p-2 flex flex-col justify-between"
                  style={{ borderColor: `${twDef?.accent || '#c084fc'}88` }}
                  title={`${twDef?.name} [${sk?.keyLabel}] ${sk?.name}: ${sk?.desc}`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center justify-between gap-1 font-mono-num text-[10px] font-bold">
                      <span style={{ color: twDef?.accent || '#c084fc' }} className="truncate">
                        {twDef?.shortTag} [{sk?.keyLabel}]
                      </span>
                      {isEquippedTarget && (
                        <span className="text-[9px] text-emerald-300 shrink-0">MATCH</span>
                      )}
                    </div>
                    <div className="font-mono-num text-[11px] font-semibold text-stone-100 truncate">
                      {sk?.name || `Skill ${item.skillSlot}`}
                    </div>
                    <div className="font-mono-num text-[9px] text-stone-400 truncate">
                      {alreadyLearned ? 'Already Learned' : 'Unlocks Permanently'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1 pt-1">
                    <button
                      type="button"
                      disabled={alreadyLearned || player.state !== 'alive'}
                      onClick={() => onUseScroll(item.id)}
                      className={`py-1 rounded border font-mono-num text-[10px] font-bold ${
                        alreadyLearned
                          ? 'bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed'
                          : 'bg-emerald-950/75 hover:bg-emerald-800/80 border-emerald-500/80 text-emerald-200 cursor-pointer'
                      }`}
                    >
                      {alreadyLearned ? 'KNOWN' : 'LEARN'}
                    </button>
                    <button
                      type="button"
                      disabled={player.state !== 'alive'}
                      onClick={() => onDropScroll(item.id)}
                      className="py-1 rounded border bg-stone-900 hover:bg-rose-950/70 border-stone-700 hover:border-rose-500/70 text-stone-300 hover:text-rose-200 font-mono-num text-[10px] font-bold cursor-pointer"
                    >
                      DROP
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ShopNpcModalProps {
  npcName: string;
  player: PlayerHudState;
  items: ShopItem[];
  onBuyItem: (itemId: number) => void;
  onClose: () => void;
}

export const ShopNpcModal: React.FC<ShopNpcModalProps> = ({
  npcName,
  player,
  items,
  onBuyItem,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-45 bg-black/82 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0c0a12] border-2 border-amber-500/75 rounded-lg p-5 space-y-4 shadow-[0_0_50px_rgba(245,158,11,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-amber-500/15 border border-amber-500/50 text-amber-300 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-souls text-base sm:text-lg font-bold text-amber-300 tracking-wider">
                {npcName.toUpperCase()}
              </h2>
              <p className="font-mono-num text-[11px] text-stone-400">
                “Gold opens every gate, traveler. Pick your wares carefully.”
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-950/60 border border-amber-500/70 font-mono-num text-xs font-bold text-amber-300">
              <Coins className="w-3.5 h-3.5" />
              {player.coins}g
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 cursor-pointer"
              aria-label="Close Merchant Shop"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Shop Item Catalog List */}
        <div className="space-y-2">
          {items.map((item) => {
            const soldOut = Boolean(item.globalSold);
            const alreadyBought = item.purchasedBy.includes(player.id);
            const canAfford = player.coins >= item.cost;
            const scrollTarget = item.targetWeapon as WeaponClassId | undefined;
            const scrollSlot = item.skillSlot || 2;
            const alreadyLearnedScroll =
              item.kind === 'skill_scroll' &&
              Boolean(scrollTarget && (player.learnedSkills?.[scrollTarget] || [1]).includes(scrollSlot));
            const bagFullForScroll =
              item.kind === 'skill_scroll' && (player.scrollBag?.length || 0) >= 8;
            const blockedScroll = alreadyLearnedScroll && bagFullForScroll;
            const disabled = soldOut || alreadyBought || !canAfford || blockedScroll || player.state !== 'alive';

            const icon =
              item.kind === 'potion'
                ? '♥'
                : item.kind === 'potion_pack'
                ? '⚗'
                : item.kind === 'max_hp'
                ? '✚'
                : item.kind === 'shield'
                ? '⛨'
                : item.kind === 'skill_scroll'
                ? '✦'
                : '⚔';

            let buttonLabel = `BUY ${item.cost}g`;
            if (soldOut) buttonLabel = 'SOLD OUT';
            else if (alreadyBought) buttonLabel = 'PURCHASED';
            else if (blockedScroll) buttonLabel = 'KNOWN + FULL';
            else if (!canAfford) buttonLabel = `NEED ${item.cost}g`;

            return (
              <div
                key={item.id}
                className={`rounded-md border px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                  soldOut || alreadyBought
                    ? 'bg-stone-950/60 border-stone-800/70 opacity-55'
                    : 'bg-black/75 border-stone-800 hover:border-stone-600'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded border flex items-center justify-center font-bold text-base shrink-0 bg-stone-950"
                    style={{ color: item.accent, borderColor: `${item.accent}88` }}
                  >
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-num text-xs font-bold text-stone-100 truncate">
                        {item.label}
                      </span>
                      {alreadyLearnedScroll && !alreadyBought && (
                        <span className="font-mono-num text-[9px] px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-500/60 text-purple-200 shrink-0">
                          {bagFullForScroll ? 'KNOWN' : 'GOES TO BAG'}
                        </span>
                      )}
                    </div>
                    <div className="font-mono-num text-[11px] text-stone-400 truncate">
                      {item.subLabel}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    soundEngine.playUiClick();
                    onBuyItem(item.id);
                  }}
                  className={`min-w-[104px] px-3 py-2 rounded border font-mono-num text-[11px] font-bold shrink-0 transition-colors ${
                    !disabled
                      ? 'bg-amber-600 hover:bg-amber-500 border-amber-400 text-white cursor-pointer'
                      : 'bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {buttonLabel}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface VersionUpdateEntry {
  version: string;
  title: string;
  tag?: 'LATEST' | 'MAJOR';
  changes: string[];
  simpleChanges: string[];
}

const VERSION_UPDATES_LOG: VersionUpdateEntry[] = [
  {
    version: 'beta test 0.1.8',
    title: 'Freeze Crash Fix, Mecha Boss MP3 & Normal Dungeon MP3 Soundtracks',
    tag: 'LATEST',
    changes: [
      'Fixed the mid-combat Blade Orb cleave crash/freeze bug where killing multiple dungeon monsters in one splash corrupted array indices and stalled the frame loop; also hardened frame timing, reverse enemy loops, canvas arc radii, and loop error recovery.',
      'Replaced Mecha Boss music with the uploaded Industrial Mecha Warlord MP3 track (plays seamlessly across Phase 1 & Phase 2).',
      'Replaced Normal Dungeon music (Iron Citadel, Void Bastion, and Oni Sanctum rooms) with the uploaded Dark Dungeon Crawl MP3 soundtrack.',
    ],
    simpleChanges: [
      'Fixed the game-freezing bug when Blade Orb splash kills multiple monsters at once.',
      'Added the new Mecha Warlord MP3 music for the Mecha Boss fight.',
      'Added the new Dark Dungeon Crawl MP3 music for normal dungeon rooms.',
    ],
  },
  {
    version: 'beta test 0.1.7',
    title: 'Blade Orb Buff & Cleave, Full Boss Attack Rotation, Anti-Cheese Interrupts & Transparent Mobile HUD',
    changes: [
      'Buffed Basic Attack Blade Orbs: doubled base orb damage (2 DMG + +2 Empowered), added a 58px AoE cleave splash on dungeon mob hits, enlarged orbs (26px), raised lucky nearby drop rate (48%), shortened pickup cooldown (0.30s), and added smooth close-range magnetism.',
      'Fixed the single-attack boss loop bug where bosses repeated only one unique channel forever—now every Boss Variant cleanly rotates all 4–5 signature patterns in its pool.',
      'Added 4 new class-counter mechanics (Sky Battery Pylons for Bow, Shadow Counter Dome for Assassin/Skills, Blood Curse Bleed for Holy Staff, and Obsidian Phalanx 75% Armor for Greatsword) so every weapon role has 2+ unique attacks.',
      'Removed basic-attack boss cheese: picking up basic Blade Orbs can no longer interrupt EMPs, Shadow Counters, Rift Shatters, Weakpoint Cores, Miasmas, Blood Curses, or Heavy Carapaces—weapon skills and role counters are now required.',
      'Rebuilt Mobile UI transparency & boss framing: stripped dark opaque boxes from the Mobile HUD, Joystick, and Skill Circles, compacted the top bar into 1 translucent row, slimmed the Boss HP strip without its tall footer on mobile, and shifted camera framing up during boss fights so the HP bar never covers the boss.',
    ],
    simpleChanges: [
      'Basic Blade Orbs hit harder (2 DMG), splash nearby dungeon monsters, drop closer, and magnet-pull right to you.',
      'Fixed a bug where bosses only repeated 1 special attack—every boss now cycles through 4–5 unique attacks.',
      'Added 4 brand-new boss attacks (Sky Pylons, Shadow Counter Parry, Blood Curse, and Obsidian Phalanx) so every class has 2+ unique attacks.',
      'Basic blade pickups can no longer cheat boss interrupts—you need real weapon skills & recommended roles!',
      'Mobile UI and touch buttons are now transparent, and the Boss HP bar is super slim at the top so it never covers the boss.',
    ],
  },
  {
    version: 'beta test 0.1.6',
    title: '16 Boss Variants, Full-Party Counters, Tempest Longbow Buff & Easier Difficulty Scaling',
    changes: [
      'Expanded to 16 attack-aligned Boss Variants (4 per boss: Mecha, Void, Oni, Eclipse) scaled for up to 5-player parties—each boss now strictly executes teamwork patterns tailored to its Suggested Weapons.',
      'Added two dedicated weapon counter mechanics: Cursed Miasma (Holy Staff purifies in 1 Holy skill cast) and Iron Carapace (50% non-Greatsword armor shattered 3x faster by Greatsword slashes/skills).',
      'Previewed the Boss Variant & Suggested Roles right on the Boss Sanctum hallway gate and revealed Floor Map—take the Stairs Down sub-floor to reroll a different boss variant that matches your squad!',
      'Enabled all Boss Variants & teamwork mechanics on Easy and Medium difficulties with friendlier damage, slower telegraphs, and lower break thresholds.',
      'Buffed Tempest Longbow (4-arrow Storm Volley, Dash Snap-Arrow, stronger Frost Snare Trap, 4-DMG Piercing Railshot, multi-target Arrow Rain, and fixed burst volley boss hits) and boosted Dungeon Mob HP.',
    ],
    simpleChanges: [
      'Each boss now has 4 variants (16 total) whose attacks match the weapons shown on their door.',
      'Holy Staff cleanses new Plague Miasma in 1 cast, and Greatsword breaks Iron Carapace armor 3x faster.',
      'You can now see which Boss Variant awaits on the Boss Door and Map, and use Stairs Down to reroll it.',
      'Boss variants and teamwork attacks now work on Easy and Medium too (tuned easier!).',
      'Tempest Bow is way stronger across every skill, and dungeon monsters now have more HP.',
    ],
  },
  {
    version: 'beta test 0.1.5',
    title: 'Full Mobile Mode, Dynamic Left-Side Joystick, Ping Tuning & Boss Variant Overhaul',
    changes: [
      'Added a persistent "Mobile Mode" toggle right on the Splash screen after the intro (plus Title Menu & Settings), hiding desktop footer clutter and sizing touch medallions >= 44px for effortless mobile play.',
      'Rebuilt the movement stick into a non-fixed floating analog joystick anywhere on the left half of the screen so players can dodge smoothly without chasing a locked pad.',
      'Added ping-adaptive sync throttling and automatic boss bullet/particle payload compression when guest latency rises above 110ms.',
      'Revamped all 4 Boss encounters into distinct variants with Class/Weapon Recommendations shown on boss intros and below the Boss HP bar (e.g., Mecha MK-I Bastion recommends Tank+Holy for lava island barrages; Mecha MK-II Overclock has no lava and features a 3x Bow Core Weakpoint + unavoidable EMP interrupted instantly by Assassin skills). Off-meta loadouts remain playable but hit noticeably harder.',
      'Removed "stand on pads to weaken boss" mechanics (Reactor Overload Pylons & Twin Beacons).',
    ],
    simpleChanges: [
      'Added a Mobile Mode button right below Start after the intro.',
      'You can now touch anywhere on the left half of the screen to move/dodge with a floating joystick.',
      'Improved online ping handling during heavy boss fights.',
      'Removed "stand on pads to weaken the boss" attacks and gave bosses variant styles with Recommended Weapons (still playable without them, just harder!).',
    ],
  },
  {
    version: 'beta test 0.1.4',
    title: 'Boxless Clean HUD, Cooldown Flash Effects, Live Room Browser & Dev Suggestions',
    changes: [
      'Removed the outer container boxes around the bottom Skill Bar, Party Health overlay, and Floor Map so circular skills, names, HP bars, pings, and map nodes float transparently over the battlefield.',
      'Added radiant ring + flash burst animations on Dash, Skills 1–4, and Crimson Flask circles the moment each cooldown finishes.',
      'Added a live Active Rooms browser in the Online Co-op Join lobby so players can click "Join" directly on any open host room.',
      'Added a password-locked Suggestions vault ("blink123") next to New Updates with curated gameplay ideas and an Albion Online mechanics example toggle.',
    ],
    simpleChanges: [
      'Removed the boxes behind your skill circles, Party Health, and Floor Map so you can see the game clearly.',
      'Added a bright flash burst on skills right when their cooldown finishes.',
      'Added a clickable Active Rooms list in the lobby so you can join friends with one click.',
      'Added a Suggestions button (password: blink123) with game ideas and an Albion Online example button.',
    ],
  },
  {
    version: 'beta test 0.1.3',
    title: 'Albion Circular Skill Bar, Boss Connection Fix, Lag Cut & Exploit Patch',
    changes: [
      'Fixed weapon drop/pickup exploit: skill cooldowns now persist per weapon and continue ticking while unequipped, tank passive shields keep their break timer, and HP scales proportionally across max-HP weapons.',
      'Fixed mid-boss-fight online disconnections by hardening ping keepalives, auto-healing dropped unreliable WebRTC data streams, preventing sync packets from choking control channels, and removing premature 5s host timeouts.',
      'Reduced non-host lag and input delay with reliable rising-edge action delivery (Dash/Skills/Flask), instant local guest Dash prediction, latency-compensated reconciliation, smooth boss interpolation, and smaller boss snapshot payloads.',
      'Redesigned the bottom combat bar into an Albion Online-inspired circular skill bar with bronze framing, rounded skill medallions, clockwise conic-gradient cooldown sweeps, and bottom hotkey caps.',
      'Added a "Simple Terms" button in this Patch Notes window so players can read every update in short plain-English bullets.',
    ],
    simpleChanges: [
      'Dropping and picking up weapons no longer resets skill cooldowns, shields, or gives free healing.',
      'Fixed random disconnects during online boss fights.',
      'Online non-host players now feel way smoother with faster dashes and less lag delay.',
      'Skill bar is now Albion-style circles with spinning cooldown sweeps.',
      'Added this Simple Terms button to read updates faster.',
    ],
  },
  {
    version: 'beta test 0.1.2',
    title: 'Fullscreen Battlefield, Walk-Through Hallways, HUD Customizer & Connection Reset',
    changes: [
      'Converted the game battlefield into a true edge-to-edge full-screen arena with responsive 1:1 rendering and floating translucent HUD overlays.',
      'Replaced flat doorway pads with walkable stone dungeon hallways featuring open archways, flickering torches, directional floor runes, and far mist/stair thresholds.',
      'Added a tabbed Settings & HUD Customizer (HUD Scale, Panel Opacity, Floor Map Corner Position & Opacity, Individual Toggle Switches, and Reset Party Position).',
      'Added an "Optimize All Connections" pause action that triggers a party-wide loading recalibration: flushes WebRTC queues, rebuilds unreliable peer streams, re-probes ping, and sends a fresh keyframe.',
      'Prevented sync traffic from blocking reliable ping/control channels and widened guest local movement deadzones to cut lag spikes and rubberbanding.',
    ],
    simpleChanges: [
      'Made the game battlefield full-screen.',
      'Turned dungeon doors into real stone hallways you walk through.',
      'Added HUD settings so you can resize, fade, hide, or move UI panels.',
      'Added a pause "Optimize All Connections" button with a loading fix for lag.',
    ],
  },
  {
    version: 'beta test 0.1.1',
    title: 'Chest Loot Animations, Connection Hardening & HUD Overhaul',
    changes: [
      'Fixed disconnected online teammates standing idle or duplicating on reconnect — dead WebRTC peers vanish cleanly and reconnect into their exact slot.',
      'Stopped periodic healing kits and power-up relics from spawning inside cleared dungeon rooms, shops, vaults, or defeated boss sanctums.',
      'Added multi-stage Chest Opening animations (shake, golden rays, hinged lid pop), parabolic pop-out drops, and animated Gold flying straight into your Gold counter UI.',
      'Added Host Kick buttons in both the Online Party Roster and the in-game Party Health panel.',
      'Enlarged the playable arena viewport and added a Hide/Show Extra UI toggle, independent Floor Map Show/Hide + Opacity slider, and a freely draggable collapsible Party Health window.',
      'Added this New Updates changelog viewer on the Landing & Main Menu screens.',
    ],
    simpleChanges: [
      'Disconnected players no longer stand around or duplicate when rejoining.',
      'Stopped heals and power-ups from spawning in already-cleared rooms.',
      'Chests now animate when opened and dropped gold flies into your gold counter.',
      'Host can kick players, hide extra UI, fade the map, and drag/collapse Party Health.',
      'Added the New Updates patch notes button.',
    ],
  },
  {
    version: 'beta test 0.1.0',
    title: 'Floor Checkpoints, Reconnect Recovery & Host Sync Stability',
    changes: [
      'Added automatic floor checkpoint saving so online hosts and guests can resume cleared floor progress after disconnects.',
      'Hid teammates’ idle blade markers cleanly to avoid pickup confusion and enabled attacking stunned enemies.',
      'Added an Optimize Connection toggle inside Settings & Lobby to reduce packet load on high-ping networks.',
    ],
    simpleChanges: [
      'Online rooms auto-save floor progress so you can reconnect without losing your run.',
      'Hid other players’ idle blades and let you hit stunned enemies.',
      'Added an Optimize Connection toggle in Settings.',
    ],
  },
  {
    version: 'beta test 0.0.9',
    title: 'Online Latency Optimization & Shop Economy Rebalance',
    changes: [
      'Split WebRTC control and unreliable stream channels with throttled delta broadcasts to cut guest lag during heavy boss bullet patterns.',
      'Rebalanced dungeon gold drops and adjusted Merchant Broker Vex item pricing.',
    ],
    simpleChanges: [
      'Reduced online co-op lag during busy fights.',
      'Reduced gold drops and made shop items cost more.',
    ],
  },
  {
    version: 'beta test 0.0.8',
    title: 'Boss Rhythm Tuning & Breathing Room',
    changes: [
      'Smoothed boss attack cadences and added clearer recovery windows between heavy teamwork mechanics.',
    ],
    simpleChanges: [
      'Slowed down boss attack speed so your team has time to breathe.',
    ],
  },
  {
    version: 'beta test 0.0.7',
    title: '3 Signature Teamwork Mechanics Per Boss',
    changes: [
      'Expanded every boss encounter (Mecha, Void, Oni, and Eclipse) with 3 distinct teamwork attacks forcing tank shielding, sanctuary positioning, and co-op coordination.',
      'Activated teamwork drills reliably inside Teamwork Practice Mode.',
    ],
    simpleChanges: [
      'Gave every boss at least 3 attacks that require teammates to work together.',
      'Fixed bosses not using teamwork attacks in Practice Mode.',
    ],
  },
  {
    version: 'beta test 0.0.6',
    title: 'Class Headgear, Potion Cap, Stairs Down & Practice Mode',
    changes: [
      'Added class-identifying headgear/helmets for equipped weapons and removed gray scrollbar clutter in favor of dark purple styling.',
      'Added Stairs to descend deeper for extra loot/scrolls before challenging a boss, buffed boss HP, and capped Crimson Flasks to 2 charges (90s cooldown).',
      'Added Boss Teamwork Practice Mode with dummy AI allies.',
    ],
    simpleChanges: [
      'Added themed helmets/hats to show which weapon you have.',
      'Added Stairs Down for extra loot, buffed boss HP, and capped potions to 2 (90s CD).',
      'Added Teamwork Practice Mode with bot teammates and purple/black scrollbars.',
    ],
  },
  {
    version: 'beta test 0.0.5',
    title: 'Single-Weapon Slot, Inventory Bag [I], Broker NPC & Dungeon Gates',
    changes: [
      'Replaced 3-weapon hoarding with single active weapon + Minecraft-style Inventory Bag [I] for storing/dropping weapon-specific skill scrolls.',
      'Rebuilt the Shop around Gilded Broker Vex NPC interaction and added multi-room Dungeon Gates + Arena Safe-Zone Teamwork attacks.',
    ],
    simpleChanges: [
      'Limited players to 1 weapon at a time and added an Inventory Bag [I] for skill scrolls.',
      'Added Merchant Vex NPC in shop rooms and multi-room dungeon gates.',
    ],
  },
  {
    version: 'beta test 0.0.4',
    title: 'Up to 5-Player Online Co-op Campaign & Dungeon Exploration',
    changes: [
      'Launched 1–5P Online Co-op Campaign with procedural connected floor rooms, Treasure Vaults, Weapon Drops, and post-Eclipse Endless Loop voting.',
    ],
    simpleChanges: [
      'Added 1 to 5 player Online Co-op Dungeon Campaign with treasure rooms and endless loops.',
    ],
  },
  {
    version: 'beta test 0.0.3',
    title: 'Relics, Style Rank, Clean Dodge & Hall of Champions',
    changes: [
      'Added Overdrive/Aegis/Magnet/Nova relics, Style Rank meter (D to SSS), Clean Dodge blade empowerment, and Local Leaderboard tracking.',
    ],
    simpleChanges: [
      'Added power-up relics, Style Rank score meter, dodge bonuses, and Leaderboard.',
    ],
  },
  {
    version: 'beta test 0.0.2',
    title: '4 Hero Classes, Boss Rush, Training Grounds & Remappable Controls',
    changes: [
      'Introduced Blade Ronin, Shadow Phantom, Iron Vanguard, and Volt Arcanist heroes, Boss Rush mode, Training Drills, and Cheat Vault.',
    ],
    simpleChanges: [
      'Added 4 Hero Classes, Boss Rush, Training mode, and custom keybinds.',
    ],
  },
  {
    version: 'beta test 0.0.1',
    title: 'Initial Dungeon Bouncer Foundation',
    changes: [
      'Core arena movement, pickup-blade strike combat, dash i-frames, multi-phase bosses, and co-op revive mechanics.',
    ],
    simpleChanges: [
      'First playable release with dodging, blade attacks, bosses, and teammate revives.',
    ],
  },
];

export const UpdatesModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [simpleTerms, setSimpleTerms] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[88dvh] bg-[#07070c] border border-purple-500/60 rounded-lg p-5 sm:p-6 shadow-[0_0_45px_rgba(168,85,247,0.2)] flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-arcade text-sm sm:text-base text-purple-200 tracking-wide">
                PATCH NOTES &amp; VERSION HISTORY
              </h2>
              <p className="font-mono-num text-[11px] text-stone-400">
                Every update from beta test 0.0.1 through 0.1.8
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                setSimpleTerms((s) => !s);
              }}
              className={`px-3 py-1.5 rounded border font-mono-num text-[11px] font-bold cursor-pointer transition-colors ${
                simpleTerms
                  ? 'bg-emerald-900/70 border-emerald-400 text-emerald-100 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                  : 'bg-purple-950/70 hover:bg-purple-900/70 border-purple-500/70 text-purple-200'
              }`}
              title="Switch between detailed notes and short plain-language summaries"
            >
              {simpleTerms ? 'Simple Terms: ON' : 'Simple Terms'}
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                onClose();
              }}
              className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 cursor-pointer shrink-0"
              aria-label="Close Updates"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {VERSION_UPDATES_LOG.map((entry) => {
            const isLatest = entry.tag === 'LATEST';
            const lines = simpleTerms ? entry.simpleChanges : entry.changes;
            return (
              <div
                key={entry.version}
                className={`rounded-md border p-3.5 space-y-2 ${
                  isLatest
                    ? 'bg-purple-950/25 border-purple-500/70'
                    : 'bg-black/70 border-stone-800/90'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num text-xs font-extrabold uppercase tracking-wider text-amber-300">
                      {entry.version}
                    </span>
                    {isLatest && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-600/80 border border-purple-300/60 font-mono-num text-[9px] font-bold text-white">
                        NEW
                      </span>
                    )}
                  </div>
                  <span className="font-mono-num text-[11px] font-semibold text-stone-300">
                    {entry.title}
                  </span>
                </div>
                <ul className="space-y-1 text-xs text-stone-300 pl-3.5 list-disc marker:text-purple-400">
                  {lines.map((line, i) => (
                    <li key={i} className="leading-relaxed">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-stone-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="px-5 py-2 rounded bg-purple-700 hover:bg-purple-600 border border-purple-400/70 text-white text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface SuggestionEntry {
  title: string;
  category: string;
  summary: string;
  ideas: string[];
}

const GENERAL_SUGGESTIONS: SuggestionEntry[] = [
  {
    title: 'Cursed Shrines & Risk-Reward Dungeon Altars',
    category: 'Dungeon Variety',
    summary: 'Optional interactive shrines inside combat rooms that let the party gamble for bigger rewards.',
    ideas: [
      'Greed Altar: Summon 1 extra Elite mob wave for a guaranteed Chest + +60% Gold.',
      'Blood Pact: Lose 25% max HP for this floor in exchange for +35% skill damage and faster cooldowns.',
      'Sanctuary Bell: Restores party flasks once per floor if found down a side hallway.',
    ],
  },
  {
    title: 'Signature Boss Drops & Unique Weapon Charms',
    category: 'Progression & Loot',
    summary: 'Make every major boss drop a signature rare passive charm or weapon upgrade core.',
    ideas: [
      'Mecha Reactor Core: Adds lightning chain sparks to your basic blade strikes.',
      'Void Lens: Leaves a brief shadow decoy after every Dodge Dash.',
      'Oni Warhorn: Increases parry/stun damage against bosses by +30%.',
    ],
  },
  {
    title: 'Cross-Weapon Elemental & Co-op Skill Combos',
    category: 'Teamwork Combat',
    summary: 'Reward squads that time different weapon skills together inside the same window.',
    ideas: [
      'Shatter Combo: Hitting enemies frozen inside Frost Trap with Fire/Cataclysm triggers a bonus AOE burst.',
      'Consecrated Iron: Shield Slamming inside Holy Sanctuary releases a healing shockwave.',
      'Marked Execution: Shadow Mark + Sniper Shot deals crit multiplier damage and refunds 3s cooldown.',
    ],
  },
  {
    title: 'Arena Quick-Ping Wheel & Tactical Floor Callouts',
    category: 'Co-op Quality of Life',
    summary: 'Fast non-voice communication markers visible on the floor for 3 seconds.',
    ideas: [
      'Press [G] or middle-click to drop "Group Up / Safe Zone", "Focus Here", or "Need Heal" floor pings.',
      'Automatically highlight players holding aggro or targeted by a tether mechanic.',
    ],
  },
  {
    title: 'Corrupted Endless Loop Chaos Modifiers',
    category: 'Replayability',
    summary: 'After defeating Eclipse Sovereign, let teams pick 1 floor modifier before starting Loop 2+.',
    ideas: [
      'Hyper Cooldowns (All skill CDs -35%, enemies deal +25% speed).',
      'Double Vaults (Every floor spawns 2 Treasure Vaults + Mimic ambushes).',
      'Glass Cannon Arena (Everyone gains +60% damage dealt and taken).',
    ],
  },
];

const ALBION_EXAMPLE_SUGGESTIONS: SuggestionEntry[] = [
  {
    title: '1. Helmet / Chest Armor / Boot Skill Swapping (Build Crafting)',
    category: 'Albion Online Core Example',
    summary: 'In Albion Online, your build comes from mixing Weapon (Q/W/E) + Helmet (D) + Chest (R) + Boots (F).',
    ideas: [
      'Let Dungeon Bouncer players pick 1 Chest Armor perk (e.g., Cleric Invulnerability Shield, Mercenary Lifesteal, or Plate Aura) and 1 Boot Sprint style (Cooldown Sprint vs. Blink Boots).',
      'Even with the same Sword or Bow, teammates could customize Tank, Bruiser, or Support variations before entering the dungeon.',
    ],
  },
  {
    title: '2. Visible Spell Cast Bars + True Skill Interrupts',
    category: 'Albion Online Combat Depth',
    summary: 'Albion bosses and elites show a visible orange cast bar before big nukes so tanks and assassins can interrupt them.',
    ideas: [
      'Add a bright cast bar under bosses during lethal charge attacks, letting Shield Slam or Kunai Silence cancel the cast and stun the boss for 1.5s.',
      'Creates huge clutch teamwork moments instead of only dodging bullets.',
    ],
  },
  {
    title: '3. Avalonian / Crystal Shrine Group Buffs',
    category: 'Albion Online Group Dungeons',
    summary: 'Group dungeons in Albion spawn rare interactive shrines granting floor-wide buff auras.',
    ideas: [
      'Spawn glowing Shrine pedestals after tough rooms: Cooldown Haste (+25% faster skill recovery), Energy Fountain, or Silver/Gold Magnet Aura.',
    ],
  },
  {
    title: '4. Tiered Enchanted Weapons (.1 / .2 / .3 Glowing Tiers)',
    category: 'Albion Online Loot Thrill',
    summary: 'Finding a weapon in Albion is exciting because chests can roll .1 Green, .2 Blue, or .3 Purple enchanted tiers.',
    ideas: [
      'Add .1 Uncommon, .2 Rare, and .3 Exceptional glows to Weapon Drops from Vaults & Boss Chests, giving bonus attack damage and -10% to -20% skill cooldowns.',
    ],
  },
  {
    title: '5. Destiny Board / Weapon Mastery XP Between Runs',
    category: 'Albion Online Progression',
    summary: 'Albion’s Destiny Board rewards sticking with your favorite weapon line by permanently leveling its Specialization.',
    ideas: [
      'Track local Fame earned per Weapon Class (Sword, Bow, Staff, Shield, Blades) so leveling Sword Mastery unlocks subtle permanent perks or cosmetic aura trails.',
    ],
  },
  {
    title: '6. Corrupted Dungeon Invasion / Survival Contracts',
    category: 'Albion Online High-Stakes Mode',
    summary: 'Optional Crystal Altar at the start of a floor that raises enemy difficulty in exchange for guaranteed top-tier loot.',
    ideas: [
      'Activate the "Infamy Shrine" on Floor 1 to spawn roaming Mini-Boss hunters and unlock bonus Score Rank (SSS+) rewards.',
    ],
  },
];

const SUGGESTIONS_UNLOCK_STORAGE_KEY = 'dungeon_bouncer_suggestions_unlocked_v1';

export const SuggestionsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SUGGESTIONS_UNLOCK_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [albionMode, setAlbionMode] = useState(false);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.unlock();
    if (passwordInput.trim() === 'blink123') {
      soundEngine.playBoonSelect();
      setUnlocked(true);
      setPwError(null);
      try {
        sessionStorage.setItem(SUGGESTIONS_UNLOCK_STORAGE_KEY, '1');
      } catch {
        // ignore
      }
    } else {
      soundEngine.playUiClick();
      setPwError('Incorrect password. Access denied.');
    }
  };

  if (!unlocked) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
        <form
          onSubmit={handleUnlockSubmit}
          className="w-full max-w-md bg-[#08070e] border border-amber-500/60 rounded-lg p-6 space-y-4 shadow-[0_0_45px_rgba(245,158,11,0.2)]"
        >
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="font-arcade text-xs sm:text-sm text-amber-200 tracking-wide">
                  SUGGESTIONS VAULT
                </h2>
                <p className="font-mono-num text-[11px] text-stone-400">
                  Password required to view developer ideas
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                onClose();
              }}
              className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 cursor-pointer"
              aria-label="Close Suggestions"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <label className="block font-mono-num text-xs text-stone-300 font-semibold">
              Access Password
            </label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                if (pwError) setPwError(null);
              }}
              placeholder="Enter password..."
              autoFocus
              className="w-full px-3.5 py-2.5 rounded bg-black border border-stone-700 focus:border-amber-400 outline-none font-mono-num text-sm text-white"
            />
            {pwError && (
              <p className="font-mono-num text-xs text-rose-400 font-semibold">{pwError}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                onClose();
              }}
              className="px-4 py-2 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-amber-600 hover:bg-amber-500 border border-amber-400/80 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Unlock Suggestions</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  const activeList = albionMode ? ALBION_EXAMPLE_SUGGESTIONS : GENERAL_SUGGESTIONS;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[88dvh] bg-[#08070d] border border-amber-500/60 rounded-lg p-5 sm:p-6 shadow-[0_0_45px_rgba(245,158,11,0.2)] flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Lightbulb className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-arcade text-sm sm:text-base text-amber-200 tracking-wide">
                {albionMode ? 'ALBION ONLINE EXAMPLE IDEAS' : 'GAMEPLAY SUGGESTIONS'}
              </h2>
              <p className="font-mono-num text-[11px] text-stone-400">
                {albionMode
                  ? 'Systems inspired by Albion Online to deepen Dungeon Bouncer'
                  : 'Curated ideas to make Dungeon Bouncer combat, loot, and co-op more fun'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                setAlbionMode((m) => !m);
              }}
              className={`px-3 py-1.5 rounded border font-mono-num text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                albionMode
                  ? 'bg-amber-600 border-amber-300 text-white shadow-[0_0_14px_rgba(245,158,11,0.45)]'
                  : 'bg-amber-950/70 hover:bg-amber-900/70 border-amber-500/70 text-amber-200'
              }`}
              title="Switch between general Dungeon Bouncer ideas and Albion Online examples"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{albionMode ? 'Albion Online: ON' : 'Albion Online Example'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                onClose();
              }}
              className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 cursor-pointer shrink-0"
              aria-label="Close Suggestions"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {activeList.map((item) => (
            <div
              key={item.title}
              className={`rounded-md border p-3.5 space-y-2 ${
                albionMode
                  ? 'bg-amber-950/20 border-amber-500/55'
                  : 'bg-black/70 border-stone-800/90'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono-num text-xs font-extrabold text-amber-300">
                  {item.title}
                </span>
                <span className="font-mono-num text-[10px] font-semibold text-stone-400">
                  {item.category}
                </span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">{item.summary}</p>
              <ul className="space-y-1 text-xs text-stone-300 pl-3.5 list-disc marker:text-amber-400">
                {item.ideas.map((line, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-2 shrink-0">
          <span className="font-mono-num text-[10px] text-stone-500">
            Click &quot;Albion Online Example&quot; above to compare systems
          </span>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="px-5 py-2 rounded bg-amber-600 hover:bg-amber-500 border border-amber-400/70 text-white text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


