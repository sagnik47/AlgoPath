"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, BarChart3, Layers, Cpu, GitBranch, Play, Compass } from "lucide-react";
import dynamic from "next/dynamic";

const AntiGravityCanvas = dynamic(() => import("@/components/AntiGravityCanvas"), { ssr: false });

// ── Data ───────────────────────────────────────────────────────────────────

const ALGORITHMS = [
  { name: "BFS", full: "Breadth-First Search", category: "Uninformed", color: "from-blue-400 to-cyan-400", desc: "Level-by-level exploration with a FIFO queue. Guarantees shortest path." },
  { name: "DFS", full: "Depth-First Search", category: "Uninformed", color: "from-blue-400 to-indigo-400", desc: "Deep-first exploration using a stack. Space efficient but not optimal." },
  { name: "DLS", full: "Depth-Limited Search", category: "Uninformed", color: "from-blue-500 to-sky-400", desc: "Depth-first with a depth cap. Avoids infinite loops in large spaces." },
  { name: "IDDFS", full: "Iterative Deepening DFS", category: "Uninformed", color: "from-sky-400 to-blue-500", desc: "Combines BFS optimality with DFS memory efficiency via repeated deepening." },
  { name: "UCS", full: "Uniform Cost Search", category: "Uninformed", color: "from-indigo-400 to-blue-400", desc: "Priority-queue expansion by cumulative cost. Always optimal paths." },
  { name: "Hill Climbing", full: "Hill Climbing", category: "Informed", color: "from-emerald-400 to-teal-400", desc: "Greedy local search. Fast but gets stuck at local optima." },
  { name: "Greedy", full: "Greedy Best-First", category: "Informed", color: "from-teal-400 to-emerald-500", desc: "Heuristic-only expansion. Fast but may find suboptimal paths." },
  { name: "A*", full: "A* Search", category: "Informed", color: "from-emerald-400 to-green-400", desc: "f = g + h search. Optimal with admissible heuristic (Manhattan)." },
  { name: "Genetic", full: "Genetic Algorithm", category: "Meta", color: "from-purple-400 to-pink-400", desc: "Evolutionary path evolution using selection, crossover & mutation." },
];

const FEATURES = [
  { icon: Sparkles, title: "Step-by-Step Visualization", description: "Watch algorithms explore the grid node by node with smooth, real-time animations and playback control.", gradient: "from-cyan-500 to-blue-500", bg: "from-cyan-500/10 to-blue-500/10" },
  { icon: Zap, title: "Interactive Grid Editor", description: "Place walls, drag start/goal positions, and generate random mazes. Full control over the search space.", gradient: "from-emerald-500 to-teal-500", bg: "from-emerald-500/10 to-teal-500/10" },
  { icon: BarChart3, title: "Compare All 9 Algorithms", description: "Run every algorithm — compare path cost, explored nodes, and timing side-by-side.", gradient: "from-purple-500 to-pink-500", bg: "from-purple-500/10 to-pink-500/10" },
  { icon: Layers, title: "Dual Execution Mode", description: "Run client-side for instant results or toggle the FastAPI backend for server-computed metrics.", gradient: "from-amber-500 to-orange-500", bg: "from-amber-500/10 to-orange-500/10" },
];

// ── CTA Button (CSS-only transitions — no Framer Motion) ───────────────

