import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import {
  BoonDraftModal,
  CheatsModal,
  ControlsModal,
  EndScreenModal,
  FinalBossVoteModal,
  OnlineDisconnectModal,
  PauseModal,
  StageTransitionModal,
} from './components/Modals';
import { HeroSetup, TitleMenu } from './components/TitleFlow';
import { LandingSplash, SprokozIntro } from './components/IntroSequence';
import { TutorialModal } from './components/TutorialModal';
import {
  advanceTutorialStep,
  applyBoon,
  castFinalVote,
  cheatClearOrExpose,
  cheatHealParty,
  cheatWarpBoss,
  computeRank,
  createInitialGameRuntime,
  extractHudSnapshot,
  GameRuntime,
  getBoonChoices,
  loadLeaderboard,
  saveLeaderboardEntry,
  setRuntimeCheats,
  skipBossIntro,
  stepGame,
  switchTutorialClass,
  TouchInputState,
  transitionToStage,
} from './game/engine';
import {
  applySyncedSnapshotToGuest,
  CoopMode,
  generateRoomCode,
  getInitialRoomCodeFromUrl,
  OnlineConnectionStatus,
  OnlineMessage,
  OnlineRole,
  OnlineSession,
  sanitizeRoomCode,
  serializeRuntimeForSync,
  SyncedRuntimeSnapshot,
} from './game/onlineSync';
import { renderGame } from './game/renderer';
import { SfxSyncEvent, soundEngine } from './game/soundEngine';
import {
  AppScreen,
  BoonDef,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CheatsConfig,
  COLOR_OPTIONS,
  ColorOption,
  ControlsConfig,
  DEFAULT_CHEATS,
  DEFAULT_CONTROLS,
  DifficultyKey,
  GameMode,
  HeroClassId,
  HudSnapshot,
  LeaderboardEntry,
  LobbyPlayerInfo,
  PlayerId,
  RunSummary,
  StageKey,
} from './game/types';

const CONTROLS_STORAGE_KEY = 'dungeon_bouncer_controls_v3';

function loadSavedControls(): ControlsConfig {
  try {
    const raw = localStorage.getItem(CONTROLS_STORAGE_KEY);
    if (!raw) return DEFAULT_CONTROLS;
    const parsed = JSON.parse(raw);
    return {
      p1: { ...DEFAULT_CONTROLS.p1, ...(parsed.p1 || {}) },
      p2: { ...DEFAULT_CONTROLS.p2, ...(parsed.p2 || {}) },
    };
  } catch {
    return DEFAULT_CONTROLS;
  }
}

function readLocalGuestInput(
  keys: Record<string, boolean>,
  controls: ControlsConfig,
  touch: TouchInputState
): TouchInputState {
  let x = touch.x || 0;
  let y = touch.y || 0;
  const p1 = controls.p1;
  const p2 = controls.p2;
  if (keys[p1.left] || keys[p2.left]) x -= 1;
  if (keys[p1.right] || keys[p2.right]) x += 1;
  if (keys[p1.up] || keys[p2.up]) y -= 1;
  if (keys[p1.down] || keys[p2.down]) y += 1;
  const dash = Boolean(touch.dash || keys[p1.dash] || keys[p2.dash]);
  const ability = Boolean(touch.ability || keys[p1.ability] || keys[p2.ability]);
  const skill2 = Boolean(touch.skill2 || keys['q'] || keys['2']);
  const skill3 = Boolean(touch.skill3 || keys['r'] || keys['3']);
  const skill4 = Boolean(touch.skill4 || keys['f'] || keys['4']);
  return {
    x: Math.max(-1, Math.min(1, x)),
    y: Math.max(-1, Math.min(1, y)),
    dash,
    ability,
    skill2,
    skill3,
    skill4,
  };
}

