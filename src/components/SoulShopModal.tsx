import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Lock, Check, FastForward, PackageOpen, ShieldCheck, X, Palette, Flame } from 'lucide-react';
import {
  buildCaseRoll,
  CaseItem,
  CaseKind,
  CaseRollOutcome,
  COSMETIC_CASE_COST,
  COSMETICS_CATALOG,
  ItemRarity,
  RARITY_META,
  SKILL_EFFECT_CASE_COST,
  SKILL_EFFECTS_CATALOG,
  SoulsProfile,
} from '../game/cosmetics';
import { soundEngine } from '../game/soundEngine';

interface SoulShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SoulsProfile;
  onUpdateProfile: (next: SoulsProfile) => void;
  sfxMuted?: boolean;
}

const CARD_W = 132;
const CARD_GAP = 8;
const CARD_STRIDE = CARD_W + CARD_GAP;
const SPIN_DURATION_MS = 4300;
const RARITY_ORDER: ItemRarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];

function ItemVisualBadge({ item, size = 'md' }: { item: CaseItem; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  if (item.kind === 'cosmetic') {
    const c = item.def;
    return (
      <div
        className={`${dim} rounded-lg flex items-center justify-center relative shrink-0 border`}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${c.primary}33, #090d16 78%)`,
          borderColor: `${c.primary}88`,
        }}
      >
        <div
          className="w-5 h-5 rounded-full border-2"
          style={{
            borderColor: c.primary,
            boxShadow: `0 0 10px ${c.secondary}55`,
          }}
        />
        <div
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: c.secondary }}
        />
      </div>
    );
  }
  const fx = item.def;
  const bg = fx.prismatic
    ? 'linear-gradient(135deg, #fbbf24, #38bdf8, #c084fc, #f43f5e)'
    : `linear-gradient(135deg, ${fx.primary}, ${fx.secondary})`;
  return (
    <div
      className={`${dim} rounded-lg flex items-center justify-center relative shrink-0 border`}
      style={{
        background: '#090d16',
        borderColor: `${fx.primary}88`,
      }}
    >
      <div
        className="w-7 h-3 rounded-full -rotate-12"
        style={{
          background: bg,
          boxShadow: `0 0 10px ${fx.primary}66`,
        }}
      />
      <div
        className="absolute w-5 h-0.5 rounded-full -rotate-12"
        style={{ backgroundColor: fx.core }}
      />
    </div>
  );
}

