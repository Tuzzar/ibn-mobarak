import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

import { useCart, formatBDT } from "@/lib/cart";
import { placeOrder } from "@/lib/orders.functions";
import { Spinner } from "@/components/site/Spinner";
import { useIncompleteOrderTracker } from "@/hooks/use-incomplete-order";


export const Route = createFileRoute("/checkout")({
  component: Checkout,
  head: () => ({
    meta: [
      { title: "Checkout — Ibn Mobarak Art Gallery" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const schema = z.object({
  customer_name: z.string().trim().min(2, "Enter your full name").max(100),
  customer_phone: z.string().trim().min(10, "Enter a valid phone number").max(20),
  address: z.string().trim().min(5, "Enter a delivery address").max(500),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

type DeliveryZone = "inside" | "outside";
const DELIVERY_FEES: Record<DeliveryZone, number> = { inside: 70, outside: 130 };

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const placeOrderFn = useServerFn(placeOrder);
  const [submitting, setSubmitting] = useState(false);
  const [zone, setZone] = useState<DeliveryZone>("inside");
  const [form, setForm] = useState({
    customer_name: "", customer_phone: "",
    address: "", notes: "",
  });

  const deliveryFee = DELIVERY_FEES[zone];
  const total = subtotal + deliveryFee;

  const { markConverted } = useIncompleteOrderTracker({
    customer_name: form.customer_name,
    customer_phone: form.customer_phone,
    address: form.address,
    city: zone === "inside" ? "Inside Dhaka" : "Outside Dhaka",
    notes: form.notes,
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      unit: i.unit,
    })),
    subtotal,
    delivery_fee: deliveryFee,
    total,
    source: "checkout",
  });

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-6 py-24 text-center">
        <span className="block text-[11px] uppercase tracking-[0.32em] text-gold mb-3">Checkout</span>
        <h1 className="font-display text-3xl text-foreground">কার্ট এখনো খালি</h1>
        <div className="mt-4 mx-auto h-px w-16 bg-gold/60" />
        <Link to="/products" className="mt-6 inline-block text-primary hover:text-gold transition-colors">Continue shopping</Link>
      </div>
    );
  }


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    let orderId: string;
    let confirmedTotal: number;
    try {
      const order = await placeOrderFn({
        data: {
          customer_name: parsed.data.customer_name,
          customer_phone: parsed.data.customer_phone,
          customer_email: "",
          address: parsed.data.address,
          city: zone === "inside" ? "Inside Dhaka" : "Outside Dhaka",
          notes: parsed.data.notes || "",
          items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
          delivery_fee: deliveryFee,
        },
      });
      orderId = order.orderId;
      confirmedTotal = order.total;
    } catch (error) {
      setSubmitting(false);
      toast.error(error instanceof Error ? error.message : "Could not place order. Please try again.");
      return;
    }
    setSubmitting(false);
    markConverted(orderId);
    try {
      const recent = JSON.parse(localStorage.getItem("recent_orders") || "[]");
      recent.unshift({
        id: orderId,
        total: confirmedTotal,
        created_at: new Date().toISOString(),
        customer_name: parsed.data.customer_name,
        customer_phone: parsed.data.customer_phone,
      });
      localStorage.setItem("recent_orders", JSON.stringify(recent.slice(0, 20)));
    } catch {}
    clear();
    toast.success("Order placed! We'll call you shortly.");
    navigate({ to: "/order-success", search: { id: orderId } });
  };

  return (
    <div className="container mx-auto px-6 max-w-6xl py-16">
      <header className="mb-10">
        <span className="block text-[11px] uppercase tracking-[0.32em] text-gold mb-2">Almost there</span>
        <h1 className="font-display text-4xl md:text-5xl text-foreground">Checkout</h1>
        <div className="mt-3 h-px w-16 bg-gold/60" />
      </header>
      <form onSubmit={onSubmit} className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <fieldset className="bg-card border border-border p-6">
            <legend className="font-display text-xl px-2 text-primary">Shipping Details</legend>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <Field label="Full name" value={form.customer_name} onChange={(v) => setForm({ ...form, customer_name: v })} required />
              <Field label="Phone" value={form.customer_phone} onChange={(v) => setForm({ ...form, customer_phone: v })} required type="tel" />
              <div className="sm:col-span-2">
                <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-[0.2em] text-gold mb-2">
                  Delivery Charge <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([
                    { id: "inside", label: "In Dhaka", fee: 70 },
                    { id: "outside", label: "Out Dhaka", fee: 130 },
                  ] as const).map((opt) => {
                    const active = zone === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center justify-between gap-2 px-3 py-2.5 border cursor-pointer transition ${
                          active
                            ? "border-gold bg-gold/10 ring-1 ring-gold"
                            : "border-input bg-background hover:border-gold/40"
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-3.5 h-3.5 shrink-0 rounded-full border flex items-center justify-center ${
                              active ? "border-gold" : "border-muted-foreground/40"
                            }`}
                          >
                            {active && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
                          </span>
                          <span className="text-xs font-medium truncate">{opt.label}</span>
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">{formatBDT(opt.fee)}</span>
                        <input
                          type="radio"
                          name="zone"
                          value={opt.id}
                          checked={active}
                          onChange={() => setZone(opt.id)}
                          className="sr-only"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-[0.2em] text-gold mb-2">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-none border border-input bg-background focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
                />
              </div>

            </div>
          </fieldset>
        </div>

        <aside className="bg-card p-6 h-fit border border-gold/40 lg:sticky lg:top-28">
          <span className="block text-[11px] uppercase tracking-[0.28em] text-gold mb-2">Your order</span>
          <h2 className="font-display text-2xl text-foreground">Order Summary</h2>
          <div className="mt-3 h-px w-10 bg-gold/60" />
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4">
                <span className="truncate">{i.quantity} × {i.name}</span>
                <span className="shrink-0">{formatBDT(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border my-4" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatBDT(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd>{formatBDT(deliveryFee)}</dd></div>
          </dl>
          <div className="border-t border-gold/30 my-4" />
          <div className="flex justify-between font-display text-xl">
            <span>Total</span><span className="text-primary">{formatBDT(total)}</span>
          </div>
          <button
            disabled={submitting}
            type="submit"
            className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground py-3.5 rounded-full font-medium disabled:opacity-50 transition"
          >
            {submitting && <Spinner className="w-4 h-4" />}
            {submitting ? "Placing order…" : "অর্ডার নিশ্চিত করুন (COD)"}
          </button>
        </aside>

      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-[0.2em] text-gold mb-2">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-3 rounded-none border border-input bg-background focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
      />
    </div>
  );
}

