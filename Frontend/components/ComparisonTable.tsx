"use client";

import { motion } from "framer-motion";
import { ComparisonEntry } from "@/hooks/useAlgorithmRunner";
import {
  CheckCircle2,
  XCircle,
  Timer,
  Layers,
  Route,
  Zap,
  Trophy,
} from "lucide-react";

interface ComparisonTableProps {
  data: ComparisonEntry[];
  isLoading: boolean;
}

export const ComparisonTable = ({ data, isLoading }: ComparisonTableProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <motion.div
          className="w-10 h-10 border-3 border-t-cyan-400 border-slate-700 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-sm text-slate-400">Running all algorithms...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Layers className="w-10 h-10 text-slate-600" />
        <p className="text-sm text-slate-500 text-center">
          Click "Compare All" to run every algorithm on the current grid
        </p>
      </div>
    );
  }

  // Find the best algorithm (lowest cost among successful ones)
  const successfulResults = data.filter((d) => d.success);
  const bestCost = successfulResults.length > 0
    ? Math.min(...successfulResults.map((d) => d.cost))
    : null;
  const fastestTime = successfulResults.length > 0
    ? Math.min(...successfulResults.map((d) => d.time_taken))
    : null;
  const fewestNodes = successfulResults.length > 0
    ? Math.min(...successfulResults.map((d) => d.nodes_explored))
    : null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="text-left py-3 px-4 text-xs text-slate-500 uppercase tracking-wider font-medium">
              Algorithm
            </th>
            <th className="text-center py-3 px-3 text-xs text-slate-500 uppercase tracking-wider font-medium">
              Result
            </th>
            <th className="text-right py-3 px-3 text-xs text-slate-500 uppercase tracking-wider font-medium">
              <div className="flex items-center justify-end gap-1">
                <Route className="w-3 h-3" />
                Cost
              </div>
            </th>
            <th className="text-right py-3 px-3 text-xs text-slate-500 uppercase tracking-wider font-medium">
              <div className="flex items-center justify-end gap-1">
                <Layers className="w-3 h-3" />
                Explored
              </div>
            </th>
            <th className="text-right py-3 px-3 text-xs text-slate-500 uppercase tracking-wider font-medium">
              <div className="flex items-center justify-end gap-1">
                <Timer className="w-3 h-3" />
                Time
              </div>
            </th>
            <th className="text-center py-3 px-3 text-xs text-slate-500 uppercase tracking-wider font-medium">
              Optimal
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, i) => {
            const isBestCost = entry.success && entry.cost === bestCost;
            const isFastest = entry.success && entry.time_taken === fastestTime;
            const isFewest = entry.success && entry.nodes_explored === fewestNodes;

            return (
              <motion.tr
                key={entry.algorithm}
                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {isBestCost && (
                      <Trophy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    )}
                    <span className="font-medium text-slate-200">
                      {entry.algorithm}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-center">
                  {entry.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 mx-auto" />
                  )}
                </td>
                <td className="py-3 px-3 text-right">
                  <span
                    className={`font-mono ${
                      isBestCost
                        ? "text-amber-400 font-bold"
                        : "text-slate-300"
                    }`}
                  >
                    {entry.success ? entry.cost : "—"}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span
                    className={`font-mono ${
                      isFewest
                        ? "text-cyan-400 font-bold"
                        : "text-slate-300"
                    }`}
                  >
                    {entry.nodes_explored}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span
                    className={`font-mono text-xs ${
                      isFastest
                        ? "text-emerald-400 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {(entry.time_taken * 1000).toFixed(3)}ms
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      entry.is_optimal
                        ? "text-emerald-400 bg-emerald-400/10"
                        : "text-orange-400 bg-orange-400/10"
                    }`}
                  >
                    {entry.is_optimal ? "Yes" : "No"}
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
