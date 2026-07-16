/**
 * Right-hand properties panel (resizable + collapsible).
 *
 * Conditional rendering: show different forms depending on whether
 * a shape, a connector, multiple shapes, or nothing is selected.
 * (`shape: FlowShape | null` means "shape or nothing.")
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Connection, FlowShape } from "@/types";
import { SHAPE_LABELS } from "@/types";

const PANEL_MIN = 200;
const PANEL_MAX = 480;
const PANEL_DEFAULT = 256;

interface PropertiesSidebarProps {
  shape: FlowShape | null;
  connection: Connection | null;
  selectionCount: number;
  snapToGrid: boolean;
  gridSize: number;
  onSnapToGridChange: (value: boolean) => void;
  onGridSizeChange: (value: number) => void;
  onChangeShape: (id: string, updates: Partial<FlowShape>) => void;
  onChangeConnection: (id: string, updates: Partial<Connection>) => void;
  onApplyConnectionStyleToAll: () => void;
}

function CanvasSettings({
  snapToGrid,
  gridSize,
  onSnapToGridChange,
  onGridSizeChange,
}: {
  snapToGrid: boolean;
  gridSize: number;
  onSnapToGridChange: (value: boolean) => void;
  onGridSizeChange: (value: number) => void;
}) {
  return (
    <div className="border-b border-slate-200 px-4 py-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Canvas
      </h3>
      <div className="mt-3 flex flex-col gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={(e) => onSnapToGridChange(e.target.checked)}
            className="rounded border-slate-300"
          />
          Snap to grid
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-600">
            Snap grid size
          </span>
          <input
            type="number"
            min={4}
            max={100}
            step={1}
            value={gridSize}
            onChange={(e) =>
              onGridSizeChange(
                Math.max(4, Math.min(100, Number(e.target.value) || 4)),
              )
            }
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-teal-500"
          />
        </label>
      </div>
    </div>
  );
}

function PanelHeader({
  subtitle,
  onCollapse,
}: {
  subtitle?: string;
  onCollapse: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-slate-200 px-4 py-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-800">Properties</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onCollapse}
        className="shrink-0 rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
        title="Collapse panel"
        aria-label="Collapse properties panel"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-3.5 w-3.5"
          aria-hidden
        >
          <path d="M12.5 4.5 7.5 10l5 5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Shared transparency UI: range slider + numeric input.
 * Props are a simple controlled-component pattern (value + onChange).
 */
function TransparencyControl({
  opacity,
  onChange,
}: {
  opacity: number;
  onChange: (opacity: number) => void;
}) {
  const transparencyPct = Math.round((1 - (opacity ?? 1)) * 100);

  const setTransparency = (pct: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(pct)));
    onChange((100 - clamped) / 100);
  };

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-600">Transparency</span>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={transparencyPct}
          onChange={(e) => setTransparency(Number(e.target.value))}
          className="transparency-slider min-w-0 flex-1"
          title="Transparency"
        />
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={transparencyPct}
          onChange={(e) => setTransparency(Number(e.target.value) || 0)}
          className="w-14 rounded-md border border-slate-200 px-2 py-1.5 text-sm tabular-nums outline-none focus:border-teal-500"
          aria-label="Transparency percent"
        />
        <span className="text-xs text-slate-500">%</span>
      </div>
    </label>
  );
}

