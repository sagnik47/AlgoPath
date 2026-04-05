"""
Breadth-First Search (BFS) Algorithm

Strategy:
    BFS explores the search tree level-by-level using a FIFO queue.
    It expands all nodes at depth d before moving on to depth d+1.

Properties:
    - Complete: Yes (always finds a solution if one exists)
    - Optimal: Yes (finds shortest path when all edge costs are equal)
    - Time Complexity: O(b^d) where b = branching factor, d = depth
    - Space Complexity: O(b^d) – stores all nodes at current level

Data Structure: Queue (FIFO)
"""

from collections import deque
from typing import List, Tuple

from app.grid import Grid
from app.models import ExplorationStep
from app.algorithms.base import Pos, reconstruct_path, StepRecorder


def bfs(grid: Grid) -> Tuple[List[Pos], int, List[ExplorationStep]]:
    """
    Perform Breadth-First Search on the grid.

    Args:
        grid: The Grid environment with start, goal, and obstacles.

    Returns:
        (path, nodes_explored, steps) — standard algorithm return tuple.
    """
    recorder = StepRecorder("BFS")
    recorder.logger.info("Starting BFS on %dx%d grid", grid.rows, grid.cols)

    start = grid.start
    goal = grid.goal

    # FIFO queue stores (current_position, cost_so_far)
    queue: deque = deque()
    queue.append((start, 0))

    # Track visited nodes to avoid revisiting
    visited = {start}

    # Parent mapping for path reconstruction
    parent = {start: None}

    explored: List[Pos] = []

    while queue:
        current, cost = queue.popleft()
        explored.append(current)

        # Record this exploration step for the frontend visualizer
        recorder.record_visit(
            current=current,
            cost=cost,
            explored=explored,
            frontier=[pos for pos, _ in queue],
            message=f"Visiting ({current[0]}, {current[1]})",
        )

        # Goal check: if we reached the goal, reconstruct the path
        if current == goal:
            path = reconstruct_path(parent, goal)
            recorder.record_goal_found(path)
            return path, len(explored), recorder.steps

        # Expand neighbors in all 4 directions
        for neighbor in grid.get_neighbors(current):
            if neighbor not in visited:
                visited.add(neighbor)
                parent[neighbor] = current
                queue.append((neighbor, cost + 1))

    # No path found – all reachable nodes have been explored
    recorder.record_no_path(explored)
    return [], len(explored), recorder.steps
