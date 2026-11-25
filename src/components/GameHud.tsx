import React, { useEffect, useRef, useState } from 'react';
import {
  Pause,
  Volume2,
  VolumeX,
  Keyboard,
  Shield,
  ChevronRight,
  ChevronDown,
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
  Briefcase,
  FlaskConical,
  AlertTriangle,
  Store,
  Eye,
  EyeOff,
  GripHorizontal,
  UserX,
  Zap,
  Swords,
} from 'lucide-react';
import {
  BOONS_CATALOG,
  BossChannelKind,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  ClassSkillDef,
  DEFAULT_HUD_SETTINGS,
  DifficultyKey,
  FloorMapHudSnapshot,
  FloorMapNodeHud,
  HERO_CLASSES,
  HeroClassId,
  HudSettings,
  HudSnapshot,
  PlayerHudState,
  PlayerId,
  WeaponClassId,
  WeaponId,
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
  isOnlineHost?: boolean;
  onKickPlayer?: (playerId: PlayerId) => void;
  playerColors: Record<number, string>;
  pingByPlayer?: Record<number, number | null>;
  isMuted: boolean;
  isFullscreen: boolean;
  showTouchControls: boolean;
  hudSettings?: HudSettings;
  onChangeHudSettings?: (next: HudSettings) => void;
  resetPartyPosSignal?: number;
  onToggleFullscreen: () => void;
  onToggleTouchControls: () => void;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenControls: () => void;
  onSwitchTutorialClass?: (cls: HeroClassId) => void;
  onSwitchTutorialWeapon?: (weapon: WeaponId) => void;
  onSwitchPracticeWeapon?: (weapon: WeaponClassId) => void;
  onTriggerPracticeAttack?: (attackKind?: BossChannelKind) => void;
  onSwitchPracticeBoss?: (bossStage: 'mechaBoss' | 'voidBoss' | 'oniBoss' | 'eclipseBoss') => void;
  onUsePotion?: () => void;
  onOpenInventory?: () => void;
  onOpenShop?: () => void;
  onNextTutorialStep?: () => void;
  onExitTutorial?: () => void;
  onSkipIntro?: () => void;
  onTouchMove: (x: number, y: number) => void;
  onTouchDash: (pressed: boolean) => void;
  onTouchAbility: (pressed: boolean) => void;
  onTouchSkillSlot?: (slot: 2 | 3 | 4, pressed: boolean) => void;
  children: React.ReactNode;
}

const PARTY_OPEN_KEY = 'dungeon_bouncer_party_open_v1';
const PARTY_POS_KEY = 'dungeon_bouncer_party_pos_v1';

const STYLE_COLORS: Record<HudSnapshot['styleRank'], string> = {
  D: '#78716c',
  C: '#38bdf8',
  B: '#34d399',
  A: '#facc15',
  S: '#f97316',
  SS: '#ef4444',
  SSS: '#e879f9',
};

function loadBoolPref(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === '1' || raw === 'true') return true;
    if (raw === '0' || raw === 'false') return false;
    return fallback;
  } catch {
    return fallback;
  }
}

function loadPartyPos(): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(PARTY_POS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as { x?: number; y?: number };
      if (typeof p.x === 'number' && typeof p.y === 'number') {
        const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const h = typeof window !== 'undefined' ? window.innerHeight : 800;
        return {
          x: Math.max(8, Math.min(w - 250, p.x)),
          y: Math.max(72, Math.min(h - 110, p.y)),
        };
      }
    }
  } catch {
    // ignore
  }
  return { x: 12, y: 78 };
}

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

const FloorMinimapCard: React.FC<{
  floorMap: FloorMapHudSnapshot;
  opacity: number;
  onChangeOpacity: (next: number) => void;
  onHideMap: () => void;
}> = React.memo(({ floorMap, opacity, onChangeOpacity, onHideMap }) => {
  const nodeMap = new Map<string, FloorMapNodeHud>();
  floorMap.nodes.forEach((n) => nodeMap.set(`${n.gx},${n.gy}`, n));
  const size = floorMap.gridSize || 5;

  return (
    <div
      className="bg-[#09080d]/95 border border-stone-700/90 rounded-md p-2 space-y-1.5 shadow-2xl backdrop-blur-sm w-[200px] sm:w-[216px]"
      style={{ opacity }}
    >
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-souls text-[10px] font-bold text-stone-100 tracking-wider truncate">
            FLOOR {floorMap.floorNumber} MAP
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {floorMap.loopLevel > 1 && (
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-rose-950/75 border border-rose-500/70 font-mono-num text-[8px] font-bold text-rose-300">
              <Flame className="w-2.5 h-2.5" />
              L{floorMap.loopLevel}
            </span>
          )}
          <button
            type="button"
            onClick={onHideMap}
            className="p-0.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 cursor-pointer"
            title="Hide Map"
            aria-label="Hide Floor Map"
          >
            <EyeOff className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Floor Room Grid */}
      <div
        className="bg-black/80 border border-stone-800/90 rounded p-1.5 grid gap-1 w-full"
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
              {node.connections.right && (
                <span className="pointer-events-none absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-[2px] bg-stone-500/80 z-0" />
              )}
              {node.connections.bottom && (
                <span className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 w-[2px] h-1 bg-stone-500/80 z-0" />
              )}

              <div
                title={`${node.kind.toUpperCase()}${node.cleared ? ' (CLEARED)' : node.visited ? ' (VISITED)' : ' (UNEXPLORED)'}`}
                className={`relative z-10 w-full h-full rounded-[3px] border flex items-center justify-center font-mono-num text-[9px] font-bold transition-all ${cellStyle} ${
                  isCurrent ? 'ring-2 ring-white shadow-[0_0_8px_rgba(255,255,255,0.65)] scale-105' : ''
                }`}
              >
                {getRoomSymbol(node)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Opacity Slider & Compact Legend */}
      <div className="space-y-1 pt-0.5">
        <div className="flex items-center gap-1.5 text-[9px] font-mono-num text-stone-400">
          <span className="shrink-0">OPACITY</span>
          <input
            type="range"
            min={25}
            max={100}
            step={5}
            value={Math.round(opacity * 100)}
            onChange={(e) => onChangeOpacity(Number(e.target.value) / 100)}
            className="flex-1 h-1.5 accent-cyan-400 cursor-pointer"
            aria-label="Map Opacity"
          />
          <span className="w-7 text-right text-cyan-300 font-bold">{Math.round(opacity * 100)}%</span>
        </div>
        <div className="flex items-center justify-between text-[8px] font-mono-num text-stone-400">
          <span className="text-amber-300">$ Shop</span>
          <span className="text-purple-300">◈ Vault</span>
          <span className="text-rose-300">☠ Boss</span>
          <span className="text-emerald-300">✓ Clear</span>
        </div>
      </div>
    </div>
  );
});

