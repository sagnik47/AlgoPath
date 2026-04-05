/**
 * Client-side Algorithm Implementations
 *
 * Contains all search algorithms that can run directly in the browser
 * without the backend. Each algorithm produces step-by-step ExplorationSteps
 * for animated visualization on the grid.
 *
 * Algorithms: BFS, DFS, DLS, IDDFS, UCS, Hill Climbing, Greedy Best First, A*
 * (Genetic Algorithm runs server-side only)
 */

export type Position = { x: number; y: number };
export type AlgorithmName =
  | "BFS"
  | "DFS"
  | "DLS"
  | "IDDFS"
  | "UCS"
  | "Hill Climbing"
  | "Greedy Best First"
  | "A*"
  | "Genetic";

export interface ExplorationStep {
  exploredNodes: Position[];
  frontierNodes: Position[];
  pathNodes: Position[];
  currentNode: Position | null;
  cost: number;
  distance: number;
  stepNumber: number;
  completed: boolean;
  message: string;
}

interface Node {
  pos: Position;
  gCost: number; // Cost from start
  hCost: number; // Heuristic cost to goal
  fCost: number; // gCost + hCost
  parent: Node | null;
}

// ── Utility Functions ──────────────────────────────────────────────────────

/** Manhattan distance heuristic: h(n) = |x1 - x2| + |y1 - y2| */
const createHeuristic =
  (goal: Position) =>
  (pos: Position): number => {
    return Math.abs(pos.x - goal.x) + Math.abs(pos.y - goal.y);
  };

/** Get valid 4-directional neighbors, excluding obstacles */
const getNeighbors = (
  pos: Position,
  gridSize: number,
  obstacles: Position[] = []
): Position[] => {
  const neighbors: Position[] = [];
  const directions = [
    { x: 0, y: -1 }, // up
    { x: 1, y: 0 },  // right
    { x: 0, y: 1 },  // down
    { x: -1, y: 0 }, // left
  ];

  const isObstacle = (p: Position) =>
    obstacles.some((o) => o.x === p.x && o.y === p.y);

  for (const dir of directions) {
    const newX = pos.x + dir.x;
    const newY = pos.y + dir.y;
    const candidate = { x: newX, y: newY };
    if (
      newX >= 0 &&
      newX < gridSize &&
      newY >= 0 &&
      newY < gridSize &&
      !isObstacle(candidate)
    ) {
      neighbors.push(candidate);
    }
  }

  return neighbors;
};

const posEqual = (a: Position, b: Position): boolean =>
  a.x === b.x && a.y === b.y;

const posKey = (p: Position) => `${p.x},${p.y}`;

/** Walk back through parent pointers to build the path */
const reconstructPath = (node: Node | null): Position[] => {
  const path: Position[] = [];
  let current = node;
  while (current) {
    path.unshift(current.pos);
    current = current.parent;
  }
  return path;
};

// ── Algorithm Implementations ──────────────────────────────────────────────

/**
 * Breadth-First Search (BFS)
 *
 * Explores nodes level by level using a FIFO queue.
 * Guarantees shortest path in unweighted graphs.
 * Time: O(V+E), Space: O(V)
 */
