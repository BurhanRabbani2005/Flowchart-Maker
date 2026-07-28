/**
 * ============================================================
 * TYPES FILE — the "dictionary" of this project
 * ============================================================
 *
 * WHAT IS `export`?
 * ------------------
 * In JavaScript/TypeScript, each file is a "module".
 * Things inside a file are PRIVATE by default.
 *
 *   export ...   → other files can import and use this
 *   (no export)  → only this file can use it
 *
 * Example elsewhere:
 *   import { FlowShape, ShapeType } from "@/types";
 *
 *
 * WHAT IS `export type` vs `export const` vs `export interface`?
 * -------------------------------------------------------------
 * - `export type`      → a TYPE ONLY (exists for TypeScript checking).
 *                        Deleted when the code becomes real JavaScript.
 *                        You cannot do: console.log(ShapeType) — it isn't a value.
 *
 * - `export interface` → also a TYPE ONLY (blueprint for an object).
 *                        Same idea as `type`, but often used for object shapes.
 *
 * - `export const`     → a real VALUE that exists when the app runs
 *                        (a number, string, object, function, etc.).
 *                        Other files can import and use the actual data.
 *
 * Rule of thumb:
 *   Need data at runtime? → const / function
 *   Need to describe data for the editor/compiler? → type / interface
 */

/**
 * `export type ShapeType = ...`
 *
 * Creates a NEW NAME for a type, and shares it with other files.
 *
 * The `|` means OR (a "union"):
 *   ShapeType can be "rectangle" OR "circle" OR "text" OR ...
 * but NOTHING ELSE.
 *
 * In plain JS you'd write a string and hope you spelled it right.
 * Here, `"rectangle"` (typo) would be a TypeScript error.
 */
export type ShapeType =
  | "rectangle"
  | "roundedRect"
  | "circle"
  | "diamond"
  | "parallelogram"
  | "text";

/**
 * Another `export type` — four allowed direction letters.
 * Used when a connector attaches to the north/south/east/west side of a shape.
 */
export type CardinalDir = "n" | "s" | "e" | "w";

/**
 * `export interface FlowShape { ... }`
 *
 * An interface is a BLUEPRINT for one object.
 * Every flowchart box on the canvas is one FlowShape.
 *
 * Reading one field:
 *   shape.x        → number (left position)
 *   shape.text     → string (label inside the box)
 *   shape.type     → must be one of the ShapeType strings above
 *
 * If you forget a required field when creating a shape,
 * TypeScript will underline the error in your editor.
 */
export interface FlowShape {
  /** Unique id string (like a primary key). */
  id: string;
  /** Which kind of box this is (rectangle, diamond, …). */
  type: ShapeType;
  /** Left edge position on the canvas (pixels). */
  x: number;
  /** Top edge position on the canvas (pixels). */
  y: number;
  width: number;
  height: number;
  /** Label shown inside the shape. */
  text: string;
  /** Fill color, e.g. "#ffffff" or "transparent". */
  fill: string;
  /** Border color. */
  stroke: string;
  /** Border thickness in pixels. */
  strokeWidth: number;
  fontSize: number;
  /**
   * How see-through the shape is.
   * 0 = invisible, 1 = fully solid.
   */
  opacity: number;
}

/**
 * Blueprint for a line that connects two shapes.
 * fromId / toId are the `id` fields of two FlowShape objects.
 */
export interface Connection {
  id: string;
  /** Id of the shape where the line starts. */
  fromId: string;
  /** Id of the shape where the line ends. */
  toId: string;
  stroke: string;
  strokeWidth: number;
  /** 0 = invisible, 1 = fully solid. */
  opacity: number;
  /** true → only 90° bends; false → straight-ish free line. */
  orthogonal: boolean;
  /**
   * `?` means OPTIONAL.
   * fromPort may be missing. Then the app picks a side automatically.
   *
   * TypeScript forces you to handle "maybe undefined" carefully.
   */
  fromPort?: CardinalDir;
  toPort?: CardinalDir;
  /**
   * Optional bend position for orthogonal (elbow) connectors.
   * You can ignore this until you study geometry.ts.
   */
  bend?: number;
}

/**
 * Which tool is active in the UI toolbar.
 * Again: only these three strings are allowed.
 */
export type ToolMode = "select" | "multiselect" | "connect";

/**
 * `export const DEFAULT_SHAPE_PROPS = { ... } as const`
 *
 * Breakdown:
 * - `export`  → other files can import this object
 * - `const`   → real runtime value (an object with colors, sizes, …)
 * - `as const`→ TypeScript tip: treat values as exact literals
 *               (fill is exactly "#FFFFFF", not "any string")
 *
 * Used when createShape() builds a brand-new shape.
 */
export const DEFAULT_SHAPE_PROPS = {
  fill: "#FFFFFF",
  stroke: "#334155",
  strokeWidth: 2,
  fontSize: 16,
  opacity: 1,
  width: 140,
  height: 80,
} as const;

/**
 * Same idea as above, but defaults for new connector lines.
 * `orthogonal: false` means new lines are not forced to 90° bends.
 */
export const DEFAULT_CONNECTION_PROPS = {
  stroke: "#64748b",
  strokeWidth: 2,
  opacity: 1,
  orthogonal: false,
} as const;

/**
 * Simple exported number constant.
 * Grid cells are 24×24 pixels by default.
 */
export const DEFAULT_GRID_SIZE = 24;

/**
 * `export const SHAPE_LABELS: Record<ShapeType, string> = { ... }`
 *
 * This is a LOOKUP TABLE:
 *   key   = a ShapeType (e.g. "diamond")
 *   value = text to show in the UI (e.g. "Diamond")
 *
 * `Record<A, B>` means: "an object whose keys are type A and values are type B."
 * TypeScript will error if you forget one shape key.
 */
export const SHAPE_LABELS: Record<ShapeType, string> = {
  rectangle: "Rectangle",
  roundedRect: "Rounded Rect",
  circle: "Circle",
  diamond: "Diamond",
  parallelogram: "Parallelogram",
  text: "Text Box",
};

/**
 * Another lookup table: short "what is this shape for?" blurbs
 * (shown in button tooltips).
 */
export const SHAPE_USAGE: Record<ShapeType, string> = {
  rectangle: "Process / action step",
  roundedRect: "Start or end of a flow",
  circle: "Connector / on-page reference",
  diamond: "Decision (yes / no branch)",
  parallelogram: "Input / output (data)",
  text: "Annotation or label",
};
