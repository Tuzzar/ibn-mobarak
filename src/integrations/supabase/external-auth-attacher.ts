// Attaches the external Supabase project's bearer token to outgoing serverFn
// RPCs so requireExternalSupabaseAuth can validate the user.
import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./external";

export const attachExternalSupabaseAuth = createMiddleware({
  type: "function",
}).client(async ({ next }) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return next({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
});
