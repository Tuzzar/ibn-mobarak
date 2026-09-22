import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Phone, MessageCircle } from "lucide-react";
import { useContactInfo } from "@/lib/contact";
import { siteContentOptions } from "@/lib/queries";

const DEFAULT_MESSAGES = [
  "🚚 ঢাকা ও সারা বাংলাদেশে দ্রুত ডেলিভারি (২-৪ দিন)!",
  "🎨 ১০০% অথেনটিক আর্ট মেটেরিয়ালস ও ক্যালিগ্রাফি সাপ্লাইজ",
  "⭐ ২,০০০ টাকার বেশি অর্ডারে ফ্রি ডেলিভারি সুবিধা!",
  "💬 সরাসরি অর্ডার ও কাস্টমাইজেশনের জন্য WhatsApp এ নক দিন",
];

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const contact = useContactInfo();
  const { data: content } = useQuery({ ...siteContentOptions() });

  const isEnabled = content?.announcement_bar_enabled !== "0";

  const messages = useMemo(() => {
    if (!content) return DEFAULT_MESSAGES;
    const list = [
      content.announcement_message_1,
      content.announcement_message_2,
      content.announcement_message_3,
      content.announcement_message_4,
    ].filter((m) => typeof m === "string" && m.trim().length > 0);
    return list.length > 0 ? list : DEFAULT_MESSAGES;
  }, [content]);

  const speedMs = useMemo(() => {
    const sec = Number(content?.announcement_speed_sec);
    return sec && sec >= 1 && sec <= 30 ? sec * 1000 : 3800;
  }, [content?.announcement_speed_sec]);

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, speedMs);
    return () => clearInterval(timer);
  }, [messages.length, speedMs]);

  if (!isEnabled || messages.length === 0) return null;

  const currentMessage = messages[index % messages.length];

  return (
    <div className="bg-primary text-primary-foreground py-1.5 px-4 text-xs">
      <div className="container mx-auto max-w-7xl flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center justify-center sm:justify-start gap-2 overflow-hidden h-5">
          <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 animate-pulse" />
          <span className="truncate font-medium transition-all duration-300">
            {currentMessage}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-[11px] shrink-0">
          <a
            href={contact.phoneHref}
            className="inline-flex items-center gap-1 hover:text-gold transition-colors"
          >
            <Phone className="w-3 h-3" />
            <span>{contact.phone}</span>
          </a>
          <a
            href={contact.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-gold transition-colors"
          >
            <MessageCircle className="w-3 h-3 text-gold" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
