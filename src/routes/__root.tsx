import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { AuthProvider } from "@/lib/auth";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";
import { TopProgressBar } from "@/components/site/TopProgressBar";
import { MetaPixel } from "@/components/site/MetaPixel";
import { SiteLoader } from "@/components/site/SiteLoader";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-primary">404</h1>
        <p className="mt-4 text-muted-foreground">This page is out of stock.</p>
        <a href="/" className="mt-6 inline-block px-6 py-3 rounded-full bg-primary text-primary-foreground">
          Back to home
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl text-primary">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-block px-6 py-3 rounded-full bg-primary text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ibn Mobarak Art Gallery — Premium Art & Calligraphy Supplies in Bangladesh" },
      { name: "description", content: "Curated premium art supplies, canvases, paints, calligraphy pens, brushes and craft kits, delivered across Bangladesh." },
      { property: "og:site_name", content: "Ibn Mobarak Art Gallery" },
      { property: "og:locale", content: "en_US" },
      { property: "og:url", content: "https://ibnmobarakartgallery.com" },
      { property: "og:title", content: "Ibn Mobarak Art Gallery — Premium Art & Calligraphy Supplies in Bangladesh" },
      { property: "og:description", content: "Curated premium art supplies, canvases, paints, calligraphy pens, brushes and craft kits, delivered across Bangladesh." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Ibn Mobarak Art Gallery — Premium Art & Calligraphy Supplies in Bangladesh" },
      { name: "twitter:description", content: "Curated premium art supplies, canvases, paints, calligraphy pens, brushes and craft kits, delivered across Bangladesh." },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0f172a" },
      { property: "og:image", content: "https://ibnmobarakartgallery.com/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: "https://ibnmobarakartgallery.com/og-image.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/favicon.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" } as any,
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Baloo+Da+2:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=Hind+Siliguri:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Tiro+Bangla&display=swap",
      },

    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Ibn Mobarak Art Gallery",
          url: "https://ibnmobarakartgallery.com",
          logo: "https://ibnmobarakartgallery.com/logo.png",
          description: "Curated premium art supplies, canvases, paints, calligraphy pens, brushes and craft kits, delivered across Bangladesh.",
          sameAs: [
            "https://facebook.com/ibnartgallery"
          ],
          areaServed: "BD",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Layout() {
  const routerPath = useRouterState({ select: (s) => s.location.pathname });
  const path = typeof window !== "undefined" ? window.location.pathname : routerPath;
  const isAdmin = path.startsWith("/admin");
  const isLanding = path.startsWith("/landing");
  const isCategories = path === "/categories";
  const isCheckout = path.startsWith("/checkout") || path.startsWith("/order-success");
  const isBare = isAdmin || isLanding;
  return (
    <>
      <SiteLoader />
      <TopProgressBar />
      {!isBare && <Header />}
      <main className={isBare ? "" : isCategories ? "overflow-hidden" : isCheckout ? "min-h-[70vh] pb-8 lg:pb-16" : "min-h-[60vh] pb-20 lg:pb-0 animate-in fade-in duration-300"}>
        <Outlet />
      </main>
      {!isBare && !isCategories && <Footer />}
      {!isBare && !isCheckout && <WhatsAppButton />}
      {!isBare && !isCheckout && <MobileBottomNav />}
      {!isBare && <MetaPixel />}
      <Toaster position="top-center" richColors />
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ConfirmDialogProvider>
              <Layout />
            </ConfirmDialogProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
