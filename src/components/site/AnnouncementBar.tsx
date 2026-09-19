import { useEffect, useState } from "react";
import { Phone, MessageCircle, Truck } from "lucide-react";
import { useContactInfo } from "@/lib/contact";

const MESSAGES = [
  "🚚 ঢাকা ও সারা বাংলাদেশে দ্রুত ডেলিভারি (২-৪ দিন)!",
  "🎨 ১০০% অথেনটিক আর্ট মেটেরিয়ালস ও ক্যালিগ্রাফি সাপ্লাইজ",
  "⭐ ২,০০০ টাকার বেশি অর্ডারে ফ্রি ডেলিভারি সুবিধা!",
  "💬 সরাসরি অর্ডার ও কাস্টমাইজেশনের জন্য WhatsApp এ নক দিন",
];

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const contact = useContactInfo();

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-primary text-primary-foreground py-1.5 px-4 text-xs">
      <div className="container mx-auto max-w-7xl flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center justify-center sm:justify-start gap-2 overflow-hidden h-5">
          <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 animate-pulse" />
          <span className="truncate font-medium transition-all duration-300">
            {MESSAGES[index]}
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
