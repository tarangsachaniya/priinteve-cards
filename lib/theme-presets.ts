export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  fontFamily: string;
  layout: "centered" | "split" | "banner" | "minimal";
  spacing: "compact" | "cozy" | "spacious";
  previewClassName: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "default",
    name: "Classic",
    description: "Clean and centered — a safe, professional default that suits most roles.",
    fontFamily: "font-sans",
    layout: "centered",
    spacing: "cozy",
    previewClassName: "items-center text-center gap-3 p-4",
  },
  {
    id: "modern",
    name: "Modern",
    description: "A bold split layout with generous spacing, for a contemporary feel.",
    fontFamily: "font-sans",
    layout: "split",
    spacing: "spacious",
    previewClassName: "items-start text-left gap-5 p-6",
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Serif type and roomy spacing — a refined look for consultants and creatives.",
    fontFamily: "font-serif",
    layout: "centered",
    spacing: "spacious",
    previewClassName: "items-center text-center gap-5 p-6",
  },
  {
    id: "bold",
    name: "Bold",
    description: "Tight, left-aligned banner layout that puts your name and title front and center.",
    fontFamily: "font-sans",
    layout: "banner",
    spacing: "compact",
    previewClassName: "items-start text-left gap-2 p-3",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Compact and understated, with just the essentials front and center.",
    fontFamily: "font-sans",
    layout: "minimal",
    spacing: "compact",
    previewClassName: "items-center text-center gap-1.5 p-3",
  },
];

export function getThemePreset(id: string): ThemePreset {
  return THEME_PRESETS.find((t) => t.id === id) ?? THEME_PRESETS[0];
}

export const THEME_PRESET_IDS = THEME_PRESETS.map((t) => t.id) as [string, ...string[]];

export const FONT_OPTIONS = [
  { id: "font-sans", label: "Sans-serif" },
  { id: "font-serif", label: "Serif" },
  { id: "font-mono", label: "Monospace" },
] as const;

export const FONT_OPTION_IDS = FONT_OPTIONS.map((f) => f.id) as [string, ...string[]];
