import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { useCart, formatBDT } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
  head: () => ({
    meta: [
      { title: "পছন্দের তালিকা — Ibn Mobarak Art Gallery" },
      {
        name: "description",
        content: "আপনার সংরক্ষিত ও পছন্দের আর্ট সামগ্রী ও ক্যালিগ্রাফি সামগ্রীর তালিকা।",
      },
    ],
  }),
});

function WishlistPage() {
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
    <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 mb-6">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span className="text-gold/60">/</span>
        <span className="text-primary font-semibold">Wishlist</span>
      </nav>

      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Heart className="w-3.5 h-3.5 fill-rose-500" />
            <span>সংরক্ষিত পণ্যসমূহ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-foreground">
            আপনার পছন্দের তালিকা
            {count > 0 && <span className="text-lg font-normal text-muted-foreground ml-2">({count})</span>}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            আপনার পছন্দের আর্ট মেটেরিয়ালস সংরক্ষণ করুন এবং সুবিধাজনক সময়ে অর্ডার সম্পন্ন করুন
          </p>
        </div>

        {count > 0 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearWishlist}
              className="px-4 py-2 rounded-full border border-border text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive transition"
            >
              সব মুছুন
            </button>
            <button
              type="button"
              onClick={handleAddAllToCart}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-gold hover:text-gold-foreground transition shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>সব কার্টে যোগ করুন</span>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="text-center py-20 px-4 bg-card border border-dashed border-border rounded-3xl max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">
            আপনার পছন্দের তালিকা খালি
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            যেকোনো প্রোডাক্টের ওপর লাভ (❤️) আইকনে ক্লিক করে সহজেই নিজের পছন্দের তালিকা তৈরি করতে পারেন।
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-gold hover:text-gold-foreground transition shadow-sm"
            >
              <span>পণ্য কালেকশন দেখুন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item) => {
            const isOutOfStock = item.inStock === false;

            return (
              <div
                key={item.id}
                className="bg-card border border-border rounded-2xl p-3 sm:p-4 flex flex-col justify-between group hover:border-primary/40 transition shadow-xs relative"
              >
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFavorite(item.id)}
                  aria-label="Remove from wishlist"
                  className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Product Media */}
                <Link
                  to="/products/$slug"
                  params={{ slug: item.slug }}
                  className="block aspect-square rounded-xl bg-muted/30 overflow-hidden mb-3 relative"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground">
                      <Heart className="w-8 h-8 opacity-30" />
                    </div>
                  )}

                  {isOutOfStock && (
                    <span className="absolute inset-0 bg-background/80 backdrop-blur-[1px] flex items-center justify-center text-xs font-bold text-destructive">
                      স্টক আউট
                    </span>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {item.category && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono block mb-1">
                        {item.category}
                      </span>
                    )}
                    <Link
                      to="/products/$slug"
                      params={{ slug: item.slug }}
                      className="text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
                    >
                      {item.name}
                    </Link>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-sm sm:text-base font-bold text-primary">
                        {formatBDT(item.price)}
                      </span>
                      {item.original_price && item.original_price > item.price && (
                        <span className="text-[10px] text-muted-foreground line-through ml-1.5">
                          {formatBDT(item.original_price)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      disabled={isOutOfStock}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>কিনুন</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
