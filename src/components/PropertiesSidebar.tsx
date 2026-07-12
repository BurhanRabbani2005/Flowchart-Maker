"use client";

import type { Connection, FlowShape } from "@/types";
import { SHAPE_LABELS } from "@/types";

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
  const canvasSettings = (
    <CanvasSettings
      snapToGrid={snapToGrid}
      gridSize={gridSize}
      onSnapToGridChange={onSnapToGridChange}
      onGridSizeChange={onGridSizeChange}
    />
  );

  if (connection) {
    const update = (updates: Partial<Connection>) =>
      onChangeConnection(connection.id, updates);

    return (
      <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-l border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Properties</h2>
          <p className="mt-0.5 text-xs text-slate-500">Connector</p>
        </div>
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
      </aside>
    );
  }

  if (selectionCount > 1) {
    return (
      <aside className="flex w-64 shrink-0 flex-col border-l border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Properties</h2>
        </div>
        {canvasSettings}
        <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-slate-400">
          {selectionCount} shapes selected.
          <br />
          Drag any selected shape to move them together.
        </div>
      </aside>
    );
  }

  if (!shape) {
    return (
      <aside className="flex w-64 shrink-0 flex-col border-l border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Properties</h2>
        </div>
        {canvasSettings}
        <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-slate-400">
          Select a shape or connector to edit its properties
        </div>
      </aside>
    );
  }

  const update = (updates: Partial<FlowShape>) =>
    onChangeShape(shape.id, updates);

  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-l border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Properties</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {SHAPE_LABELS[shape.type]}
        </p>
      </div>
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
    </aside>
  );
}
