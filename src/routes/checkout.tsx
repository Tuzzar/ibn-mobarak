import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Truck, ShieldCheck, Banknote, CheckCircle2, Gift } from "lucide-react";

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
  customer_name: z.string().trim().min(2, "আপনার পুরো নাম লিখুন").max(100),
  customer_phone: z
    .string()
    .trim()
    .regex(/^01[3-9]\d{8}$/, "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)"),
  district: z.string().trim().min(2, "আপনার জেলা নির্বাচন করুন"),
  address: z.string().trim().min(5, "বিস্তারিত ঠিকানা দিন (বাসা/রোড/এলাকা)").max(500),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

type DeliveryZone = "inside" | "outside";
const DELIVERY_FEES: Record<DeliveryZone, number> = { inside: 80, outside: 130 };
const FREE_DELIVERY_THRESHOLD = 2000;

export const BD_DISTRICTS = [
  "ঢাকা (Dhaka)", "চট্টগ্রাম (Chattogram)", "সিলেট (Sylhet)", "রাজশাহী (Rajshahi)",
  "খুলনা (Khulna)", "বরিশাল (Barishal)", "রংপুর (Rangpur)", "ময়মনসিংহ (Mymensingh)",
  "কুমিল্লা (Cumilla)", "গাজীপুর (Gazipur)", "নারায়ণগঞ্জ (Narayanganj)", "বগুড়া (Bogura)",
  "কক্সবাজার (Cox's Bazar)", "ফেনী (Feni)", "ব্রাহ্মণবাড়িয়া (Brahmanbaria)", "নোয়াখালী (Noakhali)",
  "চাঁদপুর (Chandpur)", "লক্ষ্মীপুর (Lakshmipur)", "নরসিংদী (Narsingdi)", "মানিকগঞ্জ (Manikganj)",
  "মুন্সীগঞ্জ (Munshiganj)", "টাঙ্গাইল (Tangail)", "কিশোরগঞ্জ (Kishoreganj)", "ফরিদপুর (Faridpur)",
  "মাদারীপুর (Madaripur)", "শরীয়তপুর (Shariatpur)", "গোপালগঞ্জ (Gopalganj)", "রাজবাড়ী (Rajbari)",
  "পাবনা (Pabna)", "সিরাজগঞ্জ (Sirajganj)", "নাটোর (Natore)", "নওগাঁ (Naogaon)",
  "চাঁপাইনবাবগঞ্জ (Chapai Nawabganj)", "জয়পুরহাট (Joypurhat)", "যশোর (Jashore)", "সাতক্ষীরা (Satkhira)",
  "কুষ্টিয়া (Kushtia)", "ঝিনাইদহ (Jhenaidah)", "চুয়াডাঙ্গা (Chuadanga)", "মেহেরপুর (Meherpur)",
  "বাগেরহাট (Bagerhat)", "মাগুরা (Magura)", "নড়াইল (Narail)", "পটুয়াখালী (Patuakhali)",
  "পিরোজপুর (Pirojpur)", "ভোলা (Bhola)", "বরগুনা (Barguna)", "ঝালকাঠি (Jhalakathi)",
  "দিনাজপুর (Dinajpur)", "ঠাকুরগাঁও (Thakurgaon)", "পঞ্চগড় (Panchagarh)", "নীলফামারী (Nilphamari)",
  "গাইবান্ধা (Gaibandha)", "কুড়িগ্রাম (Kurigram)", "লালমনিরহাট (Lalmonirhat)", "হবিগঞ্জ (Habiganj)",
  "মৌলভীবাজার (Moulvibazar)", "সুনামগঞ্জ (Sunamganj)", "নেত্রকোণা (Netrokona)", "জামালপুর (Jamalpur)",
  "শেরপুর (Sherpur)"
];

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const placeOrderFn = useServerFn(placeOrder);
  const [submitting, setSubmitting] = useState(false);
  const [zone, setZone] = useState<DeliveryZone>("inside");
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    district: "ঢাকা (Dhaka)",
    address: "",
    notes: "",
  });

  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
  const baseDeliveryFee = DELIVERY_FEES[zone];
  const deliveryFee = isFreeDelivery ? 0 : baseDeliveryFee;
  const total = subtotal + deliveryFee;

  const handleDistrictChange = (selected: string) => {
    const isDhaka = selected.includes("ঢাকা") || selected.includes("Dhaka");
    setForm({ ...form, district: selected });
    setZone(isDhaka ? "inside" : "outside");
  };

  const fullDeliveryAddress = `${form.district ? form.district + ", " : ""}${form.address}`;

  const { markConverted } = useIncompleteOrderTracker({
    customer_name: form.customer_name,
    customer_phone: form.customer_phone,
    address: fullDeliveryAddress,
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
        <span className="block text-[11px] uppercase tracking-[0.32em] text-gold mb-3">চেকআউট</span>
        <h1 className="font-display text-3xl text-foreground">আপনার কার্ট এখনো খালি</h1>
        <div className="mt-4 mx-auto h-px w-16 bg-gold/60" />
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-gold hover:text-gold-foreground transition-colors"
        >
          কালেকশন দেখুন
        </Link>
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
          address: `${parsed.data.district}, ${parsed.data.address}`,
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
      toast.error(error instanceof Error ? error.message : "অর্ডার প্লেস করা সম্ভব হয়নি। আবার চেষ্টা করুন।");
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
    toast.success("অর্ডার সফলভাবে সম্পন্ন হয়েছে! শীঘ্রই কনফার্মেশন কল দেওয়া হবে।");
    navigate({ to: "/order-success", search: { id: orderId } });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-6xl py-12 md:py-16">
      <header className="mb-8 md:mb-10">
        <span className="block text-[11px] uppercase tracking-[0.32em] text-gold mb-2 font-semibold">
          নিরাপদ চেকআউট
        </span>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground">
          অর্ডার সম্পন্ন করুন
        </h1>
        <div className="mt-3 h-px w-16 bg-gold/60" />
      </header>

      {/* Free delivery banner if qualified */}
      {isFreeDelivery && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
          <Gift className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            🎉 অভিনন্দন! আপনার কার্ট ৳২,০০০ অতিক্রম করায় <strong>ফ্রি ডেলিভারি</strong> সক্রিয় হয়েছে!
          </span>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="font-display text-xl sm:text-2xl text-primary flex items-center gap-2 mb-6">
              <Truck className="w-5 h-5 text-gold" />
              ডেলিভারি তথ্য
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              <Field
                label="আপনার পুরো নাম"
                placeholder="যেমন: মোহাম্মদ আব্দুল্লাহ"
                value={form.customer_name}
                onChange={(v) => setForm({ ...form, customer_name: v })}
                required
              />

              <Field
                label="১১ ডিজিটের মোবাইল নম্বর"
                placeholder="01XXXXXXXXX"
                value={form.customer_phone}
                onChange={(v) => setForm({ ...form, customer_phone: v })}
                required
                type="tel"
              />

              {/* District Dropdown */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-[0.2em] text-gold mb-2 font-semibold">
                  জেলা নির্বাচন করুন <span className="text-destructive">*</span>
                </label>
                <select
                  value={form.district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors text-sm"
                >
                  {BD_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Zone Radio Cards */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-[0.2em] text-gold mb-2 font-semibold">
                  ডেলিভারি এলাকা <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    { id: "inside", label: "ঢাকা সিটির ভেতরে", fee: 80 },
                    { id: "outside", label: "ঢাকার বাইরে (সমগ্র বাংলাদেশ)", fee: 130 },
                  ] as const).map((opt) => {
                    const active = zone === opt.id;
                    const finalFee = isFreeDelivery ? 0 : opt.fee;
                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center justify-between gap-2 px-4 py-3 border rounded-xl cursor-pointer transition ${
                          active
                            ? "border-gold bg-gold/10 ring-1 ring-gold"
                            : "border-input bg-background hover:border-gold/40"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center ${
                              active ? "border-gold" : "border-muted-foreground/40"
                            }`}
                          >
                            {active && <span className="w-2 h-2 rounded-full bg-gold" />}
                          </span>
                          <span className="text-xs font-semibold truncate">{opt.label}</span>
                        </span>
                        <span className="text-xs font-bold text-primary shrink-0">
                          {isFreeDelivery ? "ফ্রি" : formatBDT(finalFee)}
                        </span>
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

              {/* Detailed Address */}
              <div className="sm:col-span-2">
                <Field
                  label="বিস্তারিত ঠিকানা (বাসা/রোড/এলাকা/উপজেলা)"
                  placeholder="যেমন: বাড়ি নং ১২, রোড ৪, সেক্টর ৭, উত্তরা, ঢাকা"
                  value={form.address}
                  onChange={(v) => setForm({ ...form, address: v })}
                  required
                />
              </div>

              {/* Order Notes */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-[0.2em] text-gold mb-2 font-semibold">
                  বিশেষ নির্দেশনা (অপশনাল)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="প্যাকেজিং বা ডেলিভারি নিয়ে কোনো বিশেষ নির্দেশনা থাকলে লিখুন..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors text-sm"
                />
              </div>
            </div>
          </div>

          {/* Trust Guarantees Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 flex items-center gap-3">
              <Banknote className="w-5 h-5 text-gold shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-foreground">ক্যাশ অন ডেলিভারি</p>
                <p className="text-muted-foreground">পণ্য হাতে পেয়ে মূল্য পরিশোধ</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-gold shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-foreground">১০০% আসল পণ্য</p>
                <p className="text-muted-foreground">যাচাইকৃত কোয়ালিটি</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 flex items-center gap-3">
              <Truck className="w-5 h-5 text-gold shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-foreground">নিরাপদ ট্রানজিট</p>
                <p className="text-muted-foreground">বাবল-র‍্যাপ প্রোটেকশন</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Right Column */}
        <div className="lg:col-span-5">
          <aside className="bg-card p-6 sm:p-7 rounded-3xl border border-gold/40 shadow-md lg:sticky lg:top-28">
            <span className="block text-[11px] uppercase tracking-[0.28em] text-gold mb-2 font-semibold">
              অর্ডার বিবরণী
            </span>
            <h2 className="font-display text-2xl text-foreground">
              আপনার নির্বাচিত পণ্যসমূহ
            </h2>
            <div className="mt-3 h-px w-10 bg-gold/60" />

            <ul className="mt-5 space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between items-center gap-3 text-sm pb-2 border-b border-border/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{i.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.quantity} × {formatBDT(i.price)}
                    </p>
                  </div>
                  <span className="font-semibold text-foreground shrink-0">
                    {formatBDT(i.price * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t border-border my-4" />
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">সাবটোটাল</dt>
                <dd className="font-medium">{formatBDT(subtotal)}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">ডেলিভারি চার্জ</dt>
                <dd className="font-medium">
                  {isFreeDelivery ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full text-xs">
                      ফ্রি ডেলিভারি
                    </span>
                  ) : (
                    formatBDT(deliveryFee)
                  )}
                </dd>
              </div>
            </dl>

            <div className="border-t border-gold/30 my-4" />
            <div className="flex justify-between items-baseline font-display text-2xl">
              <span className="text-foreground">সর্বমোট মূল্য</span>
              <span className="text-primary font-bold">{formatBDT(total)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              * কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই, ডেলিভারির সময় মূল্য পরিশোধ করবেন।
            </p>

            <button
              disabled={submitting}
              type="submit"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground py-3.5 rounded-full font-bold text-sm disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
            >
              {submitting && <Spinner className="w-4 h-4" />}
              {submitting ? "অর্ডার পাঠানো হচ্ছে…" : "অর্ডার নিশ্চিত করুন (ক্যাশ অন ডেলিভারি)"}
            </button>
          </aside>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-[0.2em] text-gold mb-2 font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors text-sm"
      />
    </div>
  );
}
