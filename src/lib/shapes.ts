/**
 * ============================================================
 * shapes.ts — CREATE a new shape object
 * ============================================================
 *
 * This file does NOT draw anything.
 * It only BUILDS a JavaScript/TypeScript object that matches FlowShape.
 * Later, React/Konva reads that object and draws it on the canvas.
 */
import { snapPositionByCenter } from "@/lib/grid";
import {
  DEFAULT_SHAPE_PROPS,
  type FlowShape,
  type ShapeType,
} from "@/types";

/**
 * IMPORT NOTES
 * ------------
 * DEFAULT_SHAPE_PROPS  → a real value (`export const`) — kept in JS
 * type FlowShape       → type-only import — erased when compiled
 * type ShapeType       → type-only import — erased when compiled
 *
 * Writing `type` before the name tells TypeScript/bundlers:
 * "I only need this for checking types, not as a runtime value."
 */

/**
 * NOT exported (`const` without `export`).
 * Only this file uses it: default text that appears inside a new shape.
 *
 * Record<ShapeType, string> = for EVERY shape type, there is a string.
 */
const DEFAULT_TEXT: Record<ShapeType, string> = {
  rectangle: "Process",
  roundedRect: "Start / End",
  circle: "Connector",
  diamond: "Decision",
  parallelogram: "Input / Output",
  text: "Double-click to edit",
};

/**
 * `export function createShape(...)`
 *
 * WHAT IT DOES (in plain English):
 *   1. Pick width/height based on shape type
 *   2. Optionally snap x/y to the grid
 *   3. Return a complete FlowShape object ready for the editor state
 *
 * WHEN IT RUNS:
 *   When you click a shape button in the toolbar,
 *   useEditorState.addShape() calls this function.
 *
 * SIGNATURE PIECES:
 *   type: ShapeType     → first argument must be a known shape name
 *   x: number, y: number → where to place the top-left corner
 *   snap = false        → optional; default is "don't snap"
 *   gridSize = 24       → optional grid size if snapping
 *   ): FlowShape        → ALWAYS returns a FlowShape (return type)
 */
export function createShape(
  type: ShapeType,
  x: number,
  y: number,
  snap = false,
  gridSize = 24,
): FlowShape {
  // Compare strings — same as JavaScript.
  const isText = type === "text";
  const isCircle = type === "circle";

  // Ternary: condition ? valueIfTrue : valueIfFalse
  const width = isCircle ? 100 : DEFAULT_SHAPE_PROPS.width;
  const height = isCircle ? 100 : isText ? 60 : DEFAULT_SHAPE_PROPS.height;

  // If snap is on, move the position so the shape center sits on a grid point.
  const pos = snap
    ? snapPositionByCenter(x, y, width, height, gridSize)
    : { x, y };

  // Build and return the object. Every required FlowShape field is filled in.
  return {
    // Modern browser helper: random unique id string.
    id: crypto.randomUUID(),
    type,
    x: pos.x,
    y: pos.y,
    width,
    height,
    // Lookup: DEFAULT_TEXT["diamond"] → "Decision"
    text: DEFAULT_TEXT[type],
    fill: isText ? "transparent" : DEFAULT_SHAPE_PROPS.fill,
    stroke: DEFAULT_SHAPE_PROPS.stroke,
    strokeWidth: DEFAULT_SHAPE_PROPS.strokeWidth,
    fontSize: DEFAULT_SHAPE_PROPS.fontSize,
    opacity: DEFAULT_SHAPE_PROPS.opacity,
  };
}
