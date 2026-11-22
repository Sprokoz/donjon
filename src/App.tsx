import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import {
  BoonDraftModal,
  CheatsModal,
  ControlsModal,
  EndScreenModal,
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
  return {
    x: Math.max(-1, Math.min(1, x)),
    y: Math.max(-1, Math.min(1, y)),
    dash,
    ability,
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
  const [pausedBy, setPausedBy] = useState<1 | 2 | undefined>(undefined);
  const [disconnectModal, setDisconnectModal] = useState<{ isHost: boolean } | null>(null);

  const [playerColors, setPlayerColors] = useState<{ 1: ColorOption; 2: ColorOption }>({
    1: COLOR_OPTIONS[0],
    2: COLOR_OPTIONS[1],
  });
  const [playerClasses, setPlayerClasses] = useState<{ 1: HeroClassId; 2: HeroClassId }>({
    1: 'ronin',
    2: 'phantom',
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

  const numPlayers: 1 | 2 = coopMode === 'solo' ? 1 : 2;
  const activeOnlineRole: OnlineRole = coopMode === 'online' ? onlineLobbyRole : 'none';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const guestDisplayRtRef = useRef<GameRuntime | null>(null);
  const latestGuestSnapRef = useRef<SyncedRuntimeSnapshot | null>(null);
  const remoteP2InputRef = useRef<TouchInputState>({ x: 0, y: 0, dash: false, ability: false });
  const pendingSfxRef = useRef<SfxSyncEvent[]>([]);

  const keysRef = useRef<Record<string, boolean>>({});
  const touchInputRef = useRef<TouchInputState>({ x: 0, y: 0, dash: false, ability: false });
  const controlsRef = useRef<ControlsConfig>(controls);
  const screenRef = useRef<AppScreen>(screen);
  const coopModeRef = useRef<CoopMode>(coopMode);
  const activeOnlineRoleRef = useRef<OnlineRole>(activeOnlineRole);
  const difficultyRef = useRef<DifficultyKey>(difficulty);
  const modeRef = useRef<GameMode>(mode);
  const playerClassesRef = useRef(playerClasses);
  const playerColorsRef = useRef(playerColors);

  const onlineSessionRef = useRef<OnlineSession | null>(null);
  const stageTransitionTimerRef = useRef<number | null>(null);
  const fullscreenNoteTimerRef = useRef<number | null>(null);
  const hostMessageHandlerRef = useRef<(msg: OnlineMessage) => void>(() => {});
  const guestMessageHandlerRef = useRef<(msg: OnlineMessage) => void>(() => {});

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
    remoteP2InputRef.current = { x: 0, y: 0, dash: false, ability: false };
    latestGuestSnapRef.current = null;
    guestDisplayRtRef.current = null;
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
    if (isOnlineHost) {
      pendingSfxRef.current = [];
      soundEngine.setSfxBroadcastHook((ev) => {
        pendingSfxRef.current.push(ev);
      });
    } else {
      soundEngine.setSfxBroadcastHook(null);
    }

    const rt = createInitialGameRuntime({
      difficulty,
      mode: mode === 'tutorial' ? 'campaign' : mode,
      numPlayers,
      playerColors: {
        1: playerColors[1].hex,
        2: playerColors[2].hex,
      },
      playerClasses,
      cheats: isOnlineHost ? DEFAULT_CHEATS : cheats,
    });
    runtimeRef.current = rt;
    guestDisplayRtRef.current = null;
    latestGuestSnapRef.current = null;
    remoteP2InputRef.current = { x: 0, y: 0, dash: false, ability: false };
    keysRef.current = {};
    touchInputRef.current = { x: 0, y: 0, dash: false, ability: false };
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
  }, [coopMode, onlineLobbyRole, difficulty, mode, numPlayers, playerColors, playerClasses, cheats]);

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

  const sendHostLoadout = useCallback(() => {
    if (onlineSessionRef.current?.getRole() !== 'host' || !onlineSessionRef.current.isConnected()) return;
    onlineSessionRef.current.send({
      type: 'loadout',
      payload: {
        heroClass: playerClassesRef.current[1],
        colorHex: playerColorsRef.current[1].hex,
        difficulty: difficultyRef.current,
        mode: modeRef.current,
      },
    });
  }, []);

  const sendGuestLoadout = useCallback(() => {
    if (onlineSessionRef.current?.getRole() !== 'guest' || !onlineSessionRef.current.isConnected()) return;
    onlineSessionRef.current.send({
      type: 'loadout',
      payload: {
        heroClass: playerClassesRef.current[2],
        colorHex: playerColorsRef.current[2].hex,
      },
    });
  }, []);

  useEffect(() => {
    hostMessageHandlerRef.current = (msg: OnlineMessage) => {
      if (msg.type === 'loadout') {
        const matchedColor =
          COLOR_OPTIONS.find((c) => c.hex === msg.payload.colorHex) || playerColorsRef.current[2];
        setPlayerClasses((prev) => ({ ...prev, 2: msg.payload.heroClass }));
        setPlayerColors((prev) => ({ ...prev, 2: matchedColor }));
      } else if (msg.type === 'input') {
        remoteP2InputRef.current = msg.input;
      } else if (msg.type === 'cmd') {
        if (msg.action === 'skip_intro') {
          const rt = runtimeRef.current;
          if (rt && rt.isBossLevel && rt.boss.state === 'comic_intro') {
            skipBossIntro(rt);
            setHud(extractHudSnapshot(rt));
          }
        } else if (msg.action === 'pause') {
          if (screenRef.current === 'PLAYING') {
            setPausedBy(2);
            setScreen('PAUSED');
            onlineSessionRef.current?.send({ type: 'screen', screen: 'PAUSED', pausedBy: 2 });
          }
        } else if (msg.action === 'resume') {
          if (screenRef.current === 'PAUSED') {
            setPausedBy(undefined);
            setScreen('PLAYING');
            onlineSessionRef.current?.send({ type: 'screen', screen: 'PLAYING' });
          }
        } else if (msg.action === 'leave') {
          if (screenRef.current !== 'HERO_SETUP' && screenRef.current !== 'TITLE_MENU') {
            setDisconnectModal({ isHost: true });
          }
        }
      }
    };

    guestMessageHandlerRef.current = (msg: OnlineMessage) => {
      if (msg.type === 'loadout') {
        const matchedColor =
          COLOR_OPTIONS.find((c) => c.hex === msg.payload.colorHex) || playerColorsRef.current[1];
        setPlayerClasses((prev) => ({ ...prev, 1: msg.payload.heroClass }));
        setPlayerColors((prev) => ({ ...prev, 1: matchedColor }));
        if (msg.payload.difficulty) setDifficulty(msg.payload.difficulty);
        if (msg.payload.mode) setMode(msg.payload.mode);
      } else if (msg.type === 'sync') {
        latestGuestSnapRef.current = msg.snap;
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

    const session = new OnlineSession('host', code, {
      onStatusChange: (status, err) => {
        setOnlineStatus(status);
        setOnlineError(err || null);
        if (status === 'connected') {
          sendHostLoadout();
        }
      },
      onMessage: (msg) => hostMessageHandlerRef.current(msg),
      onPartnerDisconnect: () => {
        if (
          screenRef.current !== 'TITLE_MENU' &&
          screenRef.current !== 'HERO_SETUP'
        ) {
          setDisconnectModal({ isHost: true });
          soundEngine.setSfxBroadcastHook(null);
        } else {
          setOnlineStatus('waiting');
          setOnlineError('Partner disconnected. Waiting for another player...');
        }
      },
    });
    onlineSessionRef.current = session;
  }, [destroyOnlineSession, sendHostLoadout]);

  const joinGuestRoom = useCallback(
    (explicitCode?: string) => {
      const code = sanitizeRoomCode(explicitCode ?? joinInput);
      if (code.length < 4) return;
      destroyOnlineSession();
      setJoinInput(code);
      setOnlineError(null);

      const session = new OnlineSession('guest', code, {
        onStatusChange: (status, err) => {
          setOnlineStatus(status);
          setOnlineError(err || null);
          if (status === 'connected') {
            sendGuestLoadout();
          }
        },
        onMessage: (msg) => guestMessageHandlerRef.current(msg),
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
    [joinInput, destroyOnlineSession, sendGuestLoadout]
  );

  // Auto-open Host room when entering HERO_SETUP in 2P ONLINE Host mode
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

  // Sync loadout tweaks cleanly while in HERO_SETUP
  useEffect(() => {
    if (screen === 'HERO_SETUP' && coopMode === 'online' && onlineStatus === 'connected') {
      if (onlineLobbyRole === 'host') sendHostLoadout();
      else sendGuestLoadout();
    }
  }, [screen, coopMode, onlineLobbyRole, onlineStatus, playerClasses, playerColors, difficulty, mode, sendHostLoadout, sendGuestLoadout]);

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
      touchInputRef.current = { x: 0, y: 0, dash: false, ability: false };
      if (activeOnlineRoleRef.current === 'guest' && onlineSessionRef.current?.isConnected()) {
        onlineSessionRef.current.send({
          type: 'input',
          input: { x: 0, y: 0, dash: false, ability: false },
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
    let lastSentGuestInput: TouchInputState = { x: 0, y: 0, dash: false, ability: false };
    let guestInputHeartbeatAccum = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;
      const canvas = canvasRef.current;
      const ctx = canvas ? canvas.getContext('2d') : null;
      const role = activeOnlineRoleRef.current;

      if (role === 'guest') {
        // Guest thin-client: stream Player 2 inputs & render 60fps interpolated Host snapshots
        if (screenRef.current === 'PLAYING' && !showControlsModal && !showCheatsModal) {
          const curInput = readLocalGuestInput(keysRef.current, controlsRef.current, touchInputRef.current);
          const changed =
            Math.abs(curInput.x - lastSentGuestInput.x) > 0.02 ||
            Math.abs(curInput.y - lastSentGuestInput.y) > 0.02 ||
            curInput.dash !== lastSentGuestInput.dash ||
            curInput.ability !== lastSentGuestInput.ability;
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
              role === 'host' ? remoteP2InputRef.current : undefined
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
      if (rt.players[1]) {
        rt.players[1].state = 'spectator';
        rt.players[1].hasKnife = false;
      }
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

  const localPlayerNum: 1 | 2 = activeOnlineRole === 'guest' ? 2 : 1;

  return (
    <>
      {hud && (
        <GameHud
          hud={hud}
          difficulty={difficulty}
          numPlayers={hud.isTutorial ? 1 : numPlayers}
          localPlayerNum={localPlayerNum}
          isOnline={activeOnlineRole !== 'none'}
          playerColors={{ 1: playerColors[1].hex, 2: playerColors[2].hex }}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          showTouchControls={showTouchControls}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
          onToggleMute={handleToggleMute}
          onPause={() => {
            touchInputRef.current = { x: 0, y: 0, dash: false, ability: false };
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

