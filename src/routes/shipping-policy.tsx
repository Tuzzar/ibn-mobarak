import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Truck, Package, Clock, ShieldCheck, CheckCircle2, Phone, MessageCircle, AlertCircle, Scale } from "lucide-react";
import { useContactInfo } from "@/lib/contact";

export const Route = createFileRoute("/shipping-policy")({
  component: ShippingPolicyPage,
  head: () => ({
    meta: [
      { title: "ডেলিভারি চার্জ ও শিপিং পলিসি — Ibn Mobarak Art Gallery" },
      {
        name: "description",
        content:
          "Ibn Mobarak Art Gallery ডেলিভারি চার্জের বিস্তারিত বিবরণ — ঢাকা ৳৮০, ঢাকার বাইরে ৳১৩০ এবং অতিরিক্ত ওজনের চার্জ নিয়মাবলী।",
      },
      { property: "og:title", content: "ডেলিভারি চার্জ ও শিপিং পলিসি — Ibn Mobarak Art Gallery" },
      {
        property: "og:description",
        content: "সারা বাংলাদেশে দ্রুত ও নিরাপদ হোম ডেলিভারি সেবা।",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/shipping-policy" }],
  }),
});

function ShippingPolicyPage() {
  const { phone, phoneHref, whatsappHref } = useContactInfo();

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-20">
      {/* Header Banner */}
      <section className="relative overflow-hidden bg-section-a border-b border-gold/20 py-8 md:py-12">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">হোম</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">ডেলিভারি চার্জ ও শিপিং পলিসি</span>
          </nav>

          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-gold/30 text-[11px] font-semibold text-primary">
              <Truck className="w-3.5 h-3.5 text-gold" />
              ক্যাশ অন ডেলিভারি ও দ্রুত শিপিং
            </span>
          </div>

          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-primary"
            style={{ fontFamily: "'Tiro Bangla', serif" }}
          >
            ডেলিভারি চার্জ ও শিপিং নীতিমালা
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Ibn Mobarak Art Gallery-এর প্রতিটি আর্ট পণ্য ও ক্যানভাস অত্যন্ত সুরক্ষামূলক প্যাকেজিং সহ আপনার দ্বারে পৌঁছে দেওয়া হয়।
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl px-4 sm:px-6 pt-10 md:pt-14 space-y-10">
        {/* Core Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inside Dhaka */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-gold/40 bg-background p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gold">ঢাকা সিটি</span>
                <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Tiro Bangla', serif" }}>
                  ঢাকার ভেতরে ডেলিভারি
                </h3>
              </div>
              <div className="text-right">
                <span className="text-3xl sm:text-4xl font-extrabold text-primary">৳৮০</span>
                <span className="block text-[11px] text-muted-foreground">১ কেজি পর্যন্ত ফিক্সড</span>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground border-t border-border/60 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>সময়সীমা: <strong>২ থেকে ৩ কর্মদিবস</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি (COD)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>পার্সেল ওজনের অতিরিক্ত চার্জ: প্রতি কেজিতে ৳২০</span>
              </li>
            </ul>
          </div>

          {/* Outside Dhaka */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-border/80 bg-background p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-primary">সারাদেশ</span>
                <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Tiro Bangla', serif" }}>
                  ঢাকার বাইরে ডেলিভারি
                </h3>
              </div>
              <div className="text-right">
                <span className="text-3xl sm:text-4xl font-extrabold text-primary">৳১৩০</span>
                <span className="block text-[11px] text-muted-foreground">১ কেজি পর্যন্ত ফিক্সড</span>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground border-t border-border/60 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>সময়সীমা: <strong>৩ থেকে ৫ কর্মদিবস</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>৬৪ জেলায় হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>পার্সেল ওজনের অতিরিক্ত চার্জ: প্রতি কেজিতে ৳২০</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Weight Surcharge Table & Explanation */}
        <div className="rounded-2xl border border-gold/30 bg-section-a/60 p-6 sm:p-8 shadow-sm">
          <div className="flex items-start gap-4 mb-5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-1">
              <Scale className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground" style={{ fontFamily: "'Tiro Bangla', serif" }}>
                ১ কেজির বেশি পার্সেলের জন্য অতিরিক্ত চার্জ নিয়ম
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                যেহেতু ক্যানভাস, বড় ফ্রেম, ভারি কালার সেট ও ইজেল ওজনে ভারি হয়ে থাকে, তাই কুরিয়ার সার্ভিসের অফিসিয়াল রেট অনুযায়ী <strong>১ কেজির বেশি ওজনের পার্সেলে প্রতি অতিরিক্ত কেজির জন্য ৳২০ যোগ হবে।</strong>
              </p>
            </div>
          </div>

          {/* Pricing Table */}
          <div className="overflow-x-auto rounded-xl border border-border bg-background shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/70 text-foreground uppercase tracking-wider text-[11px] font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-4 sm:px-6">পার্সেলের ওজন</th>
                  <th className="py-3 px-4 sm:px-6 text-primary">ঢাকার ভেতরে চার্জ</th>
                  <th className="py-3 px-4 sm:px-6 text-primary">ঢাকার বাইরে চার্জ</th>
                  <th className="py-3 px-4 sm:px-6">বিবরণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-medium">১ কেজি পর্যন্ত</td>
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-primary">৳ ৮০</td>
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-primary">৳ ১৩০</td>
                  <td className="py-3.5 px-4 sm:px-6 text-muted-foreground text-xs">বেসিক স্ট্যান্ডার্ড চার্জ</td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-medium">১.১ কেজি থেকে ২ কেজি</td>
                  <td className="py-3.5 px-4 sm:px-6 font-semibold">৳ ১০০</td>
                  <td className="py-3.5 px-4 sm:px-6 font-semibold">৳ ১৫০</td>
                  <td className="py-3.5 px-4 sm:px-6 text-muted-foreground text-xs">+৳২০ অতিরিক্ত কেজি চার্জ</td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-medium">২.১ কেজি থেকে ৩ কেজি</td>
                  <td className="py-3.5 px-4 sm:px-6 font-semibold">৳ ১২০</td>
                  <td className="py-3.5 px-4 sm:px-6 font-semibold">৳ ১৭০</td>
                  <td className="py-3.5 px-4 sm:px-6 text-muted-foreground text-xs">+৳৪০ অতিরিক্ত কেজি চার্জ</td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-medium">৩.১ কেজি থেকে ৪ কেজি</td>
                  <td className="py-3.5 px-4 sm:px-6 font-semibold">৳ ১৪০</td>
                  <td className="py-3.5 px-4 sm:px-6 font-semibold">৳ ১৯০</td>
                  <td className="py-3.5 px-4 sm:px-6 text-muted-foreground text-xs">+৳৬০ অতিরিক্ত কেজি চার্জ</td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-medium">৪.১ কেজি থেকে ৫ কেজি</td>
                  <td className="py-3.5 px-4 sm:px-6 font-semibold">৳ ১৬০</td>
                  <td className="py-3.5 px-4 sm:px-6 font-semibold">৳ ২১০</td>
                  <td className="py-3.5 px-4 sm:px-6 text-muted-foreground text-xs">+৳৮০ অতিরিক্ত কেজি চার্জ</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground italic flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-gold shrink-0" />
            <span>৫ কেজির বেশি বাল্ক অর্ডারের ক্ষেত্রে পার্সেল বুকিংয়ের পূর্বে কাস্টমার সাপোর্টের সাথে সমন্বয় করা হবে।</span>
          </div>
        </div>

        {/* Courier & Tracking Process */}
        <div className="rounded-2xl border border-border/80 bg-background p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-lg sm:text-xl font-bold text-foreground" style={{ fontFamily: "'Tiro Bangla', serif" }}>
            কুরিয়ার পার্টনার ও ট্র্যাকিং সুবিধা
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-section-a/60 border border-border/60">
              <Package className="w-5 h-5 text-primary mb-2" />
              <h4 className="text-sm font-semibold text-foreground">সুরক্ষিত বাবল প্যাকেজিং</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                ক্যানভাস ফ্রেম ও কালার টিউবগুলো মাল্টিপল লেয়ার বাবল র্যাপ ও শক্ত কার্টনে প্যাক করা হয়।
              </p>
            </div>

            <div className="p-4 rounded-xl bg-section-a/60 border border-border/60">
              <Truck className="w-5 h-5 text-primary mb-2" />
              <h4 className="text-sm font-semibold text-foreground">স্টেডফাস্ট কুরিয়ার পার্টনার</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                সরাসরি Steadfast Courier-এর মাধ্যমে পার্সেল পাঠানো হয় এবং ট্র্যাকিং লিঙ্ক SMS এর মাধ্যমে পাঠানো হয়।
              </p>
            </div>

            <div className="p-4 rounded-xl bg-section-a/60 border border-border/60">
              <ShieldCheck className="w-5 h-5 text-primary mb-2" />
              <h4 className="text-sm font-semibold text-foreground">চেক করে রিসিভ করার সুবিধা</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                ডেলিভারি ম্যানের সামনে পার্সেলটি চেক করে মূল্য পরিশোধ করার সম্পূর্ণ সুবিধা রয়েছে।
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="rounded-2xl border border-gold/30 bg-primary/5 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground" style={{ fontFamily: "'Tiro Bangla', serif" }}>
                ডেলিভারি সংক্রান্ত যেকোনো সহায়তার জন্য
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                আপনার পার্সেল স্ট্যাটাস বা স্পেশাল ডেলিভারি রিকোয়ারমেন্টের জন্য আমাদের সাথে কথা বলুন।
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href={phoneHref}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-gold/40 bg-background text-xs font-semibold text-foreground hover:border-gold hover:text-primary transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-gold" />
                <span>{phone}</span>
              </a>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
