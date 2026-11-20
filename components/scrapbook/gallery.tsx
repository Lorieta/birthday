"use client";

import { FolderPlus, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ManageAlbumsDialog } from "@/components/scrapbook/manage-albums-dialog";
import { SectionHeading } from "@/components/scrapbook/section-heading";
import { Sticker } from "@/components/scrapbook/stickers";
import { WashiTape } from "@/components/scrapbook/decorative";
import { useScrapbook } from "@/components/scrapbook/scrapbook-provider";
import { MediaImage, MediaPosterImage } from "@/components/scrapbook/media";
import { formatMemoryDate } from "@/lib/media";
import type { Memory } from "@/lib/scrapbook-types";
import { cn } from "@/lib/utils";

type MediaFilter = "all" | "photo" | "video";

const ratios = [
  "aspect-[4/5]",
  "aspect-[4/3]",
  "aspect-square",
  "aspect-[3/4]",
  "aspect-[5/4]",
  "aspect-[4/5]",
];
const rotations = [
  "-rotate-[1.6deg]",
  "rotate-[1.2deg]",
  "-rotate-[0.8deg]",
  "rotate-[1.8deg]",
  "-rotate-[1.1deg]",
  "rotate-[0.7deg]",
];
const PAGE_SIZE = 24;

const mediaFilters: { value: MediaFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "video", label: "Videos" },
];

