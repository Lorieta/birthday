import { createClient, type Client, type InStatement } from "@libsql/client";
import type {
  BoardNote,
  MediaAsset,
  Memory,
  MemorySection,
} from "@/lib/scrapbook-types";

export interface NoteBoardRows {
  notes: BoardNote[];
  cover?: MediaAsset;
  memories: Memory[];
}

let client: Client | undefined;
let schemaPromise: Promise<void> | undefined;

function getClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) throw new Error("TURSO_DATABASE_URL is not set");
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  return client;
}

function ensureSchema(): Promise<void> {
  schemaPromise ??= getClient()
    .batch(
      [
        `CREATE TABLE IF NOT EXISTS board_notes (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          notes TEXT NOT NULL,
          signature TEXT NOT NULL DEFAULT '',
          color TEXT NOT NULL DEFAULT 'blush',
          position INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS memories (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          caption TEXT NOT NULL DEFAULT '',
          date TEXT NOT NULL,
          sticker TEXT NOT NULL DEFAULT 'heart',
          section TEXT NOT NULL,
          sections TEXT NOT NULL DEFAULT '[]',
          album_id TEXT,
          media_kind TEXT NOT NULL,
          media_source TEXT NOT NULL,
          media_src TEXT NOT NULL,
          media_public_id TEXT,
          media_poster TEXT,
          media_width INTEGER,
          media_height INTEGER,
          media_duration REAL,
          media_alt TEXT,
          position INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS board_meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )`,
        "DROP TABLE IF EXISTS note_board",
      ],
      "write",
    )
    .then(() => undefined);
  return schemaPromise;
}

function toOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function toOptionalNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function parseSections(value: unknown): MemorySection[] | undefined {
  if (typeof value !== "string") return undefined;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return undefined;
    return parsed.filter(
      (section): section is MemorySection =>
        section === "timeline" || section === "gallery",
    );
  } catch {
    return undefined;
  }
}

export async function readNoteBoardRows(): Promise<NoteBoardRows | null> {
  await ensureSchema();

  const [notesResult, memoriesResult, metaResult] = await getClient().batch(
    [
      "SELECT id, title, notes, signature, color FROM board_notes ORDER BY position",
      "SELECT * FROM memories ORDER BY position",
      "SELECT value FROM board_meta WHERE key = 'cover'",
    ],
    "read",
  );

  const notes = notesResult.rows.map(
    (row): BoardNote => ({
      id: String(row.id),
      title: String(row.title),
      text: String(row.notes),
      signature: String(row.signature),
      color: String(row.color) as BoardNote["color"],
    }),
  );

  const memories = memoriesResult.rows.map(
    (row): Memory => ({
      id: String(row.id),
      title: String(row.title),
      date: String(row.date),
      caption: String(row.caption),
      sticker: String(row.sticker) as Memory["sticker"],
      section: String(row.section) as Memory["section"],
      sections: parseSections(row.sections),
      albumId: toOptionalString(row.album_id),
      media: {
        kind: String(row.media_kind) as MediaAsset["kind"],
        source: String(row.media_source) as MediaAsset["source"],
        src: String(row.media_src),
        publicId: toOptionalString(row.media_public_id),
        poster: toOptionalString(row.media_poster),
        width: toOptionalNumber(row.media_width),
        height: toOptionalNumber(row.media_height),
        duration: toOptionalNumber(row.media_duration),
        alt: toOptionalString(row.media_alt),
      },
    }),
  );

  let cover: MediaAsset | undefined;
  const coverValue = metaResult.rows[0]?.value;
  if (typeof coverValue === "string") {
    try {
      cover = JSON.parse(coverValue) as MediaAsset;
    } catch {
      cover = undefined;
    }
  }

  if (!notes.length && !memories.length && !cover) return null;
  return { notes, cover, memories };
}

export async function saveNoteBoardRows(board: {
  notes: BoardNote[];
  cover?: MediaAsset;
  memories?: Memory[];
}): Promise<void> {
  await ensureSchema();

  const statements: InStatement[] = [
    "DELETE FROM board_notes",
    "DELETE FROM memories",
    "DELETE FROM board_meta WHERE key = 'cover'",
  ];

  board.notes.forEach((note, index) => {
    statements.push({
      sql: "INSERT INTO board_notes (id, title, notes, signature, color, position) VALUES (?, ?, ?, ?, ?, ?)",
      args: [note.id, note.title, note.text, note.signature, note.color, index],
    });
  });

  (board.memories ?? []).forEach((memory, index) => {
    statements.push({
      sql: `INSERT INTO memories (
        id, title, caption, date, sticker, section, sections, album_id,
        media_kind, media_source, media_src, media_public_id, media_poster,
        media_width, media_height, media_duration, media_alt, position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        memory.id,
        memory.title,
        memory.caption,
        memory.date,
        memory.sticker,
        memory.section,
        JSON.stringify(memory.sections ?? [memory.section]),
        memory.albumId ?? null,
        memory.media.kind,
        memory.media.source,
        memory.media.src,
        memory.media.publicId ?? null,
        memory.media.poster ?? null,
        memory.media.width ?? null,
        memory.media.height ?? null,
        memory.media.duration ?? null,
        memory.media.alt ?? null,
        index,
      ],
    });
  });

  if (board.cover) {
    statements.push({
      sql: "INSERT INTO board_meta (key, value) VALUES ('cover', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      args: [JSON.stringify(board.cover)],
    });
  }

  await getClient().batch(statements, "write");
}

export async function deleteNoteBoard(): Promise<void> {
  await ensureSchema();
  await getClient().batch(
    ["DELETE FROM board_notes", "DELETE FROM memories", "DELETE FROM board_meta"],
    "write",
  );
}
