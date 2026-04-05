"""
Iterative Deepening Depth-First Search (IDDFS) Algorithm

Strategy:
    IDDFS combines the space efficiency of DFS with the completeness of BFS.
    It performs a series of DLS searches with increasing depth limits
    (0, 1, 2, ...) until the goal is found.

Properties:
    - Complete: Yes (will find a solution if one exists)
    - Optimal: Yes (finds shallowest solution, like BFS)
    - Time Complexity: O(b^d) – repeated work is bounded by a constant factor
    - Space Complexity: O(b*d) – same as DFS

Data Structure: Stack (repeated DLS iterations)

Key Insight:
    Although nodes at shallower depths are re-expanded in each iteration,
    the asymptotic time complexity is the same as BFS because most nodes
    are at the deepest level.
"""

from typing import List, Tuple

from app.grid import Grid
from app.models import ExplorationStep
from app.algorithms.base import Pos, reconstruct_path, StepRecorder


def iddfs(grid: Grid) -> Tuple[List[Pos], int, List[ExplorationStep]]:
    """
    Perform Iterative Deepening Depth-First Search on the grid.

    Iterates depth limits from 0 to a maximum (rows*cols to guarantee
    completeness on bounded grids), running DLS at each level.

    Args:
        grid: The Grid environment with start, goal, and obstacles.

    Returns:
        (path, nodes_explored, steps) — standard algorithm return tuple.
    """
    recorder = StepRecorder("IDDFS")
    recorder.logger.info("Starting IDDFS on %dx%d grid", grid.rows, grid.cols)

    start = grid.start
    goal = grid.goal

    # Maximum possible depth is bounded by the number of cells in the grid
    max_depth = min(grid.rows * grid.cols, 100)

    total_explored = 0

    for depth_limit in range(max_depth + 1):
        recorder.logger.debug("IDDFS iteration depth_limit=%d", depth_limit)

        # Run a single DLS iteration, continuing the step numbering
        result = _dls_iteration(
            grid, start, goal, depth_limit, recorder,
            iteration_label=depth_limit + 1,
        )
        path, explored_count, found = result
        total_explored += explored_count

        if found:
            return path, total_explored, recorder.steps

    # No path found even at maximum depth
    recorder.record_no_path([], message="No path found")
    return [], total_explored, recorder.steps


def _dls_iteration(
    grid: Grid,
    start: Pos,
    goal: Pos,
    depth_limit: int,
    recorder: StepRecorder,
    iteration_label: int,
) -> Tuple[List[Pos], int, bool]:
    """
    A single DLS iteration used internally by IDDFS.

    Uses the shared recorder so all iterations share one continuous
    step list for the frontend visualizer.

    Returns:
        (path, nodes_explored, goal_found)
    """
    stack: List[Tuple[Pos, int, int]] = [(start, 0, 0)]
    visited = set()
    parent = {start: None}
    explored: List[Pos] = []

    while stack:
        current, cost, depth = stack.pop()

        key = (current, depth)
        if key in visited:
            continue
        visited.add(key)

        explored.append(current)

        recorder.record_visit(
            current=current,
            cost=cost,
            explored=explored,
            frontier=[pos for pos, _, _ in stack],
            message=f"Iteration {iteration_label}: Visiting ({current[0]}, {current[1]})",
        )

        # Goal check
        if current == goal:
            path = reconstruct_path(parent, goal)
            recorder.record_goal_found(
                path,
                message=f"Goal reached at depth {depth_limit}! Path length: {len(path)}",
            )
            return path, len(explored), True

        if depth < depth_limit:
            for neighbor in reversed(grid.get_neighbors(current)):
                nkey = (neighbor, depth + 1)
                if nkey not in visited:
                    parent[neighbor] = current
                    stack.append((neighbor, cost + 1, depth + 1))

    return [], len(explored), False
