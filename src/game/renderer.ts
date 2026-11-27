import { GameRuntime, getBossVariantDef, getTentacleSegments } from './engine';
import { CANVAS_HEIGHT, CANVAS_WIDTH, Enemy, getGateHallwayBounds, Player, PlayerId, WEAPONS_CATALOG } from './types';

// Offscreen caches to eliminate per-frame shadowBlur and radial gradient allocations
const bgCache = new Map<string, HTMLCanvasElement>();
const bulletCache = new Map<string, HTMLCanvasElement>();

function getArenaBgCanvas(realm: 'iron' | 'void' | 'oni' | 'eclipse', width: number, height: number): HTMLCanvasElement {
  const key = `${realm}_${width}x${height}`;
  const existing = bgCache.get(key);
  if (existing) return existing;

  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  const octx = off.getContext('2d');
  if (octx) {
    const cx = width / 2;
    const cy = height / 2;
    const outerR = Math.hypot(width, height) * 0.55;
    const bg = octx.createRadialGradient(cx, cy, 0, cx, cy, outerR);
    if (realm === 'eclipse') {
      bg.addColorStop(0, '#14102b');
      bg.addColorStop(0.55, '#090717');
      bg.addColorStop(1, '#020206');
    } else if (realm === 'oni') {
      bg.addColorStop(0, '#240804');
      bg.addColorStop(0.55, '#110302');
      bg.addColorStop(1, '#040101');
    } else if (realm === 'void') {
      bg.addColorStop(0, '#1e063b');
      bg.addColorStop(0.55, '#0f0221');
      bg.addColorStop(1, '#04000a');
    } else {
      bg.addColorStop(0, '#0a1929');
      bg.addColorStop(0.55, '#050d17');
      bg.addColorStop(1, '#020408');
    }
    octx.fillStyle = bg;
    octx.fillRect(0, 0, width, height);

    // Subtle dark steel vignette border
    const vig = octx.createRadialGradient(
      cx,
      cy,
      Math.min(width, height) * 0.32,
      cx,
      cy,
      outerR * 0.95
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.64)');
    octx.fillStyle = vig;
    octx.fillRect(0, 0, width, height);

    // Center Arena Ritual / Tactical Rings
    octx.strokeStyle =
      realm === 'eclipse'
        ? 'rgba(251, 191, 36, 0.14)'
        : realm === 'oni'
        ? 'rgba(239, 68, 68, 0.14)'
        : realm === 'void'
        ? 'rgba(168, 85, 247, 0.14)'
        : 'rgba(56, 189, 248, 0.12)';
    octx.lineWidth = 2;
    octx.beginPath();
    octx.arc(cx, cy, 140, 0, Math.PI * 2);
    octx.stroke();
    if (realm === 'eclipse') {
      octx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    }
    octx.beginPath();
    octx.arc(cx, cy, 180, 0, Math.PI * 2);
    octx.stroke();

    if (width > 900) {
      octx.beginPath();
      octx.arc(cx, cy, 340, 0, Math.PI * 2);
      octx.stroke();
      octx.beginPath();
      octx.arc(cx, cy, 460, 0, Math.PI * 2);
      octx.stroke();
    }

    // Diagonal tactical crosshairs
    octx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
    octx.lineWidth = 1;
    octx.beginPath();
    octx.moveTo(0, 0);
    octx.lineTo(width, height);
    octx.moveTo(width, 0);
    octx.lineTo(0, height);
    octx.stroke();
  }

  bgCache.set(key, off);
  return off;
}

function getBulletSprite(
  shape: 'orb' | 'shard' | 'ember' | 'missile' | 'lance',
  color: string,
  size: number
): HTMLCanvasElement {
  const s = Math.max(8, Math.round(size));
  const key = `${shape}_${color}_${s}`;
  const cached = bulletCache.get(key);
  if (cached) return cached;

  const pad = Math.ceil(s * 0.72);
  const dim = s + pad * 2;
  const off = document.createElement('canvas');
  off.width = dim;
  off.height = dim;
  const octx = off.getContext('2d');
  if (octx) {
    const cx = dim / 2;
    const cy = dim / 2;
    const r = s / 2;

    // Soft outer halo (pre-rendered once — zero runtime gradient/shadow cost!)
    const halo = octx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r + pad);
    halo.addColorStop(0, color);
    halo.addColorStop(0.5, `${color}55`);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    octx.fillStyle = halo;
    octx.beginPath();
    octx.arc(cx, cy, r + pad, 0, Math.PI * 2);
    octx.fill();

    if (shape === 'shard') {
      // Razor 4-point Void Crystal Shard
      octx.fillStyle = '#090314';
      octx.strokeStyle = color;
      octx.lineWidth = 2;
      octx.beginPath();
      octx.moveTo(cx + r * 1.35, cy);
      octx.lineTo(cx, cy - r * 0.72);
      octx.lineTo(cx - r * 1.15, cy);
      octx.lineTo(cx, cy + r * 0.72);
      octx.closePath();
      octx.fill();
      octx.stroke();

      octx.fillStyle = '#ffffff';
      octx.beginPath();
      octx.moveTo(cx + r * 0.75, cy);
      octx.lineTo(cx, cy - r * 0.32);
      octx.lineTo(cx - r * 0.55, cy);
      octx.lineTo(cx, cy + r * 0.32);
      octx.closePath();
      octx.fill();
    } else if (shape === 'ember') {
      // Jagged 8-point Hellfire Ember
      octx.fillStyle = color;
      octx.beginPath();
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2;
        const rad = i % 2 === 0 ? r * 1.18 : r * 0.62;
        const px = cx + Math.cos(ang) * rad;
        const py = cy + Math.sin(ang) * rad;
        if (i === 0) octx.moveTo(px, py);
        else octx.lineTo(px, py);
      }
      octx.closePath();
      octx.fill();

      octx.fillStyle = '#fef08a';
      octx.beginPath();
      octx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
      octx.fill();
    } else if (shape === 'missile') {
      // Directional Armored Seeker Warhead (pointing +X)
      octx.fillStyle = '#f97316';
      octx.beginPath();
      octx.moveTo(cx - r * 0.65, cy - r * 0.38);
      octx.lineTo(cx - r * 1.45, cy);
      octx.lineTo(cx - r * 0.65, cy + r * 0.38);
      octx.closePath();
      octx.fill();

      octx.fillStyle = '#0f172a';
      octx.strokeStyle = color;
      octx.lineWidth = 2;
      octx.beginPath();
      octx.moveTo(cx + r * 1.25, cy);
      octx.lineTo(cx + r * 0.15, cy - r * 0.55);
      octx.lineTo(cx - r * 0.8, cy - r * 0.45);
      octx.lineTo(cx - r * 0.8, cy + r * 0.45);
      octx.lineTo(cx + r * 0.15, cy + r * 0.55);
      octx.closePath();
      octx.fill();
      octx.stroke();

      octx.fillStyle = '#ffffff';
      octx.beginPath();
      octx.arc(cx + r * 0.3, cy, r * 0.25, 0, Math.PI * 2);
      octx.fill();
    } else if (shape === 'lance') {
      // Sleek Piercing Spear / Railgun Bolt (pointing +X)
      octx.fillStyle = color;
      octx.beginPath();
      octx.moveTo(cx + r * 1.5, cy);
      octx.lineTo(cx - r * 0.2, cy - r * 0.45);
      octx.lineTo(cx - r * 1.35, cy);
      octx.lineTo(cx - r * 0.2, cy + r * 0.45);
      octx.closePath();
      octx.fill();

      octx.fillStyle = '#ffffff';
      octx.beginPath();
      octx.moveTo(cx + r * 1.0, cy);
      octx.lineTo(cx - r * 0.1, cy - r * 0.2);
      octx.lineTo(cx - r * 0.85, cy);
      octx.lineTo(cx - r * 0.1, cy + r * 0.2);
      octx.closePath();
      octx.fill();
    } else {
      // Sharp armored plasma orb
      octx.fillStyle = '#090d16';
      octx.beginPath();
      octx.arc(cx, cy, r * 1.05, 0, Math.PI * 2);
      octx.fill();

      octx.fillStyle = color;
      octx.beginPath();
      octx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
      octx.fill();

      octx.fillStyle = '#ffffff';
      octx.beginPath();
      octx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
      octx.fill();
    }
  }

  bulletCache.set(key, off);
  return off;
}

