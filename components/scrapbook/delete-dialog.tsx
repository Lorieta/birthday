"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Memory } from "@/lib/scrapbook-types";

export function DeleteMemoryDialog({
  open,
  onOpenChange,
  memory,
  onArchive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memory: Memory | null;
  onArchive: (memory: Memory) => void | Promise<void>;
  onConfirm: (memory: Memory) => void | Promise<void>;
}) {
  if (!memory) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive or remove this memory?</AlertDialogTitle>
          <AlertDialogDescription>
            Archiving hides &ldquo;{memory.title}&rdquo; from your scrapbook so
            you can restore it later. Deleting permanently removes it everywhere
            {memory.media.source === "cloudinary"
              ? " and from Cloudinary"
              : ""}
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void onArchive(memory);
              onOpenChange(false);
            }}
          >
            Archive instead
          </Button>
          <AlertDialogAction
            onClick={() => {
              void onConfirm(memory);
              onOpenChange(false);
            }}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
