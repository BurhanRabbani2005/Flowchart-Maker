import { requireSession } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { ensureReady } from "@/lib/ready";
import {
  deleteRevisions,
  getFlowchartMeta,
  listRevisions,
  readRevisionDocument,
  saveFlowchart,
} from "@/lib/storage";
import { getLock } from "@/lib/locks";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    await ensureReady();
    await requireSession();
    const { id } = await context.params;
    if (!getFlowchartMeta(id)) {
      return jsonError("Flowchart not found", 404);
    }
    return jsonOk({ revisions: listRevisions(id) });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(request: Request, context: Ctx) {
  try {
    await ensureReady();
    await requireSession();
    const { id } = await context.params;
    if (!getFlowchartMeta(id)) {
      return jsonError("Flowchart not found", 404);
    }

    const body = (await request.json()) as { revisionIds?: unknown };
    if (!Array.isArray(body.revisionIds) || body.revisionIds.length === 0) {
      return jsonError("revisionIds must be a non-empty array", 400);
    }
    const revisionIds = body.revisionIds.filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    );
    if (revisionIds.length === 0) {
      return jsonError("revisionIds must be a non-empty array", 400);
    }

    const deleted = deleteRevisions(id, revisionIds);
    return jsonOk({ deleted, revisions: listRevisions(id) });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request, context: Ctx) {
  try {
    await ensureReady();
    const session = await requireSession();
    const { id } = await context.params;
    if (!getFlowchartMeta(id)) {
      return jsonError("Flowchart not found", 404);
    }

    const body = (await request.json()) as { revisionId?: string };
    if (!body.revisionId) {
      return jsonError("revisionId is required", 400);
    }

    const lock = getLock(id);
    if (lock && !lock.isStale && lock.userId !== session.sub) {
      return jsonError(
        `${lock.username} is currently editing this flowchart`,
        409,
      );
    }

    const document = readRevisionDocument(id, body.revisionId);
    if (!document) {
      return jsonError("Revision not found", 404);
    }

    const result = saveFlowchart(id, document, session.sub);
    return jsonOk({
      document,
      flowchart: {
        id: result.meta.id,
        name: result.meta.name,
        updatedAt: result.meta.updated_at,
      },
      revisionId: result.revisionId,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
