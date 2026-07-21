import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { jsonOk } from "@/lib/api";

export async function POST() {
  const response = jsonOk({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(0),
    maxAge: 0,
  });
  return response;
}
