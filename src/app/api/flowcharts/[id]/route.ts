import { requireSession } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { parseFlowchartDocument } from "@/lib/flowchartFile";
import { ensureReady } from "@/lib/ready";
import {
  deleteFlowchart,
  getFlowchartMeta,
  readFlowchartDocument,
  renameFlowchart,
  saveFlowchart,
} from "@/lib/storage";
import { acquireLock, getLock } from "@/lib/locks";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    await ensureReady();
    await requireSession();
    const { id } = await context.params;
    const meta = getFlowchartMeta(id);
    if (!meta) return jsonError("Flowchart not found", 404);

    const document = readFlowchartDocument(id);
    const lock = getLock(id);
    return jsonOk({
      flowchart: {
        id: meta.id,
        name: meta.name,
        updatedAt: meta.updated_at,
        updatedBy: meta.updated_by,
        createdAt: meta.created_at,
      },
      document,
      lock:
        lock && !lock.isStale
          ? {
              userId: lock.userId,
              username: lock.username,
              heartbeatAt: lock.heartbeatAt,
            }
          : null,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(request: Request, context: Ctx) {
  try {
    await ensureReady();
    const session = await requireSession();
    const { id } = await context.params;
    const meta = getFlowchartMeta(id);
    if (!meta) return jsonError("Flowchart not found", 404);

    const lock = getLock(id);
    if (lock && !lock.isStale && lock.userId !== session.sub) {
      return jsonError(
        `${lock.username} is currently editing this flowchart`,
        409,
      );
    }

    const body = (await request.json()) as {
      document?: unknown;
      name?: string;
    };

    if (typeof body.name === "string") {
      renameFlowchart(id, body.name);
    }

    if (body.document === undefined) {
      return jsonError("document is required", 400);
    }

    const document = parseFlowchartDocument(JSON.stringify(body.document));
    const result = saveFlowchart(id, document, session.sub);
    acquireLock(id, session.sub);

    return jsonOk({
      flowchart: {
        id: result.meta.id,
        name: result.meta.name,
        updatedAt: result.meta.updated_at,
        updatedBy: result.meta.updated_by,
      },
      revisionId: result.revisionId,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    await ensureReady();
    await requireSession();
    const { id } = await context.params;
    if (!deleteFlowchart(id)) {
      return jsonError("Flowchart not found", 404);
    }
    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
