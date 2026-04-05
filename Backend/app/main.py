"""
AlgoPath Backend - FastAPI Application

Main entry point for the AlgoPath REST API server.
Provides endpoints for:
    - Setting up the 2D grid environment
    - Running individual search algorithms
    - Comparing all algorithms side-by-side

The server stores grid state in-memory and tracks algorithm results
for comparison across runs on the same grid configuration.
"""

import logging
import time
from typing import Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.grid import Grid
from app.models import (
    GridConfig,
    AlgorithmRequest,
    AlgorithmResult,
    ComparisonResult,
)
from app.algorithms import (
    bfs,
    dfs,
    dls,
    iddfs,
    ucs,
    hill_climbing,
    greedy_best_first,
    astar,
    genetic_algorithm,
)

# ── Logging Configuration ───────────────────────────────────────────────────

# Configure structured logging for the entire algopath namespace.
# Algorithm modules use child loggers under 'algopath.algorithms.<name>'.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)-30s | %(message)s",
    datefmt="%H:%M:%S",
)

# The root algopath logger — algorithm loggers inherit from this.
logger = logging.getLogger("algopath")
logger.setLevel(logging.DEBUG)

# Quiet down noisy libraries
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


# ── App Initialization ──────────────────────────────────────────────────────

app = FastAPI(
    title="AlgoPath API",
    description=(
        "Backend API for simulating and comparing AI search algorithms "
        "on a 2D grid environment. Built for the Introduction to "
        "Artificial Intelligence course."
    ),
    version="1.0.0",
)

# Enable CORS so the Next.js frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── In-Memory State ─────────────────────────────────────────────────────────

# Current grid configuration (set via POST /set-grid)
current_grid: Optional[Grid] = None

# Stores results of all algorithms run on the current grid
# Key: algorithm name, Value: AlgorithmResult
algorithm_results: Dict[str, AlgorithmResult] = {}

# Maps algorithm names to their execution functions and properties
ALGORITHM_REGISTRY = {
    "BFS": {
        "func": bfs,
        "is_optimal": True,
        "needs_depth_limit": False,
    },
    "DFS": {
        "func": dfs,
        "is_optimal": False,
        "needs_depth_limit": False,
    },
    "DLS": {
        "func": dls,
        "is_optimal": False,
        "needs_depth_limit": True,
    },
    "IDDFS": {
        "func": iddfs,
        "is_optimal": True,
        "needs_depth_limit": False,
    },
    "UCS": {
        "func": ucs,
        "is_optimal": True,
        "needs_depth_limit": False,
    },
    "Hill Climbing": {
        "func": hill_climbing,
        "is_optimal": False,
        "needs_depth_limit": False,
    },
    "Greedy Best First": {
        "func": greedy_best_first,
        "is_optimal": False,
        "needs_depth_limit": False,
    },
    "A*": {
        "func": astar,
        "is_optimal": True,
        "needs_depth_limit": False,
    },
    "Genetic": {
        "func": genetic_algorithm,
        "is_optimal": False,
        "needs_depth_limit": False,
    },
}


# ── Helper ───────────────────────────────────────────────────────────────────


def _execute_algorithm(
    algo_name: str,
    algo_info: dict,
    grid: Grid,
    depth_limit: int = 10,
    include_steps: bool = True,
) -> AlgorithmResult:
    """
    Run a single algorithm and return a standardised AlgorithmResult.

    Centralises the execution logic that was previously duplicated
    between /run-algorithm and /run-all endpoints.

    Args:
        algo_name:     Registry key (e.g. "A*").
        algo_info:     Registry value dict with 'func', 'is_optimal', etc.
        grid:          The configured Grid environment.
        depth_limit:   Depth limit (only used by DLS).
        include_steps: If False, omit the step list from the result
                       (useful for bulk /run-all to reduce payload).

    Returns:
        Populated AlgorithmResult.
    """
    algo_func = algo_info["func"]

    # Measure execution time
    start_time = time.perf_counter()

    # Call the algorithm function with appropriate arguments
    if algo_info["needs_depth_limit"]:
        path, nodes_explored, steps = algo_func(grid, depth_limit=depth_limit)
    else:
        path, nodes_explored, steps = algo_func(grid)

    end_time = time.perf_counter()
    time_taken = round(end_time - start_time, 6)

    result = AlgorithmResult(
        algorithm=algo_name,
        path=[tuple(p) for p in path],
        nodes_explored=nodes_explored,
        time_taken=time_taken,
        success=len(path) > 0,
        cost=len(path) - 1 if len(path) > 0 else 0,
        is_optimal=algo_info["is_optimal"] and len(path) > 0,
        steps=steps if include_steps else [],
        explored_nodes=(
            steps[-1].explored_nodes if steps else []
        ),
    )

    logger.info(
        "%-18s | success=%s | cost=%-4d | explored=%-5d | time=%.4fs",
        algo_name, result.success, result.cost,
        result.nodes_explored, result.time_taken,
    )

    return result


