import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, X } from "lucide-react";
import { useCart, formatBDT } from "@/lib/cart";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

type Props = {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CartDrawer({ children, open, onOpenChange }: Props) {
  const { items, setQty, remove, subtotal, count } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children ? <SheetTrigger asChild>{children}</SheetTrigger> : null}
      <SheetContent
        side="right"
        className="w-[94vw] max-w-[94vw] sm:w-[440px] sm:max-w-md flex flex-col p-0 gap-0 overflow-x-hidden"
      >
        <SheetHeader className="px-6 py-5 border-b border-border bg-card">
          <SheetTitle className="font-display text-2xl flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gold" />
            আপনার কার্ট
            {count > 0 && (
              <span className="text-sm text-muted-foreground font-sans font-normal">
                ({count})
              </span>
            )}
          </SheetTitle>
          <div className="h-px w-10 bg-gold/60 mt-1" />
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <ShoppingBag className="w-7 h-7 text-gold" />
            </div>
            <h3 className="font-display text-xl text-foreground">
              কার্ট এখনো খালি
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              আমাদের কালেকশন থেকে পছন্দের আর্ট সামগ্রী ও ফ্রেম যোগ করুন।
            </p>
            <SheetClose asChild>
              <Link
                to="/products"
                className="mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-gold hover:text-gold-foreground transition-colors"
              >
                শপিং শুরু করুন <ArrowRight className="w-4 h-4" />
              </Link>
            </SheetClose>
          </div>

        ) : (
          <>
            {/* Free Delivery Goal Progress Bar */}
            <div className="px-4 sm:px-6 py-3 bg-muted/40 border-b border-border/80">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                {subtotal >= 2000 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    🎉 অভিনন্দন! ফ্রি ডেলিভারি কার্যকর হয়েছে!
                  </span>
                ) : (
                  <span className="text-foreground/90">
                    ফ্রি ডেলিভারির জন্য আর মাত্র <strong className="text-gold font-bold">{formatBDT(2000 - subtotal)}</strong> প্রয়োজন
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground font-mono">
                  {Math.min(100, Math.round((subtotal / 2000) * 100))}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-border/80 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    subtotal >= 2000 ? "bg-emerald-500" : "bg-gold"
                  }`}
                  style={{ width: `${Math.min(100, (subtotal / 2000) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 items-start bg-card border border-border rounded-2xl p-3"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <SheetClose asChild>
                      <Link
                        to="/products/$slug"
                        params={{ slug: item.slug }}
                        className="font-display text-sm md:text-base leading-snug hover:text-primary line-clamp-2 block"
                      >
                        {item.name}
                      </Link>
                    </SheetClose>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatBDT(item.price)} / {item.unit ?? "pcs"}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="inline-flex items-center border border-border rounded-full">
                        <button
                          onClick={() => setQty(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="w-7 h-7 flex items-center justify-center hover:bg-secondary rounded-l-full"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => setQty(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="w-7 h-7 flex items-center justify-center hover:bg-secondary rounded-r-full"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-display text-sm text-primary">
                        {formatBDT(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(item.id)}
                    aria-label="Remove item"
                    className="text-muted-foreground hover:text-destructive p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-gold/40 px-6 py-5 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.2em] text-gold font-semibold">সাবটোটাল</span>
                <span className="font-display text-xl text-primary font-bold">
                  {formatBDT(subtotal)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {subtotal >= 2000
                  ? "✓ এই অর্ডারে কোনো ডেলিভারি চার্জ প্রযোজ্য হবে না।"
                  : "ডেলিভারি চার্জ চেকআউটে হিসাব করা হবে (ঢাকা ৳৮০, বাইরে ৳১৩০)।"}
              </p>
              <div className="flex flex-col gap-2">
                <SheetClose asChild>
                  <Link
                    to="/checkout"
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-full text-sm font-semibold hover:bg-gold hover:text-gold-foreground transition-colors shadow-md"
                  >
                    অর্ডার সম্পন্ন করুন <ArrowRight className="w-4 h-4" />
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/cart"
                    className="w-full inline-flex items-center justify-center border border-border hover:border-gold text-foreground py-2.5 rounded-full text-xs font-medium tracking-wide transition-colors"
                  >
                    সম্পূর্ণ কার্ট বিস্তারিত দেখুন
                  </Link>
                </SheetClose>
              </div>
            </div>

          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
