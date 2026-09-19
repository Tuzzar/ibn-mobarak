import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendOrderToCourier } from "@/lib/courier.functions";
import type { AdminOrder } from "@/lib/order-admin";

type CourierFields = {
  courier_consignment_id?: string | null;
  courier_tracking_code?: string | null;
  courier_status?: string | null;
  courier_sent_at?: string | null;
};

export function CourierDispatchPanel({
  order,
  onSent,
}: {
  order: AdminOrder & CourierFields;
  onSent: () => void;
}) {
  const send = useServerFn(sendOrderToCourier);
  const [busy, setBusy] = useState(false);

  const sent = Boolean(order.courier_consignment_id);

  const dispatch = async () => {
    if (sent || busy) return;
    setBusy(true);
    try {
      const res = await send({ data: { orderId: order.id } });
      toast.success(
        res.already
          ? "Already sent to Steadfast."
          : `Steadfast এ এন্ট্রি হয়েছে — Consignment ${res.consignment_id}`,
      );
      onSent();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send to Steadfast");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Truck className="w-4 h-4 text-primary" />
        <h3 className="font-display text-lg">Courier dispatch</h3>
      </div>

      {sent ? (
        <div className="space-y-2 text-sm">
          <div className="inline-flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" /> Sent to Steadfast
          </div>
          <InfoRow label="Consignment" value={order.courier_consignment_id ?? "—"} />
          <InfoRow label="Tracking" value={order.courier_tracking_code ?? "—"} />
          <InfoRow label="Courier status" value={order.courier_status ?? "—"} />
          {order.courier_sent_at ? (
            <InfoRow label="Sent at" value={new Date(order.courier_sent_at).toLocaleString()} />
          ) : null}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            অর্ডার কনফার্ম হলে এখান থেকে সরাসরি Steadfast-এ পার্সেল এন্ট্রি হবে এবং স্ট্যাটাস
            <span className="font-medium text-foreground"> shipped</span> হয়ে যাবে।
          </p>
          <Button onClick={dispatch} disabled={busy || order.status === "cancelled"} className="gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
            {busy ? "Sending…" : "Send to Steadfast"}
          </Button>
          {order.status === "cancelled" ? (
            <p className="text-xs text-muted-foreground mt-2">Cancelled order পাঠানো যাবে না।</p>
          ) : null}
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-numeric text-right">{value}</span>
    </div>
  );
}
