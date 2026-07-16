/**
 * Central TypeScript types for the flowchart editor.
 *
 * Tip for JS learners:
 * - In JavaScript you usually just use objects and hope the fields exist.
 * - In TypeScript, `type` / `interface` describe the shape of data UP FRONT,
 *   so your editor can warn you if you mistype a property name.
 */

/**
 * A "union type": the value must be ONE of these exact strings.
 * This is like an enum made of string literals.
 * Example: let t: ShapeType = "circle";  // OK
 *          let t: ShapeType = "triangle"; // Error — not in the list
 */
export type ShapeType =
  | "rectangle"
  | "roundedRect"
  | "circle"
  | "diamond"
  | "parallelogram"
  | "text";

/** Cardinal directions used by connector attachment points. */
export type CardinalDir = "n" | "s" | "e" | "w";

/**
 * `interface` = a blueprint for an object.
 * Every FlowShape MUST have these fields with these types.
 * (Compare with plain JS objects that can have any keys.)
 */
export interface FlowShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  fontSize: number;
  /** 0 = fully transparent, 1 = fully opaque (a number between 0 and 1) */
  opacity: number;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  stroke: string;
  strokeWidth: number;
  /** 0 = fully transparent, 1 = fully opaque */
  opacity: number;
  /** When true, route with only 90° turns between cardinal ports. */
  orthogonal: boolean;
  /**
   * The `?` means OPTIONAL — this field may be missing.
   * In JS you'd check `if (conn.fromPort) { ... }`.
   * TypeScript tracks that for you.
   */
  fromPort?: CardinalDir;
  /** Explicit end port (auto-chosen when omitted). */
  toPort?: CardinalDir;
  /**
   * Absolute X or Y of the middle run for Z-shaped orthogonal routes.
   * Interpreted as X when both ports are horizontal, Y when both are vertical.
   */
  bend?: number;
}

/** Which tool the user is currently using in the editor. */
export type ToolMode = "select" | "multiselect" | "connect";

/**
 * `as const` tells TypeScript:
 * "these values are fixed literals, not just any string/number."
 * So DEFAULT_SHAPE_PROPS.fill is the type `"#ffffff"`, not `string`.
 */
export const DEFAULT_SHAPE_PROPS = {
  fill: "#ffffff",
  stroke: "#334155",
  strokeWidth: 2,
  fontSize: 16,
  opacity: 1,
  width: 140,
  height: 80,
} as const;

export const DEFAULT_CONNECTION_PROPS = {
  stroke: "#64748b",
  strokeWidth: 2,
  opacity: 1,
  orthogonal: false,
} as const;

export const DEFAULT_GRID_SIZE = 24;

/**
 * `Record<Key, Value>` means: an object whose keys are of type Key
 * and whose values are of type Value.
 * Here: every ShapeType has a matching human-readable label string.
 */
export const SHAPE_LABELS: Record<ShapeType, string> = {
  rectangle: "Rectangle",
  roundedRect: "Rounded Rect",
  circle: "Circle",
  diamond: "Diamond",
  parallelogram: "Parallelogram",
  text: "Text Box",
};

export const SHAPE_USAGE: Record<ShapeType, string> = {
  rectangle: "Process / action step",
  roundedRect: "Start or end of a flow",
  circle: "Connector / on-page reference",
  diamond: "Decision (yes / no branch)",
  parallelogram: "Input / output (data)",
  text: "Annotation or label",
};
