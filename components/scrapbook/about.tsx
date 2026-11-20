"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeading } from "@/components/scrapbook/section-heading";
import { useScrapbook } from "@/components/scrapbook/scrapbook-provider";
import { HeartDoodle } from "@/components/scrapbook/decorative";
import { Settings2 } from "lucide-react";

export function About() {
  const { state, setSince } = useScrapbook();

  return (
    <section id="about" className="scroll-mt-8 space-y-4">
      <SectionHeading title="About This Little Corner" />
      <div className="paper-card grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-3">
          <p className="font-hand text-2xl leading-snug text-ink">
            A tiny home for the good days, the random photos, the silly videos,
            and all the little things worth keeping.
          </p>
          <p className="max-w-prose text-sm leading-relaxed text-ink-soft">
            Everything here is yours to add to. Upload a photo or video, add a
            caption, and it becomes part of the timeline and gallery. Your
            entries stay with this little scrapbook.
          </p>
          <p className="inline-flex items-center gap-2 rounded-full bg-blush-soft/70 px-3 py-1.5 text-xs text-ink-soft">
            <HeartDoodle className="size-3.5 text-rose-deep" filled />
            Made for good memories.
          </p>
        </div>

        <div className="rounded-2xl border border-[rgba(107,69,60,0.12)] bg-paper/70 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <Settings2 className="size-4 text-rose-deep" />
            Scrapbook settings
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="since-date" className="text-xs text-ink-soft">
              Memories since
            </Label>
            <Input
              id="since-date"
              type="date"
              value={state.since}
              onChange={(event) => setSince(event.target.value)}
              className="h-9 rounded-xl bg-paper-soft text-ink"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
