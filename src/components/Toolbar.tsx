"use client";

import type { ShapeType, ToolMode } from "@/types";
import { SHAPE_LABELS, SHAPE_USAGE } from "@/types";
import type { AlignDirection, DistributeAxis } from "@/lib/align";

interface TopBarProps {
  fileName: string;
  pngBackground: string;
  pngTransparent: boolean;
  showInstructions: boolean;
  readOnly?: boolean;
  saving?: boolean;
  saveMessage?: string | null;
  homeHref?: string;
  onFileNameChange: (value: string) => void;
  onPngBackgroundChange: (color: string) => void;
  onPngTransparentChange: (value: boolean) => void;
  onShowInstructionsChange: (value: boolean) => void;
  onDownloadPng: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onSave?: () => void;
  onOpenHistory?: () => void;
}

interface EditorToolbarProps {
  mode: ToolMode;
  selectionCount: number;
  hasClipboard: boolean;
  canDelete: boolean;
  snapToGrid: boolean;
  disabled?: boolean;
  onSnapToGridChange: (value: boolean) => void;
  onAddShape: (type: ShapeType) => void;
  onToggleConnect: () => void;
  onToggleMultiSelect: () => void;
  onAlign: (direction: AlignDirection) => void;
  onDistribute: (axis: DistributeAxis) => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
}

const SHAPE_BUTTONS: ShapeType[] = [
  "rectangle",
  "roundedRect",
  "circle",
  "diamond",
  "parallelogram",
  "text",
];

const btn =
  "inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";
const btnActive =
  "inline-flex h-9 items-center gap-1.5 rounded-md border border-teal-600 bg-teal-50 px-2.5 text-xs font-medium text-teal-800 transition";
const fileBtn =
  "inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-500 bg-slate-800 px-3 text-xs font-medium text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40";

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
          <rect x="4" y="6" width="16" height="12" rx="4" />
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
    case "parallelogram":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}>
          <path d="M7 6h14l-4 12H3z" />
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

