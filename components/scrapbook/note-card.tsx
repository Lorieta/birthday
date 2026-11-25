"use client";

import { useState } from "react";
import { Archive, Pencil, Plus, Trash2 } from "lucide-react";
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
import { HeartDoodle, WashiTape } from "@/components/scrapbook/decorative";
import { NoteDialog } from "@/components/scrapbook/note-dialog";
import { Sticker } from "@/components/scrapbook/stickers";
import { useScrapbook } from "@/components/scrapbook/scrapbook-provider";
import { isActiveNote, isArchivedNote } from "@/lib/scrapbook-normalize";
import { cn } from "@/lib/utils";
import type { BoardNote, NoteColor } from "@/lib/scrapbook-types";

const noteStyles: Record<
  NoteColor,
  { background: string; ink: string; accent: string; tape: "pink" | "sage" }
> = {
  blush: {
    background: "linear-gradient(145deg, #fde7eb, #f8c9d4)",
    ink: "#6b453c",
    accent: "#8f5f63",
    tape: "pink",
  },
  sage: {
    background: "linear-gradient(145deg, #edf3df, #d7e5c1)",
    ink: "#45503a",
    accent: "#66784f",
    tape: "sage",
  },
  butter: {
    background: "linear-gradient(145deg, #fff3d0, #f7e1a4)",
    ink: "#6b5730",
    accent: "#957139",
    tape: "pink",
  },
  lavender: {
    background: "linear-gradient(145deg, #f1e9f8, #ded0ec)",
    ink: "#574767",
    accent: "#7c6591",
    tape: "pink",
  },
};

export function NoteBoard({
  onOpenArchive,
}: {
  onOpenArchive?: () => void;
}) {
  const {
    state,
    addBoardNote,
    updateBoardNote,
    archiveBoardNote,
    deleteBoardNote,
  } = useScrapbook();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<BoardNote | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BoardNote | null>(null);

  const activeNotes = state.notes.filter(isActiveNote);
  const archivedCount = state.notes.filter(isArchivedNote).length;

  const openAdd = () => {
    setEditingNote(null);
    setEditorOpen(true);
  };

  const openEdit = (note: BoardNote) => {
    setEditingNote(note);
    setEditorOpen(true);
  };

  const handleSave = async (draft: Omit<BoardNote, "id">) => {
    const saved = editingNote
      ? await updateBoardNote(editingNote.id, draft)
      : await addBoardNote(draft);

    if (saved) {
      toast.success(editingNote ? "Note updated" : "A new note, saved");
    } else {
      toast.error("Note saved on this browser only — could not sync to DB");
    }

    setEditorOpen(false);
    setEditingNote(null);
  };

  const handleArchive = async (note: BoardNote) => {
    const saved = await archiveBoardNote(note.id);
    if (saved) {
      toast.success("Note archived");
    } else {
      toast.error("Note archived on this browser only — could not sync to DB");
    }
    setPendingDelete(null);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;

    const saved = await deleteBoardNote(pendingDelete.id);
    if (saved) {
      toast.success("Note removed");
    } else {
      toast.error("Note removed on this browser only — could not sync to DB");
    }

    setPendingDelete(null);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-hand text-[2rem] leading-none font-semibold text-[#6b453c]">
            Little Notes
            <HeartDoodle
              className="ml-2 inline size-5 -translate-y-0.5 text-[#c05470]"
              filled
            />
          </h3>
          <p className="mt-1 text-xs text-ink-soft">
            {activeNotes.length} {activeNotes.length === 1 ? "note" : "notes"}{" "}
            pinned to the board
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenArchive ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onOpenArchive}
              className="shrink-0 rounded-full border-rose/30 px-3 text-xs text-ink-soft hover:text-rose-deep"
            >
              <Archive className="size-3.5" />
              Archive{archivedCount > 0 ? ` (${archivedCount})` : ""}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            onClick={openAdd}
            className="shrink-0 rounded-full bg-primary px-4 text-primary-foreground hover:bg-rose-deep"
          >
            <Plus className="size-3.5" />
            Add note
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {activeNotes.map((note, index) => {
          const style = noteStyles[note.color];

          return (
            <article
              key={note.id}
              className="paper-card min-h-[210px] p-4 sm:min-h-[230px] sm:p-5"
              style={{ background: style.background, color: style.ink }}
            >
              <WashiTape
                tone={style.tape}
                className={cn(
                  "-top-2 left-6 w-16 sm:w-20",
                  index % 2 === 0 ? "-rotate-3" : "rotate-3",
                )}
              />

              <div className="relative flex items-start justify-between gap-2">
                <h4 className="font-hand text-2xl leading-tight font-semibold">
                  {note.title}
                </h4>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(note)}
                    aria-label={`Edit ${note.title}`}
                    className="rounded-full bg-white/45 hover:bg-white/75"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void handleArchive(note)}
                    aria-label={`Archive ${note.title}`}
                    className="rounded-full bg-white/45 hover:bg-white/75"
                  >
                    <Archive className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPendingDelete(note)}
                    aria-label={`Delete ${note.title}`}
                    className="rounded-full bg-white/45 hover:bg-white/75 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="lined-paper relative mt-3 min-h-24 font-hand text-lg leading-7 whitespace-pre-line">
                {note.text}
              </div>

              <p
                className="mt-3 text-right font-hand text-xl"
                style={{ color: style.accent }}
              >
                {note.signature}
              </p>
            </article>
          );
        })}

        <button
          type="button"
          onClick={openAdd}
          className="paper-card border-dashed border-rose/30 bg-paper-soft/70 p-5 text-center transition hover:-translate-y-0.5 hover:border-rose/60 hover:bg-paper-soft"
        >
          <span className="relative flex min-h-[190px] flex-col items-center justify-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Plus className="size-5" />
            </span>
            <span className="font-hand text-2xl text-ink">Add a note</span>
            <span className="text-xs text-ink-soft">
              Another little something to keep
            </span>
            <Sticker
              name="strawberry"
              size="xs"
              className="absolute right-1 bottom-0 rotate-6"
            />
          </span>
        </button>
      </div>

      <NoteDialog
        key={editingNote?.id ?? "new"}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        note={editingNote}
        onSave={handleSave}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive or remove this note?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving hides &ldquo;{pendingDelete?.title}&rdquo; so you can
              restore it later. Deleting permanently removes it from the board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (pendingDelete) void handleArchive(pendingDelete);
              }}
            >
              Archive instead
            </Button>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
