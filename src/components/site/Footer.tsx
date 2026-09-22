import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, MapPin, Phone, Mail } from "lucide-react";
import { useContactInfo } from "@/lib/contact";
import { useBrandLogo } from "@/lib/brand";
import { siteContentOptions } from "@/lib/queries";

export function Footer() {
  const c = useContactInfo();
  const brand = useBrandLogo();
  const { data: content } = useQuery({ ...siteContentOptions() });

  const tagline = content?.footer_tagline || "ইসলামিক আর্ট ও ক্রাফট গ্যালারি";
  const description =
    content?.footer_description ||
    "প্রিমিয়াম আর্ট ও ক্যালিগ্রাফি সামগ্রী — অ্যাক্রিলিক কালার, ব্রাশ, ক্যানভাস ও ফ্রেম। সারাদেশে দ্রুত হোম ডেলিভারি।";
  const openingHours = content?.footer_opening_hours || "Always Open · ৭ দিন খোলা";
  const copyrightText =
    content?.footer_copyright_text || `© ${new Date().getFullYear()} Ibn Mobarak Art Gallery`;

  return (
    <footer className="mt-24 border-t border-border bg-secondary/50 pb-20 lg:pb-0 overflow-hidden w-full">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-16 md:pt-24">
        {/* Brand block */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 pb-12">
          <div className="md:col-span-4">
            <Link to="/" aria-label="Ibn Mobarak Art Gallery home" className="inline-flex items-center">
              {brand.hasCustomLogo && brand.url ? (
                <img
                  src={brand.url}
                  alt="Ibn Mobarak Art Gallery"
                  width={200}
                  height={134}
                  className="w-auto object-contain"
                  style={{ height: `${3.5 * brand.scale}rem` }}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="font-display text-2xl font-bold tracking-tight text-primary">
                  Ibn Mobarak Art Gallery
                </span>
              )}
            </Link>
            <p
              className="mt-6 text-2xl md:text-3xl leading-tight text-foreground/90"
              style={{ fontFamily: "'Tiro Bangla', serif" }}
            >
              {tagline}
            </p>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm leading-relaxed">
              {description}
            </p>
            <div className="mt-6 h-px w-16 bg-gold" />
          </div>

          {/* Link columns */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
            <div>
              <h4 className="text-[11px] uppercase tracking-[0.28em] text-gold mb-4">
                Explore
              </h4>
              <ul className="space-y-2.5 text-sm text-foreground/80">
                <li><Link to="/products" className="hover:text-primary transition-colors">Shop All</Link></li>
                <li><Link to="/categories" className="hover:text-primary transition-colors">Categories</Link></li>
                <li><Link to="/wishlist" className="hover:text-primary transition-colors">Wishlist</Link></li>
                <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div className="min-w-0">
              <h4 className="text-[11px] uppercase tracking-[0.28em] text-gold mb-4">
                Visit
              </h4>
              <ul className="space-y-2.5 text-sm text-foreground/80">
                <li className="inline-flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" strokeWidth={1.6} />
                  <span className="break-words">{c.address}</span>
                </li>
                <li className="text-muted-foreground pl-5 text-xs">{openingHours}</li>
                <li>
                  <a href={c.phoneHref} className="inline-flex items-center gap-2 hover:text-primary transition-colors text-xs sm:text-sm">
                    <Phone className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={1.6} />
                    <span className="truncate">{c.phone}</span>
                  </a>
                </li>
                {c.email ? (
                  <li className="min-w-0">
                    <a
                      href={`mailto:${c.email}`}
                      className="inline-flex items-start gap-2 hover:text-primary transition-colors text-xs tracking-tight break-all"
                    >
                      <Mail className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" strokeWidth={1.6} />
                      <span className="break-all">{c.email}</span>
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-[11px] uppercase tracking-[0.28em] text-gold mb-4">
                Follow
              </h4>
              <ul className="space-y-2.5 text-sm text-foreground/80">
                {c.instagramUrl ? (
                  <li>
                    <a href={c.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
                      Instagram <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </li>
                ) : null}
                <li>
                  <a href={c.facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
                    Facebook <ArrowUpRight className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a href={c.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
                    WhatsApp <ArrowUpRight className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-border/70 py-5 px-6">
        <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-center sm:justify-start">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="w-1 h-1 rounded-full bg-gold" />
              {copyrightText.replace("{year}", String(new Date().getFullYear()))}
            </span>
            <span className="hidden sm:inline text-border">·</span>
            <Link to="/shipping-policy" className="hover:text-primary transition-colors">
              ডেলিভারি চার্জ ও পলিসি
            </Link>
            <span className="text-border">·</span>
            <Link to="/terms" className="hover:text-primary transition-colors">
              শর্তাবলী ও নিয়ম
            </Link>
          </div>
          <span className="inline-flex items-center gap-1">
            Designed and developed by
            <a
              href="https://ibrahimkholilullah.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-medium text-foreground/80 hover:text-primary underline underline-offset-4 decoration-dotted transition-colors"
            >
              Ibrahim Kholilullah
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
