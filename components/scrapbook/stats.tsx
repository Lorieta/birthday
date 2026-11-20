"use client";

import { Album, NotebookPen, Quote } from "lucide-react";
import { HeartDoodle } from "@/components/scrapbook/decorative";
import { useScrapbook } from "@/components/scrapbook/scrapbook-provider";
import { cn } from "@/lib/utils";

function StatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  tone: "sage" | "blush" | "plain";
}) {
  return (
    <div
      className={cn(
        "paper-card flex items-center gap-2.5 px-3 py-3 sm:gap-3.5 sm:px-5 sm:py-3.5",
        tone === "sage" && "bg-sage-soft/60",
        tone === "blush" && "bg-blush-soft/65",
        tone === "plain" && "bg-paper-soft/70",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-2xl ring-1 ring-black/5 sm:size-11",
          tone === "sage" && "bg-[#dbe6cb] text-[#6e8455]",
          tone === "blush" && "bg-[#fbd2dc] text-[#c05470]",
          tone === "plain" && "bg-[#f8e4e8] text-[#c86c87]",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xl leading-tight font-semibold text-ink">
          {value}
        </p>
        <p className="truncate text-[0.7rem] tracking-wide text-ink-soft uppercase">
          {label}
        </p>
      </div>
    </div>
  );
}

export function Stats() {
  const { state } = useScrapbook();

  return (
    <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
      <StatCard
        tone="sage"
        icon={<NotebookPen className="size-5" />}
        value={state.notes.length}
        label="Notes"
      />
      <StatCard
        tone="blush"
        icon={<Album className="size-5" />}
        value={state.albums.length}
        label="Albums"
      />
      <div className="paper-card relative col-span-2 flex items-center gap-2.5 bg-[linear-gradient(120deg,#fbe0e7,#f7c6d2)] px-3 py-3 dark:bg-[linear-gradient(120deg,#33241e,#3b2822)] sm:gap-3.5 sm:px-5 sm:py-3.5 lg:col-span-1">
        <Quote className="size-7 shrink-0 rotate-180 text-rose-deep/50" />
        <p className="font-hand text-[1.25rem] leading-[1.15] text-ink sm:text-[1.35rem]">
          Good days, good company,
          <br />
          and good memories.{" "}
          <HeartDoodle className="inline size-4 -translate-y-0.5 text-rose-deep" filled />
        </p>
      </div>
    </section>
  );
}
