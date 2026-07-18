import { FileText } from "lucide-react";

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
  | { key: string; label: string; type: "flat" }
  | {
      key: string;
      label: string;
      type: "list";
      fields: StructuredFieldConfig[];
      emptyItem: Record<string, string>;
      itemLabelField: string;
      itemLabelFallback: string;
    };

const SECTIONS: SectionConfig[] = [
  { key: "homepage_hero", label: "Homepage Hero", type: "flat" },
  { key: "how_it_works", label: "How It Works", type: "flat" },
  { key: "faq", label: "FAQ", type: "flat" },
  {
    key: "homepage_logos",
    label: "Trusted-By Logos",
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
  { key: "homepage_video", label: "Video Demo", type: "flat" },
];

export default async function AdminContentPage() {
  const rows = await db.siteContent.findMany({
    where: { section: { in: SECTIONS.map((s) => s.key) } },
    orderBy: { key: "asc" },
  });

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8">
      <PageHeader
        icon={FileText}
        title="Site content"
        description="Edit homepage hero text, how-it-works steps, FAQ entries, trusted-by logos, templates, testimonials, and the video demo."
      />

      <div>
        <Tabs defaultValue={SECTIONS[0].key}>
          <TabsList>
            {SECTIONS.map((section) => (
              <TabsTrigger key={section.key} value={section.key}>
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {SECTIONS.map((section) => {
            const sectionRows = rows.filter((row) => row.section === section.key);
            return (
              <TabsContent key={section.key} value={section.key} className="pt-4">
                <Card className="w-fit max-w-full border-border/80">
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
        </Tabs>
      </div>
    </main>
  );
}
