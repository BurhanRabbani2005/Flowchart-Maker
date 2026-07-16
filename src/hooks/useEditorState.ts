/**
 * Custom React hook: all editor "app state" lives here.
 *
 * `"use client"` (Next.js): this module runs in the browser.
 * Hooks like useState only work in client components.
 *
 * If you know JS variables: useState is a variable that
 * tells React "please re-render when this value changes."
 */
"use client";

import { useCallback, useRef, useState } from "react";
import {
  alignShapes,
  distributeShapes,
  type AlignDirection,
  type DistributeAxis,
} from "@/lib/align";
import { snapShapesToGrid } from "@/lib/grid";
import { createShape } from "@/lib/shapes";
import type { FlowchartDocument } from "@/lib/flowchartFile";
import {
  DEFAULT_CONNECTION_PROPS,
  DEFAULT_GRID_SIZE,
  type Connection,
  type FlowShape,
  type ShapeType,
  type ToolMode,
} from "@/types";

/** What we store when the user copies shapes. */
interface ClipboardPayload {
  shapes: FlowShape[];
  connections: Connection[];
}

const PASTE_OFFSET = 24;

/**
 * Fill in missing connection fields with defaults.
 * `??` (nullish coalescing): use the right side only if left is null/undefined.
 * (`||` would also replace `0` or `""`, which we usually don't want for numbers.)
 */
function normalizeConnection(connection: Connection): Connection {
  return {
    ...connection,
    stroke: connection.stroke || DEFAULT_CONNECTION_PROPS.stroke,
    strokeWidth:
      connection.strokeWidth ?? DEFAULT_CONNECTION_PROPS.strokeWidth,
    opacity: connection.opacity ?? DEFAULT_CONNECTION_PROPS.opacity,
    orthogonal:
      connection.orthogonal ?? DEFAULT_CONNECTION_PROPS.orthogonal,
  };
}

