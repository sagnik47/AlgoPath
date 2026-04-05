"""
Genetic Algorithm for Path Evolution (Bonus)

Strategy:
    Simulates biological evolution to evolve candidate paths from start
    to goal. Each "chromosome" is a sequence of moves (directions) that
    an agent would follow from the start position.

    Steps per generation:
        1. Evaluate fitness (how close the path endpoint is to the goal,
           penalizing invalid moves and rewarding shorter paths)
        2. Select parents (tournament selection)
        3. Crossover (single-point crossover between two parent paths)
        4. Mutation (randomly change a direction in the path)

Properties:
    - Complete: No (stochastic, may not find a solution)
    - Optimal: No (approximate / heuristic method)
    - Good for: Demonstrating evolutionary computation concepts

Note:
    This is a simplified educational implementation. Real-world GA
    pathfinding would use more sophisticated representations.
"""

import random
from typing import List, Tuple

from app.grid import Grid
from app.models import ExplorationStep
from app.algorithms.base import Pos, StepRecorder

# Direction mappings: index -> (row_delta, col_delta)
DIRECTIONS = [(-1, 0), (1, 0), (0, -1), (0, 1)]  # up, down, left, right


def genetic_algorithm(
    grid: Grid,
    population_size: int = 100,
    generations: int = 200,
    mutation_rate: float = 0.15,
    chromosome_length: int = None,
) -> Tuple[List[Pos], int, List[ExplorationStep]]:
    """
    Perform Genetic Algorithm-based path search.

    Each chromosome is a list of direction indices (0-3).
    The agent starts at grid.start and follows the directions.
    Invalid moves (out of bounds or into obstacles) are skipped.

    Args:
        grid:              The Grid environment.
        population_size:   Number of individuals per generation.
        generations:       Maximum number of generations to evolve.
        mutation_rate:     Probability of mutating each gene.
        chromosome_length: Length of each chromosome. Defaults to
                          Manhattan distance * 3 to give enough moves.

    Returns:
        (path, nodes_explored, steps) — standard algorithm return tuple.
    """
    recorder = StepRecorder("Genetic")
    recorder.logger.info(
        "Starting Genetic Algorithm on %dx%d grid | pop=%d, gens=%d, mut=%.2f",
        grid.rows, grid.cols, population_size, generations, mutation_rate,
    )

    start = grid.start
    goal = grid.goal

    # Default chromosome length based on grid size
    if chromosome_length is None:
        manhattan = grid.manhattan_distance(start, goal)
        chromosome_length = max(manhattan * 3, grid.rows + grid.cols)

    # Initialize random population
    population = [
        _random_chromosome(chromosome_length) for _ in range(population_size)
    ]

    total_evaluated = 0
    best_path_ever: List[Pos] = []
    best_fitness_ever = float("-inf")

    for gen in range(generations):
        # Evaluate fitness for each individual
        fitness_scores = []
        paths = []
        all_explored = set()

        for chromosome in population:
            path = _decode_chromosome(grid, chromosome, start)
            fitness = _evaluate_fitness(path, goal, grid)
            fitness_scores.append(fitness)
            paths.append(path)
            total_evaluated += len(path)
            all_explored.update(path)

        # Track the best individual this generation
        best_idx = fitness_scores.index(max(fitness_scores))
        best_path = paths[best_idx]
        best_fitness = fitness_scores[best_idx]

        if best_fitness > best_fitness_ever:
            best_fitness_ever = best_fitness
            best_path_ever = best_path

        # Check if goal is reached
        goal_reached = best_path[-1] == goal if best_path else False

        # Record one step per generation for visualization
        recorder.record_visit(
            current=best_path[-1] if best_path else start,
            cost=len(best_path) - 1 if best_path else 0,
            explored=list(all_explored),
            frontier=[],
            message=(
                f"Gen {gen + 1}: Best fitness={best_fitness:.1f}, "
                f"Endpoint=({best_path[-1][0]}, {best_path[-1][1]})"
                if best_path else f"Gen {gen + 1}: Empty paths"
            ),
        )

        if goal_reached:
            # Trim the path to remove unnecessary moves after reaching goal
            trimmed = _trim_path(best_path, goal)
            recorder.record_goal_found(
                trimmed,
                message=f"Goal reached in generation {gen + 1}! Path length: {len(trimmed)}",
            )
            recorder.logger.info(
                "Genetic converged at generation %d | path_length=%d",
                gen + 1, len(trimmed),
            )
            return trimmed, total_evaluated, recorder.steps

        recorder.logger.debug(
            "Gen %d: best_fitness=%.1f, endpoint=(%d,%d)",
            gen + 1, best_fitness,
            best_path[-1][0] if best_path else -1,
            best_path[-1][1] if best_path else -1,
        )

        # Create next generation through selection, crossover, mutation
        new_population = []

        # Elitism: keep the best individual
        new_population.append(population[best_idx])

        while len(new_population) < population_size:
            # Tournament selection
            parent1 = _tournament_select(population, fitness_scores)
            parent2 = _tournament_select(population, fitness_scores)

            # Crossover
            child1, child2 = _crossover(parent1, parent2)

            # Mutation
            child1 = _mutate(child1, mutation_rate)
            child2 = _mutate(child2, mutation_rate)

            new_population.extend([child1, child2])

        population = new_population[:population_size]

    # Algorithm did not reach the goal
    recorder.record_no_path(
        [],
        message=f"No path found after {generations} generations",
    )
    return [], total_evaluated, recorder.steps


