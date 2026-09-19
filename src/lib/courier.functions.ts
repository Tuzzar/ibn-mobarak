// Courier fraud-check server functions. Thin wrappers only — all runtime
// helpers live in ./courier.server.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireExternalSupabaseAuth } from "@/integrations/supabase/external-auth-middleware";

const phoneInput = z.object({
  phone: z.string().trim().min(6).max(20),
  force: z.boolean().optional(),
});

const settingsInput = z.object({
  bdcourier_api_key: z.string().trim().max(300).optional(),
  steadfast_api_key: z.string().trim().max(300).optional(),
  steadfast_secret_key: z.string().trim().max(300).optional(),
});

export const getCourierHistory = createServerFn({ method: "POST" })
  .middleware([requireExternalSupabaseAuth])
  .validator((input) => phoneInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertStaff, runCourierCheck } = await import("./courier-runner.server");
    await assertStaff(context);
    return runCourierCheck(data.phone, data.force ?? false);
  });

export const getCourierSettings = createServerFn({ method: "GET" })
  .middleware([requireExternalSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertStaff, readCourierSettingsMasked } = await import("./courier-runner.server");
    await assertStaff(context);
    return readCourierSettingsMasked();
  });

export const saveCourierSettings = createServerFn({ method: "POST" })
  .middleware([requireExternalSupabaseAuth])
  .validator((input: unknown) => settingsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertStaff, writeCourierSettings } = await import("./courier-runner.server");
    await assertStaff(context);
    return writeCourierSettings(data);
  });

export const sendOrderToCourier = createServerFn({ method: "POST" })
  .middleware([requireExternalSupabaseAuth])
  .validator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertStaff, sendOrderToSteadfast } = await import("./courier-runner.server");
    await assertStaff(context);
    return sendOrderToSteadfast(data.orderId, {
      userId: context.userId,
      email: (context.claims as any)?.email ?? null,
    });
  });
