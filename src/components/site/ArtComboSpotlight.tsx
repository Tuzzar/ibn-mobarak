import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Package, ShoppingBag, MessageCircle, ArrowRight } from "lucide-react";
import { useCart, formatBDT } from "@/lib/cart";
import { useContactInfo } from "@/lib/contact";
import { toast } from "sonner";

export function ArtComboSpotlight() {
  const { add } = useCart();
  const contact = useContactInfo();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const comboProduct = {
    id: "art-prod-4",
    slug: "all-in-one-artist-combo-pack",
    name: "All-in-One Artist Combo Pack (Acrylic + Brushes + Canvas)",
    price: 2350,
    regularPrice: 2650,
    image_url: "https://artlabbd.com/wp-content/uploads/2024/08/428672548_708861584788268_7215090560402851456_n-600x600.jpg",
    unit: "Combo Kit",
  };

  const handleAddToCart = () => {
    setAdding(true);
    add(
      {
        id: comboProduct.id,
        name: comboProduct.name,
        price: comboProduct.price,
        image_url: comboProduct.image_url,
        unit: comboProduct.unit,
        slug: comboProduct.slug,
      },
      1,
    );
    toast.success("কম্বো প্যাকটি কার্টে যোগ করা হয়েছে!");
    setTimeout(() => setAdding(false), 400);
  };

  const handleInstantBuy = () => {
    add(
      {
        id: comboProduct.id,
        name: comboProduct.name,
        price: comboProduct.price,
        image_url: comboProduct.image_url,
        unit: comboProduct.unit,
        slug: comboProduct.slug,
      },
      1,
    );
    navigate({ to: "/checkout" });
  };

  return (
    <section className="container mx-auto px-4 sm:px-6 max-w-7xl py-12">
      <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/30 p-6 sm:p-10 lg:p-12 shadow-sm overflow-hidden relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: Combo Image with Badges */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-square max-w-md mx-auto rounded-2xl overflow-hidden bg-background border border-border/60 shadow-lg">
              <img
                src={comboProduct.image_url}
                alt={comboProduct.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute top-4 left-4 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                🔥 Hot Deal
              </div>
              <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur px-3.5 py-1.5 rounded-xl border border-border/80 text-xs font-bold text-primary shadow-xs">
                Save ৳300
              </div>
            </div>
          </div>

          {/* Right: Combo Details & Purchase */}
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <Package className="w-3.5 h-3.5" />
              আর্টিস্ট স্পেশাল স্টার্টার প্যাক
            </span>

            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-3 leading-tight">
              All-in-One Master Artist & Calligraphy Combo
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
              নতুন শুরু করা থেকে শুরু করে প্রফেশনাল আর্ট প্রজেক্টের জন্য একটি স্বয়ংসম্পূর্ণ কিট। আলাদাভাবে কেনার ঝামেলা ছাড়াই সেরা দামে সম্পূর্ণ প্যাকেজ।
            </p>

            {/* Feature Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-6">
              {[
                "২৪টি হাই-পিগমেন্ট অ্যাক্রিলিক কালার সেট",
                "১৫টি প্রফেশনাল ব্রাশ সেট (পপ-আপ কেস সহ)",
                "২টি হেভি ডিউটি স্ট্রেচড ক্যানভাস বোর্ড",
                "অরিজিনাল উডেন কালার মিক্সিং প্যালেট",
                "১০০% বাবল র‍্যাপড ওয়াটারপ্রুফ প্যাকেজিং",
                "সারা বাংলাদেশে ক্যাশ অন ডেলিভারি",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground/85">
                  <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Price block */}
            <div className="flex items-baseline gap-3 pt-2 pb-6 border-t border-border/60">
              <span className="font-display text-2xl sm:text-3xl font-bold text-primary">
                {formatBDT(comboProduct.price)}
              </span>
              <span className="text-sm sm:text-base text-muted-foreground line-through">
                {formatBDT(comboProduct.regularPrice)}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent text-xs font-bold">
                ১২% ছাড়
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleInstantBuy}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 px-6 rounded-xl font-bold text-sm hover:bg-primary/90 shadow-sm transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>সরাসরি অর্ডার করুন (Cash on Delivery)</span>
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding}
                className="inline-flex items-center justify-center gap-2 bg-card border border-primary/30 text-primary py-3.5 px-6 rounded-xl font-bold text-sm hover:bg-primary/5 transition-all cursor-pointer"
              >
                <span>{adding ? "যোগ হচ্ছে..." : "কার্টে রাখুন"}</span>
              </button>

              <a
                href={contact.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-border text-foreground/80 py-3.5 px-5 rounded-xl text-sm font-semibold hover:bg-muted transition-all"
                title="WhatsApp এ প্রশ্ন করুন"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>প্রশ্ন করুন</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
