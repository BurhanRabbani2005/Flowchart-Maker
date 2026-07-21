import { getUserById, publicUser, requireSession } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { ensureReady } from "@/lib/ready";

export async function GET() {
  try {
    await ensureReady();
    const session = await requireSession();
    const user = getUserById(session.sub);
    if (!user || user.disabled) {
      return jsonError("Unauthorized", 401);
    }
    return jsonOk({ user: publicUser(user) });
  } catch (err) {
    return handleRouteError(err);
  }
}
