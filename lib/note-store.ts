import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryConfig } from "@/lib/cloudinary-server";
import type { BoardNote, NoteColor } from "@/lib/scrapbook-types";

const NOTE_PUBLIC_ID = "birthday-scrapbook/note.json";
const NOTE_VERSION = 2;
const NOTE_COLORS: NoteColor[] = ["blush", "sage", "butter", "lavender"];

export const NOTE_LIMITS = {
  count: 50,
  title: 120,
  text: 10_000,
  signature: 200,
} as const;

interface StoredNoteBoard {
  version: typeof NOTE_VERSION;
  notes: BoardNote[];
}

function configureCloudinary() {
  const cfg = getCloudinaryConfig();
  if (!cfg) return null;

  cloudinary.config({
    cloud_name: cfg.cloudName,
    api_key: cfg.apiKey,
    api_secret: cfg.apiSecret,
  });

  return cfg;
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

export function parseStoredNotes(value: string): BoardNote[] | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;

    const board = parsed as Partial<StoredNoteBoard>;
    if (Array.isArray(board.notes)) {
      return normalizeBoardNotes(board.notes);
    }

    const legacy = parsed as { note?: unknown; signature?: unknown };
    if (typeof legacy.note !== "string") return null;

    return [
      {
        id: "note-legacy",
        title: "A Little Note",
        text: legacy.note,
        signature:
          typeof legacy.signature === "string" ? legacy.signature : "",
        color: "blush",
      },
    ];
  } catch {
    return null;
  }
}

export async function readNoteBoard(): Promise<BoardNote[] | null> {
  if (!configureCloudinary()) return null;

  const url = cloudinary.utils.private_download_url(
    NOTE_PUBLIC_ID,
    "json",
    {
      resource_type: "raw",
      type: "private",
      expires_at: Math.floor(Date.now() / 1000) + 60,
    },
  );

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return parseStoredNotes(await response.text());
  } catch {
    return null;
  }
}

export async function saveNoteBoard(notes: BoardNote[]): Promise<void> {
  if (!configureCloudinary()) {
    throw new Error("Cloudinary is not configured");
  }

  const payload: StoredNoteBoard = { version: NOTE_VERSION, notes };
  const data = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");

  await cloudinary.uploader.upload(`data:application/json;base64,${data}`, {
    resource_type: "raw",
    type: "private",
    public_id: NOTE_PUBLIC_ID,
    overwrite: true,
    invalidate: true,
  });
}
