import { getNoteBoardText, saveNoteBoardText } from "@/lib/note-db";
import { normalizeMediaAsset } from "@/lib/media";
import type {
  BoardNote,
  MediaAsset,
  Memory,
  MemorySection,
  NoteColor,
  StickerName,
} from "@/lib/scrapbook-types";

const NOTE_VERSION = 2;
const NOTE_COLORS: NoteColor[] = ["blush", "sage", "butter", "lavender"];
const MEMORY_LIMITS = { count: 100 } as const;
const MEMORY_STICKERS: StickerName[] = [
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
  count: 50,
  title: 120,
  text: 10_000,
  signature: 200,
} as const;

export interface StoredNoteBoard {
  version: typeof NOTE_VERSION;
  notes: BoardNote[];
  cover?: MediaAsset;
  memories?: Memory[];
}

function normalizeBoardNote(value: unknown): BoardNote | null {
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

function normalizeStoredCover(value: unknown): MediaAsset | undefined {
  const cover = normalizeMediaAsset(value);
  return cover?.src ? cover : undefined;
}

export function normalizeMemory(value: unknown): Memory | null {
  if (!value || typeof value !== "object") return null;

  const memory = value as Partial<Memory>;

  if (
    typeof memory.id !== "string" ||
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
        ? memory.sticker
        : "heart",
    section: memory.section,
    sections: sections.length ? sections : [memory.section],
    albumId:
      typeof memory.albumId === "string" && memory.albumId
        ? memory.albumId
        : undefined,
    media,
  } as Memory;
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

export function parseStoredBoard(value: string): StoredNoteBoard | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;

    const board = parsed as Partial<StoredNoteBoard>;
    if (Array.isArray(board.notes)) {
      const notes = normalizeBoardNotes(board.notes);
      if (!notes) return null;

      return {
        version: NOTE_VERSION,
        notes,
        cover: normalizeStoredCover(board.cover),
        memories: normalizeMemories(board.memories) ?? undefined,
      };
    }

    const legacy = parsed as { note?: unknown; signature?: unknown };
    if (typeof legacy.note !== "string") return null;

    return {
      version: NOTE_VERSION,
      notes: [
        {
          id: "note-legacy",
          title: "A Little Note",
          text: legacy.note,
          signature:
            typeof legacy.signature === "string" ? legacy.signature : "",
          color: "blush",
        },
      ],
    };
  } catch {
    return null;
  }
}

export async function readNoteBoard(): Promise<StoredNoteBoard | null> {
  try {
    const text = await getNoteBoardText();
    if (!text) return null;
    return parseStoredBoard(text);
  } catch {
    return null;
  }
}

export async function saveNoteBoard(
  board: Omit<StoredNoteBoard, "version">,
): Promise<void> {
  const payload: StoredNoteBoard = { version: NOTE_VERSION, ...board };
  await saveNoteBoardText(JSON.stringify(payload));
}
