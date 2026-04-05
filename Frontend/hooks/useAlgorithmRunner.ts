"use client";

import { useState, useCallback } from "react";
import {
  AlgorithmName,
  ExplorationStep,
  Position,
  getAlgorithmSteps,
} from "@/lib/algorithms";
import {
  setGrid as apiSetGrid,
  runAlgorithm as apiRunAlgorithm,
  runAllAlgorithms as apiRunAll,
  AlgorithmResultAPI,
  ComparisonResultAPI,
} from "@/lib/api";

/** Comparison result for display */
export interface ComparisonEntry {
  algorithm: string;
  nodes_explored: number;
  time_taken: number;
  cost: number;
  success: boolean;
  is_optimal: boolean;
  path_length: number;
}

export const useAlgorithmRunner = () => {
  const [currentAlgorithm, setCurrentAlgorithm] =
    useState<AlgorithmName>("BFS");
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<ExplorationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [gridSize, setGridSize] = useState(8);
  const [speed, setSpeed] = useState(100);
  const [obstacles, setObstacles] = useState<Position[]>([]);
  const [useBackend, setUseBackend] = useState(false);
  const [backendResult, setBackendResult] =
    useState<AlgorithmResultAPI | null>(null);
  const [comparison, setComparison] = useState<ComparisonEntry[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [depthLimit, setDepthLimit] = useState(10);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  /**
   * Convert backend API steps ([row, col] tuples) → frontend steps ({x, y}).
   * Backend convention: (row, col) → Frontend: x=col, y=row.
   */
  const convertBackendSteps = (
    apiSteps: AlgorithmResultAPI["steps"]
  ): ExplorationStep[] => {
    return apiSteps.map((s) => ({
      exploredNodes: s.explored_nodes.map(([r, c]) => ({ x: c, y: r })),
      frontierNodes: s.frontier_nodes.map(([r, c]) => ({ x: c, y: r })),
      pathNodes: s.path_nodes.map(([r, c]) => ({ x: c, y: r })),
      currentNode: s.current_node
        ? { x: s.current_node[1], y: s.current_node[0] }
        : null,
      cost: s.cost,
      distance: s.step_number,
      stepNumber: s.step_number,
      completed: s.completed,
      message: s.message,
    }));
  };

  /**
   * Run algorithm — uses backend API if enabled, otherwise runs client-side.
   * Genetic algorithm always uses the backend.
   */
  const runAlgorithm = useCallback(
    async (start: Position, goal: Position) => {
      setIsRunning(true);
      setCurrentStepIndex(0);
      setBackendResult(null);
      setExecutionTime(null);
      const t0 = performance.now();

      const needsBackend = useBackend || currentAlgorithm === "Genetic";

      if (needsBackend) {
        try {
          // Configure the grid on the backend first
          await apiSetGrid({
            rows: gridSize,
            cols: gridSize,
            obstacles: obstacles.map((o) => [o.y, o.x] as [number, number]),
            start: [start.y, start.x],
            goal: [goal.y, goal.x],
          });

          // Run the selected algorithm
          const result = await apiRunAlgorithm(
            currentAlgorithm,
            currentAlgorithm === "DLS" ? depthLimit : undefined
          );
          setBackendResult(result);
          setExecutionTime(performance.now() - t0);

          // Convert backend steps to frontend format for visualization
          if (result.steps && result.steps.length > 0) {
            const convertedSteps = convertBackendSteps(result.steps);
            setSteps(convertedSteps);
          } else {
            // If backend returns no steps (e.g. for Genetic), create a summary step
            const pathNodes = result.path.map(([r, c]) => ({
              x: c,
              y: r,
            }));
            const exploredNodes = result.explored_nodes.map(([r, c]) => ({
              x: c,
              y: r,
            }));
            setSteps([
              {
                exploredNodes,
                frontierNodes: [],
                pathNodes,
                currentNode: null,
                cost: result.cost,
                distance: 0,
                stepNumber: 1,
                completed: true,
                message: result.success
                  ? `${result.algorithm} complete — Path cost: ${result.cost}`
                  : `${result.algorithm} — No path found`,
              },
            ]);
          }
          setCurrentStepIndex(0);
        } catch (err) {
          console.error("Backend error:", err);
          // Fallback to client-side (unless it's Genetic)
          if (currentAlgorithm !== "Genetic") {
            const newSteps = getAlgorithmSteps(
              currentAlgorithm,
              start,
              goal,
              gridSize,
              obstacles
            );
            setSteps(newSteps);
            setCurrentStepIndex(0);
            setExecutionTime(performance.now() - t0);
          } else {
            setSteps([
              {
                exploredNodes: [],
                frontierNodes: [],
                pathNodes: [],
                currentNode: null,
                cost: 0,
                distance: 0,
                stepNumber: 1,
                completed: true,
                message:
                  "Genetic Algorithm requires the backend server. Please start it with: uvicorn app.main:app",
              },
            ]);
          }
        }
      } else {
        // Run client-side
        const newSteps = getAlgorithmSteps(
          currentAlgorithm,
          start,
          goal,
          gridSize,
          obstacles
        );
        setSteps(newSteps);
        setCurrentStepIndex(0);
        setExecutionTime(performance.now() - t0);
      }
    },
    [currentAlgorithm, gridSize, obstacles, useBackend, depthLimit]
  );

  /**
   * Compare all algorithms. Uses backend if available, otherwise runs
   * all 8 client-side algorithms locally and measures performance.
   */
  const compareAll = useCallback(
    async (start: Position, goal: Position) => {
      setIsComparing(true);
      try {
        // Try backend first
        await apiSetGrid({
          rows: gridSize,
          cols: gridSize,
          obstacles: obstacles.map((o) => [o.y, o.x] as [number, number]),
          start: [start.y, start.x],
          goal: [goal.y, goal.x],
        });

        const result: ComparisonResultAPI = await apiRunAll();
        const entries: ComparisonEntry[] = result.results.map((r) => ({
          algorithm: r.algorithm,
          nodes_explored: r.nodes_explored,
          time_taken: r.time_taken,
          cost: r.cost,
          success: r.success,
          is_optimal: r.is_optimal,
          path_length: r.path.length,
        }));
        setComparison(entries);
      } catch (err) {
        console.warn("Backend unavailable, running comparison client-side");
        // Client-side fallback: run all 8 algorithms locally
        const clientAlgorithms: AlgorithmName[] = [
          "BFS", "DFS", "DLS", "IDDFS", "UCS",
          "Hill Climbing", "Greedy Best First", "A*",
        ];
        // BFS gives optimal cost for unweighted grids
        const bfsSteps = getAlgorithmSteps("BFS", start, goal, gridSize, obstacles);
        const bfsLastStep = bfsSteps[bfsSteps.length - 1];
        const optimalCost = bfsLastStep?.pathNodes.length > 0
          ? bfsLastStep.pathNodes.length - 1
          : Infinity;

        const entries: ComparisonEntry[] = clientAlgorithms.map((algo) => {
          const t0 = performance.now();
          const steps = getAlgorithmSteps(algo, start, goal, gridSize, obstacles);
          const t1 = performance.now();
          const lastStep = steps[steps.length - 1];
          const pathLen = lastStep?.pathNodes.length ?? 0;
          const cost = pathLen > 0 ? pathLen - 1 : 0;
          const success = pathLen > 0;
          return {
            algorithm: algo,
            nodes_explored: lastStep?.exploredNodes.length ?? 0,
            time_taken: (t1 - t0) / 1000,
            cost,
            success,
            is_optimal: success && cost === optimalCost,
            path_length: pathLen,
          };
        });
        setComparison(entries);
      } finally {
        setIsComparing(false);
      }
    },
    [gridSize, obstacles]
  );

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [currentStepIndex, steps.length]);

  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const resetVisualization = useCallback(() => {
    setIsRunning(false);
    setSteps([]);
    setCurrentStepIndex(0);
    setBackendResult(null);
    setExecutionTime(null);
  }, []);

  return {
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
    currentStep: steps[currentStepIndex],
  };
};
