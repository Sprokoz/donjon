import React, { useEffect, useRef, useState } from 'react';
import { FastForward, Lock, Sparkles, Wind } from 'lucide-react';
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

  const padRef = useRef<HTMLDivElement | null>(null);
  const stickPointerIdRef = useRef<number | null>(null);
  const dashPointerIdRef = useRef<number | null>(null);
  const abilityPointerIdRef = useRef<number | null>(null);

  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dashPressed, setDashPressed] = useState(false);
  const [abilityPressed, setAbilityPressed] = useState(false);
  const [pressedSlots, setPressedSlots] = useState<Record<number, boolean>>({});

  const maxRadius = compact ? 36 : 44;

  const resetAllInputs = () => {
    stickPointerIdRef.current = null;
    dashPointerIdRef.current = null;
    abilityPointerIdRef.current = null;
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
      window.removeEventListener('blur', resetAllInputs);
      onMoveChange(0, 0);
      onDashChange(false);
      onAbilityChange(false);
      onSkillSlotChange?.(2, false);
      onSkillSlotChange?.(3, false);
      onSkillSlotChange?.(4, false);
    };
  }, []);

  const updateStickFromPoint = (clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
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

  const handleStickDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    soundEngine.unlock();
    if (stickPointerIdRef.current !== null) return;
    stickPointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore pointer capture issues on unsupported browsers
    }
    updateStickFromPoint(e.clientX, e.clientY);
  };

  const handleStickMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (stickPointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    updateStickFromPoint(e.clientX, e.clientY);
  };

  const handleStickUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (stickPointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    stickPointerIdRef.current = null;
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
  const padSizeClass = compact ? 'w-28 h-28' : 'w-32 h-32 sm:w-36 sm:h-36';
  const knobSizeClass = compact ? 'w-12 h-12' : 'w-14 h-14';
  const dashBtnSizeClass = compact ? 'w-14 h-14' : 'w-16 h-16';
  const skillBtnSizeClass = compact ? 'w-13 h-13' : 'w-14 h-14';
  const unlockedTier = p1.unlockedSkillTier || 1;
  const hasSkills = !isOnlineCampaign || p1.weapon !== 'none';

  return (
    <div
      className="w-full flex items-end justify-between gap-2 px-2 sm:px-4 select-none touch-none"
      style={{ touchAction: 'none' }}
    >
      {/* Left: 360° Virtual Analog Thumbstick */}
      <div className="pointer-events-auto flex flex-col items-center gap-1">
        <div
          ref={padRef}
          onPointerDown={handleStickDown}
          onPointerMove={handleStickMove}
          onPointerUp={handleStickUp}
          onPointerCancel={handleStickUp}
          role="application"
          aria-label="Movement Analog Stick"
          className={`${padSizeClass} relative rounded-full bg-black/65 border-2 border-stone-700/90 backdrop-blur-sm shadow-[0_0_24px_rgba(0,0,0,0.65)] flex items-center justify-center touch-none`}
          style={{
            borderColor: knobOffset.x !== 0 || knobOffset.y !== 0 ? `${playerColor}cc` : undefined,
            touchAction: 'none',
          }}
        >
          <div className="pointer-events-none absolute inset-3 rounded-full border border-dashed border-stone-700/60" />
          <div className="pointer-events-none absolute w-full h-[1px] bg-stone-800/70" />
          <div className="pointer-events-none absolute h-full w-[1px] bg-stone-800/70" />

          <div
            className={`${knobSizeClass} pointer-events-none rounded-full border-2 shadow-lg flex items-center justify-center transition-transform duration-75`}
            style={{
              transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
              background: `radial-gradient(circle at 35% 35%, ${playerColor}dd, #111118 85%)`,
              borderColor: playerColor,
              boxShadow: `0 0 16px ${playerColor}55`,
            }}
          >
            <div className="w-3 h-3 rounded-full bg-white/80" />
          </div>
        </div>
        {!compact && (
          <span className="font-mono-num text-[10px] text-stone-400 tracking-wider">MOVE</span>
        )}
      </div>

      {/* Center quick Skip Intro pill on mobile when boss intro is active */}
      {showSkipIntro && onSkipIntro && (
        <button
          type="button"
          onClick={() => {
            soundEngine.unlock();
            onSkipIntro();
          }}
          className="pointer-events-auto mb-3 px-4 py-2.5 min-h-[44px] rounded-md bg-black/85 border border-amber-500/80 text-amber-200 font-mono-num text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
        >
          <FastForward className="w-4 h-4 text-amber-400" />
          <span>Skip Intro</span>
        </button>
      )}

      {/* Right: 4-Skill Cluster + Primary Dash */}
      <div className="pointer-events-auto flex flex-col items-end gap-1.5">
        {/* Unlockable Skills [Q], [R], [F] (mini 44px+ buttons) */}
        {hasSkills && (
          <div className="flex items-center gap-1.5">
            {([2, 3, 4] as const).map((slotNum) => {
              const sDef = skillsList[slotNum - 1];
              const unlocked = unlockedTier >= slotNum;
              const cd = p1.skillCooldowns?.[slotNum - 1] || 0;
              const ready = unlocked && cd <= 0;
              return (
                <button
                  key={slotNum}
                  type="button"
                  onPointerDown={handleSlotDown(slotNum)}
                  onPointerUp={handleSlotUp(slotNum)}
                  onPointerCancel={handleSlotUp(slotNum)}
                  aria-label={sDef ? sDef.name : `Skill ${slotNum}`}
                  className={`min-w-[44px] min-h-[44px] px-1.5 rounded-full border-2 flex flex-col items-center justify-center transition-transform touch-none cursor-pointer ${
                    pressedSlots[slotNum] ? 'scale-95' : 'scale-100'
                  } ${!unlocked ? 'opacity-45' : ready ? 'shadow-md' : 'opacity-80'}`}
                  style={{
                    touchAction: 'none',
                    background: ready
                      ? `radial-gradient(circle at 35% 30%, ${skillColor}44, #0d0c12 85%)`
                      : 'rgba(10, 10, 14, 0.85)',
                    borderColor: ready ? skillColor : '#3f3f46',
                  }}
                >
                  {!unlocked ? (
                    <Lock className="w-3.5 h-3.5 text-stone-500" />
                  ) : (
                    <span
                      className="font-mono-num text-[9px] font-bold leading-none"
                      style={{ color: ready ? '#fafaf9' : '#a1a1aa' }}
                    >
                      {ready ? sDef?.keyLabel || `S${slotNum}` : `${cd}s`}
                    </span>
                  )}
                  <span className="font-mono-num text-[8px] text-stone-400 leading-none mt-0.5 truncate max-w-[38px]">
                    {unlocked ? sDef?.shortName.slice(0, 5) : 'SCRL'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-end gap-2.5">
          {/* Primary Skill 1 [E] / Interact Button */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              type="button"
              onPointerDown={handleAbilityDown}
              onPointerUp={handleAbilityUp}
              onPointerCancel={handleAbilityUp}
              aria-label="Hero Skill 1"
              className={`${skillBtnSizeClass} min-w-[48px] min-h-[48px] rounded-full border-2 flex flex-col items-center justify-center gap-0.5 transition-transform touch-none cursor-pointer ${
                abilityPressed ? 'scale-95' : 'scale-100'
              } ${p1.abilityReady || (isOnlineCampaign && p1.weapon === 'none') ? 'shadow-lg' : 'opacity-75'}`}
              style={{
                touchAction: 'none',
                background: p1.abilityReady
                  ? `radial-gradient(circle at 35% 30%, ${skillColor}55, #0d0c12 85%)`
                  : 'rgba(10, 10, 14, 0.82)',
                borderColor: p1.abilityReady ? skillColor : '#3f3f46',
                boxShadow: p1.abilityReady ? `0 0 18px ${skillColor}44` : undefined,
              }}
            >
              <Sparkles
                className="w-4 h-4"
                style={{ color: p1.abilityReady ? skillColor : '#71717a' }}
              />
              <span
                className="font-mono-num text-[10px] font-bold leading-none"
                style={{ color: p1.abilityReady ? '#fafaf9' : '#a1a1aa' }}
              >
                {isOnlineCampaign && p1.weapon === 'none'
                  ? 'LOOT'
                  : p1.abilityReady
                  ? 'E · S1'
                  : `${p1.abilityCooldown}s`}
              </span>
            </button>
            {!compact && (
              <span className="font-mono-num text-[9px] text-stone-400 truncate max-w-[68px]">
                {skillCaption}
              </span>
            )}
          </div>

          {/* Primary Dash Button */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              type="button"
              onPointerDown={handleDashDown}
              onPointerUp={handleDashUp}
              onPointerCancel={handleDashUp}
              aria-label="Dash"
              className={`${dashBtnSizeClass} min-w-[52px] min-h-[52px] rounded-full border-2 flex flex-col items-center justify-center gap-0.5 transition-transform touch-none cursor-pointer ${
                dashPressed ? 'scale-95' : 'scale-100'
              } ${dashAvailable ? 'shadow-lg' : 'opacity-75'}`}
              style={{
                touchAction: 'none',
                background: dashAvailable
                  ? 'radial-gradient(circle at 35% 30%, rgba(16, 185, 129, 0.42), #091210 85%)'
                  : 'rgba(10, 10, 14, 0.82)',
                borderColor: dashAvailable ? '#34d399' : '#3f3f46',
                boxShadow: dashAvailable ? '0 0 20px rgba(52, 211, 153, 0.35)' : undefined,
              }}
            >
              <Wind className={`w-5 h-5 ${dashAvailable ? 'text-emerald-300' : 'text-stone-500'}`} />
              <span
                className={`font-mono-num text-[10px] font-bold leading-none ${
                  dashAvailable ? 'text-emerald-100' : 'text-stone-400'
                }`}
              >
                {dashAvailable
                  ? p1.dash2Active && p1.dash2Ready
                    ? 'DASH x2'
                    : 'DASH'
                  : `${p1.dashCooldown}s`}
              </span>
            </button>
            {!compact && (
              <span className="font-mono-num text-[9px] text-stone-400 tracking-wider">DODGE</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
