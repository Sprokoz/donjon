import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import {
  BoonDraftModal,
  CheatsModal,
  ControlsModal,
  EndScreenModal,
  FinalBossVoteModal,
  InventoryModal,
  OnlineDisconnectModal,
  PauseModal,
  ShopNpcModal,
  StageTransitionModal,
  UpdatesModal,
} from './components/Modals';
import { HeroSetup, TitleMenu } from './components/TitleFlow';
import { LandingSplash, SprokozIntro } from './components/IntroSequence';
import { TutorialModal } from './components/TutorialModal';
import {
  advanceTutorialStep,
  applyBoon,
  applyOnlineCheckpointToRuntime,
  castFinalVote,
  cheatClearOrExpose,
  cheatHealParty,
  cheatWarpBoss,
  clearOnlineCheckpoint,
  computeRank,
  createInitialGameRuntime,
  disconnectOnlinePlayerSlot,
  dropBagScroll,
  dropEquippedWeapon,
  extractHudSnapshot,
  GameRuntime,
  getBoonChoices,
  kickOnlinePlayerSlot,
  loadLeaderboard,
  loadOnlineCheckpoint,
  OnlineCampaignCheckpoint,
  purchaseShopItemById,
  restoreOnlinePlayerSlot,
  saveLeaderboardEntry,
  saveOnlineCheckpoint,
  setRuntimeCheats,
  skipBossIntro,
  stepGame,
  switchPracticeBoss,
  switchPracticeWeapon,
  switchTutorialClass,
  switchTutorialWeapon,
  TouchInputState,
  transitionToStage,
  triggerPracticeAttack,
  useBagScroll,
  usePlayerPotion,
} from './game/engine';
import {
  advanceGuestDisplayRuntime,
  applySyncedSnapshotToGuest,
  buildFloorMapSnapshot,
  CoopMode,
  generateRoomCode,
  getInitialRoomCodeFromUrl,
  GuestFloorMapCache,
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
  WeaponId,
} from './game/types';

const CONTROLS_STORAGE_KEY = 'dungeon_bouncer_controls_v3';
const PLAYER_NAME_STORAGE_KEY = 'dungeon_bouncer_player_name_v1';
const P2_NAME_STORAGE_KEY = 'dungeon_bouncer_p2_name_v1';
const NET_OPT_STORAGE_KEY = 'dungeon_bouncer_net_opt_v1';