interface FlyingCoin {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  delay: number;
  targetX: number;
  targetY: number;
  done: boolean;
}

const GoldFlyOverlay: React.FC<{
  coinBursts?: { id: number; x: number; y: number; amount: number }[];
  cameraState?: { x: number; y: number; zoom: number };
  onCoinArrive: () => void;
}> = ({ coinBursts, cameraState, onCoinArrive }) => {
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const coinsRef = useRef<FlyingCoin[]>([]);
  const seenBurstIdsRef = useRef<Set<number>>(new Set());
  const rafRef = useRef<number | null>(null);
  const onArriveRef = useRef(onCoinArrive);
  onArriveRef.current = onCoinArrive;

  useEffect(() => {
    if (!coinBursts || coinBursts.length === 0) return;
    const arenaCanvas = document.querySelector('[data-arena-canvas="true"]') as HTMLElement | null;
    const targetEl = document.querySelector('[data-gold-target="true"]') as HTMLElement | null;
    if (!arenaCanvas) return;

    const arenaRect = arenaCanvas.getBoundingClientRect();
    if (arenaRect.width <= 0 || arenaRect.height <= 0) return;

    const targetRect = targetEl?.getBoundingClientRect();
    const tx = targetRect ? targetRect.left + targetRect.width / 2 : arenaRect.left + arenaRect.width * 0.6;
    const ty = targetRect ? targetRect.top + targetRect.height / 2 : 24;

    const canvasW = (arenaCanvas as HTMLCanvasElement).width || CANVAS_WIDTH;
    const canvasH = (arenaCanvas as HTMLCanvasElement).height || CANVAS_HEIGHT;
    const cam = cameraState || { x: canvasW / 2, y: canvasH / 2, zoom: 1 };
    const scaleX = arenaRect.width / canvasW;
    const scaleY = arenaRect.height / canvasH;

    let added = false;
    coinBursts.forEach((burst) => {
      if (seenBurstIdsRef.current.has(burst.id)) return;
      seenBurstIdsRef.current.add(burst.id);
      if (seenBurstIdsRef.current.size > 80) {
        const first = seenBurstIdsRef.current.values().next().value;
        if (first !== undefined) seenBurstIdsRef.current.delete(first);
      }

      const canvasX = canvasW / 2 + (burst.x - cam.x) * cam.zoom;
      const canvasY = canvasH / 2 + (burst.y - cam.y) * cam.zoom;
      const sx = arenaRect.left + canvasX * scaleX;
      const sy = arenaRect.top + canvasY * scaleY;

      const count = 8;
      for (let i = 0; i < count; i++) {
        const spreadAngle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
        const speed = 110 + Math.random() * 140;
        coinsRef.current.push({
          id: burst.id * 100 + i,
          x: sx + (Math.random() - 0.5) * 10,
          y: sy + (Math.random() - 0.5) * 10,
          vx: Math.cos(spreadAngle) * speed,
          vy: Math.sin(spreadAngle) * speed - 40,
          age: 0,
          delay: i * 0.04,
          targetX: tx,
          targetY: ty,
          done: false,
        });
      }
      added = true;
    });

    if (!added || rafRef.current !== null) return;

    let lastTs = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.004, (now - lastTs) / 1000));
      lastTs = now;

      const canvas = overlayCanvasRef.current;
      if (!canvas) {
        rafRef.current = null;
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (canvas.width !== Math.floor(vw * dpr) || canvas.height !== Math.floor(vh * dpr)) {
        canvas.width = Math.floor(vw * dpr);
        canvas.height = Math.floor(vh * dpr);
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafRef.current = null;
        return;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);

      const liveTargetEl = document.querySelector('[data-gold-target="true"]') as HTMLElement | null;
      const liveRect = liveTargetEl?.getBoundingClientRect();
      const liveTx = liveRect && liveRect.width > 0 ? liveRect.left + liveRect.width / 2 : tx;
      const liveTy = liveRect && liveRect.height > 0 ? liveRect.top + liveRect.height / 2 : ty;

      let arrivedThisFrame = false;
      const active: FlyingCoin[] = [];

      for (const c of coinsRef.current) {
        if (c.done) continue;
        c.age += dt;
        c.targetX = liveTx;
        c.targetY = liveTy;

        if (c.age < c.delay) {
          active.push(c);
          continue;
        }

        const flightAge = c.age - c.delay;
        if (flightAge < 0.19) {
          // Initial chest burst pop
          c.vy += 420 * dt;
          c.x += c.vx * dt;
          c.y += c.vy * dt;
        } else {
          // Smooth accelerating homing arc to Gold UI
          const homingT = Math.min(1, (flightAge - 0.19) / 0.42);
          const pull = 12 + homingT * 28;
          const dx = c.targetX - c.x;
          const dy = c.targetY - c.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 14 || flightAge >= 0.72) {
            c.done = true;
            arrivedThisFrame = true;
            continue;
          }
          c.vx = (c.vx * 0.78) + (dx / dist) * (360 + pull * 18) * 0.22;
          c.vy = (c.vy * 0.78) + (dy / dist) * (360 + pull * 18) * 0.22;
          c.x += c.vx * dt + dx * Math.min(0.45, dt * (5.5 + homingT * 9));
          c.y += c.vy * dt + dy * Math.min(0.45, dt * (5.5 + homingT * 9));
        }

        // Draw gleaming spinning gold coin
        const spinW = Math.max(0.28, Math.abs(Math.cos(flightAge * 16 + c.id)));
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.34)';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.scale(spinW, 1);
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#b45309';
        ctx.fillRect(-1.5, -3.5, 3, 7);
        ctx.restore();

        active.push(c);
      }

      if (arrivedThisFrame) {
        onArriveRef.current();
      }

      coinsRef.current = active;
      if (coinsRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, vw, vh);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [coinBursts, cameraState]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return (
    <canvas
      ref={overlayCanvasRef}
      className="pointer-events-none fixed inset-0 z-45 w-full h-full"
    />
  );
};

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  difficulty,
  numPlayers,
  localPlayerNum = 1,
  isOnline = false,
  isOnlineHost = false,
  onKickPlayer,
  playerColors,
  pingByPlayer,
  isMuted,
  isFullscreen,
  showTouchControls,
  hudSettings: externalHudSettings,
  onChangeHudSettings,
  resetPartyPosSignal,
  onToggleFullscreen,
  onToggleTouchControls,
  onToggleMute,
  onPause,
  onOpenControls,
  onSwitchTutorialClass,
  onSwitchTutorialWeapon,
  onSwitchPracticeWeapon,
  onTriggerPracticeAttack,
  onSwitchPracticeBoss,
  onUsePotion,
  onOpenInventory,
  onOpenShop,
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
  const [fallbackHudSettings, setFallbackHudSettings] = useState<HudSettings>(DEFAULT_HUD_SETTINGS);
  const hudSettings = externalHudSettings || fallbackHudSettings;
  const updateHudSettings = (patch: Partial<HudSettings>) => {
    const next = { ...hudSettings, ...patch };
    if (onChangeHudSettings) onChangeHudSettings(next);
    else setFallbackHudSettings(next);
  };
  const showExtraUi = hudSettings.showExtraUi;
  const showMap = hudSettings.showMap;
  const mapOpacity = hudSettings.mapOpacity;

  const [partyOpen, setPartyOpen] = useState<boolean>(() => loadBoolPref(PARTY_OPEN_KEY, true));
  const [partyPos, setPartyPos] = useState<{ x: number; y: number }>(() => loadPartyPos());
  const [goldPulseTick, setGoldPulseTick] = useState(0);

  const dragStateRef = useRef<{
    active: boolean;
    pointerId: number;
    offsetX: number;
    offsetY: number;
  }>({ active: false, pointerId: -1, offsetX: 0, offsetY: 0 });
  const partyCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!resetPartyPosSignal) return;
    const def = { x: 12, y: 78 };
    setPartyPos(def);
    try {
      localStorage.setItem(PARTY_POS_KEY, JSON.stringify(def));
    } catch {
      // ignore
    }
  }, [resetPartyPosSignal]);

  useEffect(() => {
    try {
      localStorage.setItem(PARTY_OPEN_KEY, partyOpen ? '1' : '0');
    } catch {
      // ignore
    }
  }, [partyOpen]);

  useEffect(() => {
    const updateLayout = () => {
      setIsLandscapeMobile(window.innerWidth > window.innerHeight && window.innerHeight < 560);
      setPartyPos((prev) => ({
        x: Math.max(8, Math.min(window.innerWidth - 246, prev.x)),
        y: Math.max(64, Math.min(window.innerHeight - 100, prev.y)),
      }));
    };
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  const handlePartyDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      offsetX: e.clientX - partyPos.x,
      offsetY: e.clientY - partyPos.y,
    };
  };

  const handlePartyDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragStateRef.current;
    if (!st.active || st.pointerId !== e.pointerId) return;
    const cardW = partyCardRef.current?.offsetWidth || 236;
    const cardH = partyCardRef.current?.offsetHeight || 56;
    const nextX = Math.max(6, Math.min(window.innerWidth - cardW - 6, e.clientX - st.offsetX));
    const nextY = Math.max(48, Math.min(window.innerHeight - Math.min(cardH, 80) - 8, e.clientY - st.offsetY));
    setPartyPos({ x: nextX, y: nextY });
  };

  const handlePartyDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragStateRef.current;
    if (!st.active || st.pointerId !== e.pointerId) return;
    st.active = false;
    try {
      localStorage.setItem(PARTY_POS_KEY, JSON.stringify(partyPos));
    } catch {
      // ignore
    }
  };

  const activePlayers = hud.players && hud.players.length > 0 ? hud.players : [hud.p1];
  const localPlayer = activePlayers.find((pl) => pl.id === localPlayerNum) || activePlayers[0] || hud.p1;
  const myColor = playerColors[localPlayer.id] || localPlayer.color;
  const usesWeapons = hud.isOnlineCampaign || Boolean(hud.isTeamworkPractice);

  const resolvePing = (pid: PlayerId): number | null => {
    if (pid === 1) return isOnline ? 0 : null;
    if (pingByPlayer && pingByPlayer[pid] !== undefined) return pingByPlayer[pid];
    return null;
  };
  const myPingMs = resolvePing(localPlayer.id);

  const clsDefLocal = HERO_CLASSES.find((c) => c.id === localPlayer.heroClass);
  const wpnDefLocal =
    usesWeapons && localPlayer.weapon !== 'none'
      ? WEAPONS_CATALOG.find((w) => w.id === localPlayer.weapon)
      : undefined;
  const localSkillsList: ClassSkillDef[] = usesWeapons
    ? wpnDefLocal?.skills || []
    : clsDefLocal?.skills || [];
  const learnedArr =
    usesWeapons && wpnDefLocal ? localPlayer.learnedSkills?.[wpnDefLocal.id] || [1] : [];
  const myHpPct =
    localPlayer.maxHp > 0 ? Math.max(0, Math.min(100, (localPlayer.hp / localPlayer.maxHp) * 100)) : 0;

  const potionReady =
    localPlayer.potions > 0 &&
    localPlayer.potionCooldown <= 0 &&
    localPlayer.hp < localPlayer.maxHp &&
    localPlayer.state === 'alive';
  const bagCount = (localPlayer.scrollBag || []).length;

  const bossPct = hud.bossMaxHealth > 0 ? Math.max(0, (hud.bossHealth / hud.bossMaxHealth) * 100) : 0;
  const showBossBar =
    hudSettings.showBossBar && hud.isBossLevel && hud.bossHealth > 0 && hud.bossState !== 'comic_intro';

  const panelBgAlpha = Math.max(0.25, Math.min(0.96, hudSettings.opacity * 0.88));
  const panelStyle: React.CSSProperties = {
    backgroundColor: `rgba(10, 9, 14, ${panelBgAlpha})`,
  };
  const hudScale = Math.max(0.75, Math.min(1.2, hudSettings.scale || 1));

  const mapAnchorClass =
    hudSettings.mapPosition === 'top-left'
      ? 'top-[86px] left-2.5 sm:left-3'
      : hudSettings.mapPosition === 'bottom-right'
      ? 'bottom-[68px] right-2.5 sm:right-3'
      : 'top-[86px] right-2.5 sm:right-3';

  const mapOccupyingTopRight =
    hud.isOnlineCampaign && hud.floorMap && showMap && hudSettings.mapPosition === 'top-right';

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-[#020204] select-none">
      {/* ── FULLSCREEN EDGE-TO-EDGE BATTLEFIELD CANVAS ─────────────────── */}
      <div className="fixed inset-0 z-0 w-full h-full overflow-hidden bg-black">
        {children}
      </div>

      {/* Animated Chest Gold-to-UI Fly Overlay */}
      <GoldFlyOverlay
        coinBursts={hud.coinBursts}
        cameraState={hud.cameraState}
        onCoinArrive={() => setGoldPulseTick((t) => t + 1)}
      />

      {/* ── VIEWPORT ANNOUNCEMENTS & BOSS SKIP BUTTON ──────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-15">
        {hud.isBossLevel && hud.bossState === 'comic_intro' && onSkipIntro && (
          <button
            type="button"
            onClick={onSkipIntro}
            className="pointer-events-auto absolute bottom-20 right-4 z-20 px-4 py-2 rounded bg-black/85 hover:bg-stone-900 border border-amber-500/70 text-amber-200 font-mono-num text-xs font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer shadow-lg transition-colors"
          >
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
            <span>Skip Intro [Tab]</span>
          </button>
        )}

        {hud.medkitNotif && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-1 bg-black/80 border-y border-emerald-500/60 font-souls text-[11px] font-bold text-emerald-300 tracking-widest">
            {hud.medkitNotif}
          </div>
        )}

        {hud.phaseAnnounce && (
          <div
            className="absolute top-28 left-1/2 -translate-x-1/2 px-4 sm:px-6 py-1.5 bg-gradient-to-r from-transparent via-black/85 to-transparent border-y border-amber-500/40 font-souls text-xs sm:text-sm font-bold text-center whitespace-nowrap max-w-[92vw] truncate"
            style={{ color: hud.phaseAnnounce.color, textShadow: `0 0 14px ${hud.phaseAnnounce.color}` }}
          >
            {hud.phaseAnnounce.text}
          </div>
        )}

        {hud.coopPrompt && (
          <div
            className={`absolute bottom-16 sm:bottom-[68px] left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1.5 rounded flex items-center gap-2 font-mono-num text-[10px] sm:text-[11px] font-bold whitespace-nowrap max-w-[92vw] truncate shadow-lg ${
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

      {/* ── FLOATING TOP HUD STACK (Health, Gold, Ping, Toggles, Settings, Boss Bar) ── */}
      <div className="pointer-events-none fixed top-0 inset-x-0 z-25 px-2 sm:px-3 pt-1.5 flex flex-col items-center gap-1">
        <header
          className="pointer-events-auto w-full max-w-[1380px] border border-stone-700/85 rounded-md px-2.5 py-1 flex flex-wrap items-center justify-between gap-2 backdrop-blur-md shadow-xl transition-transform"
          style={{
            ...panelStyle,
            transform: hudScale !== 1 ? `scale(${hudScale})` : undefined,
            transformOrigin: 'top center',
          }}
        >
          {/* Left: My Health + Stage Tag */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 max-w-[440px]">
            <div className="min-w-[135px] flex-1 max-w-[230px] space-y-0.5">
              <div className="flex items-center justify-between gap-1.5 font-mono-num text-[10px]">
                <span className="font-bold truncate" style={{ color: myColor }}>
                  {localPlayer.name || `P${localPlayer.id}`}
                  {wpnDefLocal ? ` · ${wpnDefLocal.shortTag}` : usesWeapons ? ' · UNARMED' : ''}
                </span>
                <span className="font-bold text-stone-100 shrink-0 tabular-nums">
                  {localPlayer.state === 'down' ? 'DOWN' : `${localPlayer.hp}/${localPlayer.maxHp}`}
                </span>
              </div>
              <div className="relative w-full h-2.5 bg-stone-950 border border-stone-700/90 rounded-sm overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-amber-400/75 transition-all duration-500 ease-out"
                  style={{ width: `${myHpPct}%` }}
                />
                <div
                  className="relative h-full transition-all duration-150"
                  style={{
                    width: `${myHpPct}%`,
                    background:
                      localPlayer.state === 'down'
                        ? '#71717a'
                        : 'linear-gradient(90deg, #7f1d1d, #dc2626, #ef4444)',
                  }}
                />
              </div>
            </div>

            {/* Active Status Quick Pips */}
            <div className="hidden md:flex items-center gap-1 shrink-0 font-mono-num text-[9px]">
              {localPlayer.hasKnife && (
                <span className="px-1.5 py-0.5 rounded bg-cyan-950/65 border border-cyan-700/65 text-cyan-300 font-bold inline-flex items-center gap-0.5">
                  <Swords className="w-2.5 h-2.5" />
                  ARMED
                </span>
              )}
              {(localPlayer.frontShield || 0) > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-sky-900/80 border border-sky-400 text-sky-100 font-bold">
                  WALL {localPlayer.frontShield?.toFixed(1)}s
                </span>
              )}
              {localPlayer.empowered && (
                <span className="px-1.5 py-0.5 rounded bg-amber-950/75 border border-amber-500/70 text-amber-300 font-bold">
                  <Zap className="w-2.5 h-2.5 inline" /> EMP
                </span>
              )}
            </div>
          </div>

          {/* Center/Right: Gold Target, Ping, Map Toggle, Show/Hide Extra UI, Settings & Pause */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            {hudSettings.showGoldCounter && (
              <div
                key={`gold-${goldPulseTick > 0 ? 'pulse' : 'base'}`}
                data-gold-target="true"
                className={`px-2.5 py-1 rounded border font-mono-num text-xs font-extrabold flex items-center gap-1.5 transition-transform duration-150 tabular-nums ${
                  goldPulseTick > 0
                    ? 'bg-amber-950/80 border-amber-400 text-amber-200 scale-105 shadow-[0_0_16px_rgba(251,191,36,0.45)]'
                    : 'bg-black/75 border-amber-600/60 text-amber-300'
                }`}
                title={hud.isOnlineCampaign ? 'Your Gold Coins' : 'Run Score'}
              >
                <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {hud.isOnlineCampaign ? `${localPlayer.coins}g` : hud.score.toLocaleString()}
                </span>
              </div>
            )}

            {isOnline && hudSettings.showPing && (
              <div
                className={`px-2 py-1 rounded border border-stone-800 bg-black/75 font-mono-num text-[11px] font-bold flex items-center gap-1 tabular-nums ${pingTextColor(
                  myPingMs
                )}`}
                title="Network Latency"
              >
                <Wifi className="w-3 h-3 shrink-0" />
                <span>{myPingMs === null ? '--ms' : `${myPingMs}ms`}</span>
              </div>
            )}

            {hud.isOnlineCampaign && hud.floorMap && (
              <button
                type="button"
                onClick={() => updateHudSettings({ showMap: !showMap })}
                className={`px-2.5 py-1 rounded border font-mono-num text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                  showMap
                    ? 'bg-cyan-950/70 border-cyan-500/75 text-cyan-200'
                    : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-stone-200'
                }`}
                title={showMap ? 'Hide Floor Map' : 'Show Floor Map'}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{showMap ? 'Map On' : 'Map Off'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => updateHudSettings({ showExtraUi: !showExtraUi })}
              className={`px-2.5 py-1 rounded border font-mono-num text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                showExtraUi
                  ? 'bg-purple-950/70 border-purple-500/75 text-purple-200'
                  : 'bg-stone-900 border-stone-700 text-stone-300 hover:border-stone-500'
              }`}
              title={showExtraUi ? 'Hide Extra UI Panels' : 'Show Extra UI Panels'}
            >
              {showExtraUi ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{showExtraUi ? 'Extra UI' : 'Clean HUD'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenControls}
              className="px-2 py-1 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-[11px] text-stone-200 flex items-center gap-1 cursor-pointer"
              title="HUD & Control Settings"
            >
              <Keyboard className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden md:inline">HUD / Keys</span>
            </button>

            <button
              type="button"
              onClick={onToggleTouchControls}
              className={`lg:hidden p-1.5 rounded border cursor-pointer flex items-center justify-center ${
                showTouchControls
                  ? 'bg-amber-950/60 border-amber-500/70 text-amber-300'
                  : 'bg-stone-900 border-stone-700 text-stone-400'
              }`}
              aria-label="Toggle Touch Controls"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 cursor-pointer"
              aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
            </button>
            <button
              type="button"
              onClick={onToggleFullscreen}
              className={`hidden sm:flex p-1.5 rounded border cursor-pointer ${
                isFullscreen
                  ? 'bg-cyan-950/60 border-cyan-500/70 text-cyan-300'
                  : 'bg-stone-900 hover:bg-stone-800 border-stone-700 text-stone-300'
              }`}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onPause}
              className="px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-[11px] font-semibold text-stone-100 flex items-center gap-1 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pause</span>
            </button>
          </div>
        </header>

        {/* Floating Boss Health Bar / Compact Stage Strip */}
        {showBossBar ? (
          <div
            className="w-full max-w-[780px] border border-stone-700/80 rounded px-3 py-1 backdrop-blur-sm shadow-lg"
            style={panelStyle}
          >
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-souls font-bold text-stone-100 tracking-wider truncate">
                {hud.bossName}
                {hud.loopLevel > 1 ? ` · LOOP ${hud.loopLevel}` : ''}
              </span>
              {hud.bossAttackLabel && (
                <span className="font-mono-num text-[10px] font-bold text-amber-300 animate-pulse truncate">
                  ▲ {hud.bossAttackLabel} ▲
                </span>
              )}
              <span className="font-mono-num text-[11px] text-stone-300 shrink-0 tabular-nums">
                {hud.bossHealth} / {hud.bossMaxHealth}
              </span>
            </div>
            <div className="relative w-full h-2 bg-stone-950 border border-stone-700/90 overflow-hidden mt-0.5">
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
          </div>
        ) : (
          <div
            className="border border-stone-800/80 rounded-full px-3.5 py-0.5 backdrop-blur-sm flex items-center gap-3 font-mono-num text-[10px] text-stone-200 shadow"
            style={panelStyle}
          >
            <span className="font-souls text-amber-400 tracking-wider truncate max-w-[260px]">
              {hud.stageLabel}
              {hud.loopLevel > 1 ? ` · LOOP ${hud.loopLevel}` : ''}
            </span>
            <span className="text-stone-400 shrink-0">
              {hud.isBossLevel
                ? hud.waveText
                : hud.gatesActive
                ? 'Hallways Open'
                : `${hud.waveText} · ${hud.enemiesRemaining} Left`}
            </span>
          </div>
        )}

        {/* Boss Teamwork Channel Warning */}
        {hud.bossChannel && (
          <div
            className={`w-full max-w-[780px] rounded px-3 py-1 border flex items-center justify-between gap-2 font-mono-num text-[11px] font-bold animate-pulse shadow-lg ${
              hud.bossChannel.kind === 'siege_beam' || hud.bossChannel.kind === 'overload_pylons'
                ? 'bg-sky-950/90 border-sky-400 text-sky-100'
                : hud.bossChannel.kind === 'cursed_floor' ||
                  hud.bossChannel.kind === 'meteor_soak' ||
                  hud.bossChannel.kind === 'demon_seal_purge'
                ? 'bg-orange-950/90 border-amber-400 text-amber-100'
                : hud.bossChannel.kind === 'hunter_mark'
                ? 'bg-rose-950/90 border-rose-400 text-rose-100'
                : 'bg-purple-950/90 border-purple-400 text-purple-100'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{hud.bossChannel.label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 tabular-nums">
              {(hud.bossChannel.kind === 'interrupt' ||
                hud.bossChannel.kind === 'hunter_mark' ||
                hud.bossChannel.kind === 'overload_pylons' ||
                hud.bossChannel.kind === 'demon_seal_purge') && (
                <span className="text-amber-300">
                  {hud.bossChannel.hits}/{hud.bossChannel.hitsNeeded}
                </span>
              )}
              <span className="text-white">{hud.bossChannel.timer}s</span>
            </div>
          </div>
        )}
      </div>

      {/* ── FLOATING FLOOR MAP (Configurable Corner & Opacity) ───────────── */}
      {hud.isOnlineCampaign && hud.floorMap && showMap && (
        <div className={`fixed z-25 ${mapAnchorClass}`}>
          <FloorMinimapCard
            floorMap={hud.floorMap}
            opacity={mapOpacity}
            onChangeOpacity={(next) => updateHudSettings({ mapOpacity: next })}
            onHideMap={() => updateHudSettings({ showMap: false })}
          />
        </div>
      )}

      {/* ── FLOATING EXTRA UI / PRACTICE SANDBOX / TUTORIAL DRAWER ───────── */}
      {(showExtraUi || hud.isTeamworkPractice || hud.isTutorial) && (
        <aside
          className={`fixed right-2.5 sm:right-3 z-25 w-[228px] sm:w-[244px] flex flex-col gap-2 max-h-[calc(100dvh-175px)] overflow-y-auto pr-0.5 transition-all ${
            mapOccupyingTopRight ? 'top-[320px]' : 'top-[86px]'
          }`}
        >
          {showExtraUi && (
            <div
              className="border border-stone-700/85 rounded-md p-2.5 space-y-2 font-mono-num text-xs backdrop-blur-md shadow-xl"
              style={panelStyle}
            >
              <div className="flex items-center justify-between text-[10px] text-stone-400 uppercase tracking-wider font-bold">
                <span>RUN METRICS</span>
                <span className="uppercase text-amber-300">{difficulty}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-black/65 border border-stone-800/80 rounded p-1.5">
                  <div className="text-[9px] text-stone-500">STYLE RANK</div>
                  <div className="font-arcade text-sm" style={{ color: STYLE_COLORS[hud.styleRank] }}>
                    {hud.styleRank}
                  </div>
                </div>
                <div className="bg-black/65 border border-stone-800/80 rounded p-1.5">
                  <div className="text-[9px] text-stone-500">TIME</div>
                  <div className="text-stone-200 font-semibold tabular-nums">{formatDuration(hud.elapsedSeconds)}</div>
                </div>
                <div className="bg-black/65 border border-stone-800/80 rounded p-1.5">
                  <div className="text-[9px] text-stone-500">BOSSES</div>
                  <div className="text-cyan-300 font-semibold tabular-nums">{hud.bossesDefeatedCount}</div>
                </div>
                <div className="bg-black/65 border border-stone-800/80 rounded p-1.5">
                  <div className="text-[9px] text-stone-500">MAX COMBO</div>
                  <div className="text-stone-200 font-semibold tabular-nums">{hud.maxCombo}x</div>
                </div>
              </div>
            </div>
          )}

          {showExtraUi && (
            <div
              className="border border-stone-700/85 rounded-md p-2.5 space-y-1.5 backdrop-blur-md shadow-xl"
              style={panelStyle}
            >
              <div className="text-[10px] font-mono-num text-stone-400 uppercase tracking-wider font-bold">
                SOUL RELICS ({hud.activeBoons.length})
              </div>
              {hud.activeBoons.length === 0 ? (
                <p className="text-[11px] font-mono-num text-stone-500">
                  Slay Lords of Ash to claim permanent Soul Relics.
                </p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {hud.activeBoons.map((bid) => {
                    const b = BOONS_CATALOG.find((x) => x.id === bid);
                    return (
                      <div key={bid} className="p-1.5 rounded bg-black/70 border border-stone-800 flex items-start gap-1.5">
                        <span className="text-xs leading-none mt-0.5" style={{ color: b?.accent || '#fff' }}>
                          {b?.icon || '★'}
                        </span>
                        <div className="min-w-0">
                          <div className="font-souls text-[10px] font-bold text-stone-200 truncate">{b?.name || bid}</div>
                          <div className="text-[9px] text-stone-400 leading-tight">{b?.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {hud.isTeamworkPractice && (
            <div
              className="border border-cyan-600/75 rounded-md p-2.5 space-y-2 backdrop-blur-md shadow-xl"
              style={panelStyle}
            >
              <div className="flex items-center justify-between gap-1.5 border-b border-stone-800 pb-1.5">
                <span className="inline-flex items-center gap-1.5 font-souls text-[11px] font-bold text-cyan-300 tracking-wider">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>PRACTICE SANDBOX</span>
                </span>
                <span className="font-mono-num text-[9px] text-emerald-300 font-bold">
                  {isOnline ? 'CO-OP' : '1P + BOTS'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {WEAPONS_CATALOG.map((w) => {
                  const active = localPlayer.weapon === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => onSwitchPracticeWeapon?.(w.id)}
                      className={`px-2 py-1 rounded border text-[9px] font-mono-num font-bold cursor-pointer truncate ${
                        active ? 'bg-stone-800 text-white' : 'bg-black/75 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                      style={{ borderColor: active ? w.accent : undefined, color: active ? w.accent : undefined }}
                    >
                      {w.shortTag}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-1 pt-1 border-t border-stone-800/80">
                {(hud.bossType === 'mecha'
                  ? ([
                      { id: 'cursed_floor', label: 'Safe Island' },
                      { id: 'siege_beam', label: 'Apoc Cone' },
                      { id: 'overload_pylons', label: 'Reactor Pylons' },
                    ] as const)
                  : hud.bossType === 'void'
                  ? ([
                      { id: 'hunter_mark', label: 'Hunter Mark' },
                      { id: 'gravity_storm', label: 'Gravity Vortex' },
                      { id: 'abyss_tether', label: 'Soul Tether' },
                    ] as const)
                  : hud.bossType === 'oni'
                  ? ([
                      { id: 'cursed_floor', label: 'Calamity Island' },
                      { id: 'demon_seal_purge', label: 'Seal Purge' },
                      { id: 'meteor_soak', label: 'Meteor Soak' },
                    ] as const)
                  : ([
                      { id: 'meteor_soak', label: 'Supernova Soak' },
                      { id: 'siege_beam', label: 'Eclipse Cone' },
                      { id: 'interrupt', label: 'Oblivion Ritual' },
                    ] as const)
                ).map((atk) => (
                  <button
                    key={atk.id}
                    type="button"
                    disabled={isOnline && localPlayer.id !== 1}
                    onClick={() => onTriggerPracticeAttack?.(atk.id)}
                    className="px-2 py-1 rounded border border-amber-700/60 bg-amber-950/35 hover:bg-amber-900/50 text-amber-200 text-[9px] font-mono-num font-bold cursor-pointer disabled:opacity-45 truncate"
                  >
                    {atk.label}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={isOnline && localPlayer.id !== 1}
                  onClick={() => onTriggerPracticeAttack?.()}
                  className="px-2 py-1 rounded border border-cyan-700/70 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-200 text-[9px] font-mono-num font-bold cursor-pointer disabled:opacity-45 truncate"
                >
                  Next Attack ↻
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1 pt-1 border-t border-stone-800/80">
                {(
                  [
                    { stage: 'mechaBoss', label: 'Mecha' },
                    { stage: 'voidBoss', label: 'Void' },
                    { stage: 'oniBoss', label: 'Oni' },
                    { stage: 'eclipseBoss', label: 'Eclipse' },
                  ] as const
                ).map((b) => (
                  <button
                    key={b.stage}
                    type="button"
                    disabled={isOnline && localPlayer.id !== 1}
                    onClick={() => onSwitchPracticeBoss?.(b.stage)}
                    className="px-1.5 py-1 rounded border border-rose-800/60 bg-rose-950/30 hover:bg-rose-900/50 text-rose-200 text-[9px] font-mono-num font-bold cursor-pointer disabled:opacity-45 truncate"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hud.isTutorial && (
            <div
              className="border border-amber-700/70 rounded-md p-2.5 space-y-2 backdrop-blur-md shadow-xl"
              style={panelStyle}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-souls text-[11px] font-bold text-amber-300">{hud.tutorialTitle}</span>
                <span className="font-mono-num text-[10px] text-cyan-300">{hud.tutorialProgress}/{hud.tutorialTotal}</span>
              </div>
              <p className="font-mono-num text-[10px] text-stone-300 leading-snug">{hud.tutorialObjective}</p>
              <div className="grid grid-cols-2 gap-1">
                {HERO_CLASSES.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => onSwitchTutorialClass?.(cls.id)}
                    className="px-2 py-1 rounded border border-stone-800 bg-black/70 text-[9px] font-mono-num font-bold text-stone-300 hover:text-white cursor-pointer truncate"
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
              {onSwitchTutorialWeapon && (
                <div className="grid grid-cols-2 gap-1 pt-1 border-t border-stone-800/80">
                  {WEAPONS_CATALOG.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => onSwitchTutorialWeapon(w.id)}
                      className="px-2 py-1 rounded border border-stone-800 bg-black/70 text-[9px] font-mono-num font-bold cursor-pointer truncate"
                      style={{ color: w.accent }}
                    >
                      {w.shortTag}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onNextTutorialStep?.()}
                  className="flex-1 py-1.5 rounded bg-amber-600/90 hover:bg-amber-500 text-white text-[10px] font-semibold cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onExitTutorial?.()}
                  className="px-2.5 py-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-[10px] cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* ── FREELY DRAGGABLE & COLLAPSIBLE PARTY HEALTH OVERLAY ────────── */}
      {hudSettings.showPartyHealth && (
        <div
          ref={partyCardRef}
          className="fixed z-35 w-[232px] border border-stone-700/90 rounded-md shadow-2xl backdrop-blur-md overflow-hidden"
          style={{ left: partyPos.x, top: partyPos.y, ...panelStyle }}
        >
          <div
            onPointerDown={handlePartyDragStart}
            onPointerMove={handlePartyDragMove}
            onPointerUp={handlePartyDragEnd}
            onPointerCancel={handlePartyDragEnd}
            className="px-2.5 py-1.5 bg-stone-950/75 border-b border-stone-800/90 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing touch-none"
            title="Drag to move Party Health"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <GripHorizontal className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-mono-num text-[10px] font-bold text-stone-200 tracking-wider truncate">
                PARTY HEALTH ({activePlayers.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPartyOpen((o) => !o)}
              className="p-0.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 cursor-pointer shrink-0"
              aria-label={partyOpen ? 'Collapse Party Health' : 'Expand Party Health'}
              title={partyOpen ? 'Collapse' : 'Expand'}
            >
              {partyOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>

          {partyOpen && (
            <div className="p-2 space-y-1.5 max-h-[250px] overflow-y-auto">
              {activePlayers.map((pl) => {
                const isMe = pl.id === localPlayer.id;
                const col = playerColors[pl.id] || pl.color;
                const hpPct = pl.maxHp > 0 ? Math.max(0, Math.min(100, (pl.hp / pl.maxHp) * 100)) : 0;
                const wDef =
                  usesWeapons && pl.weapon !== 'none'
                    ? WEAPONS_CATALOG.find((w) => w.id === pl.weapon)
                    : undefined;
                const clsDef = HERO_CLASSES.find((c) => c.id === pl.heroClass);
                const pingMs = resolvePing(pl.id);
                const roleTag = usesWeapons
                  ? wDef
                    ? wDef.shortTag
                    : 'NONE'
                  : clsDef?.name.slice(0, 5).toUpperCase() || 'HERO';
                const canHostKick = isOnlineHost && pl.id !== 1 && !pl.isBot && Boolean(onKickPlayer);

                return (
                  <div
                    key={pl.id}
                    className={`rounded border px-2 py-1 space-y-0.5 ${
                      isMe ? 'bg-stone-900/85' : 'bg-black/65 border-stone-800/90'
                    }`}
                    style={{ borderColor: isMe ? `${col}bb` : undefined }}
                  >
                    <div className="flex items-center justify-between gap-1 font-mono-num text-[10px]">
                      <div className="flex items-center gap-1 min-w-0">
                        <span
                          className="w-2 h-2 rounded-sm shrink-0 border border-white/50"
                          style={{ backgroundColor: col }}
                        />
                        <span className="font-bold text-stone-100 truncate">
                          {isMe ? `YOU` : `${pl.isBot ? '[BOT] ' : ''}${pl.name || `P${pl.id}`}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] font-bold" style={{ color: wDef ? wDef.accent : '#a8a29e' }}>
                          {roleTag}
                        </span>
                        {isOnline && (
                          <span className={`text-[9px] tabular-nums ${pingTextColor(pingMs)}`}>
                            {pingMs === null ? '--' : `${pingMs}ms`}
                          </span>
                        )}
                        {canHostKick && (
                          <button
                            type="button"
                            onClick={() => onKickPlayer?.(pl.id)}
                            className="px-1 py-0.5 rounded bg-red-950/75 hover:bg-red-900 border border-red-600/60 text-red-200 cursor-pointer"
                            title={`Kick ${pl.name || `P${pl.id}`}`}
                            aria-label={`Kick ${pl.name || `P${pl.id}`}`}
                          >
                            <UserX className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-stone-950 border border-stone-800 overflow-hidden">
                        <div
                          className="h-full transition-all duration-150"
                          style={{
                            width: `${hpPct}%`,
                            background:
                              pl.state === 'down'
                                ? '#71717a'
                                : 'linear-gradient(90deg, #991b1b, #ef4444)',
                          }}
                        />
                      </div>
                      <span
                        className={`font-mono-num text-[9px] font-bold w-12 text-right shrink-0 tabular-nums ${
                          pl.state === 'down' ? 'text-rose-400 animate-pulse' : 'text-stone-200'
                        }`}
                      >
                        {pl.state === 'down' ? 'DOWN' : `${pl.hp}/${pl.maxHp}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── FLOATING BOTTOM COOLDOWN & ACTION DOCK ─────────────────────── */}
      <div className="pointer-events-none fixed bottom-0 inset-x-0 z-25 px-2 sm:px-3 pb-1.5 flex flex-col items-center gap-1.5">
        {showTouchControls && !isLandscapeMobile && (
          <div className="pointer-events-auto w-full max-w-[1100px]">
            <MobileControls
              p1={localPlayer}
              playerColor={myColor}
              isOnlineCampaign={usesWeapons}
              compact={false}
              showSkipIntro={hud.isBossLevel && hud.bossState === 'comic_intro'}
              onMoveChange={onTouchMove}
              onDashChange={onTouchDash}
              onAbilityChange={onTouchAbility}
              onSkillSlotChange={onTouchSkillSlot}
              onUsePotion={onUsePotion}
              onOpenInventory={hud.isOnlineCampaign ? onOpenInventory : undefined}
              onOpenShop={hud.isOnlineCampaign ? onOpenShop : undefined}
              onSkipIntro={onSkipIntro}
            />
          </div>
        )}

        <footer
          className="pointer-events-auto w-full max-w-[1380px] border border-stone-700/85 rounded-md px-2.5 py-1.5 flex items-center justify-between gap-2 overflow-x-auto backdrop-blur-md shadow-xl transition-transform"
          style={{
            ...panelStyle,
            transform: hudScale !== 1 ? `scale(${hudScale})` : undefined,
            transformOrigin: 'bottom center',
          }}
        >
          {/* 4 Weapon/Class Skills + Dash */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className={`px-2 py-1 rounded border font-mono-num text-[10px] flex items-center gap-1.5 whitespace-nowrap tabular-nums ${
                localPlayer.dashReady
                  ? 'bg-emerald-950/45 border-emerald-600/70 text-emerald-200'
                  : 'bg-black/75 border-stone-800 text-stone-400'
              }`}
            >
              <span className="font-bold text-stone-300">SPACE</span>
              <span>
                {localPlayer.dashReady
                  ? localPlayer.dash2Active && localPlayer.dash2Ready
                    ? 'DASH x2'
                    : 'DASH OK'
                  : `${localPlayer.dashCooldown}s`}
              </span>
            </div>

            {usesWeapons && localPlayer.weapon === 'none' ? (
              <div className="px-2.5 py-1 rounded border border-stone-800 bg-black/75 font-mono-num text-[10px] text-stone-400 whitespace-nowrap">
                UNARMED · Open Chest or Shop to equip Weapon
              </div>
            ) : (
              localSkillsList.map((sk, idx) => {
                const slot = idx + 1;
                const unlocked = usesWeapons
                  ? localPlayer.weapon !== 'none' && (slot === 1 || learnedArr.includes(slot))
                  : (localPlayer.unlockedSkillTier || 1) >= slot;
                const cd = localPlayer.skillCooldowns?.[idx] || 0;
                const ready = unlocked && cd <= 0;
                const accent = wpnDefLocal?.accent || clsDefLocal?.accent || '#f59e0b';
                return (
                  <div
                    key={sk.slot}
                    title={`${sk.name}: ${sk.desc}`}
                    className={`px-2 py-1 rounded border font-mono-num text-[10px] flex items-center gap-1.5 whitespace-nowrap tabular-nums ${
                      !unlocked
                        ? 'bg-stone-950/75 border-stone-800/80 text-stone-600'
                        : ready
                        ? 'bg-black/85 text-stone-100'
                        : 'bg-black/65 border-stone-800 text-amber-300'
                    }`}
                    style={{ borderColor: ready ? `${accent}aa` : undefined }}
                  >
                    <span
                      className="font-bold"
                      style={{ color: unlocked ? accent : '#52525b' }}
                    >
                      [{sk.keyLabel}]
                    </span>
                    {!hudSettings.compactSkills && (
                      <span className="hidden md:inline max-w-[84px] truncate">{sk.shortName}</span>
                    )}
                    {!unlocked ? (
                      <Lock className="w-2.5 h-2.5 text-purple-400" />
                    ) : ready ? (
                      <span className="text-[9px] text-emerald-300 font-bold">RDY</span>
                    ) : (
                      <span className="text-[9px] text-amber-300 font-bold">{cd}s</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Essential Actions: Flask [C], Bag [I], Merchant [E] */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!hud.isTutorial && (
              <button
                type="button"
                onClick={() => onUsePotion?.()}
                disabled={!potionReady}
                className={`px-2.5 py-1 rounded border font-mono-num text-[10px] font-bold flex items-center gap-1 whitespace-nowrap tabular-nums ${
                  potionReady
                    ? 'bg-rose-950/60 hover:bg-rose-900/70 border-rose-500/80 text-rose-100 cursor-pointer'
                    : 'bg-black/75 border-stone-800 text-stone-500 cursor-default'
                }`}
                title="Drink Crimson Flask [C] (+45 HP)"
              >
                <FlaskConical className={`w-3.5 h-3.5 ${localPlayer.potions > 0 ? 'text-rose-400' : 'text-stone-600'}`} />
                <span>
                  {localPlayer.potionCooldown > 0
                    ? `${localPlayer.potionCooldown}s`
                    : `FLASK ${localPlayer.potions}/2 [C]`}
                </span>
              </button>
            )}

            {hud.isOnlineCampaign && !hud.isTutorial && onOpenInventory && (
              <button
                type="button"
                onClick={() => onOpenInventory()}
                className="px-2.5 py-1 rounded border border-stone-700 hover:border-amber-400/80 bg-black/80 hover:bg-stone-900 font-mono-num text-[10px] font-bold text-stone-200 flex items-center gap-1 whitespace-nowrap cursor-pointer tabular-nums"
                title="Open Weapon & Scroll Bag [I]"
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>BAG [I]</span>
                <span className="text-purple-300">({bagCount}/8)</span>
              </button>
            )}

            {hud.isOnlineCampaign && !hud.isTutorial && localPlayer.nearMerchant && onOpenShop && (
              <button
                type="button"
                onClick={() => onOpenShop()}
                className="px-2.5 py-1 rounded border border-amber-400 bg-amber-950/85 hover:bg-amber-900 text-amber-200 font-mono-num text-[10px] font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer animate-pulse"
              >
                <Store className="w-3.5 h-3.5 text-amber-300" />
                <span>VEX [E]</span>
              </button>
            )}
          </div>
        </footer>
      </div>

      {showTouchControls && isLandscapeMobile && (
        <div className="fixed bottom-14 inset-x-2 z-30 pointer-events-none">
          <MobileControls
            p1={localPlayer}
            playerColor={myColor}
            isOnlineCampaign={usesWeapons}
            compact
            showSkipIntro={hud.isBossLevel && hud.bossState === 'comic_intro'}
            onMoveChange={onTouchMove}
            onDashChange={onTouchDash}
            onAbilityChange={onTouchAbility}
            onSkillSlotChange={onTouchSkillSlot}
            onUsePotion={onUsePotion}
            onOpenInventory={hud.isOnlineCampaign ? onOpenInventory : undefined}
            onOpenShop={hud.isOnlineCampaign ? onOpenShop : undefined}
            onSkipIntro={onSkipIntro}
          />
        </div>
      )}
    </div>
  );
};
