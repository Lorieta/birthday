"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CloudinaryUpload } from "@/components/scrapbook/cloudinary-upload";
import { MediaImage, MediaVideo } from "@/components/scrapbook/media";
import type { MediaAsset } from "@/lib/scrapbook-types";

export function CoverDialog({
  open,
  onOpenChange,
  cover,
  onUploaded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cover: MediaAsset;
  onUploaded: (media: MediaAsset) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-paper-soft">
        <DialogHeader>
          <DialogTitle className="font-hand text-3xl text-ink">
            Change the cover
          </DialogTitle>
          <DialogDescription>
            Choose a photo or a little video for the top of your scrapbook.
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
                sizes="(max-width: 768px) 90vw, 500px"
              />
            )}
          </div>
        </div>

        <CloudinaryUpload
          onUploaded={(media) => {
            onUploaded(media);
            onOpenChange(false);
          }}
          multiple={false}
          label="Upload a new cover"
          className="w-full"
        />
      </DialogContent>
    </Dialog>
  );
}
