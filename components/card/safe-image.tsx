"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function SafeImage({
  src,
  alt,
  className,
  fallback,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback: React.ReactNode;
}) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || errored) return <>{fallback}</>;

  return (
    <span className={cn("relative inline-block", className)}>
      {!loaded && <Skeleton className="absolute inset-0 h-full w-full" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn("h-full w-full", className, !loaded && "opacity-0")}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </span>
  );
}
