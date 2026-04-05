"""
Depth-First Search (DFS) Algorithm

Strategy:
    DFS explores as deep as possible along each branch before backtracking.
    It uses a LIFO stack (or recursion) to prioritize depth over breadth.

Properties:
    - Complete: No (can get stuck in infinite loops without cycle detection;
                we avoid this by maintaining a visited set)
    - Optimal: No (may find a longer path before a shorter one)
    - Time Complexity: O(b^m) where m = maximum depth of the tree
    - Space Complexity: O(b*m) – much better than BFS

Data Structure: Stack (LIFO)
"""

from typing import List, Tuple

from app.grid import Grid
from app.models import ExplorationStep
from app.algorithms.base import Pos, reconstruct_path, StepRecorder


def dfs(grid: Grid) -> Tuple[List[Pos], int, List[ExplorationStep]]:
    """
    Perform Depth-First Search on the grid.

    Args:
        grid: The Grid environment with start, goal, and obstacles.

    Returns:
        (path, nodes_explored, steps) — standard algorithm return tuple.
    """
    recorder = StepRecorder("DFS")
    recorder.logger.info("Starting DFS on %dx%d grid", grid.rows, grid.cols)

    start = grid.start
    goal = grid.goal

    # LIFO stack stores (current_position, cost_so_far)
    stack: List[Tuple[Pos, int]] = [(start, 0)]

    # Track visited nodes to prevent infinite loops
    visited = set()

    # Parent mapping for path reconstruction
    parent = {start: None}

    explored: List[Pos] = []

    while stack:
        current, cost = stack.pop()

        # Skip if already visited (handles duplicates in stack)
        if current in visited:
            continue

        visited.add(current)
        explored.append(current)

        # Record exploration step
        recorder.record_visit(
            current=current,
            cost=cost,
            explored=explored,
            frontier=[pos for pos, _ in stack],
            message=f"Visiting ({current[0]}, {current[1]})",
        )

        # Goal check
        if current == goal:
            path = reconstruct_path(parent, goal)
            recorder.record_goal_found(path)
            return path, len(explored), recorder.steps

        # Push neighbors in reverse order so that the first neighbor
        # in the natural order is popped first (maintains consistency)
        for neighbor in reversed(grid.get_neighbors(current)):
            if neighbor not in visited:
                parent[neighbor] = current
                stack.append((neighbor, cost + 1))

    # No path found
    recorder.record_no_path(explored)
    return [], len(explored), recorder.steps
