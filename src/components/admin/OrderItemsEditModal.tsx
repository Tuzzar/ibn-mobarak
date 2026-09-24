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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBDT } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/external";
import { updateAdminOrderItems } from "@/lib/orders.functions";
import type { AdminOrder } from "@/lib/order-admin";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  unit?: string;
  size?: string | null;
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
    (order.items ?? []).map((it) => ({
      name: it.name,
      quantity: Number(it.quantity) || 1,
      price: Number(it.price) || 0,
      unit: it.unit,
      size: it.size ?? null,
    })),
  );

  const [deliveryFee, setDeliveryFee] = useState<number>(
    Number(order.delivery_fee) || 0,
  );
  const [saving, setSaving] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");

  // Fetch products from catalog for easy selection
  const { data: catalogProducts, isLoading: catalogLoading } = useQuery({
    queryKey: ["admin-catalog-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, images, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
    enabled: isOpen && showCatalog,
  });

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return catalogProducts ?? [];
    return (catalogProducts ?? []).filter((p) =>
      p.name.toLowerCase().includes(q),
    );
  }, [catalogProducts, catalogSearch]);

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

  const addFromCatalog = (product: { name: string; price: number }) => {
    setItems((prev) => [
      ...prev,
      {
        name: product.name,
        quantity: 1,
        price: Number(product.price) || 0,
      },
    ]);
    setShowCatalog(false);
    setCatalogSearch("");
    toast.success(`Added "${product.name}"`);
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

      toast.success("Order items updated successfully");
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
      <div className="bg-card border border-border w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
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

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Products in this order ({items.length})
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCatalog(!showCatalog)}
                  className="h-8 text-xs gap-1 border-gold/40 hover:bg-gold/10"
                >
                  <Plus className="w-3.5 h-3.5 text-gold" />
                  {showCatalog ? "Close Catalog" : "Add from Catalog"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addCustomItem}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  + Custom Item
                </Button>
              </div>
            </div>

            {/* Catalog Search Panel */}
            {showCatalog && (
              <div className="p-3 bg-secondary/40 rounded-xl border border-border space-y-2 animate-in fade-in">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search product from store catalog..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-border/60">
                  {catalogLoading ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                      Loading catalog...
                    </div>
                  ) : filteredCatalog.length === 0 ? (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      No products found.
                    </div>
                  ) : (
                    filteredCatalog.map((prod) => (
                      <div
                        key={prod.id}
                        className="py-2 px-2 flex items-center justify-between hover:bg-card rounded-md transition"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          {Array.isArray(prod.images) && prod.images[0] ? (
                            <img
                              src={prod.images[0]}
                              alt=""
                              className="w-8 h-8 rounded object-cover border border-border/50 shrink-0"
                            />
                          ) : null}
                          <div className="text-xs font-medium truncate">
                            {prod.name}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-numeric font-semibold">
                            {formatBDT(Number(prod.price))}
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs px-2.5"
                            onClick={() => addFromCatalog(prod)}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Existing Items Table */}
            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-card flex flex-wrap items-center justify-between gap-3 text-sm"
                >
                  <div className="flex-1 min-w-[200px]">
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
                    {item.size ? (
                      <span className="text-[11px] text-muted-foreground mt-0.5 inline-block">
                        Size: {item.size}
                      </span>
                    ) : null}
                  </div>

                  {/* Quantity & Unit Price */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-border rounded-md">
                      <button
                        type="button"
                        onClick={() => updateItemQty(idx, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-secondary transition disabled:opacity-40"
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
                        className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-secondary transition"
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
                      className="p-1 text-muted-foreground hover:text-rose-500 transition"
                      title="Remove product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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

          {/* Summary Box */}
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

        {/* Footer actions */}
        <div className="p-4 border-t border-border bg-secondary/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Changes will be saved and recorded in order history.</span>
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
    </div>
  );
}
