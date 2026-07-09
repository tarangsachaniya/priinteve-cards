import type { LucideIcon } from "lucide-react";
import {
  Nfc,
  QrCode,
  BarChart3,
  Contact,
  Target,
  Share2,
  MessageCircle,
  CalendarClock,
  MapPin,
  Palette,
  Globe,
  Search,
  Mail,
  LayoutTemplate,
  Download,
  Headset,
} from "lucide-react";

export type PlanFeatureKey =
  | "nfc"
  | "qr"
  | "analytics"
  | "contact_saving"
  | "lead_capture"
  | "social_links"
  | "whatsapp"
  | "appointment_booking"
  | "google_maps"
  | "custom_theme"
  | "custom_domain"
  | "seo"
  | "email_signature"
  | "premium_templates"
  | "download_qr"
  | "priority_support";

export const PLAN_FEATURES: { key: PlanFeatureKey; label: string; icon: LucideIcon }[] = [
  { key: "nfc", label: "NFC Support", icon: Nfc },
  { key: "qr", label: "QR Support", icon: QrCode },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "contact_saving", label: "Contact Saving", icon: Contact },
  { key: "lead_capture", label: "Lead Capture", icon: Target },
  { key: "social_links", label: "Social Links", icon: Share2 },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "appointment_booking", label: "Appointment Booking", icon: CalendarClock },
  { key: "google_maps", label: "Google Maps", icon: MapPin },
  { key: "custom_theme", label: "Custom Theme", icon: Palette },
  { key: "custom_domain", label: "Custom Domain", icon: Globe },
  { key: "seo", label: "SEO", icon: Search },
  { key: "email_signature", label: "Email Signature", icon: Mail },
  { key: "premium_templates", label: "Premium Templates", icon: LayoutTemplate },
  { key: "download_qr", label: "Download QR", icon: Download },
  { key: "priority_support", label: "Priority Support", icon: Headset },
];

export const PLAN_FEATURE_KEYS = new Set<string>(PLAN_FEATURES.map((f) => f.key));

export const PLAN_FEATURE_LABELS: Record<string, string> = Object.fromEntries(
  PLAN_FEATURES.map((f) => [f.key, f.label])
);
