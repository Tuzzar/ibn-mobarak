import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

const defaultFaqs = [
  {
    q: "ক্যানভাস বা ফ্রেম ডেলিভারির সময় নষ্ট বা ড্যামেজ হওয়ার কোনো ঝুঁকি আছে কি?",
    a: "একদমই না। আমরা বিশেষ মাল্টি-লেয়ার বাবল র্যাপ এবং স্ট্রং হার্ডবোর্ড প্রোটেকশন দিয়ে প্রতিটি ক্যানভাস ও ফ্রেম সুরক্ষিতভাবে প্যাক করি। ডেলিভারির সময় কোনো ধরনের ক্ষতি হলে আমরা বিনামূল্যে ইনস্ট্যান্ট রিপ্লেসমেন্ট প্রদান করি।",
  },
  {
    q: "প্রোডাক্টগুলো কি আসল ও অথেনটিক ব্র্যান্ডের?",
    a: "হ্যাঁ, আমাদের সমস্ত আর্ট কালার, অ্যাক্রিলিক পেইন্ট, ব্রাশ ও মেটেরিয়ালস ১০০% জেনুইন ও অথেনটিক ব্র্যান্ডের (যেমন Mont Marte, Pebeo, Brustro, Keep Smiling ইত্যাদি)। গুণগত মান নিয়ে কোনো আপস করা হয় না।",
  },
  {
    q: "সারা বাংলাদেশে কি ক্যাশ অন ডেলিভারি (COD) সুবিধা আছে?",
    a: "জ্বী! ঢাকা শহর এবং ঢাকার বাইরে বাংলাদেশের যেকোনো জেলা ও উপজেলায় নিশ্চিন্তে ক্যাশ অন ডেলিভারিতে প্রোডাক্ট হাতে পেয়ে মূল্য পরিশোধ করতে পারবেন।",
  },
  {
    q: "অর্ডার করার পর ডেলিভারি পেতে কতদিন সময় লাগে?",
    a: "ঢাকা মেট্রো সিটির ভেতরে সাধারণত ২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি সম্পন্ন হয়। এবং ঢাকার বাইরে সারা বাংলাদেশে ২ থেকে ৩ কার্যদিবসের মধ্যে আপনার ঠিকানায় পৌঁছাবে।",
  },
  {
    q: "কাস্টম সাইজের ক্যানভাস বা ক্যালিগ্রাফি আর্টওয়ার্ক অর্ডার করা যাবে?",
    a: "অবশ্যই! আপনার দেয়ালের মাপ অনুযায়ী কাস্টম সাইজ ক্যানভাস, ফ্রেম কিংবা পছন্দের আয়াত বা ক্যালিগ্রাফির জন্য সরাসরি আমাদের সাথে WhatsApp-এ যোগাযোগ করতে পারেন।",
  },
];

export type FaqItem = { q: string; a: string };

export function FaqSection({
  kicker,
  titleLine1,
  titleLine2,
  description,
  linkLabel,
  items,
}: {
  kicker?: string;
  titleLine1?: string;
  titleLine2?: string;
  description?: string;
  linkLabel?: string;
  items?: FaqItem[];
} = {}) {
  const faqs = items && items.length > 0 ? items : defaultFaqs;
  return (
    <section className="py-14 md:py-28">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-6xl">
        <div className="grid md:grid-cols-[1fr_1.5fr] gap-10 md:gap-20">
          {/* Left — sticky intro */}
          <div className="md:sticky md:top-24 md:self-start">
            <span className="text-[11px] md:text-xs uppercase tracking-[0.28em] text-gold">
              {kicker?.trim() || "Frequently Asked"}
            </span>
            <h2 className="font-display text-[1.75rem] md:text-5xl text-foreground mt-2 md:mt-4 leading-[1.1]">
              {titleLine1?.trim() || "Everything you"}<br className="hidden md:block" /> {titleLine2?.trim() || "need to know"}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mt-4 md:mt-5 leading-relaxed max-w-sm">
              {description?.trim() || "Thoughtful answers to the questions our customers ask most."}
            </p>
            <div className="mt-6 md:mt-10 pt-5 border-t border-border/70 max-w-sm">
              <p className="text-[13px] text-muted-foreground">Still curious?</p>
              <Link
                to="/contact"
                className="group inline-flex items-center gap-1.5 mt-1.5 font-display text-lg text-foreground hover:text-primary transition"
              >
                {linkLabel?.trim() || "Talk to us"}
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>

          {/* Right — numbered editorial Q&A */}
          <Accordion type="single" collapsible className="w-full border-t border-border/70">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="group border-b border-border/70 border-t-0 data-[state=open]:bg-foreground/[0.015]"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6 md:py-7 gap-6 [&>svg]:hidden">
                  <div className="flex items-baseline gap-5 md:gap-7 flex-1 min-w-0">
                    <span className="font-display text-sm md:text-base text-gold/70 tabular-nums shrink-0 group-data-[state=open]:text-primary transition-colors">
                      {String(i + 1).padStart(2, "0")} /
                    </span>
                    <span className="font-display text-base md:text-xl text-foreground leading-snug">
                      {f.q}
                    </span>
                  </div>
                  <span
                    aria-hidden
                    className="shrink-0 w-7 h-7 rounded-full border border-border/70 flex items-center justify-center text-foreground/60 group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground group-data-[state=open]:border-primary transition-colors"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      className="transition-transform"
                    >
                      <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.5" />
                      <line
                        x1="5"
                        y1="1"
                        x2="5"
                        y2="9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="origin-center transition-transform duration-300 group-data-[state=open]:rotate-90 group-data-[state=open]:opacity-0"
                      />
                    </svg>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-[14px] md:text-[15px] leading-relaxed pb-6 md:pb-8 pl-12 md:pl-16 pr-12 max-w-2xl">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
