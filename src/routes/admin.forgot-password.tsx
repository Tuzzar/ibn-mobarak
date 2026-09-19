import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/external";

export const Route = createFileRoute("/admin/forgot-password")({
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Reset link sent. Check your email.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-10 shadow-[0_30px_80px_-20px_oklch(0.18_0.03_150_/_0.2)]">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>
        <h1 className="font-display text-3xl text-center mt-4">Forgot password</h1>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Enter your staff email and we'll send a reset link
        </p>

        {sent ? (
          <div className="mt-8 space-y-4">
            <div className="text-sm bg-secondary p-4 rounded-xl text-muted-foreground text-center">
              If <strong>{email}</strong> belongs to a staff account, a password reset link has been sent. Check your inbox (and spam folder).
            </div>
            <Link to="/admin/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              disabled={busy}
              type="submit"
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-medium disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send reset link"}
            </button>
            <Link
              to="/admin/login"
              className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground pt-2"
            >
              <ArrowLeft className="w-3 h-3" /> Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
