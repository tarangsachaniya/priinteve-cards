import {
  LayoutDashboard,
  BookOpen,
  QrCode,
  ReceiptText,
  Settings,
  Star,
  type LucideIcon,
} from "lucide-react";

export type RestaurantNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const RESTAURANT_NAV_ITEMS: RestaurantNavItem[] = [
  { href: "/r/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/r/orders", label: "Orders", icon: ReceiptText },
  { href: "/r/menu", label: "Menu", icon: BookOpen },
  { href: "/r/tables", label: "Tables & QR", icon: QrCode },
  { href: "/r/reviews", label: "Reviews", icon: Star },
  { href: "/r/settings", label: "Settings", icon: Settings },
];
