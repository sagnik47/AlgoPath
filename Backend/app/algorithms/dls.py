"""
Depth-Limited Search (DLS) Algorithm

Strategy:
    DLS is a variant of DFS that imposes a maximum depth limit.
    Nodes beyond the depth limit are not expanded, which prevents
    the algorithm from exploring infinitely deep paths.

Properties:
    - Complete: No (may miss solutions deeper than the limit)
    - Optimal: No (same as DFS within the depth limit)
    - Time Complexity: O(b^l) where l = depth limit
    - Space Complexity: O(b*l)

Data Structure: Stack (LIFO) with depth tracking
"""

from typing import List, Tuple

from app.grid import Grid
from app.models import ExplorationStep
from app.algorithms.base import Pos, reconstruct_path, StepRecorder


def dls(
    grid: Grid,
    depth_limit: int = 10,
) -> Tuple[List[Pos], int, List[ExplorationStep]]:
    """
    Perform Depth-Limited Search on the grid.

    Args:
        grid:        The Grid environment with start, goal, and obstacles.
        depth_limit: Maximum depth to explore (default: 10).

    Returns:
        (path, nodes_explored, steps) — standard algorithm return tuple.
    """
    recorder = StepRecorder("DLS")
    recorder.logger.info(
        "Starting DLS on %dx%d grid with depth_limit=%d",
        grid.rows, grid.cols, depth_limit,
    )

    start = grid.start
    goal = grid.goal

    # Stack stores (position, cost, depth)
    stack: List[Tuple[Pos, int, int]] = [(start, 0, 0)]

    # Use depth-aware visited keys to allow revisiting at shallower depths
    visited = set()

    # Parent mapping for path reconstruction
    parent = {start: None}

    explored: List[Pos] = []

    while stack:
        current, cost, depth = stack.pop()

        # Depth-aware key: same position at different depths is allowed
        key = (current, depth)
        if key in visited:
            continue
        visited.add(key)

        explored.append(current)

        # Record exploration step
        recorder.record_visit(
            current=current,
            cost=cost,
            explored=explored,
            frontier=[pos for pos, _, _ in stack],
            message=f"Visiting ({current[0]}, {current[1]}) — Depth: {depth}/{depth_limit}",
        )

        # Goal check
        if current == goal:
            path = reconstruct_path(parent, goal)
            recorder.record_goal_found(path)
            return path, len(explored), recorder.steps

        # Only expand if we haven't hit the depth limit
        if depth < depth_limit:
            for neighbor in reversed(grid.get_neighbors(current)):
                nkey = (neighbor, depth + 1)
                if nkey not in visited:
                    parent[neighbor] = current
                    stack.append((neighbor, cost + 1, depth + 1))

    # No path found within the depth limit
    recorder.record_no_path(
        explored,
        message=f"No path found within depth limit {depth_limit}",
    )
    return [], len(explored), recorder.steps
