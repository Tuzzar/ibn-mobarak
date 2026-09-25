import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/external";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ORDER_STATUSES, type AdminOrder } from "@/lib/order-admin";
import { updateAdminOrder } from "@/lib/orders.functions";

export async function saveOrderChanges(
  order: AdminOrder,
  form: {
    customer_name: string;
    customer_phone: string;
    address: string;
    notes: string;
    status: string;
  },
) {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) throw new Error("Not authenticated");

  const checks: Array<[keyof typeof form, string]> = [
    ["customer_name", order.customer_name],
    ["customer_phone", order.customer_phone],
    ["address", order.address],
    ["notes", order.notes ?? ""],
    ["status", order.status],
  ];
  const changes = checks
    .filter(([k, oldVal]) => form[k] !== oldVal)
    .map(([k, oldVal]) => ({ field: k as string, oldVal, newVal: form[k] }));

  await updateAdminOrder({
    data: {
      orderId: order.id,
      form,
      changes,
      user: {
        id: user.id,
        email: user.email ?? null,
      },
    },
  });
}

export function OrderEditPanel({
  order,
  onSaved,
  disabled = false,
}: {
  order: AdminOrder;
  onSaved: () => void;
  disabled?: boolean;
}) {
  const initial = {
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    address: order.address,
    notes: order.notes ?? "",
    status: order.status,
  };
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const dirty = (Object.keys(initial) as Array<keyof typeof initial>).some(
    (k) => form[k] !== initial[k],
  );

  const save = async () => {
    if (!dirty || disabled) return;
    setSaving(true);
    try {
      await saveOrderChanges(order, form);
      toast.success("Order updated");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4 text-primary" />
          <h3 className="font-display text-lg">Edit details</h3>
        </div>
        {disabled && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            (লক অবস্থায় সম্পাদনা নিষ্ক্রিয়)
          </span>
        )}
      </div>

      <label className="block mb-4">
        <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
          Status
        </span>
        <div className="flex gap-2">
          <select
            value={form.status}
            disabled={disabled || saving}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm capitalize disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button onClick={save} disabled={disabled || !dirty || saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
          </Button>
        </div>
      </label>

      <div className="space-y-3">
        <Field label="Customer name">
          <Input
            value={form.customer_name}
            disabled={disabled || saving}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
          />
        </Field>
        <Field label="Phone">
          <Input
            value={form.customer_phone}
            disabled={disabled || saving}
            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
          />
        </Field>
        <Field label="Address">
          <Textarea
            rows={2}
            value={form.address}
            disabled={disabled || saving}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </Field>
        <Field label="Notes">
          <Textarea
            rows={2}
            value={form.notes}
            disabled={disabled || saving}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <Button variant="ghost" size="sm" onClick={() => setForm(initial)} disabled={disabled || !dirty || saving}>
          <X className="w-4 h-4 mr-1" /> Reset
        </Button>
        <Button size="sm" onClick={save} disabled={disabled || !dirty || saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-1" /> Save changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
