/**
 * Infinite canvas built with react-konva (HTML5 canvas via React).
 *
 * Props callbacks like `onSelect` are typed functions —
 * TypeScript checks you pass the right arguments when calling them.
 *
 * `Partial<FlowShape>` means "any subset of FlowShape fields"
 * (useful for update payloads: only send what changed).
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, Rect, Stage } from "react-konva";
import type Konva from "konva";
import { ConnectionLine } from "@/components/ConnectionLine";
import { ShapeNode } from "@/components/ShapeNode";
import {
  idsFullyInsideRect,
  normalizeRect,
  type SelectionRect,
} from "@/lib/selection";
import type { Connection, FlowShape, ToolMode } from "@/types";

interface CanvasProps {
  shapes: FlowShape[];
  connections: Connection[];
  selectedIds: string[];
  selectedConnectionId: string | null;
  connectFromId: string | null;
  mode: ToolMode;
  showInstructions: boolean;
  onSelect: (id: string | null, additive?: boolean) => void;
  onSelectConnection: (id: string | null) => void;
  onSetSelection: (ids: string[]) => void;
  onUpdateShape: (id: string, updates: Partial<FlowShape>) => void;
  onMoveSelected: (dx: number, dy: number) => void;
  onDeleteConnection: (id: string) => void;
  onChangeConnection: (id: string, updates: Partial<Connection>) => void;
  snapToGrid: boolean;
  gridSize: number;
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

interface MarqueeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/**
 * Convert screen (mouse) coordinates → world (canvas) coordinates,
 * accounting for pan (`view.x/y`) and zoom (`view.scale`).
 * Returns null if the pointer position isn't available.
 */
function pointerToWorld(
  stage: Konva.Stage,
  view: ViewState,
): { x: number; y: number } | null {
  const pointer = stage.getPointerPosition();
  if (!pointer) return null;
  return {
    x: (pointer.x - view.x) / view.scale,
    y: (pointer.y - view.y) / view.scale,
  };
}

const INSTRUCTIONS: { keys: string; label: string }[] = [
  { keys: "Shift + drag", label: "Lock move to one axis" },
  { keys: "⌘/Ctrl + C / V", label: "Copy / paste" },
  { keys: "Arrow keys", label: "Pan canvas" },
  { keys: "Shift + arrows", label: "Pan farther" },
  { keys: "Middle-click drag", label: "Pan canvas" },
  { keys: "Scroll", label: "Zoom" },
  { keys: "Double-click", label: "Edit text" },
  { keys: "Delete", label: "Remove selection" },
  { keys: "Shift + click", label: "Add to selection" },
  { keys: "Drag empty area", label: "Marquee select" },
];