export const runBFS = (
  start: Position,
  goal: Position,
  gridSize: number,
  obstacles: Position[] = []
): ExplorationStep[] => {
  const steps: ExplorationStep[] = [];
  const queue: Node[] = [
    { pos: start, gCost: 0, hCost: 0, fCost: 0, parent: null },
  ];
  const visited = new Set<string>();
  const explored: Position[] = [];
  let stepNumber = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = posKey(current.pos);

    if (visited.has(key)) continue;
    visited.add(key);
    explored.push(current.pos);

    steps.push({
      exploredNodes: [...explored],
      frontierNodes: queue.map((n) => n.pos),
      pathNodes: [],
      currentNode: current.pos,
      cost: current.gCost,
      distance: steps.length,
      stepNumber: ++stepNumber,
      completed: false,
      message: `Exploring (${current.pos.x}, ${current.pos.y})`,
    });

    if (posEqual(current.pos, goal)) {
      const path = reconstructPath(current);
      steps[steps.length - 1].pathNodes = path;
      steps[steps.length - 1].completed = true;
      steps[steps.length - 1].message = `Goal reached! Path cost: ${path.length - 1}`;
      return steps;
    }

    const neighbors = getNeighbors(current.pos, gridSize, obstacles);
    for (const neighbor of neighbors) {
      const nKey = posKey(neighbor);
      if (!visited.has(nKey)) {
        queue.push({
          pos: neighbor,
          gCost: current.gCost + 1,
          hCost: 0,
          fCost: 0,
          parent: current,
        });
      }
    }
  }

  steps.push({
    exploredNodes: explored,
    frontierNodes: [],
    pathNodes: [],
    currentNode: null,
    cost: 0,
    distance: steps.length,
    stepNumber: ++stepNumber,
    completed: true,
    message: "No path found — goal is unreachable",
  });

  return steps;
};

/**
 * Depth-First Search (DFS)
 *
 * Explores as deep as possible before backtracking using a LIFO stack.
 * Does NOT guarantee shortest path.
 * Time: O(V+E), Space: O(V)
 */
export const runDFS = (
  start: Position,
  goal: Position,
  gridSize: number,
  obstacles: Position[] = []
): ExplorationStep[] => {
  const steps: ExplorationStep[] = [];
  const stack: Node[] = [
    { pos: start, gCost: 0, hCost: 0, fCost: 0, parent: null },
  ];
  const visited = new Set<string>();
  const explored: Position[] = [];
  let stepNumber = 0;

  while (stack.length > 0) {
    const current = stack.pop()!;
    const key = posKey(current.pos);

    if (visited.has(key)) continue;
    visited.add(key);
    explored.push(current.pos);

    steps.push({
      exploredNodes: [...explored],
      frontierNodes: stack.map((n) => n.pos),
      pathNodes: [],
      currentNode: current.pos,
      cost: current.gCost,
      distance: steps.length,
      stepNumber: ++stepNumber,
      completed: false,
      message: `Exploring (${current.pos.x}, ${current.pos.y})`,
    });

    if (posEqual(current.pos, goal)) {
      const path = reconstructPath(current);
      steps[steps.length - 1].pathNodes = path;
      steps[steps.length - 1].completed = true;
      steps[steps.length - 1].message = `Goal reached! Path cost: ${path.length - 1}`;
      return steps;
    }

    const neighbors = getNeighbors(current.pos, gridSize, obstacles);
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const neighbor = neighbors[i];
      const nKey = posKey(neighbor);
      if (!visited.has(nKey)) {
        stack.push({
          pos: neighbor,
          gCost: current.gCost + 1,
          hCost: 0,
          fCost: 0,
          parent: current,
        });
      }
    }
  }

  steps.push({
    exploredNodes: explored,
    frontierNodes: [],
    pathNodes: [],
    currentNode: null,
    cost: 0,
    distance: steps.length,
    stepNumber: ++stepNumber,
    completed: true,
    message: "No path found — goal is unreachable",
  });

  return steps;
};

/**
 * Depth-Limited Search (DLS)
 *
 * DFS with a maximum depth limit to avoid infinite exploration.
 * Time: O(b^l), Space: O(bl) where l is the depth limit
 */
