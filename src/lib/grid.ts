/**
 * Grid snapping utilities.
 * These are plain functions (no React) — easy to reuse and test.
 */
import type { FlowShape } from "@/types";
import { DEFAULT_GRID_SIZE } from "@/types";

export const GRID_SIZE = DEFAULT_GRID_SIZE;

/**
 * Round a number to the nearest multiple of `gridSize`.
 * Example: snapToGrid(50, 24) → 48
 */
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
  // Return type `{ x: number; y: number }` is an anonymous object type.
  const centerX = snapToGrid(x + width / 2, gridSize);
  const centerY = snapToGrid(y + height / 2, gridSize);
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
  };
}

/**
 * Returns a NEW array of shapes (does not mutate the original).
 * In React, we prefer creating new arrays/objects so React can detect changes.
 *
 * `Set` is a built-in JS collection for fast "is this id selected?" checks.
 */
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
    // Spread operator `{ ...shape, ...pos }` copies shape, then overwrites x/y.
    return { ...shape, ...pos };
  });
}
