"use client";

import { motion } from "framer-motion";
import { Position, ExplorationStep } from "@/lib/algorithms";
import { useGridAnimation, NodeState } from "@/hooks/useGridAnimation";
import { useCallback } from "react";

interface GridProps {
  size: number;
  step: ExplorationStep | undefined;
  startPos: Position;
  goalPos: Position;
  obstacles?: Position[];
  onCellClick?: (pos: Position) => void;
  editMode?: "obstacle" | "start" | "goal" | null;
}

/**
 * Individual grid cell with color-coded state and animations.
 * Colors correspond to: start (green), goal (red), current (cyan),
 * path (yellow), explored (purple), frontier (blue), obstacle (dark), unexplored (slate).
 */
const GridNode = ({
  node,
  size,
  onClick,
  isObstacle,
  editMode,
}: {
  node: NodeState;
  size: number;
  onClick?: () => void;
  isObstacle?: boolean;
  editMode?: "obstacle" | "start" | "goal" | null;
}) => {
  // State → color mapping. Each state gets a distinct, vivid color
  const stateStyles: Record<
    string,
    { bg: string; shadow?: string }
  > = {
    unexplored: {
      bg: "bg-slate-800/60 hover:bg-slate-700/80",
    },
    frontier: {
      bg: "bg-blue-500/50",
      shadow: "shadow-[0_0_6px_rgba(59,130,246,0.3)]",
    },
    explored: {
      bg: "bg-indigo-500/30",
    },
    path: {
      bg: "bg-amber-400",
      shadow: "shadow-[0_0_12px_rgba(251,191,36,0.6)]",
    },
    current: {
      bg: "bg-cyan-400",
      shadow: "shadow-[0_0_12px_rgba(34,211,238,0.6)]",
    },
    start: {
      bg: "bg-emerald-500",
      shadow: "shadow-[0_0_10px_rgba(16,185,129,0.5)]",
    },
    goal: {
      bg: "bg-rose-500",
      shadow: "shadow-[0_0_10px_rgba(244,63,94,0.5)]",
    },
    obstacle: {
      bg: "bg-slate-600/90 border-slate-500",
    },
  };

  const displayState = isObstacle ? "obstacle" : node.state;
  const style = stateStyles[displayState] || stateStyles.unexplored;
  const isInteractive = ["path", "current", "start", "goal"].includes(displayState);

  // Smaller cells for larger grids
  const cellSize = size <= 10 ? "min-w-[24px]" : size <= 15 ? "min-w-[16px]" : "min-w-[12px]";
  const borderRadius = size <= 10 ? "rounded-[4px]" : "rounded-[2px]";
  const gap = size <= 10 ? "1px" : "0.5px";

  return (
    <motion.div
      className={`${style.bg} ${style.shadow || ""} ${borderRadius} border border-slate-700/40 ${cellSize} transition-colors duration-150 ${
        editMode ? "cursor-pointer hover:ring-1 hover:ring-cyan-400/50" : "cursor-default"
      } ${isObstacle ? "opacity-90" : ""}`}
      style={{ aspectRatio: "1" }}
      initial={false}
      animate={{
        scale: displayState === "current" ? [1, 1.15, 1] : 1,
        opacity: 1,
      }}
      transition={{
        scale: {
          duration: 0.6,
          repeat: displayState === "current" ? Infinity : 0,
          ease: "easeInOut",
        },
      }}
      whileHover={
        editMode
          ? { scale: 1.2, borderColor: "rgba(34, 211, 238, 0.6)" }
          : isInteractive
          ? { scale: 1.05 }
          : undefined
      }
      onClick={onClick}
    >
      {/* Emoji indicators for start and goal on small grids */}
      {size <= 15 && displayState === "start" && (
        <span className="flex items-center justify-center w-full h-full text-[10px]">▶</span>
      )}
      {size <= 15 && displayState === "goal" && (
        <span className="flex items-center justify-center w-full h-full text-[10px]">★</span>
      )}
    </motion.div>
  );
};

/**
 * The main NxN grid component. Renders all cells, handles obstacle detection,
 * and forwards clicks to the parent for editing start/goal/obstacles.
 */
export const Grid = ({
  size,
  step,
  startPos,
  goalPos,
  obstacles = [],
  onCellClick,
  editMode,
}: GridProps) => {
  const { nodeStates } = useGridAnimation(size, step, startPos, goalPos);

  const isObstacle = useCallback(
    (pos: Position) => obstacles.some((o) => o.x === pos.x && o.y === pos.y),
    [obstacles]
  );

  const gapSize = size <= 10 ? "2px" : size <= 15 ? "1.5px" : "1px";

  return (
    <div className="w-full flex items-center justify-center p-2 sm:p-4">
      <div
        className="grid bg-slate-950/50 p-2 rounded-lg border border-slate-700/30"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          gap: gapSize,
          aspectRatio: "1",
          maxWidth: "600px",
          width: "100%",
        }}
      >
        {nodeStates.map((node) => (
          <GridNode
            key={`${node.pos.x}-${node.pos.y}`}
            node={node}
            size={size}
            isObstacle={isObstacle(node.pos)}
            editMode={editMode}
            onClick={() => onCellClick?.(node.pos)}
          />
        ))}
      </div>
    </div>
  );
};
