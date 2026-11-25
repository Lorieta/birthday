"use client";

import { useMemo } from "react";
import { Check, Images, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CloudinaryUpload } from "@/components/scrapbook/cloudinary-upload";
import {
  MediaImage,
  MediaPosterImage,
  MediaVideo,
} from "@/components/scrapbook/media";
import { useScrapbook } from "@/components/scrapbook/scrapbook-provider";
import { hasDisplayableMedia, isCloudinaryAsset } from "@/lib/media";
import { isActiveMemory } from "@/lib/scrapbook-normalize";
import type { MediaAsset } from "@/lib/scrapbook-types";
import { cn } from "@/lib/utils";

function mediaKey(media: MediaAsset) {
  return media.publicId ?? media.src;
}

function mediaLabel(media: MediaAsset) {
  return (
    media.alt ??
    media.publicId?.split("/").pop()?.replace(/[-_]+/g, " ") ??
    (media.kind === "video" ? "Video" : "Photo")
  );
}

export function CoverDialog({
  open,
  onOpenChange,
  cover,
  onSelected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cover: MediaAsset;
  onSelected: (media: MediaAsset) => void;
}) {
  const { state } = useScrapbook();
  const uploads = useMemo(() => {
    const seen = new Set<string>();

    return state.memories
      .filter(isActiveMemory)
      .map((memory) => ({ date: memory.date, media: memory.media }))
      .filter(
        ({ media }) => isCloudinaryAsset(media) && hasDisplayableMedia(media),
      )
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter(({ media }) => {
        const key = mediaKey(media);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(({ media }) => media);
  }, [state.memories]);

  const coverKey = mediaKey(cover);

  const choose = (media: MediaAsset) => {
    onSelected(media);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto bg-paper-soft p-4 sm:p-5">
        <DialogHeader>
          <DialogTitle className="font-hand text-2xl text-ink sm:text-3xl">
            Change the cover
          </DialogTitle>
          <DialogDescription>
            Choose one of your uploaded photos or add a new one for the top of
            your scrapbook.
          </DialogDescription>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-2xl border border-[rgba(107,69,60,0.14)]">
          <div className="relative aspect-[16/9]">
            {cover.kind === "video" ? (
              <MediaVideo media={cover} controls={false} autoPlay muted loop />
            ) : (
              <MediaImage
                media={cover}
                alt={cover.alt ?? "Current cover"}
                sizes="(max-width: 768px) 90vw, 600px"
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Images className="size-4 text-rose-deep" />
              Your uploads
            </p>
            <p className="text-[0.7rem] text-ink-soft">
              {uploads.length} {uploads.length === 1 ? "photo" : "photos"}
            </p>
          </div>

          {uploads.length ? (
            <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto rounded-2xl border border-[rgba(107,69,60,0.12)] bg-paper-soft/60 p-2 sm:max-h-64 sm:grid-cols-4">
              {uploads.map((media, index) => {
                const selected = mediaKey(media) === coverKey;
                const label = mediaLabel(media);

                return (
                  <button
                    key={`${mediaKey(media)}-${index}`}
                    type="button"
                    onClick={() => choose(media)}
                    aria-pressed={selected}
                    aria-label={`Use ${label} as the cover`}
                    title={label}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-xl border border-[rgba(107,69,60,0.12)] bg-paper-deep/40 transition-colors hover:border-rose-deep/50",
                      selected && "border-rose-deep ring-2 ring-rose/30",
                    )}
                  >
                    {media.kind === "video" ? (
                      <MediaPosterImage
                        media={media}
                        alt={label}
                        sizes="(max-width: 768px) 25vw, 160px"
                      />
                    ) : (
                      <MediaImage
                        media={media}
                        alt={label}
                        sizes="(max-width: 768px) 25vw, 160px"
                      />
                    )}
                    {media.kind === "video" && (
                      <span className="absolute bottom-1.5 left-1.5 flex size-6 items-center justify-center rounded-full bg-black/50 text-white">
                        <Play className="size-3 fill-current" />
                      </span>
                    )}
                    {selected && (
                      <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-rose-deep text-white">
                        <Check className="size-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-rose/30 bg-blush-soft/30 p-4 text-center text-sm text-ink-soft">
              No uploads yet. Add one below and it will show up here.
            </div>
          )}
        </div>

        <CloudinaryUpload
          onUploaded={(media) => choose(media)}
          multiple={false}
          label="Or upload a new cover"
          className="w-full"
        />
      </DialogContent>
    </Dialog>
  );
}
