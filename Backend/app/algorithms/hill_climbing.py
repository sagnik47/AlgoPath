"""
Hill Climbing Algorithm

Strategy:
    Hill climbing is a local search algorithm that always moves to the
    neighbor with the best (lowest) heuristic value. It does not maintain
    a frontier or backtrack—it greedily climbs toward what looks like the
    best direction.

Properties:
    - Complete: No (can get stuck at local maxima, plateaus, or ridges)
    - Optimal: No
    - Time Complexity: O(infinity) in worst case, but typically fast
    - Space Complexity: O(1) – only tracks current state

Key Limitation:
    If no neighbor has a better heuristic than the current node,
    the algorithm terminates at a "local maximum" even if the goal
    hasn't been reached. Obstacles frequently create such dead ends.

Data Structure: None (single current state)
"""

from typing import List, Tuple

from app.grid import Grid
from app.models import ExplorationStep
from app.algorithms.base import Pos, StepRecorder


def hill_climbing(grid: Grid) -> Tuple[List[Pos], int, List[ExplorationStep]]:
    """
    Perform Hill Climbing search on the grid.

    Uses Manhattan distance as the heuristic. Moves to the neighbor
    with the smallest heuristic value at each step.

    Args:
        grid: The Grid environment with start, goal, and obstacles.

    Returns:
        (path, nodes_explored, steps) — standard algorithm return tuple.
    """
    recorder = StepRecorder("HillClimbing")
    recorder.logger.info("Starting Hill Climbing on %dx%d grid", grid.rows, grid.cols)

    start = grid.start
    goal = grid.goal

    current = start
    current_h = grid.manhattan_distance(current, goal)
    path: List[Pos] = [current]
    explored: List[Pos] = [current]

    # Record the initial position
    recorder.record_visit(
        current=current,
        cost=0,
        explored=explored,
        frontier=[],
        message=f"Starting at ({current[0]}, {current[1]}) — H: {current_h}",
    )

    while current != goal:
        neighbors = grid.get_neighbors(current)
        best_neighbor = None
        best_h = current_h

        # Find the neighbor with the lowest heuristic value
        for neighbor in neighbors:
            h = grid.manhattan_distance(neighbor, goal)
            if h < best_h:
                best_h = h
                best_neighbor = neighbor

        # If no improvement is possible, we're at a local maximum
        if best_neighbor is None:
            recorder.record_no_path(
                explored,
                message=f"Local maximum reached at ({current[0]}, {current[1]})",
            )
            recorder.logger.warning(
                "Hill Climbing stuck at local max (%d,%d) with h=%d",
                current[0], current[1], current_h,
            )
            # Hill climbing fails – return empty path (no guarantee of reaching goal)
            return [], len(explored), recorder.steps

        # Move to the best neighbor
        current = best_neighbor
        current_h = best_h
        path.append(current)
        explored.append(current)

        recorder.record_visit(
            current=current,
            cost=len(path) - 1,
            explored=explored,
            frontier=[],
            message=f"Moving to ({current[0]}, {current[1]}) — H: {current_h}",
        )

    # Reached the goal — mark the last step as completed
    recorder.record_goal_found(
        path,
        message=f"Goal reached! Steps: {len(path) - 1}",
    )
    return path, len(explored), recorder.steps
