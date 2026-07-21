"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  username: string;
  role: "admin" | "user";
}

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const data = (await res.json()) as { user: AuthUser };
        if (!cancelled) setUser(data.user);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
}

export function AppHeader({
  title,
  user,
}: {
  title?: string;
  user: AuthUser | null;
}) {
  const router = useRouter();

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }, [router]);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm font-semibold tracking-tight text-slate-900">
          FlowDraw
        </Link>
        {title ? (
          <span className="text-sm text-slate-500">{title}</span>
        ) : null}
      </div>
      <div className="flex items-center gap-3 text-sm">
        {user?.role === "admin" ? (
          <Link href="/admin" className="text-slate-600 hover:text-slate-900">
            Admin
          </Link>
        ) : null}
        {user ? (
          <span className="text-slate-500">{user.username}</span>
        ) : null}
        <button
          type="button"
          onClick={logout}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
