import { connection } from "next/server";
import { normalizeMediaAsset } from "@/lib/media";
import {
  NOTE_LIMITS,
  normalizeAlbums,
  normalizeBoardNotes,
  normalizeDeletedIds,
  normalizeMemories,
  readNoteBoard,
  saveNoteBoard,
} from "@/lib/note-store";
import { deleteNoteBoard } from "@/lib/note-db";

const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET() {
  await connection();

  try {
    const stored = await readNoteBoard();

    return Response.json(
      {
        notes: stored?.notes ?? null,
        cover: stored?.cover ?? null,
        memories: stored?.memories ?? null,
        deletedCloudinaryPublicIds: stored?.deletedCloudinaryPublicIds ?? null,
        albums: stored?.albums ?? null,
        since: stored?.since ?? null,
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error("Failed to read note board from database:", error);
    return Response.json(
      { error: "Could not load notes." },
      { status: 503, headers: NO_STORE },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body." },
      { status: 400, headers: NO_STORE },
    );
  }

  if (!body || typeof body !== "object") {
    return Response.json(
      { error: "Invalid request body." },
      { status: 400, headers: NO_STORE },
    );
  }

  const payload = body as {
    notes?: unknown;
    cover?: unknown;
    memories?: unknown;
    deletedCloudinaryPublicIds?: unknown;
    albums?: unknown;
    since?: unknown;
  };

  const notes = normalizeBoardNotes(payload.notes);
  if (!notes || notes.length > NOTE_LIMITS.count) {
    return Response.json(
      { error: "Invalid notes." },
      { status: 400, headers: NO_STORE },
    );
  }

  const cover =
    payload.cover === undefined
      ? undefined
      : payload.cover === null
        ? null
        : (normalizeMediaAsset(payload.cover) ?? undefined);

  const memoriesPresent =
    payload.memories !== undefined && payload.memories !== null;
  const memories = memoriesPresent
    ? (normalizeMemories(payload.memories) ?? undefined)
    : undefined;
  if (memoriesPresent && !memories) {
    return Response.json(
      { error: "Invalid memories." },
      { status: 400, headers: NO_STORE },
    );
  }

  const deletedPresent =
    payload.deletedCloudinaryPublicIds !== undefined &&
    payload.deletedCloudinaryPublicIds !== null;
  const deletedCloudinaryPublicIds = deletedPresent
    ? (normalizeDeletedIds(payload.deletedCloudinaryPublicIds) ?? undefined)
    : undefined;
  if (deletedPresent && !deletedCloudinaryPublicIds) {
    return Response.json(
      { error: "Invalid deletedCloudinaryPublicIds." },
      { status: 400, headers: NO_STORE },
    );
  }

  const albums =
    payload.albums !== undefined && payload.albums !== null
      ? normalizeAlbums(payload.albums)
      : undefined;

  const since =
    typeof payload.since === "string" && payload.since
      ? payload.since
      : undefined;

  try {
    await saveNoteBoard({
      notes,
      cover,
      memories,
      deletedCloudinaryPublicIds,
      albums,
      since,
    });
    return Response.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error("Failed to save note board to database:", error);
    return Response.json(
      { error: "Could not save notes." },
      { status: 503, headers: NO_STORE },
    );
  }
}

export async function DELETE() {
  try {
    await deleteNoteBoard();
    return Response.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error("Failed to delete note board from database:", error);
    return Response.json(
      { error: "Could not delete notes." },
      { status: 503, headers: NO_STORE },
    );
  }
}
