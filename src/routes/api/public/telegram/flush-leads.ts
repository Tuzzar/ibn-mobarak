import { createFileRoute } from "@tanstack/react-router";

// Called by pg_cron every couple of minutes: sends queued "incomplete order"
// alerts whose waiting period has expired and that were not converted.
export const Route = createFileRoute("/api/public/telegram/flush-leads")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const anonKey =
          process.env["EXTERNAL_SUPABASE_ANON_KEY"] ||
          process.env["VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY"] ||
          "";
        const provided = request.headers.get("apikey") ?? "";
        if (anonKey && provided !== anonKey) {
          return new Response("Unauthorized", { status: 401 });
        }

        try {
          const { flushPendingLeadAlerts } = await import("@/lib/telegram.server");
          const result = await flushPendingLeadAlerts();
          return Response.json({ ok: true, ...result });
        } catch (e) {
          const message = e instanceof Error ? e.message : "flush failed";
          console.error("flush-leads failed:", message);
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
