export type ShapeType =
  | "rectangle"
  | "roundedRect"
  | "circle"
  | "diamond"
  | "text";

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
}

export type ToolMode = "select" | "multiselect" | "connect";

export interface EditorState {
  shapes: FlowShape[];
  connections: Connection[];
  selectedIds: string[];
  mode: ToolMode;
  connectFromId: string | null;
}

export const DEFAULT_SHAPE_PROPS = {
  fill: "#ffffff",
  stroke: "#334155",
  strokeWidth: 2,
  fontSize: 16,
  width: 140,
  height: 80,
} as const;

export const SHAPE_LABELS: Record<ShapeType, string> = {
  rectangle: "Rectangle",
  roundedRect: "Rounded Rect",
  circle: "Circle",
  diamond: "Diamond",
  text: "Text Box",
};
