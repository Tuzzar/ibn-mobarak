// Server functions for staff/admin management.
// All functions require the caller to be an active `administrator`.
// Uses the service-role admin client (loaded lazily inside handlers) to
// access auth.admin APIs and manage user_roles rows.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Role = "administrator" | "admin" | "moderator";
const ROLES: Role[] = ["administrator", "admin", "moderator"];

export type AdminRow = {
  id: string;
  user_id: string;
  role: Role;
  status: "active" | "suspended";
  created_at: string;
  email: string | null;
};

async function assertAdministrator(context: {
  supabase: Awaited<ReturnType<typeof import("@supabase/supabase-js").createClient>>;
  userId: string;
}) {
  const { data, error } = await (context.supabase as any).rpc("has_role", {
    _user_id: context.userId,
    _role: "administrator",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Administrator privileges required");
}

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdministrator(context as any);
    const { externalSupabaseAdmin: supabaseAdmin } = await import(
      "@/integrations/supabase/external-admin.server"
    );

    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("id, user_id, role, status, created_at")
      .in("role", ROLES)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const { data: usersData, error: uErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (uErr) throw new Error(uErr.message);
    const emailById = new Map((usersData?.users ?? []).map((u) => [u.id, u.email ?? null]));

    return (roles ?? []).map((r) => ({
      ...r,
      email: emailById.get(r.user_id) ?? null,
    })) as AdminRow[];
  });

export const createAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { email: string; password: string; role: Role }) => {
    const email = String(data?.email ?? "").trim().toLowerCase();
    const password = String(data?.password ?? "");
    const role = data?.role;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Valid email required");
    if (password.length < 8 || password.length > 128)
      throw new Error("Password must be 8-128 chars");
    if (!ROLES.includes(role)) throw new Error("Invalid role");
    return { email, password, role };
  })
  .handler(async ({ data, context }) => {
    await assertAdministrator(context as any);
    const { externalSupabaseAdmin: supabaseAdmin } = await import(
      "@/integrations/supabase/external-admin.server"
    );

    const { data: usersData, error: lErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (lErr) throw new Error(lErr.message);
    let userId = usersData?.users.find((u) => u.email?.toLowerCase() === data.email)?.id;
    if (!userId) {
      const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      });
      if (cErr) throw new Error(cErr.message);
      userId = created.user!.id;
    } else {
      // user exists — update password so the caller's chosen pw works
      const { error: uErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: data.password,
      });
      if (uErr) throw new Error(uErr.message);
    }

    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: userId, role: data.role, status: "active" },
        { onConflict: "user_id,role" },
      );
    if (rErr) throw new Error(rErr.message);
    return { ok: true as const, user_id: userId };
  });

export const updateAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { role_id: string; role: Role }) => {
    if (!data?.role_id) throw new Error("role_id required");
    if (!ROLES.includes(data.role)) throw new Error("Invalid role");
    return data;
  })
  .handler(async ({ data, context }) => {
    await assertAdministrator(context as any);
    const { externalSupabaseAdmin: supabaseAdmin } = await import(
      "@/integrations/supabase/external-admin.server"
    );
    const { error } = await supabaseAdmin
      .from("user_roles")
      .update({ role: data.role })
      .eq("id", data.role_id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setAdminStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { role_id: string; status: "active" | "suspended" }) => {
    if (!data?.role_id) throw new Error("role_id required");
    if (data.status !== "active" && data.status !== "suspended")
      throw new Error("Invalid status");
    return data;
  })
  .handler(async ({ data, context }) => {
    await assertAdministrator(context as any);
    const { externalSupabaseAdmin: supabaseAdmin } = await import(
      "@/integrations/supabase/external-admin.server"
    );
    const { data: row } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("id", data.role_id)
      .maybeSingle();
    if (row?.user_id === (context as any).userId && data.status === "suspended")
      throw new Error("You cannot suspend your own account");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .update({ status: data.status })
      .eq("id", data.role_id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const removeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { role_id: string }) => {
    if (!data?.role_id) throw new Error("role_id required");
    return data;
  })
  .handler(async ({ data, context }) => {
    await assertAdministrator(context as any);
    const { externalSupabaseAdmin: supabaseAdmin } = await import(
      "@/integrations/supabase/external-admin.server"
    );
    const { data: row } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .eq("id", data.role_id)
      .maybeSingle();
    if (!row) throw new Error("Role not found");
    if (row.user_id === (context as any).userId)
      throw new Error("You cannot remove your own role");
    if (row.role === "administrator") {
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "administrator")
        .eq("status", "active");
      if ((count ?? 0) <= 1) throw new Error("Cannot remove the last active administrator");
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("id", data.role_id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setAdminPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { role_id: string; password: string }) => {
    if (!data?.role_id) throw new Error("role_id required");
    if (!data?.password || data.password.length < 8 || data.password.length > 128)
      throw new Error("Password must be 8-128 chars");
    return data;
  })
  .handler(async ({ data, context }) => {
    await assertAdministrator(context as any);
    const { externalSupabaseAdmin: supabaseAdmin } = await import(
      "@/integrations/supabase/external-admin.server"
    );
    const { data: row, error: rErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .eq("id", data.role_id)
      .maybeSingle();
    if (rErr) throw new Error(rErr.message);
    if (!row) throw new Error("Role not found");
    if (!ROLES.includes(row.role as Role))
      throw new Error("Target is not a staff account");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(row.user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });