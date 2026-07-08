import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { isPastGracePeriod } from "@/lib/card-expiry";
import { ExpiryMessage } from "@/components/card/expiry-message";
import { PublicCard } from "@/components/card/public-card";
import { ViewTracker } from "@/components/card/view-tracker";

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

  return (
    <>
      <ViewTracker slug={params.slug} />
      <PublicCard
        data={{
          name: user.name ?? params.slug,
          slug: params.slug,
          photoUrl: photoField?.value ?? null,
          fields: user.cardFields
            .filter((f) => f.fieldType !== "photo")
            .map((f) => ({ fieldType: f.fieldType, label: f.label, value: f.value })),
          galleryItems: user.galleryItems.map((item) => ({
            type: item.type,
            url: item.url,
            order: item.order,
          })),
          settings: {
            themeId: user.cardSettings?.themeId ?? "default",
            brandColor: user.cardSettings?.brandColor ?? "#059669",
            galleryLayout: user.cardSettings?.galleryLayout ?? "grid",
          },
        }}
      />
    </>
  );
}