export function Gallery({
  onAdd,
  onEdit,
  onView,
  onDelete,
}: {
  onAdd: () => void;
  onEdit: (memory: Memory) => void;
  onView: (memory: Memory) => void;
  onDelete: (memory: Memory) => void;
}) {
  const { state } = useScrapbook();
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [albumFilter, setAlbumFilter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [manageOpen, setManageOpen] = useState(false);

  const galleryAlbums = useMemo(
    () => state.albums.filter((a) => a.section === "gallery"),
    [state.albums],
  );

  const activeAlbumFilter =
    albumFilter === "all" || galleryAlbums.some((a) => a.id === albumFilter)
      ? albumFilter
      : "all";

  const memories = useMemo(
    () => state.memories.filter((memory) => memory.section === "gallery"),
    [state.memories],
  );

  const photoCount = memories.filter((m) => m.media.kind === "image").length;
  const videoCount = memories.filter((m) => m.media.kind === "video").length;
  const mediaCounts: Record<MediaFilter, number> = {
    all: memories.length,
    photo: photoCount,
    video: videoCount,
  };

  const albumCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of memories) {
      if (m.albumId) map.set(m.albumId, (map.get(m.albumId) ?? 0) + 1);
    }
    return map;
  }, [memories]);

  const filtered = useMemo(() => {
    return memories.filter((memory) => {
      if (activeAlbumFilter !== "all" && memory.albumId !== activeAlbumFilter)
        return false;
      if (mediaFilter === "photo") return memory.media.kind === "image";
      if (mediaFilter === "video") return memory.media.kind === "video";
      return true;
    });
  }, [memories, activeAlbumFilter, mediaFilter]);

  const visibleMemories = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visibleMemories.length;
  const expanded = filtered.length > PAGE_SIZE && remaining === 0;

  const chooseMediaFilter = (next: MediaFilter) => {
    setMediaFilter(next);
    setVisibleCount(PAGE_SIZE);
  };

  const chooseAlbumFilter = (next: string) => {
    setAlbumFilter(next);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <section id="gallery" className="scroll-mt-8 space-y-4">
      <SectionHeading
        title="Our Gallery"
        action={
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setManageOpen(true)}
              className="h-8 gap-1.5 rounded-full border-rose/30 px-3 text-xs text-ink-soft hover:text-rose-deep"
            >
              <FolderPlus className="size-3.5" />
              Manage albums
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onAdd}
              className="h-8 gap-1.5 rounded-full bg-primary px-3.5 text-xs text-primary-foreground hover:bg-rose-deep"
            >
              <Plus className="size-3.5" />
              Add photo
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {mediaFilters.map((option) => {
          const active = mediaFilter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => chooseMediaFilter(option.value)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.7rem] transition-colors",
                active
                  ? "border-rose-deep/30 bg-blush-soft text-rose-deep"
                  : "border-[rgba(107,69,60,0.12)] bg-paper-soft/60 text-ink-soft hover:bg-blush-soft/40",
              )}
            >
              {option.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.6rem]",
                  active ? "bg-white/60" : "bg-paper-deep/60",
                )}
              >
                {mediaCounts[option.value]}
              </span>
            </button>
          );
        })}
        <span className="ml-auto hidden text-[0.65rem] text-ink-soft/70 sm:inline">
          {visibleMemories.length} of {filtered.length} shown
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => chooseAlbumFilter("all")}
          aria-pressed={activeAlbumFilter === "all"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.7rem] transition-colors",
            activeAlbumFilter === "all"
              ? "border-rose-deep/30 bg-blush-soft text-rose-deep"
              : "border-[rgba(107,69,60,0.12)] bg-paper-soft/60 text-ink-soft hover:bg-blush-soft/40",
          )}
        >
          All albums
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[0.6rem]",
              activeAlbumFilter === "all" ? "bg-white/60" : "bg-paper-deep/60",
            )}
          >
            {memories.length}
          </span>
        </button>
        {galleryAlbums.map((album) => {
          const active = activeAlbumFilter === album.id;
          return (
            <button
              key={album.id}
              type="button"
              onClick={() => chooseAlbumFilter(album.id)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.7rem] transition-colors",
                active
                  ? "border-rose-deep/30 bg-blush-soft text-rose-deep"
                  : "border-[rgba(107,69,60,0.12)] bg-paper-soft/60 text-ink-soft hover:bg-blush-soft/40",
              )}
            >
              {album.name}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.6rem]",
                  active ? "bg-white/60" : "bg-paper-deep/60",
                )}
              >
                {albumCounts.get(album.id) ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div className="columns-2 gap-3 md:columns-3 xl:columns-4 [&>*]:mb-3">
        {visibleMemories.map((memory, index) => (
          <div
            key={memory.id}
            className={cn(
              "polaroid group relative break-inside-avoid transition-transform duration-300 hover:z-10 hover:rotate-0 hover:-translate-y-1",
              rotations[index % rotations.length],
            )}
          >
            {index % 4 === 0 ? (
              <WashiTape className="-top-2 left-1/2 w-20 -translate-x-1/2 rotate-[-3deg]" />
            ) : null}

            <button
              type="button"
              onClick={() => onView(memory)}
              aria-label={`Open ${memory.title}`}
              className={cn(
                "relative block w-full overflow-hidden bg-paper-deep text-left",
                ratios[index % ratios.length],
              )}
            >
              {memory.media.kind === "video" ? (
                <MediaPosterImage
                  media={memory.media}
                  alt={memory.media.alt ?? memory.title}
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <MediaImage
                  media={memory.media}
                  alt={memory.media.alt ?? memory.title}
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              )}
              {memory.media.kind === "video" ? (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-10 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white backdrop-blur">
                    <Play className="ml-0.5 size-3.5 fill-current" />
                  </span>
                </span>
              ) : null}
            </button>

            <div className="absolute top-4 right-4 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => onEdit(memory)}
                aria-label={`Edit ${memory.title}`}
                className="flex size-7 items-center justify-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition-colors hover:text-rose-deep"
              >
                <Pencil className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(memory)}
                aria-label={`Delete ${memory.title}`}
                className="flex size-7 items-center justify-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition-colors hover:text-destructive"
              >
                <Trash2 className="size-3" />
              </button>
            </div>

            <Sticker
              name={memory.sticker}
              size="sm"
              className="absolute -right-1.5 -bottom-1.5 rotate-6"
            />

            <button
              type="button"
              onClick={() => onView(memory)}
              className="mt-2 block w-full text-left"
            >
              <p className="truncate font-hand text-lg leading-tight text-[#6b453c]">
                {memory.title}
              </p>
              <p className="truncate text-[0.62rem] tracking-wide text-[#9b7168]">
                {formatMemoryDate(memory.date)}
              </p>
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={onAdd}
          className="flex min-h-[180px] w-full break-inside-avoid flex-col items-center justify-center gap-2 rounded-md border border-dashed border-rose/35 bg-blush-soft/25 p-6 text-ink-soft transition-colors hover:bg-blush-soft/45 hover:text-rose-deep"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-white/70 shadow-sm">
            <Plus className="size-5" />
          </span>
          <span className="font-hand text-xl">Add a photo</span>
          <span className="text-[0.65rem]">or a little video</span>
        </button>
      </div>

      {filtered.length > PAGE_SIZE ? (
        <div className="flex justify-center pt-1">
          <Button
            type="button"
            variant="outline"
            aria-expanded={expanded}
            onClick={() =>
              setVisibleCount((count) =>
                count >= filtered.length ? PAGE_SIZE : filtered.length,
              )
            }
            className="rounded-full border-rose/25 px-5 text-xs text-ink-soft hover:text-rose-deep"
          >
            {expanded ? "Collapse gallery" : "Expand gallery"}
            {expanded ? null : (
              <span className="text-ink-soft/60">({remaining} more)</span>
            )}
          </Button>
        </div>
      ) : null}

      <ManageAlbumsDialog open={manageOpen} onOpenChange={setManageOpen} />
    </section>
  );
}
