import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Package, Receipt, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/external";
import { formatBDT } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { CourierPanel } from "@/components/admin/CourierPanel";
import { CourierDispatchPanel } from "@/components/admin/CourierDispatchPanel";
import { OrderEditPanel } from "@/components/admin/OrderEditPanel";
import { OrderHistoryPanel } from "@/components/admin/OrderHistoryPanel";
import {
  ORDER_STATUS_STYLES,
  orderLabel,
  type AdminOrder,
} from "@/lib/order-admin";

export const Route = createFileRoute("/admin/orders/$id")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      return (data ?? null) as unknown as AdminOrder | null;
    },
  });

  const { data: related } = useQuery({
    enabled: Boolean(order?.customer_phone),
    queryKey: ["admin-order-related", order?.customer_phone],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_no, created_at, status, total, items")
        .eq("customer_phone", order!.customer_phone)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as AdminOrder[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 text-muted-foreground py-24">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading order…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Link to="/admin/orders" className="text-gold text-sm mt-3 inline-block">
          ← Back to orders
        </Link>
      </div>
    );
  }

  const others = (related ?? []).filter((o) => o.id !== order.id);
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-order", id] });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    qc.invalidateQueries({ queryKey: ["order-history", id] });
  };

  return (
    <div className="p-5 md:p-10 max-w-5xl">
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to orders
      </Link>

      <header className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl md:text-4xl">Order {orderLabel(order)}</h1>
        <span
          className={cn(
            "px-3 py-1 rounded-full border text-[11px] font-medium capitalize",
            ORDER_STATUS_STYLES[order.status] ?? "bg-secondary text-foreground border-border",
          )}
        >
          {order.status}
        </span>
        <span className="text-sm text-muted-foreground">
          {new Date(order.created_at).toLocaleString()}
        </span>
      </header>

      <div className="mt-8 grid md:grid-cols-2 gap-5">
        <Card title="Customer information" icon={<User className="w-4 h-4 text-primary" />}>
          <Row label="Name" value={order.customer_name} />
          <Row label="Phone" value={order.customer_phone} numeric />
          <Row label="Address" value={order.address} />
          <Row label="City" value={order.city || "—"} />
          {order.customer_email ? <Row label="Email" value={order.customer_email} /> : null}
        </Card>

        <Card title="Payment & order info" icon={<Receipt className="w-4 h-4 text-primary" />}>
          <Row label="Source" value={order.source === "recovered" ? "Recovered lead" : "Website"} />
          <Row label="Items" value={String((order.items ?? []).length)} />
          <Row label="Subtotal" value={formatBDT(Number(order.subtotal))} numeric />
          <Row label="Delivery" value={formatBDT(Number(order.delivery_fee))} numeric />
          <div className="flex items-center justify-between pt-3 mt-1 border-t border-border">
            <span className="text-sm font-medium">Total</span>
            <span className="font-display text-2xl text-primary">
              {formatBDT(Number(order.total))}
            </span>
          </div>
        </Card>
      </div>

      <div className="mt-5">
        <Card title="Items" icon={<Package className="w-4 h-4 text-primary" />}>
          <ul className="divide-y divide-border">
            {(order.items ?? []).map((it, i) => (
              <li key={i} className="flex items-center justify-between py-3 text-sm">
                <span>
                  {it.name}
                  <span className="text-muted-foreground"> × {it.quantity}</span>
                </span>
                <span className="font-numeric">{formatBDT(it.price * it.quantity)}</span>
              </li>
            ))}
          </ul>
          {order.notes && (
            <p className="text-sm italic text-muted-foreground mt-3">"{order.notes}"</p>
          )}
        </Card>
      </div>

      <div className="mt-5 grid md:grid-cols-2 gap-5">
        <Card title="" icon={null}>
          <OrderEditPanel order={order} onSaved={invalidate} />
        </Card>
        <div className="space-y-5">
          <Card title="" icon={null}>
            <CourierDispatchPanel order={order} onSent={invalidate} />
          </Card>
          <Card title="" icon={null}>
            <CourierPanel phone={order.customer_phone} />
          </Card>
        </div>
      </div>

      <div className="mt-5">
        <Card title="Order history" icon={<Receipt className="w-4 h-4 text-primary" />}>
          <p className="text-sm text-muted-foreground -mt-2 mb-3">
            Previous orders for {order.customer_phone}
          </p>
          {others.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-6 text-center">
              No other orders from this number.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-muted-foreground border-b border-border">
                    <th className="py-2 font-medium">Order #</th>
                    <th className="py-2 font-medium">Date</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 font-medium text-right">Total</th>
                    <th className="py-2 font-medium text-right">Items</th>
                  </tr>
                </thead>
                <tbody>
                  {others.map((o) => (
                    <tr key={o.id} className="border-b border-border/60">
                      <td className="py-2.5">
                        <Link
                          to="/admin/orders/$id"
                          params={{ id: o.id }}
                          className="font-numeric font-medium text-primary hover:text-gold transition"
                        >
                          {orderLabel(o)}
                        </Link>
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {new Date(o.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full border text-[11px] capitalize",
                            ORDER_STATUS_STYLES[o.status] ??
                              "bg-secondary text-foreground border-border",
                          )}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-numeric">
                        {formatBDT(Number(o.total))}
                      </td>
                      <td className="py-2.5 text-right font-numeric">
                        {(o.items ?? []).length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-5">
        <Card title="" icon={null}>
          <OrderHistoryPanel orderId={order.id} />
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border border-border rounded-2xl p-5 md:p-6">
      {title ? (
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h2 className="font-display text-lg">{title}</h2>
        </div>
      ) : null}
      {children}
    </section>
  );
}

function Row({ label, value, numeric }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-6 py-1.5">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground pt-1">
        {label}
      </span>
      <span className={cn("text-sm text-right", numeric && "font-numeric")}>{value}</span>
    </div>
  );
}
