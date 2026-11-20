"use client";

import { AlertCircle, ImageUp, Loader2, Settings2 } from "lucide-react";
import { useCloudinaryConfig } from "@/lib/use-cloudinary-config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { MediaAsset } from "@/lib/scrapbook-types";
import { CldUploadWidget, type CloudinaryUploadWidgetResults } from "next-cloudinary";

/* ---------- helper: toMediaAsset ---------- */
interface CloudinaryUploadInfo {
  resource_type: string;
  duration?: number;
  public_id: string;
  width: number;
  height: number;
  secure_url: string;
  original_filename?: string;
}

function toMediaAsset(
  info: CloudinaryUploadInfo,
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
    width: info.width,
    height: info.height,
    duration,
    poster:
      kind === "video"
        ? `https://res.cloudinary.com/${cloudName}/video/upload/so_0,w_1000,c_fill/${info.public_id}.jpg`
        : undefined,
    alt: info.original_filename || "Uploaded scrapbook media",
  };
}

/* ---------- component ---------- */
export function CloudinaryUpload({
  onUploaded,
  onUploadingChange,
  label = "Upload photos or videos",
  multiple = true,
  className,
  compact = false,
}: {
  onUploaded: (media: MediaAsset) => void;
  onUploadingChange?: (uploading: boolean) => void;
  label?: string;
  multiple?: boolean;
  className?: string;
  compact?: boolean,
}) {
  const { cloudName, apiKey, configured, loading } = useCloudinaryConfig();

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border border-dashed border-rose/40 bg-blush-soft/40 p-4 text-sm text-ink-soft",
          className,
        )}
      >
        <Loader2 className="size-4 animate-spin" />
        Preparing uploads…
      </div>
    );
  }

  if (!configured) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-rose/40 bg-blush-soft/40 p-4 text-left",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-rose/15 text-rose-deep">
            <AlertCircle className="size-4" />
          </span>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-ink">
              Cloudinary needs a little setup
            </p>
            <p className="text-xs leading-relaxed text-ink-soft">
              Add your cloud name, API key, and API secret to .env.local,
              then restart the dev server.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[0.7rem] text-ink-soft">
              <Settings2 className="size-3.5" />
              <span>See .env.example for the exact variables.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- widget ---------- */
  const handleSuccess = (
    results: CloudinaryUploadWidgetResults,
  ) => {
    if (!results?.info || typeof results?.info === "string") {
      toast.error("Cloudinary did not return media details.");
      onUploadingChange?.(false);
      return;
    }

    const media = toMediaAsset(results.info as CloudinaryUploadInfo, cloudName ?? "");

    onUploaded(media);
    onUploadingChange?.(false);
    toast.success(
      media.kind === "video" ? "Video added to the scrapbook" : "Photo added to the scrapbook",
    );
  };

  return (
    <CldUploadWidget
      signatureEndpoint="/api/sign-cloudinary-params"
      config={{ cloud: { cloudName: cloudName ?? undefined, apiKey: apiKey ?? undefined } }}
      options={{
        sources: ["local", "camera", "url"],
        multiple,
        maxFiles: multiple ? 10 : 1,
        resourceType: "auto",
        folder: "scrapbook",
        clientAllowedFormats: [
          "jpg",
          "jpeg",
          "png",
          "webp",
          "avif",
          "heic",
          "mp4",
          "mov",
          "webm",
          "m4v",
        ],
        maxImageFileSize: 12_000_000,
        maxVideoFileSize: 150_000_000,
        showPoweredBy: false,
      }}
      onOpen={() => onUploadingChange?.(true)}
      onClose={() => onUploadingChange?.(false)}
      onError={() => {
        onUploadingChange?.(false);
        toast.error("Upload failed. Check your Cloudinary settings and try again.");
      }}
      onSuccess={handleSuccess}
    >
      {({ open, isLoading }) => (
        <Button
          type="button"
          variant={compact ? "outline" : "default"}
          onClick={() => open()}
          disabled={isLoading}
          className={cn(
            "h-11 gap-2 rounded-full border-rose/30 bg-primary px-5 text-primary-foreground shadow-[0_8px_20px_-12px_rgba(184,75,105,0.8)] hover:bg-rose-deep",
            compact && "h-9 px-4",
            className,
          )}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImageUp className="size-4" />
          )}
          {label}
        </Button>
      )}
    </CldUploadWidget>
  );
}