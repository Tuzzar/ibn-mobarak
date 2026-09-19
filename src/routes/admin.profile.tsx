import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, KeyRound, LogOut, Mail, Shield, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/external";

export const Route = createFileRoute("/admin/profile")({
  component: AdminProfile,
});

function AdminProfile() {
  const { user, role, signOut } = useAuth();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    if (pw !== pw2) return toast.error("Passwords don't match");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setPw("");
    setPw2("");
  };

  return (
    <div className="p-5 md:p-10 max-w-3xl mx-auto">
      <Link
        to="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <UserIcon className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl md:text-3xl">My Profile</h1>
          <p className="text-muted-foreground text-sm truncate">Manage your admin account</p>
        </div>
      </div>

      {/* Account info */}
      <section className="mt-8 bg-card border border-border rounded-2xl p-5 md:p-6">
        <h2 className="font-display text-lg">Account</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Email</div>
              <div className="truncate">{user?.email ?? "—"}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Role</div>
              <div className="inline-flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                {role === "administrator" ? "Administrator" : role === "moderator" ? "Moderator" : role === "admin" ? "Admin" : "User"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Change password */}
      <section className="mt-5 bg-card border border-border rounded-2xl p-5 md:p-6">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" />
          <h2 className="font-display text-lg">Change password</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Use at least 8 characters.</p>
        <form onSubmit={changePassword} className="mt-4 space-y-3">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">New password</label>
            <div className="relative mt-1">
              <input
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Confirm password</label>
            <div className="relative mt-1">
              <input
                type={showPw2 ? "text" : "password"}
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw2((v) => !v)}
                aria-label={showPw2 ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPw2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
          >
            {saving ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>

      {/* Sign out */}
      <section className="mt-5 bg-card border border-border rounded-2xl p-5 md:p-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg">Sign out</h2>
          <p className="text-xs text-muted-foreground mt-1">End your admin session on this device.</p>
        </div>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 border border-destructive/40 text-destructive px-4 py-2 rounded-full text-sm font-medium hover:bg-destructive/10 transition"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </section>
    </div>
  );
}
