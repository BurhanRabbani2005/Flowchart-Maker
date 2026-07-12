"use client";

import { useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type Konva from "konva";
import { Toolbar } from "@/components/Toolbar";
import { PropertiesSidebar } from "@/components/PropertiesSidebar";
import { useEditorState } from "@/hooks/useEditorState";
import {
  downloadJson,
  parseFlowchartDocument,
  serializeFlowchart,
} from "@/lib/flowchartFile";

const Canvas = dynamic(
  () => import("@/components/Canvas").then((mod) => mod.Canvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading canvas…
      </div>
    ),
  },
);

export function Editor() {
  const stageRef = useRef<Konva.Stage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    shapes,
    connections,
    selectedIds,
    selectedShape,
    mode,
    connectFromId,
    addShape,
    updateShape,
    deleteSelected,
    deleteConnection,
    selectShape,
    setSelection,
    toggleConnectMode,
    toggleMultiSelectMode,
    alignSelected,
    distributeSelected,
    alignSelectedToGrid,
    loadDocument,
  } = useEditorState();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        deleteSelected();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelected]);

  const handleExportPng = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const uri = stage.toDataURL({ pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = "flowchart.png";
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleExportJson = useCallback(() => {
    const json = serializeFlowchart(shapes, connections);
    downloadJson("flowchart.json", json);
  }, [shapes, connections]);

  const handleImportJson = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      try {
        const text = await file.text();
        const doc = parseFlowchartDocument(text);
        loadDocument(doc);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to import flowchart.";
        window.alert(message);
      }
    },
    [loadDocument],
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50">
      <Toolbar
        mode={mode}
        selectionCount={selectedIds.length}
        onAddShape={addShape}
        onToggleConnect={toggleConnectMode}
        onToggleMultiSelect={toggleMultiSelectMode}
        onAlign={alignSelected}
        onDistribute={distributeSelected}
        onAlignToGrid={alignSelectedToGrid}
        onDelete={deleteSelected}
        onExportPng={handleExportPng}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex min-h-0 flex-1">
        <main className="relative min-w-0 flex-1">
          <Canvas
            shapes={shapes}
            connections={connections}
            selectedIds={selectedIds}
            connectFromId={connectFromId}
            mode={mode}
            onSelect={selectShape}
            onSetSelection={setSelection}
            onUpdateShape={updateShape}
            onDeleteConnection={deleteConnection}
            stageRef={stageRef}
          />

          {mode === "connect" && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-medium text-teal-800 shadow-sm">
              {connectFromId
                ? "Click a second shape to connect"
                : "Click the first shape to start a connection"}
            </div>
          )}

          {mode === "multiselect" && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-medium text-teal-800 shadow-sm">
              Click shapes to add or remove them from the selection
              {selectedIds.length > 0 ? ` (${selectedIds.length} selected)` : ""}
            </div>
          )}
        </main>

        <PropertiesSidebar
          shape={selectedShape}
          selectionCount={selectedIds.length}
          onChange={updateShape}
        />
      </div>
    </div>
  );
}
