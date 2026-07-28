/**
 * ============================================================
 * align.ts — line up shapes / space them evenly
 * ============================================================
 *
 * Pure functions = no React, no DOM.
 * Input: shapes array + selected ids + direction
 * Output: a NEW shapes array with some x/y changed
 */
import type { FlowShape } from "@/types";

/**
 * `export type AlignDirection = "left" | "right" | ...`
 *
 * Reminder: `export type` creates a TYPE name other files can import.
 * It is NOT a runtime value. You cannot loop over AlignDirection.
 * The toolbar passes one of these strings into alignShapes().
 */
export type AlignDirection =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "centerH"
  | "centerV";

/** Only two options for distribute: left-right or up-down. */
export type DistributeAxis = "horizontal" | "vertical";

/**
 * NOT exported — private helper for this file only.
 * WHAT IT DOES: from all shapes, keep only those whose id is selected.
 */
function selectedShapes(shapes: FlowShape[], ids: string[]): FlowShape[] {
  const idSet = new Set(ids);
  return shapes.filter((s) => idSet.has(s.id));
}

/**
 * `export function alignShapes(...)`
 *
 * WHAT IT DOES:
 *   Move selected shapes so they share an edge or center line.
 *   Example "left": every selected shape gets the same x as the leftmost one.
 *
 * Needs at least 2 selected shapes; otherwise returns the input unchanged.
 */
export function alignShapes(
  shapes: FlowShape[],
  ids: string[],
  direction: AlignDirection,
): FlowShape[] {
  const targets = selectedShapes(shapes, ids);
  if (targets.length < 2) return shapes;

  const idSet = new Set(ids);

  switch (direction) {
    case "left": {
      // Find the smallest x among selected shapes.
      const value = Math.min(...targets.map((s) => s.x));
      // For each shape: if selected, set x; else leave alone.
      return shapes.map((s) =>
        idSet.has(s.id) ? { ...s, x: value } : s,
      );
    }
    case "right": {
      // Align right edges: x + width should match the rightmost edge.
      const value = Math.max(...targets.map((s) => s.x + s.width));
      return shapes.map((s) =>
        idSet.has(s.id) ? { ...s, x: value - s.width } : s,
      );
    }
    case "top": {
      const value = Math.min(...targets.map((s) => s.y));
      return shapes.map((s) =>
        idSet.has(s.id) ? { ...s, y: value } : s,
      );
    }
    case "bottom": {
      const value = Math.max(...targets.map((s) => s.y + s.height));
      return shapes.map((s) =>
        idSet.has(s.id) ? { ...s, y: value - s.height } : s,
      );
    }
    // Mid H: same vertical center (centers sit on one horizontal line)
    case "centerH": {
      const avgCy =
        targets.reduce((sum, s) => sum + s.y + s.height / 2, 0) /
        targets.length;
      return shapes.map((s) =>
        idSet.has(s.id) ? { ...s, y: avgCy - s.height / 2 } : s,
      );
    }
    // Mid V: same horizontal center (centers sit on one vertical line)
    case "centerV": {
      const avgCx =
        targets.reduce((sum, s) => sum + s.x + s.width / 2, 0) /
        targets.length;
      return shapes.map((s) =>
        idSet.has(s.id) ? { ...s, x: avgCx - s.width / 2 } : s,
      );
    }
  }
}

/**
 * WHAT IT DOES:
 *   Spread 3+ shapes so gaps between them are equal.
 *   Horizontal: even space left-to-right (first/last stay put).
 *   Vertical: even space top-to-bottom.
 *
 * `Map<string, number>` = dictionary from shape id → new x or y.
 */
export function distributeShapes(
  shapes: FlowShape[],
  ids: string[],
  axis: DistributeAxis,
): FlowShape[] {
  const targets = selectedShapes(shapes, ids);
  if (targets.length < 3) return shapes;

  const idSet = new Set(ids);

  if (axis === "horizontal") {
    // [...targets] copies the array so .sort does not reorder the original.
    const sorted = [...targets].sort((a, b) => a.x - b.x);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalWidth = sorted.reduce((sum, s) => sum + s.width, 0);
    const span = last.x + last.width - first.x;
    const gap = (span - totalWidth) / (sorted.length - 1);

    let cursor = first.x;
    const nextX = new Map<string, number>();
    for (const shape of sorted) {
      nextX.set(shape.id, cursor);
      cursor += shape.width + gap;
    }

    return shapes.map((s) =>
      // `!` means "TypeScript, trust me — this key exists"
      // (we already checked nextX.has(s.id)).
      idSet.has(s.id) && nextX.has(s.id)
        ? { ...s, x: nextX.get(s.id)! }
        : s,
    );
  }

  // Vertical distribute — same algorithm on y/height.
  const sorted = [...targets].sort((a, b) => a.y - b.y);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalHeight = sorted.reduce((sum, s) => sum + s.height, 0);
  const span = last.y + last.height - first.y;
  const gap = (span - totalHeight) / (sorted.length - 1);

  let cursor = first.y;
  const nextY = new Map<string, number>();
  for (const shape of sorted) {
    nextY.set(shape.id, cursor);
    cursor += shape.height + gap;
  }

  return shapes.map((s) =>
    idSet.has(s.id) && nextY.has(s.id)
      ? { ...s, y: nextY.get(s.id)! }
      : s,
  );
}
