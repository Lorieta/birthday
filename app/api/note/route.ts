import { NOTE_LIMITS, normalizeBoardNotes, readNoteBoard, saveNoteBoard } from "@/lib/note-store";

const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET() {
  const notes = await readNoteBoard();

  return Response.json({ notes }, { headers: NO_STORE });
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

  const notes = normalizeBoardNotes((body as { notes?: unknown }).notes);
  if (!notes || notes.length > NOTE_LIMITS.count) {
    return Response.json(
      { error: "Invalid notes." },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    await saveNoteBoard(notes);
    return Response.json({ ok: true }, { headers: NO_STORE });
  } catch {
    return Response.json(
      { error: "Could not save notes." },
      { status: 503, headers: NO_STORE },
    );
  }
}
