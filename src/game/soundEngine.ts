import { BossType, StageKey } from './types';

const MENU_MUSIC_URL = './assets/aistudio/music-for-a-defeated-kingdom-valor-is-dead_2QD3KK3E_713e37c4.mp3';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterComp: DynamicsCompressorNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbSend: GainNode | null = null;

  private musicVolume = 0.65;
  private sfxVolume = 0.85;
  private muted = false;

  private menuAudio: HTMLAudioElement | null = null;
  private menuMusicActive = false;

  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private currentTrack: 'none' | 'iron' | 'mechaBoss' | 'void' | 'voidBoss' | 'oni' | 'oniBoss' | 'eclipseBoss' = 'none';
  private phase2Intensity = false;
  private lastBossShootAt = 0;
  private lastVoiceAt = 0;
  private introGain: GainNode | null = null;
  private introTimers: number[] = [];

  private createCathedralImpulse(ctx: AudioContext, seconds = 2.4, decay = 2.5): AudioBuffer {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const impulse = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const env = Math.pow(1 - i / len, decay);
        const white = Math.random() * 2 - 1;
        lp = lp * 0.72 + white * 0.28;
        data[i] = lp * env;
      }
    }
    return impulse;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterComp = this.ctx.createDynamicsCompressor();
      this.masterComp.threshold.value = -14;
      this.masterComp.knee.value = 18;
      this.masterComp.ratio.value = 6;
      this.masterComp.attack.value = 0.004;
      this.masterComp.release.value = 0.2;
      this.masterComp.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.gain.value = this.muted ? 0 : this.musicVolume * 0.3;
      this.sfxGain.gain.value = this.muted ? 0 : this.sfxVolume * 0.58;

      this.reverbNode = this.ctx.createConvolver();
      this.reverbNode.buffer = this.createCathedralImpulse(this.ctx, 2.4, 2.4);

      this.reverbSend = this.ctx.createGain();
      this.reverbSend.gain.value = 0.44;

      this.musicGain.connect(this.masterComp);
      this.sfxGain.connect(this.masterComp);
      this.sfxGain.connect(this.reverbSend);
      this.musicGain.connect(this.reverbSend);
      this.reverbSend.connect(this.reverbNode);
      this.reverbNode.connect(this.masterComp);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private syncMenuAudioState() {
    if (!this.menuAudio) return;
    this.menuAudio.muted = this.muted;
    this.menuAudio.volume = this.muted ? 0 : Math.max(0, Math.min(1, this.musicVolume * 0.72));
  }

  public unlock() {
    this.ensureContext();
    if (this.menuMusicActive && this.menuAudio && this.menuAudio.paused) {
      this.syncMenuAudioState();
      this.menuAudio.play().catch(() => {});
    }
  }

  public playMenuMusic() {
    if (typeof window === 'undefined') return;
    this.menuMusicActive = true;
    if (!this.menuAudio) {
      const audio = new Audio(MENU_MUSIC_URL);
      audio.loop = true;
      audio.preload = 'auto';
      this.menuAudio = audio;
    }
    this.syncMenuAudioState();
    if (this.menuAudio.paused) {
      this.menuAudio.play().catch(() => {
        // Browser autoplay blocked until first user interaction; unlock() will start it.
      });
    }
  }

  public stopMenuMusic(reset = true) {
    this.menuMusicActive = false;
    if (!this.menuAudio) return;
    this.menuAudio.pause();
    if (reset) {
      try {
        this.menuAudio.currentTime = 0;
      } catch {
        // ignore seek errors before metadata loads
      }
    }
  }

  public setMusicVolume(v: number) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    this.syncMenuAudioState();
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.muted ? 0 : this.musicVolume * 0.3, this.ctx.currentTime, 0.04);
    }
  }

  public setSfxVolume(v: number) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.muted ? 0 : this.sfxVolume * 0.58, this.ctx.currentTime, 0.04);
    }
  }

  public setMuted(m: boolean) {
    this.muted = m;
    this.syncMenuAudioState();
    if (this.ctx && this.musicGain && this.sfxGain) {
      this.musicGain.gain.setTargetAtTime(m ? 0 : this.musicVolume * 0.3, this.ctx.currentTime, 0.04);
      this.sfxGain.gain.setTargetAtTime(m ? 0 : this.sfxVolume * 0.58, this.ctx.currentTime, 0.04);
    }
    if (m && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  public getMusicVolume() {
    return this.musicVolume;
  }
  public getSfxVolume() {
    return this.sfxVolume;
  }
  public isMuted() {
    return this.muted;
  }

  private resolveTargetNode(target: 'sfx' | 'music' | 'intro'): GainNode | null {
    if (target === 'music') return this.musicGain;
    if (target === 'intro') return this.introGain || this.sfxGain;
    return this.sfxGain;
  }

  private tone(
    freq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainLevel = 0.4,
    target: 'sfx' | 'music' | 'intro' = 'sfx',
    delay = 0,
    filterCutoff?: number
  ) {
    const ctx = this.ensureContext();
    const dest = this.resolveTargetNode(target);
    if (!ctx || !dest) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + duration);
    }
    const attack = Math.min(0.025, duration * 0.22);
    g.gain.setValueAtTime(0.0008, t);
    g.gain.linearRampToValueAtTime(gainLevel, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0005, t + duration);

    if (filterCutoff) {
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(filterCutoff, t);
      filt.frequency.exponentialRampToValueAtTime(Math.max(160, filterCutoff * 0.35), t + duration);
      osc.connect(filt);
      filt.connect(g);
    } else {
      osc.connect(g);
    }

    g.connect(dest);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  }

  // Cathedral brass / choir chord voice
  private darkBrass(
    freq: number,
    duration: number,
    gainLevel = 0.22,
    target: 'sfx' | 'music' | 'intro' = 'sfx',
    delay = 0
  ) {
    const ctx = this.ensureContext();
    const dest = this.resolveTargetNode(target);
    if (!ctx || !dest) return;
    const t = ctx.currentTime + delay;

    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(300, t);
    filt.frequency.exponentialRampToValueAtTime(1650, t + Math.min(0.28, duration * 0.35));
    filt.frequency.exponentialRampToValueAtTime(360, t + duration);
    filt.Q.value = 1.9;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(gainLevel, t + Math.min(0.1, duration * 0.25));
    g.gain.exponentialRampToValueAtTime(0.0008, t + duration);

    filt.connect(g);
    g.connect(dest);

    [-7, 0, 7].forEach((cents) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.detune.setValueAtTime(cents, t);
      osc.connect(filt);
      osc.start(t);
      osc.stop(t + duration + 0.04);
    });
  }

  // Formant-filtered Demonic / Robotic Boss Voice Roar
  private formantVoice(baseFreq: number, endFreq: number, duration: number, f1Start: number, f1End: number, f2Start: number, f2End: number, metallic = false) {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    const glottal = ctx.createOscillator();
    glottal.type = metallic ? 'square' : 'sawtooth';
    glottal.frequency.setValueAtTime(baseFreq, t);
    glottal.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), t + duration);

    // Sub-growl layer
    const sub = ctx.createOscillator();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(baseFreq * 0.5, t);
    sub.frequency.exponentialRampToValueAtTime(Math.max(24, endFreq * 0.5), t + duration);

    const bp1 = ctx.createBiquadFilter();
    bp1.type = 'bandpass';
    bp1.Q.value = metallic ? 6.5 : 4.2;
    bp1.frequency.setValueAtTime(f1Start, t);
    bp1.frequency.exponentialRampToValueAtTime(f1End, t + duration);

    const bp2 = ctx.createBiquadFilter();
    bp2.type = 'bandpass';
    bp2.Q.value = metallic ? 7.5 : 5.0;
    bp2.frequency.setValueAtTime(f2Start, t);
    bp2.frequency.exponentialRampToValueAtTime(f2End, t + duration);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.55, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);

    glottal.connect(bp1);
    glottal.connect(bp2);
    sub.connect(bp1);
    bp1.connect(g);
    bp2.connect(g);
    g.connect(this.sfxGain);

    glottal.start(t);
    sub.start(t);
    glottal.stop(t + duration + 0.03);
    sub.stop(t + duration + 0.03);
  }

  private speakBossLine(line: string, bossType: BossType) {
    if (this.muted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const now = performance.now();
    if (now - this.lastVoiceAt < 1800) return;
    this.lastVoiceAt = now;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(line);
      u.volume = Math.min(1, this.sfxVolume * 0.72);
      u.pitch = bossType === 'mecha' ? 0.35 : bossType === 'void' ? 0.5 : bossType === 'eclipse' ? 0.62 : 0.25;
      u.rate = bossType === 'mecha' ? 0.92 : bossType === 'void' ? 0.78 : bossType === 'eclipse' ? 0.8 : 0.84;
      window.speechSynthesis.speak(u);
    } catch {
      // fallback purely to procedural formant voice
    }
  }

  private noise(
    duration: number,
    gainLevel = 0.25,
    cutoff = 600,
    filterType: BiquadFilterType = 'highpass',
    target: 'sfx' | 'music' | 'intro' = 'sfx',
    delay = 0
  ) {
    const ctx = this.ensureContext();
    const dest = this.resolveTargetNode(target);
    if (!ctx || !dest) return;
    const sampleCount = Math.max(64, Math.floor(ctx.sampleRate * duration));
    const buf = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = cutoff;
    if (filterType === 'bandpass') filter.Q.value = 1.6;

    const g = ctx.createGain();
    const t = ctx.currentTime + delay;
    g.gain.setValueAtTime(gainLevel, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + duration);

    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start(t);
  }

  // ── BOSS VOICES & PER-ATTACK SFX ───────────────────────────────────

  public playBossVoiceTelegraph(bossType: BossType, pattern: string, voiceLine?: string) {
    if (bossType === 'mecha') {
      // Cold robotic vocoder command growl
      this.formantVoice(105, 82, 0.42, 420, 780, 1450, 1100, true);
      this.tone(180, 360, 0.24, 'sawtooth', 0.2, 'sfx', 0, 1100);
    } else if (bossType === 'void') {
      // Hollow abyssal phantom incantation
      this.formantVoice(130, 92, 0.55, 340, 620, 1900, 980, false);
      this.noise(0.35, 0.22, 1600, 'bandpass');
    } else if (bossType === 'eclipse') {
      // Celestial twin-choir harmonic resonance (Solar brass + Lunar bell)
      this.formantVoice(146, 110, 0.58, 480, 720, 1520, 1180, false);
      this.darkBrass(146.83, 0.55, 0.24);
      this.tone(880, 1318.5, 0.42, 'sine', 0.18, 'sfx', 0.04);
    } else {
      // Deep demonic Shogun war cry
      this.formantVoice(76, 56, 0.52, 520, 320, 1180, 820, false);
      this.tone(72, 34, 0.35, 'sine', 0.45);
    }

    if (voiceLine) {
      this.speakBossLine(voiceLine, bossType);
    }

    // Attack-specific telegraph anticipation chime
    if (pattern.includes('railgun') || pattern.includes('orbital') || pattern.includes('guillotine')) {
      this.tone(240, 1280, 0.55, 'sawtooth', 0.24, 'sfx', 0.05, 2200);
    } else if (pattern.includes('katana') || pattern.includes('iaijutsu') || pattern.includes('thunder') || pattern.includes('cross_sweep')) {
      this.noise(0.24, 0.28, 3200, 'highpass', 'sfx', 0.04);
      this.tone(1320, 1760, 0.22, 'triangle', 0.2);
    } else if (pattern.includes('rift') || pattern.includes('blink') || pattern.includes('vortex') || pattern.includes('tether') || pattern.includes('beacon')) {
      this.tone(420, 190, 0.45, 'sine', 0.28);
      this.tone(840, 820, 0.38, 'triangle', 0.16, 'sfx', 0.06);
    } else {
      this.playBossTelegraph();
    }
  }

  public playBossAttackExecuteSfx(pattern: string) {
    switch (pattern) {
      case 'twin_railgun':
      case 'orbital_crosshair':
        // High-energy railgun discharge + thunder crack
        this.tone(140, 32, 0.45, 'sine', 0.72);
        this.tone(920, 160, 0.28, 'sawtooth', 0.45, 'sfx', 0, 2400);
        this.noise(0.32, 0.48, 1200, 'bandpass');
        break;
      case 'rotary_spiral':
      case 'pincer_barrage':
        this.tone(220, 88, 0.14, 'sawtooth', 0.26, 'sfx', 0, 950);
        this.noise(0.08, 0.18, 1600, 'bandpass');
        break;
      case 'cannon_spread':
      case 'siege_mortars':
        this.tone(115, 36, 0.3, 'sine', 0.62);
        this.noise(0.24, 0.42, 480, 'lowpass');
        break;
      case 'forge_laser_grid':
        this.darkBrass(110.0, 0.42, 0.24);
        this.tone(720, 280, 0.22, 'sawtooth', 0.28, 'sfx', 0, 2100);
        this.noise(0.16, 0.24, 1800, 'bandpass');
        break;
      case 'missile_barrage':
        this.noise(0.24, 0.3, 1800, 'bandpass');
        this.tone(320, 580, 0.18, 'sawtooth', 0.22, 'sfx', 0, 1400);
        break;
      case 'laser_sweep':
      case 'emp_cross':
        this.darkBrass(146.83, 0.38, 0.22);
        this.tone(540, 220, 0.25, 'sawtooth', 0.26, 'sfx', 0, 1800);
        break;
      case 'void_rifts':
      case 'abyss_blink':
        // Crystalline space tear
        this.noise(0.22, 0.36, 2400, 'highpass');
        this.tone(110, 38, 0.36, 'sine', 0.58);
        this.tone(1240, 620, 0.24, 'triangle', 0.22);
        break;
      case 'tentacle_slash':
      case 'tentacle_slam':
        this.tone(92, 30, 0.42, 'sine', 0.68);
        this.noise(0.28, 0.42, 680, 'bandpass');
        break;
      case 'void_drain':
      case 'gravity_ring':
      case 'void_vortex':
        this.tone(82, 46, 0.45, 'sawtooth', 0.32, 'sfx', 0, 460);
        this.tone(440, 220, 0.32, 'sine', 0.22);
        break;
      case 'wall':
      case 'clone':
      case 'sniper':
      case 'spectral_cross':
        this.tone(587.33, 293.66, 0.22, 'triangle', 0.24);
        this.noise(0.14, 0.24, 1500, 'bandpass');
        break;
      case 'iaijutsu_cut':
      case 'thunder_step':
        this.noise(0.2, 0.44, 2400, 'bandpass');
        this.tone(980, 260, 0.22, 'sawtooth', 0.36, 'sfx', 0, 2000);
        this.tone(1640, 820, 0.16, 'sine', 0.22);
        break;
      case 'katana_wave':
      case 'eight_gate_lotus':
        this.tone(104, 42, 0.26, 'sine', 0.55);
        this.noise(0.18, 0.32, 1800, 'bandpass');
        break;
      case 'oni_barrage':
      case 'spirit_bomb':
      case 'cursed_zone':
      case 'hellfire_pillars':
        this.tone(95, 34, 0.36, 'sine', 0.62);
        this.noise(0.28, 0.38, 620, 'lowpass');
        break;
      case 'shrine_shatter':
      case 'soul_seal_combo':
        this.darkBrass(98.0, 0.7, 0.28);
        this.tone(523.25, 515.0, 0.75, 'sine', 0.22, 'sfx', 0.04);
        break;
      case 'twin_beacons':
      case 'twin_pylons':
        this.darkBrass(146.83, 0.6, 0.26);
        this.tone(783.99, 1174.66, 0.35, 'sine', 0.22, 'sfx', 0.03);
        break;
      case 'eclipse_tether':
      case 'eclipse_convergence':
        this.darkBrass(110.0, 0.65, 0.3);
        this.tone(110, 36, 0.55, 'sine', 0.68);
        this.tone(1046.5, 523.25, 0.38, 'triangle', 0.2);
        break;
      case 'celestial_guillotine':
      case 'eclipse_cross_sweep':
        this.noise(0.24, 0.42, 2600, 'bandpass');
        this.tone(1180, 310, 0.28, 'sawtooth', 0.34, 'sfx', 0, 2200);
        break;
      case 'starfall_meteors':
      case 'eclipse_nova':
      case 'solar_lunar_nova':
        this.tone(130, 42, 0.32, 'sine', 0.56);
        this.tone(659.25, 880, 0.22, 'triangle', 0.2);
        this.noise(0.16, 0.28, 1200, 'bandpass');
        break;
      case 'eclipse_prison':
        this.darkBrass(98.0, 0.55, 0.28);
        this.tone(622.25, 311.13, 0.4, 'triangle', 0.24);
        break;
      case 'eclipse_prism_beam':
        this.darkBrass(130.81, 0.65, 0.3);
        this.tone(880, 1760, 0.45, 'sawtooth', 0.24, 'sfx', 0, 2400);
        break;
      case 'coop_punishment':
        this.darkBrass(65.41, 0.95, 0.38);
        this.tone(185, 52, 0.55, 'sawtooth', 0.42, 'sfx', 0, 1400);
        this.tone(92, 34, 0.65, 'sine', 0.65);
        this.noise(0.38, 0.48, 900, 'bandpass');
        break;
      default:
        this.playBossShoot();
    }
  }

  // ── CORE COMBAT SFX ───────────────────────────────────────────────

  public playUiClick() {
    this.tone(180, 95, 0.06, 'triangle', 0.28);
    this.noise(0.04, 0.14, 1400, 'bandpass');
  }

  public playDash() {
    this.noise(0.18, 0.36, 750, 'bandpass');
    this.tone(140, 48, 0.16, 'sine', 0.38);
  }

  public playLanding() {
    this.tone(110, 34, 0.34, 'sine', 0.65);
    this.tone(180, 52, 0.25, 'triangle', 0.45);
    this.noise(0.24, 0.38, 320, 'lowpass');
  }

  public playBladePickup() {
    this.noise(0.16, 0.26, 2600, 'highpass');
    this.tone(880, 1320, 0.14, 'triangle', 0.26, 'sfx', 0, 2200);
    this.tone(1760, 1740, 0.24, 'sine', 0.18, 'sfx', 0.03);
  }

  public playSlash(combo = 1) {
    const boost = Math.min(1.35, 1 + (combo - 1) * 0.045);
    this.tone(165 * boost, 45, 0.2, 'sawtooth', 0.48, 'sfx', 0, 1100);
    this.noise(0.16, 0.42, 1400, 'bandpass');
    this.tone(1180 * boost, 640 * boost, 0.14, 'triangle', 0.22, 'sfx', 0.02);
  }

  public playGraze() {
    this.noise(0.08, 0.18, 2200, 'bandpass');
    this.tone(980, 1480, 0.12, 'sine', 0.22);
  }

  public playParry() {
    this.tone(130, 48, 0.38, 'sine', 0.65);
    this.tone(660, 620, 0.42, 'triangle', 0.36);
    this.tone(1318, 1290, 0.48, 'sine', 0.28, 'sfx', 0.01);
    this.noise(0.18, 0.38, 1900, 'bandpass');
  }

  public playCoopResonance() {
    this.tone(110, 44, 0.55, 'sine', 0.72);
    this.darkBrass(196.0, 0.65, 0.28);
    this.tone(523.25, 783.99, 0.42, 'triangle', 0.26, 'sfx', 0.02);
    this.tone(1046.5, 1567.98, 0.52, 'sine', 0.24, 'sfx', 0.06);
  }

  public playPlayerHit() {
    this.tone(135, 36, 0.36, 'sawtooth', 0.65, 'sfx', 0, 620);
    this.tone(72, 28, 0.42, 'sine', 0.65);
    this.noise(0.28, 0.48, 520, 'lowpass');
  }

  public playEnemySpawn() {
    this.darkBrass(110, 0.35, 0.16);
    this.noise(0.22, 0.18, 450, 'bandpass');
  }

  public playArmorClang() {
    this.tone(860, 310, 0.14, 'triangle', 0.28);
    this.tone(1720, 1280, 0.12, 'sine', 0.22);
    this.noise(0.08, 0.2, 2600, 'highpass');
  }

  public playPostureUnlock() {
    this.tone(523.25, 1046.5, 0.26, 'triangle', 0.26);
    this.tone(1567.98, 1567.98, 0.24, 'sine', 0.2, 'sfx', 0.04);
    this.darkBrass(146.83, 0.35, 0.18);
  }

  public playBossEntry() {
    this.tone(62, 34, 1.15, 'sine', 0.7);
    this.darkBrass(73.42, 1.2, 0.34, 'sfx', 0.02);
    this.darkBrass(110.0, 1.2, 0.26, 'sfx', 0.06);
    this.formantVoice(72, 54, 0.75, 420, 260, 1100, 750, false);
    this.noise(0.85, 0.32, 340, 'lowpass');
  }

  public stopBossIntroAudio() {
    this.introTimers.forEach((id) => window.clearTimeout(id));
    this.introTimers = [];
    if (this.introGain && this.ctx) {
      try {
        this.introGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.02);
        this.introGain.disconnect();
      } catch {
        // ignore disconnect errors
      }
      this.introGain = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  public playBossCinematicIntro(bossType: BossType, quote?: string) {
    this.stopBossIntroAudio();
    const ctx = this.ensureContext();
    if (ctx && this.sfxGain) {
      this.introGain = ctx.createGain();
      this.introGain.gain.value = 1.0;
      this.introGain.connect(this.sfxGain);
    }

    if (bossType === 'mecha') {
      // MECHA: Cold tactical sonar pings -> hydraulic turbine spool-up -> orbital drop impact -> dreadnought brass
      this.noise(1.8, 0.14, 900, 'bandpass', 'intro', 0);
      [0.08, 0.58, 1.02, 1.42, 1.78, 2.1, 2.38].forEach((d, idx) => {
        this.tone(880 + idx * 90, 440 + idx * 40, 0.14, 'square', 0.14, 'intro', d, 1900);
      });
      this.tone(110, 680, 2.1, 'sawtooth', 0.24, 'intro', 0.75, 1600);
      // 2.9s: Orbital drop-pod missile screech & crater anvil impact
      this.tone(1600, 140, 0.55, 'sawtooth', 0.22, 'intro', 2.65, 2200);
      this.tone(96, 24, 1.05, 'sine', 0.76, 'intro', 3.05);
      this.noise(0.85, 0.44, 780, 'bandpass', 'intro', 3.05);
      this.tone(1420, 460, 0.5, 'triangle', 0.24, 'intro', 3.1);
      // Act III (4.2s): Mechanical Dreadnought Brass Fanfare
      this.darkBrass(73.42, 3.0, 0.34, 'intro', 4.15);
      this.darkBrass(110.0, 2.9, 0.26, 'intro', 4.22);
      this.darkBrass(138.59, 2.7, 0.2, 'intro', 4.32);
      this.tone(1760, 1740, 0.75, 'sine', 0.15, 'intro', 4.25);
    } else if (bossType === 'void') {
      // VOID: Eerie gravity vacuum swell -> haunting descending glass chimes -> silent snap -> dimensional shatter
      this.tone(32, 118, 2.6, 'sine', 0.56, 'intro', 0);
      [0.2, 0.75, 1.3, 1.85, 2.35].forEach((d, idx) => {
        const f = 1980 - idx * 280;
        this.tone(f, f * 0.42, 0.48, 'sine', 0.18, 'intro', d);
        this.tone(f * 1.498, f * 0.74, 0.36, 'triangle', 0.1, 'intro', d + 0.04);
      });
      // Brief 0.25s breath before dimensional shatter at 3.25s
      this.tone(64, 22, 1.25, 'sine', 0.76, 'intro', 3.25);
      this.noise(1.2, 0.42, 2200, 'bandpass', 'intro', 3.25);
      this.tone(2600, 290, 0.75, 'sawtooth', 0.24, 'intro', 3.27, 2100);
      // Act III (4.3s): Abyssal Tritone Sovereign Choir
      this.darkBrass(65.41, 3.0, 0.34, 'intro', 4.3);
      this.darkBrass(92.5, 2.9, 0.26, 'intro', 4.38);
      this.darkBrass(130.81, 2.7, 0.22, 'intro', 4.46);
      this.tone(1174.66, 1140, 1.1, 'sine', 0.15, 'intro', 4.42);
    } else if (bossType === 'oni') {
      // ONI: 8 Ceremonial Taiko War Drums igniting -> shakuhachi bend -> giant X-katana cleave -> Shogun horns
      [0.12, 0.55, 0.96, 1.34, 1.7, 2.02, 2.32, 2.6].forEach((d, idx) => {
        this.tone(82 + idx * 6, 28, 0.34, 'sine', 0.66, 'intro', d);
        this.noise(0.14, 0.28, 420, 'lowpass', 'intro', d);
      });
      // Shakuhachi / war flute ominous slide
      this.tone(440, 587.33, 1.2, 'triangle', 0.16, 'intro', 1.45, 1300);
      // 3.05s: Screen-wide Razor Katana Cross-Cleave
      this.noise(0.42, 0.48, 3600, 'highpass', 'intro', 3.02);
      this.tone(2850, 1420, 0.58, 'sine', 0.3, 'intro', 3.04);
      this.tone(92, 26, 1.0, 'sine', 0.74, 'intro', 3.12);
      // Act III (4.25s): Demon Shogun War Horns
      this.darkBrass(73.42, 3.0, 0.36, 'intro', 4.25);
      this.darkBrass(87.31, 2.9, 0.28, 'intro', 4.32);
      this.darkBrass(146.83, 2.7, 0.24, 'intro', 4.4);
      this.tone(84, 28, 0.6, 'sine', 0.6, 'intro', 4.28);
    } else {
      // ECLIPSE: Dual Solaris (low gold) & Lunaris (high crystal) bells weaving -> cosmic collision gong -> twin choir
      const solarNotes = [220.0, 261.63, 293.66, 349.23, 440.0, 523.25];
      const lunarNotes = [880.0, 783.99, 659.25, 587.33, 659.25, 880.0];
      solarNotes.forEach((f, idx) => {
        this.tone(f, f * 1.004, 0.7, 'triangle', 0.18, 'intro', idx * 0.44);
        this.tone(lunarNotes[idx], lunarNotes[idx] * 0.996, 0.7, 'sine', 0.16, 'intro', idx * 0.44 + 0.14);
      });
      // 3.2s: Total Eclipse Solar-Lunar Collision Gong
      this.tone(88, 24, 1.35, 'sine', 0.76, 'intro', 3.18);
      this.darkBrass(146.83, 1.45, 0.34, 'intro', 3.2);
      this.tone(1174.66, 1164, 1.4, 'sine', 0.24, 'intro', 3.22);
      this.tone(1760.0, 1752, 1.2, 'sine', 0.16, 'intro', 3.26);
      // Act III (4.4s): Grand Cathedral Twin-Sovereign Symphony
      this.darkBrass(73.42, 3.0, 0.36, 'intro', 4.4);
      this.darkBrass(110.0, 2.9, 0.28, 'intro', 4.46);
      this.darkBrass(146.83, 2.8, 0.26, 'intro', 4.52);
      this.darkBrass(220.0, 2.6, 0.2, 'intro', 4.6);
      this.tone(880, 875, 1.7, 'sine', 0.18, 'intro', 4.55);
    }

    // Villain roar + spoken line timed with Act II/III manifestation
    const roarTimer = window.setTimeout(() => {
      if (this.muted) return;
      if (bossType === 'mecha') this.formantVoice(98, 72, 0.9, 400, 780, 1480, 1060, true);
      else if (bossType === 'void') this.formantVoice(124, 82, 0.95, 320, 640, 1880, 920, false);
      else if (bossType === 'oni') this.formantVoice(68, 50, 1.0, 500, 290, 1140, 760, false);
      else this.formantVoice(140, 106, 1.0, 460, 720, 1540, 1180, false);
      if (quote) this.speakBossLine(quote, bossType);
    }, 3250);
    this.introTimers.push(roarTimer);
  }

  public playBossTelegraph() {
    this.tone(110, 82, 0.32, 'sawtooth', 0.28, 'sfx', 0, 750);
    this.tone(740, 725, 0.35, 'sine', 0.24, 'sfx', 0.04);
    this.tone(1108, 1085, 0.35, 'triangle', 0.16, 'sfx', 0.06);
  }

  public playBossShoot() {
    const now = performance.now();
    if (now - this.lastBossShootAt < 42) return;
    this.lastBossShootAt = now;
    this.tone(260, 95, 0.11, 'triangle', 0.18, 'sfx', 0, 900);
    this.noise(0.06, 0.1, 1200, 'bandpass');
  }

  public playBossDamaged() {
    this.tone(125, 34, 0.32, 'sine', 0.7);
    this.tone(240, 68, 0.26, 'sawtooth', 0.45, 'sfx', 0, 1200);
    this.tone(920, 440, 0.2, 'triangle', 0.24, 'sfx', 0.02);
    this.noise(0.22, 0.45, 950, 'bandpass');
  }

  public playBossWeakened() {
    this.tone(98, 32, 0.55, 'sine', 0.72);
    this.darkBrass(146.83, 0.55, 0.28);
    this.tone(587.33, 554.37, 0.6, 'sine', 0.24, 'sfx', 0.04);
    this.noise(0.32, 0.36, 480, 'lowpass');
  }

  public playBossPhase2() {
    this.tone(82, 30, 0.95, 'sine', 0.75);
    this.darkBrass(73.42, 1.15, 0.36, 'sfx', 0.02);
    this.darkBrass(77.78, 1.15, 0.3, 'sfx', 0.06);
    this.formantVoice(68, 92, 0.85, 360, 680, 950, 1450, false);
    this.tone(440, 432, 1.1, 'triangle', 0.26, 'sfx', 0.08);
    this.noise(0.75, 0.44, 650, 'lowpass');
  }

  public playBossDefeated(bossType: BossType = 'mecha') {
    // 1. Final Blow Hit-Stop Cleave & Sub-Drop (0.0s)
    this.tone(110, 26, 0.85, 'sine', 0.78);
    this.noise(0.45, 0.48, 2200, 'bandpass');
    if (bossType === 'mecha') this.formantVoice(100, 42, 0.95, 480, 220, 1300, 520, true);
    else if (bossType === 'void') this.formantVoice(135, 38, 1.05, 520, 190, 1650, 460, false);
    else if (bossType === 'eclipse') this.formantVoice(152, 46, 1.1, 560, 210, 1480, 540, false);
    else this.formantVoice(82, 32, 1.05, 460, 180, 1100, 420, false);

    // 2. Escalating Core Overload Fracture Detonations (0.55s -> 2.15s)
    [0.55, 0.98, 1.38, 1.76, 2.1].forEach((d, idx) => {
      this.tone(140 + idx * 35, 38, 0.28, 'sawtooth', 0.34, 'sfx', d, 1400 + idx * 250);
      this.tone(720 + idx * 180, 320 + idx * 90, 0.2, 'triangle', 0.24, 'sfx', d);
      this.noise(0.22, 0.34, 900 + idx * 280, 'bandpass', 'sfx', d);
    });

    // 3. Final Soul-Shatter Supernova + Triumphant Cathedral Brass Resolution (2.5s)
    this.tone(92, 22, 1.5, 'sine', 0.82, 'sfx', 2.48);
    this.noise(1.35, 0.56, 620, 'lowpass', 'sfx', 2.48);
    this.darkBrass(146.83, 2.0, 0.34, 'sfx', 2.58);
    this.darkBrass(220.0, 2.0, 0.28, 'sfx', 2.66);
    this.darkBrass(293.66, 2.1, 0.28, 'sfx', 2.74);
    this.darkBrass(369.99, 2.2, 0.24, 'sfx', 2.86);
    this.tone(1174.66, 1168, 1.6, 'sine', 0.2, 'sfx', 2.85);
  }

  public playMedkit() {
    this.noise(0.25, 0.2, 1600, 'bandpass');
    this.tone(392, 392, 0.32, 'sine', 0.26);
    this.tone(587.33, 587.33, 0.42, 'triangle', 0.24, 'sfx', 0.08);
  }

  public playRevive() {
    this.darkBrass(220, 0.5, 0.2);
    [440, 554.37, 659.25].forEach((f, idx) => {
      this.tone(f, f, 0.32, 'sine', 0.24, 'sfx', idx * 0.08);
    });
  }

  public playPowerup() {
    this.darkBrass(293.66, 0.35, 0.22);
    this.tone(587.33, 880, 0.22, 'triangle', 0.24, 'sfx', 0.05);
  }

  public playBoonSelect() {
    this.darkBrass(146.83, 0.75, 0.26);
    this.darkBrass(220.0, 0.75, 0.2, 'sfx', 0.05);
    this.tone(880, 875, 0.55, 'sine', 0.22, 'sfx', 0.08);
  }

  public playCrescentWave() {
    this.noise(0.22, 0.34, 1500, 'bandpass');
    this.tone(320, 95, 0.28, 'sawtooth', 0.36, 'sfx', 0, 1400);
    this.tone(880, 440, 0.26, 'sine', 0.26, 'sfx', 0.02);
  }

  public playCloak() {
    this.noise(0.3, 0.26, 900, 'bandpass');
    this.tone(180, 64, 0.34, 'sine', 0.35);
  }

  public playShockwave() {
    this.tone(110, 28, 0.48, 'sine', 0.72);
    this.darkBrass(146.83, 0.45, 0.28);
    this.noise(0.36, 0.46, 520, 'lowpass');
  }

  public playSurge() {
    this.tone(220, 660, 0.28, 'sawtooth', 0.32, 'sfx', 0, 1800);
    this.tone(880, 1320, 0.26, 'triangle', 0.24, 'sfx', 0.04);
    this.noise(0.2, 0.28, 2200, 'bandpass');
  }

  public playVictory() {
    this.tone(73.42, 73.42, 1.5, 'sine', 0.5);
    this.darkBrass(146.83, 1.5, 0.28, 'sfx', 0.05);
    this.darkBrass(220.0, 1.4, 0.24, 'sfx', 0.25);
    this.darkBrass(293.66, 1.5, 0.24, 'sfx', 0.5);
    this.darkBrass(369.99, 1.8, 0.28, 'sfx', 0.8);
  }

  public playLose() {
    this.tone(68, 42, 1.6, 'sine', 0.68);
    this.darkBrass(110, 1.5, 0.32, 'sfx', 0.04);
    this.darkBrass(103.83, 1.6, 0.28, 'sfx', 0.35);
    this.tone(293.66, 277.18, 1.5, 'sine', 0.2, 'sfx', 0.08);
    this.noise(0.65, 0.25, 280, 'lowpass');
  }

  // ── EPIC ORCHESTRAL DARK SOULS SOUNDTRACK ──────────────────────────

  public setMusicTrack(stage: StageKey | 'none', isPhase2 = false) {
    let track: SoundEngine['currentTrack'] = 'none';
    if (stage === 'ironDungeon') track = 'iron';
    else if (stage === 'mechaBoss') track = 'mechaBoss';
    else if (stage === 'voidDungeon') track = 'void';
    else if (stage === 'voidBoss') track = 'voidBoss';
    else if (stage === 'oniDungeon') track = 'oni';
    else if (stage === 'oniBoss') track = 'oniBoss';
    else if (stage === 'eclipseBoss') track = 'eclipseBoss';

    if (track === this.currentTrack && isPhase2 === this.phase2Intensity) return;
    this.currentTrack = track;
    this.phase2Intensity = isPhase2;
    this.stopMusicLoop();
    if (track !== 'none') {
      this.startMusicLoop();
    }
  }

  public stopMusic() {
    this.currentTrack = 'none';
    this.stopMusicLoop();
  }

  private stopMusicLoop() {
    if (this.bgmTimer !== null) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private startMusicLoop() {
    this.bgmStep = 0;
    const tempoMs =
      this.currentTrack === 'mechaBoss'
        ? this.phase2Intensity
          ? 135
          : 158
        : this.currentTrack === 'voidBoss'
        ? this.phase2Intensity
          ? 130
          : 152
        : this.currentTrack === 'oniBoss'
        ? this.phase2Intensity
          ? 125
          : 148
        : this.currentTrack === 'eclipseBoss'
        ? this.phase2Intensity
          ? 118
          : 138
        : 185;

    this.bgmTimer = window.setInterval(() => {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
      const step = this.bgmStep % 16;
      const bar = Math.floor(this.bgmStep / 16) % 4;
      this.bgmStep++;

      if (this.currentTrack === 'iron' || this.currentTrack === 'mechaBoss') {
        // Gothic D-Minor Orchestral Brass + Driving String Ostinato + War Timpani
        const progression = [73.42, 58.27, 65.41, 55.0]; // Dm -> Bb -> C -> A
        const root = progression[bar];
        if (step === 0) {
          this.darkBrass(root, 2.2, 0.22, 'music');
          this.darkBrass(root * 1.5, 2.2, 0.16, 'music');
          if (this.phase2Intensity) this.darkBrass(root * 2, 2.0, 0.14, 'music');
        }
        // Driving orchestral string ostinato
        if (this.currentTrack === 'mechaBoss') {
          const ostinato = [root * 2, root * 3, root * 2, root * 3, root * 2.4, root * 3, root * 2, root * 3];
          this.tone(ostinato[step % ostinato.length], ostinato[step % ostinato.length], 0.14, 'sawtooth', 0.11, 'music', 0, 1050);
          if (step % 4 === 0 && (bar === 1 || bar === 3)) {
            const choir = [293.66, 349.23, 329.63, 277.18];
            this.darkBrass(choir[bar], 0.85, 0.15, 'music');
          }
        }
        // Timpani + iron anvil
        if (step % 4 === 0 || (this.phase2Intensity && (step === 6 || step === 14))) {
          this.tone(78, 32, 0.24, 'sine', 0.5, 'music');
          this.noise(0.08, 0.15, 360, 'lowpass', 'music');
        }
      } else if (this.currentTrack === 'void' || this.currentTrack === 'voidBoss') {
        // Tragic Abyss Watchers / Pontiff style minor choir + bell arpeggio
        const roots = [65.41, 61.74, 58.27, 55.0]; // C -> Bdim -> Bb -> A
        const root = roots[bar];
        if (step === 0) {
          this.darkBrass(root, 2.3, 0.22, 'music');
          this.darkBrass(root * 1.5, 2.1, 0.15, 'music');
        }
        const arp = [261.63, 311.13, 392.0, 466.16, 392.0, 311.13, 246.94, 311.13];
        const n = arp[step % arp.length] * (this.phase2Intensity ? 1.122 : 1);
        this.tone(n, n * 0.995, 0.28, 'sine', 0.18, 'music');
        if (this.currentTrack === 'voidBoss') {
          if (step % 2 === 0) {
            this.tone(root * 2, root * 2, 0.15, 'triangle', 0.15, 'music', 0, 900);
          }
          if (step % 4 === 0 || (this.phase2Intensity && step % 4 === 3)) {
            this.tone(70, 30, 0.24, 'sine', 0.46, 'music');
          }
        }
      } else if (this.currentTrack === 'oni' || this.currentTrack === 'oniBoss') {
        // Thunderous Oni Sanctum Taiko + Hirajoshi Choir & Koto
        const roots = [73.42, 73.42, 58.27, 65.41];
        const root = roots[bar];
        if (step === 0) {
          this.darkBrass(root, 2.1, 0.24, 'music');
          this.darkBrass(root * 1.5, 2.0, 0.18, 'music');
        }
        if (step % 4 === 0 || step === 10 || (this.phase2Intensity && step % 2 === 0)) {
          this.tone(88, 34, 0.24, 'sine', step % 4 === 0 ? 0.56 : 0.34, 'music');
          this.noise(0.08, 0.2, 440, 'lowpass', 'music');
        }
        const koto = [293.66, 311.13, 392.0, 440.0, 466.16, 587.33, 466.16, 392.0];
        if (step % 2 === 0 || this.phase2Intensity) {
          const n = koto[step % koto.length];
          this.tone(n, n * 0.992, 0.2, 'sawtooth', 0.12, 'music', 0, 1450);
        }
      } else if (this.currentTrack === 'eclipseBoss') {
        // Grand Gwyn / Twin Princes style tragic liturgical choir, celestial chimes & organ brass
        const roots = [73.42, 65.41, 58.27, 55.0]; // Dm -> C -> Bb -> A
        const root = roots[bar];
        if (step === 0) {
          this.darkBrass(root, 2.2, 0.25, 'music');
          this.darkBrass(root * 1.5, 2.2, 0.19, 'music');
          this.darkBrass(root * 2, 2.0, 0.14, 'music');
        }
        if (step === 8) {
          this.darkBrass(root * 1.25, 1.3, 0.16, 'music');
        }
        // Celestial Twin Choir chimes (Solar & Lunar arpeggio)
        const choirNotes = [293.66, 349.23, 440.0, 523.25, 587.33, 523.25, 440.0, 349.23];
        const bell = choirNotes[step % choirNotes.length] * (this.phase2Intensity ? 1.122 : 1);
        if (step % 2 === 0 || this.phase2Intensity) {
          this.tone(bell, bell * 0.996, 0.26, 'sine', 0.19, 'music');
        }
        // Orchestral driving strings & war timpani
        if (step % 4 === 0 || (this.phase2Intensity && (step === 2 || step === 10 || step === 14))) {
          this.tone(76, 30, 0.26, 'sine', step % 4 === 0 ? 0.56 : 0.36, 'music');
          this.noise(0.08, 0.18, 420, 'lowpass', 'music');
        }
      }
    }, tempoMs);
  }

  public getBossMusicStage(bossType: BossType): StageKey {
    if (bossType === 'mecha') return 'mechaBoss';
    if (bossType === 'void') return 'voidBoss';
    if (bossType === 'eclipse') return 'eclipseBoss';
    return 'oniBoss';
  }
}

export const soundEngine = new SoundEngine();
