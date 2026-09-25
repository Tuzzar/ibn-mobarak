import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Trash2,
  Loader2,
  X,
  Search,
  Check,
  AlertCircle,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBDT } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/external";
import {
  updateAdminOrderItems,
  searchAdminCatalogProducts,
} from "@/lib/orders.functions";
import type { AdminOrder } from "@/lib/order-admin";

type OrderItem = {
  id?: string;
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  unit?: string;
  size?: string | null;
  image?: string;
  stock?: number;
};

type CatalogProduct = {
  id: string;
  name: string;
  slug?: string;
  price: number;
  discount_amount?: number;
  stock: number;
  image_url?: string | null;
  images?: string[] | null;
  unit?: string | null;
  weight_variants?: any[] | null;
};

export function OrderItemsEditModal({
  order,
  isOpen,
  onClose,
  onSaved,
}: {
  order: AdminOrder;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [items, setItems] = useState<OrderItem[]>(() =>
    (order.items ?? []).map((it: any) => ({
      id: it.id,
      productId:
        it.productId ||
        (typeof it.id === "string" && !it.id.includes("::") ? it.id : undefined),
      name: it.name,
      quantity: Number(it.quantity) || 1,
      price: Number(it.price) || 0,
      unit: it.unit,
      size: it.size ?? null,
      image: it.image || it.image_url,
      stock: it.stock,
    })),
  );

  const [deliveryFee, setDeliveryFee] = useState<number>(
    Number(order.delivery_fee) || 0,
  );
  const [saving, setSaving] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Fetch products from catalog using server function (safely bypasses RLS and schema mismatches)
  const { data: catalogProducts, isLoading: catalogLoading } = useQuery({
    queryKey: ["admin-catalog-products", catalogSearch],
    queryFn: async () => {
      const data = await searchAdminCatalogProducts({
        data: { query: catalogSearch },
      });
      return (data ?? []) as CatalogProduct[];
    },
    enabled: isOpen && isProductPickerOpen,
  });

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
    0,
  );
  const total = subtotal + (Number(deliveryFee) || 0);

  const updateItemQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, quantity: newQty } : it)),
    );
  };

  const updateItemPrice = (index: number, newPrice: number) => {
    if (newPrice < 0) return;
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, price: newPrice } : it)),
    );
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      toast.error("Order must have at least one product.");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addRealProduct = (product: CatalogProduct) => {
    const variants = Array.isArray(product.weight_variants)
      ? product.weight_variants
      : [];
    const selectedVariantLabel = selectedVariants[product.id];
    const selectedVariant = variants.find(
      (v: any) =>
        v &&
        typeof v === "object" &&
        String(v.label || "").trim() === String(selectedVariantLabel || "").trim(),
    );

    let itemId = product.id;
    let itemName = product.name;
    let itemPrice = Math.max(
      Number(product.price) - Number(product.discount_amount || 0),
      0,
    );
    let itemStock = product.stock;
    let itemUnit = product.unit || "";
    let itemSize: string | null = null;

    if (selectedVariant) {
      itemId = `${product.id}::${selectedVariant.label}`;
      const attrName = selectedVariant.attribute || "Size";
      itemName = `${product.name} (${attrName}: ${selectedVariant.label})`;
      itemPrice =
        Number(selectedVariant.price) > 0
          ? Number(selectedVariant.price)
          : itemPrice;
      itemStock = Math.floor(Number(selectedVariant.stock) || 0);
      itemUnit = selectedVariant.label;
      itemSize = selectedVariant.label;
    }

    const img =
      product.image_url ||
      (Array.isArray(product.images) && product.images.length > 0
        ? product.images[0]
        : undefined);

    // If item already exists in the order with same id, increment quantity!
    const existingIndex = items.findIndex(
      (it) => it.id === itemId || (it.productId === product.id && it.size === itemSize),
    );

    if (existingIndex >= 0) {
      updateItemQty(existingIndex, items[existingIndex].quantity + 1);
      toast.success(`Incremented quantity for "${itemName}"`);
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: itemId,
          productId: product.id,
          name: itemName,
          quantity: 1,
          price: itemPrice,
          unit: itemUnit,
          size: itemSize,
          image: img,
          stock: itemStock,
        },
      ]);
      toast.success(`Added "${itemName}"`);
    }

    setIsProductPickerOpen(false);
  };

  const addCustomItem = () => {
    setItems((prev) => [
      ...prev,
      {
        name: "Custom Item",
        quantity: 1,
        price: 0,
      },
    ]);
  };

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error("Order must have at least one item.");
      return;
    }
    for (const it of items) {
      if (!it.name.trim()) {
        toast.error("Item name cannot be empty.");
        return;
      }
      if (it.quantity < 1) {
        toast.error("Item quantity must be at least 1.");
        return;
      }
    }

    setSaving(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) throw new Error("Not authenticated");

      await updateAdminOrderItems({
        data: {
          orderId: order.id,
          items,
          subtotal,
          delivery_fee: deliveryFee,
          total,
          user: {
            id: user.id,
            email: user.email ?? null,
          },
        },
      });

      toast.success("Order products updated and stock synchronized");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update items");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-3xl max-h-[92vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-gold" />
            <div>
              <h2 className="font-display text-xl text-foreground">
                Edit Order Products & Pricing
              </h2>
              <p className="text-xs text-muted-foreground">
                Order #{order.order_no ?? order.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Products in this order ({items.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setIsProductPickerOpen(true);
                  setCatalogSearch("");
                }}
                className="h-8 text-xs gap-1.5 bg-gold text-primary-foreground hover:bg-gold/90 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Product
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={addCustomItem}
                className="h-8 text-xs gap-1 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              >
                + Custom Item
              </Button>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border bg-card">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm hover:bg-secondary/15 transition"
              >
                <div className="flex items-center gap-3 flex-1 min-w-[220px]">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover border border-border/60 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-secondary/60 border border-border/60 flex items-center justify-center shrink-0 text-muted-foreground">
                      <Package className="w-4 h-4" />
                    </div>
                  )}

                  <div className="flex-1">
                    <Input
                      value={item.name}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((it, i) =>
                            i === idx ? { ...it, name: e.target.value } : it,
                          ),
                        )
                      }
                      className="h-8 text-xs font-medium"
                      placeholder="Product name"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      {item.size ? (
                        <span className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                          {item.size}
                        </span>
                      ) : null}
                      {item.productId ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Store Catalog Product
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">
                          Custom Item
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quantity & Unit Price */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                  <div className="flex items-center border border-border rounded-lg bg-background">
                    <button
                      type="button"
                      onClick={() => updateItemQty(idx, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-secondary rounded-l-lg transition disabled:opacity-40"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItemQty(idx, parseInt(e.target.value) || 1)
                      }
                      className="w-10 text-center font-numeric text-xs bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateItemQty(idx, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-secondary rounded-r-lg transition"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">৳</span>
                    <Input
                      type="number"
                      min="0"
                      value={item.price}
                      onChange={(e) =>
                        updateItemPrice(idx, parseFloat(e.target.value) || 0)
                      }
                      className="w-20 h-7 text-xs font-numeric text-right px-2"
                    />
                  </div>

                  <div className="w-24 text-right font-numeric font-medium text-xs text-primary">
                    {formatBDT((item.price || 0) * (item.quantity || 1))}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Fee Adjustment */}
          <div className="p-4 bg-secondary/30 rounded-xl border border-border space-y-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
              Delivery Fee
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "Inside Dhaka (৳80)", fee: 80 },
                { label: "Outside Dhaka (৳130)", fee: 130 },
                { label: "Free (৳0)", fee: 0 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setDeliveryFee(p.fee)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                    deliveryFee === p.fee
                      ? "border-gold bg-gold/15 text-foreground font-medium"
                      : "border-border hover:border-gold/40 text-muted-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-muted-foreground">Custom: ৳</span>
                <Input
                  type="number"
                  min="0"
                  value={deliveryFee}
                  onChange={(e) =>
                    setDeliveryFee(parseFloat(e.target.value) || 0)
                  }
                  className="w-20 h-8 text-xs font-numeric text-right"
                />
              </div>
            </div>
          </div>

          {/* Order Summary Box */}
          <div className="bg-card border border-border/80 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Subtotal ({items.length} items)</span>
              <span className="font-numeric">{formatBDT(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Delivery Fee</span>
              <span className="font-numeric">{formatBDT(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
              <span>New Total</span>
              <span className="font-numeric text-gold text-lg">
                {formatBDT(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-secondary/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              সেভ করলে রিয়েল প্রোডাক্টের স্টক স্বয়ংক্রিয়ভাবে ডাটাবেজে সমন্বয় হবে।
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="gap-1.5 bg-gold hover:bg-gold/90 text-primary-foreground font-medium"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Dedicated Product Picker Modal */}
      {isProductPickerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-card border border-border w-full max-w-xl max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Picker Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gold" />
                <h3 className="font-display text-base text-foreground">
                  Select Product from Store Catalog
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Picker Search Box */}
            <div className="p-4 border-b border-border/60 bg-secondary/30">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by product name (e.g. canvas, brush, notebook)..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="pl-9 pr-8 h-9 text-xs"
                  autoFocus
                />
                {catalogSearch && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Product List */}
            <div className="p-3 flex-1 overflow-y-auto divide-y divide-border/60 max-h-96">
              {catalogLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-gold" />
                  <span>Loading store catalog...</span>
                </div>
              ) : !catalogProducts || catalogProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  কোনো প্রোডাক্ট পাওয়া যায়নি। অন্য বানান দিয়ে খুঁজুন।
                </div>
              ) : (
                catalogProducts.map((prod) => {
                  const variants = Array.isArray(prod.weight_variants)
                    ? prod.weight_variants.filter((v) => v && typeof v === "object" && v.label)
                    : [];
                  const hasVariants = variants.length > 0;
                  const currentVariantLabel =
                    selectedVariants[prod.id] || (hasVariants ? variants[0].label : "");
                  const activeVariant = variants.find(
                    (v: any) => String(v.label).trim() === String(currentVariantLabel).trim(),
                  );

                  const displayPrice = activeVariant?.price
                    ? Number(activeVariant.price)
                    : Math.max(Number(prod.price) - Number(prod.discount_amount || 0), 0);
                  const displayStock = activeVariant
                    ? Math.floor(Number(activeVariant.stock) || 0)
                    : Number(prod.stock) || 0;
                  const thumbnail =
                    prod.image_url ||
                    (Array.isArray(prod.images) && prod.images.length > 0
                      ? prod.images[0]
                      : null);

                  return (
                    <div
                      key={prod.id}
                      className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/30 rounded-xl transition"
                    >
                      {/* Left: Thumbnail & Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt=""
                            className="w-11 h-11 rounded-lg object-cover border border-border/50 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-secondary border border-border/50 flex items-center justify-center shrink-0 text-muted-foreground">
                            <Package className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-foreground truncate">
                            {prod.name}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="font-numeric font-semibold text-xs text-primary">
                              {formatBDT(displayPrice)}
                            </span>
                            {displayStock > 0 ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                                স্টক: {displayStock} pcs
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">
                                স্টক শেষ (0)
                              </span>
                            )}
                          </div>

                          {/* Variant Selector if available */}
                          {hasVariants && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <Tag className="w-3 h-3 text-muted-foreground" />
                              <select
                                value={currentVariantLabel}
                                onChange={(e) =>
                                  setSelectedVariants((prev) => ({
                                    ...prev,
                                    [prod.id]: e.target.value,
                                  }))
                                }
                                className="text-[11px] bg-background border border-border rounded px-1.5 py-0.5 max-w-[200px]"
                              >
                                {variants.map((v: any, vi: number) => (
                                  <option key={vi} value={v.label}>
                                    {v.label} (৳{v.price || prod.price}) · স্টক: {v.stock ?? 0}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Add Button */}
                      <Button
                        size="sm"
                        variant="default"
                        className="h-8 text-xs px-3 bg-gold hover:bg-gold/90 text-primary-foreground font-medium shrink-0"
                        onClick={() => addRealProduct(prod)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        যোগ করুন
                      </Button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Picker Footer */}
            <div className="p-3 border-t border-border/80 bg-secondary/20 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setIsProductPickerOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
