import { useState } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { convertIncompleteToOrder } from "@/lib/incomplete-orders.functions";
import { formatBDT } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type LeadForConvert = {
  id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  city: string;
  notes: string | null;
  delivery_fee: number;
  items: Array<{ id?: string; name?: string; quantity: number; price?: number }>;
};

const DELIVERY_OPTIONS = [
  { label: "Inside Dhaka (৳70)", value: 70 },
  { label: "Outside Dhaka (৳130)", value: 130 },
  { label: "Free delivery (৳0)", value: 0 },
];

export function ConvertLeadModal({
  lead,
  onClose,
  onConverted,
}: {
  lead: LeadForConvert;
  onClose: () => void;
  onConverted: () => void;
}) {
  const convert = useServerFn(convertIncompleteToOrder);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_name: lead.customer_name ?? "",
    customer_phone: lead.customer_phone ?? "",
    address: lead.address ?? "",
    city: lead.city || "Dhaka",
    notes: lead.notes ?? "",
    delivery_fee: lead.delivery_fee || 70,
  });
  const [items, setItems] = useState(
    (lead.items ?? [])
      .filter((it) => it.id)
      .map((it) => ({
        id: String(it.id),
        name: it.name ?? "Item",
        price: Number(it.price ?? 0),
        quantity: Math.max(1, Number(it.quantity) || 1),
      })),
  );

  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  const submit = async () => {
    if (!items.length) {
      toast.error("এই লিডে কোনো প্রোডাক্ট নেই — অর্ডার তৈরি করা যাবে না।");
      return;
    }
    setSaving(true);
    try {
      const res = await convert({
        data: {
          incomplete_id: lead.id,
          customer_name: form.customer_name.trim(),
          customer_phone: form.customer_phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          notes: form.notes.trim(),
          delivery_fee: Number(form.delivery_fee),
          items: items.map((it) => ({ id: it.id, quantity: it.quantity })),
        },
      });
      toast.success(`Order created — ${formatBDT(res.total)}`);
      onConverted();
      onClose();
      if (res.orderId) navigate({ to: "/admin/orders/$id", params: { id: res.orderId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full md:max-w-2xl max-h-[92vh] overflow-y-auto bg-card border border-border rounded-t-2xl md:rounded-2xl p-5 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="block text-[11px] uppercase tracking-[0.28em] text-gold">Recovery</span>
            <h2 className="font-display text-2xl">Confirm as order</h2>
            <p className="text-sm text-muted-foreground mt-1">
              তথ্য যাচাই করে নিন — কনফার্ম করলে এটি আসল অর্ডার হিসেবে যুক্ত হবে।
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 grid md:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Name</span>
            <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
          </label>
          <label className="block">
            <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Phone</span>
            <Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
          </label>
          <label className="block md:col-span-2">
            <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Address</span>
            <Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>
          <label className="block">
            <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1">City</span>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </label>
          <label className="block">
            <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Delivery</span>
            <select
              value={form.delivery_fee}
              onChange={(e) => setForm({ ...form, delivery_fee: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            >
              {DELIVERY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Notes</span>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Items</div>
          {items.length === 0 ? (
            <div className="text-sm text-rose-600">এই লিডে কোনো প্রোডাক্ট নেই।</div>
          ) : (
            <ul className="space-y-2">
              {items.map((it, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 min-w-0 truncate">{it.name}</span>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={it.quantity}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((p, i) =>
                          i === idx ? { ...p, quantity: Math.max(1, Number(e.target.value) || 1) } : p,
                        ),
                      )
                    }
                    className="w-16 px-2 py-1 border border-input bg-background rounded-md text-sm"
                  />
                  <span className="w-24 text-right font-numeric">{formatBDT(it.price * it.quantity)}</span>
                  <button
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-1 text-destructive"
                    aria-label="Remove item"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 text-sm flex justify-between border-t border-border pt-3">
            <span className="text-muted-foreground">Subtotal (recalculated on server)</span>
            <span className="font-numeric">{formatBDT(subtotal)}</span>
          </div>
          <div className="text-sm flex justify-between mt-1">
            <span className="text-muted-foreground">Delivery</span>
            <span className="font-numeric">{formatBDT(Number(form.delivery_fee))}</span>
          </div>
          <div className="flex justify-between mt-2 font-display text-xl text-primary">
            <span>Total</span>
            <span>{formatBDT(subtotal + Number(form.delivery_fee))}</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || items.length === 0}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
            Confirm order
          </Button>
        </div>
      </div>
    </div>
  );
}
