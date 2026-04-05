"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { AlgorithmName } from "@/lib/algorithms";
import {
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Pause,
  Trash2,
  Server,
  Monitor,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ControlPanelProps {
  algorithms: AlgorithmName[];
  currentAlgorithm: AlgorithmName;
  onAlgorithmChange: (algo: AlgorithmName) => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  onRun: () => void;
  onReset: () => void;
  onNext: () => void;
  onPrevious: () => void;
  isRunning: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  currentStepIndex: number;
  totalSteps: number;
  editMode: "obstacle" | "start" | "goal" | null;
  onEditModeChange: (mode: "obstacle" | "start" | "goal" | null) => void;
  onClearObstacles: () => void;
  obstacleCount: number;
  useBackend: boolean;
  onBackendToggle: (enabled: boolean) => void;
  depthLimit: number;
  onDepthLimitChange: (limit: number) => void;
  onRandomObstacles: () => void;
}

/** Get algorithm category for grouping in the dropdown */
const getCategory = (algo: AlgorithmName): string => {
  const uninformed = new Set(["BFS", "DFS", "DLS", "IDDFS", "UCS"]);
  const informed = new Set(["Hill Climbing", "Greedy Best First", "A*"]);
  if (uninformed.has(algo)) return "Uninformed";
  if (informed.has(algo)) return "Informed";
  return "Metaheuristic";
};

export const ControlPanel = ({
  algorithms,
  currentAlgorithm,
  onAlgorithmChange,
  gridSize,
  onGridSizeChange,
  speed,
  onSpeedChange,
  onRun,
  onReset,
  onNext,
  onPrevious,
  isRunning,
  canGoNext,
  canGoPrevious,
  currentStepIndex,
  totalSteps,
  editMode,
  onEditModeChange,
  onClearObstacles,
  obstacleCount,
  useBackend,
  onBackendToggle,
  depthLimit,
  onDepthLimitChange,
  onRandomObstacles,
}: ControlPanelProps) => {
  const editButtons: {
    mode: "obstacle" | "start" | "goal";
    label: string;
    color: string;
    activeColor: string;
  }[] = [
    {
      mode: "obstacle",
      label: "🧱 Walls",
      color: "border-slate-600/50 text-slate-400",
      activeColor: "bg-slate-600/80 text-white border-slate-500/60",
    },
    {
      mode: "start",
      label: "🟢 Start",
      color: "border-emerald-800/40 text-emerald-400/80",
      activeColor: "bg-emerald-700/60 text-white border-emerald-500/50",
    },
    {
      mode: "goal",
      label: "🔴 Goal",
      color: "border-red-800/40 text-red-400/80",
      activeColor: "bg-red-700/60 text-white border-red-500/50",
    },
  ];

  return (
    <motion.div
      className="flex flex-col gap-4 p-4 rounded-xl"
      style={{
        background: "rgba(15, 20, 30, 0.75)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(148, 163, 184, 0.08)",
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Algorithm Selection */}
      <div className="space-y-2">
        <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(148, 163, 184, 0.5)" }}>
          Algorithm
        </label>
        <Select value={currentAlgorithm} onValueChange={onAlgorithmChange}>
          <SelectTrigger className="h-9 text-sm" style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(148, 163, 184, 0.1)",
            color: "rgba(226, 232, 240, 0.9)",
          }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent style={{ background: "#1a1f2e", border: "1px solid rgba(148, 163, 184, 0.1)" }}>
            {algorithms.map((algo) => (
              <SelectItem key={algo} value={algo} className="text-slate-200">
                <span className="flex items-center gap-2">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      getCategory(algo) === "Uninformed"
                        ? "bg-blue-400/70"
                        : getCategory(algo) === "Informed"
                        ? "bg-emerald-400/70"
                        : "bg-purple-400/70"
                    }`}
                  />
                  {algo}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 text-[9px]" style={{ color: "rgba(148, 163, 184, 0.4)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60 inline-block" />
          Uninformed
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 inline-block ml-1" />
          Informed
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60 inline-block ml-1" />
          Meta
        </div>
      </div>

      {/* Grid Size */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(148, 163, 184, 0.5)" }}>
            Grid Size
          </label>
          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ color: "rgba(147, 197, 253, 0.7)", background: "rgba(147, 197, 253, 0.08)" }}>
            {gridSize}×{gridSize}
          </span>
        </div>
        <Slider
          value={[gridSize]}
          onValueChange={(val) => onGridSizeChange(val[0])}
          min={4}
          max={25}
          step={1}
          className="w-full"
          disabled={isRunning}
        />
      </div>

      {/* Speed */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(148, 163, 184, 0.5)" }}>
            Speed
          </label>
          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ color: "rgba(147, 197, 253, 0.7)", background: "rgba(147, 197, 253, 0.08)" }}>
            {speed < 50 ? "Slow" : speed < 120 ? "Normal" : "Fast"}
          </span>
        </div>
        <Slider
          value={[speed]}
          onValueChange={(val) => onSpeedChange(val[0])}
          min={1}
          max={200}
          step={1}
          className="w-full"
        />
      </div>

      {/* Depth Limit (only for DLS) */}
      {currentAlgorithm === "DLS" && (
        <motion.div
          className="space-y-1.5"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(148, 163, 184, 0.5)" }}>
              Depth Limit
            </label>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ color: "rgba(251, 191, 36, 0.7)", background: "rgba(251, 191, 36, 0.08)" }}>
              {depthLimit}
            </span>
          </div>
          <Slider
            value={[depthLimit]}
            onValueChange={(val) => onDepthLimitChange(val[0])}
            min={1}
            max={50}
            step={1}
            className="w-full"
            disabled={isRunning}
          />
        </motion.div>
      )}

      {/* Grid Editing */}
      <div className="space-y-2">
        <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(148, 163, 184, 0.5)" }}>
          Edit Grid
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {editButtons.map(({ mode, label, color, activeColor }) => (
            <Button
              key={mode}
              onClick={() =>
                onEditModeChange(editMode === mode ? null : mode)
              }
              variant="outline"
              size="sm"
              className={`text-[11px] h-7 transition-all ${
                editMode === mode ? activeColor : color
              }`}
              disabled={isRunning}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Button
            onClick={onRandomObstacles}
            variant="outline"
            size="sm"
            className="flex-1 text-[11px] h-7"
            style={{ border: "1px solid rgba(148, 163, 184, 0.1)", color: "rgba(203, 213, 225, 0.6)" }}
            disabled={isRunning}
          >
            🎲 Random
          </Button>
          <Button
            onClick={onClearObstacles}
            variant="outline"
            size="sm"
            className="flex-1 text-[11px] h-7"
            style={{ border: "1px solid rgba(148, 163, 184, 0.1)", color: "rgba(203, 213, 225, 0.6)" }}
            disabled={isRunning}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear ({obstacleCount})
          </Button>
        </div>
      </div>

      {/* Execution Controls */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            onClick={onRun}
            disabled={isRunning}
            className="flex-1 font-semibold text-sm h-9"
            style={{
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.85), rgba(59, 130, 246, 0.85))",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(16, 185, 129, 0.15)",
            }}
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            Run
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            className="flex-1 h-9"
            style={{ border: "1px solid rgba(148, 163, 184, 0.12)", color: "rgba(226, 232, 240, 0.8)" }}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onPrevious}
            disabled={!canGoPrevious || isRunning}
            variant="outline"
            size="sm"
            className="flex-1 h-7"
            style={{ border: "1px solid rgba(148, 163, 184, 0.1)", color: "rgba(203, 213, 225, 0.6)" }}
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
            Prev
          </Button>
          <Button
            onClick={onNext}
            disabled={!canGoNext || isRunning}
            variant="outline"
            size="sm"
            className="flex-1 h-7"
            style={{ border: "1px solid rgba(148, 163, 184, 0.1)", color: "rgba(203, 213, 225, 0.6)" }}
          >
            Next
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Button>
        </div>
      </div>

      {/* Step Counter */}
      {totalSteps > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px]" style={{ color: "rgba(148, 163, 184, 0.4)" }}>
            <span>Step {currentStepIndex + 1}</span>
            <span>of {totalSteps}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(148, 163, 184, 0.08)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, rgba(99, 102, 241, 0.7), rgba(147, 197, 253, 0.7))" }}
              initial={{ width: 0 }}
              animate={{
                width: `${((currentStepIndex + 1) / totalSteps) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Backend Toggle */}
      <div className="pt-2" style={{ borderTop: "1px solid rgba(148, 163, 184, 0.06)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {useBackend ? (
              <Server className="w-3.5 h-3.5" style={{ color: "rgba(147, 197, 253, 0.6)" }} />
            ) : (
              <Monitor className="w-3.5 h-3.5" style={{ color: "rgba(148, 163, 184, 0.4)" }} />
            )}
            <span className="text-[10px]" style={{ color: "rgba(148, 163, 184, 0.5)" }}>
              {useBackend ? "Server-side" : "Client-side"}
            </span>
          </div>
          <Switch
            checked={useBackend}
            onCheckedChange={onBackendToggle}
            className="scale-75"
          />
        </div>
      </div>
    </motion.div>
  );
};
