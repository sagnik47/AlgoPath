"use client";

import { useEffect, useRef } from "react";

// ── Pre-computed color palette (avoid string ops in render loop) ────────
const PALETTE: [number, number, number][] = [
  [56, 189, 248],   // neon cyan
  [168, 85, 247],   // soft purple
  [52, 211, 153],   // light green
  [96, 165, 250],   // blue
  [129, 140, 248],  // indigo
];

const LABELS = ["BFS", "DFS", "A*", "UCS", "IDDFS", "Greedy", "Hill Climb", "Genetic"];

// ── Configuration ──────────────────────────────────────────────────────
const POOL_SIZE = 140;
const MAX_PARTICLES = 120;
const AMBIENT_TARGET = 0;
const SPAWN_THROTTLE = 15;        // ms between spawns (faster for denser cluster)
const EDGE_DIST = 120;
const EDGE_DIST_SQ = EDGE_DIST * EDGE_DIST;
const MAX_EDGES = 50;
const REPEL_R = 120;
const REPEL_R_SQ = REPEL_R * REPEL_R;
const ATTRACT_R = 500;
const ATTRACT_R_SQ = ATTRACT_R * ATTRACT_R;
const FRICTION = 0.93;
const REPEL_FORCE = 80;
const ATTRACT_FORCE = 12;
const RIPPLE_POOL = 5;
const SPRITE_SZ = 48;
const SPRITE_HALF = 24;

// ── Kind constants ─────────────────────────────────────────────────────
const K_NODE = 0, K_LABEL = 1, K_BINARY = 2;

// ── Interfaces ─────────────────────────────────────────────────────────
interface Particle {
  on: boolean; x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; r: number; kind: number;
  txt: number; col: number; layer: number; amb: boolean;
}

interface Ripple {
  on: boolean; x: number; y: number; age: number;
  maxAge: number; maxR: number; col: number;
}

interface State {
  pool: Particle[]; rips: Ripple[]; sprites: HTMLCanvasElement[];
  act: number; ambCt: number;
  mx: number; my: number; sx: number; sy: number;
  speed: number; mActive: boolean; lastSpawn: number;
  lastT: number; raf: number; W: number; H: number; dpr: number;
}

// ── Helpers ────────────────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => v < lo ? lo : v > hi ? hi : v;

