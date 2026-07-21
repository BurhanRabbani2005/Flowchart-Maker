import { requireAdmin } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { ensureReady } from "@/lib/ready";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  try {
    await ensureReady();
    const session = await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as { disabled?: boolean };

    if (id === session.sub && body.disabled === true) {
      return jsonError("You cannot disable your own account", 400);
    }

    if (typeof body.disabled !== "boolean") {
      return jsonError("disabled boolean is required", 400);
    }

    const result = getDb()
      .prepare("UPDATE users SET disabled = ? WHERE id = ?")
      .run(body.disabled ? 1 : 0, id);

    if (result.changes === 0) {
      return jsonError("User not found", 404);
    }

    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
