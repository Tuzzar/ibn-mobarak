import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type OrderLock = {
  orderId: string;
  userId: string;
  userName: string;
  userEmail: string;
  lockedAt: string;
  lastHeartbeat: string;
};

const LOCK_SETTINGS_KEY = "order_locks_v1";
const LOCK_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

async function getSupabaseAdmin() {
  const { externalSupabaseAdmin } = await import(
    "@/integrations/supabase/external-admin.server"
  );
  return externalSupabaseAdmin;
}

async function loadActiveLocks(admin: any): Promise<{
  locks: Record<string, OrderLock>;
  dirty: boolean;
}> {
  try {
    const { data } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", LOCK_SETTINGS_KEY)
      .maybeSingle();

    if (!data?.value) return { locks: {}, dirty: false };

    const parsed: Record<string, OrderLock> = JSON.parse(data.value);
    const now = Date.now();
    const active: Record<string, OrderLock> = {};
    let dirty = false;

    for (const [orderId, lock] of Object.entries(parsed)) {
      const hbTime = new Date(lock.lastHeartbeat).getTime();
      if (now - hbTime <= LOCK_TIMEOUT_MS) {
        active[orderId] = lock;
      } else {
        dirty = true; // Expired lock pruned
      }
    }

    return { locks: active, dirty };
  } catch (err) {
    console.error("Failed to load active order locks:", err);
    return { locks: {}, dirty: false };
  }
}

async function saveLocks(admin: any, locks: Record<string, OrderLock>) {
  const value = JSON.stringify(locks);
  await admin.from("app_settings").upsert(
    {
      key: LOCK_SETTINGS_KEY,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
}

export const getAdminOrderLocks = createServerFn({ method: "GET" })
  .handler(async () => {
    const admin = await getSupabaseAdmin();
    const { locks, dirty } = await loadActiveLocks(admin);
    if (dirty) {
      // Persist pruned state
      await saveLocks(admin, locks).catch((e) => console.warn("Failed to prune locks:", e));
    }
    return locks;
  });

const acquireSchema = z.object({
  orderId: z.string().min(1),
  user: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    email: z.string().optional().default(""),
  }),
});

export const acquireOrderLock = createServerFn({ method: "POST" })
  .validator((input: unknown) => acquireSchema.parse(input))
  .handler(async ({ data }) => {
    const admin = await getSupabaseAdmin();
    const { locks } = await loadActiveLocks(admin);
    const nowIso = new Date().toISOString();

    const existing = locks[data.orderId];
    if (existing && existing.userId !== data.user.id) {
      // Held by another admin and not expired!
      return { acquired: false, lock: existing };
    }

    // Grant or refresh lock for this admin
    const newLock: OrderLock = {
      orderId: data.orderId,
      userId: data.user.id,
      userName: data.user.name,
      userEmail: data.user.email,
      lockedAt: existing?.lockedAt || nowIso,
      lastHeartbeat: nowIso,
    };

    locks[data.orderId] = newLock;
    await saveLocks(admin, locks);

    return { acquired: true, lock: newLock };
  });

const refreshSchema = z.object({
  orderId: z.string().min(1),
  userId: z.string().min(1),
});

export const refreshOrderLock = createServerFn({ method: "POST" })
  .validator((input: unknown) => refreshSchema.parse(input))
  .handler(async ({ data }) => {
    const admin = await getSupabaseAdmin();
    const { locks } = await loadActiveLocks(admin);

    const existing = locks[data.orderId];
    if (!existing || existing.userId !== data.user.id) {
      return { refreshed: false };
    }

    existing.lastHeartbeat = new Date().toISOString();
    locks[data.orderId] = existing;
    await saveLocks(admin, locks);

    return { refreshed: true };
  });

const releaseSchema = z.object({
  orderId: z.string().min(1),
  userId: z.string().optional(),
});

export const releaseOrderLock = createServerFn({ method: "POST" })
  .validator((input: unknown) => releaseSchema.parse(input))
  .handler(async ({ data }) => {
    const admin = await getSupabaseAdmin();
    const { locks } = await loadActiveLocks(admin);

    const existing = locks[data.orderId];
    if (existing) {
      if (!data.userId || existing.userId === data.userId) {
        delete locks[data.orderId];
        await saveLocks(admin, locks);
      }
    }

    return { released: true };
  });
