import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";

import { db } from "@/lib/db";
import { getGalleryUsage } from "@/lib/plan-limits";
import { getFieldTypeMeta, MANDATORY_FIELD_TYPES } from "@/lib/field-types";
import { DEFAULT_BRAND_COLOR, DEFAULT_CARD_MODE } from "@/lib/card-theme";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { UserForm } from "@/components/admin/user-form";
import { SectionBuilder } from "@/components/dashboard/section-builder";

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const [user, plans] = await Promise.all([
    db.user.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, email: true, slug: true, cardPublished: true },
    }),
    db.plan.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!user) {
    notFound();
  }

  const [existingFields, galleryItems, cardSettings, usage] = await Promise.all([
    db.cardField.findMany({ where: { userId: user.id }, orderBy: { order: "asc" } }),
    db.galleryItem.findMany({ where: { userId: user.id }, orderBy: { order: "asc" } }),
    db.cardSettings.findUnique({ where: { userId: user.id } }),
    getGalleryUsage(user.id),
  ]);

  // Same mandatory-field backfill the user's own builder page does, so an
  // admin-created (or admin-first-edited) card isn't missing required tabs.
  const present = new Set(existingFields.map((f) => f.fieldType));
  const missing = MANDATORY_FIELD_TYPES.filter((type) => !present.has(type));
  if (missing.length > 0) {
    const nextOrder = existingFields.reduce((max, f) => Math.max(max, f.order), -1) + 1;
    await db.cardField.createMany({
      data: missing.map((fieldType, index) => ({
        userId: user.id,
        fieldType,
        label: getFieldTypeMeta(fieldType).label,
        value: "",
        order: nextOrder + index,
      })),
    });
  }

  const fields = missing.length
    ? await db.cardField.findMany({ where: { userId: user.id }, orderBy: { order: "asc" } })
    : existingFields;

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8 lg:p-10">
      <div className="mb-4">
        <Button variant="ghost" size="sm" render={<Link href="/admin/users" />}>
          <ArrowLeft /> Back to Users
        </Button>
      </div>

      <PageHeader
        icon={Users}
        title={user.name ?? user.email}
        description={user.email}
        action={
          <UserForm
            plans={plans}
            userId={user.id}
            trigger={<Button variant="outline" size="sm">Edit account details</Button>}
          />
        }
      />

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
        apiBase={`/api/admin/users/${user.id}`}
        mode="admin"
      />
    </main>
  );
}
