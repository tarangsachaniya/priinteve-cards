import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { isPastGracePeriod } from "@/lib/card-expiry";
import { ExpiryMessage } from "@/components/card/expiry-message";
import { PublicCard } from "@/components/card/public-card";
import { CardModeScript } from "@/components/card/card-mode-script";
import { CardModeToggle } from "@/components/card/card-mode-toggle";
import { ViewTracker } from "@/components/card/view-tracker";
import { DEFAULT_BRAND_COLOR, DEFAULT_CARD_MODE, normalizeCardMode } from "@/lib/card-theme";

export const revalidate = 7200;
export const dynamic = "force-static";

export async function generateStaticParams() {
  const users = await db.user.findMany({
    where: {
      cardPublished: true,
      OR: [{ planExpiresAt: null }, { planExpiresAt: { gt: new Date() } }],
    },
    select: { slug: true },
  });

  return users.map((user) => ({ slug: user.slug }));
}

export default async function CardPage({
  params,
}: {
  params: { slug: string };
}) {
  const user = await db.user.findUnique({
    where: { slug: params.slug },
    include: {
      cardFields: { where: { isVisible: true }, orderBy: { order: "asc" } },
      galleryItems: { orderBy: { order: "asc" } },
      cardSettings: true,
    },
  });

  if (!user || !user.cardPublished) {
    notFound();
  }

  if (isPastGracePeriod(user.planExpiresAt)) {
    return <ExpiryMessage />;
  }

  const photoField = user.cardFields.find((f) => f.fieldType === "photo");
  const themeId = user.cardSettings?.themeId ?? "default";
  const themeMode = normalizeCardMode(user.cardSettings?.themeMode ?? DEFAULT_CARD_MODE);

  return (
    <>
      {/* Must stay the first child: it applies the theme and the visitor's
          remembered mode to <html> before the card markup below is parsed,
          which is what keeps mode switching flash-free on this static page. */}
      <CardModeScript slug={params.slug} themeId={themeId} ownerMode={themeMode} />
      <ViewTracker slug={params.slug} />
      <PublicCard
        data={{
          name: user.name ?? params.slug,
          slug: params.slug,
          photoUrl: photoField?.value ?? null,
          fields: user.cardFields
            .filter((f) => f.fieldType !== "photo")
            .map((f) => ({ id: f.id, fieldType: f.fieldType, label: f.label, value: f.value, order: f.order })),
          galleryItems: user.galleryItems.map((item) => ({
            id: item.id,
            type: item.type,
            url: item.url,
            order: item.order,
            caption: item.caption,
            altText: item.altText,
          })),
          settings: {
            themeId,
            themeMode,
            brandColor: user.cardSettings?.brandColor || DEFAULT_BRAND_COLOR,
            galleryLayout: user.cardSettings?.galleryLayout ?? "grid",
            headingFont: user.cardSettings?.headingFont,
            bodyFont: user.cardSettings?.bodyFont,
          },
          gallerySectionOrder: user.cardSettings?.gallerySectionOrder ?? 9999,
        }}
      />
      <CardModeToggle slug={params.slug} ownerMode={themeMode} />
    </>
  );
}