export default function App() {
  const initialRoomFromUrl = useRef<string | null>(getInitialRoomCodeFromUrl());

  const [screen, setScreen] = useState<AppScreen>(() =>
    initialRoomFromUrl.current ? 'HERO_SETUP' : 'INTRO'
  );
  const [difficulty, setDifficulty] = useState<DifficultyKey>('medium');
  const [mode, setMode] = useState<GameMode>('campaign');
  const [coopMode, setCoopMode] = useState<CoopMode>(() =>
    initialRoomFromUrl.current ? 'online' : 'solo'
  );
  const [onlineLobbyRole, setOnlineLobbyRole] = useState<'host' | 'guest'>(() =>
    initialRoomFromUrl.current ? 'guest' : 'host'
  );
  const [roomCode, setRoomCode] = useState<string>('');
  const [joinInput, setJoinInput] = useState<string>(initialRoomFromUrl.current || '');
  const [onlineStatus, setOnlineStatus] = useState<OnlineConnectionStatus>('idle');
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [pausedBy, setPausedBy] = useState<PlayerId | undefined>(undefined);
  const [disconnectModal, setDisconnectModal] = useState<{ isHost: boolean } | null>(null);

  const [localPlayerId, setLocalPlayerId] = useState<PlayerId>(1);
  const [localReady, setLocalReady] = useState<boolean>(false);
  const [connectedGuestIds, setConnectedGuestIds] = useState<PlayerId[]>([]);
  const [guestConfigs, setGuestConfigs] = useState<
    Record<number, { colorHex: string; heroClass: HeroClassId; ready: boolean }>
  >({});
  const [guestLobbyRoster, setGuestLobbyRoster] = useState<LobbyPlayerInfo[]>([]);
  const [pingByPlayer, setPingByPlayer] = useState<Record<number, number | null>>({ 1: 0 });

  const [playerColors, setPlayerColors] = useState<Record<number, ColorOption>>({
    1: COLOR_OPTIONS[0],
    2: COLOR_OPTIONS[1],
    3: COLOR_OPTIONS[2],
    4: COLOR_OPTIONS[3],
    5: COLOR_OPTIONS[4],
  });
  const [playerClasses, setPlayerClasses] = useState<Record<number, HeroClassId>>({
    1: 'ronin',
    2: 'phantom',
    3: 'vanguard',
    4: 'volt',
    5: 'ronin',
  });

  const [controls, setControls] = useState<ControlsConfig>(loadSavedControls);
  const [cheats, setCheats] = useState<CheatsConfig>(DEFAULT_CHEATS);
  const [showControlsModal, setShowControlsModal] = useState(false);
  const [showCheatsModal, setShowCheatsModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [musicVol, setMusicVol] = useState(0.65);
  const [sfxVol, setSfxVol] = useState(0.8);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(loadLeaderboard);

  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [boonDraftState, setBoonDraftState] = useState<{
    clearedStage: StageKey;
    nextStage: StageKey;
    choices: BoonDef[];
  } | null>(null);
  const [transitionTarget, setTransitionTarget] = useState<StageKey | null>(null);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenNote, setFullscreenNote] = useState<string | null>(null);
  const [menuAudioBlocked, setMenuAudioBlocked] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 1024;
  });

  const numPlayers: number =
    coopMode === 'solo'
      ? 1
      : coopMode === 'local'
      ? 2
      : onlineLobbyRole === 'host'
      ? 1 + connectedGuestIds.length
      : Math.max(1, guestLobbyRoster.filter((r) => r.connected).length);
  const activeOnlineRole: OnlineRole = coopMode === 'online' ? onlineLobbyRole : 'none';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const guestDisplayRtRef = useRef<GameRuntime | null>(null);
  const latestGuestSnapRef = useRef<SyncedRuntimeSnapshot | null>(null);
  const remoteInputsRef = useRef<Record<number, TouchInputState>>({});
  const pendingSfxRef = useRef<SfxSyncEvent[]>([]);

  const keysRef = useRef<Record<string, boolean>>({});
  const touchInputRef = useRef<TouchInputState>({
    x: 0,
    y: 0,
    dash: false,
    ability: false,
    skill2: false,
    skill3: false,
    skill4: false,
  });
  const controlsRef = useRef<ControlsConfig>(controls);
  const screenRef = useRef<AppScreen>(screen);
  const coopModeRef = useRef<CoopMode>(coopMode);
  const activeOnlineRoleRef = useRef<OnlineRole>(activeOnlineRole);
  const difficultyRef = useRef<DifficultyKey>(difficulty);
  const modeRef = useRef<GameMode>(mode);
  const playerClassesRef = useRef(playerClasses);
  const playerColorsRef = useRef(playerColors);
  const localPlayerIdRef = useRef<PlayerId>(localPlayerId);
  const localReadyRef = useRef<boolean>(localReady);
  const guestConfigsRef = useRef(guestConfigs);
  const pingByPlayerRef = useRef(pingByPlayer);

  const onlineSessionRef = useRef<OnlineSession | null>(null);
  const stageTransitionTimerRef = useRef<number | null>(null);
  const fullscreenNoteTimerRef = useRef<number | null>(null);
  const hostMessageHandlerRef = useRef<(msg: OnlineMessage, fromPlayerId: PlayerId) => void>(() => {});
  const guestMessageHandlerRef = useRef<(msg: OnlineMessage, fromPlayerId: PlayerId) => void>(() => {});

  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  useEffect(() => {
    coopModeRef.current = coopMode;
  }, [coopMode]);

  useEffect(() => {
    activeOnlineRoleRef.current = activeOnlineRole;
  }, [activeOnlineRole]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    playerClassesRef.current = playerClasses;
  }, [playerClasses]);

  useEffect(() => {
    playerColorsRef.current = playerColors;
  }, [playerColors]);

  useEffect(() => {
    localPlayerIdRef.current = localPlayerId;
  }, [localPlayerId]);

  useEffect(() => {
    localReadyRef.current = localReady;
  }, [localReady]);

  useEffect(() => {
    guestConfigsRef.current = guestConfigs;
  }, [guestConfigs]);

  useEffect(() => {
    pingByPlayerRef.current = pingByPlayer;
  }, [pingByPlayer]);

  useEffect(() => {
    const syncFullscreen = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      setIsFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement));
    };
    syncFullscreen();
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen);
      if (fullscreenNoteTimerRef.current) window.clearTimeout(fullscreenNoteTimerRef.current);
    };
  }, []);

  const showFullscreenNotice = useCallback((msg: string) => {
    setFullscreenNote(msg);
    if (fullscreenNoteTimerRef.current) window.clearTimeout(fullscreenNoteTimerRef.current);
    fullscreenNoteTimerRef.current = window.setTimeout(() => {
      setFullscreenNote(null);
    }, 4500);
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    setFullscreenNote(null);
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    const rootEl = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    try {
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      } else {
        if (rootEl.requestFullscreen) await rootEl.requestFullscreen();
        else if (rootEl.webkitRequestFullscreen) await rootEl.webkitRequestFullscreen();
        else showFullscreenNotice('Fullscreen not supported here — try Add to Home Screen on iOS.');
      }
    } catch {
      showFullscreenNotice('Fullscreen blocked by browser or embedded frame.');
    }
  }, [showFullscreenNotice]);

  useEffect(() => {
    return soundEngine.onMenuAutoplayChange(setMenuAudioBlocked);
  }, []);

  useEffect(() => {
    screenRef.current = screen;
    if (
      screen === 'INTRO' ||
      screen === 'LANDING' ||
      screen === 'TITLE_MENU' ||
      screen === 'HERO_SETUP'
    ) {
      soundEngine.playMenuMusic();
    } else {
      soundEngine.stopMenuMusic(true);
    }
  }, [screen]);

  useEffect(() => {
    if (
      screen !== 'INTRO' &&
      screen !== 'LANDING' &&
      screen !== 'TITLE_MENU' &&
      screen !== 'HERO_SETUP'
    ) {
      return;
    }
    const handleFirstInteraction = () => {
      soundEngine.unlock();
    };
    window.addEventListener('click', handleFirstInteraction, { capture: true, passive: true });
    window.addEventListener('touchend', handleFirstInteraction, { capture: true, passive: true });
    window.addEventListener('pointerdown', handleFirstInteraction, { capture: true, passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { capture: true, passive: true });
    return () => {
      window.removeEventListener('click', handleFirstInteraction, { capture: true });
      window.removeEventListener('touchend', handleFirstInteraction, { capture: true });
      window.removeEventListener('pointerdown', handleFirstInteraction, { capture: true });
      window.removeEventListener('keydown', handleFirstInteraction, { capture: true });
    };
  }, [screen]);

  const handleSaveControls = useCallback((next: ControlsConfig) => {
    setControls(next);
    try {
      localStorage.setItem(CONTROLS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, []);

  const destroyOnlineSession = useCallback(() => {
    if (onlineSessionRef.current) {
      onlineSessionRef.current.destroy();
      onlineSessionRef.current = null;
    }
    soundEngine.setSfxBroadcastHook(null);
    pendingSfxRef.current = [];
    remoteInputsRef.current = {};
    latestGuestSnapRef.current = null;
    guestDisplayRtRef.current = null;
    setConnectedGuestIds([]);
    setGuestConfigs({});
    setGuestLobbyRoster([]);
    setLocalReady(false);
    setLocalPlayerId(1);
    setPingByPlayer({ 1: 0 });
    setOnlineStatus('idle');
    setOnlineError(null);
    setPausedBy(undefined);
    setDisconnectModal(null);
  }, []);

  useEffect(() => {
    return () => {
      if (stageTransitionTimerRef.current) window.clearTimeout(stageTransitionTimerRef.current);
      if (onlineSessionRef.current) onlineSessionRef.current.destroy();
      soundEngine.setSfxBroadcastHook(null);
    };
  }, []);

  const broadcastScreenMessage = useCallback(
    (msg: Extract<OnlineMessage, { type: 'screen' }>) => {
      if (activeOnlineRoleRef.current === 'host' && onlineSessionRef.current?.isConnected()) {
        onlineSessionRef.current.send(msg);
      }
    },
    []
  );

  const finalizeRun = useCallback(
    (rt: GameRuntime, victory: boolean) => {
      const base = {
        victory,
        score: Math.round(rt.score),
        elapsedSeconds: rt.elapsedSeconds,
        maxCombo: rt.maxCombo,
        grazes: rt.grazes,
        kills: rt.kills,
        difficulty: rt.difficulty,
        mode: rt.mode,
        numPlayers: rt.numPlayers,
        boons: [...rt.activeBoons],
        cheated: rt.cheatsUsed || Object.values(rt.cheats).some(Boolean),
      };
      const summary: RunSummary = {
        ...base,
        rank: computeRank(base),
      };
      const updatedBoard = saveLeaderboardEntry(summary);
      setLeaderboard(updatedBoard);
      setRunSummary(summary);
      const nextScreen: AppScreen = victory ? 'VICTORY' : 'GAME_OVER';
      setScreen(nextScreen);
      broadcastScreenMessage({ type: 'screen', screen: nextScreen, summary });
    },
    [broadcastScreenMessage]
  );

  const launchStageTransition = useCallback(
    (nextStage: StageKey) => {
      if (stageTransitionTimerRef.current) window.clearTimeout(stageTransitionTimerRef.current);
      setTransitionTarget(nextStage);
      setScreen('STAGE_TRANSITION');
      broadcastScreenMessage({
        type: 'screen',
        screen: 'STAGE_TRANSITION',
        transitionTarget: nextStage,
      });

      stageTransitionTimerRef.current = window.setTimeout(() => {
        stageTransitionTimerRef.current = null;
        const rt = runtimeRef.current;
        if (!rt) return;
        transitionToStage(rt, nextStage);
        setTransitionTarget(null);
        setHud(extractHudSnapshot(rt));
        setScreen('PLAYING');
        broadcastScreenMessage({ type: 'screen', screen: 'PLAYING' });
        if (activeOnlineRoleRef.current === 'host' && onlineSessionRef.current?.isConnected()) {
          const sfx = pendingSfxRef.current.splice(0);
          onlineSessionRef.current.send({
            type: 'sync',
            snap: serializeRuntimeForSync(rt),
            sfx,
          });
        }
      }, 1850);
    },
    [broadcastScreenMessage]
  );

  const handlePickBoon = useCallback(
    (boon: BoonDef) => {
      const rt = runtimeRef.current;
      if (!rt || !boonDraftState) return;
      applyBoon(rt, boon.id);
      const next = boonDraftState.nextStage;
      setBoonDraftState(null);
      launchStageTransition(next);
    },
    [boonDraftState, launchStageTransition]
  );

  const beginRun = useCallback(() => {
    soundEngine.unlock();
    if (stageTransitionTimerRef.current) {
      window.clearTimeout(stageTransitionTimerRef.current);
      stageTransitionTimerRef.current = null;
    }

    const isOnlineHost = coopMode === 'online' && onlineLobbyRole === 'host';
    const isOnlineCampaign = isOnlineHost && mode === 'campaign';
    if (isOnlineHost) {
      pendingSfxRef.current = [];
      soundEngine.setSfxBroadcastHook((ev) => {
        pendingSfxRef.current.push(ev);
      });
    } else {
      soundEngine.setSfxBroadcastHook(null);
    }

    const guestIds = isOnlineHost ? onlineSessionRef.current?.getConnectedGuestIds() || [] : [];
    const activePlayerIds: PlayerId[] = isOnlineHost
      ? ([1, ...guestIds] as PlayerId[])
      : coopMode === 'local'
      ? [1, 2]
      : [1];

    const resolvedColors: Record<number, string> = {};
    const resolvedClasses: Record<number, HeroClassId> = {};
    for (let i = 1; i <= 5; i++) {
      const pid = i as PlayerId;
      resolvedColors[pid] =
        (pid !== 1 && isOnlineHost && guestConfigs[pid]?.colorHex) ||
        playerColors[pid]?.hex ||
        COLOR_OPTIONS[i - 1]?.hex ||
        '#ef4444';
      resolvedClasses[pid] =
        (pid !== 1 && isOnlineHost && guestConfigs[pid]?.heroClass) ||
        playerClasses[pid] ||
        'ronin';
    }

    const rt = createInitialGameRuntime({
      difficulty,
      mode: mode === 'tutorial' ? 'campaign' : mode,
      numPlayers: activePlayerIds.length,
      isOnlineCampaign,
      activePlayerIds,
      playerColors: resolvedColors,
      playerClasses: resolvedClasses,
      cheats: isOnlineHost ? DEFAULT_CHEATS : cheats,
    });
    rt.pingByPlayer = isOnlineHost
      ? onlineSessionRef.current?.getPingByPlayer() || { 1: 0 }
      : { 1: 0 };

    runtimeRef.current = rt;
    guestDisplayRtRef.current = null;
    latestGuestSnapRef.current = null;
    remoteInputsRef.current = {};
    keysRef.current = {};
    touchInputRef.current = { x: 0, y: 0, dash: false, ability: false, skill2: false, skill3: false, skill4: false };
    setBoonDraftState(null);
    setTransitionTarget(null);
    setRunSummary(null);
    setPausedBy(undefined);
    setDisconnectModal(null);
    setHud(extractHudSnapshot(rt));
    setScreen('PLAYING');

    if (isOnlineHost && onlineSessionRef.current?.isConnected()) {
      onlineSessionRef.current.send({ type: 'screen', screen: 'PLAYING' });
      const sfx = pendingSfxRef.current.splice(0);
      onlineSessionRef.current.send({
        type: 'sync',
        snap: serializeRuntimeForSync(rt),
        sfx,
      });
    }
  }, [coopMode, onlineLobbyRole, difficulty, mode, playerColors, playerClasses, guestConfigs, cheats]);

  const beginTutorial = useCallback(() => {
    soundEngine.unlock();
    soundEngine.setSfxBroadcastHook(null);
    setShowTutorialModal(false);
    const rt = createInitialGameRuntime({
      difficulty: 'medium',
      mode: 'tutorial',
      numPlayers: 1,
      playerColors: {
        1: playerColors[1].hex,
        2: playerColors[2].hex,
      },
      playerClasses,
    });
    runtimeRef.current = rt;
    keysRef.current = {};
    touchInputRef.current = { x: 0, y: 0, dash: false, ability: false };
    setBoonDraftState(null);
    setTransitionTarget(null);
    setRunSummary(null);
    setHud(extractHudSnapshot(rt));
    setScreen('PLAYING');
  }, [playerColors, playerClasses]);

  const buildHostRoster = useCallback(
    (
      overrideGuests?: Record<number, { colorHex: string; heroClass: HeroClassId; ready: boolean }>,
      overridePings?: Record<number, number | null>
    ): LobbyPlayerInfo[] => {
      const session = onlineSessionRef.current;
      const guestIds = session ? session.getConnectedGuestIds() : [];
      const gCfg = overrideGuests ?? guestConfigsRef.current;
      const pings = overridePings ?? pingByPlayerRef.current;

      const roster: LobbyPlayerInfo[] = [
        {
          id: 1,
          connected: true,
          isHost: true,
          colorHex: playerColorsRef.current[1]?.hex || COLOR_OPTIONS[0].hex,
          heroClass: playerClassesRef.current[1] || 'ronin',
          ready: localReadyRef.current,
          pingMs: 0,
        },
      ];
      for (const gid of guestIds) {
        const cfg = gCfg[gid];
        roster.push({
          id: gid,
          connected: true,
          isHost: false,
          colorHex: cfg?.colorHex || COLOR_OPTIONS[gid - 1]?.hex || '#22d3ee',
          heroClass: cfg?.heroClass || 'phantom',
          ready: Boolean(cfg?.ready),
          pingMs: pings[gid] ?? null,
        });
      }
      return roster;
    },
    []
  );

  const broadcastHostLobbyState = useCallback(
    (
      overrideGuests?: Record<number, { colorHex: string; heroClass: HeroClassId; ready: boolean }>,
      overridePings?: Record<number, number | null>
    ) => {
      const session = onlineSessionRef.current;
      if (!session || session.getRole() !== 'host') return;
      const maxPlayers = modeRef.current === 'campaign' ? 5 : 2;
      session.setMaxPlayers(maxPlayers);
      const roster = buildHostRoster(overrideGuests, overridePings);
      if (session.isConnected()) {
        session.send({
          type: 'lobby_state',
          roster,
          difficulty: difficultyRef.current,
          mode: modeRef.current,
          maxPlayers,
        });
      }
    },
    [buildHostRoster]
  );

  const sendGuestConfig = useCallback(() => {
    const session = onlineSessionRef.current;
    if (!session || session.getRole() !== 'guest' || !session.isConnected()) return;
    const pid = localPlayerIdRef.current;
    const colHex = playerColorsRef.current[pid]?.hex || COLOR_OPTIONS[Math.max(0, pid - 1)]?.hex || '#22d3ee';
    const cls = playerClassesRef.current[pid] || 'phantom';
    session.send({
      type: 'guest_config',
      colorHex: colHex,
      heroClass: cls,
      ready: localReadyRef.current,
    });
  }, []);

  useEffect(() => {
    hostMessageHandlerRef.current = (msg: OnlineMessage, fromPlayerId: PlayerId) => {
      if (msg.type === 'guest_config') {
        const matchedColor = COLOR_OPTIONS.find((c) => c.hex === msg.colorHex) || COLOR_OPTIONS[fromPlayerId - 1] || COLOR_OPTIONS[1];
        const nextGuests = {
          ...guestConfigsRef.current,
          [fromPlayerId]: {
            colorHex: matchedColor.hex,
            heroClass: msg.heroClass,
            ready: msg.ready,
          },
        };
        guestConfigsRef.current = nextGuests;
        setGuestConfigs(nextGuests);
        setPlayerClasses((prev) => ({ ...prev, [fromPlayerId]: msg.heroClass }));
        setPlayerColors((prev) => ({ ...prev, [fromPlayerId]: matchedColor }));
        broadcastHostLobbyState(nextGuests);
      } else if (msg.type === 'loadout') {
        const matchedColor =
          COLOR_OPTIONS.find((c) => c.hex === msg.payload.colorHex) || playerColorsRef.current[fromPlayerId] || COLOR_OPTIONS[1];
        const nextGuests = {
          ...guestConfigsRef.current,
          [fromPlayerId]: {
            colorHex: matchedColor.hex,
            heroClass: msg.payload.heroClass,
            ready: Boolean(msg.payload.ready),
          },
        };
        guestConfigsRef.current = nextGuests;
        setGuestConfigs(nextGuests);
        setPlayerClasses((prev) => ({ ...prev, [fromPlayerId]: msg.payload.heroClass }));
        setPlayerColors((prev) => ({ ...prev, [fromPlayerId]: matchedColor }));
        broadcastHostLobbyState(nextGuests);
      } else if (msg.type === 'input') {
        remoteInputsRef.current[fromPlayerId] = msg.input;
      } else if (msg.type === 'cast_vote') {
        const rt = runtimeRef.current;
        if (rt) {
          castFinalVote(rt, fromPlayerId, msg.choice);
          setHud(extractHudSnapshot(rt));
          if (onlineSessionRef.current?.isConnected()) {
            const sfx = pendingSfxRef.current.splice(0);
            onlineSessionRef.current.send({
              type: 'sync',
              snap: serializeRuntimeForSync(rt),
              sfx,
            });
          }
        }
      } else if (msg.type === 'cmd') {
        if (msg.action === 'skip_intro') {
          const rt = runtimeRef.current;
          if (rt && rt.isBossLevel && rt.boss.state === 'comic_intro') {
            skipBossIntro(rt);
            setHud(extractHudSnapshot(rt));
          }
        } else if (msg.action === 'pause') {
          if (screenRef.current === 'PLAYING') {
            setPausedBy(fromPlayerId);
            setScreen('PAUSED');
            onlineSessionRef.current?.send({ type: 'screen', screen: 'PAUSED', pausedBy: fromPlayerId });
          }
        } else if (msg.action === 'resume') {
          if (screenRef.current === 'PAUSED') {
            setPausedBy(undefined);
            setScreen('PLAYING');
            onlineSessionRef.current?.send({ type: 'screen', screen: 'PLAYING' });
          }
        } else if (msg.action === 'leave') {
          if (screenRef.current !== 'HERO_SETUP' && screenRef.current !== 'TITLE_MENU') {
            const rt = runtimeRef.current;
            if (rt) {
              const slot = rt.players.find((p) => p.id === fromPlayerId);
              if (slot) {
                slot.state = 'spectator';
                slot.hasKnife = false;
                rt.knives = rt.knives.filter((k) => k.owner !== fromPlayerId);
              }
              const aliveOrDown = rt.players.filter((p) => p.state !== 'spectator').length;
              rt.numPlayers = Math.max(1, aliveOrDown);
            }
            const remaining = onlineSessionRef.current?.getConnectedGuestIds().filter((id) => id !== fromPlayerId) || [];
            if (remaining.length === 0) {
              setDisconnectModal({ isHost: true });
            }
          }
        }
      }
    };

    guestMessageHandlerRef.current = (msg: OnlineMessage) => {
      if (msg.type === 'lobby_state') {
        setGuestLobbyRoster(msg.roster);
        setDifficulty(msg.difficulty);
        setMode(msg.mode);
        const pingMap: Record<number, number | null> = {};
        const colMap: Record<number, ColorOption> = { ...playerColorsRef.current };
        const clsMap: Record<number, HeroClassId> = { ...playerClassesRef.current };
        msg.roster.forEach((entry) => {
          pingMap[entry.id] = entry.pingMs;
          const foundCol = COLOR_OPTIONS.find((c) => c.hex === entry.colorHex);
          if (foundCol) colMap[entry.id] = foundCol;
          clsMap[entry.id] = entry.heroClass;
        });
        setPingByPlayer(pingMap);
        setPlayerColors(colMap);
        setPlayerClasses(clsMap);
      } else if (msg.type === 'loadout') {
        const matchedColor =
          COLOR_OPTIONS.find((c) => c.hex === msg.payload.colorHex) || playerColorsRef.current[1];
        setPlayerClasses((prev) => ({ ...prev, 1: msg.payload.heroClass }));
        setPlayerColors((prev) => ({ ...prev, 1: matchedColor }));
        if (msg.payload.difficulty) setDifficulty(msg.payload.difficulty);
        if (msg.payload.mode) setMode(msg.payload.mode);
      } else if (msg.type === 'sync') {
        latestGuestSnapRef.current = msg.snap;
        if (msg.snap.pingByPlayer) {
          setPingByPlayer(msg.snap.pingByPlayer);
        }
        if (msg.sfx && msg.sfx.length > 0) {
          msg.sfx.forEach((ev) => soundEngine.replaySfxEvent(ev));
        }
      } else if (msg.type === 'sfx') {
        msg.events.forEach((ev) => soundEngine.replaySfxEvent(ev));
      } else if (msg.type === 'screen') {
        if (msg.screen === 'PLAYING') {
          setBoonDraftState(null);
          setTransitionTarget(null);
          setRunSummary(null);
          setPausedBy(undefined);
          if (screenRef.current === 'HERO_SETUP') {
            guestDisplayRtRef.current = null;
          }
          setScreen('PLAYING');
        } else if (msg.screen === 'PAUSED') {
          setPausedBy(msg.pausedBy);
          setScreen('PAUSED');
        } else if (msg.screen === 'BOON_DRAFT' && msg.boonDraft) {
          setBoonDraftState(msg.boonDraft);
          setScreen('BOON_DRAFT');
        } else if (msg.screen === 'STAGE_TRANSITION') {
          setBoonDraftState(null);
          setTransitionTarget(msg.transitionTarget || null);
          setScreen('STAGE_TRANSITION');
        } else if ((msg.screen === 'GAME_OVER' || msg.screen === 'VICTORY') && msg.summary) {
          setRunSummary(msg.summary);
          setScreen(msg.screen);
        }
      }
    };
  });

  const createHostRoom = useCallback(() => {
    destroyOnlineSession();
    const code = generateRoomCode();
    setRoomCode(code);
    setOnlineError(null);
    setLocalPlayerId(1);
    setLocalReady(false);

    const maxP = modeRef.current === 'campaign' ? 5 : 2;
    const session = new OnlineSession(
      'host',
      code,
      {
        onStatusChange: (status, err) => {
          setOnlineStatus(status);
          setOnlineError(err || null);
        },
        onGuestJoin: (playerId) => {
          const curSession = onlineSessionRef.current;
          setConnectedGuestIds(curSession ? curSession.getConnectedGuestIds() : [playerId]);
          const defaultCol = COLOR_OPTIONS[playerId - 1]?.hex || '#22d3ee';
          const nextGuests = {
            ...guestConfigsRef.current,
            [playerId]: {
              colorHex: defaultCol,
              heroClass: (['ronin', 'phantom', 'vanguard', 'volt', 'ronin'][playerId - 1] || 'phantom') as HeroClassId,
              ready: false,
            },
          };
          guestConfigsRef.current = nextGuests;
          setGuestConfigs(nextGuests);
          broadcastHostLobbyState(nextGuests);
        },
        onPingUpdate: (pings) => {
          pingByPlayerRef.current = pings;
          setPingByPlayer(pings);
          if (runtimeRef.current) {
            runtimeRef.current.pingByPlayer = pings;
          }
          if (screenRef.current === 'HERO_SETUP') {
            broadcastHostLobbyState(undefined, pings);
          }
        },
        onMessage: (msg, fromId) => hostMessageHandlerRef.current(msg, fromId),
        onPartnerDisconnect: (disconnectedPlayerId) => {
          const curSession = onlineSessionRef.current;
          const remaining = curSession ? curSession.getConnectedGuestIds() : [];
          setConnectedGuestIds(remaining);

          if (disconnectedPlayerId !== undefined) {
            delete remoteInputsRef.current[disconnectedPlayerId];
            const nextGuests = { ...guestConfigsRef.current };
            delete nextGuests[disconnectedPlayerId];
            guestConfigsRef.current = nextGuests;
            setGuestConfigs(nextGuests);
          }

          if (screenRef.current !== 'TITLE_MENU' && screenRef.current !== 'HERO_SETUP') {
            const rt = runtimeRef.current;
            if (rt && disconnectedPlayerId !== undefined) {
              const slot = rt.players.find((p) => p.id === disconnectedPlayerId);
              if (slot) {
                slot.state = 'spectator';
                slot.hasKnife = false;
                rt.knives = rt.knives.filter((k) => k.owner !== disconnectedPlayerId);
              }
              rt.numPlayers = Math.max(1, rt.players.filter((p) => p.state !== 'spectator').length);
            }
            if (remaining.length === 0) {
              setDisconnectModal({ isHost: true });
              soundEngine.setSfxBroadcastHook(null);
            }
          } else {
            if (remaining.length === 0) {
              setOnlineStatus('waiting');
              setOnlineError('Player disconnected. Waiting for players to join...');
            }
            broadcastHostLobbyState();
          }
        },
      },
      maxP
    );
    onlineSessionRef.current = session;
  }, [destroyOnlineSession, broadcastHostLobbyState]);

  const joinGuestRoom = useCallback(
    (explicitCode?: string) => {
      const code = sanitizeRoomCode(explicitCode ?? joinInput);
      if (code.length < 4) return;
      destroyOnlineSession();
      setJoinInput(code);
      setOnlineError(null);
      setLocalReady(false);

      const session = new OnlineSession('guest', code, {
        onStatusChange: (status, err) => {
          setOnlineStatus(status);
          setOnlineError(err || null);
          if (status === 'connected') {
            sendGuestConfig();
          }
        },
        onAssignedSlot: (assignedId) => {
          localPlayerIdRef.current = assignedId;
          setLocalPlayerId(assignedId);
          setPlayerColors((prev) => ({
            ...prev,
            [assignedId]: prev[assignedId] || COLOR_OPTIONS[assignedId - 1] || COLOR_OPTIONS[1],
          }));
          window.setTimeout(() => sendGuestConfig(), 40);
        },
        onMessage: (msg, fromId) => guestMessageHandlerRef.current(msg, fromId),
        onPartnerDisconnect: () => {
          if (
            screenRef.current !== 'TITLE_MENU' &&
            screenRef.current !== 'HERO_SETUP'
          ) {
            setDisconnectModal({ isHost: false });
          } else {
            setOnlineStatus('error');
            setOnlineError('Host closed the room.');
          }
        },
      });
      onlineSessionRef.current = session;
    },
    [joinInput, destroyOnlineSession, sendGuestConfig]
  );

  // Auto-open Host room when entering HERO_SETUP in ONLINE Host mode
  useEffect(() => {
    if (screen !== 'HERO_SETUP' || coopMode !== 'online') return;
    if (onlineLobbyRole === 'host') {
      if (!onlineSessionRef.current || onlineSessionRef.current.getRole() !== 'host') {
        createHostRoom();
      }
    } else if (onlineSessionRef.current && onlineSessionRef.current.getRole() !== 'guest') {
      destroyOnlineSession();
    }
  }, [screen, coopMode, onlineLobbyRole, createHostRoom, destroyOnlineSession]);

  // Auto-join if ?room=CODE was passed in URL
  const autoJoinedUrlRef = useRef(false);
  useEffect(() => {
    if (autoJoinedUrlRef.current) return;
    const urlCode = initialRoomFromUrl.current;
    if (urlCode) {
      autoJoinedUrlRef.current = true;
      joinGuestRoom(urlCode);
    }
  }, [joinGuestRoom]);

  // Sync lobby tweaks & readiness cleanly while in HERO_SETUP
  useEffect(() => {
    if (screen !== 'HERO_SETUP' || coopMode !== 'online') return;
    if (onlineLobbyRole === 'host') {
      broadcastHostLobbyState();
    } else if (onlineStatus === 'connected') {
      sendGuestConfig();
    }
  }, [
    screen,
    coopMode,
    onlineLobbyRole,
    onlineStatus,
    playerClasses,
    playerColors,
    localReady,
    difficulty,
    mode,
    broadcastHostLobbyState,
    sendGuestConfig,
  ]);

  const handleSelectCoopMode = useCallback(
    (next: CoopMode) => {
      if (next !== 'online') {
        destroyOnlineSession();
      }
      setCoopMode(next);
    },
    [destroyOnlineSession]
  );

  const handleSelectOnlineRole = useCallback(
    (role: 'host' | 'guest') => {
      if (role === onlineLobbyRole) return;
      destroyOnlineSession();
      setOnlineLobbyRole(role);
    },
    [onlineLobbyRole, destroyOnlineSession]
  );

  // Global key listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      const k = e.key.toLowerCase();
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        if (screenRef.current === 'PLAYING') {
          e.preventDefault();
        }
      }
      if (k === 'escape') {
        if (showCheatsModal) {
          setShowCheatsModal(false);
          return;
        }
        if (showControlsModal) {
          setShowControlsModal(false);
          return;
        }
        if (screenRef.current === 'PLAYING') {
          if (activeOnlineRoleRef.current === 'guest') {
            onlineSessionRef.current?.send({ type: 'cmd', action: 'pause' });
          } else {
            setPausedBy(activeOnlineRoleRef.current === 'host' ? 1 : undefined);
            setScreen('PAUSED');
            broadcastScreenMessage({ type: 'screen', screen: 'PAUSED', pausedBy: 1 });
          }
          return;
        }
        if (screenRef.current === 'PAUSED') {
          if (activeOnlineRoleRef.current === 'guest') {
            onlineSessionRef.current?.send({ type: 'cmd', action: 'resume' });
          } else {
            setPausedBy(undefined);
            setScreen('PLAYING');
            broadcastScreenMessage({ type: 'screen', screen: 'PLAYING' });
          }
          return;
        }
      }
      if (k === 'tab' && screenRef.current === 'PLAYING') {
        if (activeOnlineRoleRef.current === 'guest') {
          const curHudRt = guestDisplayRtRef.current;
          if (curHudRt && curHudRt.isBossLevel && curHudRt.boss.state === 'comic_intro') {
            e.preventDefault();
            onlineSessionRef.current?.send({ type: 'cmd', action: 'skip_intro' });
            return;
          }
        } else {
          const rt = runtimeRef.current;
          if (rt && rt.isBossLevel && rt.boss.state === 'comic_intro') {
            e.preventDefault();
            skipBossIntro(rt);
            setHud(extractHudSnapshot(rt));
            return;
          }
        }
      }
      keysRef.current[k] = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    const onBlur = () => {
      keysRef.current = {};
      touchInputRef.current = { x: 0, y: 0, dash: false, ability: false, skill2: false, skill3: false, skill4: false };
      if (activeOnlineRoleRef.current === 'guest' && onlineSessionRef.current?.isConnected()) {
        onlineSessionRef.current.send({
          type: 'input',
          input: { x: 0, y: 0, dash: false, ability: false, skill2: false, skill3: false, skill4: false },
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [showControlsModal, showCheatsModal, broadcastScreenMessage]);

  // 60FPS Game & Network Sync Loop
  useEffect(() => {
    if (screen !== 'PLAYING' && screen !== 'PAUSED' && screen !== 'BOON_DRAFT' && screen !== 'STAGE_TRANSITION') {
      return;
    }

    let rafId = 0;
    let lastTs = performance.now();
    let hudSyncAccum = 0;
    let netSyncAccum = 0;
    let lastSentGuestInput: TouchInputState = {
      x: 0,
      y: 0,
      dash: false,
      ability: false,
      skill2: false,
      skill3: false,
      skill4: false,
    };
    let guestInputHeartbeatAccum = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;
      const canvas = canvasRef.current;
      const ctx = canvas ? canvas.getContext('2d') : null;
      const role = activeOnlineRoleRef.current;

      if (role === 'guest') {
        // Guest thin-client: stream inputs & render 60fps interpolated Host snapshots
        if (screenRef.current === 'PLAYING' && !showControlsModal && !showCheatsModal) {
          const curInput = readLocalGuestInput(keysRef.current, controlsRef.current, touchInputRef.current);
          const changed =
            Math.abs(curInput.x - lastSentGuestInput.x) > 0.02 ||
            Math.abs(curInput.y - lastSentGuestInput.y) > 0.02 ||
            curInput.dash !== lastSentGuestInput.dash ||
            curInput.ability !== lastSentGuestInput.ability ||
            Boolean(curInput.skill2) !== Boolean(lastSentGuestInput.skill2) ||
            Boolean(curInput.skill3) !== Boolean(lastSentGuestInput.skill3) ||
            Boolean(curInput.skill4) !== Boolean(lastSentGuestInput.skill4);
          guestInputHeartbeatAccum += dt;
          if (changed || guestInputHeartbeatAccum >= 0.035) {
            guestInputHeartbeatAccum = 0;
            lastSentGuestInput = curInput;
            onlineSessionRef.current?.send({ type: 'input', input: curInput });
          }
        }

        const latestSnap = latestGuestSnapRef.current;
        if (latestSnap) {
          const displayRt = applySyncedSnapshotToGuest(guestDisplayRtRef.current, latestSnap, dt);
          guestDisplayRtRef.current = displayRt;
          if (ctx) {
            renderGame(ctx, displayRt);
          }
          hudSyncAccum += dt;
          if (hudSyncAccum >= 0.09) {
            hudSyncAccum = 0;
            setHud(extractHudSnapshot(displayRt));
          }
        }
      } else {
        // Solo, Local 2P, or Online Host authoritative simulation
        const rt = runtimeRef.current;
        if (rt && canvas) {
          if (screenRef.current === 'PLAYING' && !showControlsModal && !showCheatsModal) {
            stepGame(
              rt,
              dt,
              keysRef.current,
              controlsRef.current,
              touchInputRef.current,
              role === 'host' ? remoteInputsRef.current : undefined
            );

            if (rt.pendingEvent) {
              const ev = rt.pendingEvent;
              rt.pendingEvent = null;
              setHud(extractHudSnapshot(rt));

              if (role === 'host' && onlineSessionRef.current?.isConnected()) {
                const sfx = pendingSfxRef.current.splice(0);
                onlineSessionRef.current.send({
                  type: 'sync',
                  snap: serializeRuntimeForSync(rt),
                  sfx,
                });
              }

              if (ev.type === 'GAME_OVER') {
                finalizeRun(rt, false);
              } else if (ev.type === 'VICTORY') {
                finalizeRun(rt, true);
              } else if (ev.type === 'STAGE_CLEARED') {
                soundEngine.stopMusic();
                if (ev.offerBoons) {
                  const draft = {
                    clearedStage: ev.clearedStage,
                    nextStage: ev.nextStage,
                    choices: getBoonChoices(rt),
                  };
                  setBoonDraftState(draft);
                  setScreen('BOON_DRAFT');
                  broadcastScreenMessage({
                    type: 'screen',
                    screen: 'BOON_DRAFT',
                    boonDraft: draft,
                  });
                } else {
                  launchStageTransition(ev.nextStage);
                }
              }
            } else {
              hudSyncAccum += dt;
              if (hudSyncAccum >= 0.09) {
                hudSyncAccum = 0;
                setHud(extractHudSnapshot(rt));
              }

              if (role === 'host' && onlineSessionRef.current?.isConnected()) {
                netSyncAccum += dt;
                if (netSyncAccum >= 0.033) {
                  netSyncAccum = 0;
                  const sfx = pendingSfxRef.current.splice(0);
                  onlineSessionRef.current.send({
                    type: 'sync',
                    snap: serializeRuntimeForSync(rt),
                    sfx,
                  });
                }
              }
            }
          } else if (role === 'host' && pendingSfxRef.current.length > 0 && onlineSessionRef.current?.isConnected()) {
            const events = pendingSfxRef.current.splice(0);
            onlineSessionRef.current.send({ type: 'sfx', events });
          }

          if (ctx) {
            renderGame(ctx, rt);
          }
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [screen, showControlsModal, showCheatsModal, finalizeRun, launchStageTransition, broadcastScreenMessage]);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  const handleReturnToMenu = useCallback(() => {
    if (stageTransitionTimerRef.current) {
      window.clearTimeout(stageTransitionTimerRef.current);
      stageTransitionTimerRef.current = null;
    }
    if (activeOnlineRoleRef.current !== 'none' && onlineSessionRef.current?.isConnected()) {
      onlineSessionRef.current.send({ type: 'cmd', action: 'leave' });
    }
    destroyOnlineSession();
    soundEngine.stopMusic();
    runtimeRef.current = null;
    setHud(null);
    setRunSummary(null);
    setBoonDraftState(null);
    setTransitionTarget(null);
    setScreen('TITLE_MENU');
  }, [destroyOnlineSession]);

  const handleContinueSolo = useCallback(() => {
    const rt = runtimeRef.current;
    destroyOnlineSession();
    setCoopMode('solo');
    if (rt) {
      rt.numPlayers = 1;
      rt.players.forEach((pl) => {
        if (pl.id > 1) {
          pl.state = 'spectator';
          pl.hasKnife = false;
        }
      });
      rt.knives = rt.knives.filter((k) => k.owner === 1);
      setHud(extractHudSnapshot(rt));
      setScreen('PLAYING');
    } else {
      setScreen('TITLE_MENU');
    }
  }, [destroyOnlineSession]);

  const handleUpdateCheats = useCallback((next: CheatsConfig) => {
    setCheats(next);
    const rt = runtimeRef.current;
    if (rt) {
      setRuntimeCheats(rt, next);
      setHud(extractHudSnapshot(rt));
    }
  }, []);

  const anyCheatActive = Object.values(cheats).some(Boolean);

  const fullscreenToast = fullscreenNote && screen !== 'PAUSED' ? (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] px-4 py-2 rounded-md bg-stone-950/95 border border-amber-500/70 text-amber-200 font-mono-num text-xs text-center shadow-xl">
      {fullscreenNote}
    </div>
  ) : null;

  if (screen === 'INTRO') {
    return (
      <>
        <SprokozIntro
          isMuted={isMuted}
          menuAudioBlocked={menuAudioBlocked}
          onToggleMute={handleToggleMute}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onComplete={() => setScreen('LANDING')}
        />
        {fullscreenToast}
      </>
    );
  }

  if (screen === 'LANDING') {
    return (
      <>
        <LandingSplash
          isMuted={isMuted}
          menuAudioBlocked={menuAudioBlocked}
          onToggleMute={handleToggleMute}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onStart={() => setScreen('TITLE_MENU')}
          onReplayIntro={() => setScreen('INTRO')}
        />
        {fullscreenToast}
      </>
    );
  }

  if (screen === 'TITLE_MENU') {
    return (
      <>
        <TitleMenu
          difficulty={difficulty}
          onSelectDifficulty={setDifficulty}
          mode={mode}
          onSelectMode={setMode}
          onContinue={() => setScreen('HERO_SETUP')}
          onOpenTutorial={() => setShowTutorialModal(true)}
          onOpenCheats={() => setShowCheatsModal(true)}
          onBackToSplash={() => setScreen('LANDING')}
          anyCheatActive={anyCheatActive}
          isMuted={isMuted}
          menuAudioBlocked={menuAudioBlocked}
          onToggleMute={handleToggleMute}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          leaderboard={leaderboard}
        />
        {fullscreenToast}
        {showTutorialModal && (
          <TutorialModal
            onClose={() => setShowTutorialModal(false)}
            onLaunchArena={beginTutorial}
          />
        )}
        {showCheatsModal && (
          <CheatsModal
            cheats={cheats}
            cheatsUsed={anyCheatActive}
            inRun={false}
            onChange={handleUpdateCheats}
            onClose={() => setShowCheatsModal(false)}
          />
        )}
      </>
    );
  }

  if (screen === 'HERO_SETUP') {
    const hostRoster: LobbyPlayerInfo[] =
      coopMode === 'online'
        ? onlineLobbyRole === 'host'
          ? buildHostRoster()
          : guestLobbyRoster
        : [];

    return (
      <>
        <HeroSetup
          coopMode={coopMode}
          onSelectCoopMode={handleSelectCoopMode}
          onlineRole={onlineLobbyRole}
          onSelectOnlineRole={handleSelectOnlineRole}
          roomCode={roomCode}
          joinInput={joinInput}
          onChangeJoinInput={setJoinInput}
          onlineStatus={onlineStatus}
          onlineError={onlineError}
          lobbyRoster={hostRoster}
          localPlayerId={onlineLobbyRole === 'host' ? 1 : localPlayerId}
          localReady={localReady}
          onToggleReady={() => setLocalReady((r) => !r)}
          pingByPlayer={pingByPlayer}
          onHostCreateRoom={createHostRoom}
          onGuestJoinRoom={() => joinGuestRoom()}
          onDisconnectOnline={destroyOnlineSession}
          difficulty={difficulty}
          mode={mode}
          playerColors={playerColors}
          onSelectColor={(pid, col) => setPlayerColors((prev) => ({ ...prev, [pid]: col }))}
          playerClasses={playerClasses}
          onSelectClass={(pid, cls) => setPlayerClasses((prev) => ({ ...prev, [pid]: cls }))}
          isMuted={isMuted}
          menuAudioBlocked={menuAudioBlocked}
          onToggleMute={handleToggleMute}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onBack={() => {
            destroyOnlineSession();
            setScreen('TITLE_MENU');
          }}
          onStart={beginRun}
        />
        {fullscreenToast}
      </>
    );
  }

  const localPlayerNum: PlayerId = activeOnlineRole === 'guest' ? localPlayerId : 1;
  const hudColorMap: Record<number, string> = {};
  for (let i = 1; i <= 5; i++) {
    hudColorMap[i] = playerColors[i]?.hex || COLOR_OPTIONS[i - 1]?.hex || '#ef4444';
  }

  return (
    <>
      {hud && (
        <GameHud
          hud={hud}
          difficulty={difficulty}
          numPlayers={hud.isTutorial ? 1 : hud.players?.length || numPlayers}
          localPlayerNum={localPlayerNum}
          isOnline={activeOnlineRole !== 'none'}
          playerColors={hudColorMap}
          pingByPlayer={pingByPlayer}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          showTouchControls={showTouchControls}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
          onToggleMute={handleToggleMute}
          onPause={() => {
            touchInputRef.current = { x: 0, y: 0, dash: false, ability: false, skill2: false, skill3: false, skill4: false };
            if (activeOnlineRole === 'guest') {
              onlineSessionRef.current?.send({
                type: 'cmd',
                action: screen === 'PAUSED' ? 'resume' : 'pause',
              });
            } else {
              const nextScreen: AppScreen = screen === 'PAUSED' ? 'PLAYING' : 'PAUSED';
              const nextPausedBy = nextScreen === 'PAUSED' && activeOnlineRole === 'host' ? 1 : undefined;
              setPausedBy(nextPausedBy);
              setScreen(nextScreen);
              broadcastScreenMessage({
                type: 'screen',
                screen: nextScreen,
                pausedBy: nextPausedBy,
              });
            }
          }}
          onOpenControls={() => setShowControlsModal(true)}
          onSwitchTutorialClass={(cls) => {
            const rt = runtimeRef.current;
            if (!rt) return;
            switchTutorialClass(rt, cls);
            setHud(extractHudSnapshot(rt));
          }}
          onNextTutorialStep={() => {
            const rt = runtimeRef.current;
            if (!rt) return;
            advanceTutorialStep(rt);
            setHud(extractHudSnapshot(rt));
          }}
          onExitTutorial={handleReturnToMenu}
          onSkipIntro={() => {
            if (activeOnlineRole === 'guest') {
              onlineSessionRef.current?.send({ type: 'cmd', action: 'skip_intro' });
              return;
            }
            const rt = runtimeRef.current;
            if (!rt) return;
            skipBossIntro(rt);
            setHud(extractHudSnapshot(rt));
          }}
          onTouchMove={(x, y) => {
            touchInputRef.current.x = x;
            touchInputRef.current.y = y;
          }}
          onTouchDash={(pressed) => {
            touchInputRef.current.dash = pressed;
          }}
          onTouchAbility={(pressed) => {
            touchInputRef.current.ability = pressed;
          }}
          onTouchSkillSlot={(slot, pressed) => {
            if (slot === 2) touchInputRef.current.skill2 = pressed;
            else if (slot === 3) touchInputRef.current.skill3 = pressed;
            else if (slot === 4) touchInputRef.current.skill4 = pressed;
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full block"
          />
        </GameHud>
      )}

      {screen === 'PAUSED' && !showControlsModal && !showCheatsModal && (
        <PauseModal
          musicVol={musicVol}
          sfxVol={sfxVol}
          isFullscreen={isFullscreen}
          fullscreenNote={fullscreenNote}
          showTouchControls={showTouchControls}
          onlineRole={activeOnlineRole}
          pausedBy={pausedBy}
          onMusicChange={(v) => {
            setMusicVol(v);
            soundEngine.setMusicVolume(v);
          }}
          onSfxChange={(v) => {
            setSfxVol(v);
            soundEngine.setSfxVolume(v);
          }}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
          onResume={() => {
            if (activeOnlineRole === 'guest') {
              onlineSessionRef.current?.send({ type: 'cmd', action: 'resume' });
            } else {
              setPausedBy(undefined);
              setScreen('PLAYING');
              broadcastScreenMessage({ type: 'screen', screen: 'PLAYING' });
            }
          }}
          onControls={() => setShowControlsModal(true)}
          onCheats={() => setShowCheatsModal(true)}
          cheatsActive={Boolean(hud?.cheatsUsed || anyCheatActive)}
          onRestart={hud?.isTutorial ? beginTutorial : beginRun}
          onMenu={handleReturnToMenu}
        />
      )}

      {showControlsModal && (
        <ControlsModal
          controls={controls}
          numPlayers={activeOnlineRole !== 'none' ? 1 : numPlayers}
          onChange={handleSaveControls}
          onClose={() => setShowControlsModal(false)}
        />
      )}

      {showCheatsModal && activeOnlineRole === 'none' && (
        <CheatsModal
          cheats={cheats}
          cheatsUsed={Boolean(hud?.cheatsUsed || anyCheatActive)}
          inRun={Boolean(runtimeRef.current)}
          onChange={handleUpdateCheats}
          onHealParty={() => {
            const rt = runtimeRef.current;
            if (!rt) return;
            cheatHealParty(rt);
            setHud(extractHudSnapshot(rt));
          }}
          onClearExpose={() => {
            const rt = runtimeRef.current;
            if (!rt) return;
            cheatClearOrExpose(rt);
            setHud(extractHudSnapshot(rt));
          }}
          onWarpStage={(stage) => {
            const rt = runtimeRef.current;
            if (!rt) return;
            cheatWarpBoss(rt, stage);
            setHud(extractHudSnapshot(rt));
            setShowCheatsModal(false);
            setScreen('PLAYING');
          }}
          onClose={() => setShowCheatsModal(false)}
        />
      )}

      {screen === 'BOON_DRAFT' && boonDraftState && (
        <BoonDraftModal
          clearedStage={boonDraftState.clearedStage}
          choices={boonDraftState.choices}
          isWaitingForHost={activeOnlineRole === 'guest'}
          onPick={handlePickBoon}
        />
      )}

      {screen === 'STAGE_TRANSITION' && transitionTarget && (
        <StageTransitionModal nextStage={transitionTarget} />
      )}

      {(screen === 'GAME_OVER' || screen === 'VICTORY') && runSummary && (
        <EndScreenModal
          summary={runSummary}
          onlineRole={activeOnlineRole}
          onPlayAgain={beginRun}
          onMainMenu={handleReturnToMenu}
        />
      )}

      {screen === 'PLAYING' && hud?.finalVote?.active && (
        <FinalBossVoteModal
          finalVote={hud.finalVote}
          players={hud.players}
          localPlayerId={localPlayerNum}
          playerColors={hudColorMap}
          onVote={(choice) => {
            if (activeOnlineRole === 'guest') {
              onlineSessionRef.current?.send({ type: 'cast_vote', choice });
              return;
            }
            const rt = runtimeRef.current;
            if (!rt) return;
            castFinalVote(rt, 1, choice);
            setHud(extractHudSnapshot(rt));
            if (activeOnlineRole === 'host' && onlineSessionRef.current?.isConnected()) {
              const sfx = pendingSfxRef.current.splice(0);
              onlineSessionRef.current.send({
                type: 'sync',
                snap: serializeRuntimeForSync(rt),
                sfx,
              });
            }
          }}
        />
      )}

      {disconnectModal && (
        <OnlineDisconnectModal
          isHost={disconnectModal.isHost}
          onContinueSolo={disconnectModal.isHost ? handleContinueSolo : undefined}
          onReturnToMenu={handleReturnToMenu}
        />
      )}

      {fullscreenToast}
    </>
  );
}

