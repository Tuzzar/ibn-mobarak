import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useContactInfo } from "@/lib/contact";

export const Route = createFileRoute("/landing")({
  component: LandingLayout,
});

function LandingLayout() {
  const contact = useContactInfo();
  return (
    <div className="landing-theme min-h-screen flex flex-col">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" aria-label="Ibn Mobarak Art Gallery — Home" className="inline-flex items-center gap-2">
            <span className="font-display text-2xl text-primary leading-none">Ibn Mobarak Art Gallery</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hidden sm:inline">Art & Lifestyle</span>
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={contact.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex h-9 px-3 items-center rounded-full border border-accent/40 text-accent text-xs font-semibold hover:bg-accent/10"
            >
              WhatsApp
            </a>
            <a
              href="#order"
              className="h-9 px-4 inline-flex items-center rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide"
            >
              অর্ডার করুন
            </a>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-foreground text-background/90 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-10 text-center">
          <div className="font-display text-2xl text-secondary">Ibn Mobarak Art Gallery</div>
          <div className="mt-2 text-sm opacity-80">ঐতিহ্যকে ঘরে ঘরে — হাতে তৈরি, ভালোবাসায় গড়া। 🪡✨</div>
          <div className="mt-4 text-xs opacity-60">© {new Date().getFullYear()} Ibn Mobarak Art Gallery — All rights reserved.</div>
        </div>
      </footer>
      
    </div>
  );
}
