import { requireSession } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { getFlowchartMeta } from "@/lib/storage";
import { acquireLock, heartbeatLock, releaseLock } from "@/lib/locks";
import { ensureReady } from "@/lib/ready";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  try {
    await ensureReady();
    const session = await requireSession();
    const { id } = await context.params;
    if (!getFlowchartMeta(id)) {
      return jsonError("Flowchart not found", 404);
    }

    const body = (await request.json().catch(() => ({}))) as {
      action?: "acquire" | "heartbeat" | "release";
    };
    const action = body.action ?? "acquire";

    if (action === "release") {
      releaseLock(id, session.sub);
      return jsonOk({ ok: true });
    }

    const result =
      action === "heartbeat"
        ? heartbeatLock(id, session.sub)
        : acquireLock(id, session.sub);

    if (!result.ok) {
      return jsonOk(
        {
          ok: false,
          lock: {
            userId: result.lock.userId,
            username: result.lock.username,
            heartbeatAt: result.lock.heartbeatAt,
          },
        },
        { status: 409 },
      );
    }

    return jsonOk({
      ok: true,
      lock: {
        userId: result.lock.userId,
        username: result.lock.username,
        heartbeatAt: result.lock.heartbeatAt,
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
