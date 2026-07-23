import { PlayIcon } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { getYoutubeThumbnail, getYoutubeVideoId } from "@/lib/youtube";
import type { HomepageVideo } from "@/lib/site-content";

export function VideoDemo({ video }: { video: HomepageVideo }) {
  const youtubeId = video.videoUrl ? getYoutubeVideoId(video.videoUrl) : null;
  const posterUrl = video.thumbnailUrl || (video.videoUrl ? getYoutubeThumbnail(video.videoUrl) : null);

  return (
    <section className="bg-ink py-24 lg:py-36">
      <div className="mx-auto max-w-4xl px-6 text-center lg:px-20">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
            {video.heading}
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="relative mt-12 aspect-video overflow-hidden rounded-[1.5rem] border border-white/10">
          {youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={video.heading}
              className="absolute inset-0 size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : video.videoUrl ? (
            <video
              src={video.videoUrl}
              poster={posterUrl ?? undefined}
              controls
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <>
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(198,241,53,0.18),transparent_55%),linear-gradient(135deg,#1b1d1a,#0b0c0a)]"
              />
              <button
                type="button"
                aria-label="Play product demo video"
                className="group absolute inset-0 flex items-center justify-center"
                disabled
              >
                <span className="flex size-16 items-center justify-center rounded-full bg-primary transition-transform duration-300 group-hover:scale-105">
                  <PlayIcon className="ml-1 size-6 fill-ink text-ink" />
                </span>
              </button>
              <span className="absolute bottom-5 left-6 font-mono text-xs text-white/60">
                {video.durationLabel}
              </span>
            </>
          )}
        </Reveal>

        <p className="mt-5 text-sm text-ink-muted">{video.caption}</p>
      </div>
    </section>
  );
}
