"""
Greedy Best-First Search Algorithm

Strategy:
    Greedy Best-First expands the node that appears closest to the goal
    according to the heuristic function h(n). Unlike A*, it ignores the
    cost already paid to reach the current node (g(n)).

Properties:
    - Complete: Yes (with cycle detection, in finite spaces)
    - Optimal: No (heuristic may lead through costly paths)
    - Time Complexity: O(b^m) in worst case
    - Space Complexity: O(b^m) – stores all generated nodes

Data Structure: Priority Queue (min-heap on h-cost)
"""

import heapq
from typing import Dict, List, Tuple

from app.grid import Grid
from app.models import ExplorationStep
from app.algorithms.base import Pos, reconstruct_path, StepRecorder


def greedy_best_first(grid: Grid) -> Tuple[List[Pos], int, List[ExplorationStep]]:
    """
    Perform Greedy Best-First Search on the grid.

    Uses Manhattan distance as h(n). Expands the node with the
    smallest heuristic value first.

    Args:
        grid: The Grid environment with start, goal, and obstacles.

    Returns:
        (path, nodes_explored, steps) — standard algorithm return tuple.
    """
    recorder = StepRecorder("GreedyBestFirst")
    recorder.logger.info("Starting Greedy Best-First on %dx%d grid", grid.rows, grid.cols)

    start = grid.start
    goal = grid.goal

    # Priority queue: (h_cost, tiebreaker, position)
    counter = 0
    h_start = grid.manhattan_distance(start, goal)
    frontier = []
    heapq.heappush(frontier, (h_start, counter, start))

    visited = set()
    parent = {start: None}
    cost_map: Dict[Pos, int] = {start: 0}

    explored: List[Pos] = []

    while frontier:
        h_cost, _, current = heapq.heappop(frontier)

        if current in visited:
            continue

        visited.add(current)
        explored.append(current)

        current_cost = cost_map.get(current, 0)

        # Record exploration step
        frontier_positions = [pos for _, _, pos in frontier if pos not in visited]
        recorder.record_visit(
            current=current,
            cost=current_cost,
            explored=explored,
            frontier=frontier_positions,
            message=f"Visiting ({current[0]}, {current[1]}) — H: {h_cost}",
        )

        # Goal check
        if current == goal:
            path = reconstruct_path(parent, goal)
            recorder.record_goal_found(path)
            return path, len(explored), recorder.steps

        # Expand neighbors – priority based solely on heuristic
        for neighbor in grid.get_neighbors(current):
            if neighbor not in visited and neighbor not in cost_map:
                h = grid.manhattan_distance(neighbor, goal)
                cost_map[neighbor] = current_cost + 1
                parent[neighbor] = current
                counter += 1
                heapq.heappush(frontier, (h, counter, neighbor))

    # No path found
    recorder.record_no_path(explored)
    return [], len(explored), recorder.steps
