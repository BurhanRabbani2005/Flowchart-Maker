import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type UserRole = "admin" | "user";

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  disabled: number;
  created_at: string;
}

export interface FlowchartMetaRow {
  id: string;
  name: string;
  updated_at: string;
  updated_by: string | null;
  created_at: string;
  created_by: string | null;
}

export interface LockRow {
  flowchart_id: string;
  user_id: string;
  heartbeat_at: string;
}

export interface RevisionRow {
  id: string;
  flowchart_id: string;
  saved_by: string;
  saved_at: string;
}

const globalForDb = globalThis as unknown as {
  __flowdrawDb?: Database.Database;
};

export function getDataDir(): string {
  return process.env.DATA_DIR || path.join(process.cwd(), "data");
}

function ensureDirs() {
  const dataDir = getDataDir();
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(path.join(dataDir, "flowcharts"), { recursive: true });
  fs.mkdirSync(path.join(dataDir, "revisions"), { recursive: true });
}

export function getDb(): Database.Database {
  if (globalForDb.__flowdrawDb) return globalForDb.__flowdrawDb;

  ensureDirs();
  const dbPath = path.join(getDataDir(), "app.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
      disabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS flowcharts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT,
      created_at TEXT NOT NULL,
      created_by TEXT,
      FOREIGN KEY (updated_by) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS edit_locks (
      flowchart_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      heartbeat_at TEXT NOT NULL,
      FOREIGN KEY (flowchart_id) REFERENCES flowcharts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS revisions (
      id TEXT PRIMARY KEY,
      flowchart_id TEXT NOT NULL,
      saved_by TEXT NOT NULL,
      saved_at TEXT NOT NULL,
      FOREIGN KEY (flowchart_id) REFERENCES flowcharts(id) ON DELETE CASCADE,
      FOREIGN KEY (saved_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_revisions_flowchart
      ON revisions(flowchart_id, saved_at DESC);
  `);

  globalForDb.__flowdrawDb = db;
  return db;
}

export function flowchartPath(id: string): string {
  return path.join(getDataDir(), "flowcharts", `${id}.json`);
}

export function revisionPath(flowchartId: string, revisionId: string): string {
  const dir = path.join(getDataDir(), "revisions", flowchartId);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${revisionId}.json`);
}
