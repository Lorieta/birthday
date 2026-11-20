"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArtImage } from "@/components/scrapbook/art";
import { HeartDoodle, WashiTape } from "@/components/scrapbook/decorative";
import { Sticker } from "@/components/scrapbook/stickers";
import { useScrapbook } from "@/components/scrapbook/scrapbook-provider";

export function NoteCard({ onEdit }: { onEdit: () => void }) {
  const { state } = useScrapbook();

  return (
    <div className="paper-card relative bg-[linear-gradient(145deg,#fde7eb,#f8c9d4)] p-5 sm:p-7">
      <WashiTape className="-top-2 left-8 w-24 -rotate-3" />
      <WashiTape
        tone="sage"
        className="-top-1 right-6 w-20 rotate-2 opacity-80"
      />
      <div className="relative flex items-start justify-between gap-3">
        <h3 className="font-hand text-[2rem] leading-none font-semibold text-[#6b453c]">
          A Little Note
          <HeartDoodle className="ml-2 inline size-5 -translate-y-0.5 text-[#c05470]" filled />
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onEdit}
          aria-label="Edit note"
          className="shrink-0 rounded-full bg-white/45 text-[#8f5f63] hover:bg-white/70 hover:text-[#b84b69]"
        >
          <Pencil className="size-3.5" />
        </Button>
      </div>

      <div className="lined-paper relative mt-5 font-hand text-[1.35rem] leading-[28px] whitespace-pre-line text-[#6b453c]">
        {state.note}
      </div>

      <p className="mt-3 text-right font-hand text-2xl text-[#8f5f63]">
        {state.signature}
      </p>

      <Sticker
        name="strawberry"
        className="absolute right-4 bottom-3 rotate-6"
      />
      <Sticker
        name="matcha"
        size="sm"
        className="absolute right-14 bottom-5 -rotate-6"
      />
      <ArtImage
        name="flower-left"
        className="absolute bottom-4 left-3 size-10 -rotate-12 object-contain"
      />
    </div>
  );
}
