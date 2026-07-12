import type { CardinalDir, Connection, FlowShape } from "@/types";

export type { CardinalDir };

export function getShapeCenter(shape: FlowShape): { x: number; y: number } {
  return {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  };
}

function insetPoint(
  from: { x: number; y: number },
  to: { x: number; y: number },
  amount: number,
): { x: number; y: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < amount * 2 + 0.001) {
    return {
      x: (from.x + to.x) / 2,
      y: (from.y + to.y) / 2,
    };
  }
  const t = amount / len;
  return {
    x: from.x + dx * t,
    y: from.y + dy * t,
  };
}

export function parallelogramPoints(width: number, height: number): number[] {
  const skew = Math.min(width * 0.25, width / 3);
  return [skew, 0, width, 0, width - skew, height, 0, height];
}

export function diamondPoints(width: number, height: number): number[] {
  const midX = width / 2;
  const midY = height / 2;
  return [midX, 0, width, midY, midX, height, 0, midY];
}

export function getCardinalPoint(
  shape: FlowShape,
  dir: CardinalDir,
): { x: number; y: number } {
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;
  switch (dir) {
    case "n":
      return { x: cx, y: shape.y };
    case "s":
      return { x: cx, y: shape.y + shape.height };
    case "e":
      return { x: shape.x + shape.width, y: cy };
    case "w":
      return { x: shape.x, y: cy };
  }
}

/** Nearest cardinal side of a shape to a world point. */
export function nearestCardinalDir(
  shape: FlowShape,
  point: { x: number; y: number },
): CardinalDir {
  const dirs: CardinalDir[] = ["n", "s", "e", "w"];
  let best: CardinalDir = "e";
  let bestDist = Infinity;
  for (const dir of dirs) {
    const p = getCardinalPoint(shape, dir);
    const d = Math.hypot(p.x - point.x, p.y - point.y);
    if (d < bestDist) {
      bestDist = d;
      best = dir;
    }
  }
  return best;
}

function pathLength(points: number[]): number {
  let len = 0;
  for (let i = 2; i < points.length; i += 2) {
    len += Math.hypot(points[i] - points[i - 2], points[i + 1] - points[i - 1]);
  }
  return len;
}

function isHorizontalPort(dir: CardinalDir): boolean {
  return dir === "e" || dir === "w";
}

function routeOrthogonalBetween(
  start: { x: number; y: number },
  end: { x: number; y: number },
  fromDir: CardinalDir,
  toDir: CardinalDir,
  bend?: number,
): number[] {
  if (Math.abs(start.x - end.x) < 0.5) {
    return [start.x, start.y, end.x, end.y];
  }
  if (Math.abs(start.y - end.y) < 0.5) {
    return [start.x, start.y, end.x, end.y];
  }

  const fromH = isHorizontalPort(fromDir);
  const toH = isHorizontalPort(toDir);

  if (fromH && !toH) {
    return [start.x, start.y, end.x, start.y, end.x, end.y];
  }
  if (!fromH && toH) {
    return [start.x, start.y, start.x, end.y, end.x, end.y];
  }
  if (fromH && toH) {
    const midX = bend ?? (start.x + end.x) / 2;
    return [start.x, start.y, midX, start.y, midX, end.y, end.x, end.y];
  }
  const midY = bend ?? (start.y + end.y) / 2;
  return [start.x, start.y, start.x, midY, end.x, midY, end.x, end.y];
}

function dirsFaceAwayFromShape(
  fromDir: CardinalDir,
  toDir: CardinalDir,
  start: { x: number; y: number },
  end: { x: number; y: number },
): boolean {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const fromOk =
    (fromDir === "e" && dx >= 0) ||
    (fromDir === "w" && dx <= 0) ||
    (fromDir === "s" && dy >= 0) ||
    (fromDir === "n" && dy <= 0);
  const toOk =
    (toDir === "e" && dx <= 0) ||
    (toDir === "w" && dx >= 0) ||
    (toDir === "s" && dy <= 0) ||
    (toDir === "n" && dy >= 0);
  return fromOk && toOk;
}