export const runDLS = (
  start: Position,
  goal: Position,
  gridSize: number,
  obstacles: Position[] = [],
  depthLimit: number = 10
): ExplorationStep[] => {
  const steps: ExplorationStep[] = [];
  const stack: (Node & { depth: number })[] = [
    { pos: start, gCost: 0, hCost: 0, fCost: 0, parent: null, depth: 0 },
  ];
  const explored: Position[] = [];
  let stepNumber = 0;
  const visited = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop()!;
    const key = `${posKey(current.pos)}-${current.depth}`;

    if (visited.has(key)) continue;
    visited.add(key);
    explored.push(current.pos);

    steps.push({
      exploredNodes: [...explored],
      frontierNodes: stack.map((n) => n.pos),
      pathNodes: [],
      currentNode: current.pos,
      cost: current.gCost,
      distance: steps.length,
      stepNumber: ++stepNumber,
      completed: false,
      message: `Exploring (${current.pos.x}, ${current.pos.y}) — Depth: ${current.depth}/${depthLimit}`,
    });

    if (posEqual(current.pos, goal)) {
      const path = reconstructPath(current);
      steps[steps.length - 1].pathNodes = path;
      steps[steps.length - 1].completed = true;
      steps[steps.length - 1].message = `Goal reached! Path cost: ${path.length - 1}`;
      return steps;
    }

    if (current.depth < depthLimit) {
      const neighbors = getNeighbors(current.pos, gridSize, obstacles);
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const neighbor = neighbors[i];
        const nKey = `${posKey(neighbor)}-${current.depth + 1}`;
        if (!visited.has(nKey)) {
          stack.push({
            pos: neighbor,
            gCost: current.gCost + 1,
            hCost: 0,
            fCost: 0,
            parent: current,
            depth: current.depth + 1,
          });
        }
      }
    }
  }

  steps.push({
    exploredNodes: explored,
    frontierNodes: [],
    pathNodes: [],
    currentNode: null,
    cost: 0,
    distance: steps.length,
    stepNumber: ++stepNumber,
    completed: true,
    message: `No path found within depth limit ${depthLimit}`,
  });

  return steps;
};

/**
 * Iterative Deepening Depth-First Search (IDDFS)
 *
 * Runs repeated DLS with increasing depth limits.
 * Combines BFS optimality with DFS space efficiency.
 * Time: O(b^d), Space: O(d) where d is the solution depth
 */
export const runIDDFS = (
  start: Position,
  goal: Position,
  gridSize: number,
  obstacles: Position[] = []
): ExplorationStep[] => {
  const allSteps: ExplorationStep[] = [];
  let globalStepNumber = 0;
  const maxDepth = gridSize * gridSize;

  for (let depthLimit = 0; depthLimit <= Math.min(maxDepth, 50); depthLimit++) {
    const stack: (Node & { depth: number })[] = [
      { pos: start, gCost: 0, hCost: 0, fCost: 0, parent: null, depth: 0 },
    ];
    const explored: Position[] = [];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const current = stack.pop()!;
      const key = `${posKey(current.pos)}-${current.depth}`;

      if (visited.has(key)) continue;
      visited.add(key);
      explored.push(current.pos);

      allSteps.push({
        exploredNodes: [...explored],
        frontierNodes: stack.map((n) => n.pos),
        pathNodes: [],
        currentNode: current.pos,
        cost: current.gCost,
        distance: allSteps.length,
        stepNumber: ++globalStepNumber,
        completed: false,
        message: `Depth limit ${depthLimit}: Exploring (${current.pos.x}, ${current.pos.y})`,
      });

      if (posEqual(current.pos, goal)) {
        const path = reconstructPath(current);
        allSteps[allSteps.length - 1].pathNodes = path;
        allSteps[allSteps.length - 1].completed = true;
        allSteps[allSteps.length - 1].message = `Goal reached at depth ${depthLimit}! Path cost: ${path.length - 1}`;
        return allSteps;
      }

      if (current.depth < depthLimit) {
        const neighbors = getNeighbors(current.pos, gridSize, obstacles);
        for (let i = neighbors.length - 1; i >= 0; i--) {
          const neighbor = neighbors[i];
          const nKey = `${posKey(neighbor)}-${current.depth + 1}`;
          if (!visited.has(nKey)) {
            stack.push({
              pos: neighbor,
              gCost: current.gCost + 1,
              hCost: 0,
              fCost: 0,
              parent: current,
              depth: current.depth + 1,
            });
          }
        }
      }
    }
  }

  allSteps.push({
    exploredNodes: [],
    frontierNodes: [],
    pathNodes: [],
    currentNode: null,
    cost: 0,
    distance: allSteps.length,
    stepNumber: allSteps.length + 1,
    completed: true,
    message: "No path found — goal is unreachable",
  });

  return allSteps;
};

