import { forwardRef, useState } from "react";
import { z } from "zod";
import { Loader2, CheckCircle2, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { siteContentOptions } from "@/lib/queries";
import { VisitMainSiteCard } from "@/components/landing/VisitMainSiteCard";
import { placeOrder } from "@/lib/orders.functions";
import { useIncompleteOrderTracker } from "@/hooks/use-incomplete-order";

type Variant = { label: string; price: number } | undefined;

type Product = {
  id: string;
  name: string;
  unit?: string | null;
};

const schema = z.object({
  customer_name: z.string().trim().min(2, "Enter your full name").max(100),
  customer_phone: z.string().trim().min(10, "Enter a valid phone number").max(20),
  address: z.string().trim().min(5, "Enter a delivery address").max(500),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

type DeliveryZone = "inside" | "outside";
const DELIVERY_FEES: Record<DeliveryZone, number> = { inside: 0, outside: 0 };

type Props = {
  product: Product;
  variant: Variant;
  qty: number;
  unitPrice: number;
  originalUnitPrice?: number;
  ctaPhone?: string | null;
  ctaText?: string | null;
};

const formatBDT = (n: number) => `BDT ${n}`;
const toBn = (n: number) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export const LandingOrderForm = forwardRef<HTMLInputElement, Props>(
  function LandingOrderForm({ product, variant, qty, unitPrice, originalUnitPrice, ctaPhone, ctaText }, ref) {
    const [form, setForm] = useState({
      customer_name: "",
      customer_phone: "",
      address: "",
      notes: "",
    });
    const [zone, setZone] = useState<DeliveryZone>("inside");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [success, setSuccess] = useState<{ orderId: string; total: number } | null>(null);
    const { data: siteContent } = useQuery(siteContentOptions());
    const securityNote =
      siteContent?.landing_security_note?.trim() ||
      "🔒 আপনার তথ্য সম্পূর্ণ নিরাপদ। অগ্রিম কোনো পেমেন্ট দিতে হবে না।";
    const t = {
      legend: siteContent?.landing_form_legend?.trim() || "Shipping Details",
      name: siteContent?.landing_form_label_name?.trim() || "Full name",
      phone: siteContent?.landing_form_label_phone?.trim() || "Phone",
      address: siteContent?.landing_form_label_address?.trim() || "Address",
      notes: siteContent?.landing_form_label_notes?.trim() || "Notes",
      delivery: siteContent?.landing_form_summary_delivery?.trim() || "Delivery",
      deliveryValue: siteContent?.landing_form_summary_delivery_value?.trim() || "Free",
      savings: siteContent?.landing_form_summary_savings?.trim() || "🔥 Savings",
      total: siteContent?.landing_form_summary_total?.trim() || "Total",
      ctaFallback:
        siteContent?.landing_form_cta_fallback?.trim() || "Place Order (Cash on Delivery)",
    };

    const deliveryFee = DELIVERY_FEES[zone];
    const subtotal = unitPrice * qty;
    const total = subtotal + deliveryFee;

    const { markConverted } = useIncompleteOrderTracker({
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      address: form.address,
      city: zone === "inside" ? "Inside Dhaka" : "Outside Dhaka",
      notes: form.notes,
      items: [
        {
          id: variant ? `${product.id}::${variant.label}` : product.id,
          name: variant ? `${product.name} (${variant.label})` : product.name,
          quantity: qty,
          price: unitPrice,
          unit: variant?.label ?? product.unit ?? null,
        },
      ],
      subtotal,
      delivery_fee: deliveryFee,
      total,
      source: "landing",
      landing_slug: typeof window !== "undefined" ? window.location.pathname.slice(0, 120) : null,
      product_id: product.id,
    });



    const setField = (k: keyof typeof form, v: string) => {
      setForm((f) => ({ ...f, [k]: v }));
      if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
    };

    const onSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);
      const parsed = schema.safeParse(form);
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const k = issue.path[0] as string;
          if (!fieldErrors[k]) fieldErrors[k] = issue.message;
        }
        setErrors(fieldErrors);
        return;
      }

      setSubmitting(true);
      try {
        const itemId = variant ? `${product.id}::${variant.label}` : product.id;
        const order = await placeOrder({
          data: {
            customer_name: parsed.data.customer_name,
            customer_phone: parsed.data.customer_phone,
            customer_email: "",
            address: parsed.data.address,
            city: zone === "inside" ? "Inside Dhaka" : "Outside Dhaka",
            notes: parsed.data.notes || "",
            items: [{ id: itemId, quantity: qty }],
            delivery_fee: deliveryFee,
          },
        });

        markConverted(order.orderId);

        try {
          (window as any).fbq?.("track", "Purchase", {
            value: order.total,
            currency: "BDT",
            content_ids: [product.id],
            num_items: qty,
          });
        } catch {}

        setSuccess({ orderId: order.orderId, total: order.total });
        window.scrollTo({ top: document.getElementById("order")?.offsetTop ?? 0, behavior: "smooth" });
      } catch (err: any) {
        setSubmitError(err?.message || "Could not place order. Please try again.");
      } finally {
        setSubmitting(false);
      }
    };

    if (success) {
      return (
        <div className="bg-background text-foreground rounded-2xl p-6 md:p-8 text-center border border-border mt-4">
          <div className="w-16 h-16 rounded-full bg-accent/15 text-accent flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h3 className="font-display text-2xl text-foreground">ধন্যবাদ! অর্ডার সফল হয়েছে 🎉</h3>
          <p className="text-sm text-muted-foreground mt-2">
            অর্ডার নাম্বার: <span className="font-numeric font-semibold">{success.orderId.slice(0, 8).toUpperCase()}</span>
          </p>
          <p className="text-sm mt-1">
            মোট: <span className="font-numeric text-primary font-bold">৳{success.total}</span> (ক্যাশ অন ডেলিভারি)
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            আমরা শীঘ্রই আপনাকে ফোন করে অর্ডার কনফার্ম করবো। ইনশাআল্লাহ ২–৪ দিনের মধ্যে ডেলিভারি পৌঁছে যাবে।
          </p>
          {ctaPhone && (
            <a
              href={`tel:${ctaPhone}`}
              className="mt-5 inline-flex items-center gap-2 h-11 px-5 rounded-full border-2 border-accent text-accent font-semibold"
            >
              <Phone className="w-4 h-4" /> {ctaPhone}
            </a>
          )}
          <div className="mt-6">
            <VisitMainSiteCard variant="compact" />
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={onSubmit} className="mt-4">
        <fieldset className="bg-card border border-border rounded-2xl p-6">
          <legend className="font-display text-xl px-2">{t.legend}</legend>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field label={t.name} error={errors.customer_name} required>
              <input
                ref={ref}
                type="text"
                value={form.customer_name}
                onChange={(e) => setField("customer_name", e.target.value)}
                required
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <Field label={t.phone} error={errors.customer_phone} required>
              <input
                type="tel"
                inputMode="numeric"
                value={form.customer_phone}
                onChange={(e) => setField("customer_phone", e.target.value)}
                required
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label={t.address} error={errors.address} required>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  required
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
            </div>


            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">{t.notes}</label>
              <textarea
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Summary */}
            <div className="sm:col-span-2 rounded-xl bg-secondary/50 border border-border p-4 space-y-1.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {product.name}
                  {variant ? ` (${variant.label})` : ""} × {qty}
                </span>
                <span className="flex items-baseline gap-2">
                  {originalUnitPrice && originalUnitPrice > unitPrice ? (
                    <span className="font-numeric text-muted-foreground line-through text-xs">৳{toBn(originalUnitPrice * qty)}</span>
                  ) : null}
                  <span className="font-numeric">৳{toBn(unitPrice * qty)}</span>
                </span>
              </div>
              {originalUnitPrice && originalUnitPrice > unitPrice ? (
                <div className="flex justify-between">
                  <span className="text-emerald-600">{t.savings}</span>
                  <span className="font-numeric text-emerald-600 font-medium">−৳{toBn((originalUnitPrice - unitPrice) * qty)}</span>
                </div>
              ) : null}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.delivery}</span>
              <span className="font-numeric text-emerald-600 font-medium">{t.deliveryValue}</span>
            </div>
              <div className="flex justify-between pt-2 border-t border-border font-display text-base">
                <span>{t.total}</span>
                <span className="font-numeric text-primary">৳{toBn(total)}</span>
              </div>
            </div>

            {submitError && (
              <div className="sm:col-span-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2">
                {submitError}
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-full font-medium disabled:opacity-50 transition"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Placing order…" : ctaText || t.ctaFallback}
              </button>
              <p className="text-xs text-center text-muted-foreground mt-3 whitespace-pre-line">
                {securityNote}
              </p>
            </div>
          </div>
        </fieldset>
      </form>
    );
  },
);

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error && <div className="text-xs text-destructive mt-1">{error}</div>}
    </div>
  );
}
