import { getDb, type LockRow } from "@/lib/db";

const LOCK_TTL_MS = 2 * 60 * 1000;

export interface LockInfo {
  flowchartId: string;
  userId: string;
  username: string;
  heartbeatAt: string;
  isStale: boolean;
}

function isStale(heartbeatAt: string): boolean {
  return Date.now() - new Date(heartbeatAt).getTime() >= LOCK_TTL_MS;
}

export function getLock(flowchartId: string): LockInfo | null {
  const row = getDb()
    .prepare(
      `SELECT l.*, u.username
       FROM edit_locks l
       JOIN users u ON u.id = l.user_id
       WHERE l.flowchart_id = ?`,
    )
    .get(flowchartId) as (LockRow & { username: string }) | undefined;

  if (!row) return null;
  return {
    flowchartId: row.flowchart_id,
    userId: row.user_id,
    username: row.username,
    heartbeatAt: row.heartbeat_at,
    isStale: isStale(row.heartbeat_at),
  };
}

export type AcquireResult =
  | { ok: true; lock: LockInfo }
  | { ok: false; lock: LockInfo };

export function acquireLock(
  flowchartId: string,
  userId: string,
): AcquireResult {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = getLock(flowchartId);

  if (existing && !existing.isStale && existing.userId !== userId) {
    return { ok: false, lock: existing };
  }

  db.prepare(
    `INSERT INTO edit_locks (flowchart_id, user_id, heartbeat_at)
     VALUES (?, ?, ?)
     ON CONFLICT(flowchart_id) DO UPDATE SET
       user_id = excluded.user_id,
       heartbeat_at = excluded.heartbeat_at`,
  ).run(flowchartId, userId, now);

  return { ok: true, lock: getLock(flowchartId)! };
}

export function heartbeatLock(
  flowchartId: string,
  userId: string,
): AcquireResult {
  const existing = getLock(flowchartId);
  if (!existing || existing.isStale) {
    return acquireLock(flowchartId, userId);
  }
  if (existing.userId !== userId) {
    return { ok: false, lock: existing };
  }

  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE edit_locks SET heartbeat_at = ? WHERE flowchart_id = ? AND user_id = ?`,
    )
    .run(now, flowchartId, userId);

  return { ok: true, lock: getLock(flowchartId)! };
}

export function releaseLock(flowchartId: string, userId: string): boolean {
  const result = getDb()
    .prepare(
      `DELETE FROM edit_locks WHERE flowchart_id = ? AND user_id = ?`,
    )
    .run(flowchartId, userId);
  return result.changes > 0;
}

export { LOCK_TTL_MS };
