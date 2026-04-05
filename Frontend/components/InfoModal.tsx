"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const algorithmDescriptions: {
  key: string;
  name: string;
  category: string;
  complexity: string;
  optimal: boolean;
  description: string;
}[] = [
  {
    key: "BFS",
    name: "Breadth-First Search",
    category: "Uninformed",
    complexity: "O(V + E)",
    optimal: true,
    description:
      "Explores nodes level by level using a FIFO queue. Guarantees shortest path in unweighted graphs.",
  },
  {
    key: "DFS",
    name: "Depth-First Search",
    category: "Uninformed",
    complexity: "O(V + E)",
    optimal: false,
    description:
      "Explores as far as possible along each branch before backtracking. Uses a LIFO stack. May not find shortest path.",
  },
  {
    key: "DLS",
    name: "Depth-Limited Search",
    category: "Uninformed",
    complexity: "O(b^l)",
    optimal: false,
    description:
      "Variation of DFS with a maximum depth limit to prevent infinite exploration in deep graphs.",
  },
  {
    key: "IDDFS",
    name: "Iterative Deepening DFS",
    category: "Uninformed",
    complexity: "O(b^d)",
    optimal: true,
    description:
      "Runs repeated DLS with increasing depth limits. Combines BFS optimality with DFS space efficiency.",
  },
  {
    key: "UCS",
    name: "Uniform Cost Search",
    category: "Uninformed",
    complexity: "O(V log V)",
    optimal: true,
    description:
      "Expands nodes in order of cumulative path cost using a priority queue. Guarantees optimal path.",
  },
  {
    key: "Hill Climbing",
    name: "Hill Climbing",
    category: "Informed",
    complexity: "O(∞)",
    optimal: false,
    description:
      "Greedy local search — always moves to the best neighbor. Very fast but gets stuck at local minima.",
  },
  {
    key: "Greedy Best First",
    name: "Greedy Best-First Search",
    category: "Informed",
    complexity: "O(b^m)",
    optimal: false,
    description:
      "Uses heuristic h(n) only. Expands the node closest to goal. Fast but not optimal.",
  },
  {
    key: "A*",
    name: "A* Search",
    category: "Informed",
    complexity: "O(b^d)",
    optimal: true,
    description:
      "Uses f(n) = g(n) + h(n). With admissible heuristic (Manhattan), guarantees optimal path efficiently.",
  },
  {
    key: "Genetic",
    name: "Genetic Algorithm",
    category: "Metaheuristic",
    complexity: "Varies",
    optimal: false,
    description:
      "Evolves a population of candidate paths using selection, crossover, and mutation. Server-side only (bonus).",
  },
];

const categoryColors: Record<string, string> = {
  Uninformed: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  Informed: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Metaheuristic: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

export const InfoModal = ({ isOpen, onClose }: InfoModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-slate-900 rounded-xl border border-slate-700 p-6 shadow-2xl z-50 max-h-[85vh] flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-100">
                  Algorithm Reference
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Heuristic: Manhattan distance — h(n) = |x₁ - x₂| + |y₁ - y₂|
                </p>
              </div>
              <Button
                onClick={onClose}
                size="icon"
                variant="ghost"
                className="text-slate-400 hover:text-slate-100 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {algorithmDescriptions.map((algo, i) => (
                <motion.div
                  key={algo.key}
                  className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-cyan-400 text-sm">
                          {algo.name}
                        </h3>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                            categoryColors[algo.category]
                          }`}
                        >
                          {algo.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {algo.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {algo.complexity}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          algo.optimal
                            ? "text-emerald-400 bg-emerald-400/10"
                            : "text-orange-400 bg-orange-400/10"
                        }`}
                      >
                        {algo.optimal ? "Optimal" : "Non-Optimal"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
