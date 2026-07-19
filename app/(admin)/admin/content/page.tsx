import {
  Building2,
  FileText,
  HelpCircle,
  LayoutPanelTop,
  LayoutTemplate,
  ListOrdered,
  Quote,
  Video,
  type LucideIcon,
} from "lucide-react";

import { SiteContentForm } from "@/components/admin/site-content-form";
import {
  StructuredSiteContentForm,
  type StructuredFieldConfig,
} from "@/components/admin/structured-site-content-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/lib/db";

const ACCENT_OPTIONS = [
  { value: "emerald", label: "Emerald" },
  { value: "blue", label: "Blue" },
  { value: "violet", label: "Violet" },
  { value: "amber", label: "Amber" },
  { value: "rose", label: "Rose" },
  { value: "slate", label: "Slate" },
];

type SectionConfig =
  | { key: string; label: string; icon: LucideIcon; type: "flat" }
  | {
      key: string;
      label: string;
      icon: LucideIcon;
      type: "list";
      fields: StructuredFieldConfig[];
      emptyItem: Record<string, string>;
      itemLabelField: string;
      itemLabelFallback: string;
    };

const SECTIONS: SectionConfig[] = [
  { key: "homepage_hero", label: "Homepage Hero", icon: LayoutPanelTop, type: "flat" },
  { key: "how_it_works", label: "How It Works", icon: ListOrdered, type: "flat" },
  { key: "faq", label: "FAQ", icon: HelpCircle, type: "flat" },
  {
    key: "homepage_logos",
    label: "Trusted-By Logos",
    icon: Building2,
    type: "list",
    fields: [
      { name: "name", label: "Company name", type: "text", placeholder: "e.g. Northwind" },
      { name: "logoUrl", label: "Logo image (optional)", type: "image" },
    ],
    emptyItem: { name: "", logoUrl: "" },
    itemLabelField: "name",
    itemLabelFallback: "Logo",
  },
  {
    key: "homepage_templates",
    label: "Templates",
    icon: LayoutTemplate,
    type: "list",
    fields: [
      { name: "industry", label: "Industry", type: "text", placeholder: "e.g. Real Estate" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "accent", label: "Accent color", type: "select", options: ACCENT_OPTIONS },
    ],
    emptyItem: { industry: "", description: "", accent: "emerald" },
    itemLabelField: "industry",
    itemLabelFallback: "Template",
  },
  {
    key: "homepage_testimonials",
    label: "Testimonials",
    icon: Quote,
    type: "list",
    fields: [
      { name: "name", label: "Name", type: "text" },
      { name: "role", label: "Role / company", type: "text" },
      { name: "quote", label: "Quote", type: "textarea" },
      { name: "rating", label: "Rating (1-5)", type: "number" },
    ],
    emptyItem: { name: "", role: "", quote: "", rating: "5" },
    itemLabelField: "name",
    itemLabelFallback: "Testimonial",
  },
  { key: "homepage_video", label: "Video Demo", icon: Video, type: "flat" },
];

export default async function AdminContentPage() {
  const rows = await db.siteContent.findMany({
    where: { section: { in: SECTIONS.map((s) => s.key) } },
    orderBy: { key: "asc" },
  });

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8">
      <PageHeader
        icon={FileText}
        title="Site content"
        description="Edit homepage hero text, how-it-works steps, FAQ entries, trusted-by logos, templates, testimonials, and the video demo."
      />

      <Tabs defaultValue={SECTIONS[0].key} orientation="vertical" className="flex-col items-start gap-6 md:flex-row">
        <TabsList
          variant="line"
          className="h-fit w-full shrink-0 flex-col items-stretch gap-1 rounded-2xl border border-border/70 bg-card p-2 shadow-[0_1px_2px_rgba(24,24,20,0.04),0_8px_20px_-12px_rgba(24,24,20,0.10)] md:w-1/4"
        >
          {SECTIONS.map((section) => (
            <TabsTrigger
              key={section.key}
              value={section.key}
              className="h-auto w-full justify-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground after:hidden data-[active]:bg-primary/15 data-[active]:text-ink data-[active]:shadow-none"
            >
              <section.icon className="size-4 shrink-0" />
              <span className="truncate">{section.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="min-w-0 flex-1 md:w-3/4">
          {SECTIONS.map((section) => {
            const sectionRows = rows.filter((row) => row.section === section.key);
            return (
              <TabsContent key={section.key} value={section.key} className="mt-0">
                <Card className="border-border/80">
                  <CardContent>
                    {section.type === "flat" ? (
                      <SiteContentForm
                        section={section.key}
                        initialEntries={sectionRows.map((row) => ({ key: row.key, value: row.value }))}
                      />
                    ) : (
                      <StructuredSiteContentForm
                        section={section.key}
                        fields={section.fields}
                        emptyItem={section.emptyItem}
                        itemLabelField={section.itemLabelField}
                        itemLabelFallback={section.itemLabelFallback}
                        initialItems={sectionRows.flatMap((row) => {
                          try {
                            return [JSON.parse(row.value) as Record<string, string>];
                          } catch {
                            return [];
                          }
                        })}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </div>
      </Tabs>
    </main>
  );
}
