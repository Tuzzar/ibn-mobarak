import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { siteContentOptions } from "@/lib/queries";

export type ContactInfo = {
  email: string;
  phone: string;
  phoneHref: string;
  phoneSecondary: string;
  phoneSecondaryHref: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  whatsappMessage: string;
  whatsappHref: string;
  address: string;
  addressFull: string;
  facebookUrl: string;
  instagramUrl: string;
  messengerUrl: string;
  websiteDomain: string;
  websiteUrl: string;
};

const DEFAULTS = {
  email: "mahmudmobarakbd123@gmail.com",
  phone: "01677-870998",
  phoneSecondary: "01780-283161",
  whatsappNumber: "8801677870998",
  whatsappDisplay: "01677-870998",
  whatsappMessage: "আসসালামু আলাইকুম! আমি Ibn Mobarak Art Gallery এর আর্ট ও ক্যালিগ্রাফি সামগ্রী সম্পর্কে জানতে চাই।",
  address: "House 37/3, Rasulpur R/A, Donia, Jatrabari, Dhaka 1236",
  addressFull: "House: 37/3, DSCC Rasulpur, Donia, Jatrabari, Dhaka 1236, Bangladesh",
  facebookUrl: "https://facebook.com/ibnartgallery",
  instagramUrl: "",
  messengerUrl: "https://m.me/ibnartgallery",
  websiteDomain: "ibnmobarakartgallery.com",
  websiteUrl: "https://ibnmobarakartgallery.com",
};

export function buildContactInfo(map?: Record<string, string>): ContactInfo {
  const get = (k: string, fallback: string) => {
    const v = map?.[k]?.trim();
    return v && v.length > 0 ? v : fallback;
  };
  const phone = get("contact_phone", DEFAULTS.phone);
  const phoneSecondary = get("contact_phone_secondary", DEFAULTS.phoneSecondary);
  const rawWa = get("contact_whatsapp", DEFAULTS.whatsappNumber).replace(/[^\d]/g, "");
  const whatsappNumber = rawWa.startsWith("880")
    ? rawWa
    : rawWa.startsWith("0")
      ? `88${rawWa}`
      : `880${rawWa}`;
  const whatsappMessage = get("contact_whatsapp_message", DEFAULTS.whatsappMessage);
  const websiteDomain = get("contact_website_domain", DEFAULTS.websiteDomain);
  const websiteUrl = get("contact_website_url", `https://${websiteDomain}`);
  return {
    email: get("contact_email", DEFAULTS.email),
    phone,
    phoneHref: `tel:${phone.replace(/[^\d+]/g, "")}`,
    phoneSecondary,
    phoneSecondaryHref: `tel:${phoneSecondary.replace(/[^\d+]/g, "")}`,
    whatsappNumber,
    whatsappDisplay: get("contact_whatsapp_display", DEFAULTS.whatsappDisplay),
    whatsappMessage,
    whatsappHref: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`,
    address: get("contact_address", DEFAULTS.address),
    addressFull: get("contact_address_full", DEFAULTS.addressFull),
    facebookUrl: get("contact_facebook_url", DEFAULTS.facebookUrl),
    instagramUrl: get("contact_instagram_url", DEFAULTS.instagramUrl),
    messengerUrl: get("contact_messenger_url", DEFAULTS.messengerUrl),
    websiteDomain,
    websiteUrl,
  };
}

// Hydration-safe: server render + first client render always use DEFAULTS,
// so the SSR HTML matches initial client output. After mount, the real
// site_content data (from the query cache) is applied. This avoids the
// hydration mismatch caused by stale/cached cross-render data.
export function useContactInfo(): ContactInfo {
  const { data } = useQuery(siteContentOptions());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return buildContactInfo(mounted ? data : undefined);
}
