import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Pencil,
  Loader2,
  Search,
  Inbox,
  Truck,
  Trash2,
  RotateCcw,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/external";
import { formatBDT } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IncompleteTab, useLeads } from "@/components/admin/IncompleteTab";
import { OrderInvoiceModal } from "@/components/admin/OrderInvoiceModal";
import {
  moveAdminOrderToTrash,
  restoreAdminOrderFromTrash,
  deleteAdminOrderPermanently,
} from "@/lib/orders.functions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  ORDER_STATUSES as STATUSES,
  ORDER_STATUS_STYLES,
  orderLabel,
  phoneKey,
  type AdminOrder as Order,
  type OrderStatus as Status,
} from "@/lib/order-admin";

export const Route = createFileRoute("/admin/orders/")({
  component: AdminOrders,
});

type CourierRow = { phone: string; success_rate: number; total_parcel: number };

function AdminOrders() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [tab, setTab] = useState<"orders" | "incomplete" | "trash">("orders");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as Order[];
    },
  });

  const { data: leads } = useLeads();

  const { activeOrders, trashOrders } = useMemo(() => {
    const all = orders ?? [];
    return {
      activeOrders: all.filter((o) => o.status !== "trash"),
      trashOrders: all.filter((o) => o.status === "trash"),
    };
  }, [orders]);

  const { data: courierMap } = useQuery({
    queryKey: ["admin-courier-map"],
    queryFn: async () => {
      const { data } = await supabase
        .from("courier_checks")
        .select("phone, success_rate, total_parcel");
      const map = new Map<string, CourierRow>();
      for (const row of (data ?? []) as CourierRow[]) map.set(phoneKey(row.phone), row);
      return map;
    },
  });

  const { data: editedIds } = useQuery({
    queryKey: ["admin-orders-edited"],
    queryFn: async () => {
      const { data } = await supabase.from("order_history").select("order_id");
      return new Set((data ?? []).map((r: { order_id: string }) => r.order_id));
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const handleMoveToTrash = async (order: Order) => {
    const ok = await confirm({
      title: `Move Order ${orderLabel(order)} to Trash?`,
      description: `This order will be moved to the Trash tab. You can review or restore it anytime.`,
      confirmText: "Move to Trash",
      variant: "destructive",
      icon: "trash",
    });
    if (!ok) return;
    setActionLoadingId(order.id);
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
      setActionLoadingId(null);
    }
  };

  const handleRestore = async (order: Order) => {
    setActionLoadingId(order.id);
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
      setActionLoadingId(null);
    }
  };

  const handleDeletePermanently = async (order: Order) => {
    const ok = await confirm({
      title: "Permanently Delete Order?",
      description: `WARNING: Order ${orderLabel(order)} and all its associated items and history will be permanently deleted from the database. This action CANNOT be undone!`,
      confirmText: "Delete Permanently",
      variant: "destructive",
      icon: "trash",
    });
    if (!ok) return;
    setActionLoadingId(order.id);
    try {
      await deleteAdminOrderPermanently({ data: { orderId: order.id } });
      toast.success("Order permanently deleted");
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete permanently");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredActive = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeOrders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    });
  }, [activeOrders, statusFilter, search]);

  const filteredTrash = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trashOrders.filter((o) => {
      if (!q) return true;
      return (
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    });
  }, [trashOrders, search]);

  const pendingLeads = (leads ?? []).filter((l) => l.status === "new").length;
  const pendingOrders = activeOrders.filter((o) => o.status === "pending").length;
  const revenue = activeOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="p-5 md:p-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="block text-[11px] uppercase tracking-[0.28em] text-gold">Console</span>
          <h1 className="font-display text-3xl md:text-4xl">Order Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            সব অর্ডার আর ইনকমপ্লিট অর্ডার একসাথে — কনফার্ম করলেই আসল অর্ডারে চলে যাবে।
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <Stat label="Orders" value={String(activeOrders.length)} />
          <Stat label="Pending" value={String(pendingOrders)} />
          <Stat label="Leads" value={String(pendingLeads)} />
          <Stat label="Revenue" value={formatBDT(revenue)} />
        </div>
      </header>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-b border-border">
        {(
          [
            ["orders", `Orders (${activeOrders.length})`],
            ["incomplete", `Incomplete (${(leads ?? []).length})`],
            ["trash", `Trash (${trashOrders.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-1 pb-3 text-sm tracking-wide border-b-2 -mb-px transition flex items-center gap-1.5",
              tab === key
                ? key === "trash"
                  ? "border-rose-500 text-rose-600 dark:text-rose-400 font-medium"
                  : "border-gold text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {key === "trash" && <Trash2 className="w-3.5 h-3.5" />}
            {label}
          </button>
        ))}

        <div className="relative ml-auto mb-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, address"
            className="pl-9 pr-3 py-2 text-sm border border-input bg-background rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
      </div>

      <div className="mt-6">
        {tab === "incomplete" ? (
          <IncompleteTab search={search} />
        ) : tab === "trash" ? (
          <TrashView
            orders={filteredTrash}
            isLoading={isLoading}
            onRestore={handleRestore}
            onDeletePermanently={handleDeletePermanently}
            loadingId={actionLoadingId}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {(["all", ...STATUSES] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s as "all" | Status)}
                  className={cn(
                    "px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] border rounded-full transition",
                    statusFilter === s
                      ? "border-gold bg-gold/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-gold/40",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : filteredActive.length === 0 ? (
              <div className="mt-6 bg-card border border-dashed border-border rounded-2xl p-16 text-center text-muted-foreground">
                <Inbox className="w-6 h-6 mx-auto mb-3 opacity-60" />
                No orders found.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto border border-border rounded-2xl bg-card">
                <table className="w-full text-sm min-w-[950px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-muted-foreground border-b border-border">
                      <th className="px-4 py-3 font-medium">Order</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                      <th className="px-4 py-3 font-medium">Success ratio</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActive.map((o) => (
                      <OrderRow
                        key={o.id}
                        order={o}
                        courier={courierMap?.get(phoneKey(o.customer_phone)) ?? null}
                        wasEdited={editedIds?.has(o.id) ?? false}
                        onPrintInvoice={(order) => setSelectedInvoiceOrder(order)}
                        onMoveToTrash={handleMoveToTrash}
                        isActionLoading={actionLoadingId === o.id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {selectedInvoiceOrder && (
        <OrderInvoiceModal
          order={selectedInvoiceOrder}
          isOpen={Boolean(selectedInvoiceOrder)}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="font-display text-xl text-primary leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function SuccessRatio({ courier }: { courier: CourierRow | null }) {
  if (!courier) return <span className="text-xs text-muted-foreground">—</span>;
  const rate = Math.round(Number(courier.success_rate) || 0);
  const tone = rate >= 80 ? "bg-emerald-500" : rate >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="min-w-[120px]">
      <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
        <span className="font-numeric">{rate}%</span>
        <span>{courier.total_parcel} parcels</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
    </div>
  );
}

function OrderRow({
  order,
  courier,
  wasEdited,
  onPrintInvoice,
  onMoveToTrash,
  isActionLoading,
}: {
  order: Order;
  courier: CourierRow | null;
  wasEdited: boolean;
  onPrintInvoice: (order: Order) => void;
  onMoveToTrash: (order: Order) => void;
  isActionLoading: boolean;
}) {
  return (
    <tr className="border-b border-border/70 align-top hover:bg-secondary/25 transition">
      <td className="px-4 py-4">
        <Link
          to="/admin/orders/$id"
          params={{ id: order.id }}
          className="font-numeric font-medium text-primary hover:text-gold transition"
        >
          {orderLabel(order)}
        </Link>
        <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">
          {order.source === "recovered" ? "Recovered" : "Web"}
        </div>
        {wasEdited && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-gold mt-1">
            <Pencil className="w-2.5 h-2.5" /> Edited
          </span>
        )}
      </td>
      <td className="px-4 py-4 max-w-[240px]">
        <div className="font-medium truncate">{order.customer_name}</div>
        <div className="text-xs text-muted-foreground font-numeric">{order.customer_phone}</div>
        <div className="text-xs text-muted-foreground truncate">
          {order.address}
          {order.city ? `, ${order.city}` : ""}
        </div>
      </td>
      <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
        {new Date(order.created_at).toLocaleDateString()}
        <div>{new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
      </td>
      <td className="px-4 py-4">
        <span
          className={cn(
            "inline-block px-3 py-1 rounded-full border text-[11px] font-medium capitalize",
            ORDER_STATUS_STYLES[order.status] ?? "bg-secondary text-foreground border-border",
          )}
        >
          {order.status}
        </span>
        {(order as any).courier_consignment_id ? (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
            <Truck className="w-3 h-3 shrink-0" />
            <span title={`Tracking: ${(order as any).courier_tracking_code || "N/A"}`}>
              Steadfast #{(order as any).courier_consignment_id}
            </span>
          </div>
        ) : null}
      </td>
      <td className="px-4 py-4 text-right font-display text-lg text-primary whitespace-nowrap">
        {formatBDT(Number(order.total))}
      </td>
      <td className="px-4 py-4">
        <SuccessRatio courier={courier} />
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPrintInvoice(order)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Print Invoice"
          >
            <Printer className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveToTrash(order)}
            disabled={isActionLoading}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500"
            title="Move to Trash"
          >
            {isActionLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
          <Button asChild variant="outline" size="sm" className="h-8 gap-1 px-2.5">
            <Link to="/admin/orders/$id" params={{ id: order.id }}>
              View <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </td>
    </tr>
  );
}

function TrashView({
  orders,
  isLoading,
  onRestore,
  onDeletePermanently,
  loadingId,
}: {
  orders: Order[];
  isLoading: boolean;
  onRestore: (order: Order) => void;
  onDeletePermanently: (order: Order) => void;
  loadingId: string | null;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mt-6 bg-card border border-dashed border-border rounded-2xl p-16 text-center text-muted-foreground">
        <Trash2 className="w-6 h-6 mx-auto mb-3 opacity-40 text-muted-foreground" />
        Trash bin is empty. No deleted orders.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
        <span>
          ট্র্যাশে থাকা অর্ডারগুলো মূল অর্ডার তালিকা এবং আয়ের হিসাব (Revenue) থেকে বাদ রাখা হয়। এখান থেকে এগুলো রিস্টোর অথবা স্থায়ীভাবে মুছে ফেলতে পারেন।
        </span>
        <span className="font-semibold">{orders.length} in trash</span>
      </div>

      <div className="overflow-x-auto border border-border rounded-2xl bg-card">
        <table className="w-full text-sm min-w-[850px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-muted-foreground border-b border-border">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className="border-b border-border/70 align-top hover:bg-secondary/25 transition"
              >
                <td className="px-4 py-4">
                  <div className="font-numeric font-medium text-primary">
                    {orderLabel(o)}
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 mt-1">
                    Trash
                  </span>
                </td>
                <td className="px-4 py-4 max-w-[240px]">
                  <div className="font-medium truncate">{o.customer_name}</div>
                  <div className="text-xs text-muted-foreground font-numeric">
                    {o.customer_phone}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{o.address}</div>
                </td>
                <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(o.created_at).toLocaleDateString()}
                  <div>
                    {new Date(o.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-display text-lg text-primary whitespace-nowrap">
                  {formatBDT(Number(o.total))}
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRestore(o)}
                      disabled={loadingId === o.id}
                      className="gap-1.5 h-8 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    >
                      {loadingId === o.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      Restore
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeletePermanently(o)}
                      disabled={loadingId === o.id}
                      className="gap-1.5 h-8 text-xs"
                    >
                      {loadingId === o.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
