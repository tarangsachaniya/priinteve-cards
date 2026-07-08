import { FileText } from "lucide-react";

import { SiteContentForm } from "@/components/admin/site-content-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/lib/db";

const SECTIONS = [
  { key: "homepage_hero", label: "Homepage Hero" },
  { key: "how_it_works", label: "How It Works" },
  { key: "faq", label: "FAQ" },
];

export default async function AdminContentPage() {
  const rows = await db.siteContent.findMany({
    where: { section: { in: SECTIONS.map((s) => s.key) } },
  });

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8">
      <PageHeader
        icon={FileText}
        title="Site Content"
        description="Edit homepage hero text, how-it-works steps, and FAQ entries."
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
          {SECTIONS.map((section) => (
            <TabsContent key={section.key} value={section.key} className="pt-4">
              <SiteContentForm
                section={section.key}
                initialEntries={rows
                  .filter((row) => row.section === section.key)
                  .map((row) => ({ key: row.key, value: row.value }))}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </main>
  );
}
