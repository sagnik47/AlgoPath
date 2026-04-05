"use client";

import { motion } from "framer-motion";
import { ExplorationStep } from "@/lib/algorithms";
import {
  Activity,
  Clock,
  Target,
  Layers,
  Zap,
  CheckCircle2,
  XCircle,
  Compass,
} from "lucide-react";

interface StatsPanelProps {
  currentStep: ExplorationStep | undefined;
  algorithm: string;
  backendResult?: {
    time_taken: number;
    is_optimal: boolean;
    success: boolean;
    cost: number;
    nodes_explored: number;
  } | null;
  executionTime?: number | null;
}

/**
 * A single stat card with icon, label, and value.
 */
const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  color: string;
}) => (
  <div className="p-2.5 rounded-lg transition-colors" style={{
    background: "rgba(255, 255, 255, 0.025)",
    border: "1px solid rgba(148, 163, 184, 0.06)",
  }}>
    <div className="flex items-center gap-1.5 mb-0.5">
      <Icon className="w-3 h-3" style={{ color }} />
      <p className="text-[9px] uppercase tracking-wider font-medium" style={{ color: "rgba(148, 163, 184, 0.45)" }}>
        {label}
      </p>
    </div>
    <p className="text-lg font-bold font-mono" style={{ color }}>{value}</p>
  </div>
);

export const StatsPanel = ({
  currentStep,
  algorithm,
  backendResult,
  executionTime,
}: StatsPanelProps) => {
  return (
    <motion.div
      className="flex flex-col gap-3 p-4 rounded-xl"
      style={{
        background: "rgba(15, 20, 30, 0.75)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(148, 163, 184, 0.08)",
      }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(147, 197, 253, 0.15))",
        }}>
          <Compass className="w-3.5 h-3.5" style={{ color: "rgba(147, 197, 253, 0.7)" }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "rgba(226, 232, 240, 0.9)" }}>{algorithm}</h3>
          <p className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(148, 163, 184, 0.4)" }}>
            {currentStep?.completed
              ? "Completed"
              : currentStep
              ? "Running"
              : "Idle"}
          </p>
        </div>
      </div>

      {currentStep ? (
        <>
          {/* Status Message */}
          <motion.div
            className="p-2.5 rounded-lg"
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(148, 163, 184, 0.05)",
            }}
            key={currentStep.stepNumber}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-[11px] font-mono leading-relaxed" style={{ color: "rgba(147, 197, 253, 0.6)" }}>
              {currentStep.message}
            </p>
          </motion.div>

          {/* Core Stats Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            <StatCard
              icon={Layers}
              label="Explored"
              value={currentStep.exploredNodes.length}
              color="rgba(129, 140, 248, 0.75)"
            />
            <StatCard
              icon={Activity}
              label="Frontier"
              value={currentStep.frontierNodes.length}
              color="rgba(96, 165, 250, 0.75)"
            />
            <StatCard
              icon={Target}
              label="Path Length"
              value={
                currentStep.pathNodes.length > 0
                  ? currentStep.pathNodes.length - 1
                  : "—"
              }
              color="rgba(251, 191, 36, 0.75)"
            />
            <StatCard
              icon={Zap}
              label="Cost"
              value={currentStep.cost}
              color="rgba(52, 211, 153, 0.75)"
            />
          </div>

          {/* Execution Time (Client Side) */}
          {executionTime !== undefined && executionTime !== null && !backendResult && currentStep.completed && (
            <motion.div
              className="space-y-1.5 pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5" style={{ color: "rgba(148, 163, 184, 0.45)" }} />
                <p className="text-[9px] uppercase tracking-wider font-medium" style={{ color: "rgba(148, 163, 184, 0.4)" }}>
                  Execution Time
                </p>
              </div>
              <p className="text-lg font-bold font-mono" style={{ color: "rgba(147, 197, 253, 0.85)" }}>
                {executionTime.toFixed(2)}ms
              </p>
             </motion.div>
          )}

          {/* Backend Stats (if available) */}
          {backendResult && (
            <motion.div
              className="space-y-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-[9px] uppercase tracking-wider font-medium" style={{ color: "rgba(148, 163, 184, 0.4)" }}>
                Server Metrics
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <StatCard
                  icon={Clock}
                  label="Time"
                  value={`${(backendResult.time_taken * 1000).toFixed(2)}ms`}
                  color="rgba(147, 197, 253, 0.7)"
                />
                <div className="p-2.5 rounded-lg" style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(148, 163, 184, 0.06)",
                }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <CheckCircle2
                      className="w-3 h-3"
                      style={{
                        color: backendResult.is_optimal
                          ? "rgba(52, 211, 153, 0.75)"
                          : "rgba(251, 146, 60, 0.75)",
                      }}
                    />
                    <p className="text-[9px] uppercase tracking-wider font-medium" style={{ color: "rgba(148, 163, 184, 0.45)" }}>
                      Optimal
                    </p>
                  </div>
                  <p
                    className="text-lg font-bold font-mono"
                    style={{
                      color: backendResult.is_optimal
                        ? "rgba(52, 211, 153, 0.75)"
                        : "rgba(251, 146, 60, 0.75)",
                    }}
                  >
                    {backendResult.is_optimal ? "Yes ✓" : "No ✗"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Completion Badge */}
          {currentStep.completed && (
            <motion.div
              className="flex items-center gap-2.5 p-2.5 rounded-lg"
              style={{
                background: currentStep.pathNodes.length > 0
                  ? "rgba(16, 185, 129, 0.08)"
                  : "rgba(244, 63, 94, 0.08)",
                border: `1px solid ${currentStep.pathNodes.length > 0
                  ? "rgba(16, 185, 129, 0.2)"
                  : "rgba(244, 63, 94, 0.2)"}`,
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {currentStep.pathNodes.length > 0 ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(52, 211, 153, 0.8)" }} />
              ) : (
                <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(251, 113, 133, 0.8)" }} />
              )}
              <p
                className="text-sm font-semibold"
                style={{
                  color: currentStep.pathNodes.length > 0
                    ? "rgba(52, 211, 153, 0.85)"
                    : "rgba(251, 113, 133, 0.85)",
                }}
              >
                {currentStep.pathNodes.length > 0
                  ? "Path Found!"
                  : "No Path Found"}
              </p>
            </motion.div>
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255, 255, 255, 0.03)" }}>
            <Activity className="w-5 h-5" style={{ color: "rgba(148, 163, 184, 0.25)" }} />
          </div>
          <p className="text-xs text-center" style={{ color: "rgba(148, 163, 184, 0.4)" }}>
            Select an algorithm and click <strong style={{ color: "rgba(226, 232, 240, 0.6)" }}>Run</strong> to begin
          </p>
        </div>
      )}
    </motion.div>
  );
};
