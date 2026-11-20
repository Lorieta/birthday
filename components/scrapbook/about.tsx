"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArtImage } from "@/components/scrapbook/art";
import { SectionHeading } from "@/components/scrapbook/section-heading";
import { useScrapbook } from "@/components/scrapbook/scrapbook-provider";
import { HeartDoodle } from "@/components/scrapbook/decorative";
import { CircleAlert, CircleCheck, Cloud, RotateCcw, Settings2 } from "lucide-react";

export function About() {
  const { state, setSince, reset } = useScrapbook();
  const [confirmOpen, setConfirmOpen] = useState(false);

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
            Everything here is yours to add to. Upload a photo or video,
            add a caption, and it becomes part of the timeline and gallery. Your
            entries are saved in this browser, while Cloudinary keeps the media
            safe.
          </p>
          <p className="inline-flex items-center gap-2 rounded-full bg-blush-soft/70 px-3 py-1.5 text-xs text-ink-soft">
            <HeartDoodle className="size-3.5 text-rose-deep" filled />
            Made for good memories.
          </p>
        </div>

        <div className="rounded-2xl border border-[rgba(107,69,60,0.12)] bg-paper/70 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <Settings2 className="size-4 text-rose-deep" />
            Cloudinary
          </div>
          <div className="space-y-3">
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

            <div className="flex items-center justify-between gap-3 rounded-xl bg-paper-soft/80 px-3 py-2.5">
              <span className="inline-flex items-center gap-2 text-xs text-ink-soft">
                <HeartDoodle className="size-4" />
                Cloudinary
              </span>
              <span
                className={
                  state.since
                    ? "inline-flex items-center gap-1 text-[0.7rem] font-medium text-[#5e7c4f]"
                    : "inline-flex items-center gap-1 text-[0.7rem] font-medium text-[#b0645a]"
                }
              >
                {state.since ? (
                  <>
                    <HeartDoodle className="size-3.5" />
                    Ready
                  </>
                ) : (
                  <>
                    <HeartDoodle className="size-3.5" />
                    Setup needed
                  </>
                )}
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              className="w-full rounded-xl border-rose/25 text-xs text-ink-soft hover:text-destructive"
            >
              <RotateCcw className="size-3.5" />
              Reset demo scrapbook
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}