/**
 * Helpers for marquee (drag-box) selection on the canvas.
 */
import type { FlowShape } from "@/types";

/** A rectangle described by top-left corner + size (not two corners). */
export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Users can drag the selection box in any direction.
 * This normalizes two points into a proper top-left + positive width/height.
 */
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
  // Return type `: boolean` documents that this is a yes/no function.
  return (
    shape.x >= rect.x &&
    shape.y >= rect.y &&
    shape.x + shape.width <= rect.x + rect.width &&
    shape.y + shape.height <= rect.y + rect.height
  );
}

/**
 * `.filter(...).map(...)` is the same chaining pattern as in JavaScript.
 * TypeScript just knows the result is `string[]` because `.id` is a string.
 */
export function idsFullyInsideRect(
  shapes: FlowShape[],
  rect: SelectionRect,
): string[] {
  return shapes.filter((s) => isShapeFullyInside(s, rect)).map((s) => s.id);
}
