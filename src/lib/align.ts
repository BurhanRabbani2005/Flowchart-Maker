import type { FlowShape } from "@/types";

export type AlignDirection =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "centerH"
  | "centerV";
export type DistributeAxis = "horizontal" | "vertical";

function selectedShapes(shapes: FlowShape[], ids: string[]): FlowShape[] {
  const idSet = new Set(ids);
  return shapes.filter((s) => idSet.has(s.id));
}

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
      const value = Math.min(...targets.map((s) => s.x));
      return shapes.map((s) =>
        idSet.has(s.id) ? { ...s, x: value } : s,
      );
    }
    case "right": {
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
    // Mid H: centers line up on a horizontal line (same center Y)
    case "centerH": {
      const avgCy =
        targets.reduce((sum, s) => sum + s.y + s.height / 2, 0) /
        targets.length;
      return shapes.map((s) =>
        idSet.has(s.id) ? { ...s, y: avgCy - s.height / 2 } : s,
      );
    }
    // Mid V: centers line up on a vertical line (same center X)
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

export function distributeShapes(
  shapes: FlowShape[],
  ids: string[],
  axis: DistributeAxis,
): FlowShape[] {
  const targets = selectedShapes(shapes, ids);
  if (targets.length < 3) return shapes;

  const idSet = new Set(ids);

  if (axis === "horizontal") {
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
      idSet.has(s.id) && nextX.has(s.id)
        ? { ...s, x: nextX.get(s.id)! }
        : s,
    );
  }

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
