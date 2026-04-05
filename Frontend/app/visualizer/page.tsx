"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Info, BarChart3, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Grid } from "@/components/Grid";
import { ControlPanel } from "@/components/ControlPanel";
import { StatsPanel } from "@/components/StatsPanel";
import { Legend } from "@/components/Legend";
import { InfoModal } from "@/components/InfoModal";
import { ComparisonTable } from "@/components/ComparisonTable";
import { useAlgorithmRunner } from "@/hooks/useAlgorithmRunner";
import { AlgorithmName, Position } from "@/lib/algorithms";

const ALGORITHMS: AlgorithmName[] = [
  "BFS",
  "DFS",
  "DLS",
  "IDDFS",
  "UCS",
  "Hill Climbing",
  "Greedy Best First",
  "A*",
  "Genetic",
];

export default function VisualizerPage() {
  // UI state
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [editMode, setEditMode] = useState<"obstacle" | "start" | "goal" | null>(null);
  const [startPos, setStartPos] = useState<Position>({ x: 1, y: 1 });
  const [goalPos, setGoalPos] = useState<Position>({ x: 6, y: 6 });
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Algorithm runner hook — manages all algorithm execution state
  const {
    currentAlgorithm,
    setCurrentAlgorithm,
    isRunning,
    setIsRunning,
    steps,
    currentStepIndex,
    setCurrentStepIndex,
    gridSize,
    setGridSize,
    speed,
    setSpeed,
    obstacles,
    setObstacles,
    useBackend,
    setUseBackend,
    backendResult,
    executionTime,
    comparison,
    isComparing,
    depthLimit,
    setDepthLimit,
    runAlgorithm,
    compareAll,
    nextStep,
    previousStep,
    resetVisualization,
    currentStep,
  } = useAlgorithmRunner();

  // Clamp start/goal when grid size changes
  useEffect(() => {
    const clamp = (pos: Position) => ({
      x: Math.min(pos.x, gridSize - 1),
      y: Math.min(pos.y, gridSize - 1),
    });
    setStartPos(clamp(startPos));
    setGoalPos(clamp(goalPos));
    // Remove obstacles outside the grid
    setObstacles((prev) =>
      prev.filter((o) => o.x < gridSize && o.y < gridSize)
    );
  }, [gridSize]);

  // Auto-play: advance steps on a timer
  useEffect(() => {
    if (!autoPlayEnabled || !isRunning || steps.length === 0) return;

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          setIsRunning(false);
          setAutoPlayEnabled(false);
          return prev;
        }
      });
    }, Math.max(30, 250 - speed));

    return () => clearInterval(interval);
  }, [autoPlayEnabled, isRunning, steps.length, speed, setCurrentStepIndex, setIsRunning]);

  // Handle grid cell clicks for editing
  const handleCellClick = useCallback(
    (pos: Position) => {
      if (!editMode || isRunning) return;

      const isStart = pos.x === startPos.x && pos.y === startPos.y;
      const isGoal = pos.x === goalPos.x && pos.y === goalPos.y;

      if (editMode === "obstacle") {
        if (isStart || isGoal) return; // Can't place obstacle on start/goal
        const exists = obstacles.find((o) => o.x === pos.x && o.y === pos.y);
        if (exists) {
          setObstacles(obstacles.filter((o) => !(o.x === pos.x && o.y === pos.y)));
        } else {
          setObstacles([...obstacles, pos]);
        }
      } else if (editMode === "start") {
        if (isGoal) return;
        // Remove any obstacle at this position
        setObstacles(obstacles.filter((o) => !(o.x === pos.x && o.y === pos.y)));
        setStartPos(pos);
      } else if (editMode === "goal") {
        if (isStart) return;
        setObstacles(obstacles.filter((o) => !(o.x === pos.x && o.y === pos.y)));
        setGoalPos(pos);
      }
    },
    [editMode, isRunning, startPos, goalPos, obstacles, setObstacles]
  );

  // Generate random obstacles (20-30% density)
  const handleRandomObstacles = useCallback(() => {
    const density = 0.2 + Math.random() * 0.1;
    const count = Math.floor(gridSize * gridSize * density);
    const newObstacles: Position[] = [];

    while (newObstacles.length < count) {
      const pos = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
      };
      // Don't place on start/goal or duplicates
      if (
        !(pos.x === startPos.x && pos.y === startPos.y) &&
        !(pos.x === goalPos.x && pos.y === goalPos.y) &&
        !newObstacles.some((o) => o.x === pos.x && o.y === pos.y)
      ) {
        newObstacles.push(pos);
      }
    }

    setObstacles(newObstacles);
    resetVisualization();
  }, [gridSize, startPos, goalPos, setObstacles, resetVisualization]);

  const handleRun = () => {
    setEditMode(null);
    setIsRunning(true);
    setAutoPlayEnabled(true);
    runAlgorithm(startPos, goalPos);
  };

  const handleReset = () => {
    resetVisualization();
    setAutoPlayEnabled(false);
  };

  const handleCompare = async () => {
    setEditMode(null);
    setShowComparison(true);
    await compareAll(startPos, goalPos);
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0c0f17 0%, #131825 40%, #0f1520 70%, #0a0e16 100%)" }}>
      {/* Header */}
      <motion.header
        className="sticky top-0 z-40"
        style={{
          borderBottom: "1px solid rgba(148, 163, 184, 0.08)",
          background: "rgba(12, 15, 23, 0.85)",
          backdropFilter: "blur(12px)",
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-[1440px] mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-500 hover:text-slate-200 hover:bg-white/5"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold" style={{ color: "rgba(226, 232, 240, 0.95)" }}>
                  AlgoPath Visualizer
                </h1>
                <p className="text-[10px] text-slate-500 truncate">
                  9 pathfinding algorithms · step-by-step · interactive grid
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCompare}
                variant="outline"
                size="sm"
                className="hidden sm:flex text-xs"
                style={{
                  border: "1px solid rgba(148, 163, 184, 0.12)",
                  color: "rgba(203, 213, 225, 0.8)",
                  background: "rgba(255, 255, 255, 0.03)",
                }}
                disabled={isComparing}
              >
                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                Compare All
              </Button>
              <Button
                onClick={() => setIsInfoOpen(true)}
                size="icon"
                variant="ghost"
                className="text-slate-500 hover:text-slate-300"
              >
                <Info className="w-4.5 h-4.5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-4 py-3">
        {/* Comparison Panel (slide-in) */}
        {showComparison && (
          <motion.div
            className="mb-4 rounded-xl overflow-hidden"
            style={{
              background: "rgba(15, 20, 30, 0.8)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(148, 163, 184, 0.08)",
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.06)" }}>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" style={{ color: "rgba(147, 197, 253, 0.7)" }} />
                <h2 className="text-sm font-semibold" style={{ color: "rgba(226, 232, 240, 0.9)" }}>
                  Algorithm Comparison
                </h2>
              </div>
              <Button
                onClick={() => setShowComparison(false)}
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-slate-200 h-7"
              >
                Hide
              </Button>
            </div>
            <div className="p-4">
              <ComparisonTable data={comparison} isLoading={isComparing} />
            </div>
          </motion.div>
        )}

        {/* 3-column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-3">
          {/* Left Panel — Controls */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <ControlPanel
              algorithms={ALGORITHMS}
              currentAlgorithm={currentAlgorithm}
              onAlgorithmChange={(algo) => {
                setCurrentAlgorithm(algo);
                resetVisualization();
              }}
              gridSize={gridSize}
              onGridSizeChange={(size) => {
                setGridSize(size);
                resetVisualization();
              }}
              speed={speed}
              onSpeedChange={setSpeed}
              onRun={handleRun}
              onReset={handleReset}
              onNext={nextStep}
              onPrevious={previousStep}
              isRunning={isRunning}
              canGoNext={currentStepIndex < steps.length - 1}
              canGoPrevious={currentStepIndex > 0}
              currentStepIndex={currentStepIndex}
              totalSteps={steps.length}
              editMode={editMode}
              onEditModeChange={setEditMode}
              onClearObstacles={() => {
                setObstacles([]);
                resetVisualization();
              }}
              obstacleCount={obstacles.length}
              useBackend={useBackend}
              onBackendToggle={setUseBackend}
              depthLimit={depthLimit}
              onDepthLimitChange={setDepthLimit}
              onRandomObstacles={handleRandomObstacles}
            />

            {/* Mobile Compare Button */}
            <div className="mt-3 sm:hidden">
              <Button
                onClick={handleCompare}
                variant="outline"
                className="w-full text-slate-400 hover:text-slate-200"
                style={{ border: "1px solid rgba(148, 163, 184, 0.1)", background: "rgba(255, 255, 255, 0.02)" }}
                disabled={isComparing}
              >
                <BarChart3 className="w-4 h-4 mr-1.5" />
                Compare All Algorithms
              </Button>
            </div>
          </div>

          {/* Center — Grid Visualization */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <motion.div
              className="flex flex-col gap-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="rounded-xl overflow-hidden" style={{
                background: "rgba(15, 20, 30, 0.6)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(148, 163, 184, 0.07)",
              }}>
                <Grid
                  size={gridSize}
                  step={currentStep}
                  startPos={startPos}
                  goalPos={goalPos}
                  obstacles={obstacles}
                  onCellClick={handleCellClick}
                  editMode={editMode}
                />
              </div>
              <Legend />
              {/* Edit Mode Hint */}
              {editMode && (
                <motion.p
                  className="text-center text-xs"
                  style={{ color: "rgba(147, 197, 253, 0.6)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Click cells to {editMode === "obstacle" ? "toggle walls" : `place ${editMode}`}
                  {" · "}
                  <button
                    className="underline hover:text-blue-300"
                    onClick={() => setEditMode(null)}
                  >
                    Done
                  </button>
                </motion.p>
              )}
            </motion.div>
          </div>

          {/* Right Panel — Stats */}
          <div className="lg:col-span-1 order-3">
            <StatsPanel
              currentStep={currentStep}
              algorithm={currentAlgorithm}
              executionTime={executionTime}
              backendResult={
                backendResult
                  ? {
                      time_taken: backendResult.time_taken,
                      is_optimal: backendResult.is_optimal,
                      success: backendResult.success,
                      cost: backendResult.cost,
                      nodes_explored: backendResult.nodes_explored,
                    }
                  : null
              }
            />
          </div>
        </div>
      </main>

      {/* Info Modal */}
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </div>
  );
}
