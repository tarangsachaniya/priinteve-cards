"use client";

import { ExternalLink, Mail, MapPin, Phone, QrCode, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThemeCardField = { fieldType: string; label: string; value: string; order: number; isVisible?: boolean };
export type ThemeCardGallery = { type: "IMAGE" | "YOUTUBE"; url: string; order: number; caption?: string | null; altText?: string | null };
export type ThemeCardData = {
  name: string; slug: string; fields: ThemeCardField[]; galleryItems: ThemeCardGallery[];
  settings: { themeId: string; brandColor: string; headingFont?: string; bodyFont?: string; galleryLayout?: string };
};

const CONTACTS = ["phone", "whatsapp", "email", "address", "website", "google_maps_url"];
function get(data: ThemeCardData, type: string) { return data.fields.find((field) => field.fieldType === type)?.value || ""; }
function stats(data: ThemeCardData) {
  return data.fields.filter((field) => field.fieldType === "stat").map((field) => {
    try { return { label: field.label, value: JSON.parse(field.value).value || "" }; } catch { return { label: field.label, value: field.value }; }
  });
}
function LinkIcon({ type }: { type: string }) { return type === "phone" ? <Phone /> : type === "email" ? <Mail /> : type === "address" || type === "google_maps_url" ? <MapPin /> : <ExternalLink />; }
function Contact({ data, compact = false }: { data: ThemeCardData; compact?: boolean }) {
  return <div className={cn("grid gap-2", compact ? "grid-cols-2" : "sm:grid-cols-2")}>
    {CONTACTS.map((type) => { const value = get(data, type); if (!value) return null; return <a key={type} href={type === "email" ? `mailto:${value}` : type === "phone" ? `tel:${value}` : type === "whatsapp" ? `https://wa.me/${value.replace(/\\D/g, "")}` : value} className="rounded-xl border bg-white/80 p-3 text-sm shadow-sm transition hover:-translate-y-0.5">
      <span className="flex items-center gap-2 font-semibold"><LinkIcon type={type} /><span className="capitalize">{type.replace("_", " ")}</span></span><span className="mt-1 block truncate text-xs text-slate-500">{value}</span>
    </a>; })}
  </div>;
}
function Gallery({ data }: { data: ThemeCardData }) { if (!data.galleryItems.length) return null; return <div className="grid grid-cols-3 gap-2">{data.galleryItems.slice(0, 6).map((item, index) => <img key={`${item.url}-${index}`} src={item.url} alt={item.altText || item.caption || "Gallery image"} className="aspect-square rounded-xl object-cover" />)}</div>; }
function Payments({ data }: { data: ThemeCardData }) { const upi = get(data, "upi_id"); const qr = get(data, "upi_qr"); if (!upi && !qr) return null; return <section className="rounded-2xl border bg-white p-4"><div className="flex items-center gap-2 font-bold"><WalletCards className="size-4" /> Payments</div>{upi && <a href={`upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(data.name)}&cu=INR`} className="mt-3 block rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">Pay via UPI · {upi}</a>}{qr && <img src={qr} alt="UPI payment QR code" className="mt-3 size-28 rounded-lg" />}</section>; }

export function ThemeCard({ data, className }: { data: ThemeCardData; className?: string }) {
  const photo = get(data, "photo"); const designation = get(data, "designation"); const company = get(data, "company_name"); const about = get(data, "company_description"); const theme = data.settings.themeId; const brand = data.settings.brandColor || "#059669"; const allStats = stats(data);
  const identity = <><div className="flex items-center gap-3"><div className="size-16 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-4 ring-white">{photo ? <img src={photo} alt={data.name} className="size-full object-cover" /> : <span className="flex size-full items-center justify-center text-xl font-bold text-slate-600">{data.name.slice(0, 1)}</span>}</div><div><h1 className={cn("text-2xl font-black tracking-tight", data.settings.headingFont)}>{data.name}</h1>{designation && <p className="text-sm font-medium opacity-75">{designation}</p>}{company && <p className="text-xs opacity-60">{company}</p>}</div></div></>;
  const body = <><Contact data={data} compact={theme === "bento"} />{about && <section><p className="text-[11px] font-bold uppercase tracking-[.16em] opacity-50">About</p><p className="mt-2 text-sm leading-6">{about}</p></section>}{allStats.length > 0 && <div className="grid grid-cols-3 divide-x rounded-xl border bg-white/70">{allStats.map((stat) => <div key={stat.label} className="p-3 text-center"><div className="font-mono text-lg font-bold">{stat.value}</div><div className="text-[10px] opacity-60">{stat.label}</div></div>)}</div>}<Gallery data={data} /><Payments data={data} /></>;
  if (theme === "bento") return <article className={cn("mx-auto max-w-lg rounded-[28px] bg-[#edf6f0] p-3 text-slate-900", className)} style={{ "--brand": brand } as React.CSSProperties}><div className="grid grid-cols-2 gap-3"><div className="col-span-2 overflow-hidden rounded-3xl bg-slate-900 p-5 text-white" style={{ background: `linear-gradient(135deg, ${brand}, #0f172a)` }}>{identity}</div>{body}</div></article>;
  if (theme === "editorial") return <article className={cn("mx-auto max-w-lg bg-[#f8f4eb] p-6 text-[#17201b]", className)} style={{ "--brand": brand } as React.CSSProperties}><div className="border-b pb-5" style={{ borderColor: brand }}>{identity}</div><div className="mt-5 space-y-6 font-serif">{body}</div><div className="mt-6 flex justify-end"><QrCode className="size-6" style={{ color: brand }} /></div></article>;
  return <article className={cn("mx-auto max-w-lg overflow-hidden rounded-3xl bg-[#f3faf5] text-slate-900 shadow-xl", className)} style={{ "--brand": brand } as React.CSSProperties}><div className="h-20" style={{ background: `linear-gradient(135deg, ${brand}, #183c2a)` }} /><div className="-mt-8 space-y-5 p-5">{identity}{body}</div></article>;
}
