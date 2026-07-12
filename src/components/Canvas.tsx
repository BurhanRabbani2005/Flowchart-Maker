"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, Stage } from "react-konva";
import type Konva from "konva";
import { ConnectionLine } from "@/components/ConnectionLine";
import { ShapeNode } from "@/components/ShapeNode";
import { GRID_SIZE } from "@/lib/grid";
import type { Connection, FlowShape, ToolMode } from "@/types";

interface CanvasProps {
  shapes: FlowShape[];
  connections: Connection[];
  selectedIds: string[];
  connectFromId: string | null;
  mode: ToolMode;
  onSelect: (id: string | null) => void;
  onSetSelection: (ids: string[]) => void;
  onUpdateShape: (id: string, updates: Partial<FlowShape>) => void;
  onDeleteConnection: (id: string) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
}

interface EditingState {
  id: string;
  value: string;
}

interface ViewState {
  x: number;
  y: number;
  scale: number;
}

export function Canvas({
  shapes,
  connections,
  selectedIds,
  connectFromId,
  mode,
  onSelect,
  onSetSelection,
  onUpdateShape,
  onDeleteConnection,
  stageRef,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editingId = editing?.id ?? null;

  const viewRef = useRef<ViewState>({ x: 0, y: 0, scale: 1 });
  const panningRef = useRef(false);
  const panLastRef = useRef({ x: 0, y: 0 });
  const syncFrameRef = useRef<number | null>(null);

  const applyStageView = useCallback(() => {
    const stage = stageRef.current;
    const { x, y, scale } = viewRef.current;
    if (stage) {
      stage.scale({ x: scale, y: scale });
      stage.position({ x, y });
      stage.batchDraw();
    }
    const container = containerRef.current;
    if (container) {
      container.style.backgroundSize = `${GRID_SIZE * scale}px ${GRID_SIZE * scale}px`;
      container.style.backgroundPosition = `${x}px ${y}px`;
    }
  }, [stageRef]);

  const scheduleViewSync = useCallback(() => {
    if (syncFrameRef.current !== null) return;
    syncFrameRef.current = requestAnimationFrame(() => {
      syncFrameRef.current = null;
      setView({ ...viewRef.current });
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    applyStageView();
  }, [applyStageView, size.width, size.height]);

  useEffect(() => {
    if (!editingId || !textareaRef.current) return;
    textareaRef.current.focus();
    textareaRef.current.select();
  }, [editingId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventMiddleDefault = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    };

    container.addEventListener("mousedown", preventMiddleDefault);
    container.addEventListener("auxclick", preventMiddleDefault);
    return () => {
      container.removeEventListener("mousedown", preventMiddleDefault);
      container.removeEventListener("auxclick", preventMiddleDefault);
    };
  }, []);

  useEffect(() => {
    const endPan = () => {
      if (!panningRef.current) return;
      panningRef.current = false;
      setIsPanning(false);
      setView({ ...viewRef.current });
      const stage = stageRef.current;
      if (stage) stage.container().style.cursor = "default";
    };

    const onWindowMouseMove = (e: MouseEvent) => {
      if (!panningRef.current) return;
      const dx = e.clientX - panLastRef.current.x;
      const dy = e.clientY - panLastRef.current.y;
      panLastRef.current = { x: e.clientX, y: e.clientY };
      viewRef.current = {
        ...viewRef.current,
        x: viewRef.current.x + dx,
        y: viewRef.current.y + dy,
      };
      applyStageView();
    };

    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", endPan);
    return () => {
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", endPan);
    };
  }, [applyStageView, stageRef]);

  useEffect(() => {
    return () => {
      if (syncFrameRef.current !== null) {
        cancelAnimationFrame(syncFrameRef.current);
      }
    };
  }, []);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = viewRef.current.scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.06;
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const next =
        direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clamped = Math.min(3, Math.max(0.25, next));

      const mousePointTo = {
        x: (pointer.x - viewRef.current.x) / oldScale,
        y: (pointer.y - viewRef.current.y) / oldScale,
      };

      viewRef.current = {
        scale: clamped,
        x: pointer.x - mousePointTo.x * clamped,
        y: pointer.y - mousePointTo.y * clamped,
      };
      applyStageView();
      scheduleViewSync();
    },
    [applyStageView, scheduleViewSync, stageRef],
  );

  const startEditing = (shape: FlowShape) => {
    if (mode === "connect") return;
    onSetSelection([shape.id]);
    setEditing({ id: shape.id, value: shape.text });
  };

  const commitEditing = () => {
    if (!editing) return;
    onUpdateShape(editing.id, { text: editing.value });
    setEditing(null);
  };

  const cancelEditing = () => {
    setEditing(null);
  };

  const editingShape = editingId
    ? shapes.find((s) => s.id === editingId)
    : null;

  const editorStyle: React.CSSProperties | undefined =
    editingShape && containerRef.current
      ? {
          position: "absolute",
          left: view.x + editingShape.x * view.scale,
          top: view.y + editingShape.y * view.scale,
          width: Math.max(80, editingShape.width * view.scale),
          height: Math.max(40, editingShape.height * view.scale),
          fontSize: editingShape.fontSize * view.scale,
          lineHeight: 1.3,
          border: "2px solid #0f766e",
          borderRadius: 6,
          padding: 8,
          margin: 0,
          background: "#fff",
          color: "#0f172a",
          resize: "none",
          outline: "none",
          zIndex: 20,
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          boxSizing: "border-box",
        }
      : undefined;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#f1f5f9]"
      style={{
        backgroundImage:
          "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
        backgroundSize: `${GRID_SIZE * view.scale}px ${GRID_SIZE * view.scale}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
        cursor: isPanning
          ? "grabbing"
          : mode === "connect"
            ? "crosshair"
            : mode === "multiselect"
              ? "cell"
              : "default",
      }}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        draggable={false}
        onWheel={handleWheel}
        onMouseDown={(e) => {
          const stage = e.target.getStage();
          if (!stage) return;

          // Middle mouse button pans the canvas.
          if (e.evt.button === 1) {
            e.evt.preventDefault();
            panningRef.current = true;
            setIsPanning(true);
            panLastRef.current = { x: e.evt.clientX, y: e.evt.clientY };
            stage.container().style.cursor = "grabbing";
            return;
          }

          if (e.evt.button === 0 && e.target === stage) {
            onSelect(null);
            if (editing) commitEditing();
          }
        }}
        onTouchStart={(e) => {
          const stage = e.target.getStage();
          if (!stage) return;
          if (e.target === stage) {
            onSelect(null);
            if (editing) commitEditing();
          }
        }}
      >
        <Layer>
          {connections.map((connection) => (
            <ConnectionLine
              key={connection.id}
              connection={connection}
              shapes={shapes}
              onDelete={onDeleteConnection}
            />
          ))}

          {shapes.map((shape) => {
            const isSelected = selectedIds.includes(shape.id);
            return (
              <ShapeNode
                key={shape.id}
                shape={shape}
                isSelected={isSelected}
                isConnectSource={connectFromId === shape.id}
                showTransformer={
                  isSelected &&
                  selectedIds.length === 1 &&
                  mode !== "connect"
                }
                hideText={editingId === shape.id}
                draggable={
                  (mode === "select" || mode === "multiselect") &&
                  editingId !== shape.id
                }
                onSelect={() => onSelect(shape.id)}
                onChange={(updates) => onUpdateShape(shape.id, updates)}
                onEditText={() => startEditing(shape)}
              />
            );
          })}
        </Layer>
      </Stage>

      {editing && editorStyle && (
        <textarea
          ref={textareaRef}
          value={editing.value}
          style={editorStyle}
          onChange={(e) => {
            const value = e.target.value;
            setEditing((prev) => (prev ? { ...prev, value } : prev));
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onBlur={commitEditing}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commitEditing();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancelEditing();
            }
          }}
        />
      )}
    </div>
  );
}
