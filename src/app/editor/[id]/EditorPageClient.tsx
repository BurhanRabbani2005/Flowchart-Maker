"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Editor } from "@/components/Editor";
import type { FlowchartDocument } from "@/lib/flowchartFile";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      name: string;
      document: FlowchartDocument;
      readOnly: boolean;
      lockedByUsername: string | null;
    };

export default function EditorPageClient() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const forceReadOnly = searchParams.get("readonly") === "1";
  const id = params.id;
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/flowcharts/${id}`);
        const data = (await res.json()) as {
          error?: string;
          flowchart?: { name: string };
          document?: FlowchartDocument;
          lock?: { username: string; userId: string } | null;
        };
        if (!res.ok || !data.flowchart || !data.document) {
          if (!cancelled) {
            setState({
              status: "error",
              message: data.error || "Flowchart not found",
            });
          }
          return;
        }

        let readOnly = forceReadOnly;
        let lockedByUsername: string | null = null;

        if (!forceReadOnly) {
          const lockRes = await fetch(`/api/flowcharts/${id}/lock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "acquire" }),
          });
          const lockData = (await lockRes.json()) as {
            ok?: boolean;
            lock?: { username: string };
          };
          if (lockRes.status === 409 || lockData.ok === false) {
            lockedByUsername = lockData.lock?.username || "another user";
            const view = window.confirm(
              `${lockedByUsername} is already editing this flowchart.\n\nOK = view read-only\nCancel = go back`,
            );
            if (!view) {
              window.location.href = "/";
              return;
            }
            readOnly = true;
          }
        } else if (data.lock) {
          lockedByUsername = data.lock.username;
        }

        if (!cancelled) {
          setState({
            status: "ready",
            name: data.flowchart.name,
            document: data.document,
            readOnly,
            lockedByUsername,
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            status: "error",
            message: "Failed to load flowchart",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [forceReadOnly, id]);

  if (state.status === "loading") {
    return (
      <div className="flex h-dvh items-center justify-center text-sm text-slate-500">
        Opening flowchart…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 text-sm">
        <p className="text-red-600">{state.message}</p>
        <Link href="/" className="text-slate-700 underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <Editor
      flowchartId={id}
      initialName={state.name}
      initialDocument={state.document}
      readOnly={state.readOnly}
      lockedByUsername={state.lockedByUsername}
    />
  );
}
