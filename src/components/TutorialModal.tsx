import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  Flame,
  FlaskConical,
  Heart,
  Play,
  Shield,
  Swords,
  X,
  Zap,
} from 'lucide-react';
import { HERO_CLASSES, WEAPONS_CATALOG } from '../game/types';
import { soundEngine } from '../game/soundEngine';

interface TutorialModalProps {
  onClose: () => void;
  onLaunchArena: () => void;
}

const PASSIVE_BREAKDOWN: Record<string, string> = {
  ronin:
    'While dashing with a Blade Orb, your slash hitbox extends +18px outward, letting you slice enemies and bosses safely at edge range.',
  phantom:
    'Lowest Dash cooldown (6.5s). Every Dash leaves a Void Decoy behind that detonates after 0.55s, clearing nearby projectiles in a 105px blast.',
  vanguard:
    'Deploys with 125 Max HP (+25 bonus) and starts with an Aegis Shield that blocks 1 hit completely, regenerating automatically every 24 seconds.',
  volt:
    '+18% faster base movement. Whenever you earn a Clean Dodge, an automatic homing Arc Bolt fires at the boss or nearest foe.',
};

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose, onLaunchArena }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/88 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#09090e] border border-amber-700/50 rounded-lg flex flex-col overflow-hidden shadow-[0_0_45px_rgba(217,119,6,0.18)]">
        {/* Header */}
        <div className="px-6 py-4 bg-black/80 border-b border-stone-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-souls text-lg sm:text-xl font-bold text-stone-100 tracking-wider">
                COMBAT, INVENTORY &amp; BOSS CODEX
              </h2>
              <p className="text-[11px] font-mono-num text-stone-400">
                5 Interactive Arena Drills · Strict Role Weapons · Inventory Bag &amp; Boss Counters
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 cursor-pointer"
            aria-label="Close Tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Core Loop & 100-HP Damage Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/70 border border-stone-800 rounded-md p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-souls font-bold text-amber-300 tracking-wider">
                <Swords className="w-4 h-4 text-red-400" />
                <span>CORE COMBAT &amp; CLEAN DODGE</span>
              </div>
              <ul className="space-y-1.5 text-xs text-stone-300 leading-relaxed">
                <li>
                  <span className="text-white font-semibold">1. Arm &amp; Attack Anytime:</span> Grab your glowing Blade Orb to slice enemies or strike bosses during any active phase.
                </li>
                <li>
                  <span className="text-white font-semibold">2. Pure Clean Dodge:</span> Avoid attacks without taking damage. Surviving an attack pattern unhit shaves 1.5s off Dash CD and charges an <span className="text-amber-300 font-semibold">Empowered Blade</span> (+1 DMG).
                </li>
                <li>
                  <span className="text-white font-semibold">3. Punish Weakened Bosses (2X DMG):</span> Interrupting Boss Rituals or surviving heavy waves staggers bosses into <span className="text-cyan-300 font-semibold">WEAKENED</span> for <span className="text-cyan-300 font-semibold">2X CRITICAL DAMAGE</span>!
                </li>
              </ul>
            </div>

            <div className="bg-black/70 border border-stone-800 rounded-md p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-souls font-bold text-rose-400 tracking-wider">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>INVENTORY BAG, FLASKS &amp; LOOP 2+</span>
              </div>
              <ul className="space-y-1.5 text-xs text-stone-300 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Minecraft Inventory [I]:</strong> Equip <strong className="text-amber-300">1 Weapon</strong> at a time. Drop your weapon or learn/drop specific <strong className="text-purple-300">[Q/R/F] Skill Scrolls</strong> in your 8-slot Bag!
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-rose-300">Crimson Flasks [C] (Max 2 · 90s CD) &amp; Vex:</strong> Talk to <strong className="text-amber-300">Broker Vex [E]</strong> in Shops for instant healing, HP upgrades &amp; rare Skill Scrolls.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-amber-300">Stairs Down &amp; Loop 2+:</strong> Not ready for the Boss? Take <strong className="text-purple-300">STAIRS DOWN</strong> doors to delve into deeper sub-floors for extra loot &amp; rare Scrolls!
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Boss Teamwork Counters (Nightmare / Loop 2+ across all 4 Bosses) */}
          <div className="bg-gradient-to-r from-sky-950/35 via-black/80 to-purple-950/35 border border-cyan-700/50 rounded-md p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-souls font-bold text-cyan-300 tracking-wider">
                <AlertTriangle className="w-4 h-4 text-cyan-400" />
                <span>ALL-BOSS TEAMWORK MECHANICS (NIGHTMARE OR LOOP 2+)</span>
              </div>
              <span className="text-[10px] font-mono-num text-amber-300">
                Active on Iron Destroyer · Void Phantom · Yamata-Oni · Solaris &amp; Lunaris
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-300">
              <div className="p-2.5 rounded bg-black/70 border border-amber-700/50 space-y-1">
                <div className="font-mono-num text-[11px] font-bold text-amber-300">
                  1. ABYSSAL MELTDOWN → TINY SAFE ISLAND
                </div>
                <p className="leading-snug text-stone-400">
                  The entire floor ignites with lethal magma except <strong className="text-emerald-300">one cramped Safe Island</strong> while the Boss fires rapid barrages at it. <strong className="text-sky-200">Tank raises [E] 4s Front Shield</strong> to purify every shot for allies!
                </p>
              </div>
              <div className="p-2.5 rounded bg-black/70 border border-sky-700/50 space-y-1">
                <div className="font-mono-num text-[11px] font-bold text-sky-300">
                  2. APOCALYPSE CONE &amp; TANK 4s FRONT SHIELD [E]
                </div>
                <p className="leading-snug text-stone-400">
                  Tank&apos;s <strong className="text-sky-200">4s Directional Greatshield [E]</strong> deletes projectiles/beams on contact &amp; projects a <strong className="text-white">Safe Shadow behind Tank</strong> for teammates. No Tank? Weave the cone lance lanes!
                </p>
              </div>
              <div className="p-2.5 rounded bg-black/70 border border-rose-700/50 space-y-1">
                <div className="font-mono-num text-[11px] font-bold text-rose-300">
                  3. CRIMSON HUNTER MARK → INTERCEPT OR STAGGER
                </div>
                <p className="leading-snug text-stone-400">
                  Boss locks a lethal sniper beam onto one player! <strong className="text-sky-200">Tank steps in front with [E] Shield</strong> to block the execution beam—or teammates hit the Boss with skills to stagger!
                </p>
              </div>
              <div className="p-2.5 rounded bg-black/70 border border-purple-700/50 space-y-1">
                <div className="font-mono-num text-[11px] font-bold text-purple-300">
                  4. GRAVITY VORTEX &amp; OBLIVION RITUAL
                </div>
                <p className="leading-snug text-stone-400">
                  Escape the pulling <strong className="text-purple-200">Gravity Vortex</strong> before core implosion, and hit channeling bosses with <strong className="text-purple-200">Weapon Skills</strong> or <strong className="text-amber-300">Empowered Blades</strong> to stagger!
                </p>
              </div>
            </div>
          </div>

          {/* Strict Campaign Weapons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-souls text-sm font-bold text-stone-100 tracking-wider">
                CAMPAIGN WEAPONS · STRICT PARTY ROLES
              </h3>
              <span className="text-[11px] font-mono-num text-cyan-300">
                Test all 5 Campaign Weapons inside Training Drill 4 &amp; 5
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {WEAPONS_CATALOG.map((w) => (
                <div
                  key={w.id}
                  className="bg-black/75 border rounded-md p-3 space-y-1.5"
                  style={{ borderColor: `${w.accent}66` }}
                >
                  <div className="font-arcade text-[10px] truncate" style={{ color: w.accent }}>
                    {w.shortTag}
                  </div>
                  <div className="font-mono-num text-[10px] text-white font-semibold truncate">
                    {w.roleLabel}
                  </div>
                  <p className="text-[11px] text-stone-400 leading-snug">
                    {w.skillDesc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Hero Classes & Passives Guide */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-souls text-sm font-bold text-stone-100 tracking-wider">
                BOSS RUSH FRAMES · PASSIVES &amp; [E/Q/R/F] SKILLS
              </h3>
              <span className="text-[11px] font-mono-num text-stone-400">
                Switch Classes live anytime inside the Training Arena
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {HERO_CLASSES.map((cls) => (
                <div
                  key={cls.id}
                  className="bg-black/75 border rounded-md p-4 space-y-2.5"
                  style={{ borderColor: `${cls.accent}55` }}
                >
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <div>
                      <span className="font-arcade text-xs" style={{ color: cls.accent }}>
                        {cls.name}
                      </span>
                      <span className="text-[11px] text-stone-400 ml-2">· {cls.role}</span>
                    </div>
                    <span className="font-mono-num text-[11px] text-stone-300">
                      {100 + cls.bonusHp} HP · {cls.dashCooldown}s Dash
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono-num text-amber-300 uppercase">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Passive: {cls.passiveName}</span>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed">{PASSIVE_BREAKDOWN[cls.id]}</p>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-stone-900">
                    <div className="flex items-center justify-between text-[11px] font-mono-num uppercase" style={{ color: cls.accent }}>
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> Skill [E]: {cls.skillName}
                      </span>
                      <span>{cls.skillCooldown}s CD</span>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed">{cls.skillDesc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-4 bg-black/90 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-stone-400">
            Complete 5 Interactive Drills: Grab Blade, Clean Dodge, Class/Weapon Skills, Inventory Bag/Flasks &amp; Boss Counter!
          </span>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                onClose();
              }}
              className="px-4 py-2.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-semibold text-stone-300 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.unlock();
                soundEngine.playBoonSelect();
                onLaunchArena();
              }}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-arcade text-[11px] tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(217,119,6,0.35)]"
            >
              <Play className="w-3.5 h-3.5" />
              <span>LAUNCH 5-DRILL ARENA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
