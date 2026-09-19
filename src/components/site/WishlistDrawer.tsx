import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Trash2, ArrowRight, X, ExternalLink } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { useCart, formatBDT } from "@/lib/cart";
import { toast } from "sonner";
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

export function WishlistDrawer({ children, open, onOpenChange }: Props) {
  const { items, removeFavorite, clearWishlist, count } = useWishlist();
  const { add } = useCart();

  const handleAddToCart = (item: (typeof items)[0]) => {
    add(
      {
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        slug: item.slug,
        unit: "pcs",
      },
      1,
    );
    toast.success(`"${item.name}" কার্টে যোগ করা হয়েছে`);
  };

  const handleAddAllToCart = () => {
    const availableItems = items.filter((it) => it.inStock !== false);
    if (availableItems.length === 0) {
      toast.error("কোনো ইন-স্টক পণ্য পাওয়া যায়নি");
      return;
    }
    availableItems.forEach((item) => {
      add(
        {
          id: item.id,
          name: item.name,
          price: item.price,
          image_url: item.image_url,
          slug: item.slug,
          unit: "pcs",
        },
        1,
      );
    });
    toast.success(`${availableItems.length}টি পণ্য কার্টে যোগ করা হয়েছে`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children ? <SheetTrigger asChild>{children}</SheetTrigger> : null}
      <SheetContent
        side="right"
        className="w-[94vw] max-w-[94vw] sm:w-[440px] sm:max-w-md flex flex-col p-0 gap-0 overflow-x-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-2xl flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              পছন্দের তালিকা
              {count > 0 && (
                <span className="text-sm text-muted-foreground font-sans font-normal">
                  ({count})
                </span>
              )}
            </SheetTitle>
            {count > 0 && (
              <button
                type="button"
                onClick={clearWishlist}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors mr-6"
              >
                সব মুছুন
              </button>
            )}
          </div>
          <div className="h-px w-10 bg-gold/60 mt-1" />
        </SheetHeader>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
              <Heart className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="font-display text-xl text-foreground">
              পছন্দের তালিকা এখনো খালি
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              যেকোনো আর্ট পণ্যের লাভ (❤️) আইকনে ট্যাপ করে আপনার পছন্দের পণ্য সংরক্ষণ করুন।
            </p>
            <SheetClose asChild>
              <Link
                to="/products"
                className="mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-gold hover:text-gold-foreground transition-colors shadow-sm"
              >
                পণ্য কালেকশন দেখুন <ArrowRight className="w-4 h-4" />
              </Link>
            </SheetClose>
          </div>
        ) : (
          <>
            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-border">
              {items.map((item) => {
                const isOutOfStock = item.inStock === false;

                return (
                  <div
                    key={item.id}
                    className="py-4 flex items-center gap-3.5 group"
                  >
                    {/* Thumbnail */}
                    <Link
                      to="/products/$slug"
                      params={{ slug: item.slug }}
                      className="w-16 h-16 rounded-xl bg-card border border-border overflow-hidden shrink-0 block relative"
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-muted-foreground">
                          <Heart className="w-6 h-6 opacity-30" />
                        </div>
                      )}
                      {isOutOfStock && (
                        <span className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center text-[9px] font-bold text-destructive">
                          স্টক আউট
                        </span>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to="/products/$slug"
                        params={{ slug: item.slug }}
                        className="font-medium text-xs sm:text-sm text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
                      >
                        {item.name}
                      </Link>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-xs sm:text-sm text-primary">
                          {formatBDT(item.price)}
                        </span>
                        {item.original_price && item.original_price > item.price && (
                          <span className="text-[10px] text-muted-foreground line-through">
                            {formatBDT(item.original_price)}
                          </span>
                        )}
                      </div>

                      {/* Quick Add to Cart button */}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          disabled={isOutOfStock}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>কার্টে নিন</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => removeFavorite(item.id)}
                          aria-label="Remove from wishlist"
                          className="p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer with actions */}
            <div className="p-5 border-t border-border bg-card space-y-2.5">
              <button
                type="button"
                onClick={handleAddAllToCart}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-full text-xs sm:text-sm font-semibold hover:bg-gold hover:text-gold-foreground transition-colors shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>সব পণ্য কার্টে যোগ করুন</span>
              </button>

              <SheetClose asChild>
                <Link
                  to="/wishlist"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                >
                  <span>সম্পূর্ণ পছন্দের পেজ দেখুন</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </SheetClose>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
