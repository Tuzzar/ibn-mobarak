import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, MapPin, MessageCircle, Facebook, Clock, ArrowUpRight } from "lucide-react";
import { useContactInfo } from "@/lib/contact";
import { siteContentOptions } from "@/lib/queries";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({
    meta: [
      { title: "যোগাযোগ করুন — Ibn Mobarak Art Gallery" },
      {
        name: "description",
        content:
          "Ibn Mobarak Art Gallery এর সাথে যোগাযোগ করুন — WhatsApp, ফোন, ইমেইল কিংবা সরাসরি স্টুডিওতে।",
      },
      { property: "og:title", content: "যোগাযোগ করুন — Ibn Mobarak Art Gallery" },
      {
        property: "og:description",
        content: "কাস্টম অর্ডার, বাল্ক অর্ডার কিংবা যেকোনো প্রশ্নে যোগাযোগ করুন।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
});

function Contact() {
  const c = useContactInfo();
  const { data: content } = useQuery(siteContentOptions());

  const heroSubtitle =
    content?.contact_hero_subtitle ||
    "যেকোনো আর্ট সামগ্রী, কাস্টম ক্যানভাস ও ক্যালিগ্রাফি অর্ডার কিংবা ডেলিভারি সংক্রান্ত তথ্য — আমরা এক বার্তা দূরে।";
  const hoursBadge =
    content?.contact_hours_badge || "সপ্তাহের ৭ দিন · সর্বদা খোলা (Always Open)";
  const studioDesc =
    content?.contact_studio_desc ||
    "অ্যাক্রিলিক কালার, ক্যানভাস বোর্ড, কাঠের ইজেল ও ক্যালিগ্রাফি আর্টওয়ার্ক সরাসরি দেখে সংগ্রহ করতে কিংবা কাস্টম অর্ডারের বিস্তারিত আলোচনা করতে আমাদের স্টুডিওতে স্বাগতম।";
  const studioImage = content?.contact_studio_image || "/studio.jpg";
  const bulkTitle = content?.contact_bulk_title || "পাইকারি ও কাস্টম আর্টওয়ার্ক?";
  const bulkDesc =
    content?.contact_bulk_desc ||
    "আর্ট ইনস্টিটিউট, একাডেমি কিংবা গিফট অর্ডারের জন্য ক্যানভাস ফ্রেম, আর্ট কালার সেট কিংবা বড় সাইজের ইসলামিক ক্যালিগ্রাফি ফ্রেম পাইকারি মূল্যে সরবরাহ করা হয়।";
  const bulkPoint1 =
    content?.contact_bulk_point_1 || "কাস্টম সাইজ ক্যানভাস ও পাইনউড ফ্রেম তৈরি";
  const bulkPoint2 =
    content?.contact_bulk_point_2 || "ক্যালিগ্রাফি ও হ্যান্ডমেইড আর্টওয়ার্ক কিউরেশন";
  const bulkPoint3 =
    content?.contact_bulk_point_3 || "দেশজুড়ে নিরাপদ বাবল-র্যাপড ডেলিভারি";
  const bulkCta =
    content?.contact_bulk_cta || "WhatsApp এ কাস্টম অর্ডার পাঠান";

  const channels = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: c.whatsappDisplay,
      hint: "সরাসরি চ্যাট ও অর্ডার করতে",
      href: c.whatsappHref,
      external: true,
    },
    {
      icon: Phone,
      label: "হটলাইন ও ফোন",
      value: `${c.phone}\n${c.phoneSecondary}`,
      hint: "সরাসরি কল ও অর্ডার করতে",
      href: c.phoneHref,
    },
    {
      icon: Facebook,
      label: "Facebook পেইজ",
      value: "fb.com/ibnartgallery",
      hint: "৪৩K+ ফলোয়ার্স · ১০০% রেকমেন্ডেশন",
      href: c.facebookUrl,
      external: true,
    },
    {
      icon: Mail,
      label: "ইমেইল",
      value: c.email,
      hint: "অফিসিয়াল যোগাযোগ",
      href: `mailto:${c.email}`,
    },
  ];

  return (
    <div className="bg-background overflow-hidden">
      {/* 1. HERO — centered editorial */}
      <section className="relative">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,oklch(0.42_0.08_160/0.08),transparent_65%)]"
        />
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl pt-20 md:pt-28 pb-14 md:pb-20 text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-gold" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-medium">
              Get in touch
            </span>
            <span className="h-px w-10 bg-gold" />
          </div>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl leading-[1.02] tracking-tight">
            যোগাযোগ
            <br />
            <em className="text-primary not-italic">করুন</em>
          </h1>
          <p className="mt-7 text-muted-foreground max-w-xl mx-auto text-[15px] md:text-lg leading-relaxed">
            {heroSubtitle}
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/40 bg-[var(--section-a)] text-xs md:text-sm text-foreground/80">
            <Clock className="w-3.5 h-3.5 text-gold" />
            <span>{hoursBadge}</span>
          </div>
        </div>
      </section>

      {/* 2. CHANNELS — 4-up minimal grid */}
      <section className="container mx-auto px-4 sm:px-6 max-w-6xl pb-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {channels.map(({ icon: Icon, label, value, hint, href, external }) => (
            <a
              key={label}
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group relative bg-card border border-gold/20 rounded-2xl p-5 sm:p-7 shadow-[var(--shadow-card)] hover:border-gold/60 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-full bg-[var(--section-a)] border border-gold/30 flex items-center justify-center group-hover:border-gold transition">
                  <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
              </div>
              <div className="mt-6">
                <div className="text-[10px] uppercase tracking-[0.28em] text-gold font-medium">
                  {label}
                </div>
                <div className="font-display text-base md:text-lg mt-2 break-words leading-tight whitespace-pre-line font-medium text-foreground">
                  {value}
                </div>
                <div className="mt-2 h-px w-6 bg-gold/40 group-hover:w-10 transition-all duration-500" />
                <div className="mt-3 text-xs text-muted-foreground">{hint}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 3. VISIT + BULK — split panel with real studio photo */}
      <section className="container mx-auto px-4 sm:px-6 max-w-6xl py-10 md:py-14">
        <div className="grid md:grid-cols-12 gap-5 md:gap-6 items-stretch">
          {/* Visit Studio */}
          <div className="md:col-span-7 bg-[var(--section-a)] border border-gold/25 rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-background border border-gold/40 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.32em] text-gold font-medium">
                    Visit Our Studio & Art Gallery
                  </div>
                  <div className="font-display text-xl sm:text-2xl md:text-3xl mt-1 leading-tight">
                    {c.addressFull}
                  </div>
                  <div className="mt-3 h-px w-10 bg-gold/50" />
                  <p className="mt-3 text-muted-foreground text-[14px] md:text-[15px] leading-relaxed">
                    {studioDesc}
                  </p>
                </div>
              </div>

              {/* Real Studio Workspace Preview */}
              <div className="mt-6 rounded-2xl overflow-hidden border border-gold/30 shadow-sm relative group">
                <img
                  src={studioImage}
                  alt="Ibn Mobarak Art Gallery Studio & Workspace"
                  className="w-full h-56 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
                  <div className="text-white">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-gold/90 text-gold-foreground uppercase tracking-wider">
                      Physical Studio
                    </span>
                    <p className="text-sm font-medium mt-1">যাত্রাবাড়ী স্টুডিও ও আর্ট গ্যালারি শপ</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gold/20 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>হটলাইন: <a href={c.phoneHref} className="text-foreground font-semibold hover:text-primary">{c.phone}</a></span>
              <span>বিকল্প নম্বর: <a href={c.phoneSecondaryHref} className="text-foreground font-semibold hover:text-primary">{c.phoneSecondary}</a></span>
            </div>
          </div>

          {/* Bulk / custom */}
          <div className="md:col-span-5 relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 md:p-10 flex flex-col justify-between">
            <span
              aria-hidden
              className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-gold/20 blur-3xl"
            />
            <span
              aria-hidden
              className="absolute -bottom-20 -left-16 w-52 h-52 rounded-full bg-gold/10 blur-3xl"
            />
            <div className="relative">
              <div className="text-[10px] uppercase tracking-[0.32em] text-gold font-medium">
                Bulk & Custom Art Orders
              </div>
              <div className="font-display text-2xl md:text-[1.75rem] mt-3 leading-snug text-primary-foreground">
                {bulkTitle}
              </div>
              <div className="mt-4 h-px w-10 bg-gold/60" />
              <p className="mt-4 text-primary-foreground/85 text-sm leading-relaxed">
                {bulkDesc}
              </p>
              <ul className="mt-5 space-y-2 text-xs text-primary-foreground/90">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                  <span>{bulkPoint1}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                  <span>{bulkPoint2}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                  <span>{bulkPoint3}</span>
                </li>
              </ul>
            </div>
            <div className="relative mt-8">
              <a
                href={c.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full bg-gold text-gold-foreground font-semibold text-sm hover:brightness-105 transition shadow-lg"
              >
                <span>{bulkCta}</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
