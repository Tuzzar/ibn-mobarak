import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Palette, Paintbrush, Layers, Package, Quote, ArrowRight, ShieldCheck, Truck, HandHeart, MapPin } from "lucide-react";
import { siteContentOptions } from "@/lib/queries";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "আমাদের গল্প — Ibn Mobarak Art Gallery" },
      {
        name: "description",
        content:
          "Ibn Mobarak Art Gallery — ক্যানভাস, অ্যাক্রিলিক কালার, ক্যালিগ্রাফি ও আর্ট সামগ্রীর নির্বাচিত সংগ্রহ।",
      },
      { property: "og:title", content: "আমাদের গল্প — Ibn Mobarak Art Gallery" },
      {
        property: "og:description",
        content: "Ibn Mobarak Art Gallery — শিল্প ও নান্দনিকতার নির্ভরযোগ্য ঠিকানা।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
});

const FALLBACK = {
  about_brand_intro_1:
    "Ibn Mobarak Art Gallery গড়ে উঠেছে একটি বিশেষ উদ্দেশ্য নিয়ে — বাংলাদেশের শিল্পী, ক্যালিগ্রাফার এবং আর্টপ্রেমীদের হাতে সেরা মানের আন্তর্জাতিক আর্ট সামগ্রী ও কাস্টম ক্যালিগ্রাফি পৌঁছে দেওয়া।",
  about_brand_intro_2:
    "অ্যাক্রিলিক কালার, নিখুঁত কটন ক্যানভাস, ফাইন-লাইন ব্রাশ থেকে শুরু করে কাঠের ইজেল — আমাদের প্রতিটি প্রোডাক্ট আপনার সৃজনশীলতাকে দেয় নতুন মাত্রা।",
  about_founder_photo: "",
  about_founder_name: "Ibn Mobarak Art Gallery",
  about_founder_tagline: "আর্টিস্ট · কিউরেটর · আর্ট হাব",
  about_founder_bio:
    "যাত্রাবাড়ী, ঢাকায় অবস্থিত একটি সমৃদ্ধ আর্ট স্টুডিও ও গ্যালারি — যেখানে প্রতিটি আর্টিস্ট মেটেরিয়াল ও ক্যালিগ্রাফি যত্ন নিয়ে যাচাই করে আপনার জন্য প্রস্তুত করা হয়।",
  about_article_heading: "গ্যালারি থেকে একটি চিঠি",
  about_article_body: "",
  about_pull_quote: "শিল্প ও নান্দনিকতার নির্ভরযোগ্য ঠিকানা।",
  about_pillar_1_title: "অথেনটিক মেটেরিয়াল",
  about_pillar_1_desc: "বিশ্বমানের অরিজিনাল ব্র্যান্ডের আর্ট কালার ও ব্রাশ — কোয়ালিটিতে নো কম্প্রোমাইজ।",
  about_pillar_2_title: "প্রিমিয়াম ক্যানভাস",
  about_pillar_2_desc: "১০০% কটন হেভি-ডিউটি ক্যানভাস ও পাইনউড ফ্রেম — দীর্ঘস্থায়ী ও মজবুত।",
  about_pillar_3_title: "ক্যালিগ্রাফি আর্ট",
  about_pillar_3_desc: "অভিজ্ঞ ক্যালিগ্রাফারদের নিখুঁত হাতের কাজ ও ইসলামিক ফ্রেম কালেকশন।",
  about_pillar_4_title: "সুরক্ষিত প্যাকেজিং",
  about_pillar_4_desc: "মাল্টি-লেয়ার বাবল র্যাপ প্রোটেকশনে প্রতিটি ক্যানভাস পৌঁছায় অক্ষত অবস্থায়।",
  about_stat_1_value: "৪৩K+",
  about_stat_1_label: "ফেসবুক ফলোয়ার্স",
  about_stat_2_value: "১০০%",
  about_stat_2_label: "পজিটিভ রেকমেন্ডেশন",
  about_stat_3_value: "৬৪",
  about_stat_3_label: "জেলায় ডেলিভারি",
  about_promise_1_title: "অরিজিনাল আর্ট সামগ্রী",
  about_promise_1_desc: "আন্তর্জাতিক মানের কালার, নিখুঁত ক্যানভাস ও ব্রাশ — প্রতিটি পণ্যে শতভাগ বিশুদ্ধতা।",
  about_promise_2_title: "শিল্পী ও ক্যালিগ্রাফারদের পছন্দ",
  about_promise_2_desc: "অভিজ্ঞ শিল্পীদের পরামর্শ ও যাচাইকৃত মেটেরিয়াল সরবরাহ।",
  about_promise_3_title: "নিরাপদ প্যাকেজিং ও ডেলিভারি",
  about_promise_3_desc: "সারা বাংলাদেশে বাবল-র্যাপড সুরক্ষিত শিপিং ও দ্রুত ক্যাশ অন ডেলিভারি।",
};

