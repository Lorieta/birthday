import { createClient, type Client, type InStatement } from "@libsql/client";
import type {
  Album,
  BoardNote,
  MediaAsset,
  Memory,
  MemorySection,
} from "@/lib/scrapbook-types";

export interface NoteBoardRows {
  notes: BoardNote[];
  cover?: MediaAsset;
  memories: Memory[];
  deletedCloudinaryPublicIds: string[];
  albums?: Album[];
  since?: string;
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

async function initSchema(): Promise<void> {
  const db = getClient();
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS board_notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        notes TEXT NOT NULL,
        signature TEXT NOT NULL DEFAULT '',
        color TEXT NOT NULL DEFAULT 'blush',
        archived_at TEXT,
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
        archived_at TEXT,
        position INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS board_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,
      "DROP TABLE IF EXISTS note_board",
    ],
    "write",
  );

  const [notesInfo, memoriesInfo] = await db.batch(
    ["PRAGMA table_info(board_notes)", "PRAGMA table_info(memories)"],
    "read",
  );

  const migrations: InStatement[] = [];
  const noteColumns = new Set(notesInfo.rows.map((row) => String(row.name)));
  const memoryColumns = new Set(
    memoriesInfo.rows.map((row) => String(row.name)),
  );

  if (!noteColumns.has("archived_at")) {
    migrations.push("ALTER TABLE board_notes ADD COLUMN archived_at TEXT");
  }
  if (!memoryColumns.has("archived_at")) {
    migrations.push("ALTER TABLE memories ADD COLUMN archived_at TEXT");
  }

  if (migrations.length) {
    await db.batch(migrations, "write");
  }
}

function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = initSchema().catch((err) => {
      schemaPromise = undefined;
      throw err;
    });
  }
  return schemaPromise;
}

function toOptionalString(value: unknown) {
  return typeof value === "string" && value ? value : undefined;
}

function toOptionalNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function parseJson<T>(value: unknown): T | undefined {
  if (typeof value !== "string") return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function parseSections(value: unknown): MemorySection[] | undefined {
  const parsed = parseJson<unknown>(value);
  if (!Array.isArray(parsed)) return undefined;
  return parsed.filter(
    (section): section is MemorySection =>
      section === "timeline" || section === "gallery",
  );
}

export async function readNoteBoardRows(): Promise<NoteBoardRows | null> {
  await ensureSchema();

  const [notesResult, memoriesResult, metaResult] = await getClient().batch(
    [
      "SELECT id, title, notes, signature, color, archived_at FROM board_notes ORDER BY position",
      "SELECT * FROM memories ORDER BY position",
      "SELECT key, value FROM board_meta WHERE key IN ('cover', 'deleted_cloudinary_public_ids', 'albums', 'since', 'initialized')",
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
      archivedAt: toOptionalString(row.archived_at),
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
      archivedAt: toOptionalString(row.archived_at),
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

  const meta = new Map<string, string>();
  for (const row of metaResult.rows) {
    if (typeof row.key === "string" && typeof row.value === "string") {
      meta.set(row.key, row.value);
    }
  }

  const cover = parseJson<MediaAsset>(meta.get("cover"));
  const rawDeleted = parseJson<unknown>(
    meta.get("deleted_cloudinary_public_ids"),
  );
  const deletedCloudinaryPublicIds = Array.isArray(rawDeleted)
    ? rawDeleted.filter((id): id is string => typeof id === "string" && Boolean(id))
    : [];
  const rawAlbums = parseJson<unknown>(meta.get("albums"));
  const albums = Array.isArray(rawAlbums) ? (rawAlbums as Album[]) : undefined;
  const since = toOptionalString(meta.get("since"));
  const initialized = meta.get("initialized") === "1";

  if (
    !initialized &&
    !notes.length &&
    !memories.length &&
    !cover &&
    !deletedCloudinaryPublicIds.length &&
    !albums &&
    !since
  ) {
    return null;
  }

  return {
    notes,
    cover,
    memories,
    deletedCloudinaryPublicIds,
    albums,
    since,
  };
}

function upsertMetaStatement(key: string, value: string): InStatement {
  return {
    sql: "INSERT INTO board_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    args: [key, value],
  };
}

export async function saveNoteBoardRows(board: {
  notes: BoardNote[];
  cover?: MediaAsset | null;
  memories?: Memory[];
  deletedCloudinaryPublicIds?: string[];
  albums?: Album[];
  since?: string;
}): Promise<void> {
  await ensureSchema();

  const statements: InStatement[] = ["DELETE FROM board_notes"];

  board.notes.forEach((note, index) => {
    statements.push({
      sql: "INSERT INTO board_notes (id, title, notes, signature, color, archived_at, position) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [
        note.id,
        note.title,
        note.text,
        note.signature,
        note.color,
        note.archivedAt ?? null,
        index,
      ],
    });
  });

  if (board.memories !== undefined) {
    statements.push("DELETE FROM memories");
    board.memories.forEach((memory, index) => {
      statements.push({
        sql: `INSERT INTO memories (
          id, title, caption, date, sticker, section, sections, album_id,
          media_kind, media_source, media_src, media_public_id, media_poster,
          media_width, media_height, media_duration, media_alt, archived_at, position
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          memory.archivedAt ?? null,
          index,
        ],
      });
    });
  }

  if (board.cover !== undefined) {
    if (board.cover) {
      statements.push(
        upsertMetaStatement("cover", JSON.stringify(board.cover)),
      );
    } else {
      statements.push("DELETE FROM board_meta WHERE key = 'cover'");
    }
  }

  if (board.deletedCloudinaryPublicIds !== undefined) {
    statements.push(
      upsertMetaStatement(
        "deleted_cloudinary_public_ids",
        JSON.stringify(board.deletedCloudinaryPublicIds),
      ),
    );
  }

  if (board.albums !== undefined) {
    statements.push(
      upsertMetaStatement("albums", JSON.stringify(board.albums)),
    );
  }

  if (board.since !== undefined) {
    statements.push(upsertMetaStatement("since", board.since));
  }

  statements.push(upsertMetaStatement("initialized", "1"));

  await getClient().batch(statements, "write");
}

export async function deleteNoteBoard(): Promise<void> {
  await ensureSchema();
  await getClient().batch(
    ["DELETE FROM board_notes", "DELETE FROM memories", "DELETE FROM board_meta"],
    "write",
  );
}
