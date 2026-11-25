"use client";

import { useState } from "react";
import { ArchiveRestore, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaImage, MediaPosterImage } from "@/components/scrapbook/media";
import { useScrapbook } from "@/components/scrapbook/scrapbook-provider";
import { formatMemoryDate } from "@/lib/media";
import { isArchivedMemory, isArchivedNote } from "@/lib/scrapbook-normalize";
import type { BoardNote, Memory } from "@/lib/scrapbook-types";
import { cn } from "@/lib/utils";

type ArchiveTab = "memories" | "notes";

type PendingPermanentDelete =
  | { kind: "memory"; item: Memory }
  | { kind: "note"; item: BoardNote };

function formatArchivedDate(iso: string | undefined) {
  if (!iso) return "";
  return formatMemoryDate(iso.slice(0, 10));
}

export function ArchiveDialog({
  open,
  onOpenChange,
  initialTab = "memories",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: ArchiveTab;
}) {
  const {
    state,
    restoreMemory,
    deleteMemory,
    restoreBoardNote,
    deleteBoardNote,
  } = useScrapbook();
  const [tab, setTab] = useState<ArchiveTab>(initialTab);
  const [pendingDelete, setPendingDelete] =
    useState<PendingPermanentDelete | null>(null);

  const archivedMemories = state.memories.filter(isArchivedMemory);
  const archivedNotes = state.notes.filter(isArchivedNote);

  const handleRestoreMemory = async (memory: Memory) => {
    const saved = await restoreMemory(memory.id);
    if (saved) toast.success(`"${memory.title}" restored`);
    else toast.error("Restored locally only — could not sync to DB");
  };

  const handleRestoreNote = async (note: BoardNote) => {
    const saved = await restoreBoardNote(note.id);
    if (saved) toast.success(`"${note.title}" restored`);
    else toast.error("Restored locally only — could not sync to DB");
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    if (target.kind === "memory") {
      const saved = await deleteMemory(target.item.id);
      if (saved) toast.success("Memory permanently deleted");
      else toast.error("Removed locally only — could not sync to DB");
    } else {
      const saved = await deleteBoardNote(target.item.id);
      if (saved) toast.success("Note permanently deleted");
      else toast.error("Removed locally only — could not sync to DB");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-3xl overflow-y-auto bg-paper-soft p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-hand text-3xl text-ink">
              Archive
            </DialogTitle>
            <DialogDescription>
              Restore archived notes, photos, and videos back to your
              scrapbook, or delete them permanently.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab("memories")}
              aria-pressed={tab === "memories"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                tab === "memories"
                  ? "border-rose-deep/30 bg-blush-soft text-rose-deep"
                  : "border-[rgba(107,69,60,0.12)] bg-paper text-ink-soft hover:bg-blush-soft/40",
              )}
            >
              Photos &amp; Videos
              <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[0.65rem]">
                {archivedMemories.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTab("notes")}
              aria-pressed={tab === "notes"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                tab === "notes"
                  ? "border-rose-deep/30 bg-blush-soft text-rose-deep"
                  : "border-[rgba(107,69,60,0.12)] bg-paper text-ink-soft hover:bg-blush-soft/40",
              )}
            >
              Notes
              <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[0.65rem]">
                {archivedNotes.length}
              </span>
            </button>
          </div>

          {tab === "memories" ? (
            archivedMemories.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {archivedMemories.map((memory) => (
                  <div
                    key={memory.id}
                    className="flex gap-3 rounded-2xl border border-[rgba(107,69,60,0.12)] bg-paper p-3"
                  >
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-paper-deep">
                      {memory.media.kind === "video" ? (
                        <>
                          <MediaPosterImage
                            media={memory.media}
                            alt={memory.media.alt ?? memory.title}
                            sizes="96px"
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
                            <Play className="size-4 fill-current" />
                          </span>
                        </>
                      ) : (
                        <MediaImage
                          media={memory.media}
                          alt={memory.media.alt ?? memory.title}
                          sizes="96px"
                        />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <p className="truncate font-hand text-xl leading-tight text-ink">
                          {memory.title}
                        </p>
                        {memory.caption ? (
                          <p className="line-clamp-1 text-xs text-ink-soft">
                            {memory.caption}
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-[0.65rem] text-ink-soft/80">
                          Archived {formatArchivedDate(memory.archivedAt)}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void handleRestoreMemory(memory)}
                          className="h-7 gap-1 rounded-full px-2.5 text-[0.7rem]"
                        >
                          <ArchiveRestore className="size-3" />
                          Restore
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setPendingDelete({ kind: "memory", item: memory })
                          }
                          className="h-7 gap-1 rounded-full px-2.5 text-[0.7rem] text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-rose/30 bg-blush-soft/20 p-8 text-center text-sm text-ink-soft">
                No archived photos or videos.
              </div>
            )
          ) : archivedNotes.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {archivedNotes.map((note) => (
                <div
                  key={note.id}
                  className="flex flex-col justify-between rounded-2xl border border-[rgba(107,69,60,0.12)] bg-paper p-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-hand text-2xl leading-tight text-ink">
                        {note.title}
                      </p>
                      <span className="shrink-0 text-[0.65rem] text-ink-soft/80">
                        {formatArchivedDate(note.archivedAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-3 font-hand text-lg leading-snug whitespace-pre-line text-ink-soft">
                      {note.text}
                    </p>
                    {note.signature ? (
                      <p className="mt-1 text-right font-hand text-base text-ink-soft/80">
                        {note.signature}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handleRestoreNote(note)}
                      className="h-7 gap-1 rounded-full px-2.5 text-[0.7rem]"
                    >
                      <ArchiveRestore className="size-3" />
                      Restore
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setPendingDelete({ kind: "note", item: note })
                      }
                      className="h-7 gap-1 rounded-full px-2.5 text-[0.7rem] text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-rose/30 bg-blush-soft/20 p-8 text-center text-sm text-ink-soft">
              No archived notes.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{pendingDelete?.item.title}&rdquo; will be permanently
              removed from the database
              {pendingDelete?.kind === "memory" &&
              pendingDelete.item.media.source === "cloudinary"
                ? " and Cloudinary"
                : ""}
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep archived</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleConfirmDelete()}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
