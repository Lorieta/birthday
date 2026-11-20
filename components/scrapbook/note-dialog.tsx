"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";
import type { BoardNote, NewBoardNote, NoteColor } from "@/lib/scrapbook-types";

const colorOptions: { value: NoteColor; label: string; swatch: string }[] = [
  { value: "blush", label: "Blush", swatch: "bg-[#f8c9d4]" },
  { value: "sage", label: "Sage", swatch: "bg-[#d7e5c1]" },
  { value: "butter", label: "Butter", swatch: "bg-[#f7e1a4]" },
  { value: "lavender", label: "Lavender", swatch: "bg-[#ded0ec]" },
];

function emptyDraft(): NewBoardNote {
  return { title: "", text: "", signature: "", color: "blush" };
}

function draftFromNote(note: BoardNote | null): NewBoardNote {
  if (!note) return emptyDraft();

  return {
    title: note.title,
    text: note.text,
    signature: note.signature,
    color: note.color,
  };
}

export function NoteDialog({
  open,
  onOpenChange,
  note,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: BoardNote | null;
  onSave: (draft: NewBoardNote) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<NewBoardNote>(() => draftFromNote(note));
  const canSave = draft.title.trim().length > 0 && draft.text.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto bg-paper-soft p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-hand text-2xl text-ink sm:text-3xl">
            {note ? "Edit note" : "A little note"}
          </DialogTitle>
          <DialogDescription>
            Give it a title, write your note, and pick a paper color.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="note-title" className="text-xs text-ink-soft">
              Title
            </Label>
            <Input
              id="note-title"
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              maxLength={120}
              className="h-9 rounded-xl bg-paper"
              placeholder="A little note"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note-text" className="text-xs text-ink-soft">
              Your note
            </Label>
            <Textarea
              id="note-text"
              value={draft.text}
              onChange={(event) =>
                setDraft((current) => ({ ...current, text: event.target.value }))
              }
              rows={8}
              maxLength={10_000}
              className="min-h-32 rounded-xl bg-paper font-hand text-lg leading-7 sm:min-h-40 sm:text-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note-signature" className="text-xs text-ink-soft">
              Signed
            </Label>
            <Input
              id="note-signature"
              value={draft.signature}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  signature: event.target.value,
                }))
              }
              maxLength={200}
              className="h-9 rounded-xl bg-paper"
              placeholder="— JC"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs text-ink-soft">Paper color</legend>
            <div className="flex gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-label={option.label}
                  aria-pressed={draft.color === option.value}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      color: option.value,
                    }))
                  }
                  className={cn(
                    "size-8 rounded-full ring-2 ring-offset-2 ring-offset-paper-soft transition",
                    option.swatch,
                    draft.color === option.value
                      ? "ring-rose-deep"
                      : "ring-transparent hover:ring-rose/40",
                  )}
                />
              ))}
            </div>
          </fieldset>
        </div>

        <DialogFooter className="border-t border-[rgba(107,69,60,0.1)] bg-transparent">
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
            disabled={!canSave}
            onClick={() => {
              void onSave({
                ...draft,
                title: draft.title.trim(),
                signature: draft.signature.trim(),
              });
            }}
            className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-rose-deep"
          >
            {note ? "Save changes" : "Add note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
