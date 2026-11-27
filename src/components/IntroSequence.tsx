import React, { useEffect, useRef, useState } from 'react';
import { FastForward, Lightbulb, Maximize2, Minimize2, Play, RotateCcw, Smartphone, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../game/soundEngine';

const INTRO_TOTAL_SECONDS = 10.0;
const SKIP_UNLOCK_SECONDS = 5.0;

interface SlashBeam {
  triggerAt: number;
  angle: number;
  xOffset: number;
  yOffset: number;
  color: string;
}

const SLASH_BEAMS: SlashBeam[] = [
  { triggerAt: 2.1, angle: -0.58, xOffset: -0.08, yOffset: -0.05, color: '#38bdf8' },
  { triggerAt: 2.85, angle: 0.46, xOffset: 0.06, yOffset: 0.04, color: '#a855f7' },
  { triggerAt: 3.6, angle: -0.22, xOffset: 0, yOffset: -0.02, color: '#ef4444' },
  { triggerAt: 4.55, angle: 0.78, xOffset: 0, yOffset: 0, color: '#fbbf24' },
];

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

interface OrbitEmber {
  angle: number;
  radiusFrac: number;
  speed: number;
  size: number;
  color: string;
  alpha: number;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutCubic(t: number): number {
  const u = clamp01(t);
  return 1 - Math.pow(1 - u, 3);
}

function easeInOutQuad(t: number): number {
  const u = clamp01(t);
  return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
}

interface SprokozIntroProps {
  isMuted: boolean;
  menuAudioBlocked: boolean;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onComplete: () => void;
}

export const SprokozIntro: React.FC<SprokozIntroProps> = ({
  isMuted,
  menuAudioBlocked,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const completedRef = useRef(false);
  const elapsedRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [elapsed, setElapsed] = useState(0);
  const canSkip = elapsed >= SKIP_UNLOCK_SECONDS;
  const remainingUntilSkip = Math.max(0, Math.ceil(SKIP_UNLOCK_SECONDS - elapsed));

  const triggerComplete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        elapsedRef.current >= SKIP_UNLOCK_SECONDS &&
        (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape')
      ) {
        e.preventDefault();
        soundEngine.unlock();
        soundEngine.playUiClick();
        triggerComplete();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const colors = ['#fbbf24', '#ef4444', '#38bdf8', '#a855f7'];
    const orbitEmbers: OrbitEmber[] = Array.from({ length: 84 }, (_, i) => ({
      angle: (i / 84) * Math.PI * 2 + (i % 5) * 0.2,
      radiusFrac: 0.14 + ((i * 37) % 100) / 140,
      speed: 0.45 + (i % 7) * 0.12,
      size: 1.5 + (i % 3) * 1.1,
      color: colors[i % colors.length],
      alpha: 0.35 + (i % 4) * 0.15,
    }));

    const sparks: SparkParticle[] = [];
    let burstSpawned = false;
    let slashAudioIdx = 0;
    let impactAudioPlayed = false;
    let rafId = 0;
    let uiSyncAccum = 0;
    const startTs = performance.now();
    let prevTs = startTs;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnBurst = (cx: number, cy: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
        const spd = 90 + Math.random() * 420;
        sparks.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: 1.8 + Math.random() * 2.8,
          alpha: 1,
          life: 0,
          maxLife: 0.9 + Math.random() * 1.1,
          color: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#ef4444' : '#fde68a',
        });
      }
    };

    const draw = (now: number) => {
      const dt = Math.min((now - prevTs) / 1000, 0.05);
      prevTs = now;
      const t = (now - startTs) / 1000;
      elapsedRef.current = t;

      uiSyncAccum += dt;
      if (uiSyncAccum >= 0.08) {
        uiSyncAccum = 0;
        setElapsed(Math.min(INTRO_TOTAL_SECONDS, t));
      }

      if (t >= INTRO_TOTAL_SECONDS) {
        setElapsed(INTRO_TOTAL_SECONDS);
        triggerComplete();
        return;
      }

      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;
      const minDim = Math.min(w, h);

      // Subtle audio cues if user already interacted
      if (!prefersReducedMotion) {
        while (slashAudioIdx < SLASH_BEAMS.length && t >= SLASH_BEAMS[slashAudioIdx].triggerAt) {
          soundEngine.playSlash();
          slashAudioIdx++;
        }
        if (!impactAudioPlayed && t >= 4.65) {
          impactAudioPlayed = true;
          soundEngine.playShockwave();
        }
      }

      // Base abyssal fill
      ctx.fillStyle = '#030205';
      ctx.fillRect(0, 0, w, h);

      // Compute camera shake right at the 4.65s forge impact
      let shakeX = 0;
      let shakeY = 0;
      if (!prefersReducedMotion && t >= 4.65 && t < 5.35) {
        const shakeMag = (1 - (t - 4.65) / 0.7) * 9;
        shakeX = (Math.random() - 0.5) * shakeMag * 2;
        shakeY = (Math.random() - 0.5) * shakeMag * 2;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Radial forge glow behind crest
      const glowRadius = minDim * (0.28 + easeInOutQuad(t / 5.5) * 0.35);
      const forgeGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
      const glowStrength = t < 4.6 ? 0.12 + 0.14 * clamp01(t / 4.6) : 0.28 * clamp01(1 - (t - 8.5) / 1.5);
      forgeGlow.addColorStop(0, `rgba(245, 158, 11, ${glowStrength})`);
      forgeGlow.addColorStop(0.42, `rgba(185, 28, 28, ${glowStrength * 0.65})`);
      forgeGlow.addColorStop(0.75, `rgba(88, 28, 135, ${glowStrength * 0.25})`);
      forgeGlow.addColorStop(1, 'rgba(3, 2, 5, 0)');
      ctx.fillStyle = forgeGlow;
      ctx.fillRect(-20, -20, w + 40, h + 40);

      // Swirling inward embers (0s - 4.7s), then gentle outward drift
      const convergeProgress = clamp01(t / 4.65);
      const swirlAlpha = t < 9.0 ? 1 : clamp01(1 - (t - 9.0) / 1.0);
      orbitEmbers.forEach((em, idx) => {
        const curAngle = em.angle + (prefersReducedMotion ? 0 : t * em.speed * (1 + convergeProgress * 1.6));
        const pull = t < 4.65 ? 1 - convergeProgress * 0.78 : 0.22 + (t - 4.65) * 0.18;
        const r = minDim * em.radiusFrac * pull;
        const px = cx + Math.cos(curAngle) * r;
        const py = cy + Math.sin(curAngle) * r * 0.86;
        ctx.globalAlpha = em.alpha * swirlAlpha * clamp01(t / 0.8);
        ctx.fillStyle = em.color;
        ctx.beginPath();
        ctx.arc(px, py, em.size, 0, Math.PI * 2);
        ctx.fill();

        if (!prefersReducedMotion && idx % 3 === 0 && t < 4.65) {
          const prevA = curAngle - 0.18;
          ctx.strokeStyle = em.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(prevA) * r * 1.03, cy + Math.sin(prevA) * r * 0.88);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;

      // Concentric arcane rune circles (1.2s - 9.2s)
      const ringReveal = easeOutCubic((t - 1.0) / 1.8);
      const ringFade = t > 8.6 ? clamp01(1 - (t - 8.6) / 1.2) : 1;
      if (ringReveal > 0 && ringFade > 0) {
        const baseR = minDim * 0.23 * (0.7 + 0.3 * ringReveal);
        const rot = prefersReducedMotion ? 0 : t * 0.35;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.globalAlpha = ringReveal * ringFade * 0.65;

        // Outer crimson-gold ring
        ctx.save();
        ctx.rotate(rot);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, baseR * 1.25, 0, Math.PI * 2);
        ctx.stroke();

        // 12 cardinal ticks
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * baseR * 1.18, Math.sin(a) * baseR * 1.18);
          ctx.lineTo(Math.cos(a) * baseR * 1.32, Math.sin(a) * baseR * 1.32);
          ctx.stroke();
        }
        ctx.restore();

        // Inner counter-rotating octagon crest
        ctx.save();
        ctx.rotate(-rot * 1.4);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = 0; i <= 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const x = Math.cos(a) * baseR * 0.92;
          const y = Math.sin(a) * baseR * 0.92;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Crossed twin blades behind SPROKOZ lockup (appear smoothly around 4.6s)
        const bladeAlpha = easeOutCubic((t - 4.4) / 0.8);
        if (bladeAlpha > 0) {
          ctx.globalAlpha = bladeAlpha * ringFade * 0.55;
          [-0.68, 0.68].forEach((bAng, bIdx) => {
            ctx.save();
            ctx.rotate(bAng);
            const grad = ctx.createLinearGradient(0, -baseR * 1.05, 0, baseR * 1.05);
            grad.addColorStop(0, 'rgba(255,255,255,0)');
            grad.addColorStop(0.3, bIdx === 0 ? '#fbbf24' : '#38bdf8');
            grad.addColorStop(0.5, '#ffffff');
            grad.addColorStop(0.7, bIdx === 0 ? '#ef4444' : '#a855f7');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, -baseR * 1.05);
            ctx.lineTo(0, baseR * 1.05);
            ctx.stroke();
            ctx.restore();
          });
        }
        ctx.restore();

        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // Katana slash arcs cutting across the screen (2.1s -> 4.9s)
      if (!prefersReducedMotion) {
        SLASH_BEAMS.forEach((sb) => {
          const dtSlash = t - sb.triggerAt;
          if (dtSlash >= 0 && dtSlash < 0.72) {
            const p = dtSlash / 0.72;
            const alpha = Math.sin(p * Math.PI);
            const len = Math.max(w, h) * 1.35;
            ctx.save();
            ctx.translate(cx + sb.xOffset * w, cy + sb.yOffset * h);
            ctx.rotate(sb.angle);
            ctx.globalAlpha = alpha * 0.9;
            ctx.strokeStyle = sb.color;
            ctx.lineWidth = (1 - p) * 10 + 1.5;
            ctx.beginPath();
            ctx.moveTo(-len * 0.5, 0);
            ctx.lineTo(len * 0.5, 0);
            ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = (1 - p) * 3.5 + 0.5;
            ctx.beginPath();
            ctx.moveTo(-len * 0.45, 0);
            ctx.lineTo(len * 0.45, 0);
            ctx.stroke();
            ctx.restore();
          }
        });
      }

      // Shockwave rings & burst sparks at 4.65s forge impact
      if (t >= 4.65) {
        if (!burstSpawned && !prefersReducedMotion) {
          burstSpawned = true;
          spawnBurst(cx, cy, 72);
        }
        const shockT = t - 4.65;
        if (shockT < 1.35) {
          const prog = easeOutCubic(shockT / 1.35);
          ctx.save();
          ctx.globalAlpha = (1 - prog) * 0.85;
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = (1 - prog) * 6 + 1;
          ctx.beginPath();
          ctx.arc(cx, cy, prog * Math.max(w, h) * 0.65, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = (1 - prog) * 3 + 1;
          ctx.beginPath();
          ctx.arc(cx, cy, prog * Math.max(w, h) * 0.48, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Update & draw burst sparks + ascending ambient ember sparks during Sprokoz hold
      if (!prefersReducedMotion && t >= 4.8 && t < 9.0 && Math.random() < 0.55) {
        sparks.push({
          x: cx + (Math.random() - 0.5) * Math.min(w * 0.65, 520),
          y: cy + 28 + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 28,
          vy: -35 - Math.random() * 65,
          size: 1.4 + Math.random() * 2,
          alpha: 0.9,
          life: 0,
          maxLife: 0.8 + Math.random() * 0.9,
          color: Math.random() > 0.45 ? '#fbbf24' : '#f87171',
        });
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.life += dt;
        if (sp.life >= sp.maxLife) {
          sparks.splice(i, 1);
          continue;
        }
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vx *= 0.985;
        const a = (1 - sp.life / sp.maxLife) * sp.alpha;
        ctx.globalAlpha = a * (t > 9.0 ? clamp01(1 - (t - 9.0)) : 1);
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Final dissolve flash + black fade (9.0s -> 10.0s)
      if (t >= 8.9) {
        const fadeOut = clamp01((t - 8.9) / 1.05);
        ctx.fillStyle = `rgba(4, 3, 7, ${fadeOut})`;
        ctx.fillRect(-20, -20, w + 40, h + 40);
      }

      ctx.restore();
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Derived choreography opacities/transforms for crisp HTML/Cinzel typography layer
  const titleProgress = easeOutCubic((elapsed - 4.65) / 0.95);
  const titleFadeOut = elapsed > 8.9 ? clamp01(1 - (elapsed - 8.9) / 0.85) : 1;
  const titleOpacity = titleProgress * titleFadeOut;
  const titleScale = 1.22 - 0.22 * titleProgress;
  const titleLetterSpacing = `${0.32 - 0.2 * titleProgress}em`;
  const dividerOpacity = easeOutCubic((elapsed - 5.3) / 0.85) * titleFadeOut;
  const progressPct = clamp01(elapsed / INTRO_TOTAL_SECONDS) * 100;

  return (
    <div
      className="relative h-dvh w-full overflow-hidden bg-[#030205] select-none flex flex-col items-center justify-center"
      onClick={() => soundEngine.unlock()}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      <div className="arcade-scanlines pointer-events-none absolute inset-0" />

      {/* Top bar: Sprokoz on the side, audio & fullscreen on the right */}
      <div className="absolute top-4 inset-x-4 sm:inset-x-6 z-20 flex items-center justify-between gap-4">
        <span className="font-mono-num text-xs text-stone-400 tracking-wide whitespace-nowrap">
          Made by Sprokoz
        </span>
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
            className={`min-h-[40px] px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              isMuted
                ? 'bg-red-950/40 border-red-700/70 text-red-300'
                : menuAudioBlocked
                ? 'bg-amber-950/60 border-amber-500/80 text-amber-200 animate-pulse'
                : 'bg-black/70 border-stone-700/80 text-amber-300 hover:border-stone-500'
            }`}
            aria-label={isMuted ? 'Unmute Music' : 'Mute Music'}
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
            className="min-h-[40px] px-3 py-1.5 rounded-md bg-black/70 border border-stone-700/80 text-stone-200 hover:border-stone-500 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Centerpiece DUNGEON BOUNCER reveal */}
      <div className="relative z-10 px-6 text-center max-w-4xl flex flex-col items-center">
        <h1
          className="font-souls font-extrabold text-3xl sm:text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-red-500 drop-shadow-[0_0_32px_rgba(245,158,11,0.45)]"
          style={{
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            letterSpacing: titleLetterSpacing,
            textWrap: 'balance',
          }}
        >
          DUNGEON BOUNCER
        </h1>

        <div
          className="mt-6 h-px w-48 sm:w-72 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent"
          style={{ opacity: dividerOpacity }}
        />
      </div>

      {/* Bottom Cinematic Progress + 5-Second Gated Skip */}
      <div className="absolute bottom-6 inset-x-6 z-20 flex items-center justify-between gap-4">
        <div className="flex-1 max-w-xs h-0.5 bg-stone-800/90 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 via-amber-400 to-amber-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {canSkip ? (
          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playUiClick();
              triggerComplete();
            }}
            className="min-h-[44px] px-5 py-2.5 rounded-md bg-stone-950/90 hover:bg-stone-900 border border-amber-500/75 text-amber-200 text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.22)]"
          >
            <span>Skip Intro</span>
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
          </button>
        ) : (
          <span className="font-mono-num text-xs text-stone-400 whitespace-nowrap shrink-0">
            Skip available in {remainingUntilSkip}s
          </span>
        )}
      </div>
    </div>
  );
};

interface LandingSplashProps {
  isMuted: boolean;
  menuAudioBlocked: boolean;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  mobileMode?: boolean;
  onToggleMobileMode?: () => void;
  onStart: () => void;
  onReplayIntro: () => void;
  onOpenUpdates?: () => void;
  onOpenSuggestions?: () => void;
}

export const LandingSplash: React.FC<LandingSplashProps> = ({
  isMuted,
  menuAudioBlocked,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  mobileMode = false,
  onToggleMobileMode,
  onStart,
  onReplayIntro,
  onOpenUpdates,
  onOpenSuggestions,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        soundEngine.unlock();
        soundEngine.playBoonSelect();
        onStart();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const motes = Array.from({ length: 64 }, (_, i) => ({
      xFrac: ((i * 29) % 100) / 100,
      yFrac: ((i * 53) % 100) / 100,
      vy: 14 + (i % 6) * 6,
      vx: ((i % 5) - 2) * 4,
      size: 1.2 + (i % 3) * 0.9,
      alpha: 0.2 + (i % 4) * 0.14,
      crimson: i % 3 === 0,
    }));

    let rafId = 0;
    let prevTs = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (now: number) => {
      const dt = Math.min((now - prevTs) / 1000, 0.05);
      prevTs = now;
      const t = now / 1000;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h * 0.44;
      const minDim = Math.min(w, h);

      ctx.fillStyle = '#040307';
      ctx.fillRect(0, 0, w, h);

      // Eclipse solar/crimson radial halo
      const halo = ctx.createRadialGradient(cx, cy, minDim * 0.05, cx, cy, minDim * 0.56);
      halo.addColorStop(0, 'rgba(217, 119, 6, 0.22)');
      halo.addColorStop(0.4, 'rgba(153, 27, 27, 0.14)');
      halo.addColorStop(0.75, 'rgba(56, 189, 248, 0.05)');
      halo.addColorStop(1, 'rgba(4, 3, 7, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);

      // Slowly rotating Eclipse sigil ring
      const ringR = minDim * 0.28;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(prefersReducedMotion ? 0 : t * 0.12);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, ringR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.rotate(prefersReducedMotion ? 0 : -t * 0.22);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, ringR * 0.84, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Floating embers
      motes.forEach((m) => {
        if (!prefersReducedMotion) {
          m.yFrac -= (m.vy * dt) / Math.max(h, 400);
          m.xFrac += (m.vx * dt) / Math.max(w, 400);
          if (m.yFrac < -0.02) m.yFrac = 1.02;
          if (m.xFrac < -0.02) m.xFrac = 1.02;
          if (m.xFrac > 1.02) m.xFrac = -0.02;
        }
        ctx.globalAlpha = m.alpha;
        ctx.fillStyle = m.crimson ? '#f87171' : '#fbbf24';
        ctx.beginPath();
        ctx.arc(m.xFrac * w, m.yFrac * h, m.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div
      className="relative h-dvh w-full overflow-y-auto overflow-x-hidden bg-[#040307] flex flex-col items-center justify-between p-6 select-none"
      onClick={() => soundEngine.unlock()}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      <div className="arcade-scanlines pointer-events-none absolute inset-0" />

      {/* Top Bar */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between gap-4">
        <span className="font-mono-num text-xs text-stone-400 tracking-wide whitespace-nowrap">
          Made by Sprokoz
        </span>
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
            className={`min-h-[40px] px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              isMuted
                ? 'bg-red-950/40 border-red-700/70 text-red-300 hover:bg-red-900/50'
                : menuAudioBlocked
                ? 'bg-amber-950/60 border-amber-500/80 text-amber-200 animate-pulse hover:bg-amber-900/60'
                : 'bg-[#09090e]/85 border-stone-700 text-amber-300 hover:border-stone-500'
            }`}
            aria-label={isMuted ? 'Unmute Menu Music' : 'Mute Menu Music'}
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
                : 'bg-[#09090e]/85 border-stone-700 text-stone-200 hover:border-stone-500'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Minimal Title & Start Focal Center */}
      <main className="relative z-10 my-auto max-w-3xl text-center flex flex-col items-center gap-8 py-8">
        <h1
          className="font-souls text-4xl sm:text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-stone-100 via-amber-200 to-amber-500 tracking-widest drop-shadow-[0_0_30px_rgba(217,119,6,0.38)]"
          style={{ textWrap: 'balance' }}
        >
          DUNGEON BOUNCER
        </h1>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playBoonSelect();
              onStart();
            }}
            className="min-h-[52px] px-12 py-3.5 rounded-md bg-gradient-to-r from-red-700 via-red-600 to-amber-600 hover:from-red-600 hover:to-amber-500 border border-amber-400/70 text-white font-arcade text-sm sm:text-base tracking-widest flex items-center gap-3 whitespace-nowrap cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-amber-300 shadow-[0_0_32px_rgba(220,38,38,0.45)]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start</span>
          </button>

          {onToggleMobileMode && (
            <button
              type="button"
              onClick={() => {
                soundEngine.unlock();
                soundEngine.playUiClick();
                onToggleMobileMode();
              }}
              className={`min-h-[44px] px-5 py-2 rounded-md border font-mono-num text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                mobileMode
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.28)]'
                  : 'bg-[#09090e]/85 hover:bg-stone-900 border-stone-700 text-stone-300 hover:border-amber-500/70 hover:text-amber-200'
              }`}
            >
              <Smartphone className={`w-4 h-4 ${mobileMode ? 'text-emerald-300' : 'text-amber-300'}`} />
              <span>Mobile Mode: {mobileMode ? 'ON' : 'OFF'}</span>
              {mobileMode && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-black text-[9px] font-extrabold">
                  TOUCH READY
                </span>
              )}
            </button>
          )}
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="relative z-10 w-full max-w-5xl flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <span className="font-mono-num text-[11px] text-amber-400/85 font-semibold tracking-wider uppercase">
            beta test 0.2.0
          </span>
          {onOpenUpdates && (
            <button
              type="button"
              onClick={() => {
                soundEngine.unlock();
                soundEngine.playUiClick();
                onOpenUpdates();
              }}
              className="min-h-[34px] px-3 py-1 rounded-md bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/60 text-purple-200 font-mono-num text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>New Updates</span>
            </button>
          )}
          {onOpenSuggestions && (
            <button
              type="button"
              onClick={() => {
                soundEngine.unlock();
                soundEngine.playUiClick();
                onOpenSuggestions();
              }}
              className="min-h-[34px] px-3 py-1 rounded-md bg-amber-950/55 hover:bg-amber-900/65 border border-amber-500/60 text-amber-200 font-mono-num text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
              <span>Suggestions</span>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.unlock();
            soundEngine.playUiClick();
            onReplayIntro();
          }}
          className="min-h-[36px] px-3 py-1 text-stone-400 hover:text-amber-300 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Replay Intro</span>
        </button>
      </footer>
    </div>
  );
};
