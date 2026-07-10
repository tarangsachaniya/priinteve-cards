"use client";

import { useState } from "react";
import { PlayIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

function getEmbedUrl(url: string): string | null {
  const youtubeMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/
  );
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  return null;
}

export function VideoDemoSection({
  videoUrl,
  caption,
  durationLabel,
}: {
  videoUrl?: string;
  caption?: string;
  durationLabel?: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (!videoUrl?.trim()) return null;

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <section className="border-t border-border/60 py-24 md:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <div className="reveal-on-scroll mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="h-auto rounded-full px-3 py-1 shadow-xs-token">
            Watch
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            See a card built, tapped, and updated
          </h2>
          {caption && (
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">{caption}</p>
          )}
        </div>

        <div className="reveal-on-scroll shadow-card-lg mt-14 aspect-video overflow-hidden rounded-2xl border border-border/60 bg-black ring-1 ring-foreground/5">
          {playing ? (
            embedUrl ? (
              <iframe
                src={embedUrl}
                title="Product demo"
                className="size-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={videoUrl} controls autoPlay className="size-full" />
            )
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group relative flex size-full items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800"
              aria-label="Play product demo video"
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-md transition-transform duration-300 group-hover:scale-105 group-hover:bg-white">
                <PlayIcon className="ml-1 size-6 fill-white text-white group-hover:fill-neutral-900 group-hover:text-neutral-900" />
              </span>
              {durationLabel && (
                <span className="absolute bottom-5 left-5 font-mono text-xs text-white/70">
                  {durationLabel}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
