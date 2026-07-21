"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader, useAuthUser } from "@/components/AppHeader";

interface FlowchartItem {
  id: string;
  name: string;
  updatedAt: string;
  updatedByUsername: string | null;
  lockedByUsername: string | null;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthUser();
  const [items, setItems] = useState<FlowchartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/flowcharts");
      if (!res.ok) {
        setError("Failed to load flowcharts");
        return;
      }
      const data = (await res.json()) as { flowcharts: FlowchartItem[] };
      setItems(data.flowcharts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createNew = useCallback(async () => {
    const name = window.prompt("Flowchart name", "Untitled flowchart");
    if (name === null) return;
    setCreating(true);
    try {
      const res = await fetch("/api/flowcharts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as {
        flowchart?: { id: string };
        error?: string;
      };
      if (!res.ok || !data.flowchart) {
        window.alert(data.error || "Could not create flowchart");
        return;
      }
      router.push(`/editor/${data.flowchart.id}`);
    } finally {
      setCreating(false);
    }
  }, [router]);

  const remove = useCallback(
    async (id: string, name: string) => {
      if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return;
      const res = await fetch(`/api/flowcharts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        window.alert(data.error || "Delete failed");
        return;
      }
      await load();
    },
    [load],
  );

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader user={user} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Flowcharts
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Files stored on this server. Changes are tracked on each save.
            </p>
          </div>
          <button
            type="button"
            onClick={createNew}
            disabled={creating || authLoading}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {creating ? "Creating…" : "New flowchart"}
          </button>
        </div>

        {error ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {loading ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              Loading…
            </p>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              No flowcharts yet. Create one to get started.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/editor/${item.id}`}
                      className="truncate text-sm font-medium text-slate-900 hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Updated {formatWhen(item.updatedAt)}
                      {item.updatedByUsername
                        ? ` by ${item.updatedByUsername}`
                        : ""}
                      {item.lockedByUsername
                        ? ` · In use by ${item.lockedByUsername}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/editor/${item.id}`}
                      className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(item.id, item.name)}
                      className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
