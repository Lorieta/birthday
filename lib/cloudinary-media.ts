import { v2 as cloudinary } from "cloudinary";
import { toMediaAsset, type CloudinaryAssetInfo } from "@/lib/cloudinary-asset";
import { getCloudinaryConfig } from "@/lib/cloudinary-server";
import type { MediaAsset } from "@/lib/scrapbook-types";

const MEDIA_PREFIX = "scrapbook";
const MAX_RESULTS = 500;
const MAX_PAGES = 5;

export interface CloudinaryMediaItem {
  media: MediaAsset;
  createdAt?: string;
}

interface ResourcesResponse {
  resources?: CloudinaryAssetInfo[];
  next_cursor?: string;
}

async function listResources(resourceType: "image" | "video") {
  const resources: CloudinaryAssetInfo[] = [];
  let nextCursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = (await cloudinary.api.resources({
      type: "upload",
      resource_type: resourceType,
      prefix: MEDIA_PREFIX,
      max_results: MAX_RESULTS,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    })) as ResourcesResponse;

    for (const resource of result.resources ?? []) {
      if (
        resource &&
        typeof resource.public_id === "string" &&
        typeof resource.secure_url === "string"
      ) {
        resources.push(resource);
      }
    }

    nextCursor = result.next_cursor;
    if (!nextCursor) break;
  }

  return resources;
}

export async function listCloudinaryMedia(): Promise<CloudinaryMediaItem[]> {
  const cfg = getCloudinaryConfig();
  if (!cfg) return [];

  cloudinary.config({
    cloud_name: cfg.cloudName,
    api_key: cfg.apiKey,
    api_secret: cfg.apiSecret,
  });

  const resources = [
    ...(await listResources("image")),
    ...(await listResources("video")),
  ].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  return resources.map((resource) => ({
    media: toMediaAsset(resource, cfg.cloudName),
    createdAt:
      typeof resource.created_at === "string" ? resource.created_at : undefined,
  }));
}

export async function deleteCloudinaryMedia(
  publicId: string,
  resourceType: "image" | "video" = "image",
): Promise<{ ok: boolean; result?: string }> {
  const cfg = getCloudinaryConfig();
  if (!cfg) {
    throw new Error("Cloudinary is not configured.");
  }

  cloudinary.config({
    cloud_name: cfg.cloudName,
    api_key: cfg.apiKey,
    api_secret: cfg.apiSecret,
  });

  const response = (await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  })) as { result?: string };

  const result = response?.result;
  return {
    ok: result === "ok" || result === "not found",
    result,
  };
}
