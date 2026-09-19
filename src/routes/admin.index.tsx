import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/external";
import { formatBDT } from "@/lib/cart";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type OrderRow = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  customer_name: string;
  items: Array<{ id?: string; name?: string; quantity?: number; price?: number; image_url?: string | null }>;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  stock: number;
  image_url: string | null;
  price: number;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "oklch(0.78 0.14 80)",
  confirmed: "oklch(0.62 0.13 142)",
  delivered: "oklch(0.55 0.13 200)",
  cancelled: "oklch(0.65 0.18 25)",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function AdminDashboard() {
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const [productsRes, ordersRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, slug, stock, image_url, price"),
        supabase
          .from("orders")
          .select("id, total, status, created_at, customer_name, items")
          .gte("created_at", since)
          .order("created_at", { ascending: false }),
      ]);
      return {
        products: (productsRes.data ?? []) as ProductRow[],
        orders: (ordersRes.data ?? []) as OrderRow[],
      };
    },
  });

  const stats = useMemo(() => {
    const products = data?.products ?? [];
    const orders = data?.orders ?? [];
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const inRange = orders.filter(
      (o) => now - new Date(o.created_at).getTime() <= range * day
    );
    const prevRange = orders.filter((o) => {
      const t = now - new Date(o.created_at).getTime();
      return t > range * day && t <= 2 * range * day;
    });

    const revenue = inRange.reduce((s, o) => s + Number(o.total), 0);
    const prevRevenue = prevRange.reduce((s, o) => s + Number(o.total), 0);
    const revChange = prevRevenue ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

    const orderCount = inRange.length;
    const prevOrderCount = prevRange.length;
    const ordChange = prevOrderCount
      ? ((orderCount - prevOrderCount) / prevOrderCount) * 100
      : 0;

    const pending = orders.filter((o) => o.status === "pending").length;
    const lowStock = products.filter((p) => p.stock <= 5);

    // revenue trend buckets
    const buckets: { date: string; revenue: number }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now - i * day);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      buckets.push({ date: label, revenue: 0 });
      const dayStart = new Date(key).getTime();
      const dayEnd = dayStart + day;
      for (const o of orders) {
        const t = new Date(o.created_at).getTime();
        if (t >= dayStart && t < dayEnd) buckets[buckets.length - 1].revenue += Number(o.total);
      }
    }

    // status breakdown
    const statusMap: Record<string, number> = {};
    for (const o of orders) statusMap[o.status] = (statusMap[o.status] ?? 0) + 1;
    const statusData = Object.entries(statusMap).map(([k, v]) => ({
      name: STATUS_LABELS[k] ?? k,
      key: k,
      value: v,
    }));

    // top products
    const productMap = new Map<string, { name: string; image_url: string | null; qty: number; revenue: number; slug: string }>();
    const productsBySlug = new Map(products.map((p) => [p.slug, p]));
    const productsByName = new Map(products.map((p) => [p.name, p]));
    for (const o of inRange) {
      for (const item of o.items ?? []) {
        const key = item.id || item.name || "";
        if (!key) continue;
        const ref = productsBySlug.get(key) ?? productsByName.get(item.name ?? "");
        const existing = productMap.get(key) ?? {
          name: item.name ?? "Unknown",
          image_url: ref?.image_url ?? item.image_url ?? null,
          qty: 0,
          revenue: 0,
          slug: ref?.slug ?? "",
        };
        existing.qty += Number(item.quantity ?? 0);
        existing.revenue += Number(item.price ?? 0) * Number(item.quantity ?? 0);
        productMap.set(key, existing);
      }
    }
    const topProducts = [...productMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

    return {
      revenue,
      revChange,
      orderCount,
      ordChange,
      pending,
      productCount: products.length,
      lowStock,
      buckets,
      statusData,
      topProducts,
      recentOrders: orders.slice(0, 8),
      avgPerDay: revenue / range,
    };
  }, [data, range]);

  if (isLoading || !stats) {
    return (
      <div className="p-6 md:p-10">
        <div className="h-10 w-56 bg-muted/60 rounded animate-pulse" />
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-card border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const kpis = [
    {
      label: "Revenue",
      value: formatBDT(stats.revenue),
      change: stats.revChange,
      icon: TrendingUp,
      tint: "primary",
    },
    {
      label: "Orders",
      value: stats.orderCount,
      change: stats.ordChange,
      icon: ShoppingCart,
      tint: "accent",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      tint: "gold",
      highlight: stats.pending > 0,
    },
    {
      label: "Products",
      value: stats.productCount,
      icon: Package,
      tint: "primary",
      sub: stats.lowStock.length > 0 ? `${stats.lowStock.length} low stock` : "All in stock",
      subAlert: stats.lowStock.length > 0,
    },
  ] as const;

  return (
    <div className="p-5 md:p-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold">{today}</p>
          <h1 className="font-display text-3xl md:text-4xl mt-2">{greeting}, Admin</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Last {range} days overview of your store
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 border border-border bg-card px-4 py-2.5 rounded-full text-sm font-medium hover:bg-secondary transition"
          >
            View Orders <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {kpis.map((k) => {
          const positive = (k as any).change >= 0;
          return (
            <div
              key={k.label}
              className={`relative overflow-hidden bg-card border rounded-2xl p-4 md:p-6 transition hover:shadow-[var(--shadow-card)] ${
                (k as any).highlight ? "border-gold/50" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    k.tint === "gold"
                      ? "bg-gold/15 text-gold"
                      : k.tint === "accent"
                      ? "bg-accent/15 text-accent"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <k.icon className="w-5 h-5" />
                </div>
                {"change" in k && k.change !== undefined && Number.isFinite(k.change) && (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full ${
                      positive
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(k.change).toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="mt-4 text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">
                {k.label}
              </div>
              <div className="font-display text-2xl md:text-3xl mt-1 leading-tight truncate">
                {k.value}
              </div>
              {"sub" in k && k.sub && (
                <div
                  className={`text-[11px] mt-2 inline-flex items-center gap-1 ${
                    (k as any).subAlert ? "text-gold" : "text-muted-foreground"
                  }`}
                >
                  {(k as any).subAlert && <AlertTriangle className="w-3 h-3" />}
                  {k.sub}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Chart row */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 md:p-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-display text-lg md:text-xl">Revenue trend</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Avg {formatBDT(stats.avgPerDay)} / day
              </p>
            </div>
            <div className="inline-flex bg-secondary rounded-full p-1 text-xs">
              {([7, 30, 90] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-full transition ${
                    range === r
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}d
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 md:h-72 mt-4 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.buckets} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.13 142)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.62 0.13 142)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  fontSize={10}
                  stroke="oklch(0.55 0.02 150)"
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(stats.buckets.length / 6)}
                />
                <YAxis
                  fontSize={10}
                  stroke="oklch(0.55 0.02 150)"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(1 0 0)",
                    border: "1px solid oklch(0.9 0.01 150)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => [formatBDT(v), "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="oklch(0.62 0.13 142)"
                  strokeWidth={2}
                  fill="url(#revFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status donut */}
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
          <h2 className="font-display text-lg md:text-xl">Order status</h2>
          <p className="text-xs text-muted-foreground mt-1">Last 90 days</p>
          {stats.statusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              No orders yet
            </div>
          ) : (
            <>
              <div className="h-48 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {stats.statusData.map((s) => (
                        <Cell key={s.key} fill={STATUS_COLORS[s.key] ?? "oklch(0.7 0 0)"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "oklch(1 0 0)",
                        border: "1px solid oklch(0.9 0.01 150)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-2">
                {stats.statusData.map((s) => (
                  <div key={s.key} className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: STATUS_COLORS[s.key] ?? "oklch(0.7 0 0)" }}
                      />
                      {s.name}
                    </span>
                    <span className="font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg md:text-xl">Recent orders</h2>
            <Link
              to="/admin/orders"
              className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No orders yet
            </div>
          ) : (
            <div className="mt-4 -mx-2 overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Customer</th>
                    <th className="px-2 py-2 font-medium">Items</th>
                    <th className="px-2 py-2 font-medium">Total</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-border/60 hover:bg-secondary/40 transition">
                      <td className="px-2 py-3 font-medium truncate max-w-[140px]">{o.customer_name}</td>
                      <td className="px-2 py-3 text-muted-foreground">
                        {(o.items?.length ?? 0)}×
                      </td>
                      <td className="px-2 py-3 font-medium">{formatBDT(Number(o.total))}</td>
                      <td className="px-2 py-3">
                        <span
                          className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            background: `color-mix(in oklab, ${STATUS_COLORS[o.status] ?? "oklch(0.7 0 0)"} 15%, transparent)`,
                            color: STATUS_COLORS[o.status] ?? "oklch(0.4 0 0)",
                          }}
                        >
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-right text-xs text-muted-foreground">
                        {timeAgo(o.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top products + low stock */}
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
            <h2 className="font-display text-lg md:text-xl">Top products</h2>
            <p className="text-xs text-muted-foreground mt-1">Last {range} days</p>
            {stats.topProducts.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No sales yet</div>
            ) : (
              <div className="mt-4 space-y-3">
                {stats.topProducts.map((p, i) => (
                  <div key={p.name + i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary overflow-hidden shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{p.qty} sold</div>
                    </div>
                    <div className="text-xs font-medium">{formatBDT(p.revenue)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {stats.lowStock.length > 0 && (
            <div className="bg-card border border-gold/40 rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-gold" />
                <h2 className="font-display text-lg">Low stock</h2>
              </div>
              <div className="mt-3 space-y-2">
                {stats.lowStock.slice(0, 5).map((p) => (
                  <Link
                    key={p.id}
                    to="/admin/products"
                    className="flex items-center justify-between text-sm py-1.5 hover:text-primary transition"
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-xs font-medium text-gold">{p.stock} left</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