// ── Component ──────────────────────────────────────────────────────────
export default function AntiGravityCanvas() {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const stRef = useRef<State | null>(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: true });
    if (!ctx) return;

    // ── Pre-allocate particle pool ─────────────────────────────────
    const pool: Particle[] = [];
    for (let i = 0; i < POOL_SIZE; i++)
      pool.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 3,
                  r: 3, kind: K_NODE, txt: 0, col: 0, layer: 1, amb: false });

    // ── Pre-allocate ripple pool ───────────────────────────────────
    const rips: Ripple[] = [];
    for (let i = 0; i < RIPPLE_POOL; i++)
      rips.push({ on: false, x: 0, y: 0, age: 0, maxAge: 1.2, maxR: 200, col: 0 });

    // ── Pre-render glow sprites (1 per color) ──────────────────────
    const sprites: HTMLCanvasElement[] = [];
    for (const [r, g, b] of PALETTE) {
      const oc = document.createElement("canvas");
      oc.width = SPRITE_SZ; oc.height = SPRITE_SZ;
      const c = oc.getContext("2d")!;
      const gr = c.createRadialGradient(SPRITE_HALF, SPRITE_HALF, 0, SPRITE_HALF, SPRITE_HALF, SPRITE_HALF);
      gr.addColorStop(0, `rgba(${r},${g},${b},0.5)`);
      gr.addColorStop(0.35, `rgba(${r},${g},${b},0.12)`);
      gr.addColorStop(0.7, `rgba(${r},${g},${b},0.02)`);
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      c.fillStyle = gr;
      c.fillRect(0, 0, SPRITE_SZ, SPRITE_SZ);
      sprites.push(oc);
    }

    // ── State object (single allocation) ───────────────────────────
    const S: State = {
      pool, rips, sprites, act: 0, ambCt: 0,
      mx: -999, my: -999, sx: -999, sy: -999,
      speed: 0, mActive: false, lastSpawn: 0,
      lastT: performance.now(), raf: 0,
      W: 0, H: 0, dpr: 1,
    };
    stRef.current = S;

    // ── Resize ─────────────────────────────────────────────────────
    const resize = () => {
      S.dpr = Math.min(devicePixelRatio || 1, 2);
      S.W = innerWidth; S.H = innerHeight;
      cv.width = S.W * S.dpr; cv.height = S.H * S.dpr;
      cv.style.width = S.W + "px"; cv.style.height = S.H + "px";
      ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    };
    resize();
    addEventListener("resize", resize);

    // ── Activate particle from pool ────────────────────────────────
    const spawn = (x: number, y: number, spd: number, amb: boolean,
                   bvx?: number, bvy?: number) => {
      if (S.act >= MAX_PARTICLES) return;
      for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i]; if (p.on) continue;
        const rng = Math.random();
        const spread = 20 + spd * 20; // smaller spread for cursor focus
        const ang = Math.random() * 6.2832;
        const d = Math.random() * spread;
        p.on = true; p.amb = false;
        p.x = x + Math.cos(ang) * d;
        p.y = y + Math.sin(ang) * d;
        p.vx = bvx ?? (Math.random() - 0.5) * 1.5;
        p.vy = bvy ?? (Math.random() - 0.5) * 1.5;
        p.col = (Math.random() * PALETTE.length) | 0;
        p.layer = (Math.random() * 3) | 0;
        p.maxLife = 2 + Math.random() * 2; // shorter life
        p.life = p.maxLife;
        if (rng < 0.10) { p.kind = K_LABEL; p.txt = (Math.random() * LABELS.length) | 0; p.r = 0; }
        else if (rng < 0.38) { p.kind = K_BINARY; p.txt = Math.random() < 0.5 ? 0 : 1; p.r = 0; }
        else { p.kind = K_NODE; p.r = 2.5 + Math.random() * 2.5; p.txt = 0; }
        S.act++;
        return;
      }
    };

    // ── Opacity from life ratio ────────────────────────────────────
    const opacity = (p: Particle) => {
      const t = 1 - p.life / p.maxLife; // 0=born, 1=dead
      if (t < 0.1) return t / 0.1;          // fade in
      const r = p.life / p.maxLife;
      if (r < 0.25) return r / 0.25;         // fade out
      return 1;
    };

    // ── Main render loop ───────────────────────────────────────────
    const frame = (now: number) => {
      const dt = clamp((now - S.lastT) / 1000, 0, 0.05);
      S.lastT = now;
      const dtN = dt * 60; // normalized to 60fps

      // Smooth mouse
      if (S.mActive) {
        const ms = clamp(dt * 8, 0, 1);
        S.sx = lerp(S.sx, S.mx, ms);
        S.sy = lerp(S.sy, S.my, ms);
      }

      // ── Update particles ──────────────────────────────────────
      let act = 0, ambCt = 0;
      for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i]; if (!p.on) continue;
        p.life -= dt;
        if (p.life <= 0) { p.on = false; continue; }
        act++;
        if (p.amb) ambCt++;

        const ds = 0.5 + p.layer * 0.25;

        // Cursor repulsion / attraction
        if (S.mActive) {
          const dx = p.x - S.sx, dy = p.y - S.sy;
          const dSq = dx * dx + dy * dy;
          if (dSq < REPEL_R_SQ && dSq > 1) {
            const d = Math.sqrt(dSq);
            const n = 1 - d / REPEL_R;
            const f = n * n * REPEL_FORCE * ds * dt;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          } else if (dSq < ATTRACT_R_SQ) {
            const d = Math.sqrt(dSq) || 1;
            // Stronger attraction the further they are, acting like a rubber band
            const f = (ATTRACT_FORCE * 2) * ds * dt / d;
            p.vx -= dx * f;
            p.vy -= dy * f;
          } else {
             // If too far away from cursor, decay rapidly
             p.life -= dt * 3;
          }
        } else {
           // Rapid decay when idle
           p.life -= dt * 4;
        }

        // Friction + integrate
        const fr = Math.pow(FRICTION, dtN);
        p.vx *= fr; p.vy *= fr;
        p.x += p.vx * dtN;
        p.y += p.vy * dtN;
      }
      S.act = act; S.ambCt = ambCt;

      // ── Clear ──────────────────────────────────────────────────
      ctx.clearRect(0, 0, S.W, S.H);

      // ── Draw edges ─────────────────────────────────────────────
      ctx.lineWidth = 0.6;
      let ec = 0;
      for (let i = 0; i < POOL_SIZE && ec < MAX_EDGES; i++) {
        const a = pool[i];
        if (!a.on || a.kind !== K_NODE) continue;
        const aO = opacity(a); if (aO < 0.1) continue;
        for (let j = i + 1; j < POOL_SIZE && ec < MAX_EDGES; j++) {
          const b = pool[j];
          if (!b.on || b.kind !== K_NODE || a.layer !== b.layer) continue;
          const bO = opacity(b); if (bO < 0.1) continue;
          const dx = a.x - b.x, dy = a.y - b.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < EDGE_DIST_SQ) {
            const d = Math.sqrt(dSq);
            const al = (1 - d / EDGE_DIST) * Math.min(aO, bO) * 0.3;
            const [r, g, bl] = PALETTE[a.col];
            ctx.strokeStyle = `rgba(${r},${g},${bl},${al})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            ec++;
          }
        }
      }

      // ── Draw particles ─────────────────────────────────────────
      // Batch by kind to minimize ctx state changes
      // Pass 1: Node glows (sprite stamps)
      for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i]; if (!p.on || p.kind !== K_NODE) continue;
        const o = opacity(p); if (o < 0.01) continue;
        const da = (0.4 + p.layer * 0.3) * o;
        const sc = p.r / 3;
        const sz = SPRITE_SZ * sc;
        ctx.globalAlpha = da * 0.7;
        ctx.drawImage(sprites[p.col], p.x - sz / 2, p.y - sz / 2, sz, sz);
      }
      // Pass 2: Node cores
      for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i]; if (!p.on || p.kind !== K_NODE) continue;
        const o = opacity(p); if (o < 0.01) continue;
        const da = (0.4 + p.layer * 0.3) * o;
        const [r, g, b] = PALETTE[p.col];
        ctx.globalAlpha = da * 0.95;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        // White center
        ctx.globalAlpha = da * 0.5;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.3, 0, 6.2832); ctx.fill();
      }
      // Pass 3: Labels (set font once)
      ctx.font = "600 12px 'Geist Mono','SF Mono',monospace";
      for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i]; if (!p.on || p.kind !== K_LABEL) continue;
        const o = opacity(p); if (o < 0.01) continue;
        const da = (0.4 + p.layer * 0.3) * o * 0.6;
        const [r, g, b] = PALETTE[p.col];
        ctx.globalAlpha = da;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillText(LABELS[p.txt], p.x, p.y);
      }
      // Pass 4: Binary digits (set font once)
      ctx.font = "10px 'Geist Mono','SF Mono',monospace";
      for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i]; if (!p.on || p.kind !== K_BINARY) continue;
        const o = opacity(p); if (o < 0.01) continue;
        const da = (0.4 + p.layer * 0.3) * o * 0.35;
        const [r, g, b] = PALETTE[p.col];
        ctx.globalAlpha = da;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillText(p.txt === 0 ? "0" : "1", p.x, p.y);
      }
      ctx.globalAlpha = 1;

      // ── Draw ripples ───────────────────────────────────────────
      for (let i = 0; i < RIPPLE_POOL; i++) {
        const rp = rips[i]; if (!rp.on) continue;
        rp.age += dt;
        if (rp.age >= rp.maxAge) { rp.on = false; continue; }
        const prog = 1 - Math.pow(1 - rp.age / rp.maxAge, 3);
        const rad = rp.maxR * prog;
        const al = (1 - rp.age / rp.maxAge) * 0.4;
        const [r, g, b] = PALETTE[rp.col];
        ctx.strokeStyle = `rgba(${r},${g},${b},${al})`;
        ctx.lineWidth = 2 * (1 - prog);
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rad, 0, 6.2832); ctx.stroke();
        ctx.strokeStyle = `rgba(${r},${g},${b},${al * 0.4})`;
        ctx.lineWidth = 1.2 * (1 - prog);
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rad * 0.65, 0, 6.2832); ctx.stroke();
      }

      // ── Cursor glow ────────────────────────────────────────────
      if (S.mActive && S.sx > 0) {
        const gs = 60 + S.speed * 12;
        ctx.globalAlpha = 0.04 + S.speed * 0.015;
        ctx.drawImage(sprites[0], S.sx - gs, S.sy - gs, gs * 2, gs * 2);
        ctx.globalAlpha = 1;
      }

      S.raf = requestAnimationFrame(frame);
    };

    // ── Events ─────────────────────────────────────────────────────
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - S.mx, dy = e.clientY - S.my;
      S.speed = Math.min(Math.sqrt(dx * dx + dy * dy) / 15, 4);
      S.mx = e.clientX; S.my = e.clientY;
      if (!S.mActive) { S.sx = e.clientX; S.sy = e.clientY; S.mActive = true; }
      const now = performance.now();
      if (now - S.lastSpawn < SPAWN_THROTTLE) return;
      S.lastSpawn = now;
      const ct = Math.ceil(2 + S.speed * 1.5);
      for (let i = 0; i < ct; i++) spawn(e.clientX, e.clientY, S.speed, false);
    };

    const onClick = (e: MouseEvent) => {
      for (let i = 0; i < RIPPLE_POOL; i++) {
        if (rips[i].on) continue;
        rips[i].on = true; rips[i].x = e.clientX; rips[i].y = e.clientY;
        rips[i].age = 0; rips[i].maxR = 180 + Math.random() * 80;
        rips[i].col = (Math.random() * PALETTE.length) | 0;
        break;
      }
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * 6.2832;
        const spd = 2 + Math.random() * 2;
        spawn(e.clientX, e.clientY, 2, false, Math.cos(ang) * spd, Math.sin(ang) * spd);
      }
    };

    const onLeave = () => { S.mActive = false; S.speed = 0; };

    const onTM = (e: TouchEvent) => {
      if (e.touches.length) onMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } as MouseEvent);
    };
    const onTS = (e: TouchEvent) => {
      if (e.touches.length) onClick({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } as MouseEvent);
    };

    addEventListener("mousemove", onMove);
    addEventListener("click", onClick);
    addEventListener("mouseleave", onLeave);
    addEventListener("touchmove", onTM, { passive: true });
    addEventListener("touchstart", onTS, { passive: true });

    S.raf = requestAnimationFrame(frame);

    return () => {
      removeEventListener("resize", resize);
      removeEventListener("mousemove", onMove);
      removeEventListener("click", onClick);
      removeEventListener("mouseleave", onLeave);
      removeEventListener("touchmove", onTM);
      removeEventListener("touchstart", onTS);
      cancelAnimationFrame(S.raf);
    };
  }, []);

  return (
    <canvas ref={cvRef} className="fixed inset-0 z-0"
      style={{ width: "100%", height: "100%", pointerEvents: "none" }} aria-hidden="true" />
  );
}
