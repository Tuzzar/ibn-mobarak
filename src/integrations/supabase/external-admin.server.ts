// Server-only admin client (service role — bypasses RLS) for the shop's own
// Supabase project. NEVER import this from client-side code.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const DEFAULT_EXTERNAL_URL = "https://vdbkannwrsekvrdwijrx.supabase.co";


function createExternalAdminClient() {
  const url = process.env.EXTERNAL_SUPABASE_URL || DEFAULT_EXTERNAL_URL;
  const key = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;
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
