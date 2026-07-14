"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type Konva from "konva";
import { TopBar, EditorToolbar } from "@/components/Toolbar";
import { PropertiesSidebar } from "@/components/PropertiesSidebar";
import { useEditorState } from "@/hooks/useEditorState";
import { downloadPngFromStage } from "@/lib/exportPng";
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
  const [pngBackground, setPngBackground] = useState("#ffffff");
  const [pngTransparent, setPngTransparent] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [fileName, setFileName] = useState("");

  const {
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
    deleteSelected,
    deleteConnection,
    selectShape,
    selectConnection,
    setSelection,
    copySelected,
    pasteClipboard,
    toggleConnectMode,
    toggleMultiSelectMode,
    alignSelected,
    distributeSelected,
    loadDocument,
  } = useEditorState();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelected();
        return;
      }

      if (mod && e.key.toLowerCase() === "v") {
        e.preventDefault();
        pasteClipboard();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [copySelected, pasteClipboard, deleteSelected]);

  const resolveExportBaseName = useCallback(() => {
    const trimmed = fileName.trim();
    if (!trimmed) return "flowchart";
    const withoutExt = trimmed.replace(/\.(json|png)$/i, "").trim();
    return withoutExt || "flowchart";
  }, [fileName]);

  const handleDownloadPng = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    downloadPngFromStage(
      stage,
      `${resolveExportBaseName()}.png`,
      pngTransparent ? null : pngBackground,
    );
  }, [pngBackground, pngTransparent, resolveExportBaseName]);

  const handleExportJson = useCallback(() => {
    const json = serializeFlowchart(shapes, connections);
    downloadJson(`${resolveExportBaseName()}.json`, json);
  }, [shapes, connections, resolveExportBaseName]);

  const handleImportJson = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      if (!file.name.toLowerCase().endsWith(".json")) {
        window.alert("Please choose a .json flowchart file.");
        return;
      }

      try {
        const text = await file.text();
        const doc = parseFlowchartDocument(text);
        loadDocument(doc);
        setFileName(file.name);
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
      {/* Full-width dark top row */}
      <TopBar
        fileName={fileName}
        pngBackground={pngBackground}
        pngTransparent={pngTransparent}
        showInstructions={showInstructions}
        onFileNameChange={setFileName}
        onPngBackgroundChange={setPngBackground}
        onPngTransparentChange={setPngTransparent}
        onShowInstructionsChange={setShowInstructions}
        onDownloadPng={handleDownloadPng}
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

      {/* From row 2 down: tools + canvas | properties */}
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <EditorToolbar
            mode={mode}
            selectionCount={selectedIds.length}
            hasClipboard={hasClipboard}
            canDelete={selectedIds.length > 0 || selectedConnectionId !== null}
            snapToGrid={snapToGrid}
            onSnapToGridChange={setSnapToGrid}
            onAddShape={addShape}
            onToggleConnect={toggleConnectMode}
            onToggleMultiSelect={toggleMultiSelectMode}
            onAlign={alignSelected}
            onDistribute={distributeSelected}
            onCopy={copySelected}
            onPaste={pasteClipboard}
            onDelete={deleteSelected}
          />

          <main className="relative min-h-0 flex-1">
            <Canvas
              shapes={shapes}
              connections={connections}
              selectedIds={selectedIds}
              selectedConnectionId={selectedConnectionId}
              connectFromId={connectFromId}
              mode={mode}
              showInstructions={showInstructions}
              onSelect={selectShape}
              onSelectConnection={selectConnection}
              onSetSelection={setSelection}
              onUpdateShape={updateShape}
              onMoveSelected={moveSelectedShapes}
              onDeleteConnection={deleteConnection}
              onChangeConnection={updateConnection}
              snapToGrid={snapToGrid}
              gridSize={gridSize}
              stageRef={stageRef}
            />

            {mode === "connect" && (
              <div className="pointer-events-none absolute bottom-16 left-1/2 z-10 -translate-x-1/2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-medium text-teal-800 shadow-sm">
                {connectFromId
                  ? "Click a second shape to connect"
                  : "Click the first shape to start a connection"}
              </div>
            )}

            {mode === "multiselect" && (
              <div className="pointer-events-none absolute bottom-16 left-1/2 z-10 -translate-x-1/2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-medium text-teal-800 shadow-sm">
                Click shapes to add or remove them from the selection
                {selectedIds.length > 0
                  ? ` (${selectedIds.length} selected)`
                  : ""}
              </div>
            )}
          </main>
        </div>

        <PropertiesSidebar
          shape={selectedShape}
          connection={selectedConnection}
          selectionCount={selectedIds.length}
          snapToGrid={snapToGrid}
          gridSize={gridSize}
          onSnapToGridChange={setSnapToGrid}
          onGridSizeChange={setGridSize}
          onChangeShape={updateShape}
          onChangeConnection={updateConnection}
          onApplyConnectionStyleToAll={applyConnectionStyleToAll}
        />
      </div>
    </div>
  );
}
