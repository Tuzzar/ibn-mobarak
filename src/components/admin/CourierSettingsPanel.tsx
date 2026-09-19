import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCourierSettings, saveCourierSettings } from "@/lib/courier.functions";

type Form = {
  bdcourier_api_key: string;
  steadfast_api_key: string;
  steadfast_secret_key: string;
};

const EMPTY: Form = {
  bdcourier_api_key: "",
  steadfast_api_key: "",
  steadfast_secret_key: "",
};

export function CourierSettingsPanel() {
  const load = useServerFn(getCourierSettings);
  const save = useServerFn(saveCourierSettings);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["courier-settings"],
    queryFn: async () => {
      try {
        return await load();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  useEffect(() => {
    setForm(EMPTY);
  }, [data]);

  const onSave = async () => {
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v.trim().length > 0),
    );
    if (Object.keys(payload).length === 0) {
      toast.error("Kono notun key deowa hoyni.");
      return;
    }
    setSaving(true);
    try {
      await save({ data: payload as Partial<Form> });
      toast.success("Courier API keys saved");
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save keys");
    } finally {
      setSaving(false);
    }
  };

  const Status = ({ ok, label }: { ok: boolean; label: string }) => (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
        ok
          ? "border-primary/30 text-primary bg-primary/5"
          : "border-border text-muted-foreground bg-muted/40"
      }`}
    >
      {ok ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
      {label} {ok ? "connected" : "not set"}
    </span>
  );

  return (
    <section className="mt-6 bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5">
      <div>
        <h2 className="font-display text-lg">Courier API keys</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Order-e customer-er courier delivery history dekhar jonno. Key gulo shudhu server-e use
          hoy, kokhono customer-er browser-e jay na. Field faka rakhle age-r key ta thakbe.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Status ok={Boolean(data?.configured?.bdcourier)} label="BDCourier" />
            <Status ok={Boolean(data?.configured?.steadfast)} label="Steadfast" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="BDCourier API key" hint={data?.bdcourier_api_key}>
              <Input
                type="password"
                autoComplete="off"
                placeholder="bdcourier.com → API key"
                value={form.bdcourier_api_key}
                onChange={(e) => setForm({ ...form, bdcourier_api_key: e.target.value })}
              />
            </Field>
            <Field label="Steadfast API key" hint={data?.steadfast_api_key}>
              <Input
                type="password"
                autoComplete="off"
                placeholder="Steadfast panel → Api Key"
                value={form.steadfast_api_key}
                onChange={(e) => setForm({ ...form, steadfast_api_key: e.target.value })}
              />
            </Field>
            <Field label="Steadfast secret key" hint={data?.steadfast_secret_key}>
              <Input
                type="password"
                autoComplete="off"
                placeholder="Steadfast panel → Secret Key"
                value={form.steadfast_secret_key}
                onChange={(e) => setForm({ ...form, steadfast_secret_key: e.target.value })}
              />
            </Field>
          </div>

          <Button onClick={onSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save keys
          </Button>
        </>
      )}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-muted-foreground">Saved: {hint}</span> : null}
    </label>
  );
}
