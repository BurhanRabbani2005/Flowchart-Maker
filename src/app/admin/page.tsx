"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { AppHeader, useAuthUser } from "@/components/AppHeader";

interface UserItem {
  id: string;
  username: string;
  role: "admin" | "user";
  disabled: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const { user } = useAuthUser();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/users");
    if (!res.ok) return;
    const data = (await res.json()) as { users: UserItem[] };
    setUsers(data.users);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not create user");
      return;
    }
    setUsername("");
    setPassword("");
    setRole("user");
    setMessage("User created");
    await load();
  }

  async function toggleDisabled(u: UserItem) {
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disabled: !u.disabled }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      window.alert(data.error || "Update failed");
      return;
    }
    await load();
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader title="Admin" user={user} />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h1 className="text-lg font-semibold text-slate-900">Create user</h1>
          <p className="mt-1 text-sm text-slate-500">
            Only admins can create accounts. There is no public signup.
          </p>
          <form onSubmit={onCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-1">
              <span className="mb-1 block text-slate-600">Username</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-teal-500"
              />
            </label>
            <label className="block text-sm sm:col-span-1">
              <span className="mb-1 block text-slate-600">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-teal-500"
              />
            </label>
            <label className="block text-sm sm:col-span-1">
              <span className="mb-1 block text-slate-600">Role</span>
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value === "admin" ? "admin" : "user")
                }
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-teal-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div className="flex items-end sm:col-span-1">
              <button
                type="submit"
                className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
              >
                Create
              </button>
            </div>
          </form>
          {error ? (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          ) : null}
          {message ? (
            <p className="mt-3 text-sm text-teal-700">{message}</p>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Users</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {u.username}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      ({u.role})
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {u.disabled ? "Disabled" : "Active"} · created{" "}
                    {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleDisabled(u)}
                  className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {u.disabled ? "Enable" : "Disable"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
