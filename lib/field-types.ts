import {
  AlignLeft,
  AtSign,
  FileText,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Type as TypeIcon,
  type LucideIcon,
} from "lucide-react";

export const FIELD_TYPE_META: Record<string, { icon: LucideIcon; label: string }> = {
  text: { icon: TypeIcon, label: "Text" },
  bio: { icon: AlignLeft, label: "Bio" },
  phone: { icon: Phone, label: "Phone" },
  email: { icon: Mail, label: "Email" },
  website: { icon: Globe, label: "URL" },
  address: { icon: MapPin, label: "Address" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp" },
  file: { icon: FileText, label: "File/PDF" },
  photo: { icon: FileText, label: "Photo" },
  social_instagram: { icon: AtSign, label: "Instagram" },
  social_linkedin: { icon: AtSign, label: "LinkedIn" },
  social_twitter: { icon: AtSign, label: "Twitter" },
  social_facebook: { icon: AtSign, label: "Facebook" },
  social_youtube: { icon: AtSign, label: "YouTube" },
};

export const SOCIAL_PLATFORMS = [
  { fieldType: "social_instagram", label: "Instagram" },
  { fieldType: "social_linkedin", label: "LinkedIn" },
  { fieldType: "social_twitter", label: "Twitter" },
  { fieldType: "social_facebook", label: "Facebook" },
  { fieldType: "social_youtube", label: "YouTube" },
];

export function getFieldTypeMeta(fieldType: string) {
  return FIELD_TYPE_META[fieldType] ?? { icon: TypeIcon, label: fieldType };
}

export { Share2 as SocialGroupIcon };
