"use client";

import { ChevronLeft, ChevronRight, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/scrapbook/section-heading";
import { Sticker } from "@/components/scrapbook/stickers";
import { useScrapbook } from "@/components/scrapbook/scrapbook-provider";
import { MediaImage, MediaPosterImage } from "@/components/scrapbook/media";
import { formatMemoryDate } from "@/lib/media";
import type { Memory } from "@/lib/scrapbook-types";
import { cn } from "@/lib/utils";

export function Timeline({
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
  const scrollerRef = useRef<HTMLDivElement>(null);

  const memories = state.memories
    .filter((memory) => memory.section === "timeline")
    .sort((a, b) => a.date.localeCompare(b.date));

  const scrollBy = (direction: 1 | -1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({
      left: direction * Math.min(scroller.clientWidth * 0.82, 620),
      behavior: "smooth",
    });
  };

  return (
    <section id="timeline" className="scroll-mt-8 space-y-4">
      <SectionHeading
        title="Our Timeline"
        action={
          <Button
            type="button"
            size="sm"
            onClick={onAdd}
            className="h-8 gap-1.5 rounded-full bg-primary px-3.5 text-xs text-primary-foreground hover:bg-rose-deep"
          >
            <Plus className="size-3.5" />
            Add memory
          </Button>
        }
      />

      <div className="relative">
        <div
          ref={scrollerRef}
          className="soft-scroll -mx-1 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-1 py-2 pb-4"
        >
          {memories.map((memory) => (
            <article
              key={memory.id}
              className="paper-card group w-[236px] shrink-0 snap-start bg-paper-soft transition-transform duration-300 hover:-translate-y-1 sm:w-[250px]"
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => onView(memory)}
                  aria-label={`Open ${memory.title}`}
                  className="relative block aspect-[4/3] w-full overflow-hidden text-left"
                >
                  {memory.media.kind === "video" ? (
                    <MediaPosterImage
                      media={memory.media}
                      alt={memory.media.alt ?? memory.title}
                      sizes="260px"
                    />
                  ) : (
                    <MediaImage
                      media={memory.media}
                      alt={memory.media.alt ?? memory.title}
                      sizes="260px"
                    />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-[#3b2028]/18 to-transparent" />
                  {memory.media.kind === "video" ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex size-11 items-center justify-center rounded-full border border-white/40 bg-black/25 text-white backdrop-blur">
                        <Play className="ml-0.5 size-4 fill-current" />
                      </span>
                    </span>
                  ) : null}
                </button>

                <Sticker
                  name={memory.sticker}
                  className="absolute -top-2 right-2 size-8 rotate-6"
                  size="sm"
                />

                <div className="absolute top-2 left-2 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
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

                <div className="relative z-10 -mt-4 px-3.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border border-[rgba(107,69,60,0.12)] bg-[#dbe6cb] px-2.5 py-1 text-[0.65rem] font-medium tracking-wide text-[#5e7049] shadow-sm",
                      memory.sticker === "strawberry" ||
                        memory.sticker === "heart" ||
                        memory.sticker === "cake"
                        ? "bg-[#fbd2dc] text-[#a8465f]"
                        : memory.sticker === "gamepad"
                          ? "bg-[#e8e0f5] text-[#6e5795]"
                          : undefined,
                    )}
                  >
                    {formatMemoryDate(memory.date)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onView(memory)}
                className="block w-full px-3.5 pt-2 pb-3.5 text-left"
              >
                <h3 className="font-hand text-[1.55rem] leading-tight font-semibold text-ink">
                  {memory.title}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-[0.72rem] text-ink-soft">
                  {memory.caption}
                </p>
              </button>
            </article>
          ))}

          <button
            type="button"
            onClick={onAdd}
            className="flex w-[180px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-[1.6rem] border border-dashed border-rose/35 bg-blush-soft/25 text-ink-soft transition-colors hover:bg-blush-soft/45 hover:text-rose-deep"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-white/70 shadow-sm">
              <Plus className="size-5" />
            </span>
            <span className="font-hand text-xl">Add a memory</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Scroll timeline left"
          className="absolute top-[38%] -left-2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(107,69,60,0.15)] bg-paper-soft/90 text-ink shadow-md backdrop-blur transition-colors hover:bg-paper-soft sm:flex"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Scroll timeline right"
          className="absolute top-[38%] -right-2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(107,69,60,0.15)] bg-paper-soft/90 text-ink shadow-md backdrop-blur transition-colors hover:bg-paper-soft sm:flex"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </section>
  );
}