export function Canvas({
  shapes,
  connections,
  selectedIds,
  selectedConnectionId,
  connectFromId,
  mode,
  showInstructions,
  onSelect,
  onSelectConnection,
  onSetSelection,
  onUpdateShape,
  onMoveSelected,
  onDeleteConnection,
  onChangeConnection,
  snapToGrid,
  gridSize,
  stageRef,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [marquee, setMarquee] = useState<MarqueeState | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editingId = editing?.id ?? null;

  const viewRef = useRef<ViewState>({ x: 0, y: 0, scale: 1 });
  const shapesRef = useRef(shapes);
  const panningRef = useRef(false);
  const panLastRef = useRef({ x: 0, y: 0 });
  const syncFrameRef = useRef<number | null>(null);
  const marqueeRef = useRef<MarqueeState | null>(null);
  const didMarqueeDragRef = useRef(false);

  shapesRef.current = shapes;

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
      container.style.backgroundSize = `${gridSize * scale}px ${gridSize * scale}px`;
      container.style.backgroundPosition = `${x}px ${y}px`;
    }
  }, [stageRef, gridSize]);

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
      if (panningRef.current) {
        const dx = e.clientX - panLastRef.current.x;
        const dy = e.clientY - panLastRef.current.y;
        panLastRef.current = { x: e.clientX, y: e.clientY };
        viewRef.current = {
          ...viewRef.current,
          x: viewRef.current.x + dx,
          y: viewRef.current.y + dy,
        };
        applyStageView();
        return;
      }

      const active = marqueeRef.current;
      const stage = stageRef.current;
      if (!active || !stage) return;

      const container = stage.container().getBoundingClientRect();
      const world = {
        x: (e.clientX - container.left - viewRef.current.x) / viewRef.current.scale,
        y: (e.clientY - container.top - viewRef.current.y) / viewRef.current.scale,
      };

      if (
        Math.abs(world.x - active.startX) > 2 ||
        Math.abs(world.y - active.startY) > 2
      ) {
        didMarqueeDragRef.current = true;
      }

      const next = {
        ...active,
        currentX: world.x,
        currentY: world.y,
      };
      marqueeRef.current = next;
      setMarquee(next);
    };

    const onWindowMouseUp = () => {
      endPan();

      const active = marqueeRef.current;
      if (!active) return;

      const rect = normalizeRect(
        active.startX,
        active.startY,
        active.currentX,
        active.currentY,
      );

      marqueeRef.current = null;
      setMarquee(null);

      if (didMarqueeDragRef.current && (rect.width > 2 || rect.height > 2)) {
        onSetSelection(idsFullyInsideRect(shapesRef.current, rect));
      } else {
        onSelect(null);
      }
      didMarqueeDragRef.current = false;
    };

    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
    };
  }, [applyStageView, onSelect, onSetSelection, stageRef]);

  useEffect(() => {
    return () => {
      if (syncFrameRef.current !== null) {
        cancelAnimationFrame(syncFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (editingId) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (
        e.key !== "ArrowLeft" &&
        e.key !== "ArrowRight" &&
        e.key !== "ArrowUp" &&
        e.key !== "ArrowDown"
      ) {
        return;
      }

      e.preventDefault();
      const step = e.shiftKey ? 40 : 16;
      let dx = 0;
      let dy = 0;
      if (e.key === "ArrowLeft") dx = step;
      if (e.key === "ArrowRight") dx = -step;
      if (e.key === "ArrowUp") dy = step;
      if (e.key === "ArrowDown") dy = -step;

      viewRef.current = {
        ...viewRef.current,
        x: viewRef.current.x + dx,
        y: viewRef.current.y + dy,
      };
      applyStageView();
      scheduleViewSync();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [applyStageView, editingId, scheduleViewSync]);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = viewRef.current.scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.008;
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

  const setZoomScale = useCallback(
    (nextScale: number) => {
      const clamped = Math.min(3, Math.max(0.25, nextScale));
      const oldScale = viewRef.current.scale;
      const center = { x: size.width / 2, y: size.height / 2 };
      const mousePointTo = {
        x: (center.x - viewRef.current.x) / oldScale,
        y: (center.y - viewRef.current.y) / oldScale,
      };
      viewRef.current = {
        scale: clamped,
        x: center.x - mousePointTo.x * clamped,
        y: center.y - mousePointTo.y * clamped,
      };
      applyStageView();
      setView({ ...viewRef.current });
    },
    [applyStageView, size.height, size.width],
  );

  const resetZoom = useCallback(() => {
    viewRef.current = { x: 0, y: 0, scale: 1 };
    applyStageView();
    setView({ ...viewRef.current });
  }, [applyStageView]);

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

  const marqueeRect: SelectionRect | null = marquee
    ? normalizeRect(
        marquee.startX,
        marquee.startY,
        marquee.currentX,
        marquee.currentY,
      )
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

  const canMarquee = mode === "select" || mode === "multiselect";
  const showExportHint = shapes.length === 0 && connections.length === 0;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#f1f5f9]"
      style={{
        backgroundImage:
          "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
        backgroundSize: `${gridSize * view.scale}px ${gridSize * view.scale}px`,
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

          if (e.evt.button === 1) {
            e.evt.preventDefault();
            panningRef.current = true;
            setIsPanning(true);
            panLastRef.current = { x: e.evt.clientX, y: e.evt.clientY };
            stage.container().style.cursor = "grabbing";
            return;
          }

          if (e.evt.button === 0 && e.target === stage) {
            if (editing) commitEditing();

            if (canMarquee) {
              const world = pointerToWorld(stage, viewRef.current);
              if (world) {
                const next = {
                  startX: world.x,
                  startY: world.y,
                  currentX: world.x,
                  currentY: world.y,
                };
                marqueeRef.current = next;
                didMarqueeDragRef.current = false;
                setMarquee(next);
              }
            } else {
              onSelect(null);
              onSelectConnection(null);
            }
          }
        }}
        onTouchStart={(e) => {
          const stage = e.target.getStage();
          if (!stage) return;
          if (e.target === stage) {
            onSelect(null);
            onSelectConnection(null);
            if (editing) commitEditing();
          }
        }}
      >
        <Layer>
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
                  editingId !== shape.id &&
                  !marquee
                }
                onSelect={(additive) => onSelect(shape.id, additive)}
                onChange={(updates) => onUpdateShape(shape.id, updates)}
                onMoveSelected={onMoveSelected}
                onEditText={() => startEditing(shape)}
                snapToGridEnabled={snapToGrid}
                gridSize={gridSize}
                moveWithSelection={isSelected && selectedIds.length > 1}
              />
            );
          })}

          {marqueeRect && (
            <Rect
              x={marqueeRect.x}
              y={marqueeRect.y}
              width={marqueeRect.width}
              height={marqueeRect.height}
              fill="rgba(15, 118, 110, 0.08)"
              stroke="#0f766e"
              strokeWidth={1 / viewRef.current.scale}
              dash={[6 / viewRef.current.scale, 4 / viewRef.current.scale]}
              listening={false}
            />
          )}

          {connections.map((connection) => (
            <ConnectionLine
              key={connection.id}
              connection={connection}
              shapes={shapes}
              isSelected={selectedConnectionId === connection.id}
              onSelect={onSelectConnection}
              onDelete={onDeleteConnection}
              onChange={onChangeConnection}
            />
          ))}
        </Layer>
      </Stage>

      {showInstructions && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[15] flex justify-center px-8 pt-6">
          <p className="max-w-2xl text-center text-sm leading-relaxed text-slate-400 select-none">
            {INSTRUCTIONS.map((item, i) => (
              <span key={item.keys}>
                {i > 0 ? " · " : null}
                {item.keys} — {item.label}
              </span>
            ))}
          </p>
        </div>
      )}

      {showExportHint && (
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center px-8">
          <p className="max-w-lg text-center text-lg leading-relaxed text-red-600 select-none sm:text-xl">
            Nothing is saved in the browser automatically.
            <br />
            Export a local JSON copy to keep your flowchart safe.
          </p>
        </div>
      )}

      <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-sm">
        <span className="text-[11px] font-medium text-slate-500">Zoom</span>
        <input
          type="range"
          min={25}
          max={300}
          step={5}
          value={Math.round(view.scale * 100)}
          onChange={(e) => setZoomScale(Number(e.target.value) / 100)}
          className="h-1.5 w-28 cursor-pointer accent-teal-700"
          title="Zoom"
        />
        <span className="w-10 text-right text-xs tabular-nums text-slate-700">
          {Math.round(view.scale * 100)}%
        </span>
        <button
          type="button"
          onClick={resetZoom}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          title="Reset zoom to 100%"
        >
          100%
        </button>
      </div>

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
