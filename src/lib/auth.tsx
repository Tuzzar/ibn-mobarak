import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/external";

export type StaffRole = "administrator" | "admin" | "moderator";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  role: StaffRole | null;
  isAdmin: boolean; // any active staff (back-compat)
  isAdministrator: boolean;
  isModerator: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const ROLE_RANK: Record<StaffRole, number> = { administrator: 3, admin: 2, moderator: 1 };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRole = async (uid: string) => {
      const { data } = await supabase
        .from("user_roles")
        .select("role, status")
        .eq("user_id", uid)
        .eq("status", "active");
      const roles = (data ?? [])
        .map((r) => r.role as StaffRole)
        .filter((r) => r === "administrator" || r === "admin" || r === "moderator");
      const top = roles.sort((a, b) => ROLE_RANK[b] - ROLE_RANK[a])[0] ?? null;
      setRole(top);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) setTimeout(() => loadRole(s.user.id), 0);
      else setRole(null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadRole(session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      role,
      isAdmin: role !== null,
      isAdministrator: role === "administrator",
      isModerator: role === "moderator",
      loading,
      signIn,
      signOut,
    }),
    [user, session, role, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
