import React, { useEffect, useRef, useState } from 'react';
import { Briefcase, FastForward, FlaskConical, Lock, Sparkles, Store, Wind } from 'lucide-react';
import { HERO_CLASSES, PlayerHudState, WEAPONS_CATALOG } from '../game/types';
import { soundEngine } from '../game/soundEngine';

interface MobileControlsProps {
  p1: PlayerHudState;
  playerColor: string;
  isOnlineCampaign?: boolean;
  compact?: boolean;
  showSkipIntro?: boolean;
  onMoveChange: (x: number, y: number) => void;
  onDashChange: (pressed: boolean) => void;
  onAbilityChange: (pressed: boolean) => void;
  onSkillSlotChange?: (slot: 2 | 3 | 4, pressed: boolean) => void;
  onUsePotion?: () => void;
  onOpenInventory?: () => void;
  onOpenShop?: () => void;
  onSkipIntro?: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  p1,
  playerColor,
  isOnlineCampaign = false,
  compact = false,
  showSkipIntro = false,
  onMoveChange,
  onDashChange,
  onAbilityChange,
  onSkillSlotChange,
  onUsePotion,
  onOpenInventory,
  onOpenShop,
  onSkipIntro,
}) => {
  const clsDef = HERO_CLASSES.find((c) => c.id === p1.heroClass);
  const weaponDef =
    isOnlineCampaign && p1.weapon !== 'none'
      ? WEAPONS_CATALOG.find((w) => w.id === p1.weapon)
      : undefined;
  const skillColor = isOnlineCampaign ? weaponDef?.accent || '#71717a' : clsDef?.accent || '#f59e0b';
  const skillsList = isOnlineCampaign ? weaponDef?.skills || [] : clsDef?.skills || [];
  const skillCaption = isOnlineCampaign
    ? weaponDef
      ? weaponDef.skills[0].shortName
      : 'INTERACT'
    : clsDef?.skills[0].shortName || 'SKILL';

  const stickPointerIdRef = useRef<number | null>(null);
  const stickOriginRef = useRef<{ x: number; y: number } | null>(null);
  const dashPointerIdRef = useRef<number | null>(null);
  const abilityPointerIdRef = useRef<number | null>(null);

  const [stickOrigin, setStickOrigin] = useState<{ x: number; y: number } | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dashPressed, setDashPressed] = useState(false);
  const [abilityPressed, setAbilityPressed] = useState(false);
  const [pressedSlots, setPressedSlots] = useState<Record<number, boolean>>({});
  const [flashGen, setFlashGen] = useState<Record<string, number>>({});
  const [flashActive, setFlashActive] = useState<Record<string, boolean>>({});
  const flashTimersRef = useRef<Record<string, number>>({});
  const prevCdRef = useRef<{ weapon: string; dash: number; skills: number[] }>({
    weapon: p1.weapon,
    dash: 0,
    skills: [0, 0, 0, 0],
  });

  const maxRadius = compact ? 38 : 46;
  const padRadius = compact ? 54 : 62;

  const resetAllInputs = () => {
    stickPointerIdRef.current = null;
    stickOriginRef.current = null;
    dashPointerIdRef.current = null;
    abilityPointerIdRef.current = null;
    setStickOrigin(null);
    setKnobOffset({ x: 0, y: 0 });
    setDashPressed(false);
    setAbilityPressed(false);
    setPressedSlots({});
    onMoveChange(0, 0);
    onDashChange(false);
    onAbilityChange(false);
    onSkillSlotChange?.(2, false);
    onSkillSlotChange?.(3, false);
    onSkillSlotChange?.(4, false);
  };

  useEffect(() => {
    window.addEventListener('blur', resetAllInputs);
    return () => {
      for (const tid of Object.values(flashTimersRef.current)) {
        window.clearTimeout(tid);
      }
      flashTimersRef.current = {};
      window.removeEventListener('blur', resetAllInputs);
      onMoveChange(0, 0);
      onDashChange(false);
      onAbilityChange(false);
      onSkillSlotChange?.(2, false);
      onSkillSlotChange?.(3, false);
      onSkillSlotChange?.(4, false);
    };
  }, []);

  const triggerMobileFlash = (key: string) => {
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
    const curDash = p1.dashCooldownExact ?? p1.dashCooldown ?? 0;
    const curSkills = [0, 1, 2, 3].map(
      (idx) => p1.skillCooldownsExact?.[idx] ?? p1.skillCooldowns?.[idx] ?? 0
    );
    if (prev.dash > 0.05 && curDash <= 0 && p1.dashReady) {
      triggerMobileFlash('dash');
    }
    if (prev.weapon !== p1.weapon) {
      prev.weapon = p1.weapon;
    } else {
      for (let idx = 0; idx < 4; idx++) {
        const slot = idx + 1;
        const learnedArr = p1.weapon !== 'none' ? p1.learnedSkills?.[p1.weapon] || [1] : [];
        const unlocked = isOnlineCampaign
          ? p1.weapon !== 'none' && (slot === 1 || learnedArr.includes(slot))
          : (p1.unlockedSkillTier || 1) >= slot;
        if (unlocked && prev.skills[idx] > 0.05 && curSkills[idx] <= 0) {
          triggerMobileFlash(`s${slot}`);
        }
      }
    }
    prevCdRef.current = { weapon: p1.weapon, dash: curDash, skills: curSkills };
  }, [
    p1.weapon,
    p1.dashReady,
    p1.dashCooldown,
    p1.dashCooldownExact,
    p1.skillCooldowns,
    p1.skillCooldownsExact,
    p1.unlockedSkillTier,
    isOnlineCampaign,
  ]);

  const updateStickFromPoint = (clientX: number, clientY: number) => {
    const origin = stickOriginRef.current;
    if (!origin) return;
    const dx = clientX - origin.x;
    const dy = clientY - origin.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 6) {
      setKnobOffset({ x: 0, y: 0 });
      onMoveChange(0, 0);
      return;
    }

    const clamped = Math.min(dist, maxRadius);
    const nx = dx / dist;
    const ny = dy / dist;
    setKnobOffset({ x: nx * clamped, y: ny * clamped });
    onMoveChange(nx, ny);
  };

  const handleLeftZoneDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    soundEngine.unlock();
    if (stickPointerIdRef.current !== null) return;
    stickPointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore pointer capture issues
    }
    const vw = typeof window !== 'undefined' ? window.innerWidth : 900;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 600;
    const ox = Math.max(padRadius + 10, Math.min(vw * 0.48 - padRadius * 0.5, e.clientX));
    const oy = Math.max(76 + padRadius, Math.min(vh - padRadius - 12, e.clientY));
    const origin = { x: ox, y: oy };
    stickOriginRef.current = origin;
    setStickOrigin(origin);
    setKnobOffset({ x: 0, y: 0 });
    onMoveChange(0, 0);
  };

  const handleLeftZoneMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (stickPointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    updateStickFromPoint(e.clientX, e.clientY);
  };

  const handleLeftZoneUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (stickPointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    stickPointerIdRef.current = null;
    stickOriginRef.current = null;
    setStickOrigin(null);
    setKnobOffset({ x: 0, y: 0 });
    onMoveChange(0, 0);
  };

  const handleDashDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    soundEngine.unlock();
    dashPointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setDashPressed(true);
    onDashChange(true);
  };

  const handleDashUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dashPointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    dashPointerIdRef.current = null;
    setDashPressed(false);
    onDashChange(false);
  };

  const handleAbilityDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    soundEngine.unlock();
    abilityPointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setAbilityPressed(true);
    onAbilityChange(true);
  };

  const handleAbilityUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (abilityPointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    abilityPointerIdRef.current = null;
    setAbilityPressed(false);
    onAbilityChange(false);
  };

  const handleSlotDown = (slot: 2 | 3 | 4) => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    soundEngine.unlock();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setPressedSlots((prev) => ({ ...prev, [slot]: true }));
    onSkillSlotChange?.(slot, true);
  };

  const handleSlotUp = (slot: 2 | 3 | 4) => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setPressedSlots((prev) => ({ ...prev, [slot]: false }));
    onSkillSlotChange?.(slot, false);
  };

  const dashAvailable = p1.dashReady || (p1.dash2Active && p1.dash2Ready);
  const padSizePx = padRadius * 2;
  const knobSizeClass = compact ? 'w-12 h-12' : 'w-14 h-14';
  const dashBtnSizeClass = compact ? 'w-14 h-14' : 'w-16 h-16';
  const skillBtnSizeClass = compact ? 'w-13 h-13' : 'w-14 h-14';
  const unlockedTier = p1.unlockedSkillTier || 1;
  const hasSkills = !isOnlineCampaign || p1.weapon !== 'none';

  return (
    <>
      {/* Left Half Screen: Non-Fixed Floating Analog Joystick Capture Zone */}
      <div
        onPointerDown={handleLeftZoneDown}
        onPointerMove={handleLeftZoneMove}
        onPointerUp={handleLeftZoneUp}
        onPointerCancel={handleLeftZoneUp}
        role="application"
        aria-label="Dynamic Movement Analog Zone"
        className="fixed left-0 top-[74px] bottom-0 w-[48vw] z-20 touch-none select-none pointer-events-auto"
        style={{ touchAction: 'none' }}
      >
        {stickOrigin ? (
          <div
            className="pointer-events-none fixed rounded-full bg-black/50 border-2 backdrop-blur-sm shadow-[0_0_24px_rgba(0,0,0,0.65)] flex items-center justify-center"
            style={{
              width: padSizePx,
              height: padSizePx,
              left: stickOrigin.x - padRadius,
              top: stickOrigin.y - padRadius,
              borderColor:
                knobOffset.x !== 0 || knobOffset.y !== 0 ? `${playerColor}dd` : 'rgba(120,113,108,0.8)',
            }}
          >
            <div className="pointer-events-none absolute inset-3 rounded-full border border-dashed border-stone-600/55" />
            <div className="pointer-events-none absolute w-full h-[1px] bg-stone-700/60" />
            <div className="pointer-events-none absolute h-full w-[1px] bg-stone-700/60" />
            <div
              className={`${knobSizeClass} pointer-events-none rounded-full border-2 shadow-lg flex items-center justify-center`}
              style={{
                transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
                background: `radial-gradient(circle at 35% 35%, ${playerColor}dd, #111118 85%)`,
                borderColor: playerColor,
                boxShadow: `0 0 18px ${playerColor}66`,
              }}
            >
              <div className="w-3 h-3 rounded-full bg-white/85" />
            </div>
          </div>
        ) : (
          <div className="pointer-events-none fixed left-4 bottom-4 flex flex-col items-center gap-1 opacity-40">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-stone-500/75 bg-black/25 flex items-center justify-center">
              <div
                className="w-10 h-10 rounded-full border border-stone-400/70 flex items-center justify-center"
                style={{ borderColor: `${playerColor}88` }}
              >
                <div className="w-2 h-2 rounded-full bg-white/70" />
              </div>
            </div>
            <span className="font-mono-num text-[9px] text-stone-300 tracking-wider bg-black/45 px-1.5 py-0.5 rounded">
              TOUCH ANYWHERE (LEFT)
            </span>
          </div>
        )}
      </div>

      {/* Bottom Center Skip Intro on Mobile during Boss Intro */}
      {showSkipIntro && onSkipIntro && (
        <button
          type="button"
          onClick={() => {
            soundEngine.unlock();
            onSkipIntro();
          }}
          className="pointer-events-auto fixed bottom-4 left-1/2 -translate-x-1/2 z-25 px-4 py-2.5 min-h-[44px] rounded-md bg-black/85 border border-amber-500/80 text-amber-200 font-mono-num text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
        >
          <FastForward className="w-4 h-4 text-amber-400" />
          <span>Skip Intro</span>
        </button>
      )}

      {/* Right Bottom Action Dock: Shop / Bag / Flask + Skills 1..4 + Dash */}
      <div
        className="pointer-events-auto fixed right-2.5 sm:right-4 bottom-2.5 sm:bottom-3 z-25 flex flex-col items-end gap-1.5 select-none touch-none"
        style={{ touchAction: 'none' }}
      >
        {(onUsePotion || (isOnlineCampaign && onOpenInventory) || (isOnlineCampaign && p1.nearMerchant && onOpenShop)) && (
          <div className="flex items-center gap-1.5">
            {isOnlineCampaign && p1.nearMerchant && onOpenShop && (
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  soundEngine.unlock();
                  onOpenShop();
                }}
                className="min-h-[44px] min-w-[44px] px-3 rounded-lg bg-amber-950/90 border border-amber-400 text-amber-200 font-mono-num text-[10px] font-bold flex items-center justify-center gap-1 touch-none cursor-pointer animate-pulse"
                style={{ touchAction: 'none' }}
              >
                <Store className="w-4 h-4 text-amber-300" />
                <span>SHOP</span>
              </button>
            )}
            {isOnlineCampaign && onOpenInventory && (
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  soundEngine.unlock();
                  onOpenInventory();
                }}
                className="min-h-[44px] min-w-[44px] px-2.5 rounded-lg bg-black/85 border border-stone-500/80 text-stone-200 font-mono-num text-[10px] font-bold flex items-center justify-center gap-1 touch-none cursor-pointer"
                style={{ touchAction: 'none' }}
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>{(p1.scrollBag || []).length}/8</span>
              </button>
            )}
            {onUsePotion && (
              <button
                type="button"
                disabled={p1.potions <= 0 || p1.potionCooldown > 0 || p1.hp >= p1.maxHp}
                onPointerDown={(e) => {
                  e.preventDefault();
                  soundEngine.unlock();
                  onUsePotion();
                }}
                className="min-h-[44px] min-w-[44px] px-2.5 rounded-lg bg-rose-950/80 disabled:bg-black/60 border border-rose-500/75 disabled:border-stone-700 text-rose-200 disabled:text-stone-500 font-mono-num text-[10px] font-bold flex items-center justify-center gap-1 touch-none cursor-pointer"
                style={{ touchAction: 'none' }}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>{p1.potionCooldown > 0 ? `${p1.potionCooldown}s` : `x${p1.potions}`}</span>
              </button>
            )}
          </div>
        )}

        {/* Skills [Q], [R], [F] */}
        {hasSkills && (
          <div className="flex items-center gap-1.5">
            {([2, 3, 4] as const).map((slotNum) => {
              const sDef = skillsList[slotNum - 1];
              const learnedArr = p1.weapon !== 'none' ? p1.learnedSkills?.[p1.weapon] || [1] : [];
              const unlocked = isOnlineCampaign
                ? p1.weapon !== 'none' && learnedArr.includes(slotNum)
                : unlockedTier >= slotNum;
              const cdExact = p1.skillCooldownsExact?.[slotNum - 1] ?? p1.skillCooldowns?.[slotNum - 1] ?? 0;
              const maxCd = Math.max(1, p1.skillMaxCooldowns?.[slotNum - 1] || sDef?.cooldown || 15);
              const sweepDeg = unlocked && cdExact > 0 ? Math.round(Math.min(1, cdExact / maxCd) * 360) : 0;
              const ready = unlocked && cdExact <= 0;
              const isFlashing = Boolean(flashActive[`s${slotNum}`]);
              return (
                <button
                  key={slotNum}
                  type="button"
                  onPointerDown={handleSlotDown(slotNum)}
                  onPointerUp={handleSlotUp(slotNum)}
                  onPointerCancel={handleSlotUp(slotNum)}
                  aria-label={sDef ? sDef.name : `Skill ${slotNum}`}
                  className={`relative min-w-[46px] min-h-[46px] px-1.5 rounded-full border-2 flex flex-col items-center justify-center overflow-hidden transition-transform touch-none cursor-pointer ${
                    pressedSlots[slotNum] ? 'scale-95' : 'scale-100'
                  } ${!unlocked ? 'opacity-45' : ready ? 'shadow-md' : 'opacity-90'}`}
                  style={{
                    touchAction: 'none',
                    background: ready
                      ? `radial-gradient(circle at 35% 30%, ${skillColor}44, #0d0c12 85%)`
                      : 'rgba(10, 10, 14, 0.85)',
                    borderColor: isFlashing ? '#ffffff' : ready ? skillColor : '#4b4550',
                    boxShadow: isFlashing ? `0 0 18px ${skillColor}` : undefined,
                  }}
                >
                  {unlocked && sweepDeg > 0 && (
                    <div
                      className="pointer-events-none absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(from 0deg, rgba(3, 4, 9, 0.84) ${sweepDeg}deg, transparent ${sweepDeg}deg)`,
                      }}
                    />
                  )}
                  {isFlashing && (
                    <span
                      key={`mob-sk-flash-${slotNum}-${flashGen[`s${slotNum}`] || 0}`}
                      className="pointer-events-none absolute inset-0 rounded-full bg-white/80 animate-skill-ready-flash"
                    />
                  )}
                  {!unlocked ? (
                    <Lock className="w-3.5 h-3.5 text-stone-500 relative z-10" />
                  ) : (
                    <span
                      className="relative z-10 font-mono-num text-[9px] font-bold leading-none tabular-nums"
                      style={{ color: ready ? '#fafaf9' : '#fde68a' }}
                    >
                      {ready ? sDef?.keyLabel || `S${slotNum}` : `${Math.ceil(cdExact)}s`}
                    </span>
                  )}
                  <span className="relative z-10 font-mono-num text-[8px] text-stone-400 leading-none mt-0.5 truncate max-w-[38px]">
                    {unlocked ? sDef?.shortName.slice(0, 5) : 'SCRL'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Primary Skill 1 [E] + Dash */}
        <div className="flex items-end gap-2.5">
          {(() => {
            const s1Exact = p1.skillCooldownsExact?.[0] ?? p1.abilityCooldown ?? 0;
            const s1Max = Math.max(1, p1.skillMaxCooldowns?.[0] || 12);
            const s1Deg = !p1.abilityReady && s1Exact > 0 ? Math.round(Math.min(1, s1Exact / s1Max) * 360) : 0;
            const s1Flashing = Boolean(flashActive['s1']);
            return (
              <div className="flex flex-col items-center gap-0.5">
                <button
                  type="button"
                  onPointerDown={handleAbilityDown}
                  onPointerUp={handleAbilityUp}
                  onPointerCancel={handleAbilityUp}
                  aria-label="Hero Skill 1"
                  className={`${skillBtnSizeClass} relative min-w-[50px] min-h-[50px] rounded-full border-2 flex flex-col items-center justify-center gap-0.5 overflow-hidden transition-transform touch-none cursor-pointer ${
                    abilityPressed ? 'scale-95' : 'scale-100'
                  } ${p1.abilityReady || (isOnlineCampaign && p1.weapon === 'none') ? 'shadow-lg' : 'opacity-90'}`}
                  style={{
                    touchAction: 'none',
                    background: p1.abilityReady
                      ? `radial-gradient(circle at 35% 30%, ${skillColor}55, #0d0c12 85%)`
                      : 'rgba(10, 10, 14, 0.82)',
                    borderColor: s1Flashing ? '#ffffff' : p1.abilityReady ? skillColor : '#4b4550',
                    boxShadow: s1Flashing
                      ? `0 0 22px ${skillColor}`
                      : p1.abilityReady
                      ? `0 0 18px ${skillColor}44`
                      : undefined,
                  }}
                >
                  {s1Deg > 0 && !(isOnlineCampaign && p1.weapon === 'none') && (
                    <div
                      className="pointer-events-none absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(from 0deg, rgba(3, 4, 9, 0.84) ${s1Deg}deg, transparent ${s1Deg}deg)`,
                      }}
                    />
                  )}
                  {s1Flashing && (
                    <span
                      key={`mob-s1-flash-${flashGen['s1'] || 0}`}
                      className="pointer-events-none absolute inset-0 rounded-full bg-white/80 animate-skill-ready-flash"
                    />
                  )}
                  <Sparkles
                    className="w-4 h-4 relative z-10"
                    style={{ color: p1.abilityReady ? skillColor : '#71717a' }}
                  />
                  <span
                    className="relative z-10 font-mono-num text-[10px] font-bold leading-none tabular-nums"
                    style={{ color: p1.abilityReady ? '#fafaf9' : '#fde68a' }}
                  >
                    {isOnlineCampaign && p1.weapon === 'none'
                      ? 'LOOT'
                      : p1.abilityReady
                      ? 'E · S1'
                      : `${Math.ceil(s1Exact)}s`}
                  </span>
                </button>
                {!compact && (
                  <span className="font-mono-num text-[9px] text-stone-400 truncate max-w-[68px]">
                    {skillCaption}
                  </span>
                )}
              </div>
            );
          })()}

          {(() => {
            const dashExact = p1.dashCooldownExact ?? p1.dashCooldown ?? 0;
            const dashMax = Math.max(1, p1.dashMaxCooldown || 8.8);
            const dashDeg = !dashAvailable && dashExact > 0 ? Math.round(Math.min(1, dashExact / dashMax) * 360) : 0;
            const dashFlashing = Boolean(flashActive['dash']);
            return (
              <div className="flex flex-col items-center gap-0.5">
                <button
                  type="button"
                  onPointerDown={handleDashDown}
                  onPointerUp={handleDashUp}
                  onPointerCancel={handleDashUp}
                  aria-label="Dash"
                  className={`${dashBtnSizeClass} relative min-w-[54px] min-h-[54px] rounded-full border-2 flex flex-col items-center justify-center gap-0.5 overflow-hidden transition-transform touch-none cursor-pointer ${
                    dashPressed ? 'scale-95' : 'scale-100'
                  } ${dashAvailable ? 'shadow-lg' : 'opacity-90'}`}
                  style={{
                    touchAction: 'none',
                    background: dashAvailable
                      ? 'radial-gradient(circle at 35% 30%, rgba(16, 185, 129, 0.42), #091210 85%)'
                      : 'rgba(10, 10, 14, 0.82)',
                    borderColor: dashFlashing ? '#ffffff' : dashAvailable ? '#34d399' : '#4b4550',
                    boxShadow: dashFlashing
                      ? '0 0 22px rgba(110, 231, 183, 0.9)'
                      : dashAvailable
                      ? '0 0 20px rgba(52, 211, 153, 0.35)'
                      : undefined,
                  }}
                >
                  {dashDeg > 0 && (
                    <div
                      className="pointer-events-none absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(from 0deg, rgba(3, 4, 9, 0.84) ${dashDeg}deg, transparent ${dashDeg}deg)`,
                      }}
                    />
                  )}
                  {dashFlashing && (
                    <span
                      key={`mob-dash-flash-${flashGen['dash'] || 0}`}
                      className="pointer-events-none absolute inset-0 rounded-full bg-white/80 animate-skill-ready-flash"
                    />
                  )}
                  <Wind className={`w-5 h-5 relative z-10 ${dashAvailable ? 'text-emerald-300' : 'text-stone-500'}`} />
                  <span
                    className={`relative z-10 font-mono-num text-[10px] font-bold leading-none tabular-nums ${
                      dashAvailable ? 'text-emerald-100' : 'text-amber-200'
                    }`}
                  >
                    {dashAvailable
                      ? p1.dash2Active && p1.dash2Ready
                        ? 'DASH x2'
                        : 'DASH'
                      : `${Math.ceil(dashExact)}s`}
                  </span>
                </button>
                {!compact && (
                  <span className="font-mono-num text-[9px] text-stone-400 tracking-wider">DODGE</span>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
};
