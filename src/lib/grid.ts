import type { FlowShape } from "@/types";

export const GRID_SIZE = 24;

export function snapToGrid(value: number, gridSize = GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapShapesToGrid(
  shapes: FlowShape[],
  ids: string[],
  gridSize = GRID_SIZE,
): FlowShape[] {
  const idSet = new Set(ids);
  return shapes.map((shape) =>
    idSet.has(shape.id)
      ? {
          ...shape,
          x: snapToGrid(shape.x, gridSize),
          y: snapToGrid(shape.y, gridSize),
        }
      : shape,
  );
}
