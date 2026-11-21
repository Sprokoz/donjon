import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import {
  BoonDraftModal,
  CheatsModal,
  ControlsModal,
  EndScreenModal,
  PauseModal,
  StageTransitionModal,
} from './components/Modals';
import { HeroSetup, TitleMenu } from './components/TitleFlow';
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
import { renderGame } from './game/renderer';
import { soundEngine } from './game/soundEngine';
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

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('TITLE_MENU');
  const [difficulty, setDifficulty] = useState<DifficultyKey>('medium');
  const [mode, setMode] = useState<GameMode>('campaign');
  const [numPlayers, setNumPlayers] = useState<1 | 2>(1);
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
  const [showTouchControls, setShowTouchControls] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 1024;
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const touchInputRef = useRef<TouchInputState>({ x: 0, y: 0, dash: false, ability: false });
  const controlsRef = useRef<ControlsConfig>(controls);
  const screenRef = useRef<AppScreen>(screen);

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
    };
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
        else setFullscreenNote('Fullscreen is not supported in this browser.');
      }
    } catch {
      setFullscreenNote('Fullscreen blocked by browser or embedded frame.');
    }
  }, []);

  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  const handleSaveControls = useCallback((next: ControlsConfig) => {
    setControls(next);
    try {
      localStorage.setItem(CONTROLS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, []);

  const beginRun = useCallback(() => {
    soundEngine.unlock();
    const rt = createInitialGameRuntime({
      difficulty,
      mode: mode === 'tutorial' ? 'campaign' : mode,
      numPlayers,
      playerColors: {
        1: playerColors[1].hex,
        2: playerColors[2].hex,
      },
      playerClasses,
      cheats,
    });
    runtimeRef.current = rt;
    keysRef.current = {};
    touchInputRef.current = { x: 0, y: 0, dash: false, ability: false };
    setBoonDraftState(null);
    setTransitionTarget(null);
    setRunSummary(null);
    setHud(extractHudSnapshot(rt));
    setScreen('PLAYING');
  }, [difficulty, mode, numPlayers, playerColors, playerClasses, cheats]);

  const beginTutorial = useCallback(() => {
    soundEngine.unlock();
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

  const finalizeRun = useCallback((rt: GameRuntime, victory: boolean) => {
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
    setScreen(victory ? 'VICTORY' : 'GAME_OVER');
  }, []);

  const launchStageTransition = useCallback((nextStage: StageKey) => {
    setTransitionTarget(nextStage);
    setScreen('STAGE_TRANSITION');
    window.setTimeout(() => {
      const rt = runtimeRef.current;
      if (!rt) return;
      transitionToStage(rt, nextStage);
      setTransitionTarget(null);
      setHud(extractHudSnapshot(rt));
      setScreen('PLAYING');
    }, 1850);
  }, []);

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

  // Global key listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
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
          setScreen('PAUSED');
          return;
        }
        if (screenRef.current === 'PAUSED') {
          setScreen('PLAYING');
          return;
        }
      }
      if (k === 'tab' && screenRef.current === 'PLAYING') {
        const rt = runtimeRef.current;
        if (rt && rt.isBossLevel && rt.boss.state === 'comic_intro') {
          e.preventDefault();
          skipBossIntro(rt);
          setHud(extractHudSnapshot(rt));
          return;
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
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [showControlsModal, showCheatsModal]);

  // 60FPS Game Loop
  useEffect(() => {
    if (screen !== 'PLAYING' && screen !== 'PAUSED' && screen !== 'BOON_DRAFT' && screen !== 'STAGE_TRANSITION') {
      return;
    }

    let rafId = 0;
    let lastTs = performance.now();
    let hudSyncAccum = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;

      const rt = runtimeRef.current;
      const canvas = canvasRef.current;
      if (rt && canvas) {
        const ctx = canvas.getContext('2d');
        if (screenRef.current === 'PLAYING' && !showControlsModal && !showCheatsModal) {
          stepGame(rt, dt, keysRef.current, controlsRef.current, touchInputRef.current);

          if (rt.pendingEvent) {
            const ev = rt.pendingEvent;
            rt.pendingEvent = null;
            setHud(extractHudSnapshot(rt));
            if (ev.type === 'GAME_OVER') {
              finalizeRun(rt, false);
            } else if (ev.type === 'VICTORY') {
              finalizeRun(rt, true);
            } else if (ev.type === 'STAGE_CLEARED') {
              soundEngine.stopMusic();
              if (ev.offerBoons) {
                setBoonDraftState({
                  clearedStage: ev.clearedStage,
                  nextStage: ev.nextStage,
                  choices: getBoonChoices(rt),
                });
                setScreen('BOON_DRAFT');
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
          }
        }

        if (ctx) {
          renderGame(ctx, rt);
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [screen, showControlsModal, showCheatsModal, finalizeRun, launchStageTransition]);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  const handleReturnToMenu = () => {
    soundEngine.stopMusic();
    runtimeRef.current = null;
    setHud(null);
    setRunSummary(null);
    setBoonDraftState(null);
    setScreen('TITLE_MENU');
  };

  const handleUpdateCheats = useCallback((next: CheatsConfig) => {
    setCheats(next);
    const rt = runtimeRef.current;
    if (rt) {
      setRuntimeCheats(rt, next);
      setHud(extractHudSnapshot(rt));
    }
  }, []);

  const anyCheatActive = Object.values(cheats).some(Boolean);

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
          anyCheatActive={anyCheatActive}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          leaderboard={leaderboard}
        />
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
      <HeroSetup
        numPlayers={numPlayers}
        onSelectPlayers={setNumPlayers}
        playerColors={playerColors}
        onSelectColor={(pid, col) => setPlayerColors((prev) => ({ ...prev, [pid]: col }))}
        playerClasses={playerClasses}
        onSelectClass={(pid, cls) => setPlayerClasses((prev) => ({ ...prev, [pid]: cls }))}
        onBack={() => setScreen('TITLE_MENU')}
        onStart={beginRun}
      />
    );
  }

  return (
    <>
      {hud && (
        <GameHud
          hud={hud}
          difficulty={difficulty}
          numPlayers={hud.isTutorial ? 1 : numPlayers}
          playerColors={{ 1: playerColors[1].hex, 2: playerColors[2].hex }}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          showTouchControls={showTouchControls}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
          onToggleMute={handleToggleMute}
          onPause={() => {
            touchInputRef.current = { x: 0, y: 0, dash: false, ability: false };
            setScreen(screen === 'PAUSED' ? 'PLAYING' : 'PAUSED');
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
          onResume={() => setScreen('PLAYING')}
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
          numPlayers={numPlayers}
          onChange={handleSaveControls}
          onClose={() => setShowControlsModal(false)}
        />
      )}

      {showCheatsModal && (
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
          onPick={handlePickBoon}
        />
      )}

      {screen === 'STAGE_TRANSITION' && transitionTarget && (
        <StageTransitionModal nextStage={transitionTarget} />
      )}

      {(screen === 'GAME_OVER' || screen === 'VICTORY') && runSummary && (
        <EndScreenModal
          summary={runSummary}
          onPlayAgain={beginRun}
          onMainMenu={handleReturnToMenu}
        />
      )}
    </>
  );
}
