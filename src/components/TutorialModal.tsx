import React from 'react';
import { BookOpen, Heart, Play, Shield, Swords, X, Zap } from 'lucide-react';
import { HERO_CLASSES } from '../game/types';
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
                COMBAT &amp; CLASS CODEX
              </h2>
              <p className="text-[11px] font-mono-num text-stone-400">
                Optional Field Guide · 100-HP Mechanics · Class Passives &amp; Skills
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
                <span>CORE COMBAT LOOP</span>
              </div>
              <ul className="space-y-1.5 text-xs text-stone-300 leading-relaxed">
                <li>
                  <span className="text-white font-semibold">1. Arm &amp; Attack Anytime:</span> Grab your glowing Blade Orb to slice enemies or strike bosses during any active phase—no barrier meter required.
                </li>
                <li>
                  <span className="text-white font-semibold">2. Pure Clean Dodge:</span> Avoid attacks cleanly without taking damage. Surviving an attack pattern unhit shaves 1.5s off Dash CD and charges an <span className="text-amber-300 font-semibold">Empowered Blade</span> (+1 DMG).
                </li>
                <li>
                  <span className="text-white font-semibold">3. Punish Weakened Bosses (2X DMG):</span> After unleashing heavy attack waves, bosses stagger into <span className="text-cyan-300 font-semibold">WEAKENED</span>—all strikes deal <span className="text-cyan-300 font-semibold">2X CRITICAL DAMAGE</span>!
                </li>
              </ul>
            </div>

            <div className="bg-black/70 border border-stone-800 rounded-md p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-souls font-bold text-rose-400 tracking-wider">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>100-HP &amp; ATTACK DAMAGE TIERS</span>
              </div>
              <p className="text-xs text-stone-400">
                Every frame starts with <span className="text-stone-100 font-semibold">100 Base HP</span> (125 for Titan-X). Boss attacks deal damage based on lethality:
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono-num">
                <div className="bg-stone-950 border border-stone-800 rounded p-2">
                  <div className="text-[10px] text-sky-300">LIGHT ORBS</div>
                  <div className="text-sm font-bold text-white mt-0.5">12–16 DMG</div>
                </div>
                <div className="bg-stone-950 border border-stone-800 rounded p-2">
                  <div className="text-[10px] text-amber-300">HEAVY SALVO</div>
                  <div className="text-sm font-bold text-white mt-0.5">20–26 DMG</div>
                </div>
                <div className="bg-stone-950 border border-stone-800 rounded p-2">
                  <div className="text-[10px] text-rose-400">RAILGUN / SLAM</div>
                  <div className="text-sm font-bold text-white mt-0.5">28–36 DMG</div>
                </div>
              </div>
              <div className="text-[11px] font-mono-num text-emerald-300 pt-0.5">
                Estus Kits restore +35 HP · Fog Gate Transitions restore +30 HP
              </div>
            </div>
          </div>

          {/* 4 Hero Classes & Passives Guide */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-souls text-sm font-bold text-stone-100 tracking-wider">
                COMBAT FRAMES · PASSIVES &amp; [E] SKILLS
              </h3>
              <span className="text-[11px] font-mono-num text-stone-400">
                You can test all 4 classes live inside the Training Arena
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
            Practice slicing, dashing, switching frames, and surviving damage tiers with zero death penalty.
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
              <span>LAUNCH TRAINING ARENA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
