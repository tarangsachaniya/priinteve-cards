import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGalleryUsage } from "@/lib/plan-limits";
import { SectionBuilder } from "@/components/dashboard/section-builder";

export default async function BuilderPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [user, fields, galleryItems, cardSettings, usage] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, slug: true, cardPublished: true },
    }),
    db.cardField.findMany({ where: { userId }, orderBy: { order: "asc" } }),
    db.galleryItem.findMany({ where: { userId }, orderBy: { order: "asc" } }),
    db.cardSettings.findUnique({ where: { userId } }),
    getGalleryUsage(userId),
  ]);

  if (!user) {
    redirect("/login");
  }

  const photoField = fields.find((f) => f.fieldType === "photo");

  return (
    <main className="p-6 sm:p-8 lg:p-10">
      <SectionBuilder
        userName={user.name ?? user.slug}
        userPhotoUrl={photoField?.value ?? null}
        userSlug={user.slug}
        initialCardPublished={user.cardPublished}
        initialFields={fields
          .filter((f) => f.fieldType !== "photo")
          .map((f) => ({
            id: f.id,
            fieldType: f.fieldType,
            label: f.label,
            value: f.value,
            order: f.order,
            isVisible: f.isVisible,
          }))}
        initialGalleryItems={galleryItems.map((item) => ({
          id: item.id,
          type: item.type,
          url: item.url,
          order: item.order,
          caption: item.caption,
          altText: item.altText,
        }))}
        initialGalleryLayout={cardSettings?.galleryLayout ?? "grid"}
        initialGallerySectionOrder={cardSettings?.gallerySectionOrder ?? 9999}
        galleryUsage={usage}
        brandColor={cardSettings?.brandColor ?? "#059669"}
        themeId={cardSettings?.themeId ?? "default"}
      />
    </main>
  );
}
