import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

export type WishlistItem = {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  image_url: string | null;
  slug: string;
  category?: string | null;
  inStock?: boolean;
};

type WishlistContextType = {
  items: WishlistItem[];
  count: number;
  isFavorite: (id: string) => boolean;
  addFavorite: (item: WishlistItem) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (item: WishlistItem) => void;
  clearWishlist: () => void;
};

const STORAGE_KEY = "almiftah_wishlist_v1";

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn("Could not read wishlist from localStorage:", e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save wishlist to localStorage:", e);
    }
  }, [items]);

  const isFavorite = (id: string) => items.some((it) => it.id === id);

  const addFavorite = (item: WishlistItem) => {
    setItems((prev) => {
      if (prev.some((it) => it.id === item.id)) return prev;
      toast.success(`"${item.name}" পছন্দের তালিকায় যুক্ত হয়েছে`);
      return [item, ...prev];
    });
  };

  const removeFavorite = (id: string) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.id === id);
      if (existing) {
        toast.info(`"${existing.name}" তালিকা থেকে সরানো হয়েছে`);
      }
      return prev.filter((it) => it.id !== id);
    });
  };

  const toggleFavorite = (item: WishlistItem) => {
    if (isFavorite(item.id)) {
      removeFavorite(item.id);
    } else {
      addFavorite(item);
    }
  };

  const clearWishlist = () => {
    setItems([]);
    toast.info("পছন্দের তালিকা খালি করা হয়েছে");
  };

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      isFavorite,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      clearWishlist,
    }),
    [items],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return ctx;
}
