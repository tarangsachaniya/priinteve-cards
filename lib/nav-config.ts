import {
  LayoutDashboard,
  LayoutTemplate,
  Wand2,
  CreditCard,
  Users,
  CreditCard as CreditCardIcon,
  Gift,
  Mail,
  FileText,
  KeyRound,
  IdCard,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/builder", label: "Card Builder", icon: LayoutTemplate },
  { href: "/dashboard/setup", label: "Setup", icon: Wand2 },
  { href: "/dashboard/plans", label: "Plans", icon: CreditCard },
  { href: "/dashboard/referrals", label: "Referrals", icon: Users },
];

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    label: "General",
    items: [{ href: "/dashboard", label: "My Card", icon: IdCard }],
  },
  {
    label: "Manage",
    items: [
      { href: "/admin/plans", label: "Plans", icon: CreditCardIcon },
      { href: "/admin/users", label: "Users", icon: Users },
    ],
  },
  {
    label: "Configuration",
    items: [
      { href: "/admin/referral-config", label: "Referral Config", icon: Gift },
      { href: "/admin/email-config", label: "Email Config", icon: Mail },
      { href: "/admin/content", label: "Site Content", icon: FileText },
      { href: "/admin/password", label: "Password", icon: KeyRound },
    ],
  },
];

const ALL_NAV_ITEMS: NavItem[] = [
  ...DASHBOARD_NAV_ITEMS,
  ...ADMIN_NAV_SECTIONS.flatMap((section) => section.items),
];

/** Longest-prefix match against every known nav href, for breadcrumb labels. */
export function labelForSegmentPath(path: string): string | undefined {
  const match = ALL_NAV_ITEMS.find((item) => item.href === path);
  return match?.label;
}
