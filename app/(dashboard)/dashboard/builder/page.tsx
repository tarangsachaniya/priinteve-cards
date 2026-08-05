import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGalleryUsage } from "@/lib/plan-limits";
import { getFieldTypeMeta, MANDATORY_FIELD_TYPES } from "@/lib/field-types";
import { DEFAULT_BRAND_COLOR, DEFAULT_CARD_MODE } from "@/lib/card-theme";
import { SectionBuilder } from "@/components/dashboard/section-builder";

export default async function BuilderPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [user, existingFields, galleryItems, cardSettings, usage] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { slug: true, cardPublished: true, name: true },
    }),
    db.cardField.findMany({ where: { userId }, orderBy: { order: "asc" } }),
    db.galleryItem.findMany({ where: { userId }, orderBy: { order: "asc" } }),
    db.cardSettings.findUnique({ where: { userId } }),
    getGalleryUsage(userId),
  ]);

  if (!user) {
    redirect("/login");
  }

  // Users arriving from setup already have these, but a card created another way
  // (e.g. by an admin) can be missing them, which would leave the tabs empty.
  const present = new Set(existingFields.map((f) => f.fieldType));
  const missing = MANDATORY_FIELD_TYPES.filter((type) => !present.has(type));
  if (missing.length > 0) {
    const nextOrder = existingFields.reduce((max, f) => Math.max(max, f.order), -1) + 1;
    await db.cardField.createMany({
      data: missing.map((fieldType, index) => ({
        userId,
        fieldType,
        label: getFieldTypeMeta(fieldType).label,
        value: "",
        order: nextOrder + index,
      })),
    });
  }

  const fields = missing.length
    ? await db.cardField.findMany({ where: { userId }, orderBy: { order: "asc" } })
    : existingFields;

  return (
    <main className="p-6 sm:p-8 lg:p-10">
      <SectionBuilder
        userName={user.name ?? ""}
        userSlug={user.slug}
        initialCardPublished={user.cardPublished}
        initialFields={fields
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
        initialThemeId={cardSettings?.themeId ?? "original"}
        initialThemeMode={cardSettings?.themeMode ?? DEFAULT_CARD_MODE}
        initialBrandColor={cardSettings?.brandColor || DEFAULT_BRAND_COLOR}
        initialHeadingFont={cardSettings?.headingFont ?? "font-sans"}
        initialBodyFont={cardSettings?.bodyFont ?? "font-sans"}
      />
    </main>
  );
}
