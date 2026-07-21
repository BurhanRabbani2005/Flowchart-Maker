"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import type { FlowchartDocument } from "@/lib/flowchartFile";

const FlowchartPreview = dynamic(
  () =>
    import("@/components/FlowchartPreview").then((mod) => mod.FlowchartPreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[200px] flex-1 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-400">
        Loading preview…
      </div>
    ),
  },
);

export interface RevisionItem {
  id: string;
  savedAt: string;
  savedByUsername: string | null;
}

interface HistoryModalProps {
  flowchartId: string;
  currentDocument: FlowchartDocument;
  revisions: RevisionItem[];
  loading: boolean;
  readOnly: boolean;
  onClose: () => void;
  onRestore: (revisionId: string) => void;
  onRevisionsChange: (revisions: RevisionItem[]) => void;
}

export function HistoryModal({
  flowchartId,
  currentDocument,
  revisions,
  loading,
  readOnly,
  onClose,
  onRestore,
  onRevisionsChange,
}: HistoryModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [compareRevisionId, setCompareRevisionId] = useState<string | null>(
    null,
  );
  const [compareDocument, setCompareDocument] =
    useState<FlowchartDocument | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === revisions.length) return new Set();
      return new Set(revisions.map((r) => r.id));
    });
  }, [revisions]);

  const openCompare = useCallback(
    async (revisionId: string) => {
      setCompareRevisionId(revisionId);
      setCompareDocument(null);
      setCompareError(null);
      setCompareLoading(true);
      try {
        const res = await fetch(
          `/api/flowcharts/${flowchartId}/revisions/${revisionId}`,
        );
        const data = (await res.json()) as {
          document?: FlowchartDocument;
          error?: string;
        };
        if (!res.ok || !data.document) {
          setCompareError(data.error || "Could not load revision");
          return;
        }
        setCompareDocument(data.document);
      } catch {
        setCompareError("Could not load revision");
      } finally {
        setCompareLoading(false);
      }
    },
    [flowchartId],
  );

  const closeCompare = useCallback(() => {
    setCompareRevisionId(null);
    setCompareDocument(null);
    setCompareError(null);
  }, []);

  const deleteSelected = useCallback(async () => {
    if (readOnly || selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (
      !window.confirm(
        `Delete ${count} selected revision${count === 1 ? "" : "s"}? This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/flowcharts/${flowchartId}/revisions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionIds: [...selectedIds] }),
      });
      const data = (await res.json()) as {
        revisions?: RevisionItem[];
        error?: string;
      };
      if (!res.ok) {
        window.alert(data.error || "Delete failed");
        return;
      }
      if (data.revisions) onRevisionsChange(data.revisions);
      setSelectedIds(new Set());
      if (compareRevisionId && selectedIds.has(compareRevisionId)) {
        closeCompare();
      }
    } finally {
      setDeleting(false);
    }
  }, [
    closeCompare,
    compareRevisionId,
    flowchartId,
    onRevisionsChange,
    readOnly,
    selectedIds,
  ]);

  const compareMeta = revisions.find((r) => r.id === compareRevisionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl bg-white shadow-xl ${
          compareRevisionId ? "max-w-5xl" : "max-w-lg"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {compareRevisionId ? "Compare revisions" : "History"}
          </h2>
          <button
            type="button"
            onClick={compareRevisionId ? closeCompare : onClose}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            {compareRevisionId ? "Back to list" : "Close"}
          </button>
        </div>

        {compareRevisionId ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            <p className="text-xs text-slate-500">
              Left: previous save
              {compareMeta
                ? ` (${new Date(compareMeta.savedAt).toLocaleString()}${
                    compareMeta.savedByUsername
                      ? ` · ${compareMeta.savedByUsername}`
                      : ""
                  })`
                : ""}
              {" · "}
              Right: current editor
            </p>
            {compareLoading ? (
              <p className="py-12 text-center text-sm text-slate-500">
                Loading revision…
              </p>
            ) : compareError ? (
              <p className="py-12 text-center text-sm text-red-600">
                {compareError}
              </p>
            ) : compareDocument ? (
              <div className="grid min-h-[360px] flex-1 grid-cols-1 gap-3 md:grid-cols-2">
                <FlowchartPreview
                  document={compareDocument}
                  label="Previous revision"
                />
                <FlowchartPreview
                  document={currentDocument}
                  label="Current"
                />
              </div>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
              {!readOnly ? (
                <button
                  type="button"
                  onClick={() => onRestore(compareRevisionId)}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Restore this revision
                </button>
              ) : null}
              <button
                type="button"
                onClick={closeCompare}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {!readOnly && revisions.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2">
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={
                      revisions.length > 0 &&
                      selectedIds.size === revisions.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                  Select all
                </label>
                <button
                  type="button"
                  onClick={deleteSelected}
                  disabled={selectedIds.size === 0 || deleting}
                  className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {deleting
                    ? "Deleting…"
                    : `Delete selected${selectedIds.size ? ` (${selectedIds.size})` : ""}`}
                </button>
              </div>
            ) : null}

            <div className="max-h-[60vh] overflow-y-auto">
              {loading ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  Loading…
                </p>
              ) : revisions.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  No saves yet.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {revisions.map((rev) => (
                    <li
                      key={rev.id}
                      className="flex flex-wrap items-center gap-3 px-4 py-3"
                    >
                      {!readOnly ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(rev.id)}
                          onChange={() => toggleSelected(rev.id)}
                          className="rounded border-slate-300"
                          aria-label={`Select revision from ${rev.savedAt}`}
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-800">
                          {new Date(rev.savedAt).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {rev.savedByUsername || "Unknown"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openCompare(rev.id)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Compare
                        </button>
                        {!readOnly ? (
                          <button
                            type="button"
                            onClick={() => onRestore(rev.id)}
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Restore
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
