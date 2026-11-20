"use client";

import { Check, ImagePlus, Images, Loader2, Play, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArtImage } from "@/components/scrapbook/art";
import { CloudinaryUpload } from "@/components/scrapbook/cloudinary-upload";
import {
  MediaImage,
  MediaPosterImage,
  MediaVideo,
} from "@/components/scrapbook/media";
import { stickerOptions } from "@/components/scrapbook/stickers";
import { useScrapbook } from "@/components/scrapbook/scrapbook-provider";
import { hasDisplayableMedia, memoryAppearsInSection } from "@/lib/media";
import type {
  MediaAsset,
  Memory,
  NewMemory,
  StickerName,
} from "@/lib/scrapbook-types";
import { isPersonArt } from "@/lib/sticker-art";
import { cn } from "@/lib/utils";

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function mediaKey(media: MediaAsset) {
  return media.publicId ?? media.src;
}

export function AddMemoryDialog({
  open,
  onOpenChange,
  memory,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memory: Memory | null;
  onSubmit: (memory: NewMemory, id?: string) => void;
}) {
  const { state } = useScrapbook();
  const galleryAlbums = useMemo(
    () => state.albums.filter((a) => a.section === "gallery"),
    [state.albums],
  );
  const galleryChoices = useMemo(() => {
    const seen = new Set<string>();

    return state.memories
      .filter((item) => memoryAppearsInSection(item, "gallery"))
      .filter((item) => hasDisplayableMedia(item.media))
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((item) => {
        const key = mediaKey(item.media);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [state.memories]);

  const [media, setMedia] = useState<MediaAsset | null>(memory?.media ?? null);
  const [title, setTitle] = useState(memory?.title ?? "");
  const [date, setDate] = useState(() => memory?.date ?? todayISO());
  const [caption, setCaption] = useState(memory?.caption ?? "");
  const [sticker, setSticker] = useState<StickerName>(memory?.sticker ?? "heart");
  const [section, setSection] = useState<"timeline" | "gallery">(
    memory?.section ?? "timeline",
  );
  const [albumId, setAlbumId] = useState<string | "">(
    memory?.albumId ?? "",
  );
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const initialSection = useRef(section);
  const initialSections = useRef(memory?.sections);

  const handleSave = () => {
    if (!media) {
      toast.error("Add a photo or video first.");
      return;
    }

    if (!title.trim()) {
      toast.error("Give this memory a little title.");
      return;
    }

    const selectedAlbumId =
      section === "gallery" && albumId ? albumId : undefined;
    const sections =
      section === initialSection.current
        ? initialSections.current
        : [section];

    onSubmit(
      {
        media,
        title: title.trim(),
        date: date || todayISO(),
        caption: caption.trim(),
        sticker,
        section,
        sections,
        albumId: selectedAlbumId,
      },
      memory?.id,
    );

    setPickerOpen(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-3xl overflow-y-auto bg-paper-soft p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-hand text-2xl text-ink sm:text-3xl">
            {memory ? "Edit this memory" : "Add a new memory"}
          </DialogTitle>
          <DialogDescription>
            Pick a photo or video, then add the little details you want to
            remember.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-[1.05fr_1fr]">
          <div className="space-y-3">
            <Label className="text-xs text-ink-soft">Media</Label>
            {media ? (
              <div className="relative overflow-hidden rounded-2xl border border-[rgba(107,69,60,0.14)] bg-paper-deep">
                <div className="relative aspect-[4/3]">
                  {media.kind === "video" ? (
                    <MediaVideo media={media} controls preload="metadata" />
                  ) : (
                    <MediaImage
                      media={media}
                      alt={media.alt ?? "Selected media"}
                      sizes="(max-width: 768px) 90vw, 360px"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMedia(null)}
                  aria-label="Remove selected media"
                  className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rose/35 bg-blush-soft/25 p-5 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-white/70 text-rose-deep shadow-sm">
                  <ImagePlus className="size-5" />
                </span>
                <p className="text-xs leading-relaxed text-ink-soft">
                  Photos and videos welcome.
                  <br />
                  Cloudinary keeps the originals safe.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <CloudinaryUpload
                onUploaded={(asset) => setMedia(asset)}
                onUploadingChange={setUploading}
                multiple={false}
                label={media ? "Replace media" : "Upload photo"}
                compact
                className="w-full"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setPickerOpen((open) => !open)}
                aria-expanded={pickerOpen}
                className="w-full rounded-full"
              >
                <Images className="size-4" />
                Pick from gallery
              </Button>
            </div>
            {pickerOpen ? (
              <div className="space-y-2 rounded-2xl border border-[rgba(107,69,60,0.14)] bg-paper p-2">
                <div className="flex items-center justify-between gap-2 px-1">
                  <p className="text-xs font-semibold text-ink">
                    Gallery photos
                  </p>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(false)}
                    className="text-[0.7rem] text-ink-soft transition-colors hover:text-ink"
                  >
                    Done
                  </button>
                </div>
                {galleryChoices.length ? (
                  <div className="grid max-h-44 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                    {galleryChoices.map((item) => {
                      const key = mediaKey(item.media);
                      const selected = media ? mediaKey(media) === key : false;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setMedia(item.media);
                            setPickerOpen(false);
                          }}
                          aria-pressed={selected}
                          aria-label={`Use ${item.title} from the gallery`}
                          title={item.title}
                          className={cn(
                            "relative aspect-square overflow-hidden rounded-xl border border-[rgba(107,69,60,0.12)] bg-paper-deep/40 transition-colors hover:border-rose-deep/50",
                            selected && "border-rose-deep ring-2 ring-rose/30",
                          )}
                        >
                          {item.media.kind === "video" ? (
                            <MediaPosterImage
                              media={item.media}
                              alt={item.title}
                              sizes="(max-width: 768px) 25vw, 160px"
                            />
                          ) : (
                            <MediaImage
                              media={item.media}
                              alt={item.title}
                              sizes="(max-width: 768px) 25vw, 160px"
                            />
                          )}
                          {item.media.kind === "video" ? (
                            <span className="absolute bottom-1.5 left-1.5 flex size-6 items-center justify-center rounded-full bg-black/50 text-white">
                              <Play className="size-3 fill-current" />
                            </span>
                          ) : null}
                          {selected ? (
                            <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-rose-deep text-white">
                              <Check className="size-3.5" />
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="px-1 pb-1 text-xs text-ink-soft">
                    No gallery photos yet.
                  </p>
                )}
              </div>
            ) : null}
            {uploading ? (
              <p className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                <Loader2 className="size-3.5 animate-spin" />
                Waiting for Cloudinary...
              </p>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="memory-title" className="text-xs text-ink-soft">
                Title
              </Label>
              <Input
                id="memory-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="A day to remember"
                className="h-9 rounded-xl bg-paper"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="memory-date" className="text-xs text-ink-soft">
                Date
              </Label>
              <Input
                id="memory-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-9 rounded-xl bg-paper"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="memory-caption" className="text-xs text-ink-soft">
                Little caption
              </Label>
              <Textarea
                id="memory-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="The little thing you want to remember..."
                rows={3}
                className="min-h-20 rounded-xl bg-paper"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-ink-soft">Sticker</Label>
              <div className="flex flex-wrap gap-1.5">
                {stickerOptions.map((option) => {
                  const Icon = option.Icon;
                  const selected = sticker === option.name;

                  const person = option.art ? isPersonArt(option.art) : false;

                  return (
                    <button
                      key={option.name}
                      type="button"
                      title={option.label}
                      aria-label={option.label}
                      aria-pressed={selected}
                      onClick={() => setSticker(option.name)}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full ring-2 transition-transform hover:-translate-y-0.5",
                        person && "size-12 sm:size-14",
                        option.className,
                        selected
                          ? "scale-110 ring-rose-deep"
                          : "ring-white/70",
                      )}
                    >
                      {option.art ? (
                        <ArtImage
                          name={option.art}
                          className={cn("size-6", person && "size-9 sm:size-11")}
                        />
                      ) : (
                        <Icon className="size-4" strokeWidth={2.2} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-ink-soft">Show it in</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["timeline", "gallery"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setSection(value);
                      if (value !== "gallery") setAlbumId("");
                    }}
                    aria-pressed={section === value}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs transition-colors",
                      section === value
                        ? "border-rose-deep/40 bg-blush-soft text-rose-deep"
                        : "border-[rgba(107,69,60,0.14)] bg-paper text-ink-soft hover:bg-blush-soft/40",
                    )}
                  >
                    {value === "timeline" ? "Our Timeline" : "Our Gallery"}
                  </button>
                ))}
              </div>
            </div>

            {section === "gallery" ? (
              <div className="space-y-1.5">
                <Label htmlFor="memory-album" className="text-xs text-ink-soft">
                  Album
                </Label>
                <select
                  id="memory-album"
                  value={albumId}
                  onChange={(e) => setAlbumId(e.target.value)}
                  className="h-9 w-full rounded-xl border border-[rgba(107,69,60,0.14)] bg-paper px-3 text-sm text-ink"
                >
                  <option value="">No album</option>
                  {galleryAlbums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="mt-1 gap-2 border-t border-[rgba(107,69,60,0.1)] bg-transparent px-0 pb-0 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-rose-deep"
          >
            {memory ? "Save changes" : "Add to scrapbook"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
