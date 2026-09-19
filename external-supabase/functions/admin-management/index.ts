// Edge Function: admin-management
// DEPLOY TO: External Supabase project (vdbkannwrsekvrdwijrx)
// NOT TO: Lovable Cloud (astfyatmeyrvftwmvbzb)
//
// Deploy with Supabase CLI:
//   cd external-supabase
//   supabase login
//   supabase link --project-ref vdbkannwrsekvrdwijrx
//   supabase functions deploy admin-management --no-verify-jwt
//
// We use --no-verify-jwt because we verify the JWT manually inside the
// function (with the service role client) to also load the user's role.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Role = "administrator" | "admin" | "moderator";
const ROLES: Role[] = ["administrator", "admin", "moderator"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

async function requireAdministrator(req: Request): Promise<string> {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Unauthorized: missing token");

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) throw new Error("Unauthorized: invalid token");
  const userId = userData.user.id;

  const { data: role, error: roleErr } = await admin
    .from("user_roles")
    .select("role, status")
    .eq("user_id", userId)
    .eq("role", "administrator")
    .eq("status", "active")
    .maybeSingle();
  if (roleErr) throw new Error(roleErr.message);
  if (!role) throw new Error("Administrator privileges required");

  return userId;
}

async function listAllUsers() {
  // small staff list — single page sufficient
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) throw new Error(error.message);
  return data?.users ?? [];
}

async function handle(req: Request) {
  const callerId = await requireAdministrator(req);
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "");

  if (action === "list") {
    const { data: roles, error } = await admin
      .from("user_roles")
      .select("id, user_id, role, status, created_at")
      .in("role", ROLES)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const users = await listAllUsers();
    const emailById = new Map(users.map((u) => [u.id, u.email ?? null]));
    return json(
      (roles ?? []).map((r) => ({ ...r, email: emailById.get(r.user_id) ?? null })),
    );
  }

  if (action === "create") {
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const role = String(body?.role ?? "") as Role;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("Valid email required");
    if (password.length < 8 || password.length > 128)
      throw new Error("Password must be 8-128 chars");
    if (!ROLES.includes(role)) throw new Error("Invalid role");

    const users = await listAllUsers();
    let userId = users.find((u) => u.email?.toLowerCase() === email)?.id;
    if (!userId) {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (cErr) throw new Error(cErr.message);
      userId = created.user!.id;
    }
    const { error: rErr } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role, status: "active" });
    if (rErr && !/duplicate/i.test(rErr.message)) throw new Error(rErr.message);
    return json({ ok: true, user_id: userId });
  }

  if (action === "updateRole") {
    const role_id = String(body?.role_id ?? "");
    const role = String(body?.role ?? "") as Role;
    if (!role_id) throw new Error("role_id required");
    if (!ROLES.includes(role)) throw new Error("Invalid role");
    const { error } = await admin
      .from("user_roles")
      .update({ role })
      .eq("id", role_id);
    if (error) throw new Error(error.message);
    return json({ ok: true });
  }

  if (action === "setStatus") {
    const role_id = String(body?.role_id ?? "");
    const status = String(body?.status ?? "");
    if (!role_id) throw new Error("role_id required");
    if (status !== "active" && status !== "suspended")
      throw new Error("Invalid status");

    const { data: row } = await admin
      .from("user_roles")
      .select("user_id, role")
      .eq("id", role_id)
      .maybeSingle();
    if (row?.user_id === callerId && status === "suspended")
      throw new Error("You cannot suspend your own account");

    const { error } = await admin
      .from("user_roles")
      .update({ status })
      .eq("id", role_id);
    if (error) throw new Error(error.message);
    return json({ ok: true });
  }

  if (action === "remove") {
    const role_id = String(body?.role_id ?? "");
    if (!role_id) throw new Error("role_id required");

    const { data: row } = await admin
      .from("user_roles")
      .select("user_id, role")
      .eq("id", role_id)
      .maybeSingle();
    if (!row) throw new Error("Role not found");
    if (row.user_id === callerId) throw new Error("You cannot remove your own role");
    if (row.role === "administrator") {
      const { count } = await admin
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "administrator")
        .eq("status", "active");
      if ((count ?? 0) <= 1)
        throw new Error("Cannot remove the last active administrator");
    }
    const { error } = await admin.from("user_roles").delete().eq("id", role_id);
    if (error) throw new Error(error.message);
    return json({ ok: true });
  }

  if (action === "setPassword") {
    const role_id = String(body?.role_id ?? "");
    const password = String(body?.password ?? "");
    if (!role_id) throw new Error("role_id required");
    if (password.length < 8 || password.length > 128)
      throw new Error("Password must be 8-128 chars");

    const { data: row, error: rowErr } = await admin
      .from("user_roles")
      .select("user_id, role")
      .eq("id", role_id)
      .maybeSingle();
    if (rowErr) throw new Error(rowErr.message);
    if (!row) throw new Error("Role not found");
    if (!ROLES.includes(row.role as Role))
      throw new Error("Target is not a staff account");

    const { error } = await admin.auth.admin.updateUserById(row.user_id, {
      password,
    });
    if (error) throw new Error(error.message);
    return json({ ok: true });
  }

  throw new Error(`Unknown action: ${action}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    return await handle(req);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = /unauthor|privile/i.test(msg) ? 401 : 400;
    return json({ error: msg }, status);
  }
});
