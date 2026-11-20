import { normalizeMediaAsset } from "@/lib/media";
import {
  NOTE_LIMITS,
  normalizeBoardNotes,
  readNoteBoard,
  saveNoteBoard,
} from "@/lib/note-store";

const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET() {
  const stored = await readNoteBoard();

  return Response.json(
    {
      notes: stored?.notes ?? null,
      cover: stored?.cover ?? null,
    },
    { headers: NO_STORE },
  );
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

  const payload = body as { notes?: unknown; cover?: unknown };
  const notes = normalizeBoardNotes(payload.notes);
  if (!notes || notes.length > NOTE_LIMITS.count) {
    return Response.json(
      { error: "Invalid notes." },
      { status: 400, headers: NO_STORE },
    );
  }

  const cover =
    payload.cover === null || payload.cover === undefined
      ? undefined
      : normalizeMediaAsset(payload.cover) ?? undefined;

  try {
    await saveNoteBoard({ notes, cover });
    return Response.json({ ok: true }, { headers: NO_STORE });
  } catch {
    return Response.json(
      { error: "Could not save notes." },
      { status: 503, headers: NO_STORE },
    );
  }
}
