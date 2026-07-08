"use client";

import { useState } from "react";
import { Play } from "lucide-react";

import { getYoutubeThumbnail, getYoutubeVideoId } from "@/lib/youtube";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export type PublicGalleryItem = {
  type: "IMAGE" | "YOUTUBE";
  url: string;
  order: number;
};

function GalleryThumb({ item }: { item: PublicGalleryItem }) {
  const src = item.type === "YOUTUBE" ? getYoutubeThumbnail(item.url) ?? item.url : item.url;
  return (
    <div className="relative h-full w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full rounded-md object-cover" />
      {item.type === "YOUTUBE" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/20">
          <Play className="size-8 fill-white text-white" />
        </div>
      )}
    </div>
  );
}

function GalleryItemButton({
  item,
  className,
  onOpen,
}: {
  item: PublicGalleryItem;
  className: string;
  onOpen: (item: PublicGalleryItem) => void;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => onOpen(item)}
      aria-label={item.type === "YOUTUBE" ? "Play video" : "View image"}
    >
      <GalleryThumb item={item} />
    </button>
  );
}

export function CardGallery({
  items,
  layout,
}: {
  items: PublicGalleryItem[];
  layout: string;
}) {
  const [active, setActive] = useState<PublicGalleryItem | null>(null);

  if (items.length === 0) return null;
  const sorted = [...items].sort((a, b) => a.order - b.order);

  const grid = (
    <div className="grid grid-cols-2 gap-2">
      {sorted.map((item, i) => (
        <GalleryItemButton key={i} item={item} className="aspect-square" onOpen={setActive} />
      ))}
    </div>
  );

  const carousel = (
    <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
      {sorted.map((item, i) => (
        <GalleryItemButton
          key={i}
          item={item}
          className="aspect-square w-full shrink-0 snap-start"
          onOpen={setActive}
        />
      ))}
    </div>
  );

  const masonry = (
    <div className="columns-2 gap-2 [&>*]:mb-2 [&>*]:break-inside-avoid">
      {sorted.map((item, i) => (
        <GalleryItemButton
          key={i}
          item={item}
          className={i % 2 === 0 ? "aspect-square w-full" : "aspect-[3/4] w-full"}
          onOpen={setActive}
        />
      ))}
    </div>
  );

  const lightbox = (
    <div className="grid grid-cols-3 gap-2">
      {sorted.map((item, i) => (
        <GalleryItemButton key={i} item={item} className="aspect-square" onOpen={setActive} />
      ))}
    </div>
  );

  const layoutMap: Record<string, React.ReactNode> = {
    carousel,
    masonry,
    lightbox,
    grid,
  };

  return (
    <>
      <div className="w-full">{layoutMap[layout] ?? grid}</div>
      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogTitle className="sr-only">
            {active?.type === "YOUTUBE" ? "Video" : "Image"}
          </DialogTitle>
          {active?.type === "YOUTUBE" ? (
            <div className="aspect-video w-full">
              <iframe
                className="h-full w-full rounded-md"
                src={`https://www.youtube.com/embed/${getYoutubeVideoId(active.url)}`}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : active ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={active.url} alt="" className="max-h-[80vh] w-full rounded-md object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
