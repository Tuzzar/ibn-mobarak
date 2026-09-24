import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Shield,
  ShieldCheck,
  ShieldHalf,
  UserPlus,
  Pause,
  Play,
  Trash2,
  Loader2,
  Crown,
  X,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  listAdmins,
  createAdmin,
  updateAdminRole,
  setAdminStatus,
  removeAdmin,
  setAdminPassword,
} from "@/lib/admin-management.functions";

export const Route = createFileRoute("/admin/admins")({
  component: AdminAdminsPage,
});

type Role = "administrator" | "admin" | "moderator";

const ROLE_META: Record<Role, { label: string; icon: typeof Shield; tone: string }> = {
  administrator: { label: "Administrator", icon: Crown, tone: "bg-gold/15 text-gold border-gold/30" },
  admin: { label: "Admin", icon: ShieldCheck, tone: "bg-primary/10 text-primary border-primary/20" },
  moderator: { label: "Moderator", icon: ShieldHalf, tone: "bg-accent/15 text-accent border-accent/20" },
};

function AdminAdminsPage() {
  const { user, isAdministrator, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const confirm = useConfirm();

  useEffect(() => {
    if (!loading && !isAdministrator) navigate({ to: "/admin" });
  }, [loading, isAdministrator, navigate]);

  const fetchList = listAdmins;
  const createFn = createAdmin;
  const updateRoleFn = updateAdminRole;
  const statusFn = setAdminStatus;
  const removeFn = removeAdmin;
  const passwordFn = setAdminPassword;

  const { data: admins, isLoading } = useQuery({
    queryKey: ["admin-list"],
    queryFn: () => fetchList(),
    enabled: isAdministrator,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [pwTarget, setPwTarget] = useState<{ role_id: string; email: string | null } | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-list"] });

  if (loading || !isAdministrator) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold">Security</p>
          <h1 className="font-display text-3xl md:text-4xl mt-2">Admin Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Issue staff credentials, change roles, and suspend accounts.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition"
        >
          <UserPlus className="w-4 h-4" /> New staff
        </button>
      </div>

      <div className="mt-8 bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
        {isLoading ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (admins ?? []).length === 0 ? (
          <div className="p-10 text-sm text-center text-muted-foreground">No staff accounts yet.</div>
        ) : (
          (admins ?? []).map((row) => {
            const role = row.role as Role;
            const meta = ROLE_META[role] ?? ROLE_META.admin;
            const Icon = meta.icon;
            const isSelf = row.user_id === user?.id;
            const suspended = row.status === "suspended";
            return (
              <div key={row.id} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${meta.tone}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{row.email ?? row.user_id.slice(0, 8)}</span>
                    {isSelf && (
                      <span className="text-[10px] uppercase tracking-widest bg-secondary px-2 py-0.5 rounded-full">You</span>
                    )}
                    {suspended && (
                      <span className="text-[10px] uppercase tracking-widest bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                        Suspended
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">
                    {meta.label} · since {new Date(row.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={row.role}
                    disabled={isSelf}
                    onChange={async (e) => {
                      try {
                        await updateRoleFn({ data: { role_id: row.id, role: e.target.value as Role } });
                        toast.success("Role updated");
                        refresh();
                      } catch (err: any) {
                        toast.error(err?.message ?? "Failed");
                      }
                    }}
                    className="text-xs bg-background border border-border rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                  >
                    <option value="administrator">Administrator</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                  </select>

                  <button
                    onClick={() => setPwTarget({ role_id: row.id, email: row.email })}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-secondary transition"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Set password
                  </button>

                  <button
                    disabled={isSelf}
                    onClick={async () => {
                      try {
                        await statusFn({ data: { role_id: row.id, status: suspended ? "active" : "suspended" } });
                        toast.success(suspended ? "Reactivated" : "Suspended");
                        refresh();
                      } catch (err: any) {
                        toast.error(err?.message ?? "Failed");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-secondary transition disabled:opacity-50"
                  >
                    {suspended ? <><Play className="w-3.5 h-3.5" /> Reactivate</> : <><Pause className="w-3.5 h-3.5" /> Suspend</>}
                  </button>


                  <button
                    disabled={isSelf}
                    onClick={async () => {
                      const ok = await confirm({
                        title: `Remove ${meta.label} Access?`,
                        description: `Are you sure you want to remove ${meta.label.toLowerCase()} access for ${row.email ?? "this user"}? They will lose access immediately.`,
                        confirmText: "Remove Access",
                        variant: "destructive",
                        icon: "trash",
                      });
                      if (!ok) return;
                      try {
                        await removeFn({ data: { role_id: row.id } });
                        toast.success("Removed");
                        refresh();
                      } catch (err: any) {
                        toast.error(err?.message ?? "Failed");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-destructive/30 text-destructive hover:bg-destructive/10 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={async (payload) => {
            await createFn({ data: payload });
            toast.success("Staff account created");
            refresh();
            setShowCreate(false);
          }}
        />
      )}

      {pwTarget && (
        <PasswordModal
          email={pwTarget.email}
          onClose={() => setPwTarget(null)}
          onSubmit={async (password) => {
            await passwordFn({ data: { role_id: pwTarget.role_id, password } });
            toast.success("Password updated");
            setPwTarget(null);
          }}
        />
      )}
    </div>
  );
}

function PasswordModal({
  email,
  onClose,
  onSubmit,
}: {
  email: string | null;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
}) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h2 className="font-display text-xl">Set new password</h2>
            <p className="text-xs text-muted-foreground mt-1 truncate">{email ?? "Staff account"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <form
          className="mt-5 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (pw.length < 8) return toast.error("Password must be at least 8 characters");
            if (pw !== pw2) return toast.error("Passwords don't match");
            setBusy(true);
            try {
              await onSubmit(pw);
            } catch (err: any) {
              toast.error(err?.message ?? "Failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">New password</label>
            <div className="relative mt-1">
              <input
                type={show ? "text" : "password"}
                required
                minLength={8}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-muted-foreground hover:text-foreground"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Confirm password</label>
            <input
              type={show ? "text" : "password"}
              required
              minLength={8}
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-primary text-primary-foreground py-3 rounded-full text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
          >
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (p: { email: string; password: string; role: Role }) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("admin");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl">New staff account</h2>
            <p className="text-xs text-muted-foreground mt-1">An administrator must issue every staff login.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <form
          className="mt-5 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (password.length < 8) return toast.error("Password must be at least 8 characters");
            setBusy(true);
            try {
              await onCreate({ email: email.trim(), password, role });
            } catch (err: any) {
              toast.error(err?.message ?? "Failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Temporary password</label>
            <input
              type="text"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Role</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(Object.keys(ROLE_META) as Role[]).map((r) => {
                const meta = ROLE_META[r];
                const Icon = meta.icon;
                const active = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs transition ${
                      active ? `${meta.tone} ring-2 ring-primary/30` : "border-border hover:bg-secondary"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-primary text-primary-foreground py-3 rounded-full text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