function loadSavedName(key: string, fallback: string): string {
  try {
    const raw = localStorage.getItem(key);
    return raw && raw.trim() ? raw.trim().slice(0, 14) : fallback;
  } catch {
    return fallback;
  }
}

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
  const usePotion = Boolean(touch.usePotion || keys['c'] || keys['h']);
  return {
    x: Math.max(-1, Math.min(1, x)),
    y: Math.max(-1, Math.min(1, y)),
    dash,
    ability,
    skill2,
    skill3,
    skill4,
    usePotion,
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
  const [optimizeConnection, setOptimizeConnection] = useState<boolean>(() => {
    try {
      return localStorage.getItem(NET_OPT_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [savedCheckpoint, setSavedCheckpoint] = useState<OnlineCampaignCheckpoint | null>(() =>
    loadOnlineCheckpoint()
  );

  const [localPlayerId, setLocalPlayerId] = useState<PlayerId>(1);
  const [localReady, setLocalReady] = useState<boolean>(false);
  const [localPlayerName, setLocalPlayerName] = useState<string>(() =>
    loadSavedName(PLAYER_NAME_STORAGE_KEY, 'Player')
  );
  const [p2LocalName, setP2LocalName] = useState<string>(() =>
    loadSavedName(P2_NAME_STORAGE_KEY, 'Partner')
  );
  const [connectedGuestIds, setConnectedGuestIds] = useState<PlayerId[]>([]);
  const [guestConfigs, setGuestConfigs] = useState<
    Record<number, { colorHex: string; heroClass: HeroClassId; ready: boolean; playerName?: string }>
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
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
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
    return Boolean(window.matchMedia?.('(pointer: coarse)').matches);
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
  const guestFloorCacheRef = useRef<GuestFloorMapCache | null>(null);
  const hostSentFloorRevRef = useRef<number>(-1);
  const latestGuestSnapRef = useRef<SyncedRuntimeSnapshot | null>(null);
  const guestSnapSeqRef = useRef<number>(0);
  const guestAppliedSeqRef = useRef<number>(0);
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
  const localPlayerNameRef = useRef<string>(localPlayerName);
  const guestConfigsRef = useRef(guestConfigs);
  const pingByPlayerRef = useRef(pingByPlayer);
  const showInventoryModalRef = useRef(showInventoryModal);
  const showShopModalRef = useRef(showShopModal);
  const hudRef = useRef<HudSnapshot | null>(hud);
  const optimizeConnectionRef = useRef<boolean>(optimizeConnection);
  const roomCodeRef = useRef<string>(roomCode);
  const lastRoomCodeRef = useRef<string>('');
  const lastSavedCheckpointSigRef = useRef<string>('');
  const disconnectModalRef = useRef<{ isHost: boolean } | null>(disconnectModal);
  const boonDraftStateRef = useRef(boonDraftState);
  const transitionTargetRef = useRef(transitionTarget);
  const pausedByRef = useRef(pausedBy);

  useEffect(() => {
    localPlayerNameRef.current = localPlayerName;
  }, [localPlayerName]);

  useEffect(() => {
    showInventoryModalRef.current = showInventoryModal;
  }, [showInventoryModal]);

  useEffect(() => {
    showShopModalRef.current = showShopModal;
  }, [showShopModal]);

  useEffect(() => {
    hudRef.current = hud;
  }, [hud]);

  useEffect(() => {
    if (screen !== 'PLAYING') {
      setShowInventoryModal(false);
      setShowShopModal(false);
    }
  }, [screen]);

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
    optimizeConnectionRef.current = optimizeConnection;
  }, [optimizeConnection]);

  useEffect(() => {
    roomCodeRef.current = roomCode;
    if (roomCode) lastRoomCodeRef.current = roomCode;
  }, [roomCode]);

  useEffect(() => {
    disconnectModalRef.current = disconnectModal;
  }, [disconnectModal]);

  useEffect(() => {
    boonDraftStateRef.current = boonDraftState;
  }, [boonDraftState]);

  useEffect(() => {
    transitionTargetRef.current = transitionTarget;
  }, [transitionTarget]);

  useEffect(() => {
    pausedByRef.current = pausedBy;
  }, [pausedBy]);

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

  const handleSavePlayerName = useCallback((val: string) => {
    const trimmed = val.slice(0, 14);
    setLocalPlayerName(trimmed);
    localPlayerNameRef.current = trimmed;
    try {
      localStorage.setItem(PLAYER_NAME_STORAGE_KEY, trimmed);
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleSaveP2LocalName = useCallback((val: string) => {
    const trimmed = val.slice(0, 14);
    setP2LocalName(trimmed);
    try {
      localStorage.setItem(P2_NAME_STORAGE_KEY, trimmed);
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleSaveControls = useCallback((next: ControlsConfig) => {
    setControls(next);
    try {
      localStorage.setItem(CONTROLS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, []);

  const destroyOnlineSession = useCallback((preserveMidRun = false) => {
    if (onlineSessionRef.current) {
      onlineSessionRef.current.destroy();
      onlineSessionRef.current = null;
    }
    soundEngine.setSfxBroadcastHook(null);
    pendingSfxRef.current = [];
    remoteInputsRef.current = {};
    if (!preserveMidRun) {
      latestGuestSnapRef.current = null;
      guestSnapSeqRef.current = 0;
      guestAppliedSeqRef.current = 0;
      guestDisplayRtRef.current = null;
      guestFloorCacheRef.current = null;
      hostSentFloorRevRef.current = -1;
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
    }
  }, []);

  const handleOptimizeConnection = useCallback(() => {
    const next = !optimizeConnectionRef.current;
    optimizeConnectionRef.current = next;
    setOptimizeConnection(next);
    try {
      localStorage.setItem(NET_OPT_STORAGE_KEY, next ? '1' : '0');
    } catch {
      // ignore storage errors
    }

    const session = onlineSessionRef.current;
    if (session) {
      session.setLowBandwidth(next);
      session.reopenStream();
      if (session.getRole() === 'host' && runtimeRef.current && session.isConnected()) {
        const rt = runtimeRef.current;
        if (rt.isOnlineCampaign) {
          const fm = buildFloorMapSnapshot(rt);
          if (fm) {
            hostSentFloorRevRef.current = rt.floorMapRev;
            session.send({ type: 'floor_sync', rev: rt.floorMapRev, stage: rt.stage, floorMap: fm });
          }
        }
        const sfx = pendingSfxRef.current.splice(0);
        session.send({ type: 'sync', snap: serializeRuntimeForSync(rt, next), sfx });
      }
    }
    showFullscreenNotice(
      next
        ? 'Optimize Connection ON: Low-ping packet compression & stream refresh applied.'
        : 'Optimize Connection OFF: Standard full-VFX sync restored.'
    );
  }, [showFullscreenNotice]);

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
      if (rt.isOnlineCampaign && activeOnlineRoleRef.current === 'host') {
        clearOnlineCheckpoint();
        setSavedCheckpoint(null);
        lastSavedCheckpointSigRef.current = '';
      }
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
          if (rt.isOnlineCampaign) {
            const cp = saveOnlineCheckpoint(rt, roomCodeRef.current);
            if (cp) setSavedCheckpoint(cp);
            const fm = buildFloorMapSnapshot(rt);
            if (fm) {
              hostSentFloorRevRef.current = rt.floorMapRev;
              onlineSessionRef.current.send({
                type: 'floor_sync',
                rev: rt.floorMapRev,
                stage: rt.stage,
                floorMap: fm,
              });
            }
          }
          const sfx = pendingSfxRef.current.splice(0);
          onlineSessionRef.current.send({
            type: 'sync',
            snap: serializeRuntimeForSync(rt, optimizeConnectionRef.current),
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

  const beginRun = useCallback((resumeFromCheckpoint = false) => {
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
    const resolvedNames: Record<number, string> = {};
    resolvedNames[1] = localPlayerName.trim() || 'Player 1';
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
      if (pid > 1) {
        resolvedNames[pid] = isOnlineHost
          ? guestConfigs[pid]?.playerName?.trim() || `Player ${pid}`
          : pid === 2
          ? p2LocalName.trim() || 'Player 2'
          : `Player ${pid}`;
      }
    }

    const cpToUse = resumeFromCheckpoint && isOnlineCampaign ? savedCheckpoint : null;
    const rt = createInitialGameRuntime({
      difficulty: cpToUse ? cpToUse.difficulty : difficulty,
      mode: mode === 'tutorial' ? 'campaign' : mode,
      numPlayers: activePlayerIds.length,
      isOnlineCampaign,
      activePlayerIds,
      playerColors: resolvedColors,
      playerClasses: resolvedClasses,
      playerNames: resolvedNames,
      cheats: isOnlineHost ? DEFAULT_CHEATS : cheats,
    });
    if (cpToUse) {
      applyOnlineCheckpointToRuntime(rt, cpToUse);
    }
    rt.pingByPlayer = isOnlineHost
      ? onlineSessionRef.current?.getPingByPlayer() || { 1: 0 }
      : { 1: 0 };

    runtimeRef.current = rt;
    guestDisplayRtRef.current = null;
    guestFloorCacheRef.current = null;
    hostSentFloorRevRef.current = -1;
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

    if (isOnlineCampaign) {
      const cp = saveOnlineCheckpoint(rt, roomCodeRef.current);
      if (cp) setSavedCheckpoint(cp);
      lastSavedCheckpointSigRef.current = `${rt.floorNumber}_${rt.loopLevel}_${rt.bossesDefeatedCount}_${rt.roomDepth}`;
    }

    if (isOnlineHost && onlineSessionRef.current?.isConnected()) {
      onlineSessionRef.current.send({ type: 'screen', screen: 'PLAYING' });
      if (rt.isOnlineCampaign) {
        const fm = buildFloorMapSnapshot(rt);
        if (fm) {
          hostSentFloorRevRef.current = rt.floorMapRev;
          onlineSessionRef.current.send({
            type: 'floor_sync',
            rev: rt.floorMapRev,
            stage: rt.stage,
            floorMap: fm,
          });
        }
      }
      const sfx = pendingSfxRef.current.splice(0);
      onlineSessionRef.current.send({
        type: 'sync',
        snap: serializeRuntimeForSync(rt, optimizeConnectionRef.current),
        sfx,
      });
    }
  }, [coopMode, onlineLobbyRole, difficulty, mode, playerColors, playerClasses, guestConfigs, cheats, localPlayerName, p2LocalName, savedCheckpoint]);

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
      playerNames: {
        1: localPlayerName.trim() || 'Trainee',
      },
    });
    runtimeRef.current = rt;
    keysRef.current = {};
    touchInputRef.current = { x: 0, y: 0, dash: false, ability: false };
    setBoonDraftState(null);
    setTransitionTarget(null);
    setRunSummary(null);
    setHud(extractHudSnapshot(rt));
    setScreen('PLAYING');
  }, [playerColors, playerClasses, localPlayerName]);

  const buildHostRoster = useCallback(
    (
      overrideGuests?: Record<number, { colorHex: string; heroClass: HeroClassId; ready: boolean; playerName?: string }>,
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
          playerName: localPlayerNameRef.current.trim() || 'Player 1',
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
          playerName: cfg?.playerName?.trim() || `Player ${gid}`,
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
      overrideGuests?: Record<number, { colorHex: string; heroClass: HeroClassId; ready: boolean; playerName?: string }>,
      overridePings?: Record<number, number | null>
    ) => {
      const session = onlineSessionRef.current;
      if (!session || session.getRole() !== 'host') return;
      const maxPlayers =
        modeRef.current === 'campaign' || modeRef.current === 'teamwork_practice' ? 5 : 2;
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
      playerName: localPlayerNameRef.current.trim() || `Player ${pid}`,
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
            playerName: msg.playerName?.trim() || guestConfigsRef.current[fromPlayerId]?.playerName || `Player ${fromPlayerId}`,
          },
        };
        guestConfigsRef.current = nextGuests;
        setGuestConfigs(nextGuests);
        setPlayerClasses((prev) => ({ ...prev, [fromPlayerId]: msg.heroClass }));
        setPlayerColors((prev) => ({ ...prev, [fromPlayerId]: matchedColor }));
        if (screenRef.current === 'HERO_SETUP') {
          broadcastHostLobbyState(nextGuests);
        } else if (runtimeRef.current) {
          const rt = runtimeRef.current;
          const pSlot = rt.players.find((p) => p.id === fromPlayerId);
          if (pSlot) {
            if (nextGuests[fromPlayerId]?.playerName) pSlot.name = nextGuests[fromPlayerId].playerName!;
            pSlot.color = matchedColor.hex;
            rt.playerColors[fromPlayerId] = matchedColor.hex;
            rt.playerNames[fromPlayerId] = pSlot.name;
          }
        }
      } else if (msg.type === 'loadout') {
        const matchedColor =
          COLOR_OPTIONS.find((c) => c.hex === msg.payload.colorHex) || playerColorsRef.current[fromPlayerId] || COLOR_OPTIONS[1];
        const nextGuests = {
          ...guestConfigsRef.current,
          [fromPlayerId]: {
            colorHex: matchedColor.hex,
            heroClass: msg.payload.heroClass,
            ready: Boolean(msg.payload.ready),
            playerName: msg.payload.playerName?.trim() || guestConfigsRef.current[fromPlayerId]?.playerName || `Player ${fromPlayerId}`,
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
              snap: serializeRuntimeForSync(rt, optimizeConnectionRef.current),
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
        } else if (msg.action === 'use_potion') {
          const rt = runtimeRef.current;
          const gp = rt?.players.find((pl) => pl.id === fromPlayerId);
          if (rt && gp) {
            usePlayerPotion(rt, gp);
            setHud(extractHudSnapshot(rt));
          }
        } else if (msg.action === 'drop_weapon') {
          const rt = runtimeRef.current;
          const gp = rt?.players.find((pl) => pl.id === fromPlayerId);
          if (rt && gp) {
            dropEquippedWeapon(rt, gp);
            setHud(extractHudSnapshot(rt));
          }
        } else if (msg.action === 'use_scroll') {
          const rt = runtimeRef.current;
          const gp = rt?.players.find((pl) => pl.id === fromPlayerId);
          if (rt && gp) {
            useBagScroll(rt, gp, msg.scrollId);
            setHud(extractHudSnapshot(rt));
          }
        } else if (msg.action === 'drop_scroll') {
          const rt = runtimeRef.current;
          const gp = rt?.players.find((pl) => pl.id === fromPlayerId);
          if (rt && gp) {
            dropBagScroll(rt, gp, msg.scrollId);
            setHud(extractHudSnapshot(rt));
          }
        } else if (msg.action === 'buy_shop_item') {
          const rt = runtimeRef.current;
          const gp = rt?.players.find((pl) => pl.id === fromPlayerId);
          if (rt && gp) {
            purchaseShopItemById(rt, gp, msg.itemId);
            setHud(extractHudSnapshot(rt));
          }
        } else if (msg.action === 'switch_practice_weapon') {
          const rt = runtimeRef.current;
          if (rt && msg.weaponId !== 'none') {
            switchPracticeWeapon(rt, fromPlayerId, msg.weaponId);
            setHud(extractHudSnapshot(rt));
          }
        } else if (msg.action === 'trigger_practice_attack') {
          const rt = runtimeRef.current;
          if (rt && fromPlayerId === 1) {
            triggerPracticeAttack(rt, msg.kind);
            setHud(extractHudSnapshot(rt));
          }
        } else if (msg.action === 'switch_practice_boss') {
          const rt = runtimeRef.current;
          if (rt && fromPlayerId === 1) {
            switchPracticeBoss(rt, msg.stage);
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
        } else if (msg.action === 'resync_me') {
          const rt = runtimeRef.current;
          const session = onlineSessionRef.current;
          if (rt && session) {
            session.send(
              {
                type: 'screen',
                screen: screenRef.current,
                pausedBy: pausedByRef.current,
                boonDraft: boonDraftStateRef.current
                  ? {
                      clearedStage: boonDraftStateRef.current.clearedStage,
                      nextStage: boonDraftStateRef.current.nextStage,
                      choices: boonDraftStateRef.current.choices,
                    }
                  : undefined,
                transitionTarget: transitionTargetRef.current,
              },
              fromPlayerId
            );
            if (rt.isOnlineCampaign) {
              const fm = buildFloorMapSnapshot(rt);
              if (fm) {
                session.send(
                  { type: 'floor_sync', rev: rt.floorMapRev, stage: rt.stage, floorMap: fm },
                  fromPlayerId
                );
              }
            }
            session.send(
              { type: 'sync', snap: serializeRuntimeForSync(rt, optimizeConnectionRef.current), sfx: [] },
              fromPlayerId
            );
          }
        } else if (msg.action === 'leave') {
          if (screenRef.current !== 'HERO_SETUP' && screenRef.current !== 'TITLE_MENU') {
            const rt = runtimeRef.current;
            if (rt) {
              disconnectOnlinePlayerSlot(rt, fromPlayerId);
              setHud(extractHudSnapshot(rt));
              if (rt.isOnlineCampaign) {
                const cp = saveOnlineCheckpoint(rt, roomCodeRef.current);
                if (cp) setSavedCheckpoint(cp);
              }
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
      } else if (msg.type === 'floor_sync') {
        guestFloorCacheRef.current = {
          rev: msg.rev,
          stage: msg.stage,
          floorMap: msg.floorMap,
        };
      } else if (msg.type === 'sync') {
        latestGuestSnapRef.current = msg.snap;
        guestSnapSeqRef.current += 1;
        if (disconnectModalRef.current) {
          setDisconnectModal(null);
        }
        if (msg.snap.floorMap) {
          guestFloorCacheRef.current = {
            rev: msg.snap.floorMapRev,
            stage: msg.snap.stage,
            floorMap: msg.snap.floorMap,
          };
        }
        if (msg.snap.pingByPlayer) {
          const prevP = pingByPlayerRef.current;
          const nextP = msg.snap.pingByPlayer;
          const keysNext = Object.keys(nextP);
          const pingChanged =
            keysNext.length !== Object.keys(prevP).length ||
            keysNext.some((k) => prevP[Number(k)] !== nextP[Number(k)]);
          if (pingChanged) {
            pingByPlayerRef.current = nextP;
            setPingByPlayer(nextP);
          }
        }
        if (msg.sfx && msg.sfx.length > 0) {
          msg.sfx.forEach((ev) => soundEngine.replaySfxEvent(ev));
        }
      } else if (msg.type === 'sfx') {
        msg.events.forEach((ev) => soundEngine.replaySfxEvent(ev));
      } else if (msg.type === 'screen') {
        if (disconnectModalRef.current) {
          setDisconnectModal(null);
        }
        if (msg.screen === 'PLAYING') {
          setBoonDraftState(null);
          setTransitionTarget(null);
          setRunSummary(null);
          setPausedBy(undefined);
          if (screenRef.current === 'HERO_SETUP') {
            guestDisplayRtRef.current = null;
            guestAppliedSeqRef.current = 0;
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
    roomCodeRef.current = code;
    lastRoomCodeRef.current = code;
    setOnlineError(null);
    setLocalPlayerId(1);
    setLocalReady(false);

    const maxP = modeRef.current === 'campaign' || modeRef.current === 'teamwork_practice' ? 5 : 2;
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
          const existingCfg = guestConfigsRef.current[playerId];
          const defaultCol = existingCfg?.colorHex || COLOR_OPTIONS[playerId - 1]?.hex || '#22d3ee';
          const defaultCls =
            existingCfg?.heroClass ||
            ((['ronin', 'phantom', 'vanguard', 'volt', 'ronin'][playerId - 1] || 'phantom') as HeroClassId);
          const nextGuests = {
            ...guestConfigsRef.current,
            [playerId]: {
              colorHex: defaultCol,
              heroClass: defaultCls,
              ready: existingCfg?.ready ?? false,
              playerName: existingCfg?.playerName,
            },
          };
          guestConfigsRef.current = nextGuests;
          setGuestConfigs(nextGuests);

          if (screenRef.current !== 'HERO_SETUP' && screenRef.current !== 'TITLE_MENU' && runtimeRef.current) {
            const rt = runtimeRef.current;
            restoreOnlinePlayerSlot(rt, playerId, {
              playerName: existingCfg?.playerName || rt.playerNames[playerId],
              colorHex: defaultCol,
              heroClass: defaultCls,
            });
            soundEngine.setSfxBroadcastHook((ev) => {
              pendingSfxRef.current.push(ev);
            });
            setDisconnectModal(null);
            setHud(extractHudSnapshot(rt));
            if (curSession) {
              curSession.send(
                {
                  type: 'screen',
                  screen: screenRef.current,
                  pausedBy: pausedByRef.current,
                  boonDraft: boonDraftStateRef.current
                    ? {
                        clearedStage: boonDraftStateRef.current.clearedStage,
                        nextStage: boonDraftStateRef.current.nextStage,
                        choices: boonDraftStateRef.current.choices,
                      }
                    : undefined,
                  transitionTarget: transitionTargetRef.current,
                },
                playerId
              );
              if (rt.isOnlineCampaign) {
                const fm = buildFloorMapSnapshot(rt);
                if (fm) {
                  curSession.send(
                    { type: 'floor_sync', rev: rt.floorMapRev, stage: rt.stage, floorMap: fm },
                    playerId
                  );
                }
              }
              curSession.send(
                { type: 'sync', snap: serializeRuntimeForSync(rt, optimizeConnectionRef.current), sfx: [] },
                playerId
              );
            }
          } else {
            broadcastHostLobbyState(nextGuests);
          }
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
            if (screenRef.current === 'HERO_SETUP' || screenRef.current === 'TITLE_MENU') {
              const nextGuests = { ...guestConfigsRef.current };
              delete nextGuests[disconnectedPlayerId];
              guestConfigsRef.current = nextGuests;
              setGuestConfigs(nextGuests);
            }
          }

          if (screenRef.current !== 'TITLE_MENU' && screenRef.current !== 'HERO_SETUP') {
            const rt = runtimeRef.current;
            if (rt && disconnectedPlayerId !== undefined) {
              disconnectOnlinePlayerSlot(rt, disconnectedPlayerId);
              setHud(extractHudSnapshot(rt));
              if (rt.isOnlineCampaign) {
                const cp = saveOnlineCheckpoint(rt, roomCodeRef.current);
                if (cp) setSavedCheckpoint(cp);
              }
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
    session.setLowBandwidth(optimizeConnectionRef.current);
    onlineSessionRef.current = session;
  }, [destroyOnlineSession, broadcastHostLobbyState]);

  const joinGuestRoom = useCallback(
    (explicitCode?: string, preserveMidRun = false) => {
      const code = sanitizeRoomCode(explicitCode ?? (joinInput || lastRoomCodeRef.current));
      if (code.length < 4) return;
      destroyOnlineSession(preserveMidRun);
      lastRoomCodeRef.current = code;
      setJoinInput(code);
      setOnlineError(null);
      if (!preserveMidRun) setLocalReady(false);

      const session = new OnlineSession(
        'guest',
        code,
        {
          onStatusChange: (status, err) => {
            setOnlineStatus(status);
            setOnlineError(err || null);
            if (status === 'connected') {
              sendGuestConfig();
              if (preserveMidRun || (screenRef.current !== 'TITLE_MENU' && screenRef.current !== 'HERO_SETUP')) {
                window.setTimeout(() => {
                  session.send({ type: 'cmd', action: 'resync_me' });
                }, 80);
              }
            }
          },
          onAssignedSlot: (assignedId) => {
            localPlayerIdRef.current = assignedId;
            setLocalPlayerId(assignedId);
            setPlayerColors((prev) => ({
              ...prev,
              [assignedId]: prev[assignedId] || COLOR_OPTIONS[assignedId - 1] || COLOR_OPTIONS[1],
            }));
            window.setTimeout(() => {
              sendGuestConfig();
              if (preserveMidRun || (screenRef.current !== 'TITLE_MENU' && screenRef.current !== 'HERO_SETUP')) {
                session.send({ type: 'cmd', action: 'resync_me' });
              }
            }, 40);
          },
          onMessage: (msg, fromId) => guestMessageHandlerRef.current(msg, fromId),
          onKicked: (reason) => {
            setDisconnectModal(null);
            setOnlineStatus('error');
            setOnlineError(reason);
            soundEngine.stopMusic();
            runtimeRef.current = null;
            guestDisplayRtRef.current = null;
            latestGuestSnapRef.current = null;
            setHud(null);
            setScreen('HERO_SETUP');
          },
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
        },
        5,
        localPlayerNameRef.current
      );
      session.setLowBandwidth(optimizeConnectionRef.current);
      onlineSessionRef.current = session;
    },
    [joinInput, destroyOnlineSession, sendGuestConfig]
  );

  const handleGuestReconnect = useCallback(() => {
    const code = sanitizeRoomCode(lastRoomCodeRef.current || joinInput || roomCodeRef.current);
    if (code.length < 4) {
      setOnlineError('Room code missing. Return to Menu to rejoin.');
      return;
    }
    joinGuestRoom(code, true);
  }, [joinGuestRoom, joinInput]);

  const handleWaitForReconnect = useCallback(() => {
    setDisconnectModal(null);
    setPausedBy(1);
    setScreen('PAUSED');
  }, []);

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
    localPlayerName,
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
        if (showInventoryModalRef.current) {
          setShowInventoryModal(false);
          return;
        }
        if (showShopModalRef.current) {
          setShowShopModal(false);
          return;
        }
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
      if ((k === 'i' || k === 'b') && screenRef.current === 'PLAYING') {
        const curHud = hudRef.current;
        if (curHud?.isOnlineCampaign && !curHud.isTutorial && !showControlsModal && !showCheatsModal) {
          e.preventDefault();
          soundEngine.playUiClick();
          setShowShopModal(false);
          setShowInventoryModal((prev) => !prev);
          keysRef.current = {};
          return;
        }
      }
      if (k === (controlsRef.current.p1.ability || 'e') && screenRef.current === 'PLAYING') {
        const curHud = hudRef.current;
        const myPid = activeOnlineRoleRef.current === 'guest' ? localPlayerIdRef.current : 1;
        const me = curHud?.players?.find((pl) => pl.id === myPid);
        if (
          curHud?.isOnlineCampaign &&
          !curHud.isTutorial &&
          me?.nearMerchant &&
          curHud?.shopCatalog &&
          curHud.shopCatalog.length > 0 &&
          !showInventoryModalRef.current &&
          !showControlsModal &&
          !showCheatsModal
        ) {
          e.preventDefault();
          soundEngine.playUiClick();
          setShowShopModal((prev) => !prev);
          keysRef.current = {};
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

    const onBeforeUnload = () => {
      if (activeOnlineRoleRef.current === 'guest' && onlineSessionRef.current?.isConnected()) {
        onlineSessionRef.current.send({ type: 'cmd', action: 'leave' });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('pagehide', onBeforeUnload);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('pagehide', onBeforeUnload);
      window.removeEventListener('beforeunload', onBeforeUnload);
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
        // Guest thin-client: stream inputs immediately & run 60/120fps client prediction + interpolation
        const uiModalOpen = showControlsModal || showCheatsModal || showInventoryModalRef.current || showShopModalRef.current;
        const curInput: TouchInputState =
          screenRef.current !== 'PLAYING' || uiModalOpen
            ? { x: 0, y: 0, dash: false, ability: false, skill2: false, skill3: false, skill4: false, usePotion: false }
            : readLocalGuestInput(keysRef.current, controlsRef.current, touchInputRef.current);

        if (screenRef.current === 'PLAYING') {
          const changed =
            Math.abs(curInput.x - lastSentGuestInput.x) > 0.02 ||
            Math.abs(curInput.y - lastSentGuestInput.y) > 0.02 ||
            curInput.dash !== lastSentGuestInput.dash ||
            curInput.ability !== lastSentGuestInput.ability ||
            Boolean(curInput.skill2) !== Boolean(lastSentGuestInput.skill2) ||
            Boolean(curInput.skill3) !== Boolean(lastSentGuestInput.skill3) ||
            Boolean(curInput.skill4) !== Boolean(lastSentGuestInput.skill4) ||
            Boolean(curInput.usePotion) !== Boolean(lastSentGuestInput.usePotion);
          guestInputHeartbeatAccum += dt;
          if (changed || guestInputHeartbeatAccum >= 0.15) {
            guestInputHeartbeatAccum = 0;
            lastSentGuestInput = curInput;
            onlineSessionRef.current?.send({ type: 'input', input: curInput });
          }
        }

        const latestSnap = latestGuestSnapRef.current;
        if (latestSnap) {
          const hasNewSnap = guestAppliedSeqRef.current !== guestSnapSeqRef.current || !guestDisplayRtRef.current;
          let displayRt = guestDisplayRtRef.current;
          if (hasNewSnap) {
            guestAppliedSeqRef.current = guestSnapSeqRef.current;
            const myPing = pingByPlayerRef.current[localPlayerIdRef.current] ?? null;
            displayRt = applySyncedSnapshotToGuest(
              displayRt,
              latestSnap,
              dt,
              guestFloorCacheRef.current,
              myPing,
              localPlayerIdRef.current,
              curInput
            );
            guestDisplayRtRef.current = displayRt;
          } else if (displayRt) {
            advanceGuestDisplayRuntime(displayRt, dt, localPlayerIdRef.current, curInput);
          }

          if (displayRt) {
            if (ctx) {
              renderGame(ctx, displayRt, localPlayerIdRef.current);
            }
            hudSyncAccum += dt;
            if (hudSyncAccum >= 0.12) {
              hudSyncAccum = 0;
              setHud(extractHudSnapshot(displayRt));
            }
          }
        }
      } else {
        // Solo, Local 2P, or Online Host authoritative simulation
        const rt = runtimeRef.current;
        if (rt && canvas) {
          if (screenRef.current === 'PLAYING' && !showControlsModal && !showCheatsModal && !disconnectModalRef.current) {
            const hostModalOpen = showInventoryModalRef.current || showShopModalRef.current;
            stepGame(
              rt,
              dt,
              hostModalOpen ? {} : keysRef.current,
              controlsRef.current,
              hostModalOpen ? { x: 0, y: 0, dash: false, ability: false } : touchInputRef.current,
              role === 'host' ? remoteInputsRef.current : undefined
            );

            if (rt.isOnlineCampaign && role === 'host') {
              const sig = `${rt.floorNumber}_${rt.loopLevel}_${rt.bossesDefeatedCount}_${rt.roomDepth}`;
              if (sig !== lastSavedCheckpointSigRef.current) {
                lastSavedCheckpointSigRef.current = sig;
                const cp = saveOnlineCheckpoint(rt, roomCodeRef.current);
                if (cp) setSavedCheckpoint(cp);
              }
            }

            if (rt.pendingEvent) {
              const ev = rt.pendingEvent;
              rt.pendingEvent = null;
              setHud(extractHudSnapshot(rt));

              if (role === 'host' && onlineSessionRef.current?.isConnected()) {
                const sfx = pendingSfxRef.current.splice(0);
                onlineSessionRef.current.send({
                  type: 'sync',
                  snap: serializeRuntimeForSync(rt, optimizeConnectionRef.current),
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
              if (hudSyncAccum >= 0.11) {
                hudSyncAccum = 0;
                setHud(extractHudSnapshot(rt));
              }

              if (role === 'host' && onlineSessionRef.current?.isConnected()) {
                if (rt.isOnlineCampaign && rt.floorMapRev !== hostSentFloorRevRef.current) {
                  const fm = buildFloorMapSnapshot(rt);
                  if (fm) {
                    hostSentFloorRevRef.current = rt.floorMapRev;
                    onlineSessionRef.current.send({
                      type: 'floor_sync',
                      rev: rt.floorMapRev,
                      stage: rt.stage,
                      floorMap: fm,
                    });
                  }
                }
                const entityLoad = rt.bossProjectiles.length + rt.enemies.length + rt.playerProjectiles.length;
                const syncInterval = optimizeConnectionRef.current
                  ? entityLoad > 40
                    ? 0.06
                    : 0.048
                  : entityLoad > 45
                  ? 0.045
                  : 0.033;
                netSyncAccum += dt;
                if (netSyncAccum >= syncInterval) {
                  netSyncAccum = 0;
                  const sfx = pendingSfxRef.current.slice(0);
                  const sent = onlineSessionRef.current.send({
                    type: 'sync',
                    snap: serializeRuntimeForSync(rt, optimizeConnectionRef.current),
                    sfx,
                  });
                  if (sent) {
                    pendingSfxRef.current.splice(0, sfx.length);
                  } else if (pendingSfxRef.current.length > 24) {
                    pendingSfxRef.current.splice(0, pendingSfxRef.current.length - 12);
                  }
                }
              }
            }
          } else if (role === 'host' && pendingSfxRef.current.length > 0 && onlineSessionRef.current?.isConnected()) {
            const events = pendingSfxRef.current.splice(0);
            onlineSessionRef.current.send({ type: 'sfx', events });
          }

          if (ctx) {
            const viewerId = coopModeRef.current === 'local' ? undefined : (1 as PlayerId);
            renderGame(ctx, rt, viewerId);
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
    const rt = runtimeRef.current;
    if (rt && rt.isOnlineCampaign && activeOnlineRoleRef.current === 'host') {
      const cp = saveOnlineCheckpoint(rt, roomCodeRef.current);
      if (cp) setSavedCheckpoint(cp);
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

  const handleKickPlayer = useCallback(
    (playerId: PlayerId) => {
      if (activeOnlineRoleRef.current !== 'host' || playerId === 1) return;
      const session = onlineSessionRef.current;
      if (!session) return;
      session.kickGuest(playerId, 'You were removed from the party by the Host.');
      delete remoteInputsRef.current[playerId];
      const nextGuests = { ...guestConfigsRef.current };
      delete nextGuests[playerId];
      guestConfigsRef.current = nextGuests;
      setGuestConfigs(nextGuests);
      const remaining = session.getConnectedGuestIds();
      setConnectedGuestIds(remaining);

      const rt = runtimeRef.current;
      if (rt) {
        kickOnlinePlayerSlot(rt, playerId);
        setHud(extractHudSnapshot(rt));
        if (session.isConnected()) {
          session.send({
            type: 'sync',
            snap: serializeRuntimeForSync(rt, optimizeConnectionRef.current),
            sfx: [],
          });
        }
      } else {
        broadcastHostLobbyState(nextGuests);
      }
    },
    [broadcastHostLobbyState]
  );

  const handleUsePotion = useCallback(() => {
    if (activeOnlineRoleRef.current === 'guest') {
      onlineSessionRef.current?.send({ type: 'cmd', action: 'use_potion' });
      return;
    }
    const rt = runtimeRef.current;
    if (!rt) return;
    const p1 = rt.players.find((pl) => pl.id === 1);
    if (p1 && usePlayerPotion(rt, p1)) {
      setHud(extractHudSnapshot(rt));
    }
  }, []);

  const handleDropWeapon = useCallback(() => {
    if (activeOnlineRoleRef.current === 'guest') {
      onlineSessionRef.current?.send({ type: 'cmd', action: 'drop_weapon' });
      return;
    }
    const rt = runtimeRef.current;
    if (!rt) return;
    const p1 = rt.players.find((pl) => pl.id === 1);
    if (p1) {
      dropEquippedWeapon(rt, p1);
      setHud(extractHudSnapshot(rt));
    }
  }, []);

  const handleUseScroll = useCallback((scrollId: number) => {
    if (activeOnlineRoleRef.current === 'guest') {
      onlineSessionRef.current?.send({ type: 'cmd', action: 'use_scroll', scrollId });
      return;
    }
    const rt = runtimeRef.current;
    if (!rt) return;
    const p1 = rt.players.find((pl) => pl.id === 1);
    if (p1 && useBagScroll(rt, p1, scrollId)) {
      setHud(extractHudSnapshot(rt));
    }
  }, []);

  const handleDropScroll = useCallback((scrollId: number) => {
    if (activeOnlineRoleRef.current === 'guest') {
      onlineSessionRef.current?.send({ type: 'cmd', action: 'drop_scroll', scrollId });
      return;
    }
    const rt = runtimeRef.current;
    if (!rt) return;
    const p1 = rt.players.find((pl) => pl.id === 1);
    if (p1 && dropBagScroll(rt, p1, scrollId)) {
      setHud(extractHudSnapshot(rt));
    }
  }, []);

  const handleBuyShopItem = useCallback((itemId: number) => {
    if (activeOnlineRoleRef.current === 'guest') {
      onlineSessionRef.current?.send({ type: 'cmd', action: 'buy_shop_item', itemId });
      return;
    }
    const rt = runtimeRef.current;
    if (!rt) return;
    const p1 = rt.players.find((pl) => pl.id === 1);
    if (p1 && purchaseShopItemById(rt, p1, itemId)) {
      setHud(extractHudSnapshot(rt));
    }
  }, []);

  const handleOpenInventory = useCallback(() => {
    keysRef.current = {};
    setShowShopModal(false);
    setShowInventoryModal(true);
  }, []);

  const handleOpenShop = useCallback(() => {
    keysRef.current = {};
    setShowInventoryModal(false);
    setShowShopModal(true);
  }, []);

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
          onOpenUpdates={() => setShowUpdatesModal(true)}
        />
        {fullscreenToast}
        {showUpdatesModal && <UpdatesModal onClose={() => setShowUpdatesModal(false)} />}
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
          onOpenSettings={() => setShowControlsModal(true)}
          onOpenUpdates={() => setShowUpdatesModal(true)}
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
        {showControlsModal && (
          <ControlsModal
            controls={controls}
            numPlayers={numPlayers}
            optimizeConnection={optimizeConnection}
            onOptimizeConnection={handleOptimizeConnection}
            onChange={handleSaveControls}
            onClose={() => setShowControlsModal(false)}
          />
        )}
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
        {showUpdatesModal && <UpdatesModal onClose={() => setShowUpdatesModal(false)} />}
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
          onDisconnectOnline={() => destroyOnlineSession()}
          onKickPlayer={handleKickPlayer}
          difficulty={difficulty}
          mode={mode}
          playerColors={playerColors}
          onSelectColor={(pid, col) => setPlayerColors((prev) => ({ ...prev, [pid]: col }))}
          playerClasses={playerClasses}
          onSelectClass={(pid, cls) => setPlayerClasses((prev) => ({ ...prev, [pid]: cls }))}
          localPlayerName={localPlayerName}
          onChangeLocalPlayerName={handleSavePlayerName}
          p2LocalName={p2LocalName}
          onChangeP2LocalName={handleSaveP2LocalName}
          isMuted={isMuted}
          menuAudioBlocked={menuAudioBlocked}
          onToggleMute={handleToggleMute}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          optimizeConnection={optimizeConnection}
          onToggleOptimizeConnection={handleOptimizeConnection}
          savedCheckpoint={savedCheckpoint}
          onResumeCheckpoint={() => beginRun(true)}
          onDiscardCheckpoint={() => {
            clearOnlineCheckpoint();
            setSavedCheckpoint(null);
          }}
          onBack={() => {
            destroyOnlineSession();
            setScreen('TITLE_MENU');
          }}
          onStart={() => beginRun(false)}
        />
        {fullscreenToast}
      </>
    );
  }

  const localPlayerNum: PlayerId = activeOnlineRole === 'guest' ? localPlayerId : 1;
  const pausedByName = pausedBy
    ? hud?.players?.find((p) => p.id === pausedBy)?.name || `Player ${pausedBy}`
    : undefined;
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
          isOnlineHost={activeOnlineRole === 'host'}
          onKickPlayer={handleKickPlayer}
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
          onSwitchTutorialWeapon={(weapon: WeaponId) => {
            const rt = runtimeRef.current;
            if (!rt) return;
            switchTutorialWeapon(rt, weapon);
            setHud(extractHudSnapshot(rt));
          }}
          onSwitchPracticeWeapon={(weapon) => {
            if (activeOnlineRole === 'guest') {
              onlineSessionRef.current?.send({
                type: 'cmd',
                action: 'switch_practice_weapon',
                weaponId: weapon,
              });
              return;
            }
            const rt = runtimeRef.current;
            if (!rt) return;
            switchPracticeWeapon(rt, 1, weapon);
            setHud(extractHudSnapshot(rt));
          }}
          onTriggerPracticeAttack={(attackKind) => {
            if (activeOnlineRole === 'guest') return;
            const rt = runtimeRef.current;
            if (!rt) return;
            triggerPracticeAttack(rt, attackKind);
            setHud(extractHudSnapshot(rt));
          }}
          onSwitchPracticeBoss={(bossStage) => {
            if (activeOnlineRole === 'guest') return;
            const rt = runtimeRef.current;
            if (!rt) return;
            switchPracticeBoss(rt, bossStage);
            setHud(extractHudSnapshot(rt));
          }}
          onUsePotion={handleUsePotion}
          onOpenInventory={handleOpenInventory}
          onOpenShop={handleOpenShop}
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
            data-arena-canvas="true"
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
          roomCode={activeOnlineRole === 'host' ? roomCode : lastRoomCodeRef.current || joinInput}
          optimizeConnection={optimizeConnection}
          onOptimizeConnection={handleOptimizeConnection}
          pausedBy={pausedBy}
          pausedByName={pausedByName}
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
          onRestart={hud?.isTutorial ? beginTutorial : () => beginRun(false)}
          onMenu={handleReturnToMenu}
        />
      )}

      {showControlsModal && (
        <ControlsModal
          controls={controls}
          numPlayers={activeOnlineRole !== 'none' ? 1 : numPlayers}
          optimizeConnection={optimizeConnection}
          onOptimizeConnection={handleOptimizeConnection}
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
          onPlayAgain={() => beginRun(false)}
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
                snap: serializeRuntimeForSync(rt, optimizeConnectionRef.current),
                sfx,
              });
            }
          }}
        />
      )}

      {(() => {
        const localHudPlayer =
          hud?.players?.find((pl) => pl.id === localPlayerNum) || hud?.p1;
        if (screen !== 'PLAYING' || !hud?.isOnlineCampaign || !localHudPlayer) return null;
        return (
          <>
            {showInventoryModal && (
              <InventoryModal
                player={localHudPlayer}
                isOnlineCampaign={hud.isOnlineCampaign}
                onDropWeapon={handleDropWeapon}
                onUseScroll={handleUseScroll}
                onDropScroll={handleDropScroll}
                onUsePotion={handleUsePotion}
                onClose={() => setShowInventoryModal(false)}
              />
            )}
            {showShopModal && hud.shopCatalog && localHudPlayer.nearMerchant && (
              <ShopNpcModal
                npcName={hud.shopNpcName || 'Gilded Broker Vex'}
                player={localHudPlayer}
                items={hud.shopCatalog}
                onBuyItem={handleBuyShopItem}
                onClose={() => setShowShopModal(false)}
              />
            )}
          </>
        );
      })()}

      {disconnectModal && (
        <OnlineDisconnectModal
          isHost={disconnectModal.isHost}
          roomCode={disconnectModal.isHost ? roomCode : lastRoomCodeRef.current || joinInput}
          floorNumber={hud?.floorMap?.floorNumber}
          isReconnecting={!disconnectModal.isHost && onlineStatus === 'connecting'}
          reconnectError={onlineError}
          onWaitForReconnect={disconnectModal.isHost ? handleWaitForReconnect : undefined}
          onReconnect={!disconnectModal.isHost ? handleGuestReconnect : undefined}
          onContinueSolo={disconnectModal.isHost ? handleContinueSolo : undefined}
          onReturnToMenu={handleReturnToMenu}
        />
      )}

      {fullscreenToast}
    </>
  );
}

