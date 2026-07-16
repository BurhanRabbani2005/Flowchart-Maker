/**
 * Save / load flowchart files as JSON.
 *
 * Important TypeScript idea here: when you read a file from disk,
 * TypeScript does NOT trust it. The data starts as `unknown`,
 * and we use "type guards" to prove it is safe before using it.
 */
import type { Connection, FlowShape, ShapeType } from "@/types";

export const FLOWCHART_FILE_VERSION = 1;

/** The on-disk format of a saved flowchart. */
export interface FlowchartDocument {
  version: number;
  shapes: FlowShape[];
  connections: Connection[];
}

const SHAPE_TYPES: ShapeType[] = [
  "rectangle",
  "roundedRect",
  "circle",
  "diamond",
  "parallelogram",
  "text",
];

/**
 * Type predicate: `value is ShapeType`
 * If this function returns true, TypeScript treats `value` as a ShapeType afterward.
 * (`unknown` = "we don't know the type yet" — safer than `any`.)
 */
function isShapeType(value: unknown): value is ShapeType {
  return typeof value === "string" && SHAPE_TYPES.includes(value as ShapeType);
}

/** Runtime check that a parsed object looks like a FlowShape. */
function isFlowShape(value: unknown): value is FlowShape {
  if (!value || typeof value !== "object") return false;
  // Cast: "treat this object as a dictionary of unknown values."
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    isShapeType(s.type) &&
    typeof s.x === "number" &&
    typeof s.y === "number" &&
    typeof s.width === "number" &&
    typeof s.height === "number" &&
    typeof s.text === "string" &&
    typeof s.fill === "string" &&
    typeof s.stroke === "string" &&
    typeof s.strokeWidth === "number" &&
    typeof s.fontSize === "number" &&
    (s.opacity === undefined || typeof s.opacity === "number")
  );
}

function normalizeShape(shape: FlowShape): FlowShape {
  const opacity =
    typeof shape.opacity === "number"
      ? Math.min(1, Math.max(0, shape.opacity))
      : 1;
  return { ...shape, opacity };
}

function isConnection(value: unknown): value is Connection {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  const strokeOk =
    c.stroke === undefined || typeof c.stroke === "string";
  const widthOk =
    c.strokeWidth === undefined || typeof c.strokeWidth === "number";
  const orthogonalOk =
    c.orthogonal === undefined || typeof c.orthogonal === "boolean";
  const portOk = (value: unknown) =>
    value === undefined ||
    value === "n" ||
    value === "s" ||
    value === "e" ||
    value === "w";
  const bendOk = c.bend === undefined || typeof c.bend === "number";
  const opacityOk =
    c.opacity === undefined || typeof c.opacity === "number";
  return (
    typeof c.id === "string" &&
    typeof c.fromId === "string" &&
    typeof c.toId === "string" &&
    strokeOk &&
    widthOk &&
    orthogonalOk &&
    portOk(c.fromPort) &&
    portOk(c.toPort) &&
    bendOk &&
    opacityOk
  );
}

export function createFlowchartDocument(
  shapes: FlowShape[],
  connections: Connection[],
): FlowchartDocument {
  return {
    version: FLOWCHART_FILE_VERSION,
    shapes,
    connections,
  };
}

export function serializeFlowchart(
  shapes: FlowShape[],
  connections: Connection[],
): string {
  // JSON.stringify is the same JS API; third arg `2` pretty-prints with indentation.
  return JSON.stringify(createFlowchartDocument(shapes, connections), null, 2);
}

export function parseFlowchartDocument(raw: string): FlowchartDocument {
  // Start as `unknown` — we validate before trusting the data.
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON file.");
  }

  if (!data || typeof data !== "object") {
    throw new Error("Flowchart file must be a JSON object.");
  }

  const doc = data as Record<string, unknown>;

  if (!Array.isArray(doc.shapes) || !Array.isArray(doc.connections)) {
    throw new Error("Flowchart file must include shapes and connections arrays.");
  }

  if (!doc.shapes.every(isFlowShape)) {
    throw new Error("One or more shapes in the file are invalid.");
  }

  if (!doc.connections.every(isConnection)) {
    throw new Error("One or more connections in the file are invalid.");
  }

  return {
    version:
      typeof doc.version === "number" ? doc.version : FLOWCHART_FILE_VERSION,
    shapes: doc.shapes.map(normalizeShape),
    connections: doc.connections,
  };
}

export function downloadJson(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
