"use client";

import { ArtImage } from "@/components/scrapbook/art";
import { HeartDoodle, WashiTape } from "@/components/scrapbook/decorative";
import { MediaImage, MediaPosterImage } from "@/components/scrapbook/media";
import type { MediaAsset } from "@/lib/scrapbook-types";

export function Polaroid({ media }: { media: MediaAsset }) {
  return (
    <div className="relative mx-auto w-full max-w-[310px] rotate-[2.5deg] transition-transform duration-300 hover:rotate-[1deg]">
      <WashiTape className="-top-3 right-8 w-24 rotate-6" />
      <WashiTape
        tone="sage"
        className="-top-2 left-6 w-16 -rotate-6 opacity-90"
      />
      <div className="polaroid pb-16">
        <div className="relative aspect-[4/5] overflow-hidden bg-paper-deep">
          {media.kind === "video" ? (
            <MediaPosterImage
              media={media}
              alt={media.alt ?? "A favorite scrapbook moment"}
              sizes="320px"
            />
          ) : (
            <MediaImage
              media={media}
              alt={media.alt ?? "A favorite scrapbook moment"}
              sizes="320px"
            />
          )}
          <span className="pointer-events-none absolute inset-0 ring-1 ring-black/5 ring-inset" />
        </div>
        <div className="absolute inset-x-4 bottom-4 text-center">
          <p className="font-hand text-[1.55rem] leading-none text-[#6b453c]">
            Good times{" "}
            <HeartDoodle
              className="inline size-4 -translate-y-0.5 text-[#d95b7c]"
              filled
            />{" "}
            kept close.
          </p>
          <p className="mt-1 text-[0.6rem] tracking-[0.18em] text-[#b08a83] uppercase">
            a favorite kind of day
          </p>
        </div>
        <ArtImage
          name="leaf-bottom"
          className="absolute -bottom-2 left-2 size-12 rotate-12 object-contain"
        />
      </div>
    </div>
  );
}