function drawHeroSprite(ctx: CanvasRenderingContext2D, p: Player, now: number) {
  if (p.state === 'spectator') return;
  const cx = p.x + p.size / 2;
  const cy = p.y + p.size / 2;
  const r = p.size / 2;

  ctx.save();
  if (p.state === 'down') {
    ctx.globalAlpha = 0.38;
  } else if (p.cloakTimer > 0) {
    ctx.globalAlpha = 0.42 + Math.sin(now / 45) * 0.15;
  } else if (p.invulnerable || p.postDashInvulnerability > 0 || p.invulnFrames > 0) {
    ctx.globalAlpha = 0.48 + Math.abs(Math.sin(now / 85)) * 0.52;
  }

  // Overdrive lightning ring
  if (p.overdriveTimer > 0 && p.state === 'alive') {
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 8 + Math.sin(now / 55) * 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Shadow Cloak ring
  if (p.cloakTimer > 0 && p.state === 'alive') {
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, r + 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Aegis Shield hex barrier
  if (p.hasShield && p.state === 'alive') {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.88)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + now / 1200;
      const hx = cx + Math.cos(a) * (r + 9);
      const hy = cy + Math.sin(a) * (r + 9);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Active Skill Buff Auras (Whirlwind, Fortify, Bloodlust, Shield Charge)
  if (p.state === 'alive') {
    if (p.whirlwindTimer > 0) {
      const spin = now / 65;
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.85)';
      ctx.lineWidth = 4;
      for (let b = 0; b < 3; b++) {
        const a0 = spin + (b * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 38, a0, a0 + 0.95);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 28, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (p.fortifyTimer > 0) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 13 + Math.sin(now / 120) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (p.bloodlustTimer > 0) {
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let s = 0; s < 8; s++) {
        const a = (s / 8) * Math.PI * 2 + now / 220;
        const innerR = r + 7;
        const outerR = r + 15 + Math.sin(now / 80 + s) * 2;
        ctx.moveTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
        ctx.lineTo(cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR);
      }
      ctx.stroke();
    }
    if (p.chargeTimer > 0) {
      const fa = p.facingAngle;
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 18, fa - 0.85, fa + 0.85);
      ctx.stroke();
      ctx.fill();
    }
    if (p.frontShieldTimer > 0) {
      const fa = p.facingAngle;
      const backA = fa + Math.PI;
      const shieldFrac = Math.max(0, Math.min(1, p.frontShieldTimer / 4.0));
      const coneLen = 228;
      const coneHalf = 0.56;

      // Protective Rear Safe Shadow Cone behind Tank
      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, coneLen, backA - coneHalf, backA + coneHalf);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(125, 211, 252, 0.48)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([7, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Frontal Purifying Greatshield Barrier Wall
      const wallR = r + 42;
      const arcSpan = 1.24;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.34)';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, wallR, fa - arcSpan, fa + arcSpan);
      ctx.stroke();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(cx, cy, wallR, fa - arcSpan, fa + arcSpan);
      ctx.stroke();

      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(cx, cy, wallR + 2, fa - arcSpan * 0.92, fa + arcSpan * 0.92);
      ctx.stroke();

      // Remaining 4s countdown gauge on outer rim
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, wallR - 9, fa - arcSpan * shieldFrac, fa + arcSpan * shieldFrac);
      ctx.stroke();

      // Clear cue label
      const lblX = cx + Math.cos(fa) * (wallR + 18);
      const lblY = cy + Math.sin(fa) * (wallR + 18);
      ctx.textAlign = 'center';
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3;
      const tLbl = `AEGIS ${p.frontShieldTimer.toFixed(1)}s`;
      ctx.strokeText(tLbl, lblX, lblY);
      ctx.fillStyle = '#bae6fd';
      ctx.fillText(tLbl, lblX, lblY);
      ctx.restore();
    }
  }

  ctx.translate(cx, cy);
  const bob = p.state === 'alive' ? Math.sin(p.animTime * 9) * 1.4 : 0;
  ctx.translate(0, bob);

  // Subtle underglow ring (no shadowBlur!)
  ctx.fillStyle = `${p.color}26`;
  ctx.beginPath();
  ctx.arc(0, 0, r + (p.dashImmune ? 8 : 4), 0, Math.PI * 2);
  ctx.fill();

  const vx = Math.cos(p.facingAngle) * 4;
  const vy = Math.sin(p.facingAngle) * 3;

  if (p.heroClass === 'ronin') {
    // KUROGANE: Angular Kabuto Cyber-Samurai + Twin Horns + Slit Visor
    ctx.fillStyle = '#0b1120';
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -r + 1);
    ctx.lineTo(r - 2, -r * 0.45);
    ctx.lineTo(r - 1, r * 0.65);
    ctx.lineTo(0, r - 1);
    ctx.lineTo(-r + 1, r * 0.65);
    ctx.lineTo(-r + 2, -r * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Kabuto Oni-Horns
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(-6, -r + 5);
    ctx.lineTo(-14, -r - 6);
    ctx.lineTo(-2, -r + 3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, -r + 5);
    ctx.lineTo(14, -r - 6);
    ctx.lineTo(2, -r + 3);
    ctx.closePath();
    ctx.fill();

    // Menpo razor visor
    ctx.fillStyle = '#020617';
    ctx.fillRect(-10 + vx * 0.5, -5 + vy * 0.5, 20, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8 + vx * 0.6, -3.5 + vy * 0.6, 6, 2.5);
    ctx.fillRect(2 + vx * 0.6, -3.5 + vy * 0.6, 6, 2.5);
  } else if (p.heroClass === 'phantom') {
    // VESPER: Sharp Hooded Assassin Diamond + Twin Glowing Slits
    ctx.fillStyle = '#090514';
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -r - 2);
    ctx.lineTo(r, 0);
    ctx.lineTo(r * 0.65, r - 1);
    ctx.lineTo(0, r * 0.72);
    ctx.lineTo(-r * 0.65, r - 1);
    ctx.lineTo(-r, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner cowl bevel
    ctx.fillStyle = '#1e1035';
    ctx.beginPath();
    ctx.moveTo(0, -r + 4);
    ctx.lineTo(r * 0.65, 0);
    ctx.lineTo(0, r * 0.45);
    ctx.lineTo(-r * 0.65, 0);
    ctx.closePath();
    ctx.fill();

    // Glowing assassin slits
    ctx.fillStyle = p.empoweredStrike ? '#fde047' : '#e879f9';
    ctx.beginPath();
    ctx.moveTo(-8 + vx * 0.6, -3 + vy * 0.6);
    ctx.lineTo(-2 + vx * 0.6, -1 + vy * 0.6);
    ctx.lineTo(-7 + vx * 0.6, 1 + vy * 0.6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8 + vx * 0.6, -3 + vy * 0.6);
    ctx.lineTo(2 + vx * 0.6, -1 + vy * 0.6);
    ctx.lineTo(7 + vx * 0.6, 1 + vy * 0.6);
    ctx.fill();
  } else if (p.heroClass === 'vanguard') {
    // TITAN-X: Heavy Mech Pauldrons + Octagonal Blast Plate
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-r + 2, -r + 3);
    ctx.lineTo(r - 2, -r + 3);
    ctx.lineTo(r + 2, -2);
    ctx.lineTo(r - 3, r - 2);
    ctx.lineTo(-r + 3, r - 2);
    ctx.lineTo(-r - 2, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Shoulder armor chevrons
    ctx.fillStyle = p.color;
    ctx.fillRect(-r, -r + 5, 5, 11);
    ctx.fillRect(r - 5, -r + 5, 5, 11);

    // Narrow blast visor slit
    ctx.fillStyle = '#020617';
    ctx.fillRect(-10 + vx * 0.4, -6 + vy * 0.4, 20, 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-8 + vx * 0.5, -4 + vy * 0.5, 16, 2.5);
  } else {
    // RAIDEN (Volt): Jagged Lightning Crest + Speed Fins
    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -r + 1);
    ctx.lineTo(r - 1, -r * 0.35);
    ctx.lineTo(r - 4, r - 2);
    ctx.lineTo(0, r - 4);
    ctx.lineTo(-r + 4, r - 2);
    ctx.lineTo(-r + 1, -r * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Volt lightning fins
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(-r + 2, -2);
    ctx.lineTo(-r - 6, -9);
    ctx.lineTo(-r + 4, -8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(r - 2, -2);
    ctx.lineTo(r + 6, -9);
    ctx.lineTo(r - 4, -8);
    ctx.fill();

    // Visor
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-8 + vx * 0.6, -5 + vy * 0.6, 16, 3);
  }

  // Weapon-Specific Helmet / Headgear (clearly identifies equipped class weapon)
  if (p.state === 'alive' && p.weapon !== 'none') {
    ctx.save();
    if (p.weapon === 'holy_staff') {
      // Priest Mitre / Cleric Bandana + Flowing White-Gold Tails
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r + 2, -r + 5);
      ctx.lineTo(-r - 9, -r + 11);
      ctx.lineTo(-r + 1, -r + 10);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(r - 2, -r + 5);
      ctx.lineTo(r + 9, -r + 11);
      ctx.lineTo(r - 1, -r + 10);
      ctx.closePath();
      ctx.fill();

      // Mitre Crown Cap on top of head
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(-r * 0.65, -r + 6);
      ctx.lineTo(0, -r - 12);
      ctx.lineTo(r * 0.65, -r + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Gold Cross Emblem
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-1.5, -r - 5, 3, 9);
      ctx.fillRect(-4.5, -r - 2, 9, 3);
    } else if (p.weapon === 'tank_shield') {
      // Heavy Steel Knight Greathelm with Cyan T-Visor
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(-r * 0.72, -r - 5, r * 1.44, 15, 4);
      ctx.fill();
      ctx.stroke();
      // Crest ridge
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(-3, -r - 9, 6, 5);
      // Cyan T-Visor
      ctx.fillStyle = '#020617';
      ctx.fillRect(-r * 0.45, -r + 2, r * 0.9, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-r * 0.36, -r + 3, r * 0.72, 2);
    } else if (p.weapon === 'assassin_blades') {
      // Shinobi Cowl & Trailing Purple Scarf/Bandana
      ctx.fillStyle = '#2e1065';
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-r * 0.68, -r + 5);
      ctx.lineTo(0, -r - 6);
      ctx.lineTo(r * 0.68, -r + 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Trailing scarf ribbon
      const flap = Math.sin(now / 120) * 3;
      ctx.fillStyle = '#c026d3';
      ctx.beginPath();
      ctx.moveTo(-r + 3, -r + 4);
      ctx.lineTo(-r - 12, -r + 2 + flap);
      ctx.lineTo(-r - 8, -r + 8 + flap);
      ctx.lineTo(-r + 2, -r + 7);
      ctx.closePath();
      ctx.fill();
    } else if (p.weapon === 'warrior_greatsword') {
      // Crimson & Gold Horned Vanguard Warhelm
      ctx.fillStyle = '#450a0a';
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-r * 0.65, -r - 3, r * 1.3, 11, 3);
      ctx.fill();
      ctx.stroke();
      // Broad gold-tipped horns
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, -r + 2);
      ctx.lineTo(-r - 7, -r - 10);
      ctx.lineTo(-r * 0.28, -r + 1);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(r * 0.55, -r + 2);
      ctx.lineTo(r + 7, -r - 10);
      ctx.lineTo(r * 0.28, -r + 1);
      ctx.closePath();
      ctx.fill();
    } else if (p.weapon === 'ranger_bow') {
      // Emerald Feathered Forester Hood
      ctx.fillStyle = '#064e3b';
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.72, -r + 6);
      ctx.lineTo(0, -r - 9);
      ctx.lineTo(r * 0.72, -r + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Plume Feather
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(r * 0.3, -r - 4);
      ctx.lineTo(r * 0.92, -r - 13);
      ctx.lineTo(r * 0.55, -r + 1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Player badge
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = 'bold 8px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`P${p.id}`, 0, 12);

  // Held Role Weapon miniature (Online Campaign)
  if (p.state === 'alive' && p.weapon !== 'none') {
    const wDef = WEAPONS_CATALOG.find((w) => w.id === p.weapon);
    const wCol = wDef?.accent || '#fbbf24';
    ctx.save();
    ctx.rotate(p.facingAngle);
    if (p.weapon === 'holy_staff') {
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(r - 6, 9);
      ctx.lineTo(r + 18, 9);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.72)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(r + 21, 9, 7.5, now / 240, now / 240 + Math.PI * 1.4);
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(r + 21, 9, 4.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(r + 21, 9, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.weapon === 'tank_shield') {
      ctx.fillStyle = '#082f49';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(r - 2, -13);
      ctx.lineTo(r + 6, -10);
      ctx.lineTo(r + 9, 0);
      ctx.lineTo(r + 6, 10);
      ctx.lineTo(r - 2, 13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(r + 1, -5, 3.5, 10);
    } else if (p.weapon === 'assassin_blades') {
      ctx.fillStyle = '#e879f9';
      ctx.strokeStyle = '#fdf4ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(r, -8);
      ctx.lineTo(r + 18, -13);
      ctx.lineTo(r + 11, -5);
      ctx.lineTo(r + 2, -5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r, 8);
      ctx.lineTo(r + 18, 13);
      ctx.lineTo(r + 11, 5);
      ctx.lineTo(r + 2, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (p.weapon === 'warrior_greatsword') {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(r - 3, -15, 4, 14);
      ctx.fillStyle = '#fca5a5';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(r + 1, -12);
      ctx.lineTo(r + 24, -10);
      ctx.lineTo(r + 29, -8);
      ctx.lineTo(r + 22, -4);
      ctx.lineTo(r + 1, -5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(r + 3, -8.2);
      ctx.lineTo(r + 19, -8.2);
      ctx.stroke();
    } else if (p.weapon === 'ranger_bow') {
      ctx.strokeStyle = 'rgba(167, 243, 208, 0.72)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(r + 1, -13);
      ctx.lineTo(r - 5, 0);
      ctx.lineTo(r + 1, 13);
      ctx.stroke();
      ctx.strokeStyle = wCol;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(r - 3, 0, 14, -Math.PI * 0.44, Math.PI * 0.44);
      ctx.stroke();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(r - 5, 0);
      ctx.lineTo(r + 15, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Orbiting Blade Strike Orb when armed (distinct halo orb so it never looks like a stray held sword)
  if (p.state === 'alive' && p.hasKnife) {
    const orbAng = now / 170;
    const orbDist = r + 13;
    const ox = Math.cos(orbAng) * orbDist;
    const oy = Math.sin(orbAng) * orbDist;
    const orbColor = p.empoweredStrike ? '#fde047' : p.color;

    ctx.save();
    ctx.strokeStyle = orbColor;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, orbDist, orbAng, orbAng + Math.PI * 1.35);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.globalAlpha = 0.98;
    ctx.fillStyle = orbColor;
    ctx.beginPath();
    ctx.arc(ox, oy, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ox, oy, 2.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();

  // Soul Seal indicator
  if (p.sealed && p.state === 'alive') {
    ctx.save();
    const alpha = 0.65 + Math.sin(now / 90) * 0.35;
    ctx.strokeStyle = `rgba(255, 90, 0, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 5]);
    ctx.lineDashOffset = -(now / 40);
    ctx.beginPath();
    ctx.arc(cx, cy, r + 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(255, 110, 20, ${alpha})`;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('封', cx, p.y - 10);
    ctx.restore();
  }

  // Revive ring when down
  if (p.state === 'down') {
    ctx.save();
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.75)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (p.reviveProgress > 0) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (p.reviveProgress / 3.2));
      ctx.stroke();
    }
    ctx.restore();
  }

  // Player Nameplate above character
  const baseName = (p.name || `P${p.id}`).slice(0, 14);
  const displayName = p.isBot ? `[BOT] ${baseName}` : baseName;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 9px "JetBrains Mono", monospace';
  const nameY = p.y - (p.sealed ? 26 : 16);
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 3.5;
  ctx.strokeText(displayName, cx, nameY);
  ctx.fillStyle = p.state === 'down' ? '#fda4af' : p.isBot ? '#67e8f9' : p.id === 1 ? '#ffffff' : '#e2e8f0';
  ctx.fillText(displayName, cx, nameY);
  ctx.restore();
}

function drawEnemySprite(ctx: CanvasRenderingContext2D, e: Enemy, now: number) {
  const cx = e.x + e.size / 2;
  const cy = e.y + e.size / 2;
  const r = e.size / 2;

  ctx.save();
  ctx.globalAlpha = e.alpha ?? 1;

  // Charger telegraph laser line
  if (
    e.type === 'charger' &&
    e.chargeState === 'telegraph' &&
    e.chargeTargetX !== undefined &&
    e.chargeTargetY !== undefined
  ) {
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.45 + Math.sin(now / 40) * 0.35})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(e.chargeTargetX, e.chargeTargetY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.translate(cx, cy);

  if (e.type === 'bouncer') {
    // Jagged Iron Saw Drone
    ctx.rotate(e.rotation);
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    const teeth = 8;
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const ang = (i / (teeth * 2)) * Math.PI * 2;
      const rad = i % 2 === 0 ? r + 3 : r - 4;
      if (i === 0) ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
      else ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.type === 'charger') {
    // Vanguard Interceptor Blade
    const ang = Math.atan2(e.dy, e.dx);
    ctx.rotate(ang);
    const isHot = e.chargeState === 'telegraph' || e.chargeState === 'lunge';
    ctx.fillStyle = isHot ? '#7f1d1d' : '#0f172a';
    ctx.strokeStyle = isHot ? '#ff3333' : '#f97316';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(r + 5, 0);
    ctx.lineTo(-r + 2, -r * 0.85);
    ctx.lineTo(-r * 0.35, 0);
    ctx.lineTo(-r + 2, r * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (e.type === 'splitter' || e.type === 'mini_spark') {
    // Jagged Hex Reactor
    ctx.rotate(-e.rotation * 0.8);
    ctx.fillStyle = e.type === 'splitter' ? '#451a03' : '#78350f';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.type === 'void_stalker') {
    // Razor Abyssal Shard Wraith
    ctx.rotate(Math.sin(now / 260) * 0.25);
    ctx.fillStyle = '#2e1065';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r - 2);
    ctx.lineTo(r * 0.85, 0);
    ctx.lineTo(0, r + 2);
    ctx.lineTo(-r * 0.85, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(-5, -2, 3, 4);
    ctx.fillRect(2, -2, 3, 4);
  } else if (e.type === 'oni_acolyte') {
    // Demon Hannya Mask
    ctx.fillStyle = '#450a0a';
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r + 2);
    ctx.lineTo(r - 1, -r * 0.25);
    ctx.lineTo(r * 0.7, r - 2);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.7, r - 2);
    ctx.lineTo(-r + 1, -r * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Sharp horns
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.moveTo(-7, -r + 3);
    ctx.lineTo(-12, -r - 7);
    ctx.lineTo(-2, -r + 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(7, -r + 3);
    ctx.lineTo(12, -r - 7);
    ctx.lineTo(2, -r + 2);
    ctx.fill();
    // Slanted eyes
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-7, -3, 5, 2.5);
    ctx.fillRect(2, -3, 5, 2.5);
  }

  // Elite champion ring
  if (e.isElite) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, r + 5 + Math.sin(now / 140) * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Hit flash feedback on multi-HP foes
  if (e.hitFlashTimer && e.hitFlashTimer > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.7, e.hitFlashTimer * 3.2)})`;
    ctx.beginPath();
    ctx.arc(0, 0, r + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stunned arc ring
  if (e.stunTimer && e.stunTimer > 0) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();

  // Individual Enemy HP Bar (Loop 2+ / Elites / Multi-HP foes)
  const maxHp = e.maxHp ?? 1;
  const hp = Math.max(0, e.hp ?? maxHp);
  if (maxHp > 1 || e.isElite) {
    const barW = Math.max(28, e.size + 4);
    const barH = 5;
    const bx = cx - barW / 2;
    const by = e.y - 11;
    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
    ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
    ctx.fillStyle = e.isElite ? '#fbbf24' : '#f43f5e';
    ctx.fillRect(bx, by, barW * (hp / Math.max(1, maxHp)), barH);
    ctx.strokeStyle = e.isElite ? '#fde047' : 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx - 1, by - 1, barW + 2, barH + 2);
    if (e.isElite) {
      ctx.font = 'bold 7px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde047';
      ctx.fillText('ELITE', cx, by - 3);
    }
    ctx.restore();
  }
}

function drawBossDeathCollapse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  deadTimer: number,
  accent: string,
  now: number
) {
  const prog = Math.max(0, Math.min(1, deadTimer / 2.5));
  ctx.save();
  // Blinding internal fracture rays tearing outward from the dying boss core
  const rayCount = 8 + Math.floor(prog * 8);
  for (let i = 0; i < rayCount; i++) {
    const a = (i / rayCount) * Math.PI * 2 + Math.sin(i * 7.3) * 0.25 + deadTimer * 0.4;
    const len = radius * (0.9 + prog * 2.8 + Math.sin(now / 40 + i) * 0.3);
    ctx.strokeStyle = i % 2 === 0 ? '#ffffff' : '#fde047';
    ctx.globalAlpha = 0.45 + prog * 0.52;
    ctx.lineWidth = 2 + prog * 5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    ctx.stroke();
  }
  // Overloading white-hot singularity core
  ctx.globalAlpha = 0.35 + prog * 0.6;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * (0.35 + prog * 0.65), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * (0.18 + prog * 0.48), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBossIntroVisuals(ctx: CanvasRenderingContext2D, rt: GameRuntime, now: number) {
  const b = rt.boss;
  if (b.state !== 'comic_intro') return;
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;
  const targetY = b.originalY + b.size / 2;
  const elapsed = Math.max(0, 7.4 - b.stateTimer);
  const pulse = 0.55 + Math.sin(now / 65) * 0.35;
  const themeCol =
    rt.bossType === 'mecha'
      ? '#38bdf8'
      : rt.bossType === 'void'
      ? '#c084fc'
      : rt.bossType === 'eclipse'
      ? '#fbbf24'
      : '#f97316';

  ctx.save();

  // Act II/III: True Villain Form Revealed — Unique World-Space Manifestation per Boss!
  if (b.entryPhase >= 3) {
    ctx.save();
    ctx.translate(cx, cy);
    if (rt.bossType === 'mecha') {
      // Tactical Iron Scanner Grid & Reactor Vent Shock Ring
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-140, -140, 280, 280);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.beginPath();
      ctx.moveTo(-190, 0);
      ctx.lineTo(-105, 0);
      ctx.moveTo(105, 0);
      ctx.lineTo(190, 0);
      ctx.moveTo(0, -190);
      ctx.lineTo(0, -105);
      ctx.moveTo(0, 105);
      ctx.lineTo(0, 190);
      ctx.stroke();
    } else if (rt.bossType === 'void') {
      // Reality Fracture Web & Abyssal Eye Halo
      for (let r = 0; r < 10; r++) {
        const a = (r / 10) * Math.PI * 2 - now / 1200;
        ctx.strokeStyle = r % 2 === 0 ? 'rgba(192, 132, 252, 0.45)' : 'rgba(244, 63, 94, 0.35)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 45, Math.sin(a) * 45);
        ctx.lineTo(Math.cos(a + 0.14) * 145, Math.sin(a + 0.14) * 145);
        ctx.lineTo(Math.cos(a - 0.1) * 280, Math.sin(a - 0.1) * 280);
        ctx.stroke();
      }
    } else if (rt.bossType === 'oni') {
      // Blazing Eight-Gate Demon Ring & Torii Ash Aura
      ctx.rotate(now / 700);
      for (let r = 0; r < 8; r++) {
        const a = (r / 8) * Math.PI * 2;
        ctx.fillStyle = r % 2 === 0 ? 'rgba(249, 115, 22, 0.25)' : 'rgba(239, 68, 68, 0.16)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a - 0.1) * 330, Math.sin(a - 0.1) * 330);
        ctx.lineTo(Math.cos(a + 0.1) * 330, Math.sin(a + 0.1) * 330);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Total Eclipse Diamond-Ring Corona (Gold + Cyan Rays)
      ctx.rotate(now / 1100);
      for (let r = 0; r < 16; r++) {
        const a = (r / 16) * Math.PI * 2;
        ctx.fillStyle = r % 2 === 0 ? 'rgba(251, 191, 36, 0.24)' : 'rgba(56, 189, 248, 0.22)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a - 0.06) * 360, Math.sin(a - 0.06) * 360);
        ctx.lineTo(Math.cos(a + 0.06) * 360, Math.sin(a + 0.06) * 360);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();

    for (let k = 0; k < 2; k++) {
      const ringProgress = (now / 1100 + k * 0.5) % 1;
      ctx.strokeStyle = themeCol;
      ctx.globalAlpha = (1 - ringProgress) * 0.65;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 55 + ringProgress * 190, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (rt.bossType === 'mecha') drawMechaBoss(ctx, rt, now, true);
    else if (rt.bossType === 'void') drawVoidPhantom(ctx, rt, now, true);
    else if (rt.bossType === 'eclipse') drawEclipseBoss(ctx, rt, now, true);
    else drawOniBoss(ctx, rt, now, true);
    return;
  }

  // Act I / II Unique Omen & Build-Up Stage per Boss
  if (rt.bossType === 'mecha') {
    // Sweeping Satellite Lock Reticle + Orbital Drop Laser Corridor
    const sweepX = cx + Math.sin(elapsed * 3.1) * (b.entryPhase === 1 ? Math.max(0, 140 - elapsed * 48) : 0);
    const beamGrad = ctx.createLinearGradient(sweepX - 105, 0, sweepX + 105, 0);
    beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    beamGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.24)');
    beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(sweepX - 105, 0, 210, targetY + 60);

    [-52, 0, 52].forEach((lx) => {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.62)';
      ctx.lineWidth = lx === 0 ? 3.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(sweepX + lx, 0);
      ctx.lineTo(sweepX + lx, targetY);
      ctx.stroke();
    });

    // Dual Spinning Ground Target Rings
    ctx.strokeStyle = `rgba(56, 189, 248, ${pulse})`;
    ctx.lineWidth = 3.5;
    ctx.setLineDash([16, 8]);
    ctx.lineDashOffset = -(now / 22);
    ctx.beginPath();
    ctx.arc(sweepX, targetY, 102 + Math.sin(now / 90) * 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.lineDashOffset = now / 28;
    ctx.beginPath();
    ctx.arc(sweepX, targetY, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Red tactical lock box
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.72)';
    ctx.lineWidth = 2;
    ctx.strokeRect(sweepX - 74, targetY - 74, 148, 148);

    // Blazing Supersonic Drop-Pod Silhouette when diving
    if (b.entryPhase === 2 || b.y > -200) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.38)';
      ctx.beginPath();
      ctx.moveTo(cx - 48, b.y + 6);
      ctx.lineTo(cx, b.y - 220);
      ctx.lineTo(cx + 48, b.y + 6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#071222';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 62);
      ctx.lineTo(cx + 68, cy + 16);
      ctx.lineTo(cx + 54, cy - 54);
      ctx.lineTo(cx - 54, cy - 54);
      ctx.lineTo(cx - 68, cy + 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx, cy + 6, 16, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (rt.bossType === 'void') {
    // Act I: Imploding Singularity -> Act II (entryPhase === 2): Eerie Blackout Slit-Eye Stare!
    const isStare = b.entryPhase === 2;
    const tearR = isStare ? 58 + Math.sin(now / 45) * 4 : 122 + Math.sin(now / 75) * 14;
    ctx.fillStyle = 'rgba(8, 1, 18, 0.96)';
    ctx.strokeStyle = isStare ? '#f43f5e' : '#c084fc';
    ctx.lineWidth = isStare ? 3 : 4.5;
    ctx.beginPath();
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2 + now / (isStare ? 190 : 420);
      const rad = i % 2 === 0 ? tearR * 1.25 : tearR * 0.58;
      const px = cx + Math.cos(a) * rad;
      const py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!isStare) {
      for (let bIdx = 0; bIdx < 6; bIdx++) {
        const ang = (bIdx / 6) * Math.PI * 2 + Math.floor(now / 120) * 0.6;
        ctx.strokeStyle = bIdx % 2 === 0 ? '#e879f9' : '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang + 0.14) * 84, cy + Math.sin(ang + 0.14) * 84);
        ctx.lineTo(cx + Math.cos(ang - 0.08) * 165, cy + Math.sin(ang - 0.08) * 165);
        ctx.stroke();
      }
    }

    // Piercing Crimson Slit Eye
    const eyeScale = isStare ? 1.45 : 1.0;
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(cx, cy, 24 * eyeScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 13 * eyeScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.fillRect(cx - 3.5 * eyeScale, cy - 18 * eyeScale, 7 * eyeScale, 36 * eyeScale);
  } else if (rt.bossType === 'eclipse') {
    // Solaris (left golden orb) & Lunaris (right sapphire orb) curving in from opposite horizons
    const prog = Math.max(0, Math.min(1, (b.stateTimer - 4.2) / 3.2));
    const offset = prog * 270;
    const arcY = cy - Math.sin(prog * Math.PI * 0.5) * 90;

    ctx.strokeStyle = 'rgba(253, 224, 71, 0.36)';
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 10]);
    ctx.lineDashOffset = -(now / 28);
    ctx.beginPath();
    ctx.arc(cx, cy, 138, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Solaris Sphere + Orbit Tail
    ctx.fillStyle = 'rgba(251, 191, 36, 0.24)';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(cx - offset, arcY, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Lunaris Sphere + Orbit Tail
    ctx.fillStyle = 'rgba(56, 189, 248, 0.24)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(cx + offset, cy + (cy - arcY) * 0.45, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Central Eclipse Void Core forming
    ctx.fillStyle = '#04030b';
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 42 + Math.sin(now / 100) * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // ONI: Towering Crimson Torii Ritual Seal + 8 Hitodama Spirit Flames igniting 1-by-1 with Taiko beats!
    ctx.fillStyle = 'rgba(153, 27, 27, 0.32)';
    ctx.beginPath();
    ctx.arc(cx, cy, 130 + Math.sin(now / 70) * 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(249, 115, 22, 0.65)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([18, 10]);
    ctx.lineDashOffset = -(now / 30);
    ctx.beginPath();
    ctx.arc(cx, cy, 138, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const litCount = Math.min(8, Math.floor(elapsed / 0.36) + 1);
    for (let f = 0; f < 8; f++) {
      const ang = (f / 8) * Math.PI * 2 - Math.PI / 2 + now / 520;
      const fx = cx + Math.cos(ang) * 106;
      const fy = cy + Math.sin(ang) * 106;
      if (f < litCount) {
        ctx.fillStyle = f % 2 === 0 ? '#f97316' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(fx, fy, 11 + Math.sin(now / 90 + f) * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(fx, fy, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.32)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(fx, fy, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(cx - 98, cy - 64);
    ctx.lineTo(cx + 98, cy - 64);
    ctx.moveTo(cx - 74, cy - 38);
    ctx.lineTo(cx + 74, cy - 38);
    ctx.moveTo(cx - 48, cy - 38);
    ctx.lineTo(cx - 48, cy + 70);
    ctx.moveTo(cx + 48, cy - 38);
    ctx.lineTo(cx + 48, cy + 70);
    ctx.stroke();

    // Glowing Demon Slit Eyes behind the Gate
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(cx - 34, cy - 6);
    ctx.lineTo(cx - 8, cy + 5);
    ctx.lineTo(cx - 28, cy + 12);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 34, cy - 6);
    ctx.lineTo(cx + 8, cy + 5);
    ctx.lineTo(cx + 28, cy + 12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawMechaBoss(ctx: CanvasRenderingContext2D, rt: GameRuntime, now: number, skipIntroCheck = false) {
  const b = rt.boss;
  const isDying = b.state === 'dead' && rt.bossDeadTimer < 2.52;
  if ((b.health <= 0 && !isDying) || (b.state === 'dead' && !isDying)) return;
  if (b.state === 'comic_intro' && !skipIntroCheck) {
    drawBossIntroVisuals(ctx, rt, now);
    return;
  }
  const isP2 = b.phase === 2;
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;
  const deathShrink = isDying ? Math.max(0.65, 1 - rt.bossDeadTimer * 0.1) : 1;
  const radius = (b.size / 2) * b.pulseSize * deathShrink;

  // Orbital Plasma Salvo target locks & impact zones
  rt.oniCursedZones.forEach((zone) => {
    ctx.save();
    if (zone.telegraphTimer && zone.telegraphTimer > 0 && zone.maxTelegraphTimer) {
      const frac = Math.max(0, Math.min(1, zone.telegraphTimer / zone.maxTelegraphTimer));
      const pulse = 0.55 + Math.sin(now / 55) * 0.3;
      // Blast perimeter warning fill
      ctx.globalAlpha = 0.14 + (1 - frac) * 0.16;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.maxRadius, 0, Math.PI * 2);
      ctx.fill();

      // Dashed outer danger boundary
      ctx.globalAlpha = 0.72 * pulse;
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 7]);
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.maxRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Shrinking lock-on countdown ring
      ctx.globalAlpha = 0.92;
      ctx.strokeStyle = frac < 0.3 ? '#ef4444' : '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, Math.max(8, zone.maxRadius * frac), 0, Math.PI * 2);
      ctx.stroke();

      // Center orbital crosshair
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(zone.x - 14, zone.y);
      ctx.lineTo(zone.x + 14, zone.y);
      ctx.moveTo(zone.x, zone.y - 14);
      ctx.lineTo(zone.x, zone.y + 14);
      ctx.stroke();
    } else {
      ctx.globalAlpha = zone.alpha * 0.35;
      ctx.fillStyle = zone.color;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = zone.alpha;
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();
  });

  ctx.save();
  if (b.shakeIntensity > 0) {
    ctx.translate((Math.random() - 0.5) * b.shakeIntensity, (Math.random() - 0.5) * b.shakeIntensity);
  }

  // Phase 2 Overclock Golden-Ember Aura (epic & comfortable on eyes)
  if (isP2 || b.state === 'phase_transition') {
    ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.5 + Math.sin(now / 180) * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Outer rotary hazard rings
  for (let ri = 0; ri < (isP2 ? 3 : 2); ri++) {
    ctx.strokeStyle = isP2
      ? `rgba(249, 115, 22, ${0.7 - ri * 0.16})`
      : `rgba(56, 189, 248, ${0.58 - ri * 0.15})`;
    ctx.lineWidth = isP2 ? 4 : 3;
    ctx.setLineDash([12 + ri * 4, 8 + ri * 3]);
    ctx.lineDashOffset = -(now / (isP2 ? 60 + ri * 20 : 95 + ri * 25));
    ctx.beginPath();
    ctx.arc(cx, cy, radius * (1.12 + ri * 0.18), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 6 Articulated Heavy Railgun / Rotary Turret Arms
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + b.rotationAngle * (isP2 ? 1.55 : 0.85);
    const cosA = Math.cos(ang);
    const sinA = Math.sin(ang);
    const x1 = cx + cosA * radius * 0.52;
    const y1 = cy + sinA * radius * 0.52;
    const x2 = cx + cosA * (radius * 1.48);
    const y2 = cy + sinA * (radius * 1.48);
    ctx.strokeStyle = isP2 ? '#450a0a' : '#1e293b';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = isP2 ? '#f97316' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + cosA * radius * 0.8, cy + sinA * radius * 0.8);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.fillStyle = isP2 ? '#fef08a' : '#7dd3fc';
    ctx.beginPath();
    ctx.arc(x2, y2, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Remodeled Dreadnought Armored Hull + Twin Shoulder Bastions
  ctx.save();
  ctx.translate(cx, cy);
  if (b.state === 'attacking' || b.state === 'telegraph') {
    ctx.rotate(b.rotationAngle * (isP2 ? 1.4 : 0.85));
  }

  // Outer armored silhouette
  ctx.fillStyle = isP2 ? '#1f0604' : '#081221';
  ctx.strokeStyle = isP2 ? '#f97316' : '#38bdf8';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const rad = i % 2 === 0 ? radius * 1.08 : radius * 0.86;
    if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner armor chevrons & furnace vents
  ctx.strokeStyle = isP2 ? '#ef4444' : '#0284c7';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * radius * 0.42, Math.sin(a) * radius * 0.42);
    ctx.lineTo(Math.cos(a) * radius * 0.85, Math.sin(a) * radius * 0.85);
    ctx.stroke();
  }
  ctx.restore();

  // Core Reactor Eye (two-pass glow, zero shadowBlur)
  const coreR = radius * 0.34;
  ctx.fillStyle = isP2 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(56, 189, 248, 0.28)';
  ctx.beginPath();
  ctx.arc(cx, cy, coreR * 1.65, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isP2 ? '#ef4444' : '#0ea5e9';
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();

  // Armored Iris Shutter
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR * 0.72, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = isP2 ? '#fef08a' : '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, coreR * 0.42, 0, Math.PI * 2);
  ctx.fill();

  if (b.state === 'telegraph') {
    ctx.strokeStyle = `rgba(250, 204, 21, ${0.5 + Math.sin(b.animationTimer * 16) * 0.5})`;
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (b.state === 'weakened') {
    ctx.strokeStyle = `rgba(34, 211, 238, ${0.55 + Math.sin(b.animationTimer * 8) * 0.45})`;
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 8]);
    ctx.lineDashOffset = -(now / 25);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    const hl = Math.max(1, b.maxWeakenedHits - b.weakenedHits);
    ctx.fillStyle = '#67e8f9';
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(`2X DMG · ${hl} LEFT`, cx, cy + radius + 30);
    ctx.fillText(`2X DMG · ${hl} LEFT`, cx, cy + radius + 30);
  }

  if (isDying) {
    drawBossDeathCollapse(ctx, cx, cy, radius, rt.bossDeadTimer, isP2 ? '#f97316' : '#38bdf8', now);
  }

  ctx.restore();
}

function drawVoidPhantom(ctx: CanvasRenderingContext2D, rt: GameRuntime, now: number, skipIntroCheck = false) {
  const b = rt.boss;
  const isDying = b.state === 'dead' && rt.bossDeadTimer < 2.52;
  if ((b.health <= 0 && !isDying) || (b.state === 'dead' && !isDying)) return;
  if (b.state === 'comic_intro' && !skipIntroCheck) {
    drawBossIntroVisuals(ctx, rt, now);
    return;
  }
  const isP2 = b.phase === 2;
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;
  const deathShrink = isDying ? Math.max(0.65, 1 - rt.bossDeadTimer * 0.1) : 1;
  const radius = (b.size / 2) * b.pulseSize * deathShrink;

  // Draw tentacles first (two-pass glow, no shadowBlur)
  rt.voidTentacles.forEach((t) => {
    if (t.extendFactor < 0.05) return;
    const segs = getTentacleSegments(t, cx, cy, b.size, b.pulseSize, b.animationTimer);
    for (let s = 1; s < segs.length; s++) {
      const frac = 1 - s / segs.length;
      const thick = t.thickness * frac * t.extendFactor;
      if (thick < 0.5) continue;
      ctx.beginPath();
      ctx.moveTo(segs[s - 1].x, segs[s - 1].y);
      ctx.lineTo(segs[s].x, segs[s].y);
      if (t.damageEnabled) {
        ctx.strokeStyle = `${t.glowColor}55`;
        ctx.lineWidth = thick + 6;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.strokeStyle = t.color;
      ctx.lineWidth = thick;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    if (t.extendFactor > 0.45) {
      const tip = segs[segs.length - 1];
      ctx.fillStyle = t.damageEnabled ? '#ffffff' : t.glowColor;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 6.5 * t.extendFactor, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  ctx.save();
  if (b.shakeIntensity > 0) {
    ctx.translate((Math.random() - 0.5) * b.shakeIntensity, (Math.random() - 0.5) * b.shakeIntensity);
  }

  // Phase 2 Abyssal Amethyst Halo (atmospheric, zero red glare)
  if (isP2 || b.state === 'phase_transition') {
    ctx.fillStyle = 'rgba(192, 132, 252, 0.11)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.55 + Math.sin(now / 180) * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let ri = 0; ri < 3; ri++) {
    const ringR = radius * (1.14 + ri * 0.22) + Math.sin(b.animationTimer * 2 + ri) * 5;
    ctx.strokeStyle = isP2 ? `rgba(232, 121, 249, ${0.52 - ri * 0.12})` : `rgba(168, 85, 247, ${0.52 - ri * 0.12})`;
    ctx.lineWidth = 2.8;
    ctx.setLineDash([7 + ri * 4, 6 + ri * 4]);
    ctx.lineDashOffset = -(now / (isP2 ? 65 + ri * 25 : 80 + ri * 40));
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Outer Ragged Abyssal Crown Silhouette (counter-rotating)
  ctx.fillStyle = isP2 ? '#1a062e' : '#100321';
  ctx.strokeStyle = isP2 ? '#e879f9' : '#a855f7';
  ctx.lineWidth = 4;
  ctx.beginPath();
  const spikes = 12;
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2 + b.animationTimer * (isP2 ? 1.1 : 0.65);
    const rad = i % 2 === 0 ? radius * 1.15 : radius * 0.74;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner Dark Sovereign Hood / Cowl Mask
  ctx.fillStyle = '#05010a';
  ctx.strokeStyle = isP2 ? '#fb7185' : '#c084fc';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius * 0.68);
  ctx.lineTo(cx + radius * 0.54, cy - radius * 0.1);
  ctx.lineTo(cx + radius * 0.36, cy + radius * 0.66);
  ctx.lineTo(cx, cy + radius * 0.5);
  ctx.lineTo(cx - radius * 0.36, cy + radius * 0.66);
  ctx.lineTo(cx - radius * 0.54, cy - radius * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Orbiting Razor Void Shards
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - b.animationTimer * (isP2 ? 2.8 : 1.9);
    const or = radius * 0.88 + Math.sin(b.animationTimer * 3 + i) * 6;
    const fx = cx + Math.cos(angle) * or;
    const fy = cy + Math.sin(angle) * or;
    ctx.fillStyle = isP2 ? '#f43f5e' : '#c084fc';
    ctx.beginPath();
    ctx.moveTo(fx, fy - 7);
    ctx.lineTo(fx + 5, fy);
    ctx.lineTo(fx, fy + 7);
    ctx.lineTo(fx - 5, fy);
    ctx.closePath();
    ctx.fill();
  }

  // Piercing Abyssal Eye (plus twin Blood-Eclipse side eyes in Phase 2 Rage)
  ctx.fillStyle = isP2 ? '#f43f5e' : '#c084fc';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.fillRect(cx - 2.5, cy - radius * 0.14, 5, radius * 0.28);

  if (isP2) {
    // Awakened Twin Flanking Crimson Eyes
    [-1, 1].forEach((side) => {
      const ex = cx + side * radius * 0.24;
      const ey = cy - radius * 0.22;
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.moveTo(ex - side * 8, ey - 4);
      ctx.lineTo(ex + side * 6, ey + 2);
      ctx.lineTo(ex - side * 4, ey + 6);
      ctx.closePath();
      ctx.fill();
    });
  }

  if (b.state === 'weakened') {
    ctx.strokeStyle = `rgba(34, 211, 238, ${0.55 + Math.sin(b.animationTimer * 8) * 0.45})`;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.lineDashOffset = -(now / 30);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dual-Blade Cross-Execution Mark ring when one partner has struck
    if (rt.eclipseMarkedBy) {
      const mCol = rt.eclipseMarkedBy === 1 ? '#fbbf24' : '#38bdf8';
      ctx.strokeStyle = mCol;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.56, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = mCol;
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        rt.eclipseMarkedBy === 1 ? 'SOLAR MARK · P2 DETONATE!' : 'LUNAR MARK · P1 DETONATE!',
        cx,
        cy - radius - 22
      );
    }

    const hl = Math.max(1, b.maxWeakenedHits - b.weakenedHits);
    ctx.fillStyle = '#67e8f9';
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(`2X DMG · ${hl} LEFT`, cx, cy + radius + 30);
    ctx.fillText(`2X DMG · ${hl} LEFT`, cx, cy + radius + 30);
  }

  if (isDying) {
    drawBossDeathCollapse(ctx, cx, cy, radius, rt.bossDeadTimer, isP2 ? '#f43f5e' : '#c084fc', now);
  }

  ctx.restore();
}

function drawOniBoss(ctx: CanvasRenderingContext2D, rt: GameRuntime, now: number, skipIntroCheck = false) {
  const b = rt.boss;
  const isDying = b.state === 'dead' && rt.bossDeadTimer < 2.52;
  if ((b.health <= 0 && !isDying) || (b.state === 'dead' && !isDying)) return;
  if (b.state === 'comic_intro' && !skipIntroCheck) {
    drawBossIntroVisuals(ctx, rt, now);
    return;
  }
  const isP2 = b.phase === 2;
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;
  const deathShrink = isDying ? Math.max(0.65, 1 - rt.bossDeadTimer * 0.1) : 1;
  const radius = (b.size / 2) * b.pulseSize * deathShrink;

  // Torii Shrines
  rt.oniShrines.forEach((shrine) => {
    if (!shrine.active) return;
    const pulse = 1 + Math.sin(b.animationTimer * 4) * 0.12;
    ctx.fillStyle = isP2 ? 'rgba(244, 63, 94, 0.25)' : 'rgba(234, 88, 12, 0.25)';
    ctx.beginPath();
    ctx.arc(shrine.x, shrine.y, shrine.size * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isP2 ? '#f43f5e' : '#f97316';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(shrine.x - 20, shrine.y - 12);
    ctx.lineTo(shrine.x + 20, shrine.y - 12);
    ctx.moveTo(shrine.x - 16, shrine.y - 6);
    ctx.lineTo(shrine.x + 16, shrine.y - 6);
    ctx.moveTo(shrine.x - 12, shrine.y - 6);
    ctx.lineTo(shrine.x - 12, shrine.y + 14);
    ctx.moveTo(shrine.x + 12, shrine.y - 6);
    ctx.lineTo(shrine.x + 12, shrine.y + 14);
    ctx.stroke();

    const pct = shrine.health / shrine.maxHealth;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(shrine.x - 20, shrine.y + 18, 40, 6);
    ctx.fillStyle = isP2 ? '#f43f5e' : '#f97316';
    ctx.fillRect(shrine.x - 20, shrine.y + 18, 40 * pct, 6);
  });

  // Spirit Bombs
  rt.oniSpiritBombs.forEach((bomb) => {
    const pulseR = bomb.radius * (1 + Math.sin(b.animationTimer * 6) * 0.1);
    ctx.fillStyle = isP2 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(249, 115, 22, 0.4)';
    ctx.beginPath();
    ctx.arc(bomb.x, bomb.y, pulseR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isP2 ? '#fb7185' : '#fb923c';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', bomb.x, bomb.y + 4);
  });

  // Cursed Zones
  rt.oniCursedZones.forEach((zone) => {
    ctx.save();
    ctx.globalAlpha = zone.alpha * 0.35;
    ctx.fillStyle = zone.color;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = zone.alpha;
    ctx.strokeStyle = zone.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  });

  ctx.save();
  if (b.shakeIntensity > 0) {
    ctx.translate((Math.random() - 0.5) * b.shakeIntensity, (Math.random() - 0.5) * b.shakeIntensity);
  }

  // Phase 2 Golden-Ember Shogun Aura (moody & eye-friendly)
  if (isP2 || b.state === 'phase_transition') {
    ctx.fillStyle = 'rgba(249, 115, 22, 0.11)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.56 + Math.sin(now / 180) * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (b.state === 'attacking' || b.state === 'telegraph') {
    ctx.translate(cx, cy);
    ctx.rotate(b.rotationAngle * (isP2 ? 1.35 : 0.85));
    ctx.translate(-cx, -cy);
  }

  for (let ri = 0; ri < 3; ri++) {
    ctx.strokeStyle = isP2 ? `rgba(251, 191, 36, ${0.58 - ri * 0.13})` : `rgba(234, 88, 12, ${0.58 - ri * 0.14})`;
    ctx.lineWidth = 3.5;
    ctx.setLineDash([10, 6]);
    ctx.lineDashOffset = -(now / (isP2 ? 65 + ri * 25 : 80 + ri * 40));
    ctx.beginPath();
    ctx.arc(cx, cy, radius * (0.98 + ri * 0.18), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 8 Yamata Serpent Heads with Armored Scales & Fangs
  for (let hi = 0; hi < 8; hi++) {
    const hAng = (hi / 8) * Math.PI * 2 + b.animationTimer * (isP2 ? 1.6 : 0.85);
    const cosA = Math.cos(hAng);
    const sinA = Math.sin(hAng);
    const hx1 = cx + cosA * radius * 0.58;
    const hy1 = cy + sinA * radius * 0.58;
    const hx2 = cx + cosA * (radius * 1.44);
    const hy2 = cy + sinA * (radius * 1.44);
    ctx.strokeStyle = isP2 ? '#9f1239' : '#7c2d12';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx1, hy1);
    ctx.lineTo(hx2, hy2);
    ctx.stroke();

    // Serpent head silhouette
    ctx.fillStyle = isP2 ? '#f43f5e' : '#f97316';
    ctx.beginPath();
    ctx.arc(hx2, hy2, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(hx2, hy2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Remodeled Angular Shogun Kabuto / Hannya Mask Hull
  ctx.fillStyle = isP2 ? '#29030f' : '#1b0702';
  ctx.strokeStyle = isP2 ? '#f43f5e' : '#ea580c';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius * 0.96);
  ctx.lineTo(cx + radius * 0.95, cy - radius * 0.35);
  ctx.lineTo(cx + radius * 0.78, cy + radius * 0.65);
  ctx.lineTo(cx, cy + radius * 1.02);
  ctx.lineTo(cx - radius * 0.78, cy + radius * 0.65);
  ctx.lineTo(cx - radius * 0.95, cy - radius * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Giant Sweeping Curved Oni Horns
  ctx.fillStyle = isP2 ? '#fb7185' : '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.42, cy - radius * 0.52);
  ctx.lineTo(cx - radius * 1.05, cy - radius * 1.32);
  ctx.lineTo(cx - radius * 0.16, cy - radius * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + radius * 0.42, cy - radius * 0.52);
  ctx.lineTo(cx + radius * 1.05, cy - radius * 1.32);
  ctx.lineTo(cx + radius * 0.16, cy - radius * 0.72);
  ctx.closePath();
  ctx.fill();

  // Fierce Twin Demon Slit Eyes + Carved Hannya Fangs
  ctx.fillStyle = isP2 ? '#fef08a' : '#fb923c';
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.5, cy - radius * 0.16);
  ctx.lineTo(cx - radius * 0.12, cy - radius * 0.02);
  ctx.lineTo(cx - radius * 0.44, cy + radius * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + radius * 0.5, cy - radius * 0.16);
  ctx.lineTo(cx + radius * 0.12, cy - radius * 0.02);
  ctx.lineTo(cx + radius * 0.44, cy + radius * 0.08);
  ctx.closePath();
  ctx.fill();

  // Hannya Jaw & Fangs
  ctx.fillStyle = '#090202';
  ctx.fillRect(cx - radius * 0.34, cy + radius * 0.32, radius * 0.68, radius * 0.24);
  ctx.fillStyle = isP2 ? '#fecdd3' : '#fde68a';
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.28, cy + radius * 0.56);
  ctx.lineTo(cx - radius * 0.2, cy + radius * 0.22);
  ctx.lineTo(cx - radius * 0.12, cy + radius * 0.56);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + radius * 0.28, cy + radius * 0.56);
  ctx.lineTo(cx + radius * 0.2, cy + radius * 0.22);
  ctx.lineTo(cx + radius * 0.12, cy + radius * 0.56);
  ctx.fill();

  if (b.state === 'weakened') {
    ctx.strokeStyle = `rgba(34, 211, 238, ${0.55 + Math.sin(b.animationTimer * 8) * 0.45})`;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.lineDashOffset = -(now / 30);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    const hl = Math.max(1, b.maxWeakenedHits - b.weakenedHits);
    ctx.fillStyle = '#67e8f9';
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(`2X DMG · ${hl} LEFT`, cx, cy + radius + 30);
    ctx.fillText(`2X DMG · ${hl} LEFT`, cx, cy + radius + 30);
  }

  if (isDying) {
    drawBossDeathCollapse(ctx, cx, cy, radius, rt.bossDeadTimer, isP2 ? '#f43f5e' : '#f97316', now);
  }

  ctx.restore();
}

function drawEclipseBoss(ctx: CanvasRenderingContext2D, rt: GameRuntime, now: number, skipIntroCheck = false) {
  const b = rt.boss;
  const isDying = b.state === 'dead' && rt.bossDeadTimer < 2.52;
  if ((b.health <= 0 && !isDying) || (b.state === 'dead' && !isDying)) return;
  if (b.state === 'comic_intro' && !skipIntroCheck) {
    drawBossIntroVisuals(ctx, rt, now);
    return;
  }
  const isP2 = b.phase === 2;
  const cx = b.x + b.size / 2;
  const cy = b.y + b.size / 2;
  const deathShrink = isDying ? Math.max(0.65, 1 - rt.bossDeadTimer * 0.1) : 1;
  const radius = (b.size / 2) * b.pulseSize * deathShrink;

  // Starfall meteor zones
  rt.oniCursedZones.forEach((zone) => {
    ctx.save();
    ctx.globalAlpha = zone.alpha * 0.35;
    ctx.fillStyle = zone.color;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = zone.alpha;
    ctx.strokeStyle = zone.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  });

  // 2P Polarity Attunement Rings (P1 = Solar Gold, P2 = Lunar Cyan)
  if (rt.numPlayers === 2) {
    rt.players.forEach((pl) => {
      if (pl.state !== 'alive') return;
      const px = pl.x + pl.size / 2;
      const py = pl.y + pl.size / 2;
      const isSolar = pl.id === 1;
      ctx.save();
      ctx.strokeStyle = isSolar ? 'rgba(251, 191, 36, 0.55)' : 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = (isSolar ? -1 : 1) * (now / 45);
      ctx.beginPath();
      ctx.arc(px, py, pl.size * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = isSolar ? '#fde68a' : '#bae6fd';
      ctx.fillText(isSolar ? 'SOLAR' : 'LUNAR', px, py + pl.size * 0.95);
      ctx.restore();
    });
  }

  // Synchronized Eclipse Pylons + live connecting tether
  if (rt.eclipsePylons.length === 2) {
    const py1 = rt.eclipsePylons[0];
    const py2 = rt.eclipsePylons[1];
    ctx.save();
    ctx.strokeStyle =
      !py1.active || !py2.active ? 'rgba(253, 224, 71, 0.72)' : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = !py1.active || !py2.active ? 3.5 : 1.5;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -(now / 30);
    ctx.beginPath();
    ctx.moveTo(py1.x, py1.y);
    ctx.lineTo(py2.x, py2.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  rt.eclipsePylons.forEach((py) => {
    if (!py.active) {
      if (py.rekindleTimer > 0) {
        ctx.save();
        ctx.strokeStyle = py.role === 'solar' ? 'rgba(251,191,36,0.55)' : 'rgba(56,189,248,0.55)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(py.x, py.y, py.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`REKINDLE ${py.rekindleTimer.toFixed(1)}s`, py.x, py.y + 4);
        ctx.restore();
      }
      return;
    }

    const col = py.role === 'lunar' ? '#38bdf8' : '#fbbf24';
    ctx.save();
    ctx.fillStyle = py.role === 'lunar' ? 'rgba(56, 189, 248, 0.16)' : 'rgba(251, 191, 36, 0.16)';
    ctx.beginPath();
    ctx.arc(py.x, py.y, py.size + 10 + Math.sin(now / 150) * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#090616';
    ctx.strokeStyle = col;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(py.x, py.y - py.size);
    ctx.lineTo(py.x + py.size * 0.72, py.y);
    ctx.lineTo(py.x, py.y + py.size);
    ctx.lineTo(py.x - py.size * 0.72, py.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const pct = py.hp / py.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(py.x - 22, py.y + py.size + 8, 44, 6);
    ctx.fillStyle = col;
    ctx.fillRect(py.x - 22, py.y + py.size + 8, 44 * pct, 6);

    ctx.textAlign = 'center';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = col;
    ctx.fillText(
      py.role === 'solar' ? 'P1 SOLAR PYLON' : py.role === 'lunar' ? 'P2 LUNAR PYLON' : 'ECLIPSE PYLON',
      py.x,
      py.y - py.size - 8
    );
    ctx.restore();
  });

  // 2P Astral Stasis Prison (eclipse_prison)
  if (rt.eclipsePrison) {
    const pr = rt.eclipsePrison;
    const pct = Math.max(0, pr.timer / pr.maxTimer);
    ctx.save();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
    ctx.fill();

    // Rotating octagonal rune cage
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([12, 6]);
    ctx.lineDashOffset = -(now / 28);
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Countdown danger ring
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, pr.radius + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.stroke();

    // Beam from boss down to the prison
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.42)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(pr.x, pr.y);
    ctx.stroke();

    const rescuerId = pr.targetPlayerId === 1 ? 2 : 1;
    ctx.textAlign = 'center';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fde047';
    ctx.fillText(`P${rescuerId}: DASH/SLASH TO FREE!`, pr.x, pr.y - pr.radius - 12);
    ctx.restore();
  }

  // 2P Twin Astral Mirrors (eclipse_prism_beam)
  if (rt.eclipseMirrors.length > 0) {
    rt.eclipseMirrors.forEach((m) => {
      const col = m.role === 'solar' ? '#fbbf24' : '#38bdf8';
      ctx.save();
      // Incoming boss charge beam to mirror
      ctx.strokeStyle = m.locked ? col : 'rgba(255,255,255,0.22)';
      ctx.lineWidth = m.locked ? 4.5 : 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();

      ctx.fillStyle = m.locked ? `${col}44` : `${col}1c`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();

      // Mirror Crystal Prism
      ctx.fillStyle = '#070512';
      ctx.strokeStyle = col;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y - 24);
      ctx.lineTo(m.x + 20, m.y);
      ctx.lineTo(m.x, m.y + 24);
      ctx.lineTo(m.x - 20, m.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Radial charge arc
      ctx.strokeStyle = m.locked ? '#34d399' : '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * m.charge);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillStyle = m.locked ? '#34d399' : col;
      ctx.fillText(
        m.locked ? 'MIRROR LOCKED!' : m.role === 'solar' ? 'SOLAR MIRROR' : 'LUNAR MIRROR',
        m.x,
        m.y - m.radius - 8
      );
      ctx.restore();
    });
  }

  // Twin Counter-Laser Flash effect on Co-op Resonance
  if (rt.eclipseCounterFlashTimer > 0) {
    const fAlpha = Math.min(1, rt.eclipseCounterFlashTimer / 0.65);
    ctx.save();
    ctx.globalAlpha = fAlpha;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 10 * fAlpha;
    ctx.beginPath();
    ctx.moveTo(240, Math.round(rt.arenaHeight * 0.52));
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(rt.arenaWidth - 240, Math.round(rt.arenaHeight * 0.52));
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.restore();
  }

  // Co-op Soul-Link Sanctuary Tether (eclipse_tether)
  if (b.state === 'attacking' && b.attackPattern === 'eclipse_tether' && rt.numPlayers >= 2) {
    const aliveList = rt.players.filter((pl) => pl.state === 'alive');
    for (let i = 0; i < aliveList.length; i++) {
      for (let j = i + 1; j < aliveList.length; j++) {
        const pa = aliveList[i];
        const pb = aliveList[j];
        const pax = pa.x + pa.size / 2;
        const pay = pa.y + pa.size / 2;
        const pbx = pb.x + pb.size / 2;
        const pby = pb.y + pb.size / 2;
        const linkDist = Math.hypot(pbx - pax, pby - pay);
        if (aliveList.length > 2 && linkDist > 260) continue;
        const activeLink = linkDist <= 215 && rt.eclipseSanctuaryActive;
        ctx.save();
        ctx.strokeStyle = activeLink ? '#34d399' : '#fbbf24';
        ctx.lineWidth = activeLink ? 6 : 2.5;
        if (!activeLink) ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(pax, pay);
        ctx.lineTo(pbx, pby);
        ctx.stroke();
        ctx.setLineDash([]);

        if (activeLink) {
          ctx.strokeStyle = '#ecfdf5';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pax, pay);
          ctx.lineTo(pbx, pby);
          ctx.stroke();

          const midX = (pax + pbx) / 2;
          const midY = (pay + pby) / 2;
          const domeR = Math.max(78, linkDist * 0.68);
          ctx.fillStyle = 'rgba(52, 211, 153, 0.15)';
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(midX, midY, domeR, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  ctx.save();
  if (b.shakeIntensity > 0) {
    ctx.translate((Math.random() - 0.5) * b.shakeIntensity, (Math.random() - 0.5) * b.shakeIntensity);
  }

  // Calm, majestic Eclipse Corona Halo in Phase 2
  if (isP2 || b.state === 'phase_transition') {
    ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.55 + Math.sin(now / 180) * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dual Celestial Astrolabe Rings (Gold Solar + Cyan Lunar)
  for (let ri = 0; ri < 3; ri++) {
    ctx.strokeStyle = ri % 2 === 0 ? 'rgba(251, 191, 36, 0.58)' : 'rgba(56, 189, 248, 0.54)';
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 8]);
    ctx.lineDashOffset = (ri % 2 === 0 ? -1 : 1) * (now / (65 + ri * 20));
    ctx.beginPath();
    ctx.arc(cx, cy, radius * (1.06 + ri * 0.2), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Orbiting Twin Sub-Sovereigns: Solaris (Gold Sun) & Lunaris (Cyan Crescent)
  const twinOrbit = b.animationTimer * (isP2 ? 2.1 : 1.35);
  const orbitDist = radius * 1.42;
  const sx = cx + Math.cos(twinOrbit) * orbitDist;
  const sy = cy + Math.sin(twinOrbit) * orbitDist;
  const lx = cx - Math.cos(twinOrbit) * orbitDist;
  const ly = cy - Math.sin(twinOrbit) * orbitDist;

  // Solaris Crest
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(sx, sy, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fef3c7';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Lunaris Crest
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(lx, ly, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#070512';
  ctx.beginPath();
  ctx.arc(lx + 4, ly - 3, 9, 0, Math.PI * 2);
  ctx.fill();

  // Central Eclipsed Black-Sun Throne
  ctx.fillStyle = '#04030b';
  ctx.strokeStyle = isP2 ? '#fde047' : '#fbbf24';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.88, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner Lunar Sapphire Ring
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.62, 0, Math.PI * 2);
  ctx.stroke();

  // Eclipsed Corona Slit Eye
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#020208';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.14, 0, Math.PI * 2);
  ctx.fill();

  if (b.state === 'attacking' && b.attackPattern === 'eclipse_tether' && rt.eclipseTetherTimer > 0) {
    const frac = Math.min(1, rt.eclipseTetherTimer / 3.6);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.35 + frac * 45, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - frac));
    ctx.stroke();
  }

  if (b.state === 'weakened') {
    ctx.strokeStyle = `rgba(34, 211, 238, ${0.55 + Math.sin(b.animationTimer * 8) * 0.45})`;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.lineDashOffset = -(now / 30);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    const hl = Math.max(1, b.maxWeakenedHits - b.weakenedHits);
    ctx.fillStyle = '#67e8f9';
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(`2X DMG · ${hl} LEFT`, cx, cy + radius + 30);
    ctx.fillText(`2X DMG · ${hl} LEFT`, cx, cy + radius + 30);
  }

  if (isDying) {
    drawBossDeathCollapse(ctx, cx, cy, radius, rt.bossDeadTimer, '#fbbf24', now);
  }

  ctx.restore();
}

function drawEdgeIndicator(
  ctx: CanvasRenderingContext2D,
  wx: number,
  wy: number,
  refX: number,
  refY: number,
  color: string,
  icon: string,
  label: string,
  rt: GameRuntime,
  now: number
) {
  const viewW = ctx.canvas.width || CANVAS_WIDTH;
  const viewH = ctx.canvas.height || CANVAS_HEIGHT;
  const sx = (wx - rt.camera.x) * rt.camera.zoom + viewW / 2;
  const sy = (wy - rt.camera.y) * rt.camera.zoom + viewH / 2;

  // Only render edge indicator if the item is off-screen (or clipped at the viewport edge)
  const padCheck = 16;
  if (
    sx >= padCheck &&
    sx <= viewW - padCheck &&
    sy >= padCheck &&
    sy <= viewH - padCheck
  ) {
    return;
  }

  const cx = viewW / 2;
  const cy = viewH / 2;
  const dx = sx - cx;
  const dy = sy - cy;
  const ang = Math.atan2(dy, dx);

  const marginX = 42;
  const marginY = 36;
  const maxHalfW = Math.max(40, cx - marginX);
  const maxHalfH = Math.max(40, cy - marginY);

  const scaleX = Math.abs(dx) > 0.001 ? maxHalfW / Math.abs(dx) : 1e9;
  const scaleY = Math.abs(dy) > 0.001 ? maxHalfH / Math.abs(dy) : 1e9;
  const t = Math.min(scaleX, scaleY);

  const ix = cx + dx * t;
  const iy = cy + dy * t;
  const pulse = 0.72 + Math.sin(now / 150) * 0.28;
  const distM = Math.max(1, Math.round(Math.hypot(wx - refX, wy - refY) / 22));

  ctx.save();
  ctx.globalAlpha = pulse;

  // Directional pointer chevron rotated toward the offscreen target
  ctx.save();
  ctx.translate(ix + Math.cos(ang) * 20, iy + Math.sin(ang) * 20);
  ctx.rotate(ang);
  ctx.fillStyle = color;
  ctx.strokeStyle = '#050406';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(-5, -6.5);
  ctx.lineTo(-2, 0);
  ctx.lineTo(-5, 6.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Tactical dark obsidian badge
  ctx.fillStyle = 'rgba(7, 6, 11, 0.9)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(ix - 22, iy - 15, 44, 30, 5);
  ctx.fill();
  ctx.stroke();

  // Icon + Label + Distance
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(icon, ix - 11, iy + 1);

  ctx.fillStyle = '#f5f5f4';
  ctx.font = 'bold 8px "JetBrains Mono", monospace';
  ctx.fillText(label, ix + 8, iy);

  ctx.fillStyle = '#a8a29e';
  ctx.font = 'bold 8px "JetBrains Mono", monospace';
  ctx.fillText(`${distM}m`, ix, iy + 11);

  ctx.restore();
}

function drawDirectionalIndicators(ctx: CanvasRenderingContext2D, rt: GameRuntime, now: number, viewerPlayerId?: PlayerId) {
  const refPlayer =
    (viewerPlayerId !== undefined ? rt.players.find((p) => p.id === viewerPlayerId && p.state === 'alive') : undefined) ||
    rt.players.find((p) => p.state === 'alive') ||
    rt.players[0];
  const refX = refPlayer ? refPlayer.x + refPlayer.size / 2 : rt.camera.x;
  const refY = refPlayer ? refPlayer.y + refPlayer.size / 2 : rt.camera.y;

  // 1. Dropped Blade Orbs (highest priority)
  const showKnives = !rt.isBossLevel || rt.boss.state !== 'comic_intro';
  if (showKnives) {
    for (let i = 0; i < rt.knives.length; i++) {
      const k = rt.knives[i];
      if (viewerPlayerId !== undefined && k.owner !== viewerPlayerId) continue;
      const ownerP = rt.players.find((p) => p.id === k.owner);
      if (ownerP && ownerP.hasKnife) continue;
      const lbl = rt.numPlayers >= 2 && viewerPlayerId === undefined ? `P${k.owner}` : 'BLADE';
      drawEdgeIndicator(ctx, k.x + k.size / 2, k.y + k.size / 2, refX, refY, k.color, '✦', lbl, rt, now);
    }
  }

  // 1b. Online Campaign Chests, Weapon Drops & Downed Party Allies
  if (rt.isOnlineCampaign) {
    for (let i = 0; i < rt.chests.length; i++) {
      const ch = rt.chests[i];
      if (ch.opened) continue;
      drawEdgeIndicator(ctx, ch.x, ch.y, refX, refY, '#fbbf24', '◈', 'CHEST', rt, now);
    }
    for (let i = 0; i < rt.weaponDrops.length; i++) {
      const wd = rt.weaponDrops[i];
      const wDef = WEAPONS_CATALOG.find((w) => w.id === wd.weaponId);
      drawEdgeIndicator(ctx, wd.x, wd.y, refX, refY, wDef?.accent || '#38bdf8', '⚔', wDef?.shortTag || 'WPN', rt, now);
    }
    for (let i = 0; i < rt.scrollDrops.length; i++) {
      const sd = rt.scrollDrops[i];
      drawEdgeIndicator(ctx, sd.x, sd.y, refX, refY, '#c084fc', '✦', 'SCROLL', rt, now);
    }
    for (let i = 0; i < rt.gates.length; i++) {
      const g = rt.gates[i];
      drawEdgeIndicator(
        ctx,
        g.x + g.width / 2,
        g.y + g.height / 2,
        refX,
        refY,
        g.accent,
        g.isNextFloorPortal || g.isStairsDown ? '⬇' : g.roomType === 'boss' ? '☠' : g.roomType === 'shop' ? '$' : g.roomType === 'treasure' ? '◈' : '⛩',
        g.isNextFloorPortal ? 'FLOOR+' : g.isStairsDown ? 'STAIRS' : g.dir.toUpperCase(),
        rt,
        now
      );
    }
  }

  for (let i = 0; i < rt.players.length; i++) {
    const dp = rt.players[i];
    if (dp.state === 'down') {
      drawEdgeIndicator(ctx, dp.x + dp.size / 2, dp.y + dp.size / 2, refX, refY, '#f43f5e', '✚', `P${dp.id}`, rt, now);
    }
  }

  // 2. Power-Up Relics
  for (let i = 0; i < rt.relics.length; i++) {
    const r = rt.relics[i];
    const col =
      r.type === 'overdrive'
        ? '#facc15'
        : r.type === 'shield'
        ? '#38bdf8'
        : r.type === 'magnet'
        ? '#c084fc'
        : '#22d3ee';
    const icon = r.type === 'overdrive' ? '⚡' : r.type === 'shield' ? '⛨' : r.type === 'magnet' ? '◎' : '★';
    const lbl = r.type === 'overdrive' ? 'PWR' : r.type === 'shield' ? 'SHD' : r.type === 'magnet' ? 'MAG' : 'NOVA';
    drawEdgeIndicator(ctx, r.x + r.size / 2, r.y + r.size / 2, refX, refY, col, icon, lbl, rt, now);
  }

  // 3. Medkits / Estus Drops
  for (let i = 0; i < rt.medkits.length; i++) {
    const m = rt.medkits[i];
    drawEdgeIndicator(ctx, m.x + m.size / 2, m.y + m.size / 2, refX, refY, '#10b981', '+', 'HEAL', rt, now);
  }

  // 4. Active Torii Shrines during Oni boss ritual
  if (rt.isBossLevel && rt.bossType === 'oni') {
    for (let i = 0; i < rt.oniShrines.length; i++) {
      const s = rt.oniShrines[i];
      if (!s.active) continue;
      drawEdgeIndicator(ctx, s.x, s.y, refX, refY, '#f97316', '⛩', 'SEAL', rt, now);
    }
  }

  // 5. Eclipse Co-op Pylons
  if (rt.isBossLevel && rt.bossType === 'eclipse') {
    for (let i = 0; i < rt.eclipsePylons.length; i++) {
      const py = rt.eclipsePylons[i];
      if (!py.active) continue;
      drawEdgeIndicator(
        ctx,
        py.x,
        py.y,
        refX,
        refY,
        py.role === 'lunar' ? '#38bdf8' : '#fbbf24',
        '◆',
        'PYLON',
        rt,
        now
      );
    }
    if (rt.eclipsePrison) {
      drawEdgeIndicator(
        ctx,
        rt.eclipsePrison.x,
        rt.eclipsePrison.y,
        refX,
        refY,
        '#34d399',
        '⛓',
        'RESCUE',
        rt,
        now
      );
    }
    for (let i = 0; i < rt.eclipseMirrors.length; i++) {
      const m = rt.eclipseMirrors[i];
      if (m.locked) continue;
      drawEdgeIndicator(
        ctx,
        m.x,
        m.y,
        refX,
        refY,
        m.role === 'lunar' ? '#38bdf8' : '#fbbf24',
        '◈',
        m.role === 'lunar' ? 'P2 MIR' : 'P1 MIR',
        rt,
        now
      );
    }
  }
}

export function renderGame(ctx: CanvasRenderingContext2D, rt: GameRuntime, viewerPlayerId?: PlayerId) {
  const now = performance.now();
  const viewW = ctx.canvas.width || CANVAS_WIDTH;
  const viewH = ctx.canvas.height || CANVAS_HEIGHT;

  const realm: 'iron' | 'void' | 'oni' | 'eclipse' =
    rt.stage === 'eclipseBoss'
      ? 'eclipse'
      : rt.stage === 'oniDungeon' || rt.stage === 'oniBoss'
      ? 'oni'
      : rt.stage === 'voidDungeon' || rt.stage === 'voidBoss'
      ? 'void'
      : 'iron';

  // Clear viewport void outside arena bounds when zoomed out
  ctx.fillStyle = '#020204';
  ctx.fillRect(0, 0, viewW, viewH);

  // World-space camera + screen shake transform
  ctx.save();
  if (rt.screenShake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * rt.screenShake * 2,
      (Math.random() - 0.5) * rt.screenShake * 2
    );
    rt.screenShake = Math.max(0, rt.screenShake - 0.55);
  }
  ctx.translate(viewW / 2, viewH / 2);
  ctx.scale(rt.camera.zoom, rt.camera.zoom);
  ctx.translate(-rt.camera.x, -rt.camera.y);

  // 1. Blit pre-rendered realm background in 1 drawImage call
  ctx.drawImage(getArenaBgCanvas(realm, rt.arenaWidth, rt.arenaHeight), 0, 0);

  // 2. Fast scrolling floor grid in a single batched path
  ctx.strokeStyle =
    realm === 'eclipse'
      ? 'rgba(251, 191, 36, 0.08)'
      : realm === 'oni'
      ? 'rgba(239, 68, 68, 0.09)'
      : realm === 'void'
      ? 'rgba(168, 85, 247, 0.09)'
      : 'rgba(56, 189, 248, 0.09)';
  ctx.lineWidth = 1;
  const gs = 50;
  const go = (now / 55) % gs;
  ctx.beginPath();
  for (let x = -go; x < rt.arenaWidth; x += gs) {
    if (x < 0) continue;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rt.arenaHeight);
  }
  for (let y = -go; y < rt.arenaHeight; y += gs) {
    if (y < 0) continue;
    ctx.moveTo(0, y);
    ctx.lineTo(rt.arenaWidth, y);
  }
  ctx.stroke();

  // Arena outer wall boundary (Abyssal Loop rim tint & Phase 2 molten edge)
  const isBossRage = rt.isBossLevel && rt.boss.phase === 2;
  ctx.strokeStyle =
    rt.loopLevel > 1 && !isBossRage
      ? 'rgba(244, 63, 94, 0.58)'
      : isBossRage
      ? realm === 'void'
        ? 'rgba(192, 132, 252, 0.58)'
        : 'rgba(245, 158, 11, 0.58)'
      : realm === 'eclipse'
      ? 'rgba(251, 191, 36, 0.45)'
      : realm === 'oni'
      ? 'rgba(239, 68, 68, 0.5)'
      : realm === 'void'
      ? 'rgba(168, 85, 247, 0.5)'
      : 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = isBossRage || rt.loopLevel > 1 ? 3.5 : 3;
  ctx.strokeRect(1.5, 1.5, rt.arenaWidth - 3, rt.arenaHeight - 3);

  // 3. Ambient floating motes (batched, no shadows)
  ctx.fillStyle =
    realm === 'eclipse'
      ? '#fde047'
      : realm === 'oni'
      ? '#fb923c'
      : realm === 'void'
      ? '#c084fc'
      : '#38bdf8';
  for (let i = 0; i < rt.ambientMotes.length; i++) {
    const m = rt.ambientMotes[i];
    ctx.globalAlpha = m.alpha * (0.6 + Math.sin(m.phase) * 0.4);
    ctx.fillRect(m.x, m.y, m.size, m.size);
  }
  ctx.globalAlpha = 1;

  // Safe Zones
  if (rt.isOnlineCampaign) {
    if (rt.players.some((pl) => pl.state !== 'spectator' && !pl.safeZoneClosed)) {
      ctx.fillStyle = rt.p1SafeZone.color;
      ctx.fillRect(rt.p1SafeZone.x, rt.p1SafeZone.y, rt.p1SafeZone.width, rt.p1SafeZone.height);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(rt.p1SafeZone.x, rt.p1SafeZone.y, rt.p1SafeZone.width, rt.p1SafeZone.height);
      ctx.fillStyle = 'rgba(200, 240, 255, 0.72)';
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.fillText('PARTY SAFE ZONE', rt.p1SafeZone.x + 12, rt.p1SafeZone.y + 20);
    }
  } else {
    if (rt.players[0].state !== 'spectator' && !rt.players[0].safeZoneClosed) {
      ctx.fillStyle = rt.p1SafeZone.color;
      ctx.fillRect(rt.p1SafeZone.x, rt.p1SafeZone.y, rt.p1SafeZone.width, rt.p1SafeZone.height);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(rt.p1SafeZone.x, rt.p1SafeZone.y, rt.p1SafeZone.width, rt.p1SafeZone.height);
      ctx.fillStyle = 'rgba(200, 240, 255, 0.7)';
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.fillText('SAFE ZONE', rt.p1SafeZone.x + 12, rt.p1SafeZone.y + 20);
    }
    if (rt.numPlayers === 2 && rt.players[1] && rt.players[1].state !== 'spectator' && !rt.players[1].safeZoneClosed) {
      ctx.fillStyle = rt.p2SafeZone.color;
      ctx.fillRect(rt.p2SafeZone.x, rt.p2SafeZone.y, rt.p2SafeZone.width, rt.p2SafeZone.height);
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(rt.p2SafeZone.x, rt.p2SafeZone.y, rt.p2SafeZone.width, rt.p2SafeZone.height);
      ctx.fillStyle = 'rgba(255, 210, 225, 0.7)';
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.fillText('SAFE ZONE', rt.p2SafeZone.x + 12, rt.p2SafeZone.y + 20);
    }
  }

  // Nightmare / Loop 2+ Boss Floor Teamwork Telegraphs (rendered beneath sprites)
  if (rt.isBossLevel && rt.boss.channelKind && rt.boss.health > 0 && rt.boss.state !== 'dead') {
    const bcx = rt.boss.x + rt.boss.size / 2;
    const bcy = rt.boss.y + rt.boss.size / 2;
    const maxT = rt.boss.channelMaxTimer || 3.5;
    const frac = 1 - Math.max(0, Math.min(1, (rt.boss.channelTimer || 0) / maxT));
    const hasTank = rt.players.some(
      (pl) =>
        pl.state === 'alive' &&
        (rt.isOnlineCampaign || rt.isTeamworkPractice
          ? pl.weapon === 'tank_shield'
          : pl.heroClass === 'vanguard')
    );

    ctx.save();
    if (rt.boss.channelKind === 'siege_beam') {
      const coneAng = rt.boss.channelAngle || Math.PI / 2;
      const halfCone = 0.64;
      const range = Math.max(rt.arenaWidth, rt.arenaHeight) * 1.25;
      const pulse = 0.65 + Math.sin(now / 85) * 0.25;

      ctx.fillStyle = `rgba(244, 63, 94, ${0.14 + frac * 0.24})`;
      ctx.beginPath();
      ctx.moveTo(bcx, bcy);
      ctx.arc(bcx, bcy, range, coneAng - halfCone, coneAng + halfCone);
      ctx.closePath();
      ctx.fill();

      // Inner expanding warning wavefront
      ctx.fillStyle = `rgba(251, 113, 133, ${0.22 * pulse})`;
      ctx.beginPath();
      ctx.moveTo(bcx, bcy);
      ctx.arc(bcx, bcy, Math.max(1, range * frac), coneAng - halfCone, coneAng + halfCone);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(251, 113, 133, 0.9)';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(bcx, bcy);
      ctx.lineTo(bcx + Math.cos(coneAng - halfCone) * range, bcy + Math.sin(coneAng - halfCone) * range);
      ctx.moveTo(bcx, bcy);
      ctx.lineTo(bcx + Math.cos(coneAng + halfCone) * range, bcy + Math.sin(coneAng + halfCone) * range);
      ctx.stroke();
      ctx.setLineDash([]);

      const midR = 290;
      const mx = bcx + Math.cos(coneAng) * midR;
      const my = bcy + Math.sin(coneAng) * midR;
      ctx.textAlign = 'center';
      ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 4;
      const msg = hasTank ? 'HIDE BEHIND TANK SHIELD [E]' : 'NO TANK · DODGE CONE BARRAGE';
      ctx.strokeText(msg, mx, my);
      ctx.fillStyle = hasTank ? '#7dd3fc' : '#fda4af';
      ctx.fillText(msg, mx, my);
    } else if (rt.boss.channelKind === 'cursed_floor') {
      const sx = rt.boss.channelSafeX ?? rt.arenaWidth * 0.5;
      const sy = rt.boss.channelSafeY ?? rt.arenaHeight * 0.66;
      const sr = rt.boss.channelSafeR ?? 98;

      // Entire arena floor burns molten magma except the single tiny Safe Island cut-out
      ctx.fillStyle = `rgba(220, 38, 38, ${0.22 + frac * 0.28})`;
      ctx.beginPath();
      ctx.rect(0, 0, rt.arenaWidth, rt.arenaHeight);
      ctx.moveTo(sx + sr, sy);
      ctx.arc(sx, sy, sr, 0, Math.PI * 2, true);
      ctx.fill('evenodd');

      // Cramped Safe Island emerald highlight
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -(now / 24);
      ctx.beginPath();
      ctx.arc(sx, sy, sr - 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.textAlign = 'center';
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3.5;
      const islandText = hasTank
        ? 'ONLY SAFE ISLAND! · TANK [E] SHIELD BARRAGE!'
        : 'ONLY SAFE ISLAND! · DODGE RAPID SHOTS!';
      ctx.strokeText(islandText, sx, sy - sr - 12);
      ctx.fillStyle = '#6ee7b7';
      ctx.fillText(islandText, sx, sy - sr - 12);
    } else if (rt.boss.channelKind === 'gravity_storm') {
      // Swirling Gravity Vortex + Crimson Core Implosion Ring
      const maxPullR = 360;
      const pulse = 0.65 + Math.sin(now / 75) * 0.25;
      ctx.fillStyle = `rgba(147, 51, 234, ${0.12 + frac * 0.16})`;
      ctx.beginPath();
      ctx.arc(bcx, bcy, maxPullR, 0, Math.PI * 2);
      ctx.fill();

      // Core blast zone at 0s (155px radius)
      ctx.fillStyle = `rgba(225, 29, 72, ${0.16 + frac * 0.24})`;
      ctx.beginPath();
      ctx.arc(bcx, bcy, 155, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(251, 113, 133, ${0.7 + pulse * 0.25})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bcx, bcy, 155, 0, Math.PI * 2);
      ctx.stroke();

      // Concentric inward-spinning vortex rings
      for (let rIdx = 0; rIdx < 3; rIdx++) {
        const ringR = 195 + rIdx * 65 - ((now / 12 + rIdx * 28) % 65);
        ctx.strokeStyle = `rgba(192, 132, 252, ${0.55 - rIdx * 0.12})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 10]);
        ctx.lineDashOffset = now / 22;
        ctx.beginPath();
        ctx.arc(bcx, bcy, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.textAlign = 'center';
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3.5;
      const gravMsg = 'GRAVITY VORTEX · DASH OUT OF CORE!';
      ctx.strokeText(gravMsg, bcx, bcy - 168);
      ctx.fillStyle = '#e9d5ff';
      ctx.fillText(gravMsg, bcx, bcy - 168);
    } else if (rt.boss.channelKind === 'hunter_mark') {
      const target =
        rt.players.find((pl) => pl.id === rt.boss.channelTargetPlayerId && pl.state === 'alive') ||
        rt.players.find((pl) => pl.state === 'alive');
      if (target) {
        const tcx = target.x + target.size / 2;
        const tcy = target.y + target.size / 2;
        const pulse = 0.65 + Math.sin(now / 65) * 0.35;

        // Crimson sniper lock beam
        ctx.strokeStyle = `rgba(244, 63, 94, ${0.4 + frac * 0.55})`;
        ctx.lineWidth = 3 + frac * 4;
        ctx.setLineDash([14, 6]);
        ctx.lineDashOffset = -(now / 18);
        ctx.beginPath();
        ctx.moveTo(bcx, bcy);
        ctx.lineTo(tcx, tcy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Crosshair reticle around marked ally
        ctx.strokeStyle = `rgba(251, 113, 133, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(tcx, tcy, Math.max(1, 30 - frac * 8), 0, Math.PI * 2);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = 'bold 9px "Press Start 2P", monospace';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 3.5;
        const markMsg = hasTank
          ? 'MARKED! · TANK [E] INTERCEPT BEAM!'
          : 'HUNTED! · STAGGER BOSS OR DASH!';
        ctx.strokeText(markMsg, tcx, tcy - 38);
        ctx.fillStyle = '#fda4af';
        ctx.fillText(markMsg, tcx, tcy - 38);
      }
    } else if (rt.boss.channelKind === 'bow_weakpoint') {
      const shockR = 148;
      ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
      ctx.beginPath();
      ctx.arc(bcx, bcy, shockR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.72)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(bcx, bcy, shockR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Target sniper lock crosshairs around boss
      const lockR = rt.boss.size * 0.85 + Math.sin(now / 90) * 6;
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bcx, bcy, lockR, 0, Math.PI * 2);
      ctx.stroke();
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2 + now / 900;
        ctx.beginPath();
        ctx.moveTo(bcx + Math.cos(a) * (lockR - 12), bcy + Math.sin(a) * (lockR - 12));
        ctx.lineTo(bcx + Math.cos(a) * (lockR + 14), bcy + Math.sin(a) * (lockR + 14));
        ctx.stroke();
      }

      ctx.textAlign = 'center';
      ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3.5;
      const bwMsg = `WEAKPOINT CORE · BOW 3X DMG (${rt.boss.channelHits || 0}/${rt.boss.channelHitsNeeded || 4})`;
      ctx.strokeText(bwMsg, bcx, bcy + shockR + 20);
      ctx.fillStyle = '#34d399';
      ctx.fillText(bwMsg, bcx, bcy + shockR + 20);
    } else if (rt.boss.channelKind === 'emp_interrupt') {
      const pulseR = 90 + frac * 420;
      ctx.fillStyle = 'rgba(244, 63, 94, 0.08)';
      ctx.beginPath();
      ctx.arc(bcx, bcy, pulseR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(232, 121, 249, 0.78)';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([14, 8]);
      ctx.lineDashOffset = -(now / 18);
      ctx.beginPath();
      ctx.arc(bcx, bcy, pulseR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.textAlign = 'center';
      ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3.5;
      const empMsg = `UNAVOIDABLE EMP · ASSASSIN INTERRUPT (${rt.boss.channelHits || 0}/${rt.boss.channelHitsNeeded || 3})`;
      ctx.strokeText(empMsg, bcx, bcy - rt.boss.size * 0.9 - 14);
      ctx.fillStyle = '#f0abfc';
      ctx.fillText(empMsg, bcx, bcy - rt.boss.size * 0.9 - 14);
    } else if (rt.boss.channelKind === 'sky_battery') {
      const shockR = 148;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.beginPath();
      ctx.arc(bcx, bcy, shockR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(bcx, bcy, shockR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const nodes = rt.boss.channelNodes || [];
      let aliveCount = 0;
      for (const nd of nodes) {
        if (nd.activated) continue;
        aliveCount++;
        const pulse = 0.72 + Math.sin(now / 75 + nd.x) * 0.25;
        // Energy tether from node to boss
        ctx.strokeStyle = `rgba(52, 211, 153, ${0.32 + frac * 0.35})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 6]);
        ctx.lineDashOffset = -(now / 22);
        ctx.beginPath();
        ctx.moveTo(nd.x, nd.y);
        ctx.lineTo(bcx, bcy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Turret pylon node
        ctx.fillStyle = `rgba(16, 185, 129, ${0.28 * pulse})`;
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, Math.max(1, nd.r || 26), 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, Math.max(1, 20 + Math.sin(now / 95) * 2.5), 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#a7f3d0';
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, 7, 0, Math.PI * 2);
        ctx.fill();

        // Status above pylon
        ctx.textAlign = 'center';
        ctx.font = 'bold 8px "Press Start 2P", monospace';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 3;
        const pLabel = 'TURRET · SHOOT!';
        ctx.strokeText(pLabel, nd.x, nd.y - 28);
        ctx.fillStyle = '#6ee7b7';
        ctx.fillText(pLabel, nd.x, nd.y - 28);
      }

      ctx.textAlign = 'center';
      ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3.5;
      const skyMsg = `SKY BATTERIES (${aliveCount} UP) · BOW / RANGED DESTROY!`;
      ctx.strokeText(skyMsg, bcx, bcy + shockR + 20);
      ctx.fillStyle = '#34d399';
      ctx.fillText(skyMsg, bcx, bcy + shockR + 20);
    } else if (rt.boss.channelKind === 'mirage_ambush') {
      const domeR = rt.boss.size * 0.92;
      const pulse = 0.7 + Math.sin(now / 65) * 0.3;
      ctx.fillStyle = `rgba(168, 85, 247, ${0.14 * pulse})`;
      ctx.beginPath();
      ctx.arc(bcx, bcy, domeR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(216, 180, 254, ${0.85 * pulse})`;
      ctx.lineWidth = 3.5;
      ctx.setLineDash([10, 6]);
      ctx.lineDashOffset = -(now / 16);
      ctx.beginPath();
      ctx.arc(bcx, bcy, domeR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Spinning shadow dagger ticks
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2 + now / 450;
        ctx.strokeStyle = '#f0abfc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bcx + Math.cos(a) * (domeR - 10), bcy + Math.sin(a) * (domeR - 10));
        ctx.lineTo(bcx + Math.cos(a) * (domeR + 14), bcy + Math.sin(a) * (domeR + 14));
        ctx.stroke();
      }

      ctx.textAlign = 'center';
      ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3.5;
      const mirMsg = `SHADOW COUNTER · SKILLS BREAK (BASIC PARRIED! ${rt.boss.channelHits || 0}/${rt.boss.channelHitsNeeded || 3})`;
      ctx.strokeText(mirMsg, bcx, bcy - domeR - 14);
      ctx.fillStyle = '#e9d5ff';
      ctx.fillText(mirMsg, bcx, bcy - domeR - 14);
    } else if (rt.boss.channelKind === 'abyss_tether' && rt.boss.channelTetherPair) {
      const [idA, idB] = rt.boss.channelTetherPair;
      const pA = rt.players.find((pl) => pl.id === idA && pl.state === 'alive');
      const pB = idB !== idA ? rt.players.find((pl) => pl.id === idB && pl.state === 'alive') : undefined;
      if (pA) {
        const ax = pA.x + pA.size / 2;
        const ay = pA.y + pA.size / 2;
        const bxT = pB ? pB.x + pB.size / 2 : bcx;
        const byT = pB ? pB.y + pB.size / 2 : bcy;
        const dist = Math.round(Math.hypot(bxT - ax, byT - ay));

        // Crackling jagged tether beam
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        const segs = 9;
        for (let s = 1; s < segs; s++) {
          const t = s / segs;
          const jitter = Math.sin(now / 35 + s * 2.4) * 10;
          const nx = ax + (bxT - ax) * t;
          const ny = ay + (byT - ay) * t;
          const ang = Math.atan2(byT - ay, bxT - ax) + Math.PI / 2;
          ctx.lineTo(nx + Math.cos(ang) * jitter, ny + Math.sin(ang) * jitter);
        }
        ctx.lineTo(bxT, byT);
        ctx.stroke();

        ctx.strokeStyle = '#f0abfc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ax, ay, 28, 0, Math.PI * 2);
        if (pB) {
          ctx.moveTo(bxT + 28, byT);
          ctx.arc(bxT, byT, 28, 0, Math.PI * 2);
        }
        ctx.stroke();

        const mx = (ax + bxT) / 2;
        const my = (ay + byT) / 2 - 14;
        ctx.textAlign = 'center';
        ctx.font = 'bold 9px "Press Start 2P", monospace';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 3.5;
        const tMsg = `SNAP >340px (${dist}px)`;
        ctx.strokeText(tMsg, mx, my);
        ctx.fillStyle = dist >= 280 ? '#6ee7b7' : '#e879f9';
        ctx.fillText(tMsg, mx, my);
      }
    } else if (rt.boss.channelKind === 'demon_seal_purge') {
      rt.players.forEach((pl) => {
        if (pl.state !== 'alive' || !pl.sealed) return;
        const px = pl.x + pl.size / 2;
        const py = pl.y + pl.size / 2;
        ctx.fillStyle = `rgba(249, 115, 22, ${0.22 + frac * 0.25})`;
        ctx.beginPath();
        ctx.arc(px, py, 44, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 5]);
        ctx.lineDashOffset = -(now / 20);
        ctx.beginPath();
        ctx.arc(px, py, 44, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.textAlign = 'center';
        ctx.font = 'bold 9px "Press Start 2P", monospace';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 3.5;
        const sMsg = hasTank ? 'SEALED! · TANK [E] PURGE!' : 'SEALED! · ALLY TOUCH RESCUE!';
        ctx.strokeText(sMsg, px, py - 48);
        ctx.fillStyle = '#fdba74';
        ctx.fillText(sMsg, px, py - 48);
      });
    } else if (rt.boss.channelKind === 'meteor_soak') {
      const sx = rt.boss.channelSafeX ?? rt.arenaWidth * 0.5;
      const sy = rt.boss.channelSafeY ?? rt.arenaHeight * 0.7;
      const sr = rt.boss.channelSafeR ?? 142;
      const insidePlayers = rt.players.filter(
        (pl) => pl.state === 'alive' && Math.hypot(pl.x + pl.size / 2 - sx, pl.y + pl.size / 2 - sy) <= sr + 14
      );
      const hasAegisInside = insidePlayers.some(
        (pl) =>
          pl.frontShieldTimer > 0 ||
          rt.skillZones.some(
            (z) =>
              (z.kind === 'sanctuary_dome' || z.kind === 'aegis_beacon') &&
              Math.hypot(pl.x + pl.size / 2 - z.x, pl.y + pl.size / 2 - z.y) <= z.radius + 16
          )
      );

      ctx.fillStyle = hasAegisInside
        ? 'rgba(56, 189, 248, 0.22)'
        : insidePlayers.length >= 2
        ? 'rgba(251, 191, 36, 0.22)'
        : 'rgba(239, 68, 68, 0.22)';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();

      // Contracting meteor drop ring
      ctx.fillStyle = 'rgba(251, 191, 36, 0.24)';
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(18, sr * frac), 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = hasAegisInside ? '#38bdf8' : insidePlayers.length >= 2 ? '#fde047' : '#f43f5e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3.5;
      const soakText = hasAegisInside
        ? `AEGIS SOAK READY (0 DMG) · ${insidePlayers.length} IN`
        : `STACK IN METEOR RING! (${insidePlayers.length} IN · ${Math.round(68 / Math.max(1, insidePlayers.length))} DMG EA)`;
      ctx.strokeText(soakText, sx, sy - sr - 12);
      ctx.fillStyle = hasAegisInside ? '#7dd3fc' : insidePlayers.length >= 2 ? '#fde047' : '#fda4af';
      ctx.fillText(soakText, sx, sy - sr - 12);
    } else if (rt.boss.channelKind === 'cursed_miasma') {
      const bcx = rt.boss.x + rt.boss.size / 2;
      const bcy = rt.boss.y + rt.boss.size / 2;
      const pulse = 0.72 + Math.sin(now / 110) * 0.25;
      const outerR = Math.min(rt.arenaWidth, rt.arenaHeight) * 0.44;

      const miasmaGrad = ctx.createRadialGradient(bcx, bcy, 24, bcx, bcy, outerR);
      miasmaGrad.addColorStop(0, `rgba(163, 230, 53, ${0.24 * pulse})`);
      miasmaGrad.addColorStop(0.55, `rgba(126, 34, 206, ${0.18 * pulse})`);
      miasmaGrad.addColorStop(1, 'rgba(101, 163, 13, 0)');
      ctx.fillStyle = miasmaGrad;
      ctx.beginPath();
      ctx.arc(bcx, bcy, outerR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(163, 230, 53, ${0.7 * pulse})`;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([12, 8]);
      ctx.lineDashOffset = -(now / 28);
      ctx.beginPath();
      ctx.arc(bcx, bcy, Math.max(1, outerR * (0.45 + 0.55 * frac)), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.textAlign = 'center';
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3.5;
      const mTxt = `PLAGUE MIASMA · HOLY STAFF [E] PURIFIES (${rt.boss.channelHits || 0}/${rt.boss.channelHitsNeeded || 1})`;
      ctx.strokeText(mTxt, bcx, bcy - rt.boss.size * 0.65 - 16);
      ctx.fillStyle = '#bef264';
      ctx.fillText(mTxt, bcx, bcy - rt.boss.size * 0.65 - 16);
    } else if (rt.boss.channelKind === 'iron_carapace') {
      const bcx = rt.boss.x + rt.boss.size / 2;
      const bcy = rt.boss.y + rt.boss.size / 2;
      const shellR = rt.boss.size * 0.68;
      const plates = 6;
      const rot = now / 900;

      ctx.fillStyle = 'rgba(225, 29, 72, 0.14)';
      ctx.beginPath();
      ctx.arc(bcx, bcy, shellR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 4;
      for (let pi = 0; pi < plates; pi++) {
        const a0 = rot + (pi / plates) * Math.PI * 2 + 0.08;
        const a1 = rot + ((pi + 1) / plates) * Math.PI * 2 - 0.08;
        ctx.beginPath();
        ctx.arc(bcx, bcy, shellR, a0, a1);
        ctx.stroke();
      }

      ctx.textAlign = 'center';
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3.5;
      const cTxt = `IRON CARAPACE (50% ARMOR) · GREATSWORD BREAK (${rt.boss.channelHits || 0}/${rt.boss.channelHitsNeeded || 5})`;
      ctx.strokeText(cTxt, bcx, bcy - shellR - 14);
      ctx.fillStyle = '#fda4af';
      ctx.fillText(cTxt, bcx, bcy - shellR - 14);
    } else if (rt.boss.channelKind === 'blood_curse') {
      const pulse = 0.72 + Math.sin(now / 95) * 0.25;
      const outerR = Math.min(rt.arenaWidth, rt.arenaHeight) * 0.45;
      const bloodGrad = ctx.createRadialGradient(bcx, bcy, 20, bcx, bcy, outerR);
      bloodGrad.addColorStop(0, `rgba(244, 63, 94, ${0.26 * pulse})`);
      bloodGrad.addColorStop(0.6, `rgba(159, 18, 57, ${0.16 * pulse})`);
      bloodGrad.addColorStop(1, 'rgba(136, 19, 55, 0)');
      ctx.fillStyle = bloodGrad;
      ctx.beginPath();
      ctx.arc(bcx, bcy, outerR, 0, Math.PI * 2);
      ctx.fill();

      // Bleed rings around alive players
      for (const pl of rt.players) {
        if (pl.state !== 'alive') continue;
        const px = pl.x + pl.size / 2;
        const py = pl.y + pl.size / 2;
        ctx.strokeStyle = `rgba(251, 113, 133, ${0.72 * pulse})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px, py, 26 + Math.sin(now / 85) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.textAlign = 'center';
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3.5;
      const bTxt = `BLOOD CURSE BLEED · HOLY STAFF CLEANSES (${rt.boss.channelHits || 0}/${rt.boss.channelHitsNeeded || 1})`;
      ctx.strokeText(bTxt, bcx, bcy - rt.boss.size * 0.65 - 16);
      ctx.fillStyle = '#fda4af';
      ctx.fillText(bTxt, bcx, bcy - rt.boss.size * 0.65 - 16);
    } else if (rt.boss.channelKind === 'obsidian_phalanx') {
      const shellR = rt.boss.size * 0.72;
      const plates = 8;
      const rot = -(now / 720);

      ctx.fillStyle = 'rgba(225, 29, 72, 0.18)';
      ctx.beginPath();
      ctx.arc(bcx, bcy, shellR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 5;
      for (let pi = 0; pi < plates; pi++) {
        const a0 = rot + (pi / plates) * Math.PI * 2 + 0.06;
        const a1 = rot + ((pi + 1) / plates) * Math.PI * 2 - 0.06;
        ctx.beginPath();
        ctx.arc(bcx, bcy, shellR, a0, a1);
        ctx.stroke();
      }

      ctx.textAlign = 'center';
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3.5;
      const oTxt = `OBSIDIAN PHALANX (75% ARMOR) · GREATSWORD BREAK (${rt.boss.channelHits || 0}/${rt.boss.channelHitsNeeded || 5})`;
      ctx.strokeText(oTxt, bcx, bcy - shellR - 14);
      ctx.fillStyle = '#fda4af';
      ctx.fillText(oTxt, bcx, bcy - shellR - 14);
    }
    ctx.restore();
  }

  // Persistent Skill Zones (Holy Ground, Frost Trap, Arrow Rain)
  for (let i = 0; i < rt.skillZones.length; i++) {
    const sz = rt.skillZones[i];
    const lifeFrac = Math.max(0, Math.min(1, sz.timer / sz.maxTimer));
    ctx.save();
    if (sz.kind === 'holy_ground') {
      ctx.fillStyle = `rgba(251, 191, 36, ${0.14 * lifeFrac})`;
      ctx.beginPath();
      ctx.arc(sz.x, sz.y, sz.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(253, 224, 71, ${0.85 * lifeFrac})`;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([12, 8]);
      ctx.lineDashOffset = -(now / 30);
      ctx.stroke();
      ctx.setLineDash([]);
      // Inner sanctuary cross rune
      ctx.strokeStyle = `rgba(254, 240, 138, ${0.55 * lifeFrac})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sz.x - 18, sz.y);
      ctx.lineTo(sz.x + 18, sz.y);
      ctx.moveTo(sz.x, sz.y - 18);
      ctx.lineTo(sz.x, sz.y + 18);
      ctx.stroke();
    } else if (sz.kind === 'frost_trap') {
      ctx.fillStyle = `rgba(56, 189, 248, ${0.16 * lifeFrac})`;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + now / 1100;
        const px = sz.x + Math.cos(a) * sz.radius;
        const py = sz.y + Math.sin(a) * sz.radius;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgba(125, 211, 252, ${0.85 * lifeFrac})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (sz.kind === 'sanctuary_dome' || sz.kind === 'aegis_beacon') {
      const isBeacon = sz.kind === 'aegis_beacon';
      const pulse = 0.8 + Math.sin(now / 120) * 0.2;
      ctx.fillStyle = isBeacon ? `rgba(34, 211, 238, ${0.18 * lifeFrac})` : `rgba(56, 189, 248, ${0.15 * lifeFrac})`;
      ctx.beginPath();
      ctx.arc(sz.x, sz.y, sz.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isBeacon ? `rgba(253, 224, 71, ${0.9 * lifeFrac * pulse})` : `rgba(125, 211, 252, ${0.92 * lifeFrac * pulse})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(sz.x, sz.y, sz.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.45 * lifeFrac})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -(now / 28);
      ctx.beginPath();
      ctx.arc(sz.x, sz.y, Math.max(1, sz.radius - 10), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.textAlign = 'center';
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3.5;
      const domeText = isBeacon ? 'SAFE WARD · STAND INSIDE' : 'SANCTUARY DOME · SAFE';
      ctx.strokeText(domeText, sz.x, sz.y - sz.radius + 18);
      ctx.fillStyle = isBeacon ? '#fde047' : '#7dd3fc';
      ctx.fillText(domeText, sz.x, sz.y - sz.radius + 18);
    } else {
      // arrow_rain emerald barrage circle
      ctx.fillStyle = `rgba(52, 211, 153, ${0.14 * lifeFrac})`;
      ctx.beginPath();
      ctx.arc(sz.x, sz.y, sz.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(52, 211, 153, ${0.82 * lifeFrac})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = now / 25;
      ctx.stroke();
      ctx.setLineDash([]);
      // Animated falling emerald rain streaks
      ctx.strokeStyle = `rgba(167, 243, 208, ${0.75 * lifeFrac})`;
      ctx.lineWidth = 2;
      for (let rIdx = 0; rIdx < 7; rIdx++) {
        const ang = (rIdx / 7) * Math.PI * 2 + Math.floor(now / 120);
        const rad = ((rIdx * 37) % 75) * (sz.radius / 100);
        const ax = sz.x + Math.cos(ang) * rad;
        const ay = sz.y + Math.sin(ang) * rad - ((now / 3 + rIdx * 23) % 36);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - 3, ay + 16);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Online Campaign: Walkable Stone Dungeon Hallways + Next Floor Portal
  if (rt.isOnlineCampaign) {
    if (rt.gates.length > 0) {
      const aliveTotal = Math.max(1, rt.players.filter((pl) => pl.state === 'alive').length);
      const stoneFloor =
        realm === 'eclipse'
          ? '#100d24'
          : realm === 'oni'
          ? '#1b0705'
          : realm === 'void'
          ? '#140624'
          : '#0a1422';
      const stoneWall =
        realm === 'eclipse'
          ? '#1f1a3d'
          : realm === 'oni'
          ? '#320d09'
          : realm === 'void'
          ? '#260b44'
          : '#16283f';

      rt.gates.forEach((g) => {
        const gcx = g.x + g.width / 2;
        const gcy = g.y + g.height / 2;
        const pulse = 0.72 + Math.sin(now / 180) * 0.25;
        const hb = getGateHallwayBounds(g, rt.arenaWidth, rt.arenaHeight);

        ctx.save();
        if (hb && !g.isNextFloorPortal) {
          const isHoriz = g.dir === 'left' || g.dir === 'right';
          const outSign = g.dir === 'top' || g.dir === 'left' ? -1 : 1;

          // 1. Corridor stone floor slab extending outward from the room wall
          ctx.fillStyle = stoneFloor;
          ctx.fillRect(hb.corridorX, hb.corridorY, hb.corridorW, hb.corridorH);

          // Flagstone seam lines inside hallway
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          if (isHoriz) {
            for (let sx = hb.corridorX + 26; sx < hb.corridorX + hb.corridorW; sx += 28) {
              ctx.moveTo(sx, hb.corridorY + 6);
              ctx.lineTo(sx, hb.corridorY + hb.corridorH - 6);
            }
            ctx.moveTo(hb.corridorX, hb.corridorY + hb.corridorH * 0.5);
            ctx.lineTo(hb.corridorX + hb.corridorW, hb.corridorY + hb.corridorH * 0.5);
          } else {
            for (let sy = hb.corridorY + 26; sy < hb.corridorY + hb.corridorH; sy += 28) {
              ctx.moveTo(hb.corridorX + 6, sy);
              ctx.lineTo(hb.corridorX + hb.corridorW - 6, sy);
            }
            ctx.moveTo(hb.corridorX + hb.corridorW * 0.5, hb.corridorY);
            ctx.lineTo(hb.corridorX + hb.corridorW * 0.5, hb.corridorY + hb.corridorH);
          }
          ctx.stroke();

          // 2. Masonry hallway side & far back walls (entrance mouth stays open!)
          const wallThick = 8;
          ctx.fillStyle = stoneWall;
          ctx.strokeStyle = g.accent;
          ctx.lineWidth = g.playersInside.length > 0 ? 2.6 : 1.8;

          if (g.dir === 'top') {
            ctx.fillRect(hb.corridorX, hb.corridorY, wallThick, hb.corridorH);
            ctx.fillRect(hb.corridorX + hb.corridorW - wallThick, hb.corridorY, wallThick, hb.corridorH);
            ctx.fillRect(hb.corridorX, hb.corridorY, hb.corridorW, wallThick);
            ctx.beginPath();
            ctx.moveTo(hb.corridorX + wallThick, hb.corridorY + hb.corridorH);
            ctx.lineTo(hb.corridorX + wallThick, hb.corridorY + wallThick);
            ctx.lineTo(hb.corridorX + hb.corridorW - wallThick, hb.corridorY + wallThick);
            ctx.lineTo(hb.corridorX + hb.corridorW - wallThick, hb.corridorY + hb.corridorH);
            ctx.stroke();
          } else if (g.dir === 'bottom') {
            ctx.fillRect(hb.corridorX, hb.corridorY, wallThick, hb.corridorH);
            ctx.fillRect(hb.corridorX + hb.corridorW - wallThick, hb.corridorY, wallThick, hb.corridorH);
            ctx.fillRect(hb.corridorX, hb.corridorY + hb.corridorH - wallThick, hb.corridorW, wallThick);
            ctx.beginPath();
            ctx.moveTo(hb.corridorX + wallThick, hb.corridorY);
            ctx.lineTo(hb.corridorX + wallThick, hb.corridorY + hb.corridorH - wallThick);
            ctx.lineTo(hb.corridorX + hb.corridorW - wallThick, hb.corridorY + hb.corridorH - wallThick);
            ctx.lineTo(hb.corridorX + hb.corridorW - wallThick, hb.corridorY);
            ctx.stroke();
          } else if (g.dir === 'left') {
            ctx.fillRect(hb.corridorX, hb.corridorY, hb.corridorW, wallThick);
            ctx.fillRect(hb.corridorX, hb.corridorY + hb.corridorH - wallThick, hb.corridorW, wallThick);
            ctx.fillRect(hb.corridorX, hb.corridorY, wallThick, hb.corridorH);
            ctx.beginPath();
            ctx.moveTo(hb.corridorX + hb.corridorW, hb.corridorY + wallThick);
            ctx.lineTo(hb.corridorX + wallThick, hb.corridorY + wallThick);
            ctx.lineTo(hb.corridorX + wallThick, hb.corridorY + hb.corridorH - wallThick);
            ctx.lineTo(hb.corridorX + hb.corridorW, hb.corridorY + hb.corridorH - wallThick);
            ctx.stroke();
          } else {
            ctx.fillRect(hb.corridorX, hb.corridorY, hb.corridorW, wallThick);
            ctx.fillRect(hb.corridorX, hb.corridorY + hb.corridorH - wallThick, hb.corridorW, wallThick);
            ctx.fillRect(hb.corridorX + hb.corridorW - wallThick, hb.corridorY, wallThick, hb.corridorH);
            ctx.beginPath();
            ctx.moveTo(hb.corridorX, hb.corridorY + wallThick);
            ctx.lineTo(hb.corridorX + hb.corridorW - wallThick, hb.corridorY + wallThick);
            ctx.lineTo(hb.corridorX + hb.corridorW - wallThick, hb.corridorY + hb.corridorH - wallThick);
            ctx.lineTo(hb.corridorX, hb.corridorY + hb.corridorH - wallThick);
            ctx.stroke();
          }

          // 3. Stone archway pillars & flickering hallway torches
          const torchGlow = 0.55 + Math.sin(now / 95 + g.x + g.y) * 0.25;
          const pillars = isHoriz
            ? [
                { px: g.dir === 'left' ? 4 : rt.arenaWidth - 10, py: g.y - 4 },
                { px: g.dir === 'left' ? 4 : rt.arenaWidth - 10, py: g.y + g.height - 6 },
              ]
            : [
                { px: g.x - 4, py: g.dir === 'top' ? 4 : rt.arenaHeight - 10 },
                { px: g.x + g.width - 6, py: g.dir === 'top' ? 4 : rt.arenaHeight - 10 },
              ];
          pillars.forEach(({ px, py }) => {
            ctx.fillStyle = '#334155';
            ctx.fillRect(px, py, 10, 10);
            ctx.fillStyle = `rgba(251, 191, 36, ${torchGlow})`;
            ctx.beginPath();
            ctx.arc(px + 5, py + 5, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(px + 5, py + 5, 3.2, 0, Math.PI * 2);
            ctx.fill();
          });

          // 4. Directional floor chevron runes guiding movement through the corridor
          ctx.strokeStyle = g.accent;
          ctx.lineWidth = 2;
          for (let c = 0; c < 3; c++) {
            const animShift = ((now / 18 + c * 34) % 96) / 96;
            ctx.globalAlpha = (1 - animShift) * 0.65;
            const offset = 24 + c * 32;
            ctx.beginPath();
            if (isHoriz) {
              const cx = (g.dir === 'left' ? 0 : rt.arenaWidth) + outSign * offset;
              ctx.moveTo(cx - outSign * 8, gcy - 13);
              ctx.lineTo(cx + outSign * 6, gcy);
              ctx.lineTo(cx - outSign * 8, gcy + 13);
            } else {
              const cy = (g.dir === 'top' ? 0 : rt.arenaHeight) + outSign * offset;
              ctx.moveTo(gcx - 13, cy - outSign * 8);
              ctx.lineTo(gcx, cy + outSign * 6);
              ctx.lineTo(gcx + 13, cy - outSign * 8);
            }
            ctx.stroke();
          }
          ctx.globalAlpha = 1;

          // 5. Far Corridor Threshold Portal or Descending Stairs
          const thPad = wallThick + 2;
          const thx = hb.thresholdX + (g.dir === 'left' ? wallThick : isHoriz ? 0 : thPad);
          const thy = hb.thresholdY + (g.dir === 'top' ? wallThick : isHoriz ? thPad : 0);
          const thw = Math.max(18, hb.thresholdW - (isHoriz ? wallThick : thPad * 2));
          const thh = Math.max(18, hb.thresholdH - (isHoriz ? thPad * 2 : wallThick));

          ctx.fillStyle = `${g.accent}3a`;
          ctx.strokeStyle = g.accent;
          ctx.lineWidth = 2.4;
          ctx.globalAlpha = pulse;
          ctx.beginPath();
          ctx.roundRect(thx, thy, thw, thh, 6);
          ctx.fill();
          ctx.stroke();

          ctx.globalAlpha = 0.9;
          if (g.isStairsDown) {
            // Descending stone stair steps into purple underworld fog
            for (let s = 0; s < 5; s++) {
              const stepY = thy + 6 + s * ((thh - 12) / 5);
              const inset = 6 + s * 6;
              ctx.fillStyle = s % 2 === 0 ? 'rgba(192, 132, 252, 0.72)' : 'rgba(126, 34, 206, 0.65)';
              ctx.fillRect(thx + inset, stepY, Math.max(16, thw - inset * 2), 5);
            }
          } else {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.6;
            ctx.setLineDash([7, 6]);
            ctx.lineDashOffset = -(now / 30);
            ctx.strokeRect(thx + 4, thy + 4, thw - 8, thh - 8);
            ctx.setLineDash([]);
          }

          // Hold lock-in progress bar across corridor threshold
          if (g.holdProgress > 0) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#34d399';
            if (isHoriz) {
              ctx.fillRect(thx + 3, thy + 3, 6, (thh - 6) * g.holdProgress);
            } else {
              ctx.fillRect(thx + 3, thy + thh - 8, (thw - 6) * g.holdProgress, 5);
            }
          }
        } else {
          // Next-Floor Swirling Portal Pad
          ctx.fillStyle = `${g.accent}28`;
          ctx.strokeStyle = g.accent;
          ctx.lineWidth = g.playersInside.length > 0 ? 3.8 : 3.2;
          ctx.globalAlpha = pulse;
          ctx.beginPath();
          ctx.roundRect(g.x, g.y, g.width, g.height, 999);
          ctx.fill();
          ctx.stroke();

          ctx.globalAlpha = 0.85;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 6]);
          ctx.lineDashOffset = -(now / 35);
          ctx.beginPath();
          ctx.roundRect(g.x + 8, g.y + 8, g.width - 16, g.height - 16, 999);
          ctx.stroke();
          ctx.setLineDash([]);

          if (g.holdProgress > 0) {
            ctx.fillStyle = '#34d399';
            ctx.fillRect(g.x + 12, g.y + g.height - 10, (g.width - 24) * g.holdProgress, 4);
          }
        }

        // Destination Label & Party Readiness Count (clearly visible at archway mouth)
        const isVert = g.dir === 'left' || g.dir === 'right';
        const tx = g.isNextFloorPortal
          ? gcx
          : g.dir === 'left'
          ? 74
          : g.dir === 'right'
          ? rt.arenaWidth - 74
          : gcx;
        const ty = g.isNextFloorPortal
          ? g.y - 14
          : g.dir === 'top'
          ? 34
          : g.dir === 'bottom'
          ? rt.arenaHeight - 28
          : gcy - 4;

        ctx.textAlign = 'center';
        ctx.globalAlpha = 1;
        ctx.font = 'bold 9px "Press Start 2P", monospace';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 4;
        const tagSuffix = g.isStairsDown
          ? ' [STAIRS]'
          : g.clearedTarget
          ? ' [✓]'
          : g.visitedTarget
          ? ' [•]'
          : '';
        const titleTxt = `${g.label}${tagSuffix}`;
        ctx.strokeText(titleTxt, tx, ty);
        ctx.fillStyle = g.accent;
        ctx.fillText(titleTxt, tx, ty);

        ctx.font = 'bold 7.2px "JetBrains Mono", monospace';
        const subLine = `${g.subLabel} (${g.playersInside.length}/${aliveTotal})`;
        ctx.strokeText(subLine, tx, ty + (isVert ? 13 : 12));
        ctx.fillStyle = g.playersInside.length > 0 ? '#fde047' : '#cbd5e1';
        ctx.fillText(subLine, tx, ty + (isVert ? 13 : 12));
        ctx.restore();
      });
    }

    // 2. Interactive Merchant NPC (Gilded Broker Vex)
    if (rt.shopNpc) {
      const npc = rt.shopNpc;
      const pulse = 0.75 + Math.sin(now / 210) * 0.25;
      const nearby = rt.players.some(
        (pl) =>
          pl.state === 'alive' &&
          Math.hypot(pl.x + pl.size / 2 - npc.x, pl.y + pl.size / 2 - npc.y) <= npc.radius + 32
      );

      ctx.save();
      // Velvet merchant rug & lantern aura
      ctx.fillStyle = 'rgba(120, 53, 15, 0.36)';
      ctx.strokeStyle = nearby ? '#fde047' : '#fbbf24';
      ctx.lineWidth = nearby ? 3 : 2;
      ctx.beginPath();
      ctx.roundRect(npc.x - 95, npc.y - 44, 190, 94, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = `rgba(251, 191, 36, ${0.12 * pulse})`;
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, npc.radius + 14, 0, Math.PI * 2);
      ctx.fill();

      // Interaction radius dashed ring
      ctx.strokeStyle = nearby ? 'rgba(253, 224, 71, 0.75)' : 'rgba(251, 191, 36, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -(now / 35);
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, npc.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Stall table & wares icons
      ctx.fillStyle = '#451a03';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(npc.x - 54, npc.y + 12, 108, 22, 4);
      ctx.fill();
      ctx.stroke();

      // Hooded Merchant Sprite (Vex)
      ctx.fillStyle = '#312e81';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(npc.x, npc.y - 8, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing golden merchant eyes
      ctx.fillStyle = '#fde047';
      ctx.fillRect(npc.x - 6, npc.y - 10, 4, 4);
      ctx.fillRect(npc.x + 2, npc.y - 10, 4, 4);

      // Tiny wares displayed on wooden counter
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('⚗', npc.x - 32, npc.y + 27);
      ctx.fillStyle = '#c084fc';
      ctx.fillText('✦', npc.x, npc.y + 27);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('⚔', npc.x + 32, npc.y + 27);

      // Nameplate & Interactive Prompt
      ctx.textAlign = 'center';
      ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 4;
      ctx.strokeText(npc.name.toUpperCase(), npc.x, npc.y - 54);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(npc.name.toUpperCase(), npc.x, npc.y - 54);

      const promptTxt = nearby ? '[E] TALK TO MERCHANT (OPEN SHOP)' : 'WALK NEAR VEX & PRESS [E]';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.strokeText(promptTxt, npc.x, npc.y + 64);
      ctx.fillStyle = nearby ? '#6ee7b7' : '#e2e8f0';
      ctx.fillText(promptTxt, npc.x, npc.y + 64);
      ctx.restore();
    }

    // 3. Treasure Chests (tremble -> golden seam burst -> spring-hinged open lid & volumetric glow)
    rt.chests.forEach((ch) => {
      ctx.save();
      const s = ch.size;
      const openPhase = ch.opened ? ch.openAnim : 0;
      const isTremble = ch.opened && openPhase < 0.4;
      const isBurstOpen = ch.opened && openPhase >= 0.4;
      const shakeX = isTremble ? Math.sin(openPhase * 110) * (1.8 + openPhase * 6) : 0;
      const shakeY = isTremble ? Math.cos(openPhase * 85) * 1.4 : 0;
      const cx = ch.x + shakeX;
      const cy = ch.y + shakeY;

      if (!ch.opened) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.82 + Math.sin(now / 150) * 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (isTremble) {
        const tGlow = openPhase / 0.4;
        ctx.fillStyle = `rgba(253, 224, 71, ${(0.28 + tGlow * 0.42).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(cx, cy - 2, s * (0.9 + tGlow * 0.45), 0, Math.PI * 2);
        ctx.fill();
      } else if (isBurstOpen) {
        const beamFade = Math.max(0, 1 - (openPhase - 0.4) / 0.6);
        if (beamFade > 0.02) {
          const beamGrad = ctx.createLinearGradient(cx, cy - 6, cx, cy - 72);
          beamGrad.addColorStop(0, `rgba(253, 224, 71, ${(0.58 * beamFade).toFixed(2)})`);
          beamGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(cx - s * 0.36, cy - 4);
          ctx.lineTo(cx - s * 0.88, cy - 72);
          ctx.lineTo(cx + s * 0.88, cy - 72);
          ctx.lineTo(cx + s * 0.36, cy - 4);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Ground shadow
      ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
      ctx.beginPath();
      ctx.ellipse(cx, ch.y + s * 0.4, s * 0.56, s * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Chest lower body
      const bodyTop = cy - s * 0.12;
      const bodyH = s * 0.46;
      ctx.fillStyle = ch.opened ? '#451a03' : '#78350f';
      ctx.strokeStyle = isBurstOpen ? '#b45309' : '#fbbf24';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(cx - s / 2, bodyTop, s, bodyH, 4);
      ctx.fill();
      ctx.stroke();

      // Open dark cavity glow when lid springs back
      if (isBurstOpen) {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(cx - s / 2 + 3, bodyTop - 3, s - 6, 7);
        ctx.fillStyle = `rgba(253, 224, 71, ${Math.max(0.25, 0.9 - (openPhase - 0.4)).toFixed(2)})`;
        ctx.fillRect(cx - s / 2 + 5, bodyTop - 2, s - 10, 4);
      }

      // Chest lid (hinges upward when openPhase >= 0.4)
      const lidOpenProgress = isBurstOpen ? Math.min(1, (openPhase - 0.4) / 0.38) : 0;
      const lidLift = lidOpenProgress * 12;
      const lidSquash = 1 - lidOpenProgress * 0.42;
      ctx.save();
      ctx.translate(cx, bodyTop);
      ctx.scale(1, lidSquash);
      ctx.fillStyle = isBurstOpen ? '#5c2608' : '#92400e';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(-s / 2, -s * 0.34 - lidLift, s, s * 0.36, [6, 6, 2, 2]);
      ctx.fill();
      ctx.stroke();

      // Lid gold bands
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-s / 2 + 5, -s * 0.34 - lidLift, 4, s * 0.36);
      ctx.fillRect(s / 2 - 9, -s * 0.34 - lidLift, 4, s * 0.36);
      ctx.restore();

      // Seam light flash right before lid pops
      if (isTremble) {
        ctx.fillStyle = `rgba(254, 240, 138, ${(0.45 + (openPhase / 0.4) * 0.55).toFixed(2)})`;
        ctx.fillRect(cx - s / 2 + 2, bodyTop - 2, s - 4, 4);
      }

      // Clasp (locked until lid opens)
      if (!isBurstOpen) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(cx - s / 2, bodyTop - 2, s, 4);
        ctx.fillRect(cx - 4, bodyTop - 5, 8, 9);
      }

      if (!ch.opened) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 8px "Press Start 2P", monospace';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 3.5;
        ctx.strokeText('CHEST · WALK TO OPEN', cx, cy - s / 2 - 12);
        ctx.fillStyle = '#fde047';
        ctx.fillText('CHEST · WALK TO OPEN', cx, cy - s / 2 - 12);
      }
      ctx.restore();
    });

    // 4. Ground Exclusive Role Weapon Drops (with chest pop-out parabolic arc)
    rt.weaponDrops.forEach((wd) => {
      const wDef = WEAPONS_CATALOG.find((w) => w.id === wd.weaponId);
      const col = wDef?.accent || '#38bdf8';
      const hasPop = Boolean(wd.popTimer && wd.popTimer > 0 && wd.popDuration && wd.popDuration > 0);
      const popT = hasPop ? 1 - Math.max(0, Math.min(1, (wd.popTimer || 0) / (wd.popDuration || 1))) : 1;
      const baseX = hasPop && wd.popFromX !== undefined ? wd.popFromX + (wd.x - wd.popFromX) * popT : wd.x;
      const baseY = hasPop && wd.popFromY !== undefined ? wd.popFromY + (wd.y - wd.popFromY) * popT : wd.y;
      const arcLift = hasPop ? Math.sin(popT * Math.PI) * (wd.popArcHeight || 48) : 0;
      const bobY = hasPop ? 0 : Math.sin(wd.bob) * 4;
      const wx = baseX;
      const wy = baseY - arcLift + bobY;
      const popScale = hasPop ? 0.72 + Math.sin(popT * Math.PI) * 0.34 + popT * 0.28 : 1;

      ctx.save();
      if (hasPop) {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
        ctx.beginPath();
        ctx.ellipse(baseX, baseY + 10, 12, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.translate(wx, wy);
      ctx.scale(popScale, popScale);

      ctx.fillStyle = `${col}2e`;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = col;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚔', 0, 1);
      ctx.textBaseline = 'alphabetic';
      ctx.restore();

      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3.5;
      const title = wDef?.name.toUpperCase() || 'WEAPON';
      ctx.strokeText(title, wx, wy - 22);
      ctx.fillStyle = col;
      ctx.fillText(title, wx, wy - 22);

      if (!hasPop) {
        const nearArmed = rt.players.some(
          (pl) => pl.state === 'alive' && pl.weapon !== 'none' && Math.hypot(pl.x + pl.size / 2 - wd.x, pl.y + pl.size / 2 - wd.y) <= 56
        );
        const hint = nearArmed ? '[E] SWAP WEAPON' : 'WALK TO EQUIP';
        ctx.font = 'bold 8px "JetBrains Mono", monospace';
        ctx.strokeText(hint, wx, wy + 26);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(hint, wx, wy + 26);
      }
      ctx.restore();
    });

    // 5. Weapon-Specific Skill Scrolls (with chest pop-out parabolic arc)
    rt.scrollDrops.forEach((sd) => {
      const wDef = WEAPONS_CATALOG.find((w) => w.id === sd.targetWeapon);
      const scrollCol = wDef?.accent || '#c084fc';
      const wShort = wDef?.shortTag || 'CLASS';
      const hasPop = Boolean(sd.popTimer && sd.popTimer > 0 && sd.popDuration && sd.popDuration > 0);
      const popT = hasPop ? 1 - Math.max(0, Math.min(1, (sd.popTimer || 0) / (sd.popDuration || 1))) : 1;
      const baseX = hasPop && sd.popFromX !== undefined ? sd.popFromX + (sd.x - sd.popFromX) * popT : sd.x;
      const baseY = hasPop && sd.popFromY !== undefined ? sd.popFromY + (sd.y - sd.popFromY) * popT : sd.y;
      const arcLift = hasPop ? Math.sin(popT * Math.PI) * (sd.popArcHeight || 52) : 0;
      const bobY = hasPop ? 0 : Math.sin(sd.bob) * 4.5;
      const sx = baseX;
      const sy = baseY - arcLift + bobY;
      const popScale = hasPop ? 0.72 + Math.sin(popT * Math.PI) * 0.36 + popT * 0.28 : 1;

      ctx.save();
      if (hasPop) {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
        ctx.beginPath();
        ctx.ellipse(baseX, baseY + 12, 12, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.translate(sx, sy);
      ctx.scale(popScale, popScale);

      ctx.fillStyle = `${scrollCol}30`;
      ctx.beginPath();
      ctx.arc(0, 0, 23 + Math.sin(now / 140) * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Rotating arcane rune ring
      ctx.strokeStyle = scrollCol;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = -(now / 32);
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Glowing class-bound parchment scroll
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = scrollCol;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-10, -12, 20, 24, 4);
      ctx.fill();
      ctx.stroke();

      // Top & bottom scroll rollers
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-12, -13, 24, 3);
      ctx.fillRect(-12, 10, 24, 3);

      // Class-colored rune script lines
      ctx.fillStyle = scrollCol;
      ctx.fillRect(-6, -5, 12, 2.5);
      ctx.fillRect(-6, 0, 12, 2.5);
      ctx.fillRect(-6, 5, 8, 2.5);
      ctx.restore();

      const slotKey = sd.skillSlot === 2 ? 'Q' : sd.skillSlot === 3 ? 'R' : 'F';
      const skName = wDef?.skills[sd.skillSlot - 1]?.shortName || `S${sd.skillSlot}`;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3.5;
      const topTag = `${wShort} [${slotKey}] SCROLL`;
      ctx.strokeText(topTag, sx, sy - 23);
      ctx.fillStyle = scrollCol;
      ctx.fillText(topTag, sx, sy - 23);

      const holderNeedsIt = rt.players.some(
        (pl) =>
          pl.state === 'alive' &&
          pl.weapon === sd.targetWeapon &&
          !(pl.learnedSkills?.[sd.targetWeapon] || [1]).includes(sd.skillSlot)
      );
      const subHint = holderNeedsIt ? `${skName.toUpperCase()} · BAG [I]` : `STORE IN BAG [I]`;
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.strokeText(subHint, sx, sy + 28);
      ctx.fillStyle = '#fde68a';
      ctx.fillText(subHint, sd.x, sy + 28);
      ctx.restore();
    });
  }

  // Void Curtain Edge Warning & Safe-Gap Lane Telegraph (helps player see wall origin & gaps immediately)
  if (
    rt.isBossLevel &&
    rt.bossType === 'void' &&
    rt.boss.attackPattern === 'wall' &&
    rt.boss.wallDirection &&
    (rt.boss.state === 'telegraph' || (rt.boss.state === 'attacking' && rt.boss.attackTimer < 1.15))
  ) {
    const wd = rt.boss.wallDirection;
    const isP2 = rt.boss.phase === 2;
    const np = isP2 ? 22 : 18;
    const pulse = 0.35 + Math.abs(Math.sin(now / 90)) * 0.45;
    ctx.save();
    if (wd.isHorizontal) {
      const edgeX = (wd.dirX || 1) > 0 ? 0 : rt.arenaWidth;
      const dir = wd.dirX || 1;
      // Glowing hazard band on spawning wall
      ctx.fillStyle = `rgba(192, 132, 252, ${pulse * 0.35})`;
      ctx.fillRect(dir > 0 ? 0 : rt.arenaWidth - 38, 0, 38, rt.arenaHeight);
      // Sweeping chevrons + subtle safe gap highlights (indices 4,5 and np-5,np-6)
      for (let i = 0; i < np; i++) {
        const py = (i / np) * rt.arenaHeight + rt.arenaHeight / (np * 2);
        const isGap = i === 4 || i === 5 || i === np - 5 || i === np - 6;
        if (isGap) {
          ctx.strokeStyle = `rgba(34, 211, 238, ${pulse * 0.55})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([12, 12]);
          ctx.beginPath();
          ctx.moveTo(0, py);
          ctx.lineTo(rt.arenaWidth, py);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (i % 2 === 0) {
          const ax = edgeX + dir * 24;
          ctx.strokeStyle = `rgba(216, 180, 254, ${pulse})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ax - dir * 8, py - 8);
          ctx.lineTo(ax + dir * 6, py);
          ctx.lineTo(ax - dir * 8, py + 8);
          ctx.stroke();
        }
      }
    } else {
      const edgeY = (wd.dirY || 1) > 0 ? 0 : rt.arenaHeight;
      const dir = wd.dirY || 1;
      ctx.fillStyle = `rgba(192, 132, 252, ${pulse * 0.35})`;
      ctx.fillRect(0, dir > 0 ? 0 : rt.arenaHeight - 38, rt.arenaWidth, 38);
      for (let i = 0; i < np; i++) {
        const px = (i / np) * rt.arenaWidth + rt.arenaWidth / (np * 2);
        const isGap = i === 4 || i === 5 || i === np - 5 || i === np - 6;
        if (isGap) {
          ctx.strokeStyle = `rgba(34, 211, 238, ${pulse * 0.55})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([12, 12]);
          ctx.beginPath();
          ctx.moveTo(px, 0);
          ctx.lineTo(px, rt.arenaHeight);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (i % 2 === 0) {
          const ay = edgeY + dir * 24;
          ctx.strokeStyle = `rgba(216, 180, 254, ${pulse})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(px - 8, ay - dir * 8);
          ctx.lineTo(px, ay + dir * 6);
          ctx.lineTo(px + 8, ay - dir * 8);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  // Telegraph Lines (Railgun Locks, Iaido Katana Cuts, Void Rifts)
  for (let i = 0; i < rt.telegraphLines.length; i++) {
    const tl = rt.telegraphLines[i];
    if (tl.timer > 0) {
      const frac = 1 - tl.timer / tl.maxTimer;
      ctx.strokeStyle = tl.color;
      ctx.globalAlpha = 0.25 + frac * 0.6;
      ctx.lineWidth = 2 + frac * 2;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(tl.x1, tl.y1);
      ctx.lineTo(tl.x2, tl.y2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // Flash beam on fire!
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = tl.color;
      ctx.lineWidth = tl.width * 1.4;
      ctx.beginPath();
      ctx.moveTo(tl.x1, tl.y1);
      ctx.lineTo(tl.x2, tl.y2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = tl.width * 0.45;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Dash Trails (zero save/restore)
  for (let pi = 0; pi < rt.players.length; pi++) {
    const p = rt.players[pi];
    for (let ti = 0; ti < p.dashTrail.length; ti++) {
      const t = p.dashTrail[ti];
      ctx.globalAlpha = t.alpha * 0.55;
      ctx.fillStyle = t.color;
      ctx.fillRect(t.x + 4, t.y + 4, p.size - 8, p.size - 8);
    }
  }
  ctx.globalAlpha = 1;

  // Void Decoys (Phantom passive)
  for (let i = 0; i < rt.voidDecoys.length; i++) {
    const vd = rt.voidDecoys[i];
    const frac = Math.max(0, Math.min(1, vd.timer / (vd.maxTimer || 1)));
    ctx.strokeStyle = vd.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(vd.x, vd.y, Math.max(1, 16 + (1 - frac) * 26), 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#a855f7';
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.moveTo(vd.x, vd.y - 14);
    ctx.lineTo(vd.x + 12, vd.y);
    ctx.lineTo(vd.x, vd.y + 14);
    ctx.lineTo(vd.x - 12, vd.y);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Medkits
  for (let i = 0; i < rt.medkits.length; i++) {
    const m = rt.medkits[i];
    const bobY = Math.sin(now / 320 + m.bob) * 4;
    const cx = m.x + m.size / 2;
    const cy = m.y + m.size / 2 + bobY;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(m.x, m.y + bobY, m.size, m.size);
    ctx.fillStyle = '#10b981';
    const cw = m.size * 0.28;
    ctx.fillRect(m.x + 3, m.y + bobY + m.size / 2 - cw / 2, m.size - 6, cw);
    ctx.fillRect(m.x + m.size / 2 - cw / 2, m.y + bobY + 3, cw, m.size - 6);
  }

  // Power-Up Relics
  for (let i = 0; i < rt.relics.length; i++) {
    const r = rt.relics[i];
    const bobY = Math.sin(now / 260 + r.bob) * 5;
    const cx = r.x + r.size / 2;
    const cy = r.y + r.size / 2 + bobY;
    const col =
      r.type === 'overdrive'
        ? '#facc15'
        : r.type === 'shield'
        ? '#38bdf8'
        : r.type === 'magnet'
        ? '#c084fc'
        : '#22d3ee';
    const lbl = r.type === 'overdrive' ? '⚡' : r.type === 'shield' ? '⛨' : r.type === 'magnet' ? '◎' : '✦';

    ctx.fillStyle = `${col}33`;
    ctx.beginPath();
    ctx.arc(cx, cy, r.size / 2 + 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = col;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lbl, cx, cy + 1);
  }
  ctx.textBaseline = 'alphabetic';

  // Knives / Blade Orbs
  const showKnives = !rt.isBossLevel || rt.boss.state !== 'comic_intro';
  if (showKnives) {
    for (let i = 0; i < rt.knives.length; i++) {
      const k = rt.knives[i];
      if (viewerPlayerId !== undefined && k.owner !== viewerPlayerId) continue;
      const ownerP = rt.players.find((p) => p.id === k.owner);
      if (ownerP && ownerP.hasKnife) continue;
      const bobY = Math.sin(k.bobPhase) * 3.5;
      const cx = k.x + k.size / 2;
      const cy = k.y + k.size / 2 + bobY;

      // Pulsing beacon ring so Blade Orbs stand out in bullet storms
      const beaconR = k.size / 2 + 10 + Math.sin(now / 140) * 4;
      ctx.strokeStyle = k.color;
      ctx.globalAlpha = 0.45 + Math.sin(now / 140) * 0.25;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(cx, cy, beaconR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = k.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, k.size / 2 + 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = k.color;
      ctx.beginPath();
      ctx.arc(cx, cy, k.size / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 8);
      ctx.lineTo(cx + 4, cy + 2);
      ctx.lineTo(cx, cy + 8);
      ctx.lineTo(cx - 4, cy + 2);
      ctx.closePath();
      ctx.fill();

      // Overhead marker arrow for quick pickup clarity
      ctx.fillStyle = k.color;
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▼', cx, cy - 18 + Math.sin(now / 160) * 2);
    }
  }

  // Enemies (with Training Dummy target brackets in Tutorial Mode)
  if (!rt.isBossLevel) {
    for (let i = 0; i < rt.enemies.length; i++) {
      const en = rt.enemies[i];
      drawEnemySprite(ctx, en, now);
      if (rt.isTutorial) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(en.x - 4, en.y - 4, en.size + 8, en.size + 8);
      }
    }
  }

  // Boss
  if (rt.isBossLevel) {
    if (rt.bossType === 'mecha') drawMechaBoss(ctx, rt, now);
    else if (rt.bossType === 'void') drawVoidPhantom(ctx, rt, now);
    else if (rt.bossType === 'eclipse') drawEclipseBoss(ctx, rt, now);
    else drawOniBoss(ctx, rt, now);

    // Boss Tactical Teamwork Channel Visual around Boss
    if (rt.boss.channelKind && rt.boss.health > 0 && rt.boss.state !== 'dead') {
      const bcx = rt.boss.x + rt.boss.size / 2;
      const bcy = rt.boss.y + rt.boss.size / 2;
      const maxT = rt.boss.channelMaxTimer || 3.5;
      const frac = 1 - Math.max(0, Math.min(1, (rt.boss.channelTimer || 0) / maxT));
      ctx.save();
      if (
        rt.boss.channelKind === 'interrupt' ||
        rt.boss.channelKind === 'emp_interrupt' ||
        rt.boss.channelKind === 'mirage_ambush'
      ) {
        ctx.strokeStyle =
          rt.boss.channelKind === 'emp_interrupt'
            ? 'rgba(232, 121, 249, 0.92)'
            : rt.boss.channelKind === 'mirage_ambush'
            ? 'rgba(192, 132, 252, 0.94)'
            : 'rgba(192, 132, 252, 0.85)';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 6]);
        ctx.lineDashOffset = -(now / 22);
        ctx.beginPath();
        ctx.arc(bcx, bcy, rt.boss.size * 0.76, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        const ringColor =
          rt.boss.channelKind === 'siege_beam'
            ? '#38bdf8'
            : rt.boss.channelKind === 'cursed_floor' || rt.boss.channelKind === 'meteor_soak'
            ? '#fbbf24'
            : rt.boss.channelKind === 'bow_weakpoint' || rt.boss.channelKind === 'sky_battery'
            ? '#34d399'
            : rt.boss.channelKind === 'cursed_miasma'
            ? '#a3e635'
            : rt.boss.channelKind === 'iron_carapace' || rt.boss.channelKind === 'obsidian_phalanx'
            ? '#f43f5e'
            : rt.boss.channelKind === 'blood_curse'
            ? '#fb7185'
            : rt.boss.channelKind === 'abyss_tether' || rt.boss.channelKind === 'gravity_storm'
            ? '#c084fc'
            : rt.boss.channelKind === 'demon_seal_purge'
            ? '#fb923c'
            : '#f43f5e';
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(bcx, bcy, rt.boss.size * 0.72, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - frac));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Player Projectiles (Crescent, Cataclysm Wave, Arc Bolt, Ranger/Sniper Arrow, Shadow Kunai, Frost Shard)
  for (let i = 0; i < rt.playerProjectiles.length; i++) {
    const pp = rt.playerProjectiles[i];
    ctx.save();
    ctx.translate(pp.x, pp.y);
    ctx.rotate(pp.angle);
    if (pp.kind === 'crescent' || pp.kind === 'cataclysm') {
      ctx.strokeStyle = `${pp.color}66`;
      ctx.lineWidth = pp.kind === 'cataclysm' ? 16 : 11;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(-10, 0, pp.radius + 3, -1.08, 1.08);
      ctx.stroke();

      ctx.strokeStyle = pp.color;
      ctx.lineWidth = pp.kind === 'cataclysm' ? 11 : 7;
      ctx.beginPath();
      ctx.arc(-8, 0, pp.radius, -1.05, 1.05);
      ctx.stroke();

      ctx.strokeStyle = pp.kind === 'cataclysm' ? '#fef08a' : '#ffffff';
      ctx.lineWidth = pp.kind === 'cataclysm' ? 4.5 : 3;
      ctx.stroke();
    } else if (pp.kind === 'ranger_arrow' || pp.kind === 'sniper_arrow') {
      const isSniper = pp.kind === 'sniper_arrow';
      if (isSniper) {
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.5)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-42, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(-6, 0, 5, 11, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = isSniper ? '#fef08a' : '#34d399';
      ctx.strokeStyle = '#ecfdf5';
      ctx.lineWidth = isSniper ? 2.4 : 1.6;
      const sx = isSniper ? 1.45 : 1;
      ctx.beginPath();
      ctx.moveTo(18 * sx, 0);
      ctx.lineTo(4 * sx, -5);
      ctx.lineTo(7 * sx, -1.5);
      ctx.lineTo(-14 * sx, -1.5);
      ctx.lineTo(-18 * sx, -5);
      ctx.lineTo(-14 * sx, 0);
      ctx.lineTo(-18 * sx, 5);
      ctx.lineTo(-14 * sx, 1.5);
      ctx.lineTo(7 * sx, 1.5);
      ctx.lineTo(4 * sx, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (pp.kind === 'shadow_kunai') {
      ctx.fillStyle = pp.color || '#c084fc';
      ctx.strokeStyle = '#faf5ff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-4, -5);
      ctx.lineTo(-12, 0);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (pp.kind === 'frost_shard') {
      ctx.fillStyle = pp.color || '#38bdf8';
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(0, -6);
      ctx.lineTo(-15, 0);
      ctx.lineTo(0, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Arc Bolt
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-6, -6);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // Boss Projectiles (OPTIMIZED with cached offscreen glow sprites & custom silhouettes!)
  for (let i = 0; i < rt.bossProjectiles.length; i++) {
    const proj = rt.bossProjectiles[i];
    if (!proj) continue;

    if (proj.type === 'phantom_clone') {
      ctx.globalAlpha = 0.72 + Math.sin(now / 100) * 0.2;
      const pcx = proj.x + proj.size / 2;
      const pcy = proj.y + proj.size / 2;
      const pr = proj.size / 2;
      ctx.fillStyle = '#120324';
      ctx.strokeStyle = rt.boss.phase === 2 ? '#f43f5e' : '#c084fc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(pcx, pcy - pr);
      ctx.lineTo(pcx + pr * 0.85, pcy);
      ctx.lineTo(pcx + pr * 0.5, pcy + pr);
      ctx.lineTo(pcx - pr * 0.5, pcy + pr);
      ctx.lineTo(pcx - pr * 0.85, pcy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(pcx - 7, pcy - 4, 4, 3);
      ctx.fillRect(pcx + 3, pcy - 4, 4, 3);
      ctx.globalAlpha = 1;
    } else if (proj.type === 'mine') {
      const isArmed = !!proj.armed;
      const warnFrac = (proj.timer || 0) / (proj.warningTime || 1.7);
      const mcx = proj.x + proj.size / 2;
      const mcy = proj.y + proj.size / 2;
      const mr = proj.size / 2;

      if (!isArmed) {
        const pulseR = 36 * (1 - warnFrac);
        ctx.strokeStyle = `rgba(250, 204, 21, ${0.65 * (1 - warnFrac)})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(mcx, mcy, mr + pulseR, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Trigger zone ring
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(mcx, mcy, 54, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Octagonal Armored Hazard Pod
      ctx.fillStyle = isArmed ? '#450a0a' : '#1e293b';
      ctx.strokeStyle = isArmed ? proj.color : '#94a3b8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
        const px = mcx + Math.cos(a) * mr;
        const py = mcy + Math.sin(a) * mr;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isArmed ? '#ef4444' : '#facc15';
      ctx.beginPath();
      ctx.arc(mcx, mcy, mr * 0.35, 0, Math.PI * 2);
      ctx.fill();

      if (!isArmed) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(mcx, mcy, mr + 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * warnFrac);
        ctx.stroke();
      }
    } else if (proj.type === 'boomerang') {
      ctx.save();
      ctx.translate(proj.x + proj.size / 2, proj.y + proj.size / 2);
      ctx.rotate((proj.age || 0) * 12);
      ctx.fillStyle = '#082f49';
      ctx.strokeStyle = proj.color;
      ctx.lineWidth = 2.5;
      // Dual curved crescent umbral scythes
      for (let bSide = 0; bSide < 2; bSide++) {
        ctx.rotate(Math.PI);
        ctx.beginPath();
        ctx.moveTo(-proj.size * 0.65, 0);
        ctx.quadraticCurveTo(0, -proj.size * 0.68, proj.size * 0.65, -proj.size * 0.1);
        ctx.quadraticCurveTo(0, -proj.size * 0.25, -proj.size * 0.65, 0);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      const shape = proj.shape || 'orb';
      const sprite = getBulletSprite(shape, proj.color, proj.size);
      if (shape === 'missile' || shape === 'lance' || shape === 'shard') {
        const cxp = proj.x + proj.size / 2;
        const cyp = proj.y + proj.size / 2;
        ctx.save();
        ctx.translate(cxp, cyp);
        ctx.rotate(Math.atan2(proj.dy, proj.dx));
        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        ctx.restore();
      } else {
        const halfDiff = (sprite.width - proj.size) / 2;
        ctx.drawImage(sprite, proj.x - halfDiff, proj.y - halfDiff);
      }
    }
  }

  // Players
  for (let i = 0; i < rt.players.length; i++) {
    drawHeroSprite(ctx, rt.players[i], now);
  }

  // Slash Arcs (two-pass glow, zero shadowBlur)
  for (let i = 0; i < rt.slashArcs.length; i++) {
    const arc = rt.slashArcs[i];
    ctx.globalAlpha = arc.alpha;
    ctx.lineCap = 'round';
    ctx.strokeStyle = arc.color;
    ctx.lineWidth = 10 * arc.alpha;
    ctx.beginPath();
    ctx.arc(arc.x, arc.y, arc.radius, arc.angle - 1.1, arc.angle + 1.1);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4 * arc.alpha;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Particles (batched flat quads)
  for (let i = 0; i < rt.dustParticles.length; i++) {
    const d = rt.dustParticles[i];
    ctx.globalAlpha = Math.max(0, d.alpha);
    ctx.fillStyle = d.color || '#cbd5e1';
    ctx.fillRect(d.x - 2, d.y - 2, d.size || 4, d.size || 4);
  }
  ctx.globalAlpha = 1;

  // Death Effects
  for (let i = 0; i < rt.deathEffects.length; i++) {
    const e = rt.deathEffects[i];
    if (e.type === 'shockwave') {
      ctx.globalAlpha = Math.max(0, e.alpha * 0.65);
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius || 10, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.globalAlpha = Math.max(0, e.alpha);
      ctx.fillStyle = e.color;
      ctx.fillRect(e.x - (e.size || 4) / 2, e.y - (e.size || 4) / 2, e.size || 4, e.size || 4);
    }
  }
  ctx.globalAlpha = 1;

  // Void Rifts
  for (let i = 0; i < rt.voidRifts.length; i++) {
    const r = rt.voidRifts[i];
    ctx.globalAlpha = Math.max(0, r.alpha);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.size, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Energy Waves
  for (let i = 0; i < rt.energyWaves.length; i++) {
    const w = rt.energyWaves[i];
    ctx.strokeStyle = w.color;
    ctx.globalAlpha = Math.max(0, w.alpha);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Comic Slashes
  for (let i = 0; i < rt.comicSlashes.length; i++) {
    const slash = rt.comicSlashes[i];
    ctx.globalAlpha = slash.alpha;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = slash.thickness;
    ctx.lineCap = 'round';
    const ex = slash.x + Math.cos(slash.angle) * slash.length;
    const ey = slash.y + Math.sin(slash.angle) * slash.length;
    ctx.beginPath();
    ctx.moveTo(slash.x, slash.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Floating Combat Text
  ctx.textAlign = 'center';
  for (let i = 0; i < rt.floatingTexts.length; i++) {
    const f = rt.floatingTexts[i];
    ctx.globalAlpha = Math.max(0, f.alpha);
    ctx.font = `bold ${Math.round(10 * f.scale)}px "Press Start 2P", monospace`;
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 4;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;

  // End world-space camera transform; draw screen-space overlays & cinematics fixed to viewport
  ctx.restore();

  // Off-screen directional waypoint indicators for Blade Orbs, Relics, Medkits, and Torii Shrines
  drawDirectionalIndicators(ctx, rt, now, viewerPlayerId);

  if (rt.isBossLevel && rt.boss.state === 'dead') {
    const deadBarH = Math.round(Math.min(1, rt.bossDeadTimer / 0.45) * 44);
    ctx.fillStyle = '#020106';
    ctx.fillRect(0, 0, viewW, deadBarH);
    ctx.fillRect(0, viewH - deadBarH, viewW, deadBarH);

    // Reveal triumphant Souls-style banner once core overload peaks (1.2s -> 4.2s)
    if (rt.bossDeadTimer >= 1.2) {
      const revealAlpha = Math.min(1, (rt.bossDeadTimer - 1.2) / 0.65);
      const bannerTitle =
        rt.bossType === 'mecha'
          ? 'DREADNOUGHT OBLITERATED'
          : rt.bossType === 'void'
          ? 'RIFT SOVEREIGN BANISHED'
          : rt.bossType === 'eclipse'
          ? 'THE ECLIPSE SHATTERED'
          : 'DEMON SHOGUN FELLED';
      const bannerCol =
        rt.bossType === 'mecha'
          ? '#7dd3fc'
          : rt.bossType === 'void'
          ? '#e879f9'
          : rt.bossType === 'eclipse'
          ? '#fde047'
          : '#fb923c';

      ctx.save();
      ctx.globalAlpha = revealAlpha;
      const bgGrad = ctx.createLinearGradient(0, viewH / 2 - 48, 0, viewH / 2 + 48);
      bgGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      bgGrad.addColorStop(0.25, 'rgba(0, 0, 0, 0.82)');
      bgGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0.82)');
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, viewH / 2 - 48, viewW, 96);

      ctx.strokeStyle = `${bannerCol}99`;
      ctx.lineWidth = 2;
      const lineSpread = Math.min(viewW * 0.25, 120 + (1 - revealAlpha) * 140);
      ctx.beginPath();
      ctx.moveTo(lineSpread, viewH / 2 - 36);
      ctx.lineTo(viewW - lineSpread, viewH / 2 - 36);
      ctx.moveTo(lineSpread, viewH / 2 + 36);
      ctx.lineTo(viewW - lineSpread, viewH / 2 + 36);
      ctx.stroke();

      const titleFontPx = viewW < 640 ? 22 : 34;
      ctx.font = `bold ${titleFontPx}px "Cinzel", Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 5;
      ctx.strokeText(bannerTitle, viewW / 2, viewH / 2 + 10);
      ctx.fillStyle = bannerCol;
      ctx.fillText(bannerTitle, viewW / 2, viewH / 2 + 10);
      ctx.restore();
    }
  }

  if (rt.warningFlash > 0) {
    ctx.fillStyle = `rgba(251, 191, 36, ${Math.min(0.22, rt.warningFlash * 0.55)})`;
    ctx.fillRect(0, 0, viewW, viewH);
  }

  // Distinct Per-Boss 8-Second Anime / Movie Villain Cinematic Entrance Overlays
  if (rt.isBossLevel && rt.boss.state === 'comic_intro') {
    const b = rt.boss;
    const elapsed = Math.max(0, 7.4 - b.stateTimer);
    const barEase =
      elapsed < 0.45 ? elapsed / 0.45 : b.stateTimer < 0.35 ? Math.max(0, b.stateTimer / 0.35) : 1;
    const barH = Math.round(50 * barEase);

    if (rt.bossType === 'mecha') {
      // MECHA: Cybernetic Military Radar HUD Lockdown & Diagonal Hazard Dossier
      ctx.fillStyle = 'rgba(2, 8, 18, 0.25)';
      ctx.fillRect(0, 0, viewW, viewH);

      // Sweeping sonar scanline
      const scanY = (elapsed * 290) % viewH;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.fillRect(0, scanY, viewW, 6);

      // Tactical corner brackets
      ctx.strokeStyle = b.entryPhase >= 2 ? 'rgba(239, 68, 68, 0.72)' : 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 3;
      const m = 24;
      const bl = 36;
      ctx.beginPath();
      ctx.moveTo(m, m + bl); ctx.lineTo(m, m); ctx.lineTo(m + bl, m);
      ctx.moveTo(viewW - m - bl, m); ctx.lineTo(viewW - m, m); ctx.lineTo(viewW - m, m + bl);
      ctx.moveTo(m, viewH - m - bl); ctx.lineTo(m, viewH - m); ctx.lineTo(m + bl, viewH - m);
      ctx.moveTo(viewW - m - bl, viewH - m); ctx.lineTo(viewW - m, viewH - m); ctx.lineTo(viewW - m, viewH - m - bl);
      ctx.stroke();

      if (b.entryPhase < 3) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('TARGET LOCK // ORBITAL DROP IMMINENT', 34, 48);
      }

      ctx.fillStyle = '#020611';
      ctx.fillRect(0, 0, viewW, barH);
      ctx.fillRect(0, viewH - barH, viewW, barH);

      if (rt.bossNameReveal) {
        const vDef = getBossVariantDef('mecha', b.variantId);
        const boxTop = viewH - 182;
        const padX = Math.min(40, Math.round(viewW * 0.04));
        const slant = Math.min(46, Math.round(viewW * 0.05));
        ctx.fillStyle = 'rgba(4, 12, 24, 0.92)';
        ctx.beginPath();
        ctx.moveTo(padX, boxTop + 114);
        ctx.lineTo(padX + slant, boxTop);
        ctx.lineTo(viewW - padX, boxTop);
        ctx.lineTo(viewW - padX - slant, boxTop + 114);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = vDef.accent;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        const txLeft = padX + slant + 24;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText(`UNIT-01 // ${vDef.shortName} · ${vDef.subtitle.toUpperCase()}`, txLeft, boxTop + 24);

        ctx.fillStyle = '#f8fafc';
        ctx.font = `bold ${viewW < 640 ? 24 : 36}px "Cinzel", Georgia, serif`;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.strokeText('IRON DESTROYER', txLeft, boxTop + 62);
        ctx.fillText('IRON DESTROYER', txLeft, boxTop + 62);

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText(`RECOMMENDED GEAR: ${vDef.suggestedLabel.toUpperCase()}`, txLeft, boxTop + 88);

        ctx.fillStyle = '#bae6fd';
        ctx.font = 'italic 11px "JetBrains Mono", monospace';
        ctx.fillText('“TARGET ACQUIRED. INITIATING ORBITAL ANNIHILATION.”', txLeft, boxTop + 106);
      }
    } else if (rt.bossType === 'void') {
      // VOID: Reality Fracture Vignette -> Sudden Darkness Stare -> Ghostly Echo Cut-In
      const blackoutAlpha = b.entryPhase === 2 ? 0.86 : 0.62;
      const vig = ctx.createRadialGradient(viewW / 2, viewH * 0.44, b.entryPhase === 2 ? 68 : 130, viewW / 2, viewH * 0.46, Math.max(viewW, viewH) * 0.72);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, `rgba(6, 1, 14, ${blackoutAlpha})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, viewW, viewH);

      ctx.save();
      ctx.strokeStyle = b.entryPhase >= 3 ? 'rgba(232, 121, 249, 0.55)' : 'rgba(168, 85, 247, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 80); ctx.lineTo(95, 130); ctx.lineTo(65, 195); ctx.lineTo(155, 235);
      ctx.moveTo(viewW, 110); ctx.lineTo(viewW - 105, 165); ctx.lineTo(viewW - 70, 225);
      ctx.moveTo(viewW - 160, viewH); ctx.lineTo(viewW - 120, viewH - 95);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#040009';
      ctx.fillRect(0, 0, viewW, barH);
      ctx.fillRect(0, viewH - barH, viewW, barH);

      if (rt.bossNameReveal) {
        const vDef = getBossVariantDef('void', b.variantId);
        const ty = viewH - 132;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
        ctx.font = `bold ${viewW < 640 ? 28 : 40}px "Cinzel", Georgia, serif`;
        ctx.fillText('VOID PHANTOM', viewW / 2 - 4, ty - 2);

        ctx.fillStyle = '#f5d0fe';
        ctx.strokeStyle = '#090212';
        ctx.lineWidth = 5;
        ctx.strokeText('VOID PHANTOM', viewW / 2, ty);
        ctx.fillText('VOID PHANTOM', viewW / 2, ty);

        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText(`${vDef.shortName} · ${vDef.subtitle.toUpperCase()}`, viewW / 2, ty - 42);

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText(`RECOMMENDED GEAR: ${vDef.suggestedLabel.toUpperCase()}`, viewW / 2, ty + 24);

        ctx.fillStyle = '#e7e5e4';
        ctx.font = 'italic 11px "JetBrains Mono", monospace';
        ctx.fillText('“STEP INTO THE RIFT... AND BE UNMADE.”', viewW / 2, ty + 44);
      }
    } else if (rt.bossType === 'oni') {
      // ONI: Blood-Moon Crimson Vignette + Japanese War-Scroll Kanji Crest & Ink Ribbon
      const vig = ctx.createRadialGradient(viewW / 2, viewH * 0.45, 120, viewW / 2, viewH * 0.48, Math.max(viewW, viewH) * 0.72);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, 'rgba(24, 3, 2, 0.68)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, viewW, viewH);

      if (b.entryPhase >= 3) {
        ctx.save();
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.38)';
        ctx.lineWidth = 2.5;
        const cxS = viewW / 2;
        const cyS = viewH * 0.42;
        for (let s = 0; s < 24; s++) {
          const ang = (s / 24) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cxS + Math.cos(ang) * 240, cyS + Math.sin(ang) * 240);
          ctx.lineTo(cxS + Math.cos(ang) * 680, cyS + Math.sin(ang) * 680);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.fillStyle = '#090201';
      ctx.fillRect(0, 0, viewW, barH);
      ctx.fillRect(0, viewH - barH, viewW, barH);

      if (rt.bossNameReveal) {
        const vDef = getBossVariantDef('oni', b.variantId);
        const boxTop = viewH - 180;
        ctx.fillStyle = 'rgba(18, 4, 2, 0.92)';
        ctx.fillRect(0, boxTop, viewW, 114);
        ctx.strokeStyle = vDef.accent;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-4, boxTop, viewW + 8, 114);

        const stampX = Math.max(24, Math.round(viewW * 0.06));
        ctx.fillStyle = '#991b1b';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.5;
        ctx.fillRect(stampX, boxTop + 18, 76, 76);
        ctx.strokeRect(stampX, boxTop + 18, 76, 76);
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 34px serif';
        ctx.textAlign = 'center';
        ctx.fillText('鬼', stampX + 38, boxTop + 68);

        const txLeft = stampX + 96;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fb923c';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText(`${vDef.shortName} · ${vDef.subtitle.toUpperCase()}`, txLeft, boxTop + 24);

        ctx.fillStyle = '#fef3c7';
        ctx.font = `bold ${viewW < 640 ? 26 : 38}px "Cinzel", Georgia, serif`;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.strokeText('YAMATA-ONI', txLeft, boxTop + 62);
        ctx.fillText('YAMATA-ONI', txLeft, boxTop + 62);

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText(`RECOMMENDED GEAR: ${vDef.suggestedLabel.toUpperCase()}`, txLeft, boxTop + 86);

        ctx.fillStyle = '#fed7aa';
        ctx.font = 'italic 11px "JetBrains Mono", monospace';
        ctx.fillText('“EIGHT SERPENTS HUNGER. PROVE YOUR BLADE, MORTAL.”', txLeft, boxTop + 104);
      }
    } else {
      // ECLIPSE: Twin Solar-Gold (Left) & Lunar-Cyan (Right) Aura Convergence + Royal Centerpiece
      const leftGlow = ctx.createLinearGradient(0, 0, viewW * 0.45, 0);
      leftGlow.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
      leftGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = leftGlow;
      ctx.fillRect(0, 0, viewW * 0.45, viewH);

      const rightGlow = ctx.createLinearGradient(viewW * 0.55, 0, viewW, 0);
      rightGlow.addColorStop(0, 'rgba(0, 0, 0, 0)');
      rightGlow.addColorStop(1, 'rgba(56, 189, 248, 0.22)');
      ctx.fillStyle = rightGlow;
      ctx.fillRect(viewW * 0.55, 0, viewW * 0.45, viewH);

      ctx.fillStyle = '#03020a';
      ctx.fillRect(0, 0, viewW, barH);
      ctx.fillRect(0, viewH - barH, viewW, barH);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, barH); ctx.lineTo(viewW / 2, barH);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.beginPath();
      ctx.moveTo(viewW / 2, barH); ctx.lineTo(viewW, barH);
      ctx.stroke();

      if (rt.bossNameReveal) {
        const vDef = getBossVariantDef('eclipse', b.variantId);
        const boxTop = viewH - 182;
        const padX = Math.min(64, Math.round(viewW * 0.06));
        ctx.fillStyle = 'rgba(6, 5, 16, 0.9)';
        ctx.fillRect(padX, boxTop, viewW - padX * 2, 118);

        const gradBorder = ctx.createLinearGradient(padX, 0, viewW - padX, 0);
        gradBorder.addColorStop(0, '#fbbf24');
        gradBorder.addColorStop(0.5, '#ffffff');
        gradBorder.addColorStop(1, '#38bdf8');
        ctx.strokeStyle = gradBorder;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(padX, boxTop, viewW - padX * 2, 118);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText(`${vDef.shortName} · ${vDef.subtitle.toUpperCase()}`, viewW / 2, boxTop + 22);

        ctx.font = `bold ${viewW < 640 ? 24 : 36}px "Cinzel", Georgia, serif`;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.strokeText('SOLARIS & LUNARIS', viewW / 2, boxTop + 62);
        ctx.fillStyle = gradBorder;
        ctx.fillText('SOLARIS & LUNARIS', viewW / 2, boxTop + 62);

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText(`RECOMMENDED GEAR: ${vDef.suggestedLabel.toUpperCase()}`, viewW / 2, boxTop + 86);

        ctx.fillStyle = '#e7e5e4';
        ctx.font = 'italic 11px "JetBrains Mono", monospace';
        ctx.fillText('“SUN AND MOON CONVERGE. ENDURE OR BE OBLITERATED.”', viewW / 2, boxTop + 106);
      }
    }
  }

  if (rt.fadeOpacity > 0) {
    ctx.fillStyle = `rgba(2, 0, 10, ${rt.fadeOpacity})`;
    ctx.fillRect(0, 0, viewW, viewH);
  }
  if (rt.freezeTime > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.fillRect(0, 0, viewW, viewH);
  }
}
