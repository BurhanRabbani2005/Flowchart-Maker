import { requireSession } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { ensureReady } from "@/lib/ready";
import { getFlowchartMeta, readRevisionDocument } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string; revisionId: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    await ensureReady();
    await requireSession();
    const { id, revisionId } = await context.params;
    if (!getFlowchartMeta(id)) {
      return jsonError("Flowchart not found", 404);
    }
    const document = readRevisionDocument(id, revisionId);
    if (!document) {
      return jsonError("Revision not found", 404);
    }
    return jsonOk({ document });
  } catch (err) {
    return handleRouteError(err);
  }
}