function CTAButton({ children, href, variant = "primary" }: {
  children: React.ReactNode; href: string; variant?: "primary" | "secondary";
}) {
  const isPrimary = variant === "primary";
  return (
    <span className="cta-float">
      <Link
        href={href}
        className={`cta-btn ${isPrimary ? "cta-primary" : "cta-secondary"}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "16px 32px",
          borderRadius: 16,
          fontWeight: 600,
          fontSize: 14,
          textDecoration: "none",
          position: "relative" as const,
          overflow: "hidden",
          cursor: "pointer",
          ...(isPrimary
            ? {
                background: "linear-gradient(135deg, rgba(6,182,212,0.9), rgba(99,102,241,0.9), rgba(168,85,247,0.85))",
                color: "#fff",
                border: "1px solid rgba(129,140,248,0.3)",
                boxShadow: "0 8px 32px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
              }
            : {
                background: "rgba(255,255,255,0.03)",
                color: "rgba(203,213,225,0.9)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(16px)",
              }),
        }}
      >
        {children}
      </Link>
    </span>
  );
}


// ── Algorithm Card (FM entrance-only) ──────────────────────────────────

function AlgorithmCard({ algo, index }: { algo: (typeof ALGORITHMS)[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      viewport={{ once: true, margin: "-40px" }}
      className="group algo-card"
    >
      <div className={`absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br ${algo.color} rounded-full opacity-0 group-hover:opacity-[0.08] blur-3xl transition-opacity duration-700`} />
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${algo.color}`} />
          <h3 className="text-sm font-semibold text-white/90">{algo.name}</h3>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
          algo.category === "Uninformed" ? "text-blue-400/70 bg-blue-500/10 border border-blue-400/10"
            : algo.category === "Informed" ? "text-emerald-400/70 bg-emerald-500/10 border border-emerald-400/10"
            : "text-purple-400/70 bg-purple-500/10 border border-purple-400/10"
        }`}>{algo.category}</span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed relative z-10 font-light">{algo.desc}</p>
    </motion.div>
  );
}

// ── Feature Card ───────────────────────────────────────────────────────

function FeatureCard({ feature, index }: { feature: (typeof FEATURES)[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group algo-card p-6"
    >
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
        style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
        <feature.icon className="w-5 h-5 text-slate-300" />
      </div>
      <h3 className="text-sm font-semibold text-white/90 mb-2">{feature.title}</h3>
      <p className="text-[11px] text-slate-500 leading-relaxed font-light">{feature.description}</p>
      <div className={`absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br ${feature.gradient} rounded-full opacity-0 group-hover:opacity-[0.06] blur-2xl transition-opacity duration-500`} />
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function Home() {
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 600], [1, 0]);
  const headerY = useTransform(scrollY, [0, 600], [0, -80]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const tags = [
    { label: "BFS" },
    { label: "A*" },
    { label: "f = g + h" },
    { label: "DFS" },
    { label: "heuristic(n)" },
    { label: "UCS" },
    { label: "Greedy" },
    { label: "expand()" },
  ];

  return (
    <div className="bg-black text-white overflow-hidden">
      {mounted && <AntiGravityCanvas />}

      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-black/40 to-black pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 30%, rgba(0,0,0,0.7) 100%)" }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="hg" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern></defs>
            <rect width="100%" height="100%" fill="url(#hg)" />
          </svg>
        </div>

        {/* Ambient orbs — CSS only */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <motion.div style={{ opacity: headerOpacity, y: headerY }} className="relative z-10 text-center max-w-4xl w-full mx-auto flex flex-col items-center justify-center">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="mb-8">
            <span className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-[11px] font-medium"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(148,163,184,0.9)", backdropFilter: "blur(12px)" }}>
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Introduction to Artificial Intelligence
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}
            className="text-5xl sm:text-6xl md:text-8xl font-bold mb-5 leading-[0.92] tracking-tight">
            <span className="block text-white/90">Visualize AI Search</span>
            <span className="block mt-2 gradient-title">Like Never Before</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45 }}
            className="text-sm sm:text-base mb-10 max-w-xl mx-auto leading-relaxed font-light" style={{ color: "rgba(148,163,184,0.8)" }}>
            Explore how BFS, DFS, A*, and 6 more algorithms navigate 2D grids — step by step, with real-time interactive visualization and performance comparison.
          </motion.p>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }}
            className="flex items-center justify-center gap-8 sm:gap-12 mb-12">
            {[["9", "Algorithms"], ["3", "Categories"], ["2", "Modes"]].map(([v, l]) => (
              <div key={l} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold gradient-title">{v}</div>
                <div className="text-[10px] text-slate-500 mt-1 font-light uppercase tracking-wider">{l}</div>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.65 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <CTAButton href="/visualizer" variant="primary">
              <Play className="w-4 h-4" /> Start Visualization <ArrowRight className="w-4 h-4 cta-arrow" />
            </CTAButton>
            <CTAButton href="#algorithms" variant="secondary">
              <Compass className="w-4 h-4" /> Explore Algorithms
            </CTAButton>
          </motion.div>

          {/* Algorithm tags — inline centered */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.75 }}
            className="flex flex-wrap items-center justify-center gap-2.5 mb-12 max-w-lg">
            {tags.map(t => (
              <span key={t.label} className="px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05] text-xs font-mono text-slate-500 backdrop-blur-sm">
                {t.label}
              </span>
            ))}
          </motion.div>

          {/* Scroll hint */}
          <div className="mt-8 scroll-hint">
            <span className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(100,116,139,0.5)" }}>
              Move your cursor · Click anywhere
            </span>
            <div className="scroll-dot-track">
              <div className="scroll-dot" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Algorithms ────────────────────────────────────────────── */}
      <section id="algorithms" className="relative py-28 px-4" style={{ background: "linear-gradient(to bottom, #000, rgba(2,6,23,0.5), #000)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-[11px] font-mono uppercase tracking-wider mb-3 block" style={{ color: "rgba(34,211,238,0.5)" }}>Algorithm Suite</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white/95 mb-3">9 Search Algorithms</h2>
            <p className="text-sm max-w-md mx-auto font-light" style={{ color: "rgba(100,116,139,0.7)" }}>From uninformed search to heuristic-driven strategies and metaheuristics</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALGORITHMS.map((a, i) => <AlgorithmCard key={a.name} algo={a} index={i} />)}
          </div>
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────────────── */}
      <section className="relative py-28 px-4" style={{ background: "linear-gradient(to bottom, #000, rgba(2,6,23,0.3))" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-[11px] font-mono uppercase tracking-wider mb-3 block" style={{ color: "rgba(52,211,153,0.5)" }}>Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white/95 mb-3">Built for Learning</h2>
            <p className="text-sm font-light" style={{ color: "rgba(100,116,139,0.7)" }}>Every feature is designed to help you understand algorithms better</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ────────────────────────────────────────────── */}
      <section className="relative py-32 px-4 bg-black overflow-hidden">
        <div className="orb" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, background: "radial-gradient(circle, rgba(6,182,212,0.04), transparent 60%)" }} />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-5xl font-bold mb-5 text-white/95 tracking-tight">Ready to Explore?</h2>
            <p className="text-sm mb-10 font-light max-w-md mx-auto" style={{ color: "rgba(148,163,184,0.7)" }}>
              Draw obstacles, pick an algorithm, and watch the search unfold in real time.
            </p>
            <CTAButton href="/visualizer" variant="primary">
              <Play className="w-4 h-4" /> Launch Visualizer <ArrowRight className="w-4 h-4 cta-arrow" />
            </CTAButton>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <footer className="py-6 px-4 bg-black" style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-[11px]" style={{ color: "rgba(100,116,139,0.4)" }}>AlgoPath © 2026 · AI-Based Pathfinding & Search Algorithm Visualizer</p>
          <p className="text-[10px] mt-1" style={{ color: "rgba(100,116,139,0.25)" }}>Built for Introduction to Artificial Intelligence</p>
        </div>
      </footer>
    </div>
  );
}