/**
 * Uniform Cost Search (UCS)
 *
 * Expands nodes in order of cumulative path cost using a priority queue.
 * Guarantees optimal path for non-negative edge weights.
 * Time: O(V log V), Space: O(V)
 */
export const runUCS = (
  start: Position,
  goal: Position,
  gridSize: number,
  obstacles: Position[] = []
): ExplorationStep[] => {
  const steps: ExplorationStep[] = [];
  const visited = new Set<string>();
  const explored: Position[] = [];
  let stepNumber = 0;

  const frontier: Node[] = [
    { pos: start, gCost: 0, hCost: 0, fCost: 0, parent: null },
  ];

  while (frontier.length > 0) {
    // Priority queue: sort by g-cost (lowest first)
    frontier.sort((a, b) => a.gCost - b.gCost);
    const current = frontier.shift()!;
    const key = posKey(current.pos);

    if (visited.has(key)) continue;
    visited.add(key);
    explored.push(current.pos);

    steps.push({
      exploredNodes: [...explored],
      frontierNodes: frontier.map((n) => n.pos),
      pathNodes: [],
      currentNode: current.pos,
      cost: current.gCost,
      distance: steps.length,
      stepNumber: ++stepNumber,
      completed: false,
      message: `Exploring (${current.pos.x}, ${current.pos.y}) — Cost: ${current.gCost}`,
    });

    if (posEqual(current.pos, goal)) {
      const path = reconstructPath(current);
      steps[steps.length - 1].pathNodes = path;
      steps[steps.length - 1].completed = true;
      steps[steps.length - 1].message = `Goal reached! Total cost: ${current.gCost}`;
      return steps;
    }

    const neighbors = getNeighbors(current.pos, gridSize, obstacles);
    for (const neighbor of neighbors) {
      const nKey = posKey(neighbor);
      if (!visited.has(nKey)) {
        const newNode: Node = {
          pos: neighbor,
          gCost: current.gCost + 1,
          hCost: 0,
          fCost: 0,
          parent: current,
        };
        const existing = frontier.find((n) => posEqual(n.pos, neighbor));
        if (!existing || existing.gCost > newNode.gCost) {
          if (existing) {
            frontier.splice(frontier.indexOf(existing), 1);
          }
          frontier.push(newNode);
        }
      }
    }
  }

  steps.push({
    exploredNodes: explored,
    frontierNodes: [],
    pathNodes: [],
    currentNode: null,
    cost: 0,
    distance: steps.length,
    stepNumber: ++stepNumber,
    completed: true,
    message: "No path found — goal is unreachable",
  });

  return steps;
};

/**
 * Greedy Best-First Search
 *
 * Uses heuristic h(n) only to decide expansion order.
 * Fast but does NOT guarantee optimal paths.
 * Time: O(b^m), Space: O(b^m)
 */
