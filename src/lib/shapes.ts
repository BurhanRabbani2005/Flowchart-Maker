import { snapPositionByCenter } from "@/lib/grid";
import {
  DEFAULT_SHAPE_PROPS,
  type FlowShape,
  type ShapeType,
} from "@/types";

const DEFAULT_TEXT: Record<ShapeType, string> = {
  rectangle: "Process",
  roundedRect: "Start / End",
  circle: "Connector",
  diamond: "Decision",
  parallelogram: "Input / Output",
  text: "Double-click to edit",
};

export function createShape(
  type: ShapeType,
  x: number,
  y: number,
  snap = false,
  gridSize = 24,
): FlowShape {
  const isText = type === "text";
  const isCircle = type === "circle";
  const width = isCircle ? 100 : DEFAULT_SHAPE_PROPS.width;
  const height = isCircle ? 100 : isText ? 60 : DEFAULT_SHAPE_PROPS.height;
  const pos = snap
    ? snapPositionByCenter(x, y, width, height, gridSize)
    : { x, y };

  return {
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