def _get_category(algo_name: str) -> str:
    """Classify algorithm into its search category."""
    uninformed = {"BFS", "DFS", "DLS", "IDDFS", "UCS"}
    informed = {"Hill Climbing", "Greedy Best First", "A*"}
    if algo_name in uninformed:
        return "Uninformed Search"
    elif algo_name in informed:
        return "Informed Search"
    else:
        return "Metaheuristic"


# ── API Endpoints ────────────────────────────────────────────────────────────


@app.get("/")
def root():
    """Health check / welcome endpoint."""
    return {
        "message": "AlgoPath API is running",
        "version": "1.0.0",
        "available_algorithms": list(ALGORITHM_REGISTRY.keys()),
    }


@app.post("/set-grid")
def set_grid(config: GridConfig):
    """
    Configure the 2D grid environment.

    Accepts grid dimensions, obstacle positions, start node, and goal node.
    Clears any previously stored algorithm results since the grid has changed.

    Request Body:
        {
            "rows": 10,
            "cols": 10,
            "obstacles": [[2, 3], [4, 5]],
            "start": [0, 0],
            "goal": [9, 9]
        }

    Returns:
        Confirmation message with the grid configuration summary.
    """
    global current_grid, algorithm_results

    try:
        current_grid = Grid(
            rows=config.rows,
            cols=config.cols,
            obstacles=[tuple(obs) for obs in config.obstacles],
            start=tuple(config.start),
            goal=tuple(config.goal),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Clear previous results since the grid configuration changed
    algorithm_results = {}

    logger.info(
        "Grid configured: %dx%d | obstacles=%d | start=%s | goal=%s",
        config.rows, config.cols, len(config.obstacles),
        config.start, config.goal,
    )

    return {
        "message": "Grid configured successfully",
        "grid": {
            "rows": config.rows,
            "cols": config.cols,
            "obstacles_count": len(config.obstacles),
            "start": config.start,
            "goal": config.goal,
        },
    }


@app.post("/run-algorithm", response_model=AlgorithmResult)
def run_algorithm(request: AlgorithmRequest):
    """
    Execute a search algorithm on the current grid.

    The grid must be configured first via POST /set-grid.

    Request Body:
        {
            "algorithm": "A*",
            "depth_limit": 10  (optional, only used by DLS)
        }

    Returns:
        AlgorithmResult with path, metrics, and step-by-step data.
    """
    global current_grid, algorithm_results

    if current_grid is None:
        raise HTTPException(
            status_code=400,
            detail="Grid not configured. Call POST /set-grid first."
        )

    algo_name = request.algorithm
    if algo_name not in ALGORITHM_REGISTRY:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown algorithm '{algo_name}'. "
                f"Available: {list(ALGORITHM_REGISTRY.keys())}"
            )
        )

    result = _execute_algorithm(
        algo_name=algo_name,
        algo_info=ALGORITHM_REGISTRY[algo_name],
        grid=current_grid,
        depth_limit=request.depth_limit,
        include_steps=True,
    )

    # Store for comparison
    algorithm_results[algo_name] = result

    return result


@app.get("/compare", response_model=ComparisonResult)
def compare_algorithms():
    """
    Compare all algorithms that have been run on the current grid.

    Returns a list of results (without step-by-step data to reduce
    payload size) for side-by-side comparison.
    """
    if not algorithm_results:
        raise HTTPException(
            status_code=400,
            detail="No algorithms have been run yet. "
                   "Use POST /run-algorithm first."
        )

    # Return results without the full step data for a compact comparison
    compact_results = []
    for result in algorithm_results.values():
        compact_results.append(AlgorithmResult(
            algorithm=result.algorithm,
            path=result.path,
            nodes_explored=result.nodes_explored,
            time_taken=result.time_taken,
            success=result.success,
            cost=result.cost,
            is_optimal=result.is_optimal,
            steps=[],  # Omit steps for comparison payload
            explored_nodes=result.explored_nodes,
        ))

    return ComparisonResult(results=compact_results)


@app.post("/run-all")
def run_all_algorithms():
    """
    Run all available algorithms on the current grid and return
    a comparison of their results. Convenience endpoint.

    Returns:
        ComparisonResult with all algorithm results.
    """
    global current_grid, algorithm_results

    if current_grid is None:
        raise HTTPException(
            status_code=400,
            detail="Grid not configured. Call POST /set-grid first."
        )

    logger.info("Running all %d algorithms...", len(ALGORITHM_REGISTRY))
    algorithm_results = {}

    for algo_name, algo_info in ALGORITHM_REGISTRY.items():
        result = _execute_algorithm(
            algo_name=algo_name,
            algo_info=algo_info,
            grid=current_grid,
            include_steps=False,
        )
        algorithm_results[algo_name] = result

    logger.info("All algorithms complete.")
    return ComparisonResult(results=list(algorithm_results.values()))


@app.get("/algorithms")
def list_algorithms():
    """
    List all available algorithms and their properties.

    Returns:
        List of algorithm info objects.
    """
    return {
        "algorithms": [
            {
                "name": name,
                "is_optimal": info["is_optimal"],
                "needs_depth_limit": info["needs_depth_limit"],
                "category": _get_category(name),
            }
            for name, info in ALGORITHM_REGISTRY.items()
        ]
    }
