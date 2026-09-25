import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Package,
  Receipt,
  User,
  Printer,
  Trash2,
  RotateCcw,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/external";
import { formatBDT } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CourierPanel } from "@/components/admin/CourierPanel";
import { CourierDispatchPanel } from "@/components/admin/CourierDispatchPanel";
import { OrderEditPanel } from "@/components/admin/OrderEditPanel";
import { OrderHistoryPanel } from "@/components/admin/OrderHistoryPanel";
import { OrderInvoiceModal } from "@/components/admin/OrderInvoiceModal";
import { OrderItemsEditModal } from "@/components/admin/OrderItemsEditModal";
import {
  moveAdminOrderToTrash,
  restoreAdminOrderFromTrash,
  deleteAdminOrderPermanently,
} from "@/lib/orders.functions";
import { useConfirm } from "@/components/ui/confirm-dialog";
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
  const confirm = useConfirm();
  const navigate = useNavigate();

  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isItemsEditOpen, setIsItemsEditOpen] = useState(false);
  const [isTrashLoading, setIsTrashLoading] = useState(false);

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

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-order", id] });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    qc.invalidateQueries({ queryKey: ["order-history", id] });
  };

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

  const handleMoveToTrash = async () => {
    const ok = await confirm({
      title: `Move Order ${orderLabel(order)} to Trash?`,
      description: "This order will be moved to the Trash tab. You can review or restore it anytime.",
      confirmText: "Move to Trash",
      variant: "destructive",
      icon: "trash",
    });
    if (!ok) return;
    setIsTrashLoading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      await moveAdminOrderToTrash({
        data: {
          orderId: order.id,
          user: {
            id: userRes?.user?.id || "",
            email: userRes?.user?.email || null,
          },
        },
      });
      toast.success("Order moved to Trash");
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to move to trash");
    } finally {
      setIsTrashLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsTrashLoading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const res = await restoreAdminOrderFromTrash({
        data: {
          orderId: order.id,
          user: {
            id: userRes?.user?.id || "",
            email: userRes?.user?.email || null,
          },
        },
      });
      toast.success(`Order restored to ${res.restoredStatus}`);
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to restore order");
    } finally {
      setIsTrashLoading(false);
    }
  };

  const handleDeletePermanently = async () => {
    const ok = await confirm({
      title: "Permanently Delete Order?",
      description: "WARNING: This will permanently delete this order and all its items and history from the database! This action CANNOT be undone. Are you sure?",
      confirmText: "Delete Permanently",
      variant: "destructive",
      icon: "trash",
    });
    if (!ok) return;
    setIsTrashLoading(true);
    try {
      await deleteAdminOrderPermanently({ data: { orderId: order.id } });
      toast.success("Order permanently deleted");
      navigate({ to: "/admin/orders" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete order");
      setIsTrashLoading(false);
    }
  };

  return (
    <div className="p-5 md:p-10 max-w-5xl">
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to orders
      </Link>

      <header className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
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
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsInvoiceOpen(true)}
            className="gap-1.5 border-border hover:border-gold/50"
          >
            <Printer className="w-4 h-4 text-primary" /> Print Invoice
          </Button>

          {order.status === "trash" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestore}
                disabled={isTrashLoading}
                className="gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              >
                <RotateCcw className="w-4 h-4" /> Restore
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeletePermanently}
                disabled={isTrashLoading}
                className="gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Permanently
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMoveToTrash}
              disabled={isTrashLoading}
              className="gap-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            >
              <Trash2 className="w-4 h-4" /> Move to Trash
            </Button>
          )}
        </div>
      </header>

      {/* Trash Warning Banner */}
      {order.status === "trash" && (
        <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>This order is currently in the Trash bin. It is hidden from active orders.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRestore}
              disabled={isTrashLoading}
              className="h-8 text-xs gap-1 border-amber-500/40 hover:bg-amber-500/10"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore Order
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeletePermanently}
              disabled={isTrashLoading}
              className="h-8 text-xs gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
            </Button>
          </div>
        </div>
      )}

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
        <Card
          title="Items"
          icon={<Package className="w-4 h-4 text-primary" />}
          extra={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsItemsEditOpen(true)}
              className="h-8 text-xs gap-1.5 border-gold/40 hover:bg-gold/10 text-foreground"
            >
              <Pencil className="w-3.5 h-3.5 text-gold" /> Edit Products
            </Button>
          }
        >
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

      <OrderInvoiceModal
        order={order}
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
      />

      <OrderItemsEditModal
        order={order}
        isOpen={isItemsEditOpen}
        onClose={() => setIsItemsEditOpen(false)}
        onSaved={invalidate}
      />
    </div>
  );
}

function Card({
  title,
  icon,
  extra,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border border-border rounded-2xl p-5 md:p-6">
      {title ? (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="font-display text-lg">{title}</h2>
          </div>
          {extra}
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

