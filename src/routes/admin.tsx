import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Package, ShoppingCart, LogOut, Menu, X, User, Shield, Image as ImageIcon, LayoutTemplate, ListTree, Images } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({
    meta: [
      { title: "Admin — Ibn Mobarak Art Gallery" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminLayout() {
  const { user, isAdmin, isAdministrator, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPublicAdminRoute =
    path === "/admin/login" ||
    path === "/admin/forgot-password" ||
    path === "/admin/reset-password";

  useEffect(() => {
    if (loading) return;
    if (isPublicAdminRoute) return;
    if (!user) navigate({ to: "/admin/login" });
  }, [user, loading, isPublicAdminRoute, navigate]);

  // close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  if (isPublicAdminRoute) return <Outlet />;

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-md">
          <h1 className="font-display text-3xl">Not authorized</h1>
          <p className="text-muted-foreground mt-3">Your account is not an admin. Ask the project owner to grant you the admin role.</p>
          <button onClick={signOut} className="mt-6 text-sm text-primary underline">Sign out</button>
        </div>
      </div>
    );
  }

  const links = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, adminOnly: false },
    { to: "/admin/products", label: "Products", icon: Package, exact: false, adminOnly: false },
    { to: "/admin/orders", label: "Orders", icon: ShoppingCart, exact: false, adminOnly: false },
    { to: "/admin/media", label: "Media Library", icon: Images, exact: false, adminOnly: false },
    { to: "/admin/site-content", label: "Site Content", icon: ImageIcon, exact: false, adminOnly: false },
    { to: "/admin/menu-categories", label: "Menu Categories", icon: ListTree, exact: false, adminOnly: false },
    { to: "/admin/landing", label: "Landing Pages", icon: LayoutTemplate, exact: false, adminOnly: false },
    { to: "/admin/admins", label: "Admin Management", icon: Shield, exact: false, adminOnly: true },
  ].filter((l) => !l.adminOnly || isAdministrator) as ReadonlyArray<{ to: string; label: string; icon: typeof LayoutDashboard; exact: boolean; adminOnly: boolean }>;

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex-1 px-3 space-y-1">
      {links.map((l) => {
        const active = l.exact ? path === l.to : path.startsWith(l.to);
        return (
          <Link
            key={l.to}
            to={l.to}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${active ? "bg-primary-foreground/15" : "hover:bg-primary-foreground/10"}`}
          >
            <l.icon className="w-4 h-4" /> {l.label}
          </Link>
        );
      })}
    </nav>
  );

  const currentLabel = links.find((l) => (l.exact ? path === l.to : path.startsWith(l.to)))?.label ?? "Admin";

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Mobile/tablet top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 h-14 bg-primary text-primary-foreground border-b border-primary-foreground/10">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="p-2 -ml-2 rounded-lg hover:bg-primary-foreground/10"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="font-display text-base truncate">{currentLabel}</div>
        <Link
          to="/admin/profile"
          aria-label="Profile"
          className="p-2 -mr-2 rounded-lg hover:bg-primary-foreground/10"
        >
          <User className="w-5 h-5" />
        </Link>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-primary text-primary-foreground flex flex-col animate-in slide-in-from-left">
            <div className="p-5 flex items-center justify-between">
              <span className="font-display text-lg">Ibn Mobarak Art Gallery Admin</span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="p-1.5 rounded-lg hover:bg-primary-foreground/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavLinks onClick={() => setMobileOpen(false)} />
            <div className="m-3 space-y-1">
              <Link
                to="/admin/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-primary-foreground/10"
              >
                <User className="w-4 h-4" /> Profile
              </Link>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-primary-foreground/10"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-primary text-primary-foreground flex-col sticky top-0 h-screen">
        <div className="p-6 font-display text-xl">Ibn Mobarak Art Gallery Admin</div>
        <NavLinks />
        <div className="m-3 space-y-1">
          <Link
            to="/admin/profile"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-primary-foreground/10"
          >
            <User className="w-4 h-4" /> Profile
          </Link>
          <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-primary-foreground/10">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
}