export function useEditorState() {
  // Generic syntax: useState<FlowShape[]>([]) means "array of FlowShape".
  const [shapes, setShapes] = useState<FlowShape[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // string | null = either a connection id, or nothing selected.
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);
  const [mode, setMode] = useState<ToolMode>("select");
  const [connectFromId, setConnectFromId] = useState<string | null>(null);
  const [hasClipboard, setHasClipboard] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  // useRef stores a value that survives re-renders WITHOUT causing a re-render.
  const clipboardRef = useRef<ClipboardPayload | null>(null);

  const selectedShape =
    selectedIds.length === 1
      ? (shapes.find((s) => s.id === selectedIds[0]) ?? null)
      : null;

  const selectedConnection =
    selectedConnectionId
      ? (connections.find((c) => c.id === selectedConnectionId) ?? null)
      : null;

  /**
   * useCallback memorizes a function so child components don't re-create
   * it every render (helps with performance / dependency arrays).
   * The `[snapToGrid, gridSize]` list = "recreate if these change."
   */
  const addShape = useCallback(
    (type: ShapeType) => {
      // Functional update: setShapes(prev => ...) uses the latest array safely.
      setShapes((prev) => {
        const offset = prev.length * 24;
        const shape = createShape(
          type,
          120 + offset,
          120 + offset,
          snapToGrid,
          gridSize,
        );
        setSelectedIds([shape.id]);
        return [...prev, shape]; // new array = React sees a change
      });
      setSelectedConnectionId(null);
      setMode("select");
      setConnectFromId(null);
    },
    [snapToGrid, gridSize],
  );

  const moveSelectedShapes = useCallback(
    (dx: number, dy: number) => {
      if ((dx === 0 && dy === 0) || selectedIds.length === 0) return;
      const idSet = new Set(selectedIds);
      setShapes((prev) =>
        prev.map((shape) =>
          idSet.has(shape.id)
            ? { ...shape, x: shape.x + dx, y: shape.y + dy }
            : shape,
        ),
      );
    },
    [selectedIds],
  );

  // Partial<FlowShape> = any subset of fields (e.g. only { fill: "#fff" }).
  const updateShape = useCallback(
    (id: string, updates: Partial<FlowShape>) => {
      setShapes((prev) =>
        prev.map((shape) =>
          shape.id === id ? { ...shape, ...updates } : shape,
        ),
      );
    },
    [],
  );

  const updateConnection = useCallback(
    (id: string, updates: Partial<Connection>) => {
      setConnections((prev) =>
        prev.map((connection) =>
          connection.id === id ? { ...connection, ...updates } : connection,
        ),
      );
    },
    [],
  );

  const applyConnectionStyleToAll = useCallback(() => {
    if (!selectedConnectionId) return;
    setConnections((prev) => {
      const source = prev.find((c) => c.id === selectedConnectionId);
      if (!source) return prev;
      return prev.map((connection) => ({
        ...connection,
        stroke: source.stroke,
        strokeWidth: source.strokeWidth,
        opacity: source.opacity,
        orthogonal: source.orthogonal,
      }));
    });
  }, [selectedConnectionId]);

  const setSelection = useCallback((ids: string[]) => {
    setSelectedIds(ids);
    setSelectedConnectionId(null);
  }, []);

  const selectConnection = useCallback((id: string | null) => {
    setSelectedConnectionId(id);
    if (id) setSelectedIds([]);
  }, []);

  const deleteSelected = useCallback(() => {
    if (selectedConnectionId) {
      setConnections((prev) =>
        prev.filter((c) => c.id !== selectedConnectionId),
      );
      setSelectedConnectionId(null);
      return;
    }

    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    setShapes((prev) => prev.filter((s) => !idSet.has(s.id)));
    setConnections((prev) =>
      prev.filter((c) => !idSet.has(c.fromId) && !idSet.has(c.toId)),
    );
    setSelectedIds([]);
    if (connectFromId && idSet.has(connectFromId)) {
      setConnectFromId(null);
    }
  }, [selectedIds, selectedConnectionId, connectFromId]);

  const deleteConnection = useCallback((id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
    setSelectedConnectionId((prev) => (prev === id ? null : prev));
  }, []);

  const selectShape = useCallback(
    (id: string | null, additive = false) => {
      setSelectedConnectionId(null);

      if (mode === "connect" && id) {
        if (!connectFromId) {
          setConnectFromId(id);
          setSelectedIds([id]);
          return;
        }

        if (connectFromId === id) {
          setConnectFromId(null);
          setSelectedIds([]);
          return;
        }

        setConnections((prev) => {
          const exists = prev.some(
            (c) =>
              (c.fromId === connectFromId && c.toId === id) ||
              (c.fromId === id && c.toId === connectFromId),
          );
          if (exists) return prev;
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              fromId: connectFromId,
              toId: id,
              ...DEFAULT_CONNECTION_PROPS,
            },
          ];
        });

        setConnectFromId(null);
        setSelectedIds([id]);
        return;
      }

      if (id === null) {
        setSelectedIds([]);
        return;
      }

      if (additive || mode === "multiselect") {
        setSelectedIds((prev) =>
          prev.includes(id)
            ? prev.filter((existing) => existing !== id)
            : [...prev, id],
        );
        return;
      }

      setSelectedIds([id]);
    },
    [mode, connectFromId],
  );

  const copySelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    const copiedShapes = shapes
      .filter((s) => idSet.has(s.id))
      .map((s) => ({ ...s }));
    const copiedConnections = connections
      .filter((c) => idSet.has(c.fromId) && idSet.has(c.toId))
      .map((c) => ({ ...c }));

    clipboardRef.current = {
      shapes: copiedShapes,
      connections: copiedConnections,
    };
    setHasClipboard(true);
  }, [shapes, connections, selectedIds]);

  const pasteClipboard = useCallback(() => {
    const payload = clipboardRef.current;
    if (!payload || payload.shapes.length === 0) return;

    const idMap = new Map<string, string>();
    const newShapes = payload.shapes.map((shape) => {
      const newId = crypto.randomUUID();
      idMap.set(shape.id, newId);
      return {
        ...shape,
        id: newId,
        x: shape.x + PASTE_OFFSET,
        y: shape.y + PASTE_OFFSET,
      };
    });

    const newConnections = payload.connections.map((connection) => ({
      ...normalizeConnection(connection),
      id: crypto.randomUUID(),
      fromId: idMap.get(connection.fromId)!,
      toId: idMap.get(connection.toId)!,
    }));

    clipboardRef.current = {
      shapes: newShapes.map((s) => ({ ...s })),
      connections: newConnections.map((c) => ({ ...c })),
    };

    setShapes((prev) => [...prev, ...newShapes]);
    setConnections((prev) => [...prev, ...newConnections]);
    setSelectedIds(newShapes.map((s) => s.id));
    setSelectedConnectionId(null);
    setMode("select");
    setConnectFromId(null);
  }, []);

  const toggleConnectMode = useCallback(() => {
    setMode((prev) => {
      if (prev === "connect") {
        setConnectFromId(null);
        return "select";
      }
      setConnectFromId(null);
      setSelectedConnectionId(null);
      return "connect";
    });
  }, []);

  const toggleMultiSelectMode = useCallback(() => {
    setMode((prev) => {
      if (prev === "multiselect") return "select";
      setConnectFromId(null);
      setSelectedConnectionId(null);
      return "multiselect";
    });
  }, []);

  const alignSelected = useCallback(
    (direction: AlignDirection) => {
      if (selectedIds.length < 2) return;
      setShapes((prev) => alignShapes(prev, selectedIds, direction));
    },
    [selectedIds],
  );

  const distributeSelected = useCallback(
    (axis: DistributeAxis) => {
      if (selectedIds.length < 3) return;
      setShapes((prev) => distributeShapes(prev, selectedIds, axis));
    },
    [selectedIds],
  );

  const alignSelectedToGrid = useCallback(() => {
    if (selectedIds.length === 0) return;
    setShapes((prev) => snapShapesToGrid(prev, selectedIds, gridSize));
  }, [selectedIds, gridSize]);

  const loadDocument = useCallback((doc: FlowchartDocument) => {
    setShapes(doc.shapes);
    setConnections(doc.connections.map(normalizeConnection));
    setSelectedIds([]);
    setSelectedConnectionId(null);
    setConnectFromId(null);
    setMode("select");
  }, []);

  return {
    shapes,
    connections,
    selectedIds,
    selectedShape,
    selectedConnectionId,
    selectedConnection,
    mode,
    connectFromId,
    hasClipboard,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
    addShape,
    updateShape,
    moveSelectedShapes,
    updateConnection,
    applyConnectionStyleToAll,
    setSelection,
    selectConnection,
    deleteSelected,
    deleteConnection,
    selectShape,
    copySelected,
    pasteClipboard,
    toggleConnectMode,
    toggleMultiSelectMode,
    alignSelected,
    distributeSelected,
    alignSelectedToGrid,
    loadDocument,
  };
}
