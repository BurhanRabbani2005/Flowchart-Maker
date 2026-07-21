"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type Konva from "konva";
import { TopBar, EditorToolbar } from "@/components/Toolbar";
import { PropertiesSidebar } from "@/components/PropertiesSidebar";
import { useEditorState } from "@/hooks/useEditorState";
import { downloadPngFromStage } from "@/lib/exportPng";
import {
  downloadJson,
  FLOWCHART_FILE_VERSION,
  parseFlowchartDocument,
  serializeFlowchart,
  type FlowchartDocument,
} from "@/lib/flowchartFile";
import {
  HistoryModal,
  type RevisionItem,
} from "@/components/HistoryModal";

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

interface EditorProps {
  flowchartId: string;
  initialName: string;
  initialDocument: FlowchartDocument;
  readOnly: boolean;
  lockedByUsername?: string | null;
}

export function Editor({
  flowchartId,
  initialName,
  initialDocument,
  readOnly,
  lockedByUsername,
}: EditorProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pngBackground, setPngBackground] = useState("#ffffff");
  const [pngTransparent, setPngTransparent] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [fileName, setFileName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadDocument(initialDocument);
  }, [initialDocument, loadDocument]);

  const handleSave = useCallback(async () => {
    if (readOnly) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const document: FlowchartDocument = {
        version: 1,
        shapes,
        connections,
      };
      const res = await fetch(`/api/flowcharts/${flowchartId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document, name: fileName }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSaveMessage(data.error || "Save failed");
        return;
      }
      setSaveMessage("Saved");
      window.setTimeout(() => setSaveMessage(null), 2000);
    } catch {
      setSaveMessage("Save failed");
    } finally {
      setSaving(false);
    }
  }, [connections, fileName, flowchartId, readOnly, shapes]);

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void handleSaveRef.current();
        return;
      }

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
  }, [copySelected, pasteClipboard, deleteSelected, readOnly]);

  useEffect(() => {
    if (readOnly) return;

    const release = () => {
      void fetch(`/api/flowcharts/${flowchartId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "release" }),
        keepalive: true,
      });
    };

    void fetch(`/api/flowcharts/${flowchartId}/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "acquire" }),
    });

    const interval = window.setInterval(() => {
      void fetch(`/api/flowcharts/${flowchartId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "heartbeat" }),
      });
    }, 30_000);

    window.addEventListener("pagehide", release);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pagehide", release);
      release();
    };
  }, [flowchartId, readOnly]);

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
    if (readOnly) return;
    fileInputRef.current?.click();
  }, [readOnly]);

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
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to import flowchart.";
        window.alert(message);
      }
    },
    [loadDocument],
  );

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/flowcharts/${flowchartId}/revisions`);
      if (!res.ok) return;
      const data = (await res.json()) as { revisions: RevisionItem[] };
      setRevisions(data.revisions);
    } finally {
      setHistoryLoading(false);
    }
  }, [flowchartId]);

  const openHistory = useCallback(async () => {
    setShowHistory(true);
    await loadHistory();
  }, [loadHistory]);

  const restoreRevision = useCallback(
    async (revisionId: string) => {
      if (readOnly) return;
      if (
        !window.confirm(
          "Restore this revision? Current content will be replaced and saved as a new revision.",
        )
      ) {
        return;
      }
      const res = await fetch(`/api/flowcharts/${flowchartId}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId }),
      });
      const data = (await res.json()) as {
        document?: FlowchartDocument;
        error?: string;
      };
      if (!res.ok || !data.document) {
        window.alert(data.error || "Restore failed");
        return;
      }
      loadDocument(data.document);
      setShowHistory(false);
      setSaveMessage("Revision restored");
      window.setTimeout(() => setSaveMessage(null), 2000);
    },
    [flowchartId, loadDocument, readOnly],
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50">
      <TopBar
        fileName={fileName}
        pngBackground={pngBackground}
        pngTransparent={pngTransparent}
        showInstructions={showInstructions}
        readOnly={readOnly}
        saving={saving}
        saveMessage={saveMessage}
        onFileNameChange={setFileName}
        onPngBackgroundChange={setPngBackground}
        onPngTransparentChange={setPngTransparent}
        onShowInstructionsChange={setShowInstructions}
        onDownloadPng={handleDownloadPng}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onSave={handleSave}
        onOpenHistory={openHistory}
        homeHref="/"
      />

      {readOnly && lockedByUsername ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
          {lockedByUsername} is already editing this flowchart. You are in
          read-only mode.{" "}
          <Link href="/" className="underline">
            Back to home
          </Link>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <EditorToolbar
            mode={mode}
            selectionCount={selectedIds.length}
            hasClipboard={hasClipboard}
            canDelete={selectedIds.length > 0 || selectedConnectionId !== null}
            snapToGrid={snapToGrid}
            disabled={readOnly}
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
              selectedIds={readOnly ? [] : selectedIds}
              selectedConnectionId={readOnly ? null : selectedConnectionId}
              connectFromId={readOnly ? null : connectFromId}
              mode={readOnly ? "select" : mode}
              showInstructions={showInstructions}
              onSelect={readOnly ? () => {} : selectShape}
              onSelectConnection={readOnly ? () => {} : selectConnection}
              onSetSelection={readOnly ? () => {} : setSelection}
              onUpdateShape={readOnly ? () => {} : updateShape}
              onMoveSelected={readOnly ? () => {} : moveSelectedShapes}
              onDeleteConnection={readOnly ? () => {} : deleteConnection}
              onChangeConnection={readOnly ? () => {} : updateConnection}
              snapToGrid={snapToGrid}
              gridSize={gridSize}
              stageRef={stageRef}
            />

            {mode === "connect" && !readOnly && (
              <div className="pointer-events-none absolute bottom-16 left-1/2 z-10 -translate-x-1/2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-medium text-teal-800 shadow-sm">
                {connectFromId
                  ? "Click a second shape to connect"
                  : "Click the first shape to start a connection"}
              </div>
            )}

            {mode === "multiselect" && !readOnly && (
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
          shape={readOnly ? null : selectedShape}
          connection={readOnly ? null : selectedConnection}
          selectionCount={readOnly ? 0 : selectedIds.length}
          snapToGrid={snapToGrid}
          gridSize={gridSize}
          onSnapToGridChange={setSnapToGrid}
          onGridSizeChange={setGridSize}
          onChangeShape={updateShape}
          onChangeConnection={updateConnection}
          onApplyConnectionStyleToAll={applyConnectionStyleToAll}
        />
      </div>

      {showHistory ? (
        <HistoryModal
          flowchartId={flowchartId}
          currentDocument={{
            version: FLOWCHART_FILE_VERSION,
            shapes,
            connections,
          }}
          revisions={revisions}
          loading={historyLoading}
          readOnly={readOnly}
          onClose={() => setShowHistory(false)}
          onRestore={restoreRevision}
          onRevisionsChange={setRevisions}
        />
      ) : null}
    </div>
  );
}
