import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { SetupWizard } from "@/components/wizard/setup-wizard";

export default async function DashboardSetupPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (session.user.role !== "USER") {
    redirect("/dashboard");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, slug: true, company: true, onboardingStep: true, cardPublished: true },
  });
  if (!user) {
    redirect("/login");
  }
  if (user.cardPublished) {
    redirect("/dashboard");
  }

  const [cardFields, galleryItems, cardSettings] = await Promise.all([
    db.cardField.findMany({ where: { userId: session.user.id }, orderBy: { order: "asc" } }),
    db.galleryItem.findMany({ where: { userId: session.user.id }, orderBy: { order: "asc" } }),
    db.cardSettings.findUnique({ where: { userId: session.user.id } }),
  ]);

  return (
    <main className="min-h-screen">
      <SetupWizard
        name={user.name ?? ""}
        slug={user.slug}
        initialCompany={user.company}
        initialStep={user.onboardingStep}
        initialCardFields={cardFields.map((f) => ({
          clientId: f.id,
          fieldType: f.fieldType,
          label: f.label,
          value: f.value,
        }))}
        initialGalleryItems={galleryItems.map((g) => ({
          id: g.id,
          type: g.type,
          url: g.url,
          order: g.order,
        }))}
        initialThemeId={cardSettings?.themeId ?? "default"}
        initialBrandColor={cardSettings?.brandColor ?? "#059669"}
        initialGalleryLayout={cardSettings?.galleryLayout ?? "grid"}
        initialVcfIncludePhoto={cardSettings?.vcfIncludePhoto ?? true}
      />
    </main>
  );
}
