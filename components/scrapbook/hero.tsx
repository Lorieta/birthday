"use client";

import { Camera, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArtImage } from "@/components/scrapbook/art";
import {
  HandUnderline,
  HeartDoodle,
  LaceCorner,
  LittleHearts,
  WashiTape,
} from "@/components/scrapbook/decorative";
import { MediaImage, MediaVideo } from "@/components/scrapbook/media";
import { ThemeToggle } from "@/components/scrapbook/theme-toggle";
import { formatMemoryDate } from "@/lib/media";
import type { MediaAsset } from "@/lib/scrapbook-types";

export function Hero({
  cover,
  since,
  onChangeCover,
}: {
  cover: MediaAsset;
  since: string;
  onChangeCover: () => void;
}) {
  return (
    <section id="home" className="scroll-mt-8">
      <div className="paper-card relative">
        <WashiTape className="-top-2 left-10 w-28 -rotate-6" />
        <WashiTape
          tone="sage"
          className="-top-3 right-24 hidden w-24 rotate-3 sm:block"
        />
        <ArtImage
          name="sparkle"
          className="absolute top-16 left-5 z-20 hidden size-8 rotate-12 object-contain sm:block"
        />
        <ArtImage
          name="cat-hang"
          className="absolute top-20 right-6 z-20 hidden w-24 -rotate-6 object-contain lg:block"
        />
        <div className="relative min-h-[430px] overflow-hidden sm:min-h-[420px] lg:min-h-[470px]">
          <div className="absolute inset-0">
            {cover.kind === "video" ? (
              <MediaVideo
                media={cover}
                controls={false}
                autoPlay
                muted
                loop
                preload="metadata"
                className="scale-[1.02]"
              />
            ) : (
              <MediaImage
                media={cover}
                alt={cover.alt ?? "Scrapbook cover"}
                sizes="100vw"
                priority
                className="scale-[1.01]"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2b1820]/72 via-[#48242f]/20 to-[#2b1820]/10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(255,235,220,0.2),transparent_40%)]" />
          </div>

          <div className="absolute top-4 right-4 z-20 sm:top-5 sm:right-5">
            <ThemeToggle />
          </div>

          <div className="relative z-10 flex h-full min-h-[430px] flex-col justify-end px-5 pt-24 pb-7 sm:min-h-[420px] sm:px-9 sm:pb-9 lg:min-h-[470px] lg:px-12">
            <div className="max-w-2xl text-[#fff8f2]">
              <p className="font-hand text-[2.2rem] leading-[1.16] font-semibold drop-shadow-[0_2px_10px_rgba(45,20,30,0.35)] sm:text-5xl lg:text-[3.6rem]">
                &ldquo;When I am afraid, I put my trust in you.&rdquo;
                <br />
                <span className="mt-1 inline-block text-[0.42em] font-medium tracking-wide text-[#ffe8ec]/90 sm:text-[0.38em]">
                  — Psalm 56:3
                </span>
                <br />
                &ldquo;When the time is right, I, the Lord, will make it happen.&rdquo;
                <br />
                <span className="mt-1 inline-block text-[0.42em] font-medium tracking-wide text-[#ffe8ec]/90 sm:text-[0.38em]">
                  — Isaiah 60:22
                </span>
                <HeartDoodle className="ml-2 inline size-6 -translate-y-1 fill-current sm:size-8" filled />
              </p>
              <HandUnderline className="mt-1 max-w-sm text-[#ffdbe4]" />
              <p className="mt-4 font-hand text-2xl text-[#ffe8ec] sm:text-3xl">
                Memories since {formatMemoryDate(since)}{" "}
                <HeartDoodle className="inline size-4 -translate-y-0.5" />
              </p>
            </div>

            <div className="absolute right-8 bottom-9 hidden rotate-[-4deg] text-right font-hand text-3xl leading-tight text-[#fff8f2] drop-shadow-[0_2px_10px_rgba(45,20,30,0.35)] lg:block">
              <HeartDoodle className="mb-1 ml-auto size-5" />
              Good times
              <br />
              worth keeping
              <LittleHearts className="-left-24 top-2 text-[#ffe4ea]/70" />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                onClick={onChangeCover}
                className="h-9 rounded-full border border-white/30 bg-white/18 px-4 text-xs text-white backdrop-blur hover:bg-white/28"
              >
                <Camera className="size-3.5" />
                Change cover
              </Button>
              {cover.kind === "video" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/20 px-3 py-1.5 text-[0.7rem] text-white/90 backdrop-blur">
                  <Play className="size-3 fill-current" />
                  Cover video
                </span>
              ) : null}
            </div>
          </div>

          <LittleHearts className="top-24 left-6 z-20 hidden text-white/80 sm:flex" />
          <LaceCorner className="pointer-events-none absolute right-2 bottom-2 z-20 size-20 text-white/80" />
          <LaceCorner
            flip
            className="pointer-events-none absolute bottom-2 left-2 z-20 size-20 text-white/70"
          />
        </div>
      </div>
    </section>
  );
}