function pick(map: Record<string, string> | undefined, key: keyof typeof FALLBACK) {
  const v = map?.[key];
  return v && v.trim().length > 0 ? v : FALLBACK[key];
}

function About() {
  const { data } = useQuery(siteContentOptions());
  const c = (k: keyof typeof FALLBACK) => pick(data, k);

  const paragraphs = c("about_article_body")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const photo = c("about_founder_photo");
  const pullQuote = c("about_pull_quote");

  const pillars = [
    { icon: Paintbrush, title: c("about_pillar_1_title"), desc: c("about_pillar_1_desc") },
    { icon: Layers, title: c("about_pillar_2_title"), desc: c("about_pillar_2_desc") },
    { icon: Palette, title: c("about_pillar_3_title"), desc: c("about_pillar_3_desc") },
    { icon: Package, title: c("about_pillar_4_title"), desc: c("about_pillar_4_desc") },
  ];

  const stats = [
    { value: c("about_stat_1_value"), label: c("about_stat_1_label") },
    { value: c("about_stat_2_value"), label: c("about_stat_2_label") },
    { value: c("about_stat_3_value"), label: c("about_stat_3_label") },
  ];

  const chapters = [
    {
      kicker: "Chapter 01",
      year: "সূচনা",
      title: "একটি ভাবনা থেকে জন্ম",
      body: c("about_brand_intro_1"),
    },
    {
      kicker: "Chapter 02",
      year: "স্টুডিও",
      title: c("about_founder_name"),
      body: c("about_founder_bio"),
      tag: c("about_founder_tagline"),
      image: photo,
    },
    {
      kicker: "Chapter 03",
      year: "আজ",
      title: "হাতে গড়া, ছোট ব্যাচে",
      body: c("about_brand_intro_2"),
    },
  ];

  const promises = [
    { icon: ShieldCheck, title: c("about_promise_1_title"), desc: c("about_promise_1_desc") },
    { icon: HandHeart, title: c("about_promise_2_title"), desc: c("about_promise_2_desc") },
    { icon: Truck, title: c("about_promise_3_title"), desc: c("about_promise_3_desc") },
  ];

  return (
    <div className="bg-background overflow-hidden">
      {/* 1. HERO — emerald wash + gold accents */}
      <section className="relative">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(70%_55%_at_15%_0%,oklch(0.42_0.08_160/0.10),transparent_65%),radial-gradient(50%_45%_at_90%_20%,oklch(0.83_0.10_75/0.20),transparent_70%)]"
        />
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-20 md:pt-32 pb-16 md:pb-24">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-3 mb-6">
                <span className="h-px w-10 bg-gold" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-medium">Our Story</span>
                <span className="h-px w-10 bg-gold" />
              </div>
              <h1 className="font-display text-[40px] sm:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[1] tracking-tight">
                শালীনতায়
                <br />
                <em className="text-primary not-italic">আভিজাত্য</em>
                <br />
                <span className="relative inline-block text-3xl sm:text-4xl lg:text-5xl italic text-foreground/70">
                  — a quiet luxury.
                  <span className="absolute -bottom-1 left-0 right-0 h-[6px] bg-gold/25 -z-10" />
                </span>
              </h1>
              <p className="mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                {c("about_brand_intro_1")}
              </p>
            </div>

            <aside className="lg:col-span-5 lg:pl-10 lg:border-l lg:border-gold/30">
              <div className="grid grid-cols-3 gap-6 lg:block lg:space-y-8">
                {stats.map((s, i) => (
                  <div key={i} className="lg:flex lg:items-baseline lg:gap-5">
                    <div className="font-display text-3xl md:text-4xl lg:text-5xl text-primary lg:w-28">
                      {s.value}
                    </div>
                    <div className="mt-1 lg:mt-0 text-[11px] md:text-xs uppercase tracking-[0.24em] text-muted-foreground leading-tight">
                      <span className="hidden lg:block h-px w-8 bg-gold/60 mb-2" />
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* 2. ETHOS BAND — pull quote on cream */}
      <section className="relative bg-[var(--section-a)] border-y border-gold/20">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-20 md:py-28">
          <figure className="relative text-center">
            <Quote className="mx-auto w-8 h-8 md:w-10 md:h-10 text-gold/70" strokeWidth={1.5} />
            <blockquote className="mt-6 font-display text-[2rem] sm:text-4xl md:text-6xl leading-[1.08] tracking-tight text-foreground">
              <span className="text-gold">“</span>
              {pullQuote}
              <span className="text-gold">”</span>
            </blockquote>
            <figcaption className="mt-8 inline-flex items-center gap-3">
              <span className="h-px w-8 bg-gold" />
              <span className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                {c("about_founder_name")}
              </span>
              <span className="h-px w-8 bg-gold" />
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 3. JOURNEY — vertical elegant timeline */}
      <section className="relative py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="text-center mb-16 md:mb-20">
            <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-medium">The Journey</span>
            <h2 className="font-display text-4xl md:text-5xl mt-3 leading-tight">আমাদের পথচলা</h2>
            <div className="mx-auto mt-5 h-px w-16 bg-gold" />
          </div>

          <ol className="relative">
            <span
              aria-hidden
              className="absolute left-6 md:left-1/2 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent md:-translate-x-1/2"
            />

            {chapters.map((ch, i) => (
              <li
                key={i}
                className={`relative pl-16 md:pl-0 md:grid md:grid-cols-2 md:gap-16 items-start ${
                  i === 0 ? "" : "mt-14 md:mt-20"
                }`}
              >
                {/* node */}
                <span
                  aria-hidden
                  className="absolute left-6 md:left-1/2 top-2 -translate-x-1/2 w-4 h-4 rounded-full bg-gold ring-4 ring-background z-10 shadow-[0_0_0_1px_oklch(0.42_0.08_160/0.3)]"
                />

                {/* left side (year badge on desktop) */}
                <div className={`${i % 2 === 0 ? "md:text-right md:pr-10" : "md:order-2 md:pl-10"}`}>
                  <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-gold font-medium">
                    {ch.kicker}
                  </span>
                  <div className="font-display text-2xl md:text-3xl text-primary mt-2">{ch.year}</div>
                </div>

                {/* right side (content) */}
                <div className={`mt-4 md:mt-0 ${i % 2 === 0 ? "md:pl-10" : "md:order-1 md:text-right md:pr-10"}`}>
                  <h3 className="font-display text-2xl md:text-[1.75rem] leading-tight">{ch.title}</h3>
                  {ch.tag && (
                    <p className="mt-2 text-sm text-primary/70 tracking-wide">{ch.tag}</p>
                  )}
                  <p className="mt-4 text-muted-foreground leading-relaxed text-[15px] md:text-[16px]">
                    {ch.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 4. LONG-FORM ARTICLE (optional, only if DB has content) */}
      {paragraphs.length > 0 && (
        <section className="container mx-auto px-6 max-w-3xl pb-4 md:pb-8">
          <div className="border-t border-gold/20 pt-16 md:pt-20">
            <div className="text-center mb-10">
              <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-medium">A Letter</span>
              <h2 className="font-display text-3xl md:text-5xl mt-3">{c("about_article_heading")}</h2>
              <div className="mx-auto mt-5 h-px w-12 bg-gold" />
            </div>
            <div className="space-y-6 text-foreground/90 leading-[1.9] text-[16px] md:text-[18px]">
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? "first-letter:font-display first-letter:text-6xl first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-primary"
                      : ""
                  }
                >
                  {p}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. CRAFT PILLARS — 4-column ledger */}
      <section className="container mx-auto px-4 sm:px-6 max-w-6xl py-20 md:py-28">
        <div className="text-center mb-14 md:mb-16">
          <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-medium">The Craft</span>
          <h2 className="font-display text-4xl md:text-5xl mt-3 leading-tight">আমাদের পণ্যের মান ও বৈশিষ্ট্য</h2>
          <div className="mx-auto mt-5 h-px w-16 bg-gold" />
          <p className="mt-6 text-muted-foreground max-w-2xl mx-auto text-[15px] md:text-base leading-relaxed">
            চারটি মৌলিক অঙ্গীকার — যা ইবনে মোবারক আর্ট গ্যালারির প্রতিটি ক্যানভাস, কালার ও আর্টওয়ার্ককে করে তোলে নির্ভরযোগ্য।
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-7">
          {pillars.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={i}
              className="group relative bg-card border border-gold/20 rounded-2xl p-7 md:p-8 shadow-[var(--shadow-card)] hover:border-gold/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <span className="font-display text-2xl text-gold/80">0{i + 1}</span>
                <div className="w-11 h-11 rounded-full bg-[var(--section-a)] border border-gold/30 flex items-center justify-center group-hover:border-gold transition">
                  <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="font-display text-xl md:text-2xl mt-10">{title}</h3>
              <div className="mt-3 h-px w-8 bg-gold/50 group-hover:w-14 transition-all duration-500" />
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. REAL STUDIO & COMMUNITY SHOWCASE */}
      <section className="relative py-16 md:py-24 bg-[var(--section-a)] border-y border-gold/20">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl overflow-hidden border-2 border-gold/30 shadow-xl group">
                <img
                  src="/studio.jpg"
                  alt="Ibn Mobarak Art Gallery Studio & Workspace"
                  className="w-full h-[360px] sm:h-[420px] object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold text-gold-foreground text-xs font-bold uppercase tracking-wider w-fit">
                    <MapPin className="w-3.5 h-3.5" />
                    যাত্রাবাড়ী, ঢাকা
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold mt-3">
                    আমাদের ফিজিক্যাল স্টুডিও ও গ্যালারি
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80 mt-1">
                    House 37/3, Rasulpur R/A, Donia, Jatrabari, Dhaka 1236
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-3">
                <span className="h-px w-10 bg-gold" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-medium">
                  Studio & Community
                </span>
                <span className="h-px w-10 bg-gold" />
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-tight">
                শিল্পীদের বিশ্বস্ত ঠিকানা — <em className="text-primary not-italic">অনলাইন ও অফলাইনে</em>
              </h2>
              <p className="text-muted-foreground text-[15px] sm:text-base leading-relaxed">
                শুধু একটি অনলাইন শপ নয়, ইবনে মোবারক আর্ট গ্যালারি একটি সমৃদ্ধ আর্ট হাব। যেখানে রয়েছে আন্তর্জাতিক মানের অ্যাক্রিলিক কালার, ক্যানভাস বোর্ড, ইজেল, ক্যালিগ্রাফি ফ্রেম ও আর্ট মেটেরিয়ালসের পরিপূর্ণ সম্ভার।
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-card border border-gold/25 rounded-2xl p-5 shadow-sm">
                  <div className="font-display text-3xl font-bold text-primary">৪৩,০০০+</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">ফেসবুক অনুসারী</div>
                  <p className="text-xs text-foreground/70 mt-2">সারা দেশের সৃজনশীল শিল্পী ও ক্যালিগ্রাফারদের ঐক্য</p>
                </div>
                <div className="bg-card border border-gold/25 rounded-2xl p-5 shadow-sm">
                  <div className="font-display text-3xl font-bold text-primary">১০০% পজিটিভ</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">২৬৯+ ভেরিফাইড রিভিউ</div>
                  <p className="text-xs text-foreground/70 mt-2">আর্টিস্টদের শতভাগ সন্তুষ্টি ও নির্ভরতা</p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href="https://www.facebook.com/ibnartgallery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition shadow-md"
                >
                  <span>আমাদের ফেসবুক পেজ</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-gold text-primary hover:bg-gold hover:text-gold-foreground text-sm font-semibold transition"
                >
                  <span>স্টুডিও ভিজিট করুন</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PROMISE BAND — dark emerald strip */}
      <section className="relative bg-primary text-primary-foreground overflow-hidden">
        <span aria-hidden className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gold/15 blur-3xl" />
        <span aria-hidden className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl py-16 md:py-20 relative">
          <div className="text-center mb-12">
            <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-medium">Our Promise</span>
            <h2 className="font-display text-3xl md:text-4xl mt-3 text-primary-foreground">আমাদের প্রতিশ্রুতি</h2>
            <div className="mx-auto mt-4 h-px w-14 bg-gold" />
          </div>
          <div className="grid sm:grid-cols-3 gap-8 md:gap-10">
            {promises.map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary-foreground/5 border border-gold/40 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-gold" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl md:text-2xl mt-5 text-primary-foreground">{title}</h3>
                <p className="mt-3 text-sm text-primary-foreground/75 leading-relaxed max-w-xs mx-auto">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CTA — cream card, gold border */}
      <section className="relative py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="relative rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-[var(--section-a)] border-2 border-gold/30 px-8 py-14 md:px-16 md:py-20 text-center shadow-[var(--shadow-card)]">
            <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-medium">Explore Collection</span>
            <h2 className="font-display text-3xl md:text-5xl mt-4 leading-[1.08] text-foreground">
              আপনার সৃষ্টিশীল যাত্রা <em className="text-primary not-italic">শুরু হোক</em> এখান থেকেই
            </h2>
            <p className="mt-5 text-muted-foreground max-w-xl mx-auto text-[15px] md:text-base leading-relaxed">
              আপনার পছন্দের অ্যাক্রিলিক কালার, ক্যানভাস বোর্ড, ইজেল কিংবা প্রিমিয়াম ক্যালিগ্রাফি ফ্রেম — খুঁজে নিন Ibn Mobarak Art Gallery এর সংগ্রহ থেকে।
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full text-sm font-medium hover:bg-primary/90 transition"
              >
                কালেকশন দেখুন <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center border-2 border-gold text-primary px-8 py-3.5 rounded-full text-sm font-medium hover:bg-gold hover:text-gold-foreground transition"
              >
                যোগাযোগ করুন
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
