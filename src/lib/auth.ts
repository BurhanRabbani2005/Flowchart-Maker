import { SignJWT } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import {
  SESSION_COOKIE,
  verifySessionToken,
  type SessionPayload,
  type SessionRole,
} from "@/lib/auth-edge";
import { getDb, type UserRow } from "@/lib/db";

export { SESSION_COOKIE, verifySessionToken };
export type { SessionPayload, SessionRole };

const SESSION_DAYS = 7;

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET must be set to a string of at least 16 characters",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({
    username: payload.username,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

export function sessionCookieOptions(maxAgeSeconds = SESSION_DAYS * 86400) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function getUserById(id: string): UserRow | undefined {
  return getDb()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(id) as UserRow | undefined;
}

export function getUserByUsername(username: string): UserRow | undefined {
  return getDb()
    .prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE")
    .get(username) as UserRow | undefined;
}

export function publicUser(user: UserRow) {
  return {
    id: user.id,
    username: user.username,
    role: user.role as SessionRole,
    disabled: Boolean(user.disabled),
    createdAt: user.created_at,
  };
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Unauthorized", 401);
  }
  const user = getUserById(session.sub);
  if (!user || user.disabled) {
    throw new AuthError("Unauthorized", 401);
  }
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "admin") {
    throw new AuthError("Forbidden", 403);
  }
  return session;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function seedAdminIfNeeded(): Promise<void> {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) AS c FROM users").get() as {
    c: number;
  };
  if (count.c > 0) return;

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD must be set to seed the initial admin user",
    );
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO users (id, username, password_hash, role, disabled, created_at)
     VALUES (?, ?, ?, 'admin', 0, ?)`,
  ).run(id, username, passwordHash, now);
}
