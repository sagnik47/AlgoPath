"""
Pydantic models for API request/response schemas.

Defines the data contracts between the frontend and backend,
including grid configuration, algorithm execution results,
and comparison summaries.
"""

from typing import List, Tuple, Optional
from pydantic import BaseModel, Field, field_validator


# ── Request Models ──────────────────────────────────────────────────────────

class GridConfig(BaseModel):
    """
    Configuration payload for setting up the 2D grid environment.

    Attributes:
        rows: Number of rows in the grid (1-50).
        cols: Number of columns in the grid (1-50).
        obstacles: List of (row, col) tuples marking blocked cells.
        start: (row, col) of the agent's starting position.
        goal: (row, col) of the target position.
    """
    rows: int = Field(..., ge=1, le=50, description="Number of rows (max 50)")
    cols: int = Field(..., ge=1, le=50, description="Number of columns (max 50)")
    obstacles: List[Tuple[int, int]] = Field(
        default_factory=list,
        description="List of (row, col) obstacle positions"
    )
    start: Tuple[int, int] = Field(..., description="Start position as (row, col)")
    goal: Tuple[int, int] = Field(..., description="Goal position as (row, col)")

    @field_validator("obstacles")
    @classmethod
    def validate_obstacles(cls, v, info):
        """Ensure obstacle coordinates fall within the grid bounds."""
        rows = info.data.get("rows")
        cols = info.data.get("cols")
        if rows is not None and cols is not None:
            for r, c in v:
                if not (0 <= r < rows and 0 <= c < cols):
                    raise ValueError(
                        f"Obstacle ({r}, {c}) is out of grid bounds "
                        f"({rows}x{cols})"
                    )
        return v

    @field_validator("start")
    @classmethod
    def validate_start(cls, v, info):
        """Ensure the start position is within grid bounds."""
        rows = info.data.get("rows")
        cols = info.data.get("cols")
        if rows is not None and cols is not None:
            r, c = v
            if not (0 <= r < rows and 0 <= c < cols):
                raise ValueError(
                    f"Start ({r}, {c}) is out of grid bounds ({rows}x{cols})"
                )
        return v

    @field_validator("goal")
    @classmethod
    def validate_goal(cls, v, info):
        """Ensure the goal position is within grid bounds."""
        rows = info.data.get("rows")
        cols = info.data.get("cols")
        if rows is not None and cols is not None:
            r, c = v
            if not (0 <= r < rows and 0 <= c < cols):
                raise ValueError(
                    f"Goal ({r}, {c}) is out of grid bounds ({rows}x{cols})"
                )
        return v


class AlgorithmRequest(BaseModel):
    """
    Request payload for running a specific search algorithm.

    Attributes:
        algorithm: Name of the algorithm to execute.
        depth_limit: Optional depth limit for DLS algorithm.
    """
    algorithm: str = Field(
        ...,
        description="Algorithm name: BFS, DFS, DLS, IDDFS, UCS, "
                    "Hill Climbing, Greedy Best First, A*, Genetic"
    )
    depth_limit: Optional[int] = Field(
        default=10,
        ge=0,
        description="Depth limit for DLS (default: 10)"
    )


# ── Response Models ─────────────────────────────────────────────────────────

class ExplorationStep(BaseModel):
    """
    A single step in the algorithm's exploration process.
    Used by the frontend for step-by-step animated visualization.

    Attributes:
        explored_nodes: All nodes explored up to (and including) this step.
        frontier_nodes: Nodes currently on the frontier / open list.
        path_nodes: If the goal was found at this step, the final path.
        current_node: The node being expanded in this step.
        cost: Accumulated path cost at this step.
        step_number: 1-indexed step counter.
        completed: Whether the algorithm has terminated.
        message: Human-readable description of what happened.
    """
    explored_nodes: List[Tuple[int, int]] = []
    frontier_nodes: List[Tuple[int, int]] = []
    path_nodes: List[Tuple[int, int]] = []
    current_node: Optional[Tuple[int, int]] = None
    cost: int = 0
    step_number: int = 0
    completed: bool = False
    message: str = ""


class AlgorithmResult(BaseModel):
    """
    Summary result returned after running a search algorithm.

    Attributes:
        algorithm: The algorithm that was executed.
        path: Ordered list of (row, col) from start to goal, or empty list.
        nodes_explored: Total count of nodes expanded.
        time_taken: Wall-clock execution time in seconds.
        success: Whether a path from start to goal was found.
        cost: Total cost of the path (each move costs 1).
        is_optimal: Whether the algorithm guarantees optimality.
        steps: Full step-by-step exploration for visualization.
        explored_nodes: All explored node positions (for visualization).
    """
    algorithm: str
    path: List[Tuple[int, int]]
    nodes_explored: int
    time_taken: float
    success: bool
    cost: int
    is_optimal: bool
    steps: List[ExplorationStep] = []
    explored_nodes: List[Tuple[int, int]] = []


class ComparisonResult(BaseModel):
    """
    Side-by-side comparison of all algorithms that have been run
    on the current grid configuration.

    Attributes:
        results: List of per-algorithm result summaries.
    """
    results: List[AlgorithmResult]
