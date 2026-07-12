import type { FlowShape } from "@/types";

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function normalizeRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): SelectionRect {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  return {
    x,
    y,
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

/** True when the shape is fully inside the selection rectangle. */
export function isShapeFullyInside(
  shape: FlowShape,
  rect: SelectionRect,
): boolean {
  return (
    shape.x >= rect.x &&
    shape.y >= rect.y &&
    shape.x + shape.width <= rect.x + rect.width &&
    shape.y + shape.height <= rect.y + rect.height
  );
}

export function idsFullyInsideRect(
  shapes: FlowShape[],
  rect: SelectionRect,
): string[] {
  return shapes.filter((s) => isShapeFullyInside(s, rect)).map((s) => s.id);
}