export function PropertiesSidebar({
  shape,
  connection,
  selectionCount,
  snapToGrid,
  gridSize,
  onSnapToGridChange,
  onGridSizeChange,
  onChangeShape,
  onChangeConnection,
  onApplyConnectionStyleToAll,
}: PropertiesSidebarProps) {
  const [width, setWidth] = useState(PANEL_DEFAULT);
  const [collapsed, setCollapsed] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(PANEL_DEFAULT);

  const onResizeMove = useCallback((e: MouseEvent) => {
    const delta = dragStartX.current - e.clientX;
    const next = Math.min(
      PANEL_MAX,
      Math.max(PANEL_MIN, dragStartWidth.current + delta),
    );
    setWidth(next);
  }, []);

  const onResizeEnd = useCallback(() => {
    window.removeEventListener("mousemove", onResizeMove);
    window.removeEventListener("mouseup", onResizeEnd);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [onResizeMove]);

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onResizeMove);
      window.removeEventListener("mouseup", onResizeEnd);
    };
  }, [onResizeEnd, onResizeMove]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onResizeMove);
    window.addEventListener("mouseup", onResizeEnd);
  };

  const canvasSettings = (
    <CanvasSettings
      snapToGrid={snapToGrid}
      gridSize={gridSize}
      onSnapToGridChange={onSnapToGridChange}
      onGridSizeChange={onGridSizeChange}
    />
  );

  if (collapsed) {
    return (
      <aside className="relative flex w-9 shrink-0 flex-col items-center border-l border-slate-200 bg-white py-2">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          title="Expand properties"
          aria-label="Expand properties panel"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-3.5 w-3.5"
            aria-hidden
          >
            <path d="M7.5 4.5 12.5 10l-5 5.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span
          className="mt-4 select-none text-[10px] font-semibold uppercase tracking-wider text-slate-400"
          style={{ writingMode: "vertical-rl" }}
        >
          Properties
        </span>
      </aside>
    );
  }

  let body: React.ReactNode;
  let subtitle: string | undefined;

  if (connection) {
    subtitle = "Connector";
    const update = (updates: Partial<Connection>) =>
      onChangeConnection(connection.id, updates);

    body = (
      <>
        {canvasSettings}
        <div className="flex flex-col gap-4 px-4 py-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-600">
              Line color
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={connection.stroke}
                onChange={(e) => update({ stroke: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
              />
              <input
                type="text"
                value={connection.stroke}
                onChange={(e) => update({ stroke: e.target.value })}
                className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-600">
              Line width
            </span>
            <input
              type="number"
              min={1}
              max={20}
              value={connection.strokeWidth}
              onChange={(e) =>
                update({
                  strokeWidth: Math.max(1, Number(e.target.value) || 1),
                })
              }
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-teal-500"
            />
          </label>

          <TransparencyControl
            opacity={connection.opacity ?? 1}
            onChange={(opacity) => update({ opacity })}
          />

          <label className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={connection.orthogonal}
              onChange={(e) =>
                update({
                  orthogonal: e.target.checked,
                  ...(e.target.checked
                    ? {}
                    : { fromPort: undefined, toPort: undefined, bend: undefined }),
                })
              }
              className="mt-0.5 rounded border-slate-300"
            />
            <span>
              <span className="font-medium">90° connector</span>
              <span className="mt-0.5 block text-slate-500">
                Drag white handles to change attachment sides; drag gray
                corners to bend the path
              </span>
            </span>
          </label>

          <button
            type="button"
            onClick={onApplyConnectionStyleToAll}
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
          >
            Apply style to all connectors
          </button>
        </div>
      </>
    );
  } else if (selectionCount > 1) {
    body = (
      <>
        {canvasSettings}
        <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-slate-400">
          {selectionCount} shapes selected.
          <br />
          Drag any selected shape to move them together.
        </div>
      </>
    );
  } else if (!shape) {
    body = (
      <>
        {canvasSettings}
        <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-slate-400">
          Select a shape or connector to edit its properties
        </div>
      </>
    );
  } else {
    subtitle = SHAPE_LABELS[shape.type];
    const update = (updates: Partial<FlowShape>) =>
      onChangeShape(shape.id, updates);

    body = (
      <>
        {canvasSettings}
        <div className="flex flex-col gap-4 px-4 py-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-600">Text</span>
            <textarea
              value={shape.text}
              rows={3}
              onChange={(e) => update({ text: e.target.value })}
              className="rounded-md border border-slate-200 px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-600">Fill color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={shape.fill === "transparent" ? "#ffffff" : shape.fill}
                onChange={(e) => update({ fill: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
              />
              <input
                type="text"
                value={shape.fill}
                onChange={(e) => update({ fill: e.target.value })}
                className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
              />
            </div>
          </label>

          <TransparencyControl
            opacity={shape.opacity ?? 1}
            onChange={(opacity) => update({ opacity })}
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-600">Border color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={shape.stroke}
                onChange={(e) => update({ stroke: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
              />
              <input
                type="text"
                value={shape.stroke}
                onChange={(e) => update({ stroke: e.target.value })}
                className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-600">
              Border width
            </span>
            <input
              type="number"
              min={0}
              max={20}
              value={shape.strokeWidth}
              onChange={(e) =>
                update({ strokeWidth: Math.max(0, Number(e.target.value) || 0) })
              }
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-teal-500"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-600">Font size</span>
            <input
              type="number"
              min={8}
              max={72}
              value={shape.fontSize}
              onChange={(e) =>
                update({
                  fontSize: Math.max(8, Math.min(72, Number(e.target.value) || 16)),
                })
              }
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-teal-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-600">Width</span>
              <input
                type="number"
                min={40}
                value={Math.round(shape.width)}
                onChange={(e) =>
                  update({ width: Math.max(40, Number(e.target.value) || 40) })
                }
                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-teal-500"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-600">Height</span>
              <input
                type="number"
                min={30}
                value={Math.round(shape.height)}
                onChange={(e) =>
                  update({ height: Math.max(30, Number(e.target.value) || 30) })
                }
                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-teal-500"
              />
            </label>
          </div>
        </div>
      </>
    );
  }

  return (
    <aside
      className="relative flex shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white"
      style={{ width }}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize properties panel"
        onMouseDown={startResize}
        className="absolute inset-y-0 left-0 z-10 w-1.5 cursor-col-resize touch-none hover:bg-teal-500/20 active:bg-teal-500/30"
      />
      <PanelHeader subtitle={subtitle} onCollapse={() => setCollapsed(true)} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{body}</div>
    </aside>
  );
}
