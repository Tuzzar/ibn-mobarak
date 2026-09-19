// Thin server-function wrappers for Telegram notification settings.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireExternalSupabaseAuth } from "@/integrations/supabase/external-auth-middleware";

const settingsInput = z.object({
  bot_token: z.string().trim().max(300).optional(),
  chat_id: z.string().trim().max(100).optional(),
  notify_orders: z.boolean().optional(),
  notify_leads: z.boolean().optional(),
  lead_delay_minutes: z.number().int().min(0).max(1440).optional(),
});


export const getTelegramSettings = createServerFn({ method: "GET" })
  .middleware([requireExternalSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertStaff } = await import("./courier-runner.server");
    await assertStaff(context);
    const { readTelegramSettingsMasked } = await import("./telegram.server");
    return readTelegramSettingsMasked();
  });

export const saveTelegramSettings = createServerFn({ method: "POST" })
  .middleware([requireExternalSupabaseAuth])
  .validator((input: unknown) => settingsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./courier-runner.server");
    await assertStaff(context);
    const { writeTelegramSettings } = await import("./telegram.server");
    return writeTelegramSettings(data);
  });

export const sendTelegramTest = createServerFn({ method: "POST" })
  .middleware([requireExternalSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertStaff } = await import("./courier-runner.server");
    await assertStaff(context);
    const { sendTelegram } = await import("./telegram.server");
    return sendTelegram("✅ <b>Ibn Mobarak Art Gallery</b> — Telegram notification test successful.");
  });
