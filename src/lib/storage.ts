import fs from "node:fs";
import path from "node:path";
import {
  flowchartPath,
  getDataDir,
  getDb,
  revisionPath,
  type FlowchartMetaRow,
  type RevisionRow,
} from "@/lib/db";
import type { FlowchartDocument } from "@/lib/flowchartFile";
import { parseFlowchartDocument, serializeFlowchart } from "@/lib/flowchartFile";
import { emptyDocument } from "@/lib/emptyDocument";

export interface FlowchartListItem {
  id: string;
  name: string;
  updatedAt: string;
  updatedBy: string | null;
  updatedByUsername: string | null;
  createdAt: string;
  lockedByUsername: string | null;
  lockedAt: string | null;
}

const LOCK_TTL_MS = 2 * 60 * 1000;

export function listFlowcharts(): FlowchartListItem[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT f.*,
              u.username AS updated_by_username,
              lu.username AS lock_username,
              l.heartbeat_at AS lock_heartbeat
       FROM flowcharts f
       LEFT JOIN users u ON u.id = f.updated_by
       LEFT JOIN edit_locks l ON l.flowchart_id = f.id
       LEFT JOIN users lu ON lu.id = l.user_id
       ORDER BY f.updated_at DESC`,
    )
    .all() as Array<
    FlowchartMetaRow & {
      updated_by_username: string | null;
      lock_username: string | null;
      lock_heartbeat: string | null;
    }
  >;

  const now = Date.now();
  return rows.map((row) => {
    const lockFresh =
      row.lock_heartbeat &&
      now - new Date(row.lock_heartbeat).getTime() < LOCK_TTL_MS;
    return {
      id: row.id,
      name: row.name,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      updatedByUsername: row.updated_by_username,
      createdAt: row.created_at,
      lockedByUsername: lockFresh ? row.lock_username : null,
      lockedAt: lockFresh ? row.lock_heartbeat : null,
    };
  });
}

export function getFlowchartMeta(id: string): FlowchartMetaRow | undefined {
  return getDb()
    .prepare("SELECT * FROM flowcharts WHERE id = ?")
    .get(id) as FlowchartMetaRow | undefined;
}

export function readFlowchartDocument(id: string): FlowchartDocument {
  const file = flowchartPath(id);
  if (!fs.existsSync(file)) {
    return emptyDocument();
  }
  const text = fs.readFileSync(file, "utf8");
  return parseFlowchartDocument(text);
}

export function createFlowchart(name: string, userId: string): FlowchartMetaRow {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const doc = emptyDocument();
  fs.writeFileSync(flowchartPath(id), serializeFlowchart(doc.shapes, doc.connections));

  db.prepare(
    `INSERT INTO flowcharts (id, name, updated_at, updated_by, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, name.trim() || "Untitled", now, userId, now, userId);

  return getFlowchartMeta(id)!;
}

export function renameFlowchart(id: string, name: string): FlowchartMetaRow | null {
  const db = getDb();
  const result = db
    .prepare("UPDATE flowcharts SET name = ? WHERE id = ?")
    .run(name.trim() || "Untitled", id);
  if (result.changes === 0) return null;
  return getFlowchartMeta(id)!;
}

export function saveFlowchart(
  id: string,
  document: FlowchartDocument,
  userId: string,
): { meta: FlowchartMetaRow; revisionId: string } {
  const db = getDb();
  const meta = getFlowchartMeta(id);
  if (!meta) {
    throw new Error("Flowchart not found");
  }

  const now = new Date().toISOString();
  const json = serializeFlowchart(document.shapes, document.connections);
  fs.writeFileSync(flowchartPath(id), json);

  const revisionId = crypto.randomUUID();
  fs.writeFileSync(revisionPath(id, revisionId), json);

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE flowcharts SET updated_at = ?, updated_by = ? WHERE id = ?`,
    ).run(now, userId, id);
    db.prepare(
      `INSERT INTO revisions (id, flowchart_id, saved_by, saved_at)
       VALUES (?, ?, ?, ?)`,
    ).run(revisionId, id, userId, now);
  });
  tx();

  return { meta: getFlowchartMeta(id)!, revisionId };
}

export function deleteFlowchart(id: string): boolean {
  const db = getDb();
  const meta = getFlowchartMeta(id);
  if (!meta) return false;

  const tx = db.transaction(() => {
    db.prepare("DELETE FROM revisions WHERE flowchart_id = ?").run(id);
    db.prepare("DELETE FROM edit_locks WHERE flowchart_id = ?").run(id);
    db.prepare("DELETE FROM flowcharts WHERE id = ?").run(id);
  });
  tx();

  const file = flowchartPath(id);
  if (fs.existsSync(file)) fs.unlinkSync(file);

  const revisionsDir = path.join(getDataDir(), "revisions", id);
  if (fs.existsSync(revisionsDir)) {
    fs.rmSync(revisionsDir, { recursive: true, force: true });
  }

  return true;
}

export function listRevisions(flowchartId: string): Array<{
  id: string;
  savedAt: string;
  savedBy: string;
  savedByUsername: string | null;
}> {
  const rows = getDb()
    .prepare(
      `SELECT r.*, u.username AS saved_by_username
       FROM revisions r
       LEFT JOIN users u ON u.id = r.saved_by
       WHERE r.flowchart_id = ?
       ORDER BY r.saved_at DESC
       LIMIT 100`,
    )
    .all(flowchartId) as Array<
    RevisionRow & { saved_by_username: string | null }
  >;

  return rows.map((row) => ({
    id: row.id,
    savedAt: row.saved_at,
    savedBy: row.saved_by,
    savedByUsername: row.saved_by_username,
  }));
}

export function readRevisionDocument(
  flowchartId: string,
  revisionId: string,
): FlowchartDocument | null {
  const file = revisionPath(flowchartId, revisionId);
  if (!fs.existsSync(file)) return null;
  return parseFlowchartDocument(fs.readFileSync(file, "utf8"));
}

/** Delete revision snapshots by id. Returns how many were removed. */
export function deleteRevisions(
  flowchartId: string,
  revisionIds: string[],
): number {
  const uniqueIds = [...new Set(revisionIds.filter(Boolean))];
  if (uniqueIds.length === 0) return 0;

  const db = getDb();
  const del = db.prepare(
    `DELETE FROM revisions WHERE flowchart_id = ? AND id = ?`,
  );
  const tx = db.transaction(() => {
    let removed = 0;
    for (const revisionId of uniqueIds) {
      const result = del.run(flowchartId, revisionId);
      if (result.changes > 0) {
        removed += 1;
        const file = revisionPath(flowchartId, revisionId);
        if (fs.existsSync(file)) fs.unlinkSync(file);
      }
    }
    return removed;
  });
  return tx();
}
