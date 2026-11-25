import { readNoteBoardRows, saveNoteBoardRows } from "@/lib/note-db";
import { normalizeMediaAsset } from "@/lib/media";
import {
  NOTE_LIMITS,
  normalizeAlbums,
  normalizeBoardNotes,
  normalizeDeletedIds,
  normalizeMemories,
} from "@/lib/scrapbook-normalize";
import type {
  Album,
  BoardNote,
  MediaAsset,
  Memory,
} from "@/lib/scrapbook-types";

export {
  NOTE_LIMITS,
  normalizeAlbums,
  normalizeBoardNotes,
  normalizeDeletedIds,
  normalizeMemories,
};

const NOTE_VERSION = 3;

export interface StoredNoteBoard {
  version: typeof NOTE_VERSION;
  notes: BoardNote[];
  cover?: MediaAsset;
  memories: Memory[];
  deletedCloudinaryPublicIds: string[];
  albums?: Album[];
  since?: string;
}

function normalizeStoredCover(value: unknown): MediaAsset | undefined {
  const cover = normalizeMediaAsset(value);
  return cover?.src ? cover : undefined;
}

export async function readNoteBoard(): Promise<StoredNoteBoard | null> {
  const stored = await readNoteBoardRows();
  if (!stored) return null;

  const notes = normalizeBoardNotes(stored.notes) ?? [];
  const memories = normalizeMemories(stored.memories) ?? [];

  return {
    version: NOTE_VERSION,
    notes,
    cover: normalizeStoredCover(stored.cover),
    memories,
    deletedCloudinaryPublicIds:
      normalizeDeletedIds(stored.deletedCloudinaryPublicIds) ?? [],
    albums: stored.albums ? normalizeAlbums(stored.albums) : undefined,
    since: stored.since,
  };
}

export async function saveNoteBoard(board: {
  notes: BoardNote[];
  cover?: MediaAsset | null;
  memories?: Memory[];
  deletedCloudinaryPublicIds?: string[];
  albums?: Album[];
  since?: string;
}): Promise<void> {
  await saveNoteBoardRows(board);
}
