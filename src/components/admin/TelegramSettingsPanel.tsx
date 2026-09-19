import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Send, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getTelegramSettings,
  saveTelegramSettings,
  sendTelegramTest,
} from "@/lib/telegram.functions";

export function TelegramSettingsPanel() {
  const load = useServerFn(getTelegramSettings);
  const save = useServerFn(saveTelegramSettings);
  const test = useServerFn(sendTelegramTest);

  const [token, setToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyLeads, setNotifyLeads] = useState(true);
  const [leadDelay, setLeadDelay] = useState("2");
  const [saving, setSaving] = useState(false);

  const [testing, setTesting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["telegram-settings"],
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
    if (!data) return;
    setToken("");
    setChatId(data.chat_id ?? "");
    setNotifyOrders(Boolean(data.notify_orders));
    setNotifyLeads(Boolean(data.notify_leads));
    setLeadDelay(String(data.lead_delay_minutes ?? 2));
  }, [data]);

  const onSave = async () => {
    setSaving(true);
    try {
      const delay = Number(leadDelay);
      await save({
        data: {
          ...(token.trim() ? { bot_token: token.trim() } : {}),
          chat_id: chatId.trim(),
          notify_orders: notifyOrders,
          notify_leads: notifyLeads,
          lead_delay_minutes: Number.isFinite(delay) ? Math.max(0, Math.min(1440, Math.round(delay))) : 2,
        },
      });
      setToken("");
      toast.success("Telegram settings saved");
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  };


  const onTest = async () => {
    setTesting(true);
    try {
      const res = await test({});
      if (res?.ok) toast.success("Test message পাঠানো হয়েছে — Telegram দেখুন");
      else toast.error(res?.error || "Test message পাঠানো যায়নি");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <section className="mt-6 bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5">
      <div>
        <h2 className="font-display text-lg">Telegram notifications</h2>
        <p className="text-xs text-muted-foreground mt-1">
          নতুন অর্ডার আর ইনকমপ্লিট অর্ডার সাথে সাথে Telegram-এ চলে আসবে। BotFather থেকে bot token
          নিন, আর নিজের/গ্রুপের chat id দিন। Token field ফাঁকা রাখলে আগের token-ই থাকবে।
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          <span
            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
              data?.configured
                ? "border-primary/30 text-primary bg-primary/5"
                : "border-border text-muted-foreground bg-muted/40"
            }`}
          >
            {data?.configured ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5" />
            )}
            Telegram {data?.configured ? "connected" : "not set"}
          </span>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Bot token
              </span>
              <Input
                type="password"
                autoComplete="off"
                placeholder="123456789:AA…"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              {data?.bot_token ? (
                <span className="block text-[11px] text-muted-foreground">
                  Saved: {data.bot_token}
                </span>
              ) : null}
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Chat ID
              </span>
              <Input
                autoComplete="off"
                placeholder="123456789 বা -1001234567890"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                ইনকমপ্লিট অ্যালার্ট ডিলে (মিনিট)
              </span>
              <Input
                type="number"
                min={0}
                max={1440}
                inputMode="numeric"
                value={leadDelay}
                onChange={(e) => setLeadDelay(e.target.value)}
              />
              <span className="block text-[11px] text-muted-foreground">
                এই সময়ের মধ্যে কাস্টমার অর্ডার করলে ইনকমপ্লিট মেসেজ যাবে না (ডিফল্ট ২ মিনিট)।
              </span>
            </label>
          </div>


          <div className="flex flex-wrap gap-3">
            <Toggle
              checked={notifyOrders}
              onChange={setNotifyOrders}
              label="নতুন অর্ডার অ্যালার্ট"
            />
            <Toggle
              checked={notifyLeads}
              onChange={setNotifyLeads}
              label="ইনকমপ্লিট অর্ডার অ্যালার্ট"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save settings
            </Button>
            <Button
              onClick={onTest}
              disabled={testing || !data?.configured}
              variant="outline"
              className="gap-2"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send test message
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs transition ${
        checked
          ? "border-primary/40 bg-primary/5 text-foreground"
          : "border-border text-muted-foreground"
      }`}
    >
      <span
        className={`w-8 h-4 rounded-full relative transition ${
          checked ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-background transition-all ${
            checked ? "left-[1.125rem]" : "left-0.5"
          }`}
        />
      </span>
      {label}
    </button>
  );
}
