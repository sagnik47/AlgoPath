"""
Shared Base Utilities for All Search Algorithms

This module eliminates redundancy across algorithm implementations by
providing common helpers for:
    - Path reconstruction from parent maps
    - ExplorationStep recording (step snapshots for the frontend)
    - Structured logging with per-algorithm loggers
    - Goal-found / no-path-found step finalization

Every algorithm module imports from here instead of duplicating these
patterns. This keeps individual algorithm files focused purely on their
search logic.

Design Notes:
    - StepRecorder encapsulates the mutable step-list and step-counter,
      so each algorithm just calls recorder.record(...) and doesn't worry
      about field construction.
    - Logging uses Python's stdlib logging with a hierarchical
      'algopath.algorithms.<name>' namespace for easy filtering.
"""

import logging
from typing import Dict, List, Optional, Tuple

from app.models import ExplorationStep

# ── Type Aliases ────────────────────────────────────────────────────────────

Pos = Tuple[int, int]
ParentMap = Dict[Pos, Optional[Pos]]

# ── Root Logger ─────────────────────────────────────────────────────────────

# All algorithm loggers live under this namespace.
# Configure the root 'algopath' logger once in main.py or at import time.
_root_logger = logging.getLogger("algopath.algorithms")


def get_logger(algorithm_name: str) -> logging.Logger:
    """
    Return a child logger for a specific algorithm.

    Usage (in bfs.py):
        logger = get_logger("BFS")
        logger.info("Starting BFS on 10x10 grid")

    The resulting logger name is 'algopath.algorithms.BFS' which can be
    filtered independently in logging config.
    """
    return _root_logger.getChild(algorithm_name)


# ── Path Reconstruction ────────────────────────────────────────────────────

def reconstruct_path(parent: ParentMap, goal: Pos) -> List[Pos]:
    """
    Trace back from goal to start using the parent mapping.

    This function is used by every graph-search algorithm to convert
    the parent pointers into an ordered start→goal path.

    Args:
        parent: Dictionary mapping each node to its predecessor.
                The start node maps to None.
        goal:   Goal position (row, col).

    Returns:
        Ordered list of positions from start to goal.
        Empty list if goal is not in the parent map.
    """
    if goal not in parent:
        return []

    path: List[Pos] = []
    current: Optional[Pos] = goal
    while current is not None:
        path.append(current)
        current = parent[current]
    path.reverse()
    return path


# ── Step Recorder ───────────────────────────────────────────────────────────

class StepRecorder:
    """
    Encapsulates step-by-step exploration recording for the frontend.

    Instead of each algorithm manually constructing ExplorationStep objects,
    they call methods on this recorder. This guarantees a consistent step
    format across all algorithms and centralises the logging of each step.

    Example usage inside an algorithm:
        recorder = StepRecorder("BFS")
        recorder.record_visit(
            current=current,
            cost=cost,
            explored=explored_list,
            frontier=frontier_positions,
            message=f"Visiting ({current[0]}, {current[1]})"
        )
        ...
        recorder.record_goal_found(path)
        return path, len(explored), recorder.steps
    """

    def __init__(self, algorithm_name: str, step_offset: int = 0):
        """
        Args:
            algorithm_name: Human-readable name (e.g. "BFS", "A*").
            step_offset:    Starting step number (used by IDDFS which chains
                            multiple DLS iterations together).
        """
        self.algorithm_name = algorithm_name
        self.step_number = step_offset
        self.steps: List[ExplorationStep] = []
        self.logger = get_logger(algorithm_name)

    def record_visit(
        self,
        current: Pos,
        cost: int,
        explored: List[Pos],
        frontier: List[Pos],
        message: str,
    ) -> ExplorationStep:
        """
        Record a single node-expansion step.

        This is the most common operation — called once per node the
        algorithm expands. The step snapshot captures the full state
        of the search at this moment for animated replay in the frontend.

        Args:
            current:  The node being expanded.
            cost:     Accumulated path cost to this node.
            explored: All nodes explored so far (inclusive).
            frontier: Nodes currently on the open list / frontier.
            message:  Human-readable description for the UI.

        Returns:
            The ExplorationStep that was appended (so callers can
            mutate it for goal-found, etc.).
        """
        self.step_number += 1

        step = ExplorationStep(
            explored_nodes=list(explored),
            frontier_nodes=list(frontier),
            path_nodes=[],
            current_node=current,
            cost=cost,
            step_number=self.step_number,
            completed=False,
            message=message,
        )
        self.steps.append(step)

        # Log every step at DEBUG level for traceability
        self.logger.debug(
            "Step %d: expanding (%d,%d) | cost=%d | explored=%d | frontier=%d",
            self.step_number, current[0], current[1],
            cost, len(explored), len(frontier),
        )

        return step

    def record_goal_found(
        self,
        path: List[Pos],
        cost: Optional[int] = None,
        message: Optional[str] = None,
    ) -> None:
        """
        Mark the last recorded step as the goal-found step.

        Mutates the most recent step in self.steps to set:
            - path_nodes = the final path
            - completed = True
            - message = success message

        Args:
            path:    The reconstructed start→goal path.
            cost:    Override cost for the final step (defaults to path len - 1).
            message: Override message (defaults to auto-generated).
        """
        if not self.steps:
            return

        final_cost = cost if cost is not None else (len(path) - 1)
        final_msg = message or f"Goal reached! Path length: {len(path)}, Cost: {final_cost}"

        self.steps[-1].path_nodes = path
        self.steps[-1].completed = True
        self.steps[-1].message = final_msg

        self.logger.info(
            "Goal found in %d steps | path_length=%d | cost=%d",
            self.step_number, len(path), final_cost,
        )

    def record_no_path(
        self,
        explored: List[Pos],
        message: str = "No path found",
    ) -> None:
        """
        Append a final termination step indicating no path exists.

        Args:
            explored: All nodes that were explored before termination.
            message:  Human-readable failure message.
        """
        self.step_number += 1
        self.steps.append(ExplorationStep(
            explored_nodes=list(explored),
            frontier_nodes=[],
            path_nodes=[],
            current_node=None,
            cost=0,
            step_number=self.step_number,
            completed=True,
            message=message,
        ))

        self.logger.info(
            "No path found after %d steps | explored=%d | reason: %s",
            self.step_number, len(explored), message,
        )
