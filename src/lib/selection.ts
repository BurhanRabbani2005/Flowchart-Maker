/**
 * ============================================================
 * selection.ts — marquee (drag-box) selection math
 * ============================================================
 *
 * When you click empty canvas and drag, you draw a rectangle.
 * These helpers turn that gesture into "which shape ids are inside?"
 */
import type { FlowShape } from "@/types";

/**
 * `export interface SelectionRect`
 * Blueprint for the selection box: top-left + width/height.
 * (Not two opposite corners — we normalize to this form first.)
 */
export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * WHAT IT DOES:
 *   You might drag from bottom-right to top-left.
 *   Math.min / Math.abs turn any two corners into:
 *   - x,y = top-left
 *   - width/height = always positive
 *
 * INPUT: two points (x1,y1) and (x2,y2)
 * OUTPUT: a SelectionRect
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

/**
 * WHAT IT DOES:
 *   Return true if the whole shape sits inside the selection rectangle.
 *   (Not just touching — fully inside.)
 *
 * `: boolean` = return type is true or false.
 */
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

/**
 * WHAT IT DOES:
 *   From all shapes, keep only those fully inside `rect`,
 *   then return just their id strings.
 *
 * SAME AS JS:
 *   shapes.filter(...).map(s => s.id)
 * TypeScript knows the result type is string[] automatically.
 */
export function idsFullyInsideRect(
  shapes: FlowShape[],
  rect: SelectionRect,
): string[] {
  return shapes.filter((s) => isShapeFullyInside(s, rect)).map((s) => s.id);
}
