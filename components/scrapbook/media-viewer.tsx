"use client";

import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaImage, MediaVideo } from "@/components/scrapbook/media";
import { Sticker } from "@/components/scrapbook/stickers";
import { useScrapbook } from "@/components/scrapbook/scrapbook-provider";
import { formatMemoryDate } from "@/lib/media";
import type { Memory } from "@/lib/scrapbook-types";
import { cn } from "@/lib/utils";

export function MediaViewer({
  open,
  onOpenChange,
  memory,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memory: Memory | null;
  onEdit: (memory: Memory) => void;
  onDelete: (memory: Memory) => void;
}) {
  const { state } = useScrapbook();
  if (!memory) return null;

  const albumName =
    memory.section === "gallery"
      ? state.albums.find((a) => a.id === memory.albumId)?.name
      : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-4xl overflow-y-auto bg-paper-soft p-0">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="pr-8 font-hand text-3xl leading-tight text-ink">
            {memory.title}
          </DialogTitle>
          <DialogDescription className="inline-flex items-center gap-2">
            <span>{formatMemoryDate(memory.date)}</span>
            {memory.date ? (
              <span className="size-1 rounded-full bg-ink-soft/40" />
            ) : null}
            <span>
              {memory.section === "gallery"
                ? albumName ?? "Gallery"
                : "Timeline"}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="relative mx-5 overflow-hidden rounded-2xl bg-[#2b1a20]">
          <div className="relative aspect-[4/3] max-h-[62vh] w-full">
            {memory.media.kind === "video" ? (
              <MediaVideo
                media={memory.media}
                controls
                preload="metadata"
                className="object-contain"
              />
            ) : (
              <MediaImage
                media={memory.media}
                alt={memory.media.alt ?? memory.title}
                sizes="(max-width: 1024px) 92vw, 900px"
                className="object-contain"
                priority
              />
            )}
          </div>
          <Sticker
            name={memory.sticker}
            className="absolute right-3 bottom-3 rotate-6"
          />
        </div>

        <div className="space-y-4 px-5 pb-5">
          {memory.caption ? (
            <p className="font-hand text-2xl leading-snug text-ink">
              {memory.caption}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit(memory);
              }}
              className="rounded-full"
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onDelete(memory);
              }}
              className="rounded-full text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
            {memory.media.source === "cloudinary" ? (
              <a
                href={memory.media.src}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "rounded-full text-ink-soft",
                )}
              >
                <ExternalLink className="size-3.5" />
                Open in Cloudinary
              </a>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
