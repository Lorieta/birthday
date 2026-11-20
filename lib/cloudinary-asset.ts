import type { MediaAsset } from "@/lib/scrapbook-types";

export interface CloudinaryAssetInfo {
  resource_type: string;
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  duration?: number;
  original_filename?: string;
  created_at?: string;
}

export function titleFromCloudinaryPublicId(publicId: string) {
  const name = publicId.split("/").pop() ?? publicId;
  return name.replace(/[-_]+/g, " ").trim() || "Cloudinary media";
}

export function cloudinaryVideoPoster(cloudName: string, publicId: string) {
  return `https://res.cloudinary.com/${cloudName}/video/upload/so_0,w_1000,c_fill/${publicId}.jpg`;
}

export function toMediaAsset(
  info: CloudinaryAssetInfo,
  cloudName: string,
): MediaAsset {
  const kind = info.resource_type === "video" ? "video" : "image";
  const duration =
    typeof info.duration === "number" && Number.isFinite(info.duration)
      ? info.duration
      : undefined;

  return {
    kind,
    source: "cloudinary",
    src: info.secure_url,
    publicId: info.public_id,
    width: typeof info.width === "number" ? info.width : undefined,
    height: typeof info.height === "number" ? info.height : undefined,
    duration,
    poster:
      kind === "video"
        ? cloudinaryVideoPoster(cloudName, info.public_id)
        : undefined,
    alt:
      info.original_filename ||
      titleFromCloudinaryPublicId(info.public_id),
  };
}
