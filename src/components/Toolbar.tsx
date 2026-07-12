"use client";

import type { ShapeType, ToolMode } from "@/types";
import { SHAPE_LABELS } from "@/types";
import type { AlignDirection, DistributeAxis } from "@/lib/align";

interface ToolbarProps {
  mode: ToolMode;
  selectionCount: number;
  onAddShape: (type: ShapeType) => void;
  onToggleConnect: () => void;
  onToggleMultiSelect: () => void;
  onAlign: (direction: AlignDirection) => void;
  onDistribute: (axis: DistributeAxis) => void;
  onAlignToGrid: () => void;
  onDelete: () => void;
  onExportPng: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
}

const SHAPE_BUTTONS: ShapeType[] = [
  "rectangle",
  "roundedRect",
  "circle",
  "diamond",
  "text",
];

const btn =
  "inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";
const btnActive =
  "inline-flex items-center gap-1.5 rounded-md border border-teal-600 bg-teal-50 px-2.5 py-1.5 text-xs font-medium text-teal-800 transition";

function ShapeIcon({ type }: { type: ShapeType }) {
  const common = "h-4 w-4 stroke-[1.5]";

  switch (type) {
    case "rectangle":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}>
          <rect x="4" y="6" width="16" height="12" />
        </svg>
      );
    case "roundedRect":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}>
          <rect x="4" y="6" width="16" height="12" rx="3" />
        </svg>
      );
    case "circle":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}>
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}>
          <path d="M12 3 L21 12 L12 21 L3 12 Z" />
        </svg>
      );
    case "text":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}>
          <path d="M5 7h14M12 7v10M9 17h6" />
        </svg>
      );
  }
}

export function Toolbar({
  mode,
  selectionCount,
  onAddShape,
  onToggleConnect,
  onToggleMultiSelect,
  onAlign,
  onDistribute,
  onAlignToGrid,
  onDelete,
  onExportPng,
  onExportJson,
  onImportJson,
}: ToolbarProps) {
  const canAlign = selectionCount >= 2;
  const canDistribute = selectionCount >= 3;
  const canSnapGrid = selectionCount >= 1;

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <div className="mr-2 flex items-center gap-2 border-r border-slate-200 pr-3">
          <span className="text-sm font-semibold tracking-tight text-slate-800">
            FlowDraw
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {SHAPE_BUTTONS.map((type) => (
            <button
              key={type}
              type="button"
              title={`Add ${SHAPE_LABELS[type]}`}
              onClick={() => onAddShape(type)}
              className={btn}
            >
              <ShapeIcon type={type} />
              <span className="hidden sm:inline">{SHAPE_LABELS[type]}</span>
            </button>
          ))}
        </div>

        <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

        <button
          type="button"
          title="Select multiple shapes"
          onClick={onToggleMultiSelect}
          className={mode === "multiselect" ? btnActive : btn}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            <rect x="3" y="3" width="8" height="8" rx="1" />
            <rect x="13" y="13" width="8" height="8" rx="1" />
            <path d="M13 7h4M17 3v4M7 13v4M3 17h4" />
          </svg>
          Multi-select
        </button>

        <button
          type="button"
          onClick={onToggleConnect}
          className={mode === "connect" ? btnActive : btn}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="12" r="3" />
            <path d="M9 12h6" />
          </svg>
          {mode === "connect" ? "Connecting…" : "Connect"}
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={selectionCount === 0}
          className={`${btn} hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            <path d="M5 7h14M10 11v6M14 11v6M8 7l1-2h6l1 2M7 7v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7" />
          </svg>
          Delete
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-1">
          <button type="button" onClick={onImportJson} className={btn} title="Import flowchart JSON">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
              <path d="M12 14V4M8 8l4-4 4 4M5 18h14" />
            </svg>
            Import
          </button>
          <button type="button" onClick={onExportJson} className={btn} title="Export flowchart JSON">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
              <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8l-4-5Z" />
              <path d="M14 3v5h5" />
            </svg>
            JSON
          </button>
          <button
            type="button"
            onClick={onExportPng}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
              <path d="M12 4v10M8 10l4 4 4-4M5 18h14" />
            </svg>
            Export PNG
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-t border-slate-100 bg-slate-50/80 px-3 py-1.5">
        <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Arrange
        </span>
        <button type="button" title="Align left" disabled={!canAlign} onClick={() => onAlign("left")} className={btn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            <path d="M4 4v16M8 8h10M8 12h7M8 16h10" />
          </svg>
          Left
        </button>
        <button type="button" title="Align right" disabled={!canAlign} onClick={() => onAlign("right")} className={btn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            <path d="M20 4v16M6 8h10M9 12h7M6 16h10" />
          </svg>
          Right
        </button>
        <button type="button" title="Align top" disabled={!canAlign} onClick={() => onAlign("top")} className={btn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            <path d="M4 4h16M8 8v10M12 8v7M16 8v10" />
          </svg>
          Top
        </button>
        <button type="button" title="Align bottom" disabled={!canAlign} onClick={() => onAlign("bottom")} className={btn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            <path d="M4 20h16M8 6v10M12 9v7M16 6v10" />
          </svg>
          Bottom
        </button>
        <button
          type="button"
          title="Equalize horizontal spacing (3+ shapes)"
          disabled={!canDistribute}
          onClick={() => onDistribute("horizontal")}
          className={btn}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            <rect x="3" y="8" width="4" height="8" />
            <rect x="10" y="8" width="4" height="8" />
            <rect x="17" y="8" width="4" height="8" />
          </svg>
          Space H
        </button>
        <button
          type="button"
          title="Equalize vertical spacing (3+ shapes)"
          disabled={!canDistribute}
          onClick={() => onDistribute("vertical")}
          className={btn}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            <rect x="8" y="3" width="8" height="4" />
            <rect x="8" y="10" width="8" height="4" />
            <rect x="8" y="17" width="8" height="4" />
          </svg>
          Space V
        </button>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        <button
          type="button"
          title="Snap selected shapes to the grid"
          disabled={!canSnapGrid}
          onClick={onAlignToGrid}
          className={btn}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            <path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z" />
          </svg>
          Align to grid
        </button>
      </div>
    </header>
  );
}
