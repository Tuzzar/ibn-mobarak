import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const { user, isAdmin, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) navigate({ to: "/admin" });
  }, [user, isAdmin, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) toast.error(error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-10 shadow-[0_30px_80px_-20px_oklch(0.18_0.03_150_/_0.2)]">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>
        <h1 className="font-display text-3xl text-center mt-4">Admin Access</h1>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Sign in with your staff credentials
        </p>

        <form onSubmit={handleSignIn} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button disabled={busy} type="submit" className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-medium disabled:opacity-50">
            {busy ? "Please wait…" : "Sign in"}
          </button>
          <div className="text-center">
            <Link to="/admin/forgot-password" className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          </div>
        </form>

        <p className="mt-6 text-[11px] uppercase tracking-widest text-muted-foreground text-center">
          Staff accounts are issued by an administrator
        </p>

        {user && !isAdmin && (
          <div className="mt-6 text-xs bg-secondary p-4 rounded-xl text-muted-foreground">
            Signed in as <strong>{user.email}</strong>, but this account has no staff role. Contact an administrator.
          </div>
        )}
      </div>
    </div>
  );
}
