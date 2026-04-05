"""
A* Search Algorithm

Strategy:
    A* combines the best of UCS and Greedy Best-First by evaluating
    nodes using f(n) = g(n) + h(n), where:
        - g(n) = actual cost from start to node n
        - h(n) = heuristic estimate of cost from n to goal

    This ensures that A* always expands the most promising node
    while still accounting for the cost already incurred.

Properties:
    - Complete: Yes
    - Optimal: Yes (when h(n) is admissible, i.e., never overestimates)
    - Time Complexity: O(b^d) in worst case
    - Space Complexity: O(b^d) – stores all generated nodes

Heuristic:
    We use Manhattan distance, which is admissible for 4-directional
    movement on a grid with uniform costs.

Data Structure: Priority Queue (min-heap on f-cost)
"""

import heapq
from typing import Dict, List, Tuple

from app.grid import Grid
from app.models import ExplorationStep
from app.algorithms.base import Pos, reconstruct_path, StepRecorder


def astar(grid: Grid) -> Tuple[List[Pos], int, List[ExplorationStep]]:
    """
    Perform A* Search on the grid.

    f(n) = g(n) + h(n), where h(n) = Manhattan distance to goal.

    Args:
        grid: The Grid environment with start, goal, and obstacles.

    Returns:
        (path, nodes_explored, steps) — standard algorithm return tuple.
    """
    recorder = StepRecorder("A*")
    recorder.logger.info("Starting A* on %dx%d grid", grid.rows, grid.cols)

    start = grid.start
    goal = grid.goal

    h_start = grid.manhattan_distance(start, goal)

    # Priority queue: (f_cost, tiebreaker, position)
    counter = 0
    frontier = []
    heapq.heappush(frontier, (h_start, counter, start))

    visited = set()
    parent = {start: None}
    g_cost: Dict[Pos, int] = {start: 0}

    explored: List[Pos] = []

    while frontier:
        f_cost, _, current = heapq.heappop(frontier)

        # Skip if already expanded
        if current in visited:
            continue

        visited.add(current)
        explored.append(current)

        current_g = g_cost[current]

        # Record exploration step
        frontier_positions = [pos for _, _, pos in frontier if pos not in visited]
        recorder.record_visit(
            current=current,
            cost=current_g,
            explored=explored,
            frontier=frontier_positions,
            message=f"Visiting ({current[0]}, {current[1]}) — F: {f_cost} (g={current_g}, h={f_cost - current_g})",
        )

        # Goal check
        if current == goal:
            path = reconstruct_path(parent, goal)
            recorder.record_goal_found(
                path,
                cost=current_g,
                message=f"Goal reached! Path length: {len(path)}, Cost: {current_g}",
            )
            return path, len(explored), recorder.steps

        # Expand neighbors using f(n) = g(n) + h(n)
        for neighbor in grid.get_neighbors(current):
            new_g = current_g + 1  # Each move costs 1
            h = grid.manhattan_distance(neighbor, goal)
            new_f = new_g + h

            # Only consider if we found a cheaper path to this neighbor
            if neighbor not in g_cost or new_g < g_cost[neighbor]:
                g_cost[neighbor] = new_g
                parent[neighbor] = current
                counter += 1
                heapq.heappush(frontier, (new_f, counter, neighbor))

    # No path found
    recorder.record_no_path(explored)
    return [], len(explored), recorder.steps
