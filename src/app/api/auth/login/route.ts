import {
  createSessionToken,
  getUserByUsername,
  publicUser,
  sessionCookieOptions,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { ensureReady } from "@/lib/ready";

export async function POST(request: Request) {
  try {
    await ensureReady();
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";
    if (!username || !password) {
      return jsonError("Username and password are required", 400);
    }

    const user = getUserByUsername(username);
    if (!user || user.disabled) {
      return jsonError("Invalid username or password", 401);
    }
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return jsonError("Invalid username or password", 401);
    }

    const token = await createSessionToken({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    const response = jsonOk({ user: publicUser(user) });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (err) {
    return handleRouteError(err);
  }
}