export const runGreedyBestFirst = (
  start: Position,
  goal: Position,
  gridSize: number,
  obstacles: Position[] = []
): ExplorationStep[] => {
  const steps: ExplorationStep[] = [];
  const visited = new Set<string>();
  const explored: Position[] = [];
  let stepNumber = 0;

  const h = createHeuristic(goal);
  const frontier: Node[] = [
    { pos: start, gCost: 0, hCost: h(start), fCost: h(start), parent: null },
  ];

  while (frontier.length > 0) {
    // Sort by heuristic only
    frontier.sort((a, b) => a.hCost - b.hCost);
    const current = frontier.shift()!;
    const key = posKey(current.pos);

    if (visited.has(key)) continue;
    visited.add(key);
    explored.push(current.pos);

    steps.push({
      exploredNodes: [...explored],
      frontierNodes: frontier.map((n) => n.pos),
      pathNodes: [],
      currentNode: current.pos,
      cost: current.gCost,
      distance: steps.length,
      stepNumber: ++stepNumber,
      completed: false,
      message: `Exploring (${current.pos.x}, ${current.pos.y}) — h=${current.hCost}`,
    });

    if (posEqual(current.pos, goal)) {
      const path = reconstructPath(current);
      steps[steps.length - 1].pathNodes = path;
      steps[steps.length - 1].completed = true;
      steps[steps.length - 1].message = `Goal reached! Path cost: ${path.length - 1}`;
      return steps;
    }

    const neighbors = getNeighbors(current.pos, gridSize, obstacles);
    for (const neighbor of neighbors) {
      const nKey = posKey(neighbor);
      if (!visited.has(nKey)) {
        const newNode: Node = {
          pos: neighbor,
          gCost: current.gCost + 1,
          hCost: h(neighbor),
          fCost: 0,
          parent: current,
        };
        const existing = frontier.find((n) => posEqual(n.pos, neighbor));
        if (!existing || existing.hCost > newNode.hCost) {
          if (existing) {
            frontier.splice(frontier.indexOf(existing), 1);
          }
          frontier.push(newNode);
        }
      }
    }
  }

  steps.push({
    exploredNodes: explored,
    frontierNodes: [],
    pathNodes: [],
    currentNode: null,
    cost: 0,
    distance: steps.length,
    stepNumber: ++stepNumber,
    completed: true,
    message: "No path found — goal is unreachable",
  });

  return steps;
};

/**
 * Hill Climbing
 *
 * Greedy local search — always moves to the neighbor with lowest h(n).
 * Very fast but gets stuck at local minima. No backtracking.
 */
export const runHillClimbing = (
  start: Position,
  goal: Position,
  gridSize: number,
  obstacles: Position[] = []
): ExplorationStep[] => {
  const steps: ExplorationStep[] = [];
  const explored: Position[] = [];
  let stepNumber = 0;

  const h = createHeuristic(goal);
  let current = start;
  let currentH = h(current);
  explored.push(current);

  steps.push({
    exploredNodes: [...explored],
    frontierNodes: [],
    pathNodes: [],
    currentNode: current,
    cost: 0,
    distance: 0,
    stepNumber: ++stepNumber,
    completed: false,
    message: `Start at (${current.x}, ${current.y}) — h=${currentH}`,
  });

  while (!posEqual(current, goal)) {
    const neighbors = getNeighbors(current, gridSize, obstacles);
    let bestNeighbor = null;
    let bestH = currentH;

    for (const neighbor of neighbors) {
      const nH = h(neighbor);
      if (nH < bestH) {
        bestH = nH;
        bestNeighbor = neighbor;
      }
    }

    if (!bestNeighbor) {
      steps.push({
        exploredNodes: explored,
        frontierNodes: [],
        pathNodes: [],
        currentNode: current,
        cost: stepNumber - 1,
        distance: stepNumber - 1,
        stepNumber: ++stepNumber,
        completed: true,
        message: `Stuck at local minimum (${current.x}, ${current.y}) — no better neighbor`,
      });
      break;
    }

    current = bestNeighbor;
    currentH = bestH;
    explored.push(current);

    steps.push({
      exploredNodes: [...explored],
      frontierNodes: [],
      pathNodes: [],
      currentNode: current,
      cost: stepNumber - 1,
      distance: stepNumber - 1,
      stepNumber: ++stepNumber,
      completed: false,
      message: `Moving to (${current.x}, ${current.y}) — h=${currentH}`,
    });
  }

  if (posEqual(current, goal)) {
    steps[steps.length - 1].pathNodes = [...explored];
    steps[steps.length - 1].completed = true;
    steps[steps.length - 1].message = `Goal reached! Steps: ${stepNumber - 1}`;
  }

  return steps;
};

