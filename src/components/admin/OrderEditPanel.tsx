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
}: {
  order: AdminOrder;
  onSaved: () => void;
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
    if (!dirty) return;
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
      <div className="flex items-center gap-2 mb-4">
        <Pencil className="w-4 h-4 text-primary" />
        <h3 className="font-display text-lg">Edit details</h3>
      </div>

      <label className="block mb-4">
        <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
          Status
        </span>
        <div className="flex gap-2">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm capitalize"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button onClick={save} disabled={!dirty || saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
          </Button>
        </div>
      </label>

      <div className="space-y-3">
        <Field label="Customer name">
          <Input
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
          />
        </Field>
        <Field label="Phone">
          <Input
            value={form.customer_phone}
            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
          />
        </Field>
        <Field label="Address">
          <Textarea
            rows={2}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </Field>
        <Field label="Notes">
          <Textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <Button variant="ghost" size="sm" onClick={() => setForm(initial)} disabled={!dirty || saving}>
          <X className="w-4 h-4 mr-1" /> Reset
        </Button>
        <Button size="sm" onClick={save} disabled={!dirty || saving}>
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