export function TopBar({
  fileName,
  pngBackground,
  pngTransparent,
  showInstructions,
  readOnly = false,
  saving = false,
  saveMessage = null,
  homeHref,
  onFileNameChange,
  onPngBackgroundChange,
  onPngTransparentChange,
  onShowInstructionsChange,
  onDownloadPng,
  onExportJson,
  onImportJson,
  onSave,
  onOpenHistory,
}: TopBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-slate-800 px-3 py-2 text-slate-100">
      {homeHref ? (
        <a
          href={homeHref}
          className="text-sm font-semibold tracking-tight text-white hover:text-teal-200"
        >
          FlowDraw
        </a>
      ) : (
        <span className="text-sm font-semibold tracking-tight text-white">
          FlowDraw
        </span>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {onSave ? (
          <button
            type="button"
            onClick={onSave}
            disabled={readOnly || saving}
            className={fileBtn}
            title="Save to server (⌘/Ctrl+S)"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        ) : null}
        {saveMessage ? (
          <span className="text-xs text-teal-200">{saveMessage}</span>
        ) : null}
        {onOpenHistory ? (
          <button
            type="button"
            onClick={onOpenHistory}
            className={fileBtn}
            title="View save history"
          >
            History
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onShowInstructionsChange(!showInstructions)}
          className={
            showInstructions
              ? "inline-flex h-9 items-center gap-1.5 rounded-md border border-teal-400 bg-teal-900/50 px-3 text-xs font-medium text-teal-100 transition hover:bg-teal-900/70"
              : fileBtn
          }
          title={
            showInstructions
              ? "Hide canvas instructions"
              : "Show canvas instructions"
          }
          aria-pressed={showInstructions}
        >
          Instructions
        </button>
        <label className={`${fileBtn} cursor-pointer`}>
          <input
            type="checkbox"
            checked={pngTransparent}
            onChange={(e) => onPngTransparentChange(e.target.checked)}
            className="rounded border-slate-500"
          />
          Clear PNG bg
        </label>
        <label
          className={`${fileBtn} cursor-pointer px-2 ${pngTransparent ? "opacity-40" : ""}`}
          title="PNG background color"
        >
          <input
            type="color"
            value={pngBackground}
            disabled={pngTransparent}
            onChange={(e) => onPngBackgroundChange(e.target.value)}
            className="h-5 w-6 cursor-pointer rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed"
          />
        </label>
        <button type="button" onClick={onDownloadPng} className={fileBtn}>
          PNG
        </button>
        <input
          type="text"
          value={fileName}
          onChange={(e) => onFileNameChange(e.target.value)}
          placeholder="flowchart"
          spellCheck={false}
          disabled={readOnly}
          className="h-9 w-40 min-w-[8rem] rounded-md border border-slate-500 bg-slate-900 px-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-teal-400 disabled:opacity-50 sm:w-52"
          title="Flowchart name"
          aria-label="File name"
        />
        <button
          type="button"
          onClick={onImportJson}
          disabled={readOnly}
          className={fileBtn}
          title="Import flowchart (.json)"
        >
          Import
        </button>
        <button
          type="button"
          onClick={onExportJson}
          className={fileBtn}
          title="Export flowchart (.json)"
        >
          Export
        </button>
      </div>
    </div>
  );
}

export function EditorToolbar({
  mode,
  selectionCount,
  hasClipboard,
  canDelete,
  snapToGrid,
  disabled = false,
  onSnapToGridChange,
  onAddShape,
  onToggleConnect,
  onToggleMultiSelect,
  onAlign,
  onDistribute,
  onCopy,
  onPaste,
  onDelete,
}: EditorToolbarProps) {
  const canAlign = !disabled && selectionCount >= 2;
  const canDistribute = !disabled && selectionCount >= 3;

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-1 px-3 py-1.5">
        <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Shapes
        </span>
        {SHAPE_BUTTONS.map((type) => (
          <button
            key={type}
            type="button"
            title={`${SHAPE_LABELS[type]} — ${SHAPE_USAGE[type]}`}
            onClick={() => onAddShape(type)}
            disabled={disabled}
            className={btn}
          >
            <ShapeIcon type={type} />
            <span className="hidden sm:inline">{SHAPE_LABELS[type]}</span>
          </button>
        ))}

        <div className="mx-1 h-5 w-px bg-slate-200" />

        <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Edit
        </span>
        <button
          type="button"
          title="Select multiple shapes"
          onClick={onToggleMultiSelect}
          disabled={disabled}
          className={mode === "multiselect" ? btnActive : btn}
        >
          Multi-select
        </button>
        <button
          type="button"
          title="Copy selected (Ctrl+C)"
          onClick={onCopy}
          disabled={disabled || selectionCount === 0}
          className={btn}
        >
          Copy
        </button>
        <button
          type="button"
          title="Paste (Ctrl+V)"
          onClick={onPaste}
          disabled={disabled || !hasClipboard}
          className={btn}
        >
          Paste
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled || !canDelete}
          className={`${btn} hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700`}
        >
          Delete
        </button>
        <button
          type="button"
          onClick={onToggleConnect}
          disabled={disabled}
          className={mode === "connect" ? btnActive : btn}
        >
          {mode === "connect" ? "Connecting…" : "Connect"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-t border-slate-100 bg-slate-50/60 px-3 py-1.5">
        <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Arrange
        </span>
        <button type="button" title="Align left" disabled={!canAlign} onClick={() => onAlign("left")} className={btn}>
          Left
        </button>
        <button type="button" title="Align right" disabled={!canAlign} onClick={() => onAlign("right")} className={btn}>
          Right
        </button>
        <button type="button" title="Align top" disabled={!canAlign} onClick={() => onAlign("top")} className={btn}>
          Top
        </button>
        <button type="button" title="Align bottom" disabled={!canAlign} onClick={() => onAlign("bottom")} className={btn}>
          Bottom
        </button>
        <button
          type="button"
          title="Align centers horizontally (same vertical position)"
          disabled={!canAlign}
          onClick={() => onAlign("centerH")}
          className={btn}
        >
          Mid H
        </button>
        <button
          type="button"
          title="Align centers vertically (same horizontal position)"
          disabled={!canAlign}
          onClick={() => onAlign("centerV")}
          className={btn}
        >
          Mid V
        </button>
        <button
          type="button"
          title="Equalize horizontal spacing (3+ shapes)"
          disabled={!canDistribute}
          onClick={() => onDistribute("horizontal")}
          className={btn}
        >
          Space H
        </button>
        <button
          type="button"
          title="Equalize vertical spacing (3+ shapes)"
          disabled={!canDistribute}
          onClick={() => onDistribute("vertical")}
          className={btn}
        >
          Space V
        </button>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        <label
          className={`${snapToGrid ? btnActive : btn} cursor-pointer ${disabled ? "pointer-events-none opacity-40" : ""}`}
          title="When on, shapes snap to the grid while moving and resizing"
        >
          <input
            type="checkbox"
            checked={snapToGrid}
            disabled={disabled}
            onChange={(e) => onSnapToGridChange(e.target.checked)}
            className="rounded border-slate-300"
          />
          Snap to grid
        </label>
      </div>
    </div>
  );
}
