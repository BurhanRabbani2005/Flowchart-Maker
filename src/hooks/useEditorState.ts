"use client";

import { useCallback, useState } from "react";
import {
  alignShapes,
  distributeShapes,
  type AlignDirection,
  type DistributeAxis,
} from "@/lib/align";
import { snapShapesToGrid } from "@/lib/grid";
import { createShape } from "@/lib/shapes";
import type { FlowchartDocument } from "@/lib/flowchartFile";
import type {
  Connection,
  FlowShape,
  ShapeType,
  ToolMode,
} from "@/types";

export function useEditorState() {
  const [shapes, setShapes] = useState<FlowShape[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<ToolMode>("select");
  const [connectFromId, setConnectFromId] = useState<string | null>(null);

  const selectedShape =
    selectedIds.length === 1
      ? (shapes.find((s) => s.id === selectedIds[0]) ?? null)
      : null;

  const addShape = useCallback(
    (type: ShapeType) => {
      setShapes((prev) => {
        const offset = prev.length * 24;
        const shape = createShape(type, 120 + offset, 120 + offset);
        setSelectedIds([shape.id]);
        return [...prev, shape];
      });
      setMode("select");
      setConnectFromId(null);
    },
    [],
  );

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

  const setSelection = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const deleteSelected = useCallback(() => {
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
  }, [selectedIds, connectFromId]);

  const deleteConnection = useCallback((id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const selectShape = useCallback(
    (id: string | null) => {
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
            { id: crypto.randomUUID(), fromId: connectFromId, toId: id },
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

      if (mode === "multiselect") {
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

  const toggleConnectMode = useCallback(() => {
    setMode((prev) => {
      if (prev === "connect") {
        setConnectFromId(null);
        return "select";
      }
      setConnectFromId(null);
      return "connect";
    });
  }, []);

  const toggleMultiSelectMode = useCallback(() => {
    setMode((prev) => {
      if (prev === "multiselect") return "select";
      setConnectFromId(null);
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
    setShapes((prev) => snapShapesToGrid(prev, selectedIds));
  }, [selectedIds]);

  const loadDocument = useCallback((doc: FlowchartDocument) => {
    setShapes(doc.shapes);
    setConnections(doc.connections);
    setSelectedIds([]);
    setConnectFromId(null);
    setMode("select");
  }, []);

  return {
    shapes,
    connections,
    selectedIds,
    selectedShape,
    mode,
    connectFromId,
    addShape,
    updateShape,
    setSelection,
    deleteSelected,
    deleteConnection,
    selectShape,
    toggleConnectMode,
    toggleMultiSelectMode,
    alignSelected,
    distributeSelected,
    alignSelectedToGrid,
    loadDocument,
  };
}
