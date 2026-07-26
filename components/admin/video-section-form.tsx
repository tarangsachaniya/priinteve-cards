"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type VideoSectionFormProps = {
  section: string;
  initialEntries: { key: string; value: string }[];
};

function toMap(entries: { key: string; value: string }[]) {
  return Object.fromEntries(entries.map((e) => [e.key, e.value]));
}

export function VideoSectionForm({ section, initialEntries }: VideoSectionFormProps) {
  const initial = toMap(initialEntries);
  const [heading, setHeading] = useState(initial.heading ?? "");
  const [caption, setCaption] = useState(initial.caption ?? "");
  const [durationLabel, setDurationLabel] = useState(initial.duration_label ?? "");
  const [videoUrl, setVideoUrl] = useState(initial.video_url ?? "");
  const [videoFileUrl, setVideoFileUrl] = useState(initial.video_file_url ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial.thumbnail_url ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", "video");
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Could not upload video");
        return;
      }
      setVideoFileUrl(data.url);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const body = {
        heading,
        caption,
        duration_label: durationLabel,
        video_url: videoUrl,
        video_file_url: videoFileUrl,
        thumbnail_url: thumbnailUrl,
      };
      const res = await fetch(`/api/admin/content/${section}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        toast.error("Could not save content");
        return;
      }

      toast.success("Content saved");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="video-heading">Heading</Label>
        <Input id="video-heading" value={heading} onChange={(e) => setHeading(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="video-caption">Caption</Label>
        <Textarea id="video-caption" value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="video-duration">Duration label (shown before a video is added)</Label>
        <Input
          id="video-duration"
          value={durationLabel}
          onChange={(e) => setDurationLabel(e.target.value)}
          placeholder="e.g. 1:24"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/10 p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="video-upload">Upload a video file</Label>
          {videoFileUrl && (
            <video src={videoFileUrl} controls className="aspect-video w-full rounded-xl border border-border" />
          )}
          <Input
            id="video-upload"
            type="file"
            accept="video/mp4,video/webm"
            disabled={isUploading}
            onChange={handleFileChange}
          />
          <p className="text-xs text-muted-foreground">MP4 or WebM, up to 50MB.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="video-youtube">YouTube link (used if no video file is uploaded)</Label>
          <Input
            id="video-youtube"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="video-thumbnail">Thumbnail image URL (optional)</Label>
          <Input
            id="video-thumbnail"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-1 w-fit">
        {isSubmitting ? "Saving…" : "Save section"}
      </Button>
    </form>
  );
}
