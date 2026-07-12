import type { FlowShape } from "@/types";

export function getShapeCenter(shape: FlowShape): { x: number; y: number } {
  return {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  };
}

/** Point on the bounding-box edge of `shape` facing toward `target`. */
export function getEdgePointToward(
  shape: FlowShape,
  target: { x: number; y: number },
): { x: number; y: number } {
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;
  const dx = target.x - cx;
  const dy = target.y - cy;

  if (dx === 0 && dy === 0) {
    return { x: cx, y: cy };
  }

  const halfW = shape.width / 2;
  const halfH = shape.height / 2;

  const scaleX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);

  return {
    x: cx + dx * scale,
    y: cy + dy * scale,
  };
}

export function getConnectionEndpoints(
  from: FlowShape,
  to: FlowShape,
): { x1: number; y1: number; x2: number; y2: number } {
  const fromCenter = getShapeCenter(from);
  const toCenter = getShapeCenter(to);
  const start = getEdgePointToward(from, toCenter);
  const end = getEdgePointToward(to, fromCenter);

  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
}

export function diamondPoints(width: number, height: number): number[] {
  const midX = width / 2;
  const midY = height / 2;
  return [midX, 0, width, midY, midX, height, 0, midY];
}
