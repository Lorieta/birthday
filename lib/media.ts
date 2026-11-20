import type { MediaAsset, Memory, MemorySection } from "@/lib/scrapbook-types";

/** Derive the cloud name from a Cloudinary public URL. */
function parseCloudNameFromSrc(src: string | undefined): string | undefined {
  if (!src) return undefined;
  const match = src.match(/^https:\/\/res\.cloudinary\.com\/([^/]+)\//);
  return match ? match[1] : undefined;
}

export function memoryAppearsInSection(memory: Memory, section: MemorySection) {
  return memory.sections?.includes(section) ?? memory.section === section;
}

export function isCloudinaryAsset(media: MediaAsset) {
  return media.source === "cloudinary" && Boolean(media.publicId);
}

export function normalizeMediaAsset(value: unknown): MediaAsset | null {
  if (!value || typeof value !== "object") return null;

  const media = value as Partial<MediaAsset>;
  if (
    (media.kind !== "image" && media.kind !== "video") ||
    typeof media.src !== "string" ||
    (media.source !== "cloudinary" && media.source !== "local")
  ) {
    return null;
  }

  return {
    kind: media.kind,
    source: media.source,
    src: media.src,
    publicId: typeof media.publicId === "string" ? media.publicId : undefined,
    poster: typeof media.poster === "string" ? media.poster : undefined,
    width: typeof media.width === "number" ? media.width : undefined,
    height: typeof media.height === "number" ? media.height : undefined,
    duration: typeof media.duration === "number" ? media.duration : undefined,
    alt: typeof media.alt === "string" ? media.alt : undefined,
  };
}

export function hasDisplayableMedia(media: MediaAsset) {
  if (isCloudinaryAsset(media)) return Boolean(media.publicId);
  return Boolean(media.src);
}

export function getVideoPoster(media: MediaAsset) {
  if (media.poster) return media.poster;
  if (media.kind !== "video") return media.src || undefined;

  const cloudName = parseCloudNameFromSrc(media.src);
  if (!cloudName || !media.publicId) return undefined;

  return `https://res.cloudinary.com/${cloudName}/video/upload/so_0,w_900,c_fill/${media.publicId}.jpg`;
}

/** Returns the number of days since the given date, or "—" if the date is invalid. */
export function daysSince(date: string): string {
  const start = new Date(`${date}T12:00:00`);
  if (Number.isNaN(start.getTime())) return "—";
  return String(Math.max(0, Math.floor((Date.now() - start.getTime()) / 86_400_000)));
}

/** Formats a memory date string into a human‑readable form (e.g. "Jan 15, 2024"). */
export function formatMemoryDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "A little moment";
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Returns true if the media is a video. */
export function isVideo(media: MediaAsset) {
  return media.kind === "video";
}