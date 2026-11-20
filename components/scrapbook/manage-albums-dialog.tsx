"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useScrapbook } from "@/components/scrapbook/scrapbook-provider";

export function ManageAlbumsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state, addAlbum, renameAlbum, deleteAlbum } = useScrapbook();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const galleryAlbums = useMemo(
    () => state.albums.filter((a) => a.section === "gallery"),
    [state.albums],
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of state.memories) {
      if (m.section !== "gallery" || !m.albumId) continue;
      map.set(m.albumId, (map.get(m.albumId) ?? 0) + 1);
    }
    return map;
  }, [state.memories]);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    addAlbum(name);
    setNewName("");
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const saveEdit = () => {
    if (!editingId) return;
    renameAlbum(editingId, editingName);
    setEditingId(null);
    setEditingName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto bg-paper-soft p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-hand text-3xl text-ink">
            Manage albums
          </DialogTitle>
          <DialogDescription>
            Create, rename, or delete gallery albums. Deleting an album keeps
            its photos in “All”.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New album name"
              className="h-9 rounded-xl bg-paper"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
            <Button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="h-9 shrink-0 gap-1.5 rounded-full bg-primary px-4 text-xs text-primary-foreground hover:bg-rose-deep"
            >
              <Plus className="size-3.5" />
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {galleryAlbums.map((album) => {
              const count = counts.get(album.id) ?? 0;
              const editing = editingId === album.id;
              return (
                <div
                  key={album.id}
                  className="flex items-center gap-2 rounded-xl border border-[rgba(107,69,60,0.12)] bg-paper px-3 py-2"
                >
                  {editing ? (
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-8 flex-1 rounded-lg bg-paper-soft"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") {
                          setEditingId(null);
                          setEditingName("");
                        }
                      }}
                    />
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">{album.name}</p>
                      <p className="text-[0.65rem] text-ink-soft">
                        {count} {count === 1 ? "item" : "items"}
                      </p>
                    </div>
                  )}

                  {editing ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={saveEdit}
                      className="h-8 rounded-full px-3 text-xs"
                    >
                      Save
                    </Button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(album.id, album.name)}
                      aria-label={`Rename ${album.name}`}
                      className="flex size-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-blush-soft/50 hover:text-rose-deep"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteAlbum(album.id)}
                    aria-label={`Delete ${album.name}`}
                    className="flex size-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
            {galleryAlbums.length === 0 ? (
              <p className="text-sm text-ink-soft">No albums yet.</p>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
