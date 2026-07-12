export type ShapeType =
  | "rectangle"
  | "roundedRect"
  | "circle"
  | "diamond"
  | "parallelogram"
  | "text";

export type CardinalDir = "n" | "s" | "e" | "w";

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
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  stroke: string;
  strokeWidth: number;
  /** When true, route with only 90° turns between cardinal ports. */
  orthogonal: boolean;
  /** Explicit start port (auto-chosen when omitted). */
  fromPort?: CardinalDir;
  /** Explicit end port (auto-chosen when omitted). */
  toPort?: CardinalDir;
  /**
   * Absolute X or Y of the middle run for Z-shaped orthogonal routes.
   * Interpreted as X when both ports are horizontal, Y when both are vertical.
   */
  bend?: number;
}

export type ToolMode = "select" | "multiselect" | "connect";

export const DEFAULT_SHAPE_PROPS = {
  fill: "#ffffff",
  stroke: "#334155",
  strokeWidth: 2,
  fontSize: 16,
  width: 140,
  height: 80,
} as const;

export const DEFAULT_CONNECTION_PROPS = {
  stroke: "#64748b",
  strokeWidth: 2,
  orthogonal: false,
} as const;

export const DEFAULT_GRID_SIZE = 24;

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
