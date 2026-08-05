"use client";

import { ExternalLink, FileText, Mail, MapPin, Phone, QrCode, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";
import { ServicesSection } from "@/components/card/services-section";
import { ProductsSection } from "@/components/card/products-section";
import { TestimonialsSection } from "@/components/card/testimonials-section";
import { FaqSection } from "@/components/card/faq-section";
import { ButtonsSection } from "@/components/card/buttons-section";
import type { ServiceItem, ProductItem, TestimonialItem, FaqItem, ButtonItem } from "@/lib/card-sections";

export type ThemeCardField = { fieldType: string; label: string; value: string; order: number; isVisible?: boolean };
export type ThemeCardGallery = { type: "IMAGE" | "YOUTUBE"; url: string; order: number; caption?: string | null; altText?: string | null };
export type ThemeCardData = {
  name: string; slug: string; fields: ThemeCardField[]; galleryItems: ThemeCardGallery[];
  settings: { themeId: string; brandColor: string; headingFont?: string; bodyFont?: string; galleryLayout?: string };
};

const CONTACTS = ["phone", "whatsapp", "email", "address", "website", "google_maps_url"];
const SOCIAL_TYPES = ["social_instagram", "social_linkedin", "social_twitter", "social_facebook", "social_youtube"];
function get(data: ThemeCardData, type: string) { return data.fields.find((field) => field.fieldType === type)?.value || ""; }
function stats(data: ThemeCardData) {
  return data.fields.filter((field) => field.fieldType === "stat").map((field) => {
    try { return { label: field.label, value: JSON.parse(field.value).value || "" }; } catch { return { label: field.label, value: field.value }; }
  });
}
/** Every repeatable "group" section is stored as one CardField per item — label holds the item's title/name, value holds the rest as JSON. Invalid rows are skipped rather than breaking the whole card. */
function groupItems<T>(data: ThemeCardData, fieldType: string, titleKey: string): T[] {
  return data.fields
    .filter((field) => field.fieldType === fieldType)
    .map((field) => {
      try { return { [titleKey]: field.label, ...JSON.parse(field.value) } as T; } catch { return null; }
    })
    .filter((item): item is T => item !== null);
}
function LinkIcon({ type }: { type: string }) { return type === "phone" ? <Phone /> : type === "email" ? <Mail /> : type === "address" || type === "google_maps_url" ? <MapPin /> : <ExternalLink />; }
function Contact({ data, brand, compact = false }: { data: ThemeCardData; brand: string; compact?: boolean }) {
  return <div className={cn("grid gap-2", compact ? "grid-cols-2" : "sm:grid-cols-2")}>
    {CONTACTS.map((type) => { const value = get(data, type); if (!value) return null; return <a key={type} href={type === "email" ? `mailto:${value}` : type === "phone" ? `tel:${value}` : type === "whatsapp" ? `https://wa.me/${value.replace(/\D/g, "")}` : value} className="rounded-xl border bg-white/80 p-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--brand)]">
      <span className="flex items-center gap-2 font-semibold" style={{ color: brand }}><LinkIcon type={type} /><span className="capitalize">{type.replace("_", " ")}</span></span><span className="mt-1 block truncate text-xs text-slate-500">{value}</span>
    </a>; })}
  </div>;
}
function SocialLinks({ data, brand }: { data: ThemeCardData; brand: string }) {
  const links = SOCIAL_TYPES.map((type) => ({ type, url: get(data, type) })).filter((s) => s.url);
  if (links.length === 0) return null;
  return <div className="flex flex-wrap gap-2">
    {links.map((s) => <a key={s.type} href={s.url} target="_blank" rel="noopener noreferrer" className="rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition hover:-translate-y-0.5" style={{ borderColor: brand, color: brand }}>{s.type.replace("social_", "")}</a>)}
  </div>;
}
function ExtraFields({ data, brand }: { data: ThemeCardData; brand: string }) {
  const items = data.fields.filter((f) => (f.fieldType === "text" || f.fieldType === "file") && f.value);
  if (items.length === 0) return null;
  return <div className="flex flex-col gap-2">
    {items.map((f, i) => f.fieldType === "file" ? (
      <a key={`${f.label}-${i}`} href={f.value} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border bg-white/80 p-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5" style={{ color: brand }}>
        <FileText className="size-4" /> {f.label || "Download file"}
      </a>
    ) : (
      <section key={`${f.label}-${i}`}><p className="text-[11px] font-bold uppercase tracking-[.16em] opacity-50">{f.label}</p><p className="mt-1 text-sm leading-6">{f.value}</p></section>
    ))}
  </div>;
}
function Gallery({ data }: { data: ThemeCardData }) { if (!data.galleryItems.length) return null; return <div className="grid grid-cols-3 gap-2">{data.galleryItems.slice(0, 6).map((item, index) => <img key={`${item.url}-${index}`} src={item.url} alt={item.altText || item.caption || "Gallery image"} className="aspect-square rounded-xl object-cover" />)}</div>; }
function Payments({ data, brand }: { data: ThemeCardData; brand: string }) { const upi = get(data, "upi_id"); const qr = get(data, "upi_qr"); if (!upi && !qr) return null; return <section className="rounded-2xl border bg-white p-4"><div className="flex items-center gap-2 font-bold"><WalletCards className="size-4" /> Payments</div>{upi && <a href={`upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(data.name)}&cu=INR`} className="mt-3 block rounded-xl px-4 py-3 text-sm font-bold text-white" style={{ backgroundColor: brand }}>Pay via UPI · {upi}</a>}{qr && <img src={qr} alt="UPI payment QR code" className="mt-3 size-28 rounded-lg" />}</section>; }

/** Banner background: an uploaded cover image (with a dark overlay for text legibility) when set, else the theme's brand gradient. */
function bannerStyle(coverImage: string, brand: string, gradientEnd: string): React.CSSProperties {
  if (coverImage) {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.15), rgba(15,23,42,0.5)), url(${coverImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { background: `linear-gradient(135deg, ${brand}, ${gradientEnd})` };
}

export function ThemeCard({ data, className }: { data: ThemeCardData; className?: string }) {
  const photo = get(data, "photo"); const designation = get(data, "designation"); const company = get(data, "company_name"); const about = get(data, "company_description"); const coverImage = get(data, "cover_image"); const theme = data.settings.themeId; const brand = data.settings.brandColor || "#059669"; const allStats = stats(data);
  const services = groupItems<ServiceItem>(data, "service", "title");
  const products = groupItems<ProductItem>(data, "product", "title");
  const testimonials = groupItems<TestimonialItem>(data, "testimonial", "client_name");
  const faqs = groupItems<FaqItem>(data, "faq", "question");
  const buttons = groupItems<ButtonItem>(data, "button", "label");
  const identity = <><div className="flex items-center gap-3"><div className="size-16 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-4 ring-white">{photo ? <img src={photo} alt={data.name} className="size-full object-cover" /> : <span className="flex size-full items-center justify-center text-xl font-bold text-slate-600">{data.name.slice(0, 1)}</span>}</div><div><h1 className={cn("text-2xl font-black tracking-tight", data.settings.headingFont)}>{data.name}</h1>{designation && <p className="text-sm font-medium opacity-75">{designation}</p>}{company && <p className="text-xs opacity-60">{company}</p>}</div></div></>;
  const body = (
    <div className={cn("contents", data.settings.bodyFont)}>
      <Contact data={data} brand={brand} compact={theme === "bento"} />
      <SocialLinks data={data} brand={brand} />
      {about && <section><p className="text-[11px] font-bold uppercase tracking-[.16em] opacity-50">About</p><p className="mt-2 text-sm leading-6">{about}</p></section>}
      <ExtraFields data={data} brand={brand} />
      {allStats.length > 0 && <div className="grid grid-cols-3 divide-x rounded-xl border bg-white/70">{allStats.map((stat) => <div key={stat.label} className="p-3 text-center"><div className="font-mono text-lg font-bold" style={{ color: brand }}>{stat.value}</div><div className="text-[10px] opacity-60">{stat.label}</div></div>)}</div>}
      {services.length > 0 && <ServicesSection services={services} />}
      {products.length > 0 && <ProductsSection products={products} />}
      <Gallery data={data} />
      {testimonials.length > 0 && <TestimonialsSection testimonials={testimonials} />}
      {faqs.length > 0 && <FaqSection items={faqs} />}
      {buttons.length > 0 && <ButtonsSection items={buttons} />}
      <Payments data={data} brand={brand} />
    </div>
  );
  if (theme === "bento") return <article className={cn("mx-auto max-w-lg rounded-[28px] bg-[#edf6f0] p-3 text-slate-900", className)} style={{ "--brand": brand } as React.CSSProperties}><div className="grid grid-cols-2 gap-3"><div className="col-span-2 overflow-hidden rounded-3xl p-5 text-white" style={bannerStyle(coverImage, brand, "#0f172a")}>{identity}</div>{body}</div></article>;
  if (theme === "editorial") return <article className={cn("mx-auto max-w-lg bg-[#f8f4eb] p-6 text-[#17201b]", className)} style={{ "--brand": brand } as React.CSSProperties}><div className="border-b pb-5" style={{ borderColor: brand }}>{identity}</div><div className={cn("mt-5 space-y-6", data.settings.bodyFont || "font-serif")}>{body}</div><div className="mt-6 flex justify-end"><QrCode className="size-6" style={{ color: brand }} /></div></article>;
  return <article className={cn("mx-auto max-w-lg overflow-hidden rounded-3xl bg-[#f3faf5] text-slate-900 shadow-xl", className)} style={{ "--brand": brand } as React.CSSProperties}><div className="h-20" style={bannerStyle(coverImage, brand, "#183c2a")} /><div className="-mt-8 space-y-5 p-5">{identity}{body}</div></article>;
}
