/**
 * API Service Layer
 *
 * Provides functions for communicating with the AlgoPath FastAPI backend.
 * Used by the frontend to set grids, run algorithms, and fetch comparisons.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface GridConfig {
  rows: number;
  cols: number;
  obstacles: [number, number][];
  start: [number, number];
  goal: [number, number];
}

export interface AlgorithmResultAPI {
  algorithm: string;
  path: [number, number][];
  nodes_explored: number;
  time_taken: number;
  success: boolean;
  cost: number;
  is_optimal: boolean;
  steps: ExplorationStepAPI[];
  explored_nodes: [number, number][];
}

export interface ExplorationStepAPI {
  explored_nodes: [number, number][];
  frontier_nodes: [number, number][];
  path_nodes: [number, number][];
  current_node: [number, number] | null;
  cost: number;
  step_number: number;
  completed: boolean;
  message: string;
}

export interface ComparisonResultAPI {
  results: AlgorithmResultAPI[];
}

/**
 * Configure the grid on the backend.
 */
export async function setGrid(config: GridConfig): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/set-grid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to set grid");
  }
  return res.json();
}

/**
 * Run a specific algorithm on the current grid.
 */
export async function runAlgorithm(
  algorithm: string,
  depthLimit?: number
): Promise<AlgorithmResultAPI> {
  const body: any = { algorithm };
  if (depthLimit !== undefined) body.depth_limit = depthLimit;

  const res = await fetch(`${API_BASE_URL}/run-algorithm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to run algorithm");
  }
  return res.json();
}

/**
 * Get comparison of all algorithms run so far.
 */
export async function getComparison(): Promise<ComparisonResultAPI> {
  const res = await fetch(`${API_BASE_URL}/compare`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to get comparison");
  }
  return res.json();
}

/**
 * Run all algorithms on the current grid.
 */
export async function runAllAlgorithms(): Promise<ComparisonResultAPI> {
  const res = await fetch(`${API_BASE_URL}/run-all`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to run all algorithms");
  }
  return res.json();
}

/**
 * List available algorithms from the backend.
 */
export async function listAlgorithms(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/algorithms`);
  if (!res.ok) {
    throw new Error("Failed to fetch algorithms");
  }
  return res.json();
}
