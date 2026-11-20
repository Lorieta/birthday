"use client";

import Image from "next/image";
import { CldImage } from "next-cloudinary";
import { getVideoPoster, hasDisplayableMedia, isCloudinaryAsset, isVideo } from "@/lib/media";
import type { MediaAsset } from "@/lib/scrapbook-types";
import { cn } from "@/lib/utils";

interface MediaViewProps {
  media: MediaAsset;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

function MediaFallback({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_35%),linear-gradient(145deg,#f8dbe3,#e8c6d1)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_35%),linear-gradient(145deg,#4a2b34,#2d1b22)]",
        className,
      )}
    />
  );
}

export function MediaImage({
  media,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
}: MediaViewProps) {
  if (!hasDisplayableMedia(media)) {
    return <MediaFallback className={className} />;
  }

  const label = alt ?? media.alt ?? "Scrapbook memory";

  if (isCloudinaryAsset(media)) {
    return (
      <CldImage
        src={media.publicId as string}
        alt={label}
        fill
        sizes={sizes}
        className={cn("object-cover", className)}
        crop="fill"
        gravity="auto"
      />
    );
  }

  return (
    <Image
      src={media.src}
      alt={label}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}

export function MediaVideo({
  media,
  className,
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  preload = "metadata",
}: MediaViewProps & {
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  preload?: "none" | "metadata" | "auto";
}) {
  if (!hasDisplayableMedia(media)) {
    return <MediaFallback className={className} />;
  }

  return (
    <video
      src={media.src}
      poster={getVideoPoster(media)}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline
      preload={preload}
      aria-label={media.alt ?? "Scrapbook video"}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

export function MediaPosterImage({
  media,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
}: MediaViewProps) {
  const poster = getVideoPoster(media);

  if (!poster) {
    return (
      <MediaImage
        media={media}
        alt={alt}
        className={className}
        sizes={sizes}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src={poster}
      alt={alt ?? media.alt ?? "Video thumbnail"}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}

export function MediaView({
  media,
  alt,
  className,
  sizes,
  priority,
}: MediaViewProps) {
  if (isVideo(media)) {
    return (
      <MediaVideo
        media={media}
        alt={alt}
        className={className}
        controls
        preload="metadata"
      />
    );
  }

  return (
    <MediaImage
      media={media}
      alt={alt}
      className={className}
      sizes={sizes}
      priority={priority}
    />
  );
}
