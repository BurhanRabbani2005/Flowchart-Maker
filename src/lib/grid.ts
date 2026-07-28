/**
 * ============================================================
 * grid.ts — snap positions to a grid
 * ============================================================
 *
 * "Snap to grid" means: when you move a shape, its position
 * jumps to neat multiples of e.g. 24px instead of landing at 37.2px.
 */
import type { FlowShape } from "@/types";
import { DEFAULT_GRID_SIZE } from "@/types";

/**
 * `export const GRID_SIZE = ...`
 * A shared number other files can import.
 * Same as: export const GRID_SIZE = 24; (via DEFAULT_GRID_SIZE)
 */
export const GRID_SIZE = DEFAULT_GRID_SIZE;

/**
 * WHAT IT DOES:
 *   Round one number to the nearest grid multiple.
 *
 * EXAMPLE:
 *   snapToGrid(50, 24) → 48
 *   because 50/24 ≈ 2.08 → round to 2 → 2*24 = 48
 *
 * RETURN TYPE `: number` means this function always gives back a number.
 */
export function snapToGrid(value: number, gridSize = GRID_SIZE): number {
  // Never allow a grid smaller than 4px (safety clamp).
  const size = Math.max(4, gridSize);
  return Math.round(value / size) * size;
}

/**
 * WHAT IT DOES:
 *   Given a shape's top-left (x,y) and size, compute a NEW top-left
 *   so the SHAPE'S CENTER sits on a grid intersection.
 *
 * WHY CENTER?
 *   Snapping by the corner can look uneven for different widths.
 *   Centering feels more natural when aligning boxes.
 *
 * RETURNS: a small object `{ x, y }` (anonymous object type).
 */
export function snapPositionByCenter(
  x: number,
  y: number,
  width: number,
  height: number,
  gridSize = GRID_SIZE,
): { x: number; y: number } {
  const centerX = snapToGrid(x + width / 2, gridSize);
  const centerY = snapToGrid(y + height / 2, gridSize);
  // Convert center back to top-left for storage on FlowShape.
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
  };
}

/**
 * WHAT IT DOES:
 *   Take the full shapes array + a list of selected ids.
 *   Return a NEW array where selected shapes are grid-snapped.
 *   Unselected shapes are copied through unchanged.
 *
 * IMPORTANT REACT IDEA:
 *   We do NOT edit shapes in place (no shape.x = ...).
 *   We return new objects so React notices "data changed → redraw."
 *
 * `FlowShape[]` means "array of FlowShape".
 * `string[]` means "array of strings" (the selected ids).
 */
export function snapShapesToGrid(
  shapes: FlowShape[],
  ids: string[],
  gridSize = GRID_SIZE,
): FlowShape[] {
  // Set = fast membership test: idSet.has("abc") → true/false
  const idSet = new Set(ids);
  return shapes.map((shape) => {
    if (!idSet.has(shape.id)) return shape; // leave this one alone
    const pos = snapPositionByCenter(
      shape.x,
      shape.y,
      shape.width,
      shape.height,
      gridSize,
    );
    // Spread copy: keep all fields, then overwrite x and y from pos.
    return { ...shape, ...pos };
  });
}
