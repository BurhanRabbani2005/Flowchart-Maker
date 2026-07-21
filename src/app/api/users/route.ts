import {
  getUserByUsername,
  hashPassword,
  publicUser,
  requireAdmin,
} from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { getDb, type UserRow } from "@/lib/db";
import { ensureReady } from "@/lib/ready";

export async function GET() {
  try {
    await ensureReady();
    await requireAdmin();
    const users = getDb()
      .prepare("SELECT * FROM users ORDER BY created_at ASC")
      .all() as UserRow[];
    return jsonOk({ users: users.map(publicUser) });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    await ensureReady();
    await requireAdmin();
    const body = (await request.json()) as {
      username?: string;
      password?: string;
      role?: "admin" | "user";
    };
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";
    const role = body.role === "admin" ? "admin" : "user";

    if (!username || username.length < 2) {
      return jsonError("Username must be at least 2 characters", 400);
    }
    if (!password || password.length < 6) {
      return jsonError("Password must be at least 6 characters", 400);
    }
    if (getUserByUsername(username)) {
      return jsonError("Username already exists", 409);
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();
    getDb()
      .prepare(
        `INSERT INTO users (id, username, password_hash, role, disabled, created_at)
         VALUES (?, ?, ?, ?, 0, ?)`,
      )
      .run(id, username, passwordHash, role, now);

    const user = getDb()
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(id) as UserRow;
    return jsonOk({ user: publicUser(user) }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
