"use client";

import { useMemo } from "react";
import { Position, ExplorationStep } from "@/lib/algorithms";

export interface NodeState {
  pos: Position;
  state: "unexplored" | "frontier" | "explored" | "path" | "current" | "start" | "goal";
  delay: number;
}

export const useGridAnimation = (
  gridSize: number,
  step: ExplorationStep | undefined,
  startPos: Position,
  goalPos: Position
) => {
  const nodeStates = useMemo<NodeState[]>(() => {
    const nodes: NodeState[] = [];
    const stateMap = new Map<string, NodeState["state"]>();

    // Mark start and goal
    stateMap.set(`${startPos.x},${startPos.y}`, "start");
    stateMap.set(`${goalPos.x},${goalPos.y}`, "goal");

    if (step) {
      // Mark explored nodes
      step.exploredNodes.forEach((pos, i) => {
        const key = `${pos.x},${pos.y}`;
        if (!stateMap.has(key) || stateMap.get(key) === "unexplored") {
          stateMap.set(key, "explored");
        }
      });

      // Mark frontier nodes
      step.frontierNodes.forEach((pos) => {
        const key = `${pos.x},${pos.y}`;
        if (!stateMap.has(key) || stateMap.get(key) === "unexplored") {
          stateMap.set(key, "frontier");
        }
      });

      // Mark path nodes
      step.pathNodes.forEach((pos) => {
        const key = `${pos.x},${pos.y}`;
        stateMap.set(key, "path");
      });

      // Mark current node
      if (step.currentNode) {
        stateMap.set(`${step.currentNode.x},${step.currentNode.y}`, "current");
      }
    }

    // Create all nodes
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const key = `${x},${y}`;
        const state = (stateMap.get(key) || "unexplored") as NodeState["state"];
        nodes.push({
          pos: { x, y },
          state,
          delay: (x + y) * 0.01, // Stagger animation based on distance from top-left
        });
      }
    }

    return nodes;
  }, [gridSize, step, startPos, goalPos]);

  return { nodeStates };
};
