"""
Grid Environment Module

Represents a 2D NxM grid where each cell is either walkable or blocked.
Provides neighbor-lookup and validation utilities used by all search algorithms.

Design Notes:
    - We use adjacency logic (4-directional movement) rather than storing
      an explicit graph. Each cell implicitly connects to its non-blocked
      up/down/left/right neighbors.
    - The grid is stored as a set of obstacle positions for O(1) lookup.
"""

from typing import List, Tuple, Set


class Grid:
    """
    A 2D grid environment for pathfinding.

    Attributes:
        rows (int): Number of rows in the grid.
        cols (int): Number of columns in the grid.
        obstacles (set): Set of (row, col) tuples representing blocked cells.
        start (tuple): Starting position as (row, col).
        goal (tuple): Goal position as (row, col).
    """

    # 4-directional movement: up, down, left, right
    DIRECTIONS = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    def __init__(
        self,
        rows: int,
        cols: int,
        obstacles: List[Tuple[int, int]],
        start: Tuple[int, int],
        goal: Tuple[int, int],
    ):
        self.rows = rows
        self.cols = cols
        self.obstacles: Set[Tuple[int, int]] = set(obstacles)
        self.start = tuple(start)
        self.goal = tuple(goal)

        # Validate that start and goal are not on obstacles
        if self.start in self.obstacles:
            raise ValueError(f"Start position {self.start} is on an obstacle.")
        if self.goal in self.obstacles:
            raise ValueError(f"Goal position {self.goal} is on an obstacle.")

    def is_valid(self, row: int, col: int) -> bool:
        """
        Check if a cell (row, col) is within bounds and not an obstacle.

        Args:
            row: Row index.
            col: Column index.

        Returns:
            True if the cell is walkable, False otherwise.
        """
        return (
            0 <= row < self.rows
            and 0 <= col < self.cols
            and (row, col) not in self.obstacles
        )

    def get_neighbors(self, pos: Tuple[int, int]) -> List[Tuple[int, int]]:
        """
        Return walkable neighbors of the given position.
        Movement is restricted to 4 directions (no diagonals).

        Args:
            pos: Current position as (row, col).

        Returns:
            List of valid neighboring (row, col) positions.
        """
        row, col = pos
        neighbors = []
        for dr, dc in self.DIRECTIONS:
            nr, nc = row + dr, col + dc
            if self.is_valid(nr, nc):
                neighbors.append((nr, nc))
        return neighbors

    def manhattan_distance(
        self, a: Tuple[int, int], b: Tuple[int, int]
    ) -> int:
        """
        Calculate the Manhattan distance between two positions.

        h(n) = |x1 - x2| + |y1 - y2|

        This is an admissible heuristic for grid-based pathfinding
        with uniform movement cost, guaranteeing A* optimality.

        Args:
            a: First position as (row, col).
            b: Second position as (row, col).

        Returns:
            Manhattan distance as an integer.
        """
        return abs(a[0] - b[0]) + abs(a[1] - b[1])

    def __repr__(self) -> str:
        return (
            f"Grid(rows={self.rows}, cols={self.cols}, "
            f"start={self.start}, goal={self.goal}, "
            f"obstacles={len(self.obstacles)})"
        )