export function pickBestPorts(
  from: FlowShape,
  to: FlowShape,
): { fromPort: CardinalDir; toPort: CardinalDir } {
  const dirs: CardinalDir[] = ["n", "s", "e", "w"];
  let best = { fromPort: "e" as CardinalDir, toPort: "w" as CardinalDir };
  let bestScore = Infinity;

  for (const fromPort of dirs) {
    for (const toPort of dirs) {
      const start = getCardinalPoint(from, fromPort);
      const end = getCardinalPoint(to, toPort);
      const points = routeOrthogonalBetween(start, end, fromPort, toPort);
      const facing = dirsFaceAwayFromShape(fromPort, toPort, start, end);
      const score = pathLength(points) + (facing ? 0 : 5000);
      if (score < bestScore) {
        bestScore = score;
        best = { fromPort, toPort };
      }
    }
  }
  return best;
}

export interface OrthogonalRoute {
  points: number[];
  fromPort: CardinalDir;
  toPort: CardinalDir;
  /** Interior corner indices in the points array (as point index, not flat). */
  cornerPointIndices: number[];
  bendAxis: "x" | "y" | null;
}

export function getOrthogonalRoute(
  from: FlowShape,
  to: FlowShape,
  connection: Pick<Connection, "fromPort" | "toPort" | "bend">,
): OrthogonalRoute {
  const auto = pickBestPorts(from, to);
  const fromPort = connection.fromPort ?? auto.fromPort;
  const toPort = connection.toPort ?? auto.toPort;
  const start = getCardinalPoint(from, fromPort);
  const end = getCardinalPoint(to, toPort);
  const points = routeOrthogonalBetween(
    start,
    end,
    fromPort,
    toPort,
    connection.bend,
  );

  const pointCount = points.length / 2;
  const cornerPointIndices: number[] = [];
  for (let i = 1; i < pointCount - 1; i++) {
    cornerPointIndices.push(i);
  }

  let bendAxis: "x" | "y" | null = null;
  if (isHorizontalPort(fromPort) && isHorizontalPort(toPort)) {
    bendAxis = "x";
  } else if (!isHorizontalPort(fromPort) && !isHorizontalPort(toPort)) {
    bendAxis = "y";
  }

  return { points, fromPort, toPort, cornerPointIndices, bendAxis };
}

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

  if (shape.type === "circle") {
    const a = shape.width / 2;
    const b = shape.height / 2;
    const scale = 1 / Math.sqrt((dx * dx) / (a * a) + (dy * dy) / (b * b));
    return { x: cx + dx * scale, y: cy + dy * scale };
  }

  if (shape.type === "diamond") {
    const hw = shape.width / 2;
    const hh = shape.height / 2;
    const scale = 1 / (Math.abs(dx) / hw + Math.abs(dy) / hh);
    return { x: cx + dx * scale, y: cy + dy * scale };
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

  const inset = Math.max(from.strokeWidth, to.strokeWidth, 2) * 0.5 + 1;
  const trimmedStart = insetPoint(start, end, inset);
  const trimmedEnd = insetPoint(end, start, inset);

  return {
    x1: trimmedStart.x,
    y1: trimmedStart.y,
    x2: trimmedEnd.x,
    y2: trimmedEnd.y,
  };
}

export function getConnectionLinePoints(
  from: FlowShape,
  to: FlowShape,
  connection: Pick<
    Connection,
    "orthogonal" | "fromPort" | "toPort" | "bend"
  >,
): number[] {
  if (connection.orthogonal) {
    return getOrthogonalRoute(from, to, connection).points;
  }
  const { x1, y1, x2, y2 } = getConnectionEndpoints(from, to);
  return [x1, y1, x2, y2];
}