export const SoulShopModal: React.FC<SoulShopModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  sfxMuted = false,
}) => {
  const [tab, setTab] = useState<'shop' | 'wardrobe'>('shop');
  const [activeCaseKind, setActiveCaseKind] = useState<CaseKind>('cosmetic');
  const [rollOutcome, setRollOutcome] = useState<CaseRollOutcome | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinFinished, setSpinFinished] = useState(false);
  const [trackOffsetX, setTrackOffsetX] = useState(0);
  const [instantSnap, setInstantSnap] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const spinStartRef = useRef(0);
  const targetOffsetRef = useRef(0);
  const lastCardIdxRef = useRef(-1);

  const stopSpinLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopSpinLoop();
      setIsSpinning(false);
    }
    return () => stopSpinLoop();
  }, [isOpen, stopSpinLoop]);

  const computeWinningOffset = useCallback((winningIndex: number) => {
    const viewW = viewportRef.current?.clientWidth || 640;
    const jitter = (Math.random() - 0.5) * (CARD_W * 0.56);
    const cardCenter = winningIndex * CARD_STRIDE + CARD_W / 2 + jitter;
    return -(cardCenter - viewW / 2);
  }, []);

  const finishRollReveal = useCallback(
    (outcome: CaseRollOutcome) => {
      stopSpinLoop();
      setIsSpinning(false);
      setSpinFinished(true);
      if (!sfxMuted) {
        soundEngine.playCaseWin(outcome.winner.def.rarity);
      }
    },
    [sfxMuted, stopSpinLoop]
  );

  const startCaseRoll = useCallback(
    (kind: CaseKind) => {
      if (isSpinning) return;
      const cost = kind === 'cosmetic' ? COSMETIC_CASE_COST : SKILL_EFFECT_CASE_COST;
      if (profile.souls < cost) return;

      const outcome = buildCaseRoll(kind, profile);

      // Persist roll immediately so cost/unlock/refund is atomic
      const nextCosmetics = [...profile.unlockedCosmetics];
      const nextEffects = [...profile.unlockedSkillEffects];
      if (outcome.winner.kind === 'cosmetic') {
        if (!nextCosmetics.includes(outcome.winner.def.id)) {
          nextCosmetics.push(outcome.winner.def.id);
        }
      } else {
        if (!nextEffects.includes(outcome.winner.def.id)) {
          nextEffects.push(outcome.winner.def.id);
        }
      }

      const nextProfile: SoulsProfile = {
        ...profile,
        souls: Math.max(0, profile.souls - cost + outcome.refundSouls),
        unlockedCosmetics: nextCosmetics,
        unlockedSkillEffects: nextEffects,
        totalChestsOpened: profile.totalChestsOpened + 1,
      };
      onUpdateProfile(nextProfile);

      setActiveCaseKind(kind);
      setRollOutcome(outcome);
      setSpinFinished(false);
      setInstantSnap(true);
      setTrackOffsetX(0);
      lastCardIdxRef.current = -1;

      requestAnimationFrame(() => {
        const targetX = computeWinningOffset(outcome.winningIndex);
        targetOffsetRef.current = targetX;
        setInstantSnap(false);
        setIsSpinning(true);
        spinStartRef.current = performance.now();

        requestAnimationFrame(() => {
          setTrackOffsetX(targetX);
        });

        const viewW = viewportRef.current?.clientWidth || 640;
        const tickLoop = () => {
          const elapsed = performance.now() - spinStartRef.current;
          const t = Math.min(1, elapsed / SPIN_DURATION_MS);

          // Estimate current offset from DOM transform matrix for crisp tick alignment
          let curX = targetX * (1 - Math.pow(1 - t, 3));
          if (trackRef.current) {
            const style = window.getComputedStyle(trackRef.current);
            const mat = style.transform;
            if (mat && mat !== 'none') {
              const parts = mat.match(/matrix\(([^)]+)\)/);
              if (parts && parts[1]) {
                const nums = parts[1].split(',');
                const tx = parseFloat(nums[4] || '0');
                if (Number.isFinite(tx)) curX = tx;
              }
            }
          }

          const centerWorldX = viewW / 2 - curX;
          const cardIdx = Math.floor(centerWorldX / CARD_STRIDE);
          if (cardIdx !== lastCardIdxRef.current && cardIdx >= 0) {
            lastCardIdxRef.current = cardIdx;
            if (!sfxMuted) {
              soundEngine.playCaseTick(Math.max(0.1, 1 - t));
            }
          }

          if (elapsed >= SPIN_DURATION_MS) {
            finishRollReveal(outcome);
            return;
          }
          rafRef.current = requestAnimationFrame(tickLoop);
        };
        rafRef.current = requestAnimationFrame(tickLoop);
      });
    },
    [computeWinningOffset, finishRollReveal, isSpinning, onUpdateProfile, profile, sfxMuted]
  );

  const handleSkipSpin = () => {
    if (!rollOutcome || !isSpinning) return;
    setInstantSnap(true);
    setTrackOffsetX(targetOffsetRef.current);
    finishRollReveal(rollOutcome);
  };

  const handleEquipWinner = () => {
    if (!rollOutcome) return;
    if (rollOutcome.winner.kind === 'cosmetic') {
      onUpdateProfile({ ...profile, equippedCosmetic: rollOutcome.winner.def.id });
    } else {
      onUpdateProfile({ ...profile, equippedSkillEffect: rollOutcome.winner.def.id });
    }
  };

  const isWinnerEquipped = useMemo(() => {
    if (!rollOutcome) return false;
    return rollOutcome.winner.kind === 'cosmetic'
      ? profile.equippedCosmetic === rollOutcome.winner.def.id
      : profile.equippedSkillEffect === rollOutcome.winner.def.id;
  }, [profile.equippedCosmetic, profile.equippedSkillEffect, rollOutcome]);

  if (!isOpen) return null;

  const unlockedCosCount = profile.unlockedCosmetics.length;
  const unlockedFxCount = profile.unlockedSkillEffects.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5"
      onClick={() => {
        if (!isSpinning) onClose();
      }}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-slate-950 border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-wide text-slate-100 uppercase">
                Soul Armory &amp; Chests
              </h2>
              <p className="text-[11px] text-slate-400">
                Earn Souls every run to unbox sleek character accessories &amp; skill VFX themes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-amber-500/40 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 tabular-nums whitespace-nowrap">
                {profile.souls.toLocaleString()} SOULS
              </span>
            </div>
            <button
              onClick={onClose}
              disabled={isSpinning}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 cursor-pointer"
              title={isSpinning ? 'Wait for roll to finish or click Skip' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2 bg-slate-900/40 border-b border-slate-800/80">
          <button
            onClick={() => setTab('shop')}
            disabled={isSpinning}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border cursor-pointer transition-colors whitespace-nowrap ${
              tab === 'shop'
                ? 'bg-amber-500/20 text-amber-200 border-amber-400/60'
                : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
          >
            <PackageOpen className="w-4 h-4" />
            <span>Case Shop</span>
          </button>
          <button
            onClick={() => setTab('wardrobe')}
            disabled={isSpinning}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border cursor-pointer transition-colors whitespace-nowrap ${
              tab === 'wardrobe'
                ? 'bg-sky-500/20 text-sky-200 border-sky-400/60'
                : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              Wardrobe ({unlockedCosCount + unlockedFxCount}/{COSMETICS_CATALOG.length + SKILL_EFFECTS_CATALOG.length})
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === 'shop' ? (
            <>
              {/* Crate Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Cosmetic Crate */}
                <div
                  className={`rounded-xl p-4 border transition-colors ${
                    activeCaseKind === 'cosmetic'
                      ? 'bg-slate-900/95 border-sky-400/60'
                      : 'bg-slate-900/65 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-sky-500/15 border border-sky-400/40 flex items-center justify-center text-sky-300 shrink-0">
                        <Palette className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-slate-100">Character Cosmetics Case</div>
                        <div className="text-[11px] text-slate-400">
                          {unlockedCosCount}/{COSMETICS_CATALOG.length} unlocked · Sleek non-chunky gear
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded tabular-nums whitespace-nowrap">
                      {COSMETIC_CASE_COST.toLocaleString()} SOULS
                    </span>
                  </div>
                  <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                    Lightweight halos, mini horns, phantom ribbons, cyber rings &amp; eclipse crowns that accent your hero cleanly.
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => startCaseRoll('cosmetic')}
                      disabled={isSpinning || profile.souls < COSMETIC_CASE_COST}
                      className="px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white border border-sky-400/40 disabled:border-slate-700 cursor-pointer whitespace-nowrap"
                    >
                      {profile.souls < COSMETIC_CASE_COST ? 'Need 1,000 Souls' : 'Unbox Cosmetic (1,000)'}
                    </button>
                    <button
                      onClick={() => setActiveCaseKind('cosmetic')}
                      disabled={isSpinning}
                      className="text-[11px] font-semibold text-sky-300 hover:text-sky-200 cursor-pointer whitespace-nowrap"
                    >
                      Preview Odds
                    </button>
                  </div>
                </div>

                {/* Skill Effects Crate */}
                <div
                  className={`rounded-xl p-4 border transition-colors ${
                    activeCaseKind === 'skill_effect'
                      ? 'bg-slate-900/95 border-fuchsia-400/60'
                      : 'bg-slate-900/65 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-fuchsia-500/15 border border-fuchsia-400/40 flex items-center justify-center text-fuchsia-300 shrink-0">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-slate-100">Skill Effects Case</div>
                        <div className="text-[11px] text-slate-400">
                          {unlockedFxCount}/{SKILL_EFFECTS_CATALOG.length} unlocked · Full combat VFX themes
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded tabular-nums whitespace-nowrap">
                      {SKILL_EFFECT_CASE_COST.toLocaleString()} SOULS
                    </span>
                  </div>
                  <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                    Transforms dash trails, slash arcs, shockwaves, skill zones, decoys &amp; arrows with custom elemental &amp; prismatic palettes.
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => startCaseRoll('skill_effect')}
                      disabled={isSpinning || profile.souls < SKILL_EFFECT_CASE_COST}
                      className="px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-800 disabled:text-slate-500 text-white border border-fuchsia-400/40 disabled:border-slate-700 cursor-pointer whitespace-nowrap"
                    >
                      {profile.souls < SKILL_EFFECT_CASE_COST ? 'Need 10,000 Souls' : 'Unbox Skill VFX (10,000)'}
                    </button>
                    <button
                      onClick={() => setActiveCaseKind('skill_effect')}
                      disabled={isSpinning}
                      className="text-[11px] font-semibold text-fuchsia-300 hover:text-fuchsia-200 cursor-pointer whitespace-nowrap"
                    >
                      Preview Odds
                    </button>
                  </div>
                </div>
              </div>

              {/* CS:GO-Style Case Roulette Viewport */}
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {rollOutcome
                      ? rollOutcome.kind === 'cosmetic'
                        ? 'Cosmetic Crate Unboxing'
                        : 'Skill VFX Crate Unboxing'
                      : 'Case Roulette Stage'}
                  </div>
                  {isSpinning && (
                    <button
                      onClick={handleSkipSpin}
                      className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[11px] font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      <span>Skip Roll</span>
                    </button>
                  )}
                </div>

                {rollOutcome ? (
                  <div
                    ref={viewportRef}
                    className="relative w-full h-36 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden select-none"
                  >
                    {/* Center Selector Needle */}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-amber-400 z-20 shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[8px] border-l-transparent border-r-transparent border-t-amber-400 z-20" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-b-[8px] border-l-transparent border-r-transparent border-b-amber-400 z-20" />

                    {/* Edge Gradient Vignettes */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-950 to-transparent z-10" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-950 to-transparent z-10" />

                    {/* Scrolling Strip */}
                    <div
                      ref={trackRef}
                      className="flex items-center h-full px-1"
                      style={{
                        gap: `${CARD_GAP}px`,
                        transform: `translate3d(${trackOffsetX}px, 0, 0)`,
                        transition: instantSnap
                          ? 'none'
                          : `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.08, 0.88, 0.14, 1)`,
                      }}
                    >
                      {rollOutcome.reelItems.map((item, idx) => {
                        const rMeta = RARITY_META[item.def.rarity];
                        const isWinnerSlot = spinFinished && idx === rollOutcome.winningIndex;
                        return (
                          <div
                            key={`${item.def.id}-${idx}`}
                            style={{
                              width: `${CARD_W}px`,
                              minWidth: `${CARD_W}px`,
                              backgroundColor: rMeta.bg,
                              borderColor: isWinnerSlot ? rMeta.color : rMeta.border,
                            }}
                            className={`h-28 rounded-lg border-2 flex flex-col items-center justify-between p-2 transition-transform ${
                              isWinnerSlot ? 'scale-105' : ''
                            }`}
                          >
                            <span
                              className="text-[9px] font-extrabold uppercase tracking-wider truncate w-full text-center"
                              style={{ color: rMeta.color }}
                            >
                              {rMeta.label}
                            </span>
                            <ItemVisualBadge item={item} size="sm" />
                            <span className="text-[11px] font-bold text-slate-100 truncate w-full text-center">
                              {item.def.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-32 rounded-lg bg-slate-950/80 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center px-4">
                    <div className="text-xs font-bold text-slate-300">
                      Select a case above to spin the CS-style crate reel
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Slayer runs clearing Boss 1 average ~700 Souls — duplicates automatically refund Souls!
                    </div>
                  </div>
                )}

                {/* Result Banner */}
                {rollOutcome && spinFinished && (
                  <div
                    className="rounded-lg border p-3.5 flex flex-wrap items-center justify-between gap-3"
                    style={{
                      backgroundColor: RARITY_META[rollOutcome.winner.def.rarity].bg,
                      borderColor: RARITY_META[rollOutcome.winner.def.rarity].color,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <ItemVisualBadge item={rollOutcome.winner} size="lg" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-extrabold uppercase tracking-wider"
                            style={{ color: RARITY_META[rollOutcome.winner.def.rarity].color }}
                          >
                            {RARITY_META[rollOutcome.winner.def.rarity].label}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950/70 text-slate-200">
                            {rollOutcome.isDuplicate
                              ? `DUPLICATE · +${rollOutcome.refundSouls.toLocaleString()} SOULS REFUNDED`
                              : 'NEW UNLOCK!'}
                          </span>
                        </div>
                        <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                          {rollOutcome.winner.def.name}
                        </div>
                        <div className="text-xs text-slate-300">{rollOutcome.winner.def.description}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={handleEquipWinner}
                        disabled={isWinnerEquipped}
                        className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-emerald-300 text-white border border-emerald-400/40 cursor-pointer whitespace-nowrap"
                      >
                        {isWinnerEquipped ? 'Equipped' : 'Equip Now'}
                      </button>
                      <button
                        onClick={() => startCaseRoll(rollOutcome.kind)}
                        disabled={profile.souls < rollOutcome.cost}
                        className="px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white border border-amber-400/40 cursor-pointer whitespace-nowrap"
                      >
                        Roll Again ({rollOutcome.cost.toLocaleString()})
                      </button>
                    </div>
                  </div>
                )}

                {/* Crate Contents & Rarity Odds */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="font-bold text-slate-300 uppercase tracking-wider">
                      {activeCaseKind === 'cosmetic' ? 'Cosmetics Case Pool (12)' : 'Skill Effects Case Pool (10)'}
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      {RARITY_ORDER.map((r) => (
                        <span key={r} className="font-bold tabular-nums" style={{ color: RARITY_META[r].color }}>
                          {RARITY_META[r].label}: {RARITY_META[r].weight}%
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {(activeCaseKind === 'cosmetic' ? COSMETICS_CATALOG : SKILL_EFFECTS_CATALOG).map((entry) => {
                      const rMeta = RARITY_META[entry.rarity];
                      const owned =
                        activeCaseKind === 'cosmetic'
                          ? profile.unlockedCosmetics.includes(entry.id as never)
                          : profile.unlockedSkillEffects.includes(entry.id as never);
                      return (
                        <div
                          key={entry.id}
                          className="rounded-lg px-2.5 py-2 bg-slate-950/80 border flex items-center gap-2"
                          style={{ borderColor: owned ? rMeta.color : 'rgba(51, 65, 85, 0.7)' }}
                        >
                          <div
                            className="w-2.5 h-6 rounded-sm shrink-0"
                            style={{ backgroundColor: rMeta.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-bold text-slate-100 truncate">{entry.name}</div>
                            <div className="text-[10px] truncate" style={{ color: rMeta.color }}>
                              {owned ? 'Owned' : rMeta.label}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-5">
              {/* Equipped Cosmetics Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
                    Character Cosmetics ({unlockedCosCount}/{COSMETICS_CATALOG.length})
                  </h3>
                  <button
                    onClick={() => onUpdateProfile({ ...profile, equippedCosmetic: null })}
                    disabled={profile.equippedCosmetic === null}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold border cursor-pointer whitespace-nowrap ${
                      profile.equippedCosmetic === null
                        ? 'bg-sky-500/20 text-sky-200 border-sky-400/60'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-700'
                    }`}
                  >
                    {profile.equippedCosmetic === null ? 'None Equipped' : 'Unequip Cosmetic'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {COSMETICS_CATALOG.map((cos) => {
                    const owned = profile.unlockedCosmetics.includes(cos.id);
                    const equipped = profile.equippedCosmetic === cos.id;
                    const rMeta = RARITY_META[cos.rarity];
                    return (
                      <div
                        key={cos.id}
                        className={`rounded-xl p-3 border flex flex-col justify-between gap-2.5 ${
                          equipped
                            ? 'bg-sky-950/40 border-sky-400'
                            : owned
                            ? 'bg-slate-900/90 border-slate-700'
                            : 'bg-slate-950/70 border-slate-800/80 opacity-65'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <ItemVisualBadge item={{ kind: 'cosmetic', def: cos }} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-extrabold uppercase" style={{ color: rMeta.color }}>
                              {rMeta.label}
                            </div>
                            <div className="text-xs font-bold text-slate-100 truncate">{cos.name}</div>
                            <div className="text-[11px] text-slate-400 leading-snug mt-0.5">{cos.subtitle}</div>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            owned &&
                            onUpdateProfile({
                              ...profile,
                              equippedCosmetic: equipped ? null : cos.id,
                            })
                          }
                          disabled={!owned}
                          className={`w-full py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border whitespace-nowrap ${
                            equipped
                              ? 'bg-emerald-600/30 text-emerald-200 border-emerald-400/60 cursor-pointer'
                              : owned
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-600 cursor-pointer'
                              : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                          }`}
                        >
                          {equipped ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Equipped</span>
                            </>
                          ) : owned ? (
                            <span>Equip Accessory</span>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Unbox in Crate</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Equipped Skill Effects Section */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-fuchsia-300">
                    Skill VFX Themes ({unlockedFxCount}/{SKILL_EFFECTS_CATALOG.length})
                  </h3>
                  <button
                    onClick={() => onUpdateProfile({ ...profile, equippedSkillEffect: null })}
                    disabled={profile.equippedSkillEffect === null}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold border cursor-pointer whitespace-nowrap ${
                      profile.equippedSkillEffect === null
                        ? 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/60'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-700'
                    }`}
                  >
                    {profile.equippedSkillEffect === null ? 'Default VFX Equipped' : 'Use Default VFX'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {SKILL_EFFECTS_CATALOG.map((fx) => {
                    const owned = profile.unlockedSkillEffects.includes(fx.id);
                    const equipped = profile.equippedSkillEffect === fx.id;
                    const rMeta = RARITY_META[fx.rarity];
                    return (
                      <div
                        key={fx.id}
                        className={`rounded-xl p-3 border flex flex-col justify-between gap-2.5 ${
                          equipped
                            ? 'bg-fuchsia-950/40 border-fuchsia-400'
                            : owned
                            ? 'bg-slate-900/90 border-slate-700'
                            : 'bg-slate-950/70 border-slate-800/80 opacity-65'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <ItemVisualBadge item={{ kind: 'skill_effect', def: fx }} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-extrabold uppercase" style={{ color: rMeta.color }}>
                              {rMeta.label}
                            </div>
                            <div className="text-xs font-bold text-slate-100 truncate">{fx.name}</div>
                            <div className="text-[11px] text-slate-400 leading-snug mt-0.5">{fx.subtitle}</div>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            owned &&
                            onUpdateProfile({
                              ...profile,
                              equippedSkillEffect: equipped ? null : fx.id,
                            })
                          }
                          disabled={!owned}
                          className={`w-full py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border whitespace-nowrap ${
                            equipped
                              ? 'bg-emerald-600/30 text-emerald-200 border-emerald-400/60 cursor-pointer'
                              : owned
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-600 cursor-pointer'
                              : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                          }`}
                        >
                          {equipped ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Equipped</span>
                            </>
                          ) : owned ? (
                            <span>Equip Skill VFX</span>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Unbox in Crate</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
