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
  Wind,
  Heart,
  Crosshair,
  Snowflake,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  BOONS_CATALOG,
  BOSS_VARIANTS,
  BossChannelKind,
  BossType,
  BossVariantId,
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
  onSwitchPracticeBoss?: (bossStage: 'mechaBoss' | 'voidBoss' | 'oniBoss' | 'eclipseBoss', variantId?: BossVariantId) => void;
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

function getAlbionSkillIcon(shortName: string, weapon: WeaponId, slotIdx: number, iconClass: string) {
  const key = shortName.toUpperCase();
  if (key.includes('HEAL') || key.includes('DAWN') || key.includes('TETHER') || key.includes('REVIV')) {
    return <Heart className={iconClass} />;
  }
  if (key.includes('BARRIER') || key.includes('SANCTUM') || key.includes('COLOSSUS') || key.includes('CHARGE')) {
    return <Shield className={iconClass} />;
  }
  if (key.includes('TRAP') || key.includes('FROST')) {
    return <Snowflake className={iconClass} />;
  }
  if (key.includes('SNIPE') || key.includes('VOLLEY') || key.includes('BARRAGE')) {
    return <Crosshair className={iconClass} />;
  }
  if (key.includes('CLOAK') || key.includes('BLINK') || key.includes('KUNAI') || key.includes('BLOSSOM')) {
    return slotIdx === 2 ? <Wind className={iconClass} /> : <Target className={iconClass} />;
  }
  if (key.includes('CATACLYSM') || key.includes('WHIRL') || key.includes('WARCRY') || key.includes('CLEAVE')) {
    return slotIdx === 3 ? <Flame className={iconClass} /> : <Swords className={iconClass} />;
  }
  if (weapon === 'holy_staff') return <Sparkles className={iconClass} />;
  if (weapon === 'tank_shield') return <Shield className={iconClass} />;
  if (weapon === 'ranger_bow') return <Crosshair className={iconClass} />;
  if (weapon === 'assassin_blades') return <Zap className={iconClass} />;
  return <Swords className={iconClass} />;
}

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
  compactMobile?: boolean;
  onChangeOpacity: (next: number) => void;
  onHideMap: () => void;
}> = React.memo(({ floorMap, opacity, compactMobile = false, onChangeOpacity, onHideMap }) => {
  const nodeMap = new Map<string, FloorMapNodeHud>();
  floorMap.nodes.forEach((n) => nodeMap.set(`${n.gx},${n.gy}`, n));
  const size = floorMap.gridSize || 5;

  return (
    <div
      className={`bg-transparent border-0 shadow-none p-1 space-y-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] ${
        compactMobile ? 'w-[144px] sm:w-[196px]' : 'w-[192px] sm:w-[208px]'
      }`}
      style={{ opacity }}
    >
      <div className="flex items-center justify-between gap-1.5 px-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapIcon className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
          <span className="font-souls text-[10px] font-bold text-stone-100 tracking-wider truncate [text-shadow:0_1px_4px_rgba(0,0,0,0.95)]">
            FLOOR {floorMap.floorNumber} MAP
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {floorMap.loopLevel > 1 && (
            <span className="inline-flex items-center gap-0.5 font-mono-num text-[9px] font-bold text-rose-300 [text-shadow:0_1px_3px_rgba(0,0,0,0.95)]">
              <Flame className="w-2.5 h-2.5" />
              L{floorMap.loopLevel}
            </span>
          )}
          <button
            type="button"
            onClick={onHideMap}
            className="p-0.5 rounded bg-black/30 hover:bg-black/60 text-stone-200 cursor-pointer"
            title="Hide Map"
            aria-label="Hide Floor Map"
          >
            <EyeOff className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Floor Room Grid (boxless floating nodes) */}
      <div
        className="bg-transparent border-0 p-0.5 grid gap-1 w-full"
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
                className="aspect-square bg-transparent border-0"
              />
            );
          }

          const isCurrent = node.key === floorMap.currentRoomKey;
          const isBoss = node.kind === 'boss';
          const isShop = node.kind === 'shop';
          const isTreasure = node.kind === 'treasure';
          const isStart = node.kind === 'start';

          let cellStyle = 'bg-stone-900/60 border-stone-500/75 text-stone-200';
          if (isBoss) {
            cellStyle = node.cleared
              ? 'bg-emerald-950/55 border-emerald-400/80 text-emerald-300'
              : 'bg-rose-950/65 border-rose-500/90 text-rose-300';
          } else if (isShop) {
            cellStyle = 'bg-amber-950/60 border-amber-400/85 text-amber-300';
          } else if (isTreasure) {
            cellStyle = 'bg-purple-950/60 border-purple-400/85 text-purple-300';
          } else if (isStart) {
            cellStyle = 'bg-cyan-950/55 border-cyan-400/80 text-cyan-300';
          } else if (node.cleared) {
            cellStyle = 'bg-emerald-950/45 border-emerald-500/75 text-emerald-300';
          } else if (!node.visited) {
            cellStyle = 'bg-slate-950/55 border-slate-500/65 border-dashed text-slate-300';
          }

          return (
            <div key={node.key} className="relative aspect-square">
              {node.connections.right && (
                <span className="pointer-events-none absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-[2px] bg-stone-400/85 z-0" />
              )}
              {node.connections.bottom && (
                <span className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 w-[2px] h-1 bg-stone-400/85 z-0" />
              )}

              <div
                title={`${node.kind.toUpperCase()}${node.cleared ? ' (CLEARED)' : node.visited ? ' (VISITED)' : ' (UNEXPLORED)'}`}
                className={`relative z-10 w-full h-full rounded-[3px] border flex items-center justify-center font-mono-num text-[9px] font-bold transition-all ${cellStyle} ${
                  isCurrent ? 'ring-2 ring-white shadow-[0_0_8px_rgba(255,255,255,0.75)] scale-105' : ''
                }`}
              >
                {getRoomSymbol(node)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Opacity Slider & Compact Legend */}
      <div className="space-y-0.5 pt-0.5 px-0.5 [text-shadow:0_1px_3px_rgba(0,0,0,0.95)]">
        <div className="flex items-center gap-1.5 text-[9px] font-mono-num text-stone-200">
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
        <div className="flex items-center justify-between text-[8px] font-mono-num text-stone-200">
          <span className="text-amber-300">$ Shop</span>
          <span className="text-purple-300">◈ Vault</span>
          <span className="text-rose-300">☠ Boss</span>
          <span className="text-emerald-300">✓ Clear</span>
        </div>
        {(() => {
          const bossNode = floorMap.nodes.find((n) => n.kind === 'boss' && n.revealed && n.bossVariantId);
          const vDef = bossNode?.bossVariantId ? BOSS_VARIANTS.find((v) => v.id === bossNode.bossVariantId) : null;
          if (!vDef) return null;
          return (
            <div className="pt-0.5 border-t border-white/15 flex items-center justify-between gap-1 text-[8px] font-mono-num">
              <span className="font-bold truncate" style={{ color: vDef.accent }}>
                ☠ {vDef.shortName}
              </span>
              <span className="text-amber-200 font-bold truncate shrink-0">
                {vDef.suggestedLabel}
              </span>
            </div>
          );
        })()}
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
  const [practiceBossTab, setPracticeBossTab] = useState<BossType>(() => hud.bossType || 'mecha');

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

  // Cooldown completion flash detection for Dash, Skills 1..4, and Crimson Flask
  const [flashGen, setFlashGen] = useState<Record<string, number>>({});
  const [flashActive, setFlashActive] = useState<Record<string, boolean>>({});
  const flashTimersRef = useRef<Record<string, number>>({});
  const prevCdRef = useRef<{
    weapon: string;
    dash: number;
    skills: number[];
    flask: number;
  }>({
    weapon: localPlayer.weapon,
    dash: 0,
    skills: [0, 0, 0, 0],
    flask: 0,
  });

  useEffect(() => {
    return () => {
      for (const tid of Object.values(flashTimersRef.current)) {
        window.clearTimeout(tid);
      }
      flashTimersRef.current = {};
    };
  }, []);

  const triggerSkillFlash = (key: string) => {
    setFlashGen((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    setFlashActive((prev) => ({ ...prev, [key]: true }));
    if (flashTimersRef.current[key]) {
      window.clearTimeout(flashTimersRef.current[key]);
    }
    flashTimersRef.current[key] = window.setTimeout(() => {
      setFlashActive((prev) => ({ ...prev, [key]: false }));
      delete flashTimersRef.current[key];
    }, 680);
  };

  useEffect(() => {
    const prev = prevCdRef.current;
    const curDash = localPlayer.dashCooldownExact ?? localPlayer.dashCooldown ?? 0;
    const curFlask = localPlayer.potionCooldownExact ?? localPlayer.potionCooldown ?? 0;
    const curSkills = [0, 1, 2, 3].map(
      (idx) => localPlayer.skillCooldownsExact?.[idx] ?? localPlayer.skillCooldowns?.[idx] ?? 0
    );

    if (prev.dash > 0.05 && curDash <= 0 && localPlayer.dashReady) {
      triggerSkillFlash('dash');
    }

    if (prev.weapon !== localPlayer.weapon) {
      prev.weapon = localPlayer.weapon;
    } else {
      for (let idx = 0; idx < 4; idx++) {
        const slot = idx + 1;
        const unlocked = usesWeapons
          ? localPlayer.weapon !== 'none' && (slot === 1 || learnedArr.includes(slot))
          : (localPlayer.unlockedSkillTier || 1) >= slot;
        if (unlocked && prev.skills[idx] > 0.05 && curSkills[idx] <= 0) {
          triggerSkillFlash(`skill_${idx}`);
        }
      }
    }

    if (localPlayer.potions > 0 && prev.flask > 0.05 && curFlask <= 0) {
      triggerSkillFlash('flask');
    }

    prevCdRef.current = {
      weapon: localPlayer.weapon,
      dash: curDash,
      skills: curSkills,
      flask: curFlask,
    };
  }, [
    localPlayer.weapon,
    localPlayer.dashReady,
    localPlayer.dashCooldown,
    localPlayer.dashCooldownExact,
    localPlayer.skillCooldowns,
    localPlayer.skillCooldownsExact,
    localPlayer.potions,
    localPlayer.potionCooldown,
    localPlayer.potionCooldownExact,
    localPlayer.unlockedSkillTier,
    usesWeapons,
    learnedArr.join(','),
  ]);

  const bossPct = hud.bossMaxHealth > 0 ? Math.max(0, (hud.bossHealth / hud.bossMaxHealth) * 100) : 0;
  const showBossBar =
    hudSettings.showBossBar && hud.isBossLevel && hud.bossHealth > 0 && hud.bossState !== 'comic_intro';

  const isMobileHud = showTouchControls || isLandscapeMobile;
  const panelBgAlpha = isMobileHud
    ? Math.max(0.12, Math.min(0.32, hudSettings.opacity * 0.3))
    : Math.max(0.25, Math.min(0.96, hudSettings.opacity * 0.88));
  const panelStyle: React.CSSProperties = {
    backgroundColor: isMobileHud ? `rgba(10, 9, 14, ${panelBgAlpha})` : `rgba(10, 9, 14, ${panelBgAlpha})`,
  };
  const hudScale = Math.max(0.75, Math.min(1.2, hudSettings.scale || 1));

  const mapAnchorClass =
    hudSettings.mapPosition === 'top-left'
      ? isMobileHud
        ? 'top-[54px] left-2'
        : 'top-[86px] left-2.5 sm:left-3'
      : hudSettings.mapPosition === 'bottom-right'
      ? 'bottom-[68px] right-2.5 sm:right-3'
      : isMobileHud
      ? 'top-[54px] right-2'
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
      <div
        className={`pointer-events-none fixed top-0 inset-x-0 z-25 flex flex-col items-center ${
          isMobileHud ? 'px-1.5 pt-1 gap-0.5' : 'px-2 sm:px-3 pt-1.5 gap-1'
        }`}
      >
        <header
          className={`pointer-events-auto w-full max-w-[1380px] flex items-center justify-between transition-transform ${
            isMobileHud
              ? 'flex-nowrap gap-1 px-1.5 py-0.5 rounded border border-white/10 shadow-none'
              : 'flex-wrap gap-2 px-2.5 py-1 rounded-md border border-stone-700/85 backdrop-blur-md shadow-xl'
          }`}
          style={{
            ...panelStyle,
            transform: hudScale !== 1 ? `scale(${hudScale})` : undefined,
            transformOrigin: 'top center',
          }}
        >
          {/* Left: My Health + Stage Tag */}
          <div className={`flex items-center gap-2 min-w-0 flex-1 ${isMobileHud ? 'max-w-[180px]' : 'max-w-[440px]'}`}>
            <div className={`${isMobileHud ? 'min-w-[92px] max-w-[165px]' : 'min-w-[135px] max-w-[230px]'} flex-1 space-y-0.5`}>
              <div className={`flex items-center justify-between gap-1 font-mono-num ${isMobileHud ? 'text-[9px]' : 'text-[10px]'}`}>
                <span className="font-bold truncate [text-shadow:0_1px_3px_rgba(0,0,0,0.95)]" style={{ color: myColor }}>
                  {localPlayer.name || `P${localPlayer.id}`}
                  {wpnDefLocal ? ` · ${wpnDefLocal.shortTag}` : usesWeapons ? ' · UNARMED' : ''}
                </span>
                <span className="font-bold text-stone-100 shrink-0 tabular-nums [text-shadow:0_1px_3px_rgba(0,0,0,0.95)]">
                  {localPlayer.state === 'down' ? 'DOWN' : `${localPlayer.hp}/${localPlayer.maxHp}`}
                </span>
              </div>
              <div className={`relative w-full ${isMobileHud ? 'h-1.5 bg-black/45 border-white/20' : 'h-2.5 bg-stone-950 border-stone-700/90'} border rounded-sm overflow-hidden`}>
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
          <div className={`flex items-center shrink-0 justify-end ${isMobileHud ? 'gap-1 flex-nowrap' : 'gap-1.5 flex-wrap'}`}>
            {hudSettings.showGoldCounter && (
              <div
                key={`gold-${goldPulseTick > 0 ? 'pulse' : 'base'}`}
                data-gold-target="true"
                className={`rounded border font-mono-num font-extrabold flex items-center gap-1 transition-transform duration-150 tabular-nums ${
                  isMobileHud ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs gap-1.5'
                } ${
                  goldPulseTick > 0
                    ? 'bg-amber-950/70 border-amber-400 text-amber-200 scale-105 shadow-[0_0_16px_rgba(251,191,36,0.45)]'
                    : isMobileHud
                    ? 'bg-black/25 border-amber-500/45 text-amber-300 [text-shadow:0_1px_3px_rgba(0,0,0,0.95)]'
                    : 'bg-black/75 border-amber-600/60 text-amber-300'
                }`}
                title={hud.isOnlineCampaign ? 'Your Gold Coins' : 'Run Score'}
              >
                <Coins className={`${isMobileHud ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-400 shrink-0`} />
                <span>
                  {hud.isOnlineCampaign ? `${localPlayer.coins}g` : hud.score.toLocaleString()}
                </span>
              </div>
            )}

            {isOnline && hudSettings.showPing && (
              <div
                className={`rounded border font-mono-num font-bold flex items-center gap-1 tabular-nums ${
                  isMobileHud
                    ? 'px-1.5 py-0.5 text-[10px] border-white/15 bg-black/25 [text-shadow:0_1px_3px_rgba(0,0,0,0.95)]'
                    : 'px-2 py-1 text-[11px] border-stone-800 bg-black/75'
                } ${pingTextColor(myPingMs)}`}
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
                className={`rounded border font-mono-num font-semibold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                  isMobileHud ? 'p-1 text-[10px]' : 'px-2.5 py-1 text-[11px]'
                } ${
                  showMap
                    ? isMobileHud
                      ? 'bg-cyan-950/35 border-cyan-400/65 text-cyan-200'
                      : 'bg-cyan-950/70 border-cyan-500/75 text-cyan-200'
                    : isMobileHud
                    ? 'bg-black/25 border-white/15 text-stone-300'
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
              className={`rounded border font-mono-num font-semibold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                isMobileHud ? 'p-1 text-[10px]' : 'px-2.5 py-1 text-[11px]'
              } ${
                showExtraUi
                  ? isMobileHud
                    ? 'bg-purple-950/35 border-purple-400/65 text-purple-200'
                    : 'bg-purple-950/70 border-purple-500/75 text-purple-200'
                  : isMobileHud
                  ? 'bg-black/25 border-white/15 text-stone-300'
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
              className={`rounded border text-[11px] text-stone-200 flex items-center gap-1 cursor-pointer ${
                isMobileHud
                  ? 'p-1 bg-black/25 border-white/15'
                  : 'px-2 py-1 bg-stone-900 hover:bg-stone-800 border-stone-700'
              }`}
              title="HUD & Control Settings"
            >
              <Keyboard className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden md:inline">HUD / Keys</span>
            </button>

            <button
              type="button"
              onClick={onToggleTouchControls}
              className={`rounded border cursor-pointer flex items-center justify-center ${
                isMobileHud ? 'p-1' : 'p-1.5'
              } ${
                showTouchControls
                  ? isMobileHud
                    ? 'bg-emerald-950/35 border-emerald-400/70 text-emerald-300'
                    : 'bg-emerald-950/65 border-emerald-500/80 text-emerald-300'
                  : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-stone-200'
              }`}
              title={showTouchControls ? 'Mobile Mode: ON (Click to switch to Keyboard HUD)' : 'Mobile Mode: OFF (Click for Touch Joystick)'}
              aria-label="Toggle Mobile Mode Controls"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              className={`rounded border text-stone-300 cursor-pointer ${
                isMobileHud
                  ? 'p-1 bg-black/25 border-white/15'
                  : 'p-1.5 bg-stone-900 hover:bg-stone-800 border-stone-700'
              }`}
              aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
            </button>
            <button
              type="button"
              onClick={onToggleFullscreen}
              className={`hidden sm:flex rounded border cursor-pointer ${
                isMobileHud ? 'p-1' : 'p-1.5'
              } ${
                isFullscreen
                  ? isMobileHud
                    ? 'bg-cyan-950/35 border-cyan-400/65 text-cyan-300'
                    : 'bg-cyan-950/60 border-cyan-500/70 text-cyan-300'
                  : isMobileHud
                  ? 'bg-black/25 border-white/15 text-stone-300'
                  : 'bg-stone-900 hover:bg-stone-800 border-stone-700 text-stone-300'
              }`}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onPause}
              className={`rounded border text-[11px] font-semibold text-stone-100 flex items-center gap-1 cursor-pointer ${
                isMobileHud
                  ? 'px-1.5 py-1 bg-black/25 border-white/15'
                  : 'px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border-stone-700'
              }`}
            >
              <Pause className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pause</span>
            </button>
          </div>
        </header>

        {/* Floating Boss Health Bar / Compact Stage Strip */}
        {showBossBar ? (
          <div
            className={
              isMobileHud
                ? 'w-full max-w-[330px] sm:max-w-[440px] px-1.5 py-0 bg-transparent border-0 shadow-none'
                : 'w-full max-w-[740px] px-2 py-0.5 bg-transparent border-0 shadow-none'
            }
          >
            <div className={`flex items-center justify-between gap-1.5 ${isMobileHud ? 'text-[9px]' : 'text-[11px]'}`}>
              <span className="font-souls font-bold text-stone-100 tracking-wider truncate [text-shadow:0_1px_4px_rgba(0,0,0,0.98),0_0_8px_rgba(0,0,0,0.85)]">
                {isMobileHud ? hud.bossVariantName || hud.bossName : hud.bossName}
                {hud.loopLevel > 1 ? ` · L${hud.loopLevel}` : ''}
              </span>
              {isMobileHud && hud.bossSuggestedWeapons && hud.bossSuggestedWeapons.length > 0 && (
                <div className="flex items-center gap-0.5 shrink-0">
                  {hud.bossSuggestedWeapons.map((wid) => {
                    const wDef = WEAPONS_CATALOG.find((w) => w.id === wid);
                    const playerHas = localPlayer.weapon === wid;
                    return (
                      <span
                        key={wid}
                        className="px-1 rounded border font-mono-num text-[8px] font-bold bg-black/20 [text-shadow:0_1px_3px_rgba(0,0,0,0.98)]"
                        style={{
                          borderColor: playerHas ? '#34d399' : wDef?.accent || '#57534e',
                          color: playerHas ? '#6ee7b7' : wDef?.accent || '#e7e5e4',
                        }}
                      >
                        {wDef?.shortTag || wid}{playerHas ? '✓' : ''}
                      </span>
                    );
                  })}
                </div>
              )}
              {!isMobileHud && hud.bossAttackLabel && (
                <span className="font-mono-num text-[10px] font-bold text-amber-300 animate-pulse truncate [text-shadow:0_1px_4px_rgba(0,0,0,0.98)]">
                  ▲ {hud.bossAttackLabel} ▲
                </span>
              )}
              <span className="font-mono-num text-[10px] sm:text-[11px] text-stone-100 shrink-0 tabular-nums [text-shadow:0_1px_4px_rgba(0,0,0,0.98),0_0_8px_rgba(0,0,0,0.85)]">
                {hud.bossHealth}/{hud.bossMaxHealth}
              </span>
            </div>
            <div
              className={`relative w-full overflow-hidden mt-0.5 rounded-full ${
                isMobileHud ? 'h-1.5 bg-black/25 border border-white/25' : 'h-2 bg-black/25 border border-white/25'
              }`}
            >
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
                      ? 'linear-gradient(90deg, rgba(146,64,14,0.9), rgba(220,38,38,0.92), rgba(245,158,11,0.95))'
                      : 'linear-gradient(90deg, rgba(92,10,10,0.88), rgba(153,27,27,0.92), rgba(220,38,38,0.94))',
                }}
              />
            </div>

            {!isMobileHud && hud.bossSuggestedWeapons && hud.bossSuggestedWeapons.length > 0 && (() => {
              const suggested = hud.bossSuggestedWeapons;
              const isMatched = localPlayer.weapon !== 'none' && suggested.includes(localPlayer.weapon);
              return (
                <div className="mt-1 flex flex-wrap items-center justify-between gap-1.5 font-mono-num text-[9px] sm:text-[10px] [text-shadow:0_1px_4px_rgba(0,0,0,0.98),0_0_6px_rgba(0,0,0,0.85)]">
                  <div className="flex flex-wrap items-center gap-1">
                    {hud.bossVariantName && (
                      <span className="px-1.5 py-0.5 rounded bg-black/25 border border-white/15 text-stone-100 font-bold">
                        {hud.bossVariantName}
                      </span>
                    )}
                    <span className="text-amber-300 font-bold uppercase tracking-wide">
                      Suggested:
                    </span>
                    {suggested.map((wid) => {
                      const wDef = WEAPONS_CATALOG.find((w) => w.id === wid);
                      const playerHas = localPlayer.weapon === wid;
                      return (
                        <span
                          key={wid}
                          className={`px-1.5 py-0.5 rounded border font-bold ${
                            playerHas ? 'bg-emerald-950/35' : 'bg-black/25'
                          }`}
                          style={{
                            borderColor: playerHas ? '#34d399' : wDef?.accent || '#57534e',
                            color: playerHas ? '#6ee7b7' : wDef?.accent || '#e7e5e4',
                          }}
                        >
                          {wDef?.shortTag || wid}{playerHas ? ' ✓' : ''}
                        </span>
                      );
                    })}
                  </div>
                  <span
                    className={`truncate max-w-full sm:max-w-[360px] ${
                      isMatched ? 'text-emerald-300 font-semibold' : 'text-amber-200'
                    }`}
                    title={isMatched ? hud.bossSuggestionText : hud.bossHardshipNote}
                  >
                    {isMatched
                      ? hud.bossSuggestionText || 'Optimal gear equipped!'
                      : hud.bossHardshipNote || 'Off-meta gear: expect tougher mechanics!'}
                  </span>
                </div>
              );
            })()}
          </div>
        ) : (
          <div
            className={`border rounded-full flex items-center gap-2.5 font-mono-num text-[10px] text-stone-100 [text-shadow:0_1px_3px_rgba(0,0,0,0.95)] ${
              isMobileHud ? 'px-2.5 py-0 border-white/15 bg-black/20' : 'px-3.5 py-0.5 border-white/15 bg-black/20'
            }`}
          >
            <span className="font-souls text-amber-400 tracking-wider truncate max-w-[260px]">
              {hud.stageLabel}
              {hud.loopLevel > 1 ? ` · LOOP ${hud.loopLevel}` : ''}
            </span>
            <span className="text-stone-300 shrink-0">
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
            className={`w-full rounded px-2.5 border flex items-center justify-between gap-2 font-mono-num font-bold animate-pulse [text-shadow:0_1px_3px_rgba(0,0,0,0.98)] ${
              isMobileHud ? 'max-w-[380px] py-0.5 text-[9px]' : 'max-w-[740px] py-0.5 text-[11px]'
            } ${
              hud.bossChannel.kind === 'siege_beam'
                ? 'bg-sky-950/20 border-sky-400/75 text-sky-100'
                : hud.bossChannel.kind === 'bow_weakpoint' || hud.bossChannel.kind === 'sky_battery'
                ? 'bg-emerald-950/20 border-emerald-400/75 text-emerald-100'
                : hud.bossChannel.kind === 'cursed_miasma'
                ? 'bg-lime-950/20 border-lime-400/75 text-lime-100'
                : hud.bossChannel.kind === 'cursed_floor' ||
                  hud.bossChannel.kind === 'meteor_soak' ||
                  hud.bossChannel.kind === 'demon_seal_purge'
                ? 'bg-orange-950/20 border-amber-400/75 text-amber-100'
                : hud.bossChannel.kind === 'hunter_mark' ||
                  hud.bossChannel.kind === 'iron_carapace' ||
                  hud.bossChannel.kind === 'obsidian_phalanx' ||
                  hud.bossChannel.kind === 'blood_curse'
                ? 'bg-rose-950/20 border-rose-400/75 text-rose-100'
                : 'bg-purple-950/20 border-purple-400/75 text-purple-100'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{hud.bossChannel.label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 tabular-nums">
              {(hud.bossChannel.kind === 'interrupt' ||
                hud.bossChannel.kind === 'hunter_mark' ||
                hud.bossChannel.kind === 'bow_weakpoint' ||
                hud.bossChannel.kind === 'sky_battery' ||
                hud.bossChannel.kind === 'emp_interrupt' ||
                hud.bossChannel.kind === 'mirage_ambush' ||
                hud.bossChannel.kind === 'demon_seal_purge' ||
                hud.bossChannel.kind === 'cursed_miasma' ||
                hud.bossChannel.kind === 'blood_curse' ||
                hud.bossChannel.kind === 'iron_carapace' ||
                hud.bossChannel.kind === 'obsidian_phalanx') && (
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
            opacity={isMobileHud ? Math.min(mapOpacity, 0.72) : mapOpacity}
            compactMobile={isMobileHud}
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
                {(() => {
                  const activeVariant =
                    BOSS_VARIANTS.find((v) => v.id === hud.bossVariantId) ||
                    BOSS_VARIANTS.find((v) => v.bossType === hud.bossType);
                  const drillLabels: Record<BossChannelKind, string> = {
                    cursed_floor: 'Lava Island',
                    siege_beam: 'Siege Cone',
                    bow_weakpoint: 'Core (Bow 3X)',
                    sky_battery: 'Sky Pylons (Bow)',
                    emp_interrupt: 'EMP (Sin Break)',
                    mirage_ambush: 'Shadow Parry (Sin)',
                    cursed_miasma: 'Miasma (Staff)',
                    blood_curse: 'Blood Curse (Staff)',
                    iron_carapace: 'Carapace (Sword)',
                    obsidian_phalanx: 'Phalanx (Sword)',
                    hunter_mark: 'Hunter Mark',
                    gravity_storm: 'Gravity Vortex',
                    abyss_tether: 'Soul Tether',
                    demon_seal_purge: 'Seal Purge',
                    meteor_soak: 'Meteor Soak',
                    interrupt: 'Rift Shatter',
                  };
                  const pool = activeVariant?.channelPool || ['cursed_floor', 'siege_beam'];
                  return pool.map((atkKind) => (
                    <button
                      key={atkKind}
                      type="button"
                      disabled={isOnline && localPlayer.id !== 1}
                      onClick={() => onTriggerPracticeAttack?.(atkKind)}
                      className="px-2 py-1 rounded border border-amber-700/60 bg-amber-950/35 hover:bg-amber-900/50 text-amber-200 text-[9px] font-mono-num font-bold cursor-pointer disabled:opacity-45 truncate"
                    >
                      {drillLabels[atkKind] || atkKind}
                    </button>
                  ));
                })()}
                <button
                  type="button"
                  disabled={isOnline && localPlayer.id !== 1}
                  onClick={() => onTriggerPracticeAttack?.()}
                  className="px-2 py-1 rounded border border-cyan-700/70 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-200 text-[9px] font-mono-num font-bold cursor-pointer disabled:opacity-45 truncate"
                >
                  Next Attack ↻
                </button>
              </div>
              <div className="space-y-1.5 pt-1 border-t border-stone-800/80">
                <div className="font-mono-num text-[8px] text-stone-400 uppercase tracking-wider">
                  Boss Variant &amp; Role Setup (16 Total)
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {(['mecha', 'void', 'oni', 'eclipse'] as BossType[]).map((bt) => {
                    const activeTab = practiceBossTab === bt;
                    return (
                      <button
                        key={bt}
                        type="button"
                        onClick={() => setPracticeBossTab(bt)}
                        className={`px-1 py-0.5 rounded border text-[8px] font-mono-num font-bold uppercase cursor-pointer ${
                          activeTab
                            ? 'bg-cyan-950/75 border-cyan-400 text-cyan-200'
                            : 'bg-black/65 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {bt}
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {BOSS_VARIANTS.filter((v) => v.bossType === practiceBossTab).map((v) => {
                    const isCur = hud.bossVariantId === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={isOnline && localPlayer.id !== 1}
                        onClick={() => {
                          setPracticeBossTab(v.bossType);
                          onSwitchPracticeBoss?.(v.stage, v.id);
                        }}
                        title={`${v.name} — Suggested: ${v.suggestedLabel}`}
                        className={`px-1.5 py-1 rounded border text-[8px] font-mono-num font-bold cursor-pointer disabled:opacity-45 text-left truncate ${
                          isCur
                            ? 'bg-rose-950/70 border-rose-400 text-white'
                            : 'bg-black/70 border-stone-800 text-stone-300 hover:border-rose-600/70'
                        }`}
                      >
                        <div className="truncate">{v.shortName}</div>
                        <div className="text-[7px] opacity-80 truncate" style={{ color: v.accent }}>
                          {v.suggestedLabel}
                        </div>
                      </button>
                    );
                  })}
                </div>
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

      {/* ── BOXLESS TRANSPARENT DRAGGABLE & COLLAPSIBLE PARTY HEALTH OVERLAY ────────── */}
      {hudSettings.showPartyHealth && (
        <div
          ref={partyCardRef}
          className={`fixed z-35 bg-transparent border-0 shadow-none ${
            isMobileHud ? 'w-[158px] sm:w-[210px] opacity-80' : 'w-[224px]'
          }`}
          style={{ left: partyPos.x, top: partyPos.y }}
        >
          <div
            onPointerDown={handlePartyDragStart}
            onPointerMove={handlePartyDragMove}
            onPointerUp={handlePartyDragEnd}
            onPointerCancel={handlePartyDragEnd}
            className="px-1 py-0.5 bg-transparent flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing touch-none drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]"
            title="Drag to move Party Health"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <GripHorizontal className="w-3.5 h-3.5 text-stone-300/80 shrink-0" />
              <Users className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span className="font-mono-num text-[10px] font-bold text-stone-100 tracking-wider truncate">
                PARTY ({activePlayers.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPartyOpen((o) => !o)}
              className="p-0.5 rounded bg-black/25 hover:bg-black/55 text-stone-100 cursor-pointer shrink-0"
              aria-label={partyOpen ? 'Collapse Party Health' : 'Expand Party Health'}
              title={partyOpen ? 'Collapse' : 'Expand'}
            >
              {partyOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>

          {partyOpen && (
            <div className="px-1 pt-0.5 space-y-1.5 max-h-[250px] overflow-y-auto">
              {activePlayers.map((pl) => {
                const isMe = pl.id === localPlayer.id;
                const col = playerColors[pl.id] || pl.color;
                const hpPct = pl.maxHp > 0 ? Math.max(0, Math.min(100, (pl.hp / pl.maxHp) * 100)) : 0;
                const pingMs = resolvePing(pl.id);
                const canHostKick = isOnlineHost && pl.id !== 1 && !pl.isBot && Boolean(onKickPlayer);

                return (
                  <div
                    key={pl.id}
                    className="bg-transparent border-0 px-0.5 py-0.5 space-y-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.98)]"
                  >
                    <div className="flex items-center justify-between gap-1 font-mono-num text-[10px]">
                      <div className="flex items-center gap-1 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0 border border-white/70"
                          style={{ backgroundColor: col }}
                        />
                        <span className={`font-bold truncate ${isMe ? 'text-amber-200' : 'text-stone-100'}`}>
                          {isMe ? 'YOU' : `${pl.isBot ? '[BOT] ' : ''}${pl.name || `P${pl.id}`}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isOnline && (
                          <span className={`text-[9px] font-bold tabular-nums ${pingTextColor(pingMs)}`}>
                            {pingMs === null ? '--' : `${pingMs}ms`}
                          </span>
                        )}
                        {canHostKick && (
                          <button
                            type="button"
                            onClick={() => onKickPlayer?.(pl.id)}
                            className="p-0.5 rounded bg-red-950/60 hover:bg-red-900 text-red-200 cursor-pointer"
                            title={`Kick ${pl.name || `P${pl.id}`}`}
                            aria-label={`Kick ${pl.name || `P${pl.id}`}`}
                          >
                            <UserX className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-black/55 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-150"
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
                          pl.state === 'down' ? 'text-rose-400 animate-pulse' : 'text-stone-100'
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

      {/* ── FLOATING BOTTOM COOLDOWN & ACTION DOCK / MOBILE CONTROLS ──── */}
      {showTouchControls ? (
        <MobileControls
          p1={localPlayer}
          playerColor={myColor}
          isOnlineCampaign={usesWeapons}
          compact={isLandscapeMobile}
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
      ) : (
        <div className="pointer-events-none fixed bottom-0 inset-x-0 z-25 px-2 sm:px-3 pb-1.5 flex flex-col items-center gap-1.5">
          <footer
            className="pointer-events-auto w-fit max-w-[96vw] bg-transparent border-0 shadow-none px-1.5 pt-2 pb-1 flex items-center gap-2 sm:gap-2.5 overflow-visible transition-transform"
            style={{
              transform: hudScale !== 1 ? `scale(${hudScale})` : undefined,
              transformOrigin: 'bottom center',
            }}
          >
          {/* Left Side Utility Circles: Bag [I] + Merchant [E] */}
          {hud.isOnlineCampaign && !hud.isTutorial && (onOpenInventory || (localPlayer.nearMerchant && onOpenShop)) && (
            <div className="flex items-center gap-2 shrink-0">
              {onOpenInventory && (
                <button
                  type="button"
                  onClick={() => onOpenInventory()}
                  className="relative group pb-1 cursor-pointer focus:outline-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.88)]"
                  title={`Open Weapon & Scroll Bag [I] (${bagCount}/8)`}
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-[#8c7047] bg-gradient-to-b from-stone-800/95 to-stone-950/95 flex items-center justify-center shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] group-hover:border-amber-400 transition-colors">
                    <Briefcase className="w-4 h-4 text-amber-300" />
                  </div>
                  <span className="absolute -top-0.5 -right-1 px-1 rounded-sm bg-purple-950 border border-purple-400/70 font-mono-num text-[8px] font-bold text-purple-200 tabular-nums leading-tight">
                    {bagCount}/8
                  </span>
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-sm bg-[#161219] border border-[#8c7047] font-mono-num text-[8px] font-bold text-amber-200 leading-none">
                    I
                  </span>
                </button>
              )}

              {localPlayer.nearMerchant && onOpenShop && (
                <button
                  type="button"
                  onClick={() => onOpenShop()}
                  className="relative group pb-1 cursor-pointer focus:outline-none animate-pulse drop-shadow-[0_4px_10px_rgba(0,0,0,0.88)]"
                  title="Talk to Broker Vex [E]"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-amber-400 bg-gradient-to-b from-amber-900/95 to-stone-950/95 flex items-center justify-center shadow-[0_0_14px_rgba(251,191,36,0.55)]">
                    <Store className="w-4 h-4 text-amber-200" />
                  </div>
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-sm bg-amber-950 border border-amber-400 font-mono-num text-[8px] font-bold text-amber-200 leading-none">
                    E
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Center Boxless Albion Circular Combat Skill Medallions: Dash + Skills 1..4 */}
          {(() => {
            const circleSize = hudSettings.compactSkills
              ? 'w-10 h-10 sm:w-11 sm:h-11'
              : 'w-11 h-11 sm:w-[50px] sm:h-[50px]';
            const iconSize = hudSettings.compactSkills ? 'w-4 h-4' : 'w-5 h-5';

            const dashExact = localPlayer.dashCooldownExact ?? localPlayer.dashCooldown ?? 0;
            const dashMax = Math.max(1, localPlayer.dashMaxCooldown || 8.8);
            const dashFrac = localPlayer.dashReady ? 0 : Math.max(0, Math.min(1, dashExact / dashMax));
            const dashSweepDeg = Math.round(dashFrac * 360);
            const dashFlashing = Boolean(flashActive['dash']);

            return (
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                {/* Circular Dash Medallion */}
                <div
                  className="relative pb-1 select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.88)]"
                  title={
                    localPlayer.dashReady
                      ? localPlayer.dash2Active && localPlayer.dash2Ready
                        ? 'Dodge Dash x2 Ready [SPACE]'
                        : 'Dodge Dash Ready [SPACE]'
                      : `Dash Cooldown: ${localPlayer.dashCooldown}s`
                  }
                >
                  {dashFlashing && (
                    <span
                      key={`dash-ring-${flashGen['dash'] || 0}`}
                      className="pointer-events-none absolute -inset-1 rounded-full border-2 border-emerald-300 animate-skill-ready-ring"
                    />
                  )}
                  <div
                    className={`${circleSize} relative rounded-full border-2 flex items-center justify-center overflow-hidden transition-all`}
                    style={{
                      borderColor: dashFlashing ? '#a7f3d0' : localPlayer.dashReady ? '#34d399' : '#4b4550',
                      background: localPlayer.dashReady
                        ? 'radial-gradient(circle at 35% 28%, rgba(16, 185, 129, 0.44), rgba(10, 20, 18, 0.92) 78%)'
                        : 'radial-gradient(circle at 50% 45%, rgba(22, 21, 28, 0.92), rgba(9, 8, 12, 0.94) 85%)',
                      boxShadow: dashFlashing
                        ? '0 0 22px rgba(110, 231, 183, 0.85), inset 0 0 14px rgba(255, 255, 255, 0.6)'
                        : localPlayer.dashReady
                        ? '0 0 14px rgba(52, 211, 153, 0.4), inset 0 0 10px rgba(52, 211, 153, 0.25)'
                        : 'inset 0 2px 8px rgba(0, 0, 0, 0.85)',
                    }}
                  >
                    <Wind
                      className={`${iconSize} ${localPlayer.dashReady ? 'text-emerald-200' : 'text-stone-500'}`}
                    />
                    {!localPlayer.dashReady && dashSweepDeg > 0 && (
                      <div
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{
                          background: `conic-gradient(from 0deg, rgba(4, 5, 10, 0.82) ${dashSweepDeg}deg, transparent ${dashSweepDeg}deg)`,
                        }}
                      />
                    )}
                    {!localPlayer.dashReady && dashExact > 0 && (
                      <span className="relative z-10 font-mono-num text-xs font-extrabold text-white tabular-nums drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                        {dashExact < 1 ? dashExact.toFixed(1) : Math.ceil(dashExact)}
                      </span>
                    )}
                    {localPlayer.dashReady && localPlayer.dash2Active && localPlayer.dash2Ready && (
                      <span className="absolute top-1 right-1.5 font-mono-num text-[8px] font-extrabold text-emerald-300">
                        x2
                      </span>
                    )}
                    {dashFlashing && (
                      <span
                        key={`dash-flash-${flashGen['dash'] || 0}`}
                        className="pointer-events-none absolute inset-0 rounded-full bg-white/80 animate-skill-ready-flash"
                      />
                    )}
                  </div>
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-sm border font-mono-num text-[8px] font-bold leading-none whitespace-nowrap ${
                      localPlayer.dashReady
                        ? 'bg-[#121916] border-emerald-500/80 text-emerald-200'
                        : 'bg-[#121015] border-stone-600 text-stone-400'
                    }`}
                  >
                    SPC
                  </span>
                </div>

                {/* Circular Weapon / Class Skill 1..4 Medallions */}
                {usesWeapons && localPlayer.weapon === 'none' ? (
                  <div className="px-3 py-1.5 rounded-full border border-[#5c482e]/70 bg-black/75 font-mono-num text-[10px] text-stone-300 whitespace-nowrap">
                    UNARMED · Open Chest or Shop to equip Weapon
                  </div>
                ) : (
                  localSkillsList.map((sk, idx) => {
                    const slot = idx + 1;
                    const unlocked = usesWeapons
                      ? localPlayer.weapon !== 'none' && (slot === 1 || learnedArr.includes(slot))
                      : (localPlayer.unlockedSkillTier || 1) >= slot;
                    const cdExact =
                      localPlayer.skillCooldownsExact?.[idx] ?? localPlayer.skillCooldowns?.[idx] ?? 0;
                    const maxCd = Math.max(1, localPlayer.skillMaxCooldowns?.[idx] || sk.cooldown || 12);
                    const ready = unlocked && cdExact <= 0;
                    const accent = wpnDefLocal?.accent || clsDefLocal?.accent || '#f59e0b';
                    const cdFrac = unlocked && cdExact > 0 ? Math.max(0, Math.min(1, cdExact / maxCd)) : 0;
                    const sweepDeg = Math.round(cdFrac * 360);
                    const skKey = `skill_${idx}`;
                    const isFlashing = Boolean(flashActive[skKey]);

                    return (
                      <div
                        key={sk.slot}
                        title={`${sk.name} [${sk.keyLabel}] — ${sk.desc}${!unlocked ? ' (Find Scroll to unlock)' : ''}`}
                        className="relative pb-1 select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.88)]"
                      >
                        {isFlashing && (
                          <span
                            key={`sk-ring-${idx}-${flashGen[skKey] || 0}`}
                            className="pointer-events-none absolute -inset-1 rounded-full border-2 animate-skill-ready-ring"
                            style={{ borderColor: accent }}
                          />
                        )}
                        <div
                          className={`${circleSize} relative rounded-full border-2 flex items-center justify-center overflow-hidden transition-all`}
                          style={{
                            borderColor: isFlashing ? '#ffffff' : !unlocked ? '#3a3542' : ready ? accent : '#5c5247',
                            background: !unlocked
                              ? 'radial-gradient(circle at 50% 45%, rgba(22, 20, 29, 0.9), rgba(9, 8, 12, 0.94) 85%)'
                              : ready
                              ? `radial-gradient(circle at 35% 28%, ${accent}48, rgba(20, 17, 24, 0.92) 78%)`
                              : 'radial-gradient(circle at 50% 45%, rgba(25, 22, 30, 0.92), rgba(9, 8, 12, 0.94) 85%)',
                            boxShadow: isFlashing
                              ? `0 0 22px ${accent}, inset 0 0 14px rgba(255, 255, 255, 0.7)`
                              : ready
                              ? `0 0 14px ${accent}55, inset 0 0 10px ${accent}33`
                              : 'inset 0 2px 8px rgba(0, 0, 0, 0.85)',
                          }}
                        >
                          <div style={{ color: !unlocked ? '#52525b' : ready ? accent : '#a8a29e' }}>
                            {getAlbionSkillIcon(sk.shortName, localPlayer.weapon, idx, iconSize)}
                          </div>

                          {!unlocked && (
                            <div className="absolute inset-0 bg-black/65 rounded-full flex items-center justify-center">
                              <Lock className="w-3.5 h-3.5 text-purple-300/85" />
                            </div>
                          )}

                          {unlocked && cdExact > 0 && (
                            <>
                              <div
                                className="absolute inset-0 rounded-full pointer-events-none"
                                style={{
                                  background: `conic-gradient(from 0deg, rgba(4, 5, 10, 0.86) ${sweepDeg}deg, transparent ${sweepDeg}deg)`,
                                }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center font-mono-num text-xs font-extrabold text-amber-100 tabular-nums drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">
                                {cdExact < 1 ? cdExact.toFixed(1) : Math.ceil(cdExact)}
                              </span>
                            </>
                          )}

                          {isFlashing && (
                            <span
                              key={`sk-flash-${idx}-${flashGen[skKey] || 0}`}
                              className="pointer-events-none absolute inset-0 rounded-full bg-white/80 animate-skill-ready-flash"
                            />
                          )}
                        </div>

                        <span
                          className={`absolute bottom-0 left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-sm border font-mono-num text-[8px] font-bold leading-none ${
                            !unlocked
                              ? 'bg-[#121015] border-stone-700 text-stone-500'
                              : ready
                              ? 'bg-[#171319] text-stone-100'
                              : 'bg-[#121015] border-stone-600 text-stone-400'
                          }`}
                          style={{ borderColor: ready ? accent : undefined }}
                        >
                          {sk.keyLabel}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })()}

          {/* Right Side Potion / Flask Circular Medallion */}
          {!hud.isTutorial && (() => {
            const potionExact = localPlayer.potionCooldownExact ?? localPlayer.potionCooldown ?? 0;
            const potionFrac = potionExact > 0 ? Math.max(0, Math.min(1, potionExact / 90)) : 0;
            const potionDeg = Math.round(potionFrac * 360);
            const hasCharges = localPlayer.potions > 0;
            const flaskFlashing = Boolean(flashActive['flask']);

            return (
              <div className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => onUsePotion?.()}
                  disabled={!potionReady}
                  className={`relative pb-1 focus:outline-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.88)] ${potionReady ? 'cursor-pointer' : 'cursor-default'}`}
                  title={`Crimson Flask [C] · +45 HP (${localPlayer.potions}/2 charges · 90s CD)`}
                >
                  {flaskFlashing && (
                    <span
                      key={`flask-ring-${flashGen['flask'] || 0}`}
                      className="pointer-events-none absolute -inset-1 rounded-full border-2 border-rose-300 animate-skill-ready-ring"
                    />
                  )}
                  <div
                    className={`${hudSettings.compactSkills ? 'w-10 h-10 sm:w-11 sm:h-11' : 'w-11 h-11 sm:w-[50px] sm:h-[50px]'} relative rounded-full border-2 flex items-center justify-center overflow-hidden transition-all`}
                    style={{
                      borderColor: flaskFlashing ? '#fecdd3' : potionReady ? '#fb7185' : hasCharges ? '#6b474d' : '#3f3f46',
                      background: potionReady
                        ? 'radial-gradient(circle at 35% 28%, rgba(244, 63, 94, 0.45), rgba(22, 9, 14, 0.92) 80%)'
                        : 'radial-gradient(circle at 50% 45%, rgba(22, 20, 25, 0.92), rgba(9, 8, 12, 0.94) 85%)',
                      boxShadow: flaskFlashing
                        ? '0 0 22px rgba(251, 113, 133, 0.9), inset 0 0 14px rgba(255, 255, 255, 0.65)'
                        : potionReady
                        ? '0 0 14px rgba(244, 63, 94, 0.42), inset 0 0 10px rgba(244, 63, 94, 0.25)'
                        : undefined,
                    }}
                  >
                    <FlaskConical
                      className={`${hudSettings.compactSkills ? 'w-4 h-4' : 'w-5 h-5'} ${
                        hasCharges ? (potionReady ? 'text-rose-200' : 'text-rose-400/70') : 'text-stone-600'
                      }`}
                    />
                    {potionExact > 0 && (
                      <>
                        <div
                          className="absolute inset-0 rounded-full pointer-events-none"
                          style={{
                            background: `conic-gradient(from 0deg, rgba(4, 5, 10, 0.86) ${potionDeg}deg, transparent ${potionDeg}deg)`,
                          }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center font-mono-num text-xs font-extrabold text-rose-100 tabular-nums drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">
                          {Math.ceil(potionExact)}
                        </span>
                      </>
                    )}
                    {flaskFlashing && (
                      <span
                        key={`flask-flash-${flashGen['flask'] || 0}`}
                        className="pointer-events-none absolute inset-0 rounded-full bg-white/80 animate-skill-ready-flash"
                      />
                    )}
                  </div>
                  <span
                    className={`absolute -top-0.5 -right-1 px-1 rounded-sm border font-mono-num text-[8px] font-bold tabular-nums leading-tight ${
                      hasCharges
                        ? 'bg-rose-950 border-rose-400/75 text-rose-200'
                        : 'bg-stone-900 border-stone-700 text-stone-500'
                    }`}
                  >
                    {localPlayer.potions}/2
                  </span>
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-sm border font-mono-num text-[8px] font-bold leading-none ${
                      potionReady
                        ? 'bg-[#1a0d12] border-rose-500/80 text-rose-200'
                        : 'bg-[#121015] border-stone-600 text-stone-400'
                    }`}
                  >
                    C
                  </span>
                </button>
              </div>
            );
          })()}
        </footer>
      </div>
      )}
    </div>
  );
};
