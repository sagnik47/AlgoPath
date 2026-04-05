"use client";

import { motion } from "framer-motion";

const legendItems = [
  { color: "bg-slate-800/60", border: "border-slate-600/50", label: "Empty" },
  { color: "bg-slate-600/90", border: "border-slate-500/50", label: "Wall" },
  { color: "bg-emerald-500", border: "border-emerald-400/50", label: "Start" },
  { color: "bg-rose-500", border: "border-rose-400/50", label: "Goal" },
  { color: "bg-cyan-400", border: "border-cyan-300/50", label: "Current" },
  { color: "bg-blue-500/50", border: "border-blue-400/50", label: "Frontier" },
  { color: "bg-indigo-500/30", border: "border-indigo-400/40", label: "Explored" },
  { color: "bg-amber-400", border: "border-amber-300/50", label: "Path" },
];

export const Legend = () => {
  return (
    <motion.div
      className="px-3 py-2 rounded-lg"
      style={{
        background: "rgba(15, 20, 30, 0.5)",
        border: "1px solid rgba(148, 163, 184, 0.06)",
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5">
        {legendItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-1"
          >
            <div
              className={`${item.color} w-3 h-3 rounded-[2px] border ${item.border}`}
            />
            <span className="text-[10px]" style={{ color: "rgba(148, 163, 184, 0.45)" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
