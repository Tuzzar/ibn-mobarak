// Browser/SSR client for the shop's own Supabase project.
// All app data (products, orders, site content, auth) lives here.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export {
  EXTERNAL_SUPABASE_URL,
  EXTERNAL_SUPABASE_PUBLISHABLE_KEY,
} from "./external-config";
import {
  EXTERNAL_SUPABASE_URL,
  EXTERNAL_SUPABASE_PUBLISHABLE_KEY,
} from "./external-config";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createExternalFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request
        ? input.headers
        : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createExternalClient() {
  return createClient<Database>(
    EXTERNAL_SUPABASE_URL,
    EXTERNAL_SUPABASE_PUBLISHABLE_KEY,
    {
      global: { fetch: createExternalFetch(EXTERNAL_SUPABASE_PUBLISHABLE_KEY) },
      auth: {
        storage: typeof window !== "undefined" ? localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      },
    },
  );
}

let _client: ReturnType<typeof createExternalClient> | undefined;

export const supabase = new Proxy(
  {} as ReturnType<typeof createExternalClient>,
  {
    get(_, prop, receiver) {
      if (!_client) _client = createExternalClient();
      return Reflect.get(_client, prop, receiver);
    },
  },
);
