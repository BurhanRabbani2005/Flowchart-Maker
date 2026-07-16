/**
 * Factory helpers for creating new shapes.
 * "Factory" = a function that builds and returns a ready-to-use object.
 */
import { snapPositionByCenter } from "@/lib/grid";
import {
  DEFAULT_SHAPE_PROPS,
  type FlowShape,
  type ShapeType,
} from "@/types";

/**
 * `type` after a comma in an import means:
 * "import this only as a TypeScript type" (erased when compiled to JS).
 * Regular values like DEFAULT_SHAPE_PROPS stay in the runtime JS.
 */

/** Default label text keyed by shape type. */
const DEFAULT_TEXT: Record<ShapeType, string> = {
  rectangle: "Process",
  roundedRect: "Start / End",
  circle: "Connector",
  diamond: "Decision",
  parallelogram: "Input / Output",
  text: "Double-click to edit",
};

/**
 * Function signature notes:
 * - Parameters after `=` have default values (same idea as JS defaults).
 * - `: FlowShape` after the `)` is the RETURN type — the function always returns a FlowShape.
 */
export function createShape(
  type: ShapeType,
  x: number,
  y: number,
  snap = false,
  gridSize = 24,
): FlowShape {
  const isText = type === "text";
  const isCircle = type === "circle";
  // Ternary operators (condition ? a : b) are the same as in JavaScript.
  const width = isCircle ? 100 : DEFAULT_SHAPE_PROPS.width;
  const height = isCircle ? 100 : isText ? 60 : DEFAULT_SHAPE_PROPS.height;
  const pos = snap
    ? snapPositionByCenter(x, y, width, height, gridSize)
    : { x, y };

  return {
    // Browser API that creates a unique string id (same as in modern JS).
    id: crypto.randomUUID(),
    type,
    x: pos.x,
    y: pos.y,
    width,
    height,
    text: DEFAULT_TEXT[type],
    fill: isText ? "transparent" : DEFAULT_SHAPE_PROPS.fill,
    stroke: DEFAULT_SHAPE_PROPS.stroke,
    strokeWidth: DEFAULT_SHAPE_PROPS.strokeWidth,
    fontSize: DEFAULT_SHAPE_PROPS.fontSize,
    opacity: DEFAULT_SHAPE_PROPS.opacity,
  };
}
