import { useEffect, useState } from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import { useContactInfo } from "@/lib/contact";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.14.26.34.27.56l.05 1.78a.8.8 0 0 0 1.12.71l1.99-.88a.8.8 0 0 1 .53-.04c.91.25 1.88.39 2.9.39 5.64 0 10-4.13 10-9.69C22 6.13 17.64 2 12 2zm6 7.79-2.94 4.66a1.5 1.5 0 0 1-2.16.4l-2.34-1.76a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66a1.5 1.5 0 0 1 2.16-.4l2.34 1.76a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.18.69.63z" />
    </svg>
  );
}

export function WhatsAppButton() {
  const c = useContactInfo();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const options = [
    {
      label: "WhatsApp",
      hint: "Chat instantly",
      href: c.whatsappHref,
      icon: <WhatsAppIcon className="w-5 h-5" />,
      bg: "bg-[oklch(0.55_0.15_150)]",
      external: true,
    },
    {
      label: "Call us",
      hint: c.phone,
      href: c.phoneHref,
      icon: <Phone className="w-5 h-5" />,
      bg: "bg-[oklch(0.6_0.16_240)]",
      external: false,
    },
    {
      label: "Messenger",
      hint: "Send a message",
      href: c.messengerUrl,
      icon: <MessengerIcon className="w-5 h-5" />,
      bg: "bg-[oklch(0.6_0.2_310)]",
      external: true,
    },
  ];

  return (
    <>
      {open && (
        <button
          aria-label="Close contact menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-[2px] animate-in fade-in"
        />
      )}

      <div className="fixed right-4 sm:right-6 bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-6 z-50 flex flex-col items-end gap-3">
        {open && (
          <div className="flex flex-col items-end gap-2.5 mb-1">
            {options.map((o, i) => (
              <a
                key={o.label}
                href={o.href}
                {...(o.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${i * 60}ms` }}
                className="group flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
              >
                <span className="rounded-full bg-card text-foreground px-3.5 py-2 shadow-lg border border-border whitespace-nowrap">
                  <span className="block text-sm font-medium leading-tight">{o.label}</span>
                  <span className="block text-[11px] text-muted-foreground leading-tight">{o.hint}</span>
                </span>
                <span className={`${o.bg} text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-1 ring-white/20 group-hover:scale-105 transition-transform`}>
                  {o.icon}
                </span>
              </a>
            ))}
          </div>
        )}

        <button
          type="button"
          aria-label={open ? "Close contact options" : "Contact us"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="relative inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_var(--primary)] ring-1 ring-white/20 hover:scale-105 active:scale-95 transition-transform"
        >
          {!open && (
            <span aria-hidden className="absolute -inset-1 rounded-full bg-primary/25 animate-pulse pointer-events-none" />
          )}
          <span className="relative transition-transform duration-200" style={{ transform: open ? "rotate(90deg)" : "none" }}>
            {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />}
          </span>
        </button>
      </div>
    </>
  );
}
