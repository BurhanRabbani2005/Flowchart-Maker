import { jwtVerify } from "jose";

export const SESSION_COOKIE = "flowdraw_session";

export type SessionRole = "admin" | "user";

export interface SessionPayload {
  sub: string;
  username: string;
  role: SessionRole;
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    return new TextEncoder().encode("invalid-session-secret!");
  }
  return new TextEncoder().encode(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.sub !== "string" ||
      typeof payload.username !== "string" ||
      (payload.role !== "admin" && payload.role !== "user")
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