# ── Private Helpers ─────────────────────────────────────────────────────────


def _random_chromosome(length: int) -> List[int]:
    """Generate a random chromosome (list of direction indices)."""
    return [random.randint(0, 3) for _ in range(length)]


def _decode_chromosome(
    grid: Grid,
    chromosome: List[int],
    start: Pos,
) -> List[Pos]:
    """
    Convert a chromosome (direction sequence) into a path on the grid.
    Invalid moves are skipped.
    """
    path = [start]
    current = start
    visited = {start}

    for gene in chromosome:
        dr, dc = DIRECTIONS[gene]
        nr, nc = current[0] + dr, current[1] + dc
        next_pos = (nr, nc)

        # Only move if valid and not revisiting
        if grid.is_valid(nr, nc) and next_pos not in visited:
            current = next_pos
            path.append(current)
            visited.add(current)

            # Stop early if we reached the goal
            if current == grid.goal:
                break

    return path


def _evaluate_fitness(
    path: List[Pos],
    goal: Pos,
    grid: Grid,
) -> float:
    """
    Evaluate the fitness of a decoded path.

    Higher fitness = better. Components:
        - Distance penalty: negative Manhattan distance from endpoint to goal
        - Path length bonus: shorter paths are preferred
        - Goal bonus: large bonus if the path reaches the goal
    """
    if not path:
        return -1000.0

    endpoint = path[-1]
    dist = grid.manhattan_distance(endpoint, goal)

    # Base fitness: negative distance (closer = higher fitness)
    fitness = -dist * 10.0

    # Penalize very long paths
    fitness -= len(path) * 0.5

    # Large bonus for reaching the goal
    if endpoint == goal:
        fitness += 1000.0
        # Extra bonus for shorter goal-reaching paths
        fitness -= len(path) * 2.0

    return fitness


def _tournament_select(
    population: List[List[int]],
    fitness_scores: List[float],
    tournament_size: int = 5,
) -> List[int]:
    """Select an individual using tournament selection."""
    indices = random.sample(range(len(population)), min(tournament_size, len(population)))
    best_idx = max(indices, key=lambda i: fitness_scores[i])
    return population[best_idx]


def _crossover(
    parent1: List[int],
    parent2: List[int],
) -> Tuple[List[int], List[int]]:
    """Single-point crossover between two parents."""
    if len(parent1) < 2:
        return parent1[:], parent2[:]

    point = random.randint(1, len(parent1) - 1)
    child1 = parent1[:point] + parent2[point:]
    child2 = parent2[:point] + parent1[point:]
    return child1, child2


def _mutate(chromosome: List[int], mutation_rate: float) -> List[int]:
    """Randomly mutate direction genes in the chromosome."""
    mutated = chromosome[:]
    for i in range(len(mutated)):
        if random.random() < mutation_rate:
            mutated[i] = random.randint(0, 3)
    return mutated


def _trim_path(path: List[Pos], goal: Pos) -> List[Pos]:
    """Trim the path to stop at the goal."""
    for i, pos in enumerate(path):
        if pos == goal:
            return path[: i + 1]
    return path
