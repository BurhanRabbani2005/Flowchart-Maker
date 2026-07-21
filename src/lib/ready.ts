import { seedAdminIfNeeded } from "@/lib/auth";
import { getDb } from "@/lib/db";

let ready: Promise<void> | null = null;

/** Ensure DB schema exists and seed admin on first boot. */
export async function ensureReady(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      getDb();
      await seedAdminIfNeeded();
    })();
  }
  await ready;
}
