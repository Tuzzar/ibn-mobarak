import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart, formatBDT } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({
    meta: [
      { title: "Your Basket — Ibn Mobarak Art Gallery" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
});

function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-6 max-w-3xl py-24 text-center">
        <span className="block text-[11px] uppercase tracking-[0.32em] text-gold mb-3">Your basket</span>
        <h1 className="font-display text-3xl sm:text-4xl text-foreground">কার্ট এখনো খালি</h1>
        <div className="mt-4 mx-auto h-px w-16 bg-gold/60" />
        <p className="text-muted-foreground mt-4">আমাদের কালেকশন থেকে পছন্দের আর্ট সামগ্রী ও ফ্রেম যোগ করুন।</p>
        <Link to="/products" className="mt-8 inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground transition-colors px-7 py-3.5 rounded-full font-medium">
          শপিং শুরু করুন <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-6xl py-8 sm:py-16 pb-28 lg:pb-16">
      <header className="mb-6 sm:mb-10">
        <span className="block text-[11px] uppercase tracking-[0.32em] text-gold mb-2">Your basket</span>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground">আপনার কার্ট</h1>
        <div className="mt-3 h-px w-16 bg-gold/60" />
      </header>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-12">
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 sm:gap-4 items-start sm:items-center bg-card border border-border rounded-2xl p-3 sm:p-4"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                )}
              </div>

              {/* Mobile: stacked info + controls. Desktop: row */}
              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    to="/products/$slug"
                    params={{ slug: item.slug }}
                    className="font-display text-base sm:text-lg hover:text-primary line-clamp-2 block"
                  >
                    {item.name}
                  </Link>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {formatBDT(item.price)} / {item.unit ?? "kg"}
                  </div>

                  {/* Mobile-only row: qty + total + remove */}
                  <div className="flex items-center justify-between gap-2 mt-2 sm:hidden">
                    <div className="inline-flex items-center border border-border rounded-full">
                      <button
                        onClick={() => setQty(item.id, item.quantity - 1)}
                        aria-label="Decrease"
                        className="w-8 h-8 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => setQty(item.id, item.quantity + 1)}
                        aria-label="Increase"
                        className="w-8 h-8 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-display text-sm text-primary">
                        {formatBDT(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => remove(item.id)}
                        aria-label="Remove"
                        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Desktop-only controls */}
                <div className="hidden sm:inline-flex items-center border border-border rounded-full">
                  <button onClick={() => setQty(item.id, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => setQty(item.id, item.quantity + 1)} className="w-9 h-9 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                </div>
                <div className="hidden sm:block font-display text-lg text-primary w-24 text-right">
                  {formatBDT(item.price * item.quantity)}
                </div>
                <button
                  onClick={() => remove(item.id)}
                  className="hidden sm:flex w-9 h-9 items-center justify-center text-muted-foreground hover:text-destructive"
                  aria-label="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="bg-card rounded-none border border-gold/40 p-5 sm:p-6 h-fit">
          <span className="block text-[11px] uppercase tracking-[0.28em] text-gold mb-2">Summary</span>
          <h2 className="font-display text-xl sm:text-2xl text-foreground">Order Total</h2>
          <div className="mt-3 h-px w-10 bg-gold/60" />
          <dl className="mt-5 sm:mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatBDT(subtotal)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Delivery</dt><dd className="text-right italic text-muted-foreground">Calculated at checkout</dd></div>
          </dl>
          <div className="border-t border-gold/30 my-5 sm:my-6" />
          <div className="flex justify-between font-display text-lg sm:text-xl">
            <span>Total</span><span className="text-primary">{formatBDT(subtotal)}</span>
          </div>
          <Link to="/checkout" className="mt-5 sm:mt-6 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground transition-colors py-3.5 rounded-full font-medium">
            Checkout <ArrowRight className="w-4 h-4" />
          </Link>
        </aside>

      </div>
    </div>
  );
}
