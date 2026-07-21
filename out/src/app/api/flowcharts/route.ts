import { requireSession } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { ensureReady } from "@/lib/ready";
import { createFlowchart, listFlowcharts } from "@/lib/storage";

export async function GET() {
  try {
    await ensureReady();
    await requireSession();
    return jsonOk({ flowcharts: listFlowcharts() });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    await ensureReady();
    const session = await requireSession();
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    const name = body.name?.trim() || "Untitled flowchart";
    if (name.length > 120) {
      return jsonError("Name is too long", 400);
    }
    const meta = createFlowchart(name, session.sub);
    return jsonOk(
      {
        flowchart: {
          id: meta.id,
          name: meta.name,
          updatedAt: meta.updated_at,
          createdAt: meta.created_at,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
