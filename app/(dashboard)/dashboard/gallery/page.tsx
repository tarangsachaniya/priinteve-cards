import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Images } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGalleryUsage } from "@/lib/plan-limits";
import { GalleryManager } from "@/components/dashboard/gallery-manager";
import { PageHeader } from "@/components/shared/page-header";

export default async function GalleryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [items, cardSettings, usage] = await Promise.all([
    db.galleryItem.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    db.cardSettings.findUnique({ where: { userId } }),
    getGalleryUsage(userId),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-6 sm:p-8">
      <PageHeader
        icon={Images}
        title="Gallery"
        description="Add photos and videos to showcase on your card."
      />
      <GalleryManager
        initialItems={items}
        initialGalleryLayout={cardSettings?.galleryLayout ?? "grid"}
        usage={usage}
      />
    </main>
  );
}
