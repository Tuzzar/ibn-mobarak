import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, ShieldCheck, FileText, CheckCircle2, AlertCircle, Phone, MessageCircle, HelpCircle } from "lucide-react";
import { useContactInfo } from "@/lib/contact";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "শর্তাবলী ও নিয়ম (Terms & Conditions) — Ibn Mobarak Art Gallery" },
      {
        name: "description",
        content:
          "Ibn Mobarak Art Gallery-এর শর্তাবলী, অর্ডার পলিসি, পেমেন্ট, ডেলিভারি ও রিটার্ন সংক্রান্ত বিস্তারিত নিয়মাবলী।",
      },
      { property: "og:title", content: "শর্তাবলী ও নিয়ম — Ibn Mobarak Art Gallery" },
      {
        property: "og:description",
        content: "আমাদের সেবা গ্রহণ এবং পণ্য ক্রয়ের পূর্বে নিয়ম ও নীতিমালা পড়ে নিন।",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
});

function TermsPage() {
  const { phone, phoneHref, whatsappHref, address } = useContactInfo();

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-20">
      {/* Header */}
      <section className="relative overflow-hidden bg-section-a border-b border-gold/20 py-8 md:py-12">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">হোম</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">শর্তাবলী ও নিয়ম</span>
          </nav>

          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-gold/30 text-[11px] font-semibold text-primary">
              <FileText className="w-3.5 h-3.5 text-gold" />
              আইনি নির্দেশিকা ও গ্রাহক সেবা
            </span>
          </div>

          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-primary"
            style={{ fontFamily: "'Tiro Bangla', serif" }}
          >
            শর্তাবলী ও নিয়মাবলী (Terms & Conditions)
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Ibn Mobarak Art Gallery-তে আপনাকে স্বাগতম। আমাদের ওয়েবসাইট ব্যবহার ও পণ্য অর্ডারের পূর্বে অনুগ্রহ করে নিচের শর্তাবলী মনোযোগ সহকারে পড়ুন।
          </p>
          <div className="mt-3 text-[11px] text-muted-foreground">
            সর্বশেষ আপডেট: সেপ্টেম্বর ২০২৬
          </div>
        </div>
      </section>

      {/* Content Body */}
      <main className="container mx-auto max-w-4xl px-4 sm:px-6 pt-10 md:pt-14 space-y-10">
        {/* Section 1 */}
        <div className="rounded-2xl border border-border/80 bg-background p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
              ১
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground" style={{ fontFamily: "'Tiro Bangla', serif" }}>
              সাধারণ শর্তাবলী ও গ্রহণযোগ্যতা
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3 pl-11">
            <p>
              Ibn Mobarak Art Gallery ওয়েবসাইট ব্যবহার করে যেকোনো অর্ডার প্রদান করার অর্থ হলো আপনি আমাদের সকল নিয়ম, নীতিমালা এবং শর্তাবলী নিঃশর্তভাবে মেনে নিয়েছেন।
            </p>
            <p>
              আমরা যেকোনো সময় পূর্ব নোটিশ ছাড়াই শর্তাবলীতে পরিবর্তন বা পরিমার্জন আনার অধিকার সংরক্ষণ করি। সংশোধিত শর্তাবলী ওয়েবসাইটে প্রকাশের সাথে সাথে কার্যকর হবে।
            </p>
          </div>
        </div>

        {/* Section 2 */}
        <div className="rounded-2xl border border-border/80 bg-background p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
              ২
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground" style={{ fontFamily: "'Tiro Bangla', serif" }}>
              পণ্য বিবরণ, দাম ও স্টক প্রাপ্যতা
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3 pl-11">
            <p>
              আমরা ওয়েবসাইটে প্রতিটি আর্ট মেটেরিয়াল, ব্রাশ, ক্যানভাস ও ক্যালিগ্রাফির সঠিক ছবি ও বিবরণ দেওয়ার সর্বোচ্চ চেষ্টা করি। তবে মনিটরের কালার সেটিংস বা আলোকচিত্রের ভিন্নতার কারণে পণ্যের রঙে সামান্য পার্থক্য দৃশ্যমান হতে পারে।
            </p>
            <p>
              পণ্যের মূল্য যেকোনো সময় বাজারদর বা আমদানির তারতম্যের ওপর ভিত্তি করে পরিবর্তিত হতে পারে। তবে অর্ডার কনফার্ম হয়ে গেলে সেই অর্ডারের পণ্যের মূল্য অপরিবর্তিত থাকবে।
            </p>
            <p>
              কোনো পণ্য স্টক শেষ হয়ে গেলে আমরা গ্রাহককে দ্রুত অবহিত করে বিকল্প সমাধান বা অর্ডার বাতিল করার পূর্ণ স্বাধীনতা প্রদান করি।
            </p>
          </div>
        </div>

        {/* Section 3 */}
        <div className="rounded-2xl border border-border/80 bg-background p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
              ৩
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground" style={{ fontFamily: "'Tiro Bangla', serif" }}>
              অর্ডার প্রক্রিয়া ও নিশ্চিতকরণ
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3 pl-11">
            <p>
              অর্ডার সফলভাবে প্লেস হওয়ার পর আমাদের কাস্টমার সাপোর্ট টিম থেকে ফোন কল অথবা WhatsApp মেসেজের মাধ্যমে অর্ডার ভেরিফাই ও কনফার্ম করা হতে পারে।
            </p>
            <p>
              ভুল নাম, অসম্পূর্ণ ঠিকানা বা ভুল ফোন নম্বর প্রদানের কারণে পার্সেল ডেলিভারি বিলম্বিত বা বাতিল হলে তার দায়ভার গ্রাহকের ওপর বর্তাবে।
            </p>
            <p>
              কাস্টম ক্যালিগ্রাফি বা বিশেষ ফ্রেম তৈরির ক্ষেত্রে পার্সিয়াল বা ফুল অ্যাডভান্স পেমেন্ট প্রযোজ্য হতে পারে।
            </p>
          </div>
        </div>

        {/* Section 4 */}
        <div className="rounded-2xl border border-border/80 bg-background p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
              ৪
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground" style={{ fontFamily: "'Tiro Bangla', serif" }}>
              শিপিং ও ডেলিভারি নীতিমালা
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3 pl-11">
            <p>
              আমরা বিশ্বস্ত কুরিয়ার সার্ভিসের (যেমন: Steadfast Courier) মাধ্যমে ঢাকা সহ সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা প্রদান করি।
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-foreground/80">
              <li><strong>ঢাকা সিটির ভেতরে ডেলিভারি চার্জ:</strong> ৳৮০ (১ কেজি পর্যন্ত ফিক্সড)।</li>
              <li><strong>ঢাকার বাইরে সারাদেশের ডেলিভারি চার্জ:</strong> ৳১৩০ (১ কেজি পর্যন্ত ফিক্সড)।</li>
              <li><strong>অতিরিক্ত ওজনের চার্জ:</strong> পার্সেলের মোট ওজন ১ কেজির বেশি হলে প্রতি অতিরিক্ত কেজির জন্য ৳২০ হারে কুরিয়ার ফি যোগ হবে।</li>
            </ul>
            <p>
              বিস্তারিত জানার জন্য আমাদের{" "}
              <Link to="/shipping-policy" className="text-primary font-semibold underline underline-offset-4">
                ডেলিভারি চার্জ ও শিপিং পলিসি
              </Link>{" "}
              পৃষ্ঠাটি ভিজিট করুন।
            </p>
          </div>
        </div>

        {/* Section 5 */}
        <div className="rounded-2xl border border-border/80 bg-background p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
              ৫
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground" style={{ fontFamily: "'Tiro Bangla', serif" }}>
              রিটার্ন ও রিপ্লেসমেন্ট নীতিমালা
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3 pl-11">
            <p>
              ডেলিভারি ম্যানের উপস্থিতিতে পার্সেল খুলে পণ্যটি চেক করে রিসিভ করার অনুরোধ করা হচ্ছে।
            </p>
            <p>
              যদি কোনো পণ্য ভাঙা, ক্ষতিগ্রস্ত বা ভুল পণ্য পাওয়া যায়, তবে ডেলিভারি ম্যানের সামনেই আমাদের হটলাইনে কল দিয়ে পার্সেলটি রিটার্ন করতে পারবেন অথবা ২৪ ঘণ্টার মধ্যে ছবি/ভিডিও সহ WhatsApp এ জানাতে হবে।
            </p>
            <p>
              ব্যবহৃত বা গ্রাহকের অসাবধানতায় ক্ষতিগ্রস্ত পণ্যের ক্ষেত্রে কোনো প্রকার রিটার্ন বা রিফান্ড প্রযোজ্য হবে না।
            </p>
          </div>
        </div>

        {/* Section 6 */}
        <div className="rounded-2xl border border-border/80 bg-background p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
              ৬
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground" style={{ fontFamily: "'Tiro Bangla', serif" }}>
              বৌদ্ধিক সম্পত্তি (Intellectual Property)
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3 pl-11">
            <p>
              Ibn Mobarak Art Gallery ওয়েবসাইটে প্রদর্শিত সকল মৌলিক ইসলামিক ক্যালিগ্রাফি, আর্টওয়ার্ক, লোগো, গ্রাফিক্স এবং কনটেন্ট আমাদের মেধাস্বত্ব আইনের অধীন। অনুমতি ছাড়া কোনো কনটেন্ট বাণিজ্যিক উদ্দেশ্যে নকল বা প্রচার করা সম্পূর্ণ নিষিদ্ধ।
            </p>
          </div>
        </div>

        {/* Help & Contact Card */}
        <div className="rounded-2xl border border-gold/30 bg-section-a/60 p-6 sm:p-8 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <HelpCircle className="w-5 h-5 text-gold" />
            <h3 className="text-base sm:text-lg font-bold text-foreground" style={{ fontFamily: "'Tiro Bangla', serif" }}>
              কোনো প্রশ্ন বা জিজ্ঞাসা আছে?
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
            আমাদের শর্তাবলী বা কোনো অর্ডার সম্পর্কিত যেকোনো তথ্যের জন্য সরাসরি আমাদের সাথে যোগাযোগ করতে পারেন:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <a
              href={phoneHref}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-background hover:border-gold/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">হটলাইন কল</span>
                <span className="font-semibold text-foreground font-mono">{phone}</span>
              </div>
            </a>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-background hover:border-emerald-500/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">হোয়াটসঅ্যাপ সাপোর্ট</span>
                <span className="font-semibold text-foreground">সরাসরি চ্যাট করুন</span>
              </div>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
