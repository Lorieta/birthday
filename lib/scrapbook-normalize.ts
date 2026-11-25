import { normalizeMediaAsset } from "@/lib/media";
import { GALLERY_SEED_ALBUMS, TIMELINE_ALBUM } from "@/lib/seed-data";
import type {
  Album,
  BoardNote,
  Memory,
  MemorySection,
  NoteColor,
  StickerName,
} from "@/lib/scrapbook-types";

export const NOTE_COLORS: readonly NoteColor[] = [
  "blush",
  "sage",
  "butter",
  "lavender",
];

export const MEMORY_STICKERS: readonly StickerName[] = [
  "heart",
  "matcha",
  "strawberry",
  "couple-hug",
  "couple-kiss",
  "couple-peace",
  "girl-shy",
  "boy-shy",
  "couple-drinks",
  "gamepad",
  "ferris",
  "cake",
  "flower",
  "camera",
  "cat",
  "bow",
  "sparkle",
];

export const NOTE_LIMITS = {
  count: 500,
  title: 120,
  text: 10_000,
  signature: 200,
} as const;

export const MEMORY_LIMITS = {
  count: 5000,
} as const;

export function isActiveNote(note: BoardNote) {
  return !note.archivedAt;
}

export function isArchivedNote(note: BoardNote) {
  return Boolean(note.archivedAt);
}

export function isActiveMemory(memory: Memory) {
  return !memory.archivedAt;
}

export function isArchivedMemory(memory: Memory) {
  return Boolean(memory.archivedAt);
}

export function normalizeBoardNote(value: unknown): BoardNote | null {
  if (!value || typeof value !== "object") return null;

  const note = value as Partial<BoardNote>;
  if (
    typeof note.id !== "string" ||
    !note.id ||
    typeof note.title !== "string" ||
    note.title.length > NOTE_LIMITS.title ||
    typeof note.text !== "string" ||
    note.text.length > NOTE_LIMITS.text ||
    typeof note.signature !== "string" ||
    note.signature.length > NOTE_LIMITS.signature ||
    !NOTE_COLORS.includes(note.color as NoteColor)
  ) {
    return null;
  }

  return {
    id: note.id,
    title: note.title,
    text: note.text,
    signature: note.signature,
    color: note.color as NoteColor,
    archivedAt:
      typeof note.archivedAt === "string" && note.archivedAt
        ? note.archivedAt
        : undefined,
  };
}

export function normalizeBoardNotes(value: unknown): BoardNote[] | null {
  if (!Array.isArray(value) || value.length > NOTE_LIMITS.count) return null;

  const notes: BoardNote[] = [];
  for (const item of value) {
    const note = normalizeBoardNote(item);
    if (!note) return null;
    notes.push(note);
  }

  return notes;
}

export function normalizeMemory(value: unknown): Memory | null {
  if (!value || typeof value !== "object") return null;

  const memory = value as Partial<Memory>;

  if (
    typeof memory.id !== "string" ||
    !memory.id ||
    typeof memory.title !== "string" ||
    typeof memory.date !== "string" ||
    typeof memory.caption !== "string" ||
    (memory.section !== "timeline" && memory.section !== "gallery")
  ) {
    return null;
  }

  const media = normalizeMediaAsset(memory.media);
  if (!media) return null;

  const sections = Array.isArray(memory.sections)
    ? memory.sections.filter(
        (section): section is MemorySection =>
          section === "timeline" || section === "gallery",
      )
    : [];

  return {
    id: memory.id,
    title: memory.title,
    date: memory.date,
    caption: memory.caption,
    sticker:
      typeof memory.sticker === "string" &&
      MEMORY_STICKERS.includes(memory.sticker as StickerName)
        ? (memory.sticker as StickerName)
        : "heart",
    section: memory.section,
    sections: sections.length ? sections : [memory.section],
    albumId:
      typeof memory.albumId === "string" && memory.albumId
        ? memory.albumId
        : undefined,
    archivedAt:
      typeof memory.archivedAt === "string" && memory.archivedAt
        ? memory.archivedAt
        : undefined,
    media,
  };
}

export function normalizeMemories(value: unknown): Memory[] | null {
  if (!Array.isArray(value) || value.length > MEMORY_LIMITS.count) {
    return null;
  }

  const memories: Memory[] = [];
  for (const item of value) {
    const memory = normalizeMemory(item);
    if (!memory) return null;
    memories.push(memory);
  }

  return memories;
}

export function normalizeAlbums(value: unknown): Album[] {
  const base = [TIMELINE_ALBUM, ...GALLERY_SEED_ALBUMS];
  const byId = new Map<string, Album>();

  for (const album of base) byId.set(album.id, album);

  if (!Array.isArray(value)) return [...byId.values()];

  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const a = raw as Partial<Album>;
    if (typeof a.id !== "string" || !a.id || typeof a.name !== "string") {
      continue;
    }
    if (a.section !== "timeline" && a.section !== "gallery") continue;
    if (byId.has(a.id)) continue;
    byId.set(a.id, {
      id: a.id,
      name: a.name,
      section: a.section,
      createdAt: typeof a.createdAt === "string" ? a.createdAt : undefined,
    });
  }

  return [...byId.values()];
}

export function normalizeDeletedIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !item || seen.has(item)) continue;
    seen.add(item);
    result.push(item);
  }
  return result;
}
