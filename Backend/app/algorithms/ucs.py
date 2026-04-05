"""
Uniform Cost Search (UCS) Algorithm

Strategy:
    UCS expands the node with the lowest accumulated path cost g(n).
    It is a generalization of BFS for weighted graphs—when all edge
    costs are equal (as in our grid), it behaves identically to BFS.

Properties:
    - Complete: Yes (assuming non-negative costs)
    - Optimal: Yes (always finds the least-cost path)
    - Time Complexity: O(b^(1 + C*/ε)) where C* = optimal cost, ε = min edge cost
    - Space Complexity: O(b^(1 + C*/ε))

Data Structure: Priority Queue (min-heap on g-cost)
"""

import heapq
from typing import Dict, List, Tuple

from app.grid import Grid
from app.models import ExplorationStep
from app.algorithms.base import Pos, reconstruct_path, StepRecorder


def ucs(grid: Grid) -> Tuple[List[Pos], int, List[ExplorationStep]]:
    """
    Perform Uniform Cost Search on the grid.

    Each move has a cost of 1. The priority queue ensures the node
    with the smallest total path cost is always expanded next.

    Args:
        grid: The Grid environment with start, goal, and obstacles.

    Returns:
        (path, nodes_explored, steps) — standard algorithm return tuple.
    """
    recorder = StepRecorder("UCS")
    recorder.logger.info("Starting UCS on %dx%d grid", grid.rows, grid.cols)

    start = grid.start
    goal = grid.goal

    # Priority queue: (g_cost, tiebreaker, position)
    # The tiebreaker ensures stable ordering for equal costs
    counter = 0
    frontier = []
    heapq.heappush(frontier, (0, counter, start))

    visited = set()
    parent = {start: None}
    g_cost: Dict[Pos, int] = {start: 0}

    explored: List[Pos] = []

    while frontier:
        cost, _, current = heapq.heappop(frontier)

        # Skip if already expanded (handles stale entries in the heap)
        if current in visited:
            continue

        visited.add(current)
        explored.append(current)

        # Record exploration step
        frontier_positions = [pos for _, _, pos in frontier if pos not in visited]
        recorder.record_visit(
            current=current,
            cost=cost,
            explored=explored,
            frontier=frontier_positions,
            message=f"Visiting ({current[0]}, {current[1]}) — Cost: {cost}",
        )

        # Goal check
        if current == goal:
            path = reconstruct_path(parent, goal)
            recorder.record_goal_found(path, cost=cost)
            return path, len(explored), recorder.steps

        # Expand neighbors
        for neighbor in grid.get_neighbors(current):
            new_cost = cost + 1  # Each move costs 1

            # Only update if we found a cheaper path to this neighbor
            if neighbor not in g_cost or new_cost < g_cost[neighbor]:
                g_cost[neighbor] = new_cost
                parent[neighbor] = current
                counter += 1
                heapq.heappush(frontier, (new_cost, counter, neighbor))

    # No path found
    recorder.record_no_path(explored)
    return [], len(explored), recorder.steps
