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

export function NoteDialog({
  open,
  onOpenChange,
  note,
  signature,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: string;
  signature: string;
  onSave: (note: string, signature: string) => void;
}) {
  const [draft, setDraft] = useState(note);
  const [draftSignature, setDraftSignature] = useState(signature);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-paper-soft">
        <DialogHeader>
          <DialogTitle className="font-hand text-3xl text-ink">
            A little note
          </DialogTitle>
          <DialogDescription>
            Write something worth remembering. Line breaks and all.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="note-text" className="text-xs text-ink-soft">
              Your note
            </Label>
            <Textarea
              id="note-text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={9}
              className="min-h-48 rounded-xl bg-paper font-hand text-xl leading-7"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note-signature" className="text-xs text-ink-soft">
              Signed
            </Label>
            <Input
              id="note-signature"
              value={draftSignature}
              onChange={(event) => setDraftSignature(event.target.value)}
              className="h-9 rounded-xl bg-paper"
              placeholder="— JC"
            />
          </div>
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
            onClick={() => {
              onSave(draft, draftSignature);
              onOpenChange(false);
            }}
            className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-rose-deep"
          >
            Save note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
