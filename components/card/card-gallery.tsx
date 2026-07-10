"use client";

import { useState } from "react";
import { Play } from "lucide-react";

import { getYoutubeThumbnail, getYoutubeVideoId } from "@/lib/youtube";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MotionItem, MotionSection } from "@/components/card/motion-section";

export type PublicGalleryItem = {
  id?: string;
  type: "IMAGE" | "YOUTUBE";
  url: string;
  order: number;
  caption?: string | null;
  altText?: string | null;
};

function GalleryThumb({ item }: { item: PublicGalleryItem }) {
  const src = item.type === "YOUTUBE" ? getYoutubeThumbnail(item.url) ?? item.url : item.url;
  return (
    <div className="flex h-full w-full flex-col gap-1">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-md ring-1 ring-foreground/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={item.altText ?? ""}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        {item.type === "YOUTUBE" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
            <Play className="size-8 fill-white text-white drop-shadow" />
          </div>
        )}
      </div>
      {item.caption && (
        <span className="shrink-0 truncate px-0.5 text-xs text-muted-foreground">{item.caption}</span>
      )}
    </div>
  );
}

function GalleryItemButton({
  item,
  onOpen,
}: {
  item: PublicGalleryItem;
  onOpen: (item: PublicGalleryItem) => void;
}) {
  return (
    <button
      type="button"
      className="group h-full w-full"
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
    <MotionSection stagger className="grid grid-cols-2 gap-2">
      {sorted.map((item, i) => (
        <MotionItem key={i} className="aspect-square">
          <GalleryItemButton item={item} onOpen={setActive} />
        </MotionItem>
      ))}
    </MotionSection>
  );

  const carousel = (
    <MotionSection stagger className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
      {sorted.map((item, i) => (
        <MotionItem key={i} className="aspect-square w-full shrink-0 snap-start">
          <GalleryItemButton item={item} onOpen={setActive} />
        </MotionItem>
      ))}
    </MotionSection>
  );

  const masonry = (
    <MotionSection stagger className="columns-2 gap-2 [&>*]:mb-2 [&>*]:break-inside-avoid">
      {sorted.map((item, i) => (
        <MotionItem key={i} className={i % 2 === 0 ? "aspect-square w-full" : "aspect-[3/4] w-full"}>
          <GalleryItemButton item={item} onOpen={setActive} />
        </MotionItem>
      ))}
    </MotionSection>
  );

  const lightbox = (
    <MotionSection stagger className="grid grid-cols-3 gap-2">
      {sorted.map((item, i) => (
        <MotionItem key={i} className="aspect-square">
          <GalleryItemButton item={item} onOpen={setActive} />
        </MotionItem>
      ))}
    </MotionSection>
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
