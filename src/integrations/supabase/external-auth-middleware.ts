// Auth middleware that validates bearer tokens issued by the shop's own
// Supabase project — the production database.
// Mirrors requireSupabaseAuth but points at the external project URL +
// publishable key so user JWTs verify against the correct issuer.
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import {
  EXTERNAL_SUPABASE_URL,
  EXTERNAL_SUPABASE_PUBLISHABLE_KEY,
} from "./external-config";



export const requireExternalSupabaseAuth = createMiddleware({
  type: "function",
}).server(async ({ next }) => {
  const request = getRequest();
  if (!request?.headers) {
    throw new Response("Unauthorized: No request headers available", {
      status: 401,
    });
  }
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Response("Unauthorized: Missing bearer token", { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");
  if (!token) throw new Response("Unauthorized: Empty token", { status: 401 });

  const url = EXTERNAL_SUPABASE_URL;
  const publishableKey = EXTERNAL_SUPABASE_PUBLISHABLE_KEY;

  const supabase = createClient<Database>(
    url,
    publishableKey,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    throw new Response("Unauthorized: Invalid token", { status: 401 });
  }

  return next({
    context: {
      supabase,
      userId: data.claims.sub,
      claims: data.claims,
    },
  });
});
