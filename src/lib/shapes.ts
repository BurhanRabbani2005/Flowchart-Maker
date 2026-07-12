import {
  DEFAULT_SHAPE_PROPS,
  type FlowShape,
  type ShapeType,
} from "@/types";

const DEFAULT_TEXT: Record<ShapeType, string> = {
  rectangle: "Rectangle",
  roundedRect: "Rounded",
  circle: "Circle",
  diamond: "Decision",
  text: "Double-click to edit",
};

export function createShape(
  type: ShapeType,
  x: number,
  y: number,
): FlowShape {
  const isText = type === "text";
  const isCircle = type === "circle";

  return {
    id: crypto.randomUUID(),
    type,
    x,
    y,
    width: isCircle ? 100 : DEFAULT_SHAPE_PROPS.width,
    height: isCircle ? 100 : isText ? 60 : DEFAULT_SHAPE_PROPS.height,
    text: DEFAULT_TEXT[type],
    fill: isText ? "transparent" : DEFAULT_SHAPE_PROPS.fill,
    stroke: DEFAULT_SHAPE_PROPS.stroke,
    strokeWidth: DEFAULT_SHAPE_PROPS.strokeWidth,
    fontSize: DEFAULT_SHAPE_PROPS.fontSize,
  };
}
