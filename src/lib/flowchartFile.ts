/**
 * ============================================================
 * flowchartFile.ts — save / load .json flowchart files
 * ============================================================
 *
 * Big idea:
 *   JSON from disk is untrusted. TypeScript starts it as `unknown`.
 *   We check field-by-field ("type guards") before using it as FlowShape.
 */
import type { Connection, FlowShape, ShapeType } from "@/types";

/**
 * `export const FLOWCHART_FILE_VERSION = 1`
 * A real number stored in every saved file.
 * If the format changes later, you can bump this and migrate old files.
 */
export const FLOWCHART_FILE_VERSION = 1;

/**
 * `export interface FlowchartDocument`
 * The exact shape of a saved file: version + shapes array + connections array.
 */
export interface FlowchartDocument {
  version: number;
  shapes: FlowShape[];
  connections: Connection[];
}

/** Private list used only to validate shape type strings from JSON. */
const SHAPE_TYPES: ShapeType[] = [
  "rectangle",
  "roundedRect",
  "circle",
  "diamond",
  "parallelogram",
  "text",
];

/**
 * WHAT IT DOES:
 *   Is this unknown value one of our allowed shape type strings?
 *
 * SPECIAL RETURN TYPE: `value is ShapeType`
 *   This is a "type predicate".
 *   If the function returns true, TypeScript treats `value` as ShapeType
 *   in the code that follows. That is smarter than returning a plain boolean.
 */
function isShapeType(value: unknown): value is ShapeType {
  return typeof value === "string" && SHAPE_TYPES.includes(value as ShapeType);
}

/**
 * WHAT IT DOES:
 *   Check that a parsed JSON object has all required FlowShape fields
 *   with the right JavaScript typeof results (string, number, …).
 */
function isFlowShape(value: unknown): value is FlowShape {
  if (!value || typeof value !== "object") return false;
  // Cast: treat as a bag of unknown properties so we can inspect each one.
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

/**
 * WHAT IT DOES:
 *   Older files might omit opacity. Clamp it to 0–1 and default to 1.
 */
function normalizeShape(shape: FlowShape): FlowShape {
  const opacity =
    typeof shape.opacity === "number"
      ? Math.min(1, Math.max(0, shape.opacity))
      : 1;
  return { ...shape, opacity };
}

/** Same idea as isFlowShape, but for connection objects. */
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

/**
 * WHAT IT DOES:
 *   Wrap shapes + connections into the official file object
 *   (adds the version number).
 */
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

/**
 * WHAT IT DOES:
 *   Turn the document into a pretty-printed JSON string for download.
 *   `JSON.stringify(value, null, 2)` → indent with 2 spaces (readable file).
 */
export function serializeFlowchart(
  shapes: FlowShape[],
  connections: Connection[],
): string {
  return JSON.stringify(createFlowchartDocument(shapes, connections), null, 2);
}

/**
 * WHAT IT DOES:
 *   Parse a JSON string from an imported file.
 *   Validate structure; throw Error with a clear message if invalid.
 *   Return a FlowchartDocument the editor can load.
 */
export function parseFlowchartDocument(raw: string): FlowchartDocument {
  // unknown = "we have not proven what this is yet"
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

/**
 * WHAT IT DOES:
 *   Trigger a browser download of a .json text file.
 *   Uses Blob + temporary <a download> (plain browser JS pattern).
 */
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
