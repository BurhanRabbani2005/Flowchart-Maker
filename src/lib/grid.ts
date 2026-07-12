import type { FlowShape } from "@/types";
import { DEFAULT_GRID_SIZE } from "@/types";

export const GRID_SIZE = DEFAULT_GRID_SIZE;

export function snapToGrid(value: number, gridSize = GRID_SIZE): number {
  const size = Math.max(4, gridSize);
  return Math.round(value / size) * size;
}

/** Snap a shape so its center lands on the grid. */
export function snapPositionByCenter(
  x: number,
  y: number,
  width: number,
  height: number,
  gridSize = GRID_SIZE,
): { x: number; y: number } {
  const centerX = snapToGrid(x + width / 2, gridSize);
  const centerY = snapToGrid(y + height / 2, gridSize);
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
  };
}

export function snapShapesToGrid(
  shapes: FlowShape[],
  ids: string[],
  gridSize = GRID_SIZE,
): FlowShape[] {
  const idSet = new Set(ids);
  return shapes.map((shape) => {
    if (!idSet.has(shape.id)) return shape;
    const pos = snapPositionByCenter(
      shape.x,
      shape.y,
      shape.width,
      shape.height,
      gridSize,
    );
    return { ...shape, ...pos };
  });
}