/**
 * A* Search
 *
 * Uses f(n) = g(n) + h(n) to find optimal path efficiently.
 * With admissible heuristic (Manhattan), guarantees optimality.
 * Time: O(b^d), Space: O(b^d)
 */
export const runAStar = (
  start: Position,
  goal: Position,
  gridSize: number,
  obstacles: Position[] = []
): ExplorationStep[] => {
  const steps: ExplorationStep[] = [];
  const visited = new Set<string>();
  const explored: Position[] = [];
  let stepNumber = 0;

  const h = createHeuristic(goal);
  const frontier: Node[] = [
    {
      pos: start,
      gCost: 0,
      hCost: h(start),
      fCost: h(start),
      parent: null,
    },
  ];

  while (frontier.length > 0) {
    // Sort by f-cost = g + h (lowest first)
    frontier.sort((a, b) => a.fCost - b.fCost);
    const current = frontier.shift()!;
    const key = posKey(current.pos);

    if (visited.has(key)) continue;
    visited.add(key);
    explored.push(current.pos);

    steps.push({
      exploredNodes: [...explored],
      frontierNodes: frontier.map((n) => n.pos),
      pathNodes: [],
      currentNode: current.pos,
      cost: current.gCost,
      distance: steps.length,
      stepNumber: ++stepNumber,
      completed: false,
      message: `Exploring (${current.pos.x}, ${current.pos.y}) — f=${current.fCost} (g=${current.gCost}, h=${current.hCost})`,
    });

    if (posEqual(current.pos, goal)) {
      const path = reconstructPath(current);
      steps[steps.length - 1].pathNodes = path;
      steps[steps.length - 1].completed = true;
      steps[steps.length - 1].message = `Goal reached! Path cost: ${current.gCost}`;
      return steps;
    }

    const neighbors = getNeighbors(current.pos, gridSize, obstacles);
    for (const neighbor of neighbors) {
      const nKey = posKey(neighbor);
      if (!visited.has(nKey)) {
        const gCost = current.gCost + 1;
        const hCost = h(neighbor);
        const fCost = gCost + hCost;

        const newNode: Node = {
          pos: neighbor,
          gCost,
          hCost,
          fCost,
          parent: current,
        };

        const existing = frontier.find((n) => posEqual(n.pos, neighbor));
        if (!existing || existing.gCost > gCost) {
          if (existing) {
            frontier.splice(frontier.indexOf(existing), 1);
          }
          frontier.push(newNode);
        }
      }
    }
  }

  steps.push({
    exploredNodes: explored,
    frontierNodes: [],
    pathNodes: [],
    currentNode: null,
    cost: 0,
    distance: steps.length,
    stepNumber: ++stepNumber,
    completed: true,
    message: "No path found — goal is unreachable",
  });

  return steps;
};

// ── Algorithm Dispatcher ───────────────────────────────────────────────────

/**
 * Run the specified algorithm and return step-by-step exploration data.
 * The Genetic algorithm is server-side only and not handled here.
 */
export const getAlgorithmSteps = (
  algorithm: AlgorithmName,
  start: Position,
  goal: Position,
  gridSize: number,
  obstacles: Position[] = []
): ExplorationStep[] => {
  switch (algorithm) {
    case "BFS":
      return runBFS(start, goal, gridSize, obstacles);
    case "DFS":
      return runDFS(start, goal, gridSize, obstacles);
    case "DLS":
      return runDLS(start, goal, gridSize, obstacles, 10);
    case "IDDFS":
      return runIDDFS(start, goal, gridSize, obstacles);
    case "UCS":
      return runUCS(start, goal, gridSize, obstacles);
    case "Hill Climbing":
      return runHillClimbing(start, goal, gridSize, obstacles);
    case "Greedy Best First":
      return runGreedyBestFirst(start, goal, gridSize, obstacles);
    case "A*":
      return runAStar(start, goal, gridSize, obstacles);
    default:
      return [];
  }
};
