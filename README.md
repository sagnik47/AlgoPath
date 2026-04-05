# AlgoPath — AI-Based Pathfinding & Search Algorithm Visualizer

> **Course:** Introduction to Artificial Intelligence

Interactive visualizer for 9 AI search algorithms on a 2D grid environment. Built with a **Python FastAPI** backend and a **Next.js** frontend.

---

## Algorithms Implemented

### Uninformed Search
| Algorithm | Optimal | Data Structure |
|-----------|---------|----------------|
| **BFS** (Breadth-First Search) | ✅ Yes | Queue (FIFO) |
| **DFS** (Depth-First Search) | ❌ No | Stack (LIFO) |
| **DLS** (Depth-Limited Search) | ❌ No | Stack + depth limit |
| **IDDFS** (Iterative Deepening DFS) | ✅ Yes | Stack (repeated) |
| **UCS** (Uniform Cost Search) | ✅ Yes | Priority Queue |

### Informed Search
| Algorithm | Optimal | Strategy |
|-----------|---------|----------|
| **Hill Climbing** | ❌ No | Greedy local search |
| **Greedy Best-First Search** | ❌ No | h(n) only |
| **A\*** | ✅ Yes | f(n) = g(n) + h(n) |

### Metaheuristic (Bonus)
| Algorithm | Optimal | Strategy |
|-----------|---------|----------|
| **Genetic Algorithm** | ❌ No | Population-based path evolution |

**Heuristic:** Manhattan distance — `h(n) = |x₁ - x₂| + |y₁ - y₂|`

---

## Project Structure

```
AlgoPath/
├── Backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── __main__.py           # Entry point (python -m app)
│   │   ├── main.py               # FastAPI application & routes
│   │   ├── models.py             # Pydantic request/response schemas
│   │   ├── grid.py               # 2D grid environment module
│   │   └── algorithms/
│   │       ├── __init__.py
│   │       ├── bfs.py            # Breadth-First Search
│   │       ├── dfs.py            # Depth-First Search
│   │       ├── dls.py            # Depth-Limited Search
│   │       ├── iddfs.py          # Iterative Deepening DFS
│   │       ├── ucs.py            # Uniform Cost Search
│   │       ├── hill_climbing.py  # Hill Climbing
│   │       ├── greedy_best_first.py  # Greedy Best-First
│   │       ├── astar.py          # A* Search
│   │       └── genetic.py        # Genetic Algorithm (bonus)
│   └── requirements.txt
│
├── Frontend/
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Landing page
│   │   ├── globals.css           # Global styles
│   │   └── visualizer/
│   │       └── page.tsx          # Main visualizer page
│   ├── components/
│   │   ├── ControlPanel.tsx      # Algorithm selector, grid controls
│   │   ├── Grid.tsx              # NxN grid visualization
│   │   ├── StatsPanel.tsx        # Algorithm statistics display
│   │   ├── Legend.tsx            # Color legend
│   │   ├── InfoModal.tsx         # Algorithm reference modal
│   │   ├── ComparisonTable.tsx   # Side-by-side algorithm comparison
│   │   └── ui/                   # shadcn/ui components
│   ├── hooks/
│   │   ├── useAlgorithmRunner.ts # Core algorithm execution hook
│   │   └── useGridAnimation.ts   # Grid state management
│   ├── lib/
│   │   ├── algorithms.ts         # Client-side algorithm implementations
│   │   └── api.ts                # Backend API service layer
│   └── package.json
│
└── README.md
```

---

## How to Run

### 1. Backend (FastAPI)

```bash
cd Backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at **http://localhost:8000**

API docs: **http://localhost:8000/docs** (Swagger UI)

### 2. Frontend (Next.js)

```bash
cd Frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend will be available at **http://localhost:3000**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/algorithms` | List all available algorithms |
| `POST` | `/set-grid` | Configure the grid (size, obstacles, start, goal) |
| `POST` | `/run-algorithm` | Run a specific algorithm on the current grid |
| `POST` | `/run-all` | Run all algorithms and get comparison |
| `GET` | `/compare` | Get comparison of previously run algorithms |

### Example: Set Grid
```json
POST /set-grid
{
  "rows": 10,
  "cols": 10,
  "obstacles": [[2, 3], [4, 5], [3, 3]],
  "start": [0, 0],
  "goal": [9, 9]
}
```

### Example: Run Algorithm
```json
POST /run-algorithm
{
  "algorithm": "A*",
  "depth_limit": 10
}
```

### Example Response
```json
{
  "algorithm": "A*",
  "path": [[0,0], [0,1], [1,1], ...],
  "nodes_explored": 25,
  "time_taken": 0.0012,
  "success": true,
  "cost": 14,
  "is_optimal": true,
  "steps": [...],
  "explored_nodes": [...]
}
```

---

## Features

- **Interactive Grid Editor** — Place walls, move start/goal positions, generate random mazes
- **Step-by-Step Visualization** — Watch algorithms explore the grid node by node
- **Compare All Algorithms** — Run all 9 algorithms and compare performance metrics
- **Dual Execution Mode** — Client-side (instant) or server-side (backend metrics)
- **Responsive Design** — Works on desktop and mobile
- **Algorithm Reference** — Built-in documentation for all algorithms

---

## Tech Stack

- **Backend:** Python 3.10+, FastAPI, Pydantic, Uvicorn
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion, shadcn/ui
- **Architecture:** REST API with CORS enabled for frontend communication
