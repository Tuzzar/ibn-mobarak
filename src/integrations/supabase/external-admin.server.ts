// Server-only admin client (service role — bypasses RLS) for the shop's own
// Supabase project. NEVER import this from client-side code.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const DEFAULT_EXTERNAL_URL = "https://genfsqvjkpqeqrbikdnk.supabase.co";

function createExternalAdminClient() {
  const url =
    process.env.EXTERNAL_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    DEFAULT_EXTERNAL_URL;
  const key =
    process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbmZzcXZqa3BxZXFyYmlrZG5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTgwNDY5NiwiZXhwIjoyMTA1MzgwNjk2fQ.DqAHZgsZsdIeAuIgox-1-V7EsrMfCeZMVA9oA_10FxI";
  if (!key) {
    throw new Error("Missing EXTERNAL_SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient<Database>(url, key, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _client: ReturnType<typeof createExternalAdminClient> | undefined;

export const externalSupabaseAdmin = new Proxy(
  {} as ReturnType<typeof createExternalAdminClient>,
  {
    get(_, prop, receiver) {
      if (!_client) _client = createExternalAdminClient();
      return Reflect.get(_client, prop, receiver);
    },
  },
);
