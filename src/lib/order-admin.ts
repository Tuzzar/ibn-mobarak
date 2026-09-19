export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

export const ORDER_FIELD_LABELS: Record<string, string> = {
  customer_name: "Customer name",
  customer_phone: "Phone",
  address: "Address",
  notes: "Notes",
  status: "Status",
};

export type AdminOrder = {
  id: string;
  order_no?: number | null;
  source?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address: string;
  city: string;
  notes: string | null;
  items: Array<{ name: string; quantity: number; price: number; unit?: string; size?: string | null }>;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  created_at: string;
  courier_consignment_id?: string | null;
  courier_tracking_code?: string | null;
  courier_status?: string | null;
  courier_sent_at?: string | null;
};

export type OrderHistoryEntry = {
  id: string;
  order_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by_email: string | null;
  created_at: string;
};

export function orderLabel(order: Pick<AdminOrder, "id" | "order_no">) {
  return `#${order.order_no ?? order.id.slice(0, 8).toUpperCase()}`;
}

export function phoneKey(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}
