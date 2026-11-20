import { readNote, saveNote } from "@/lib/note-store";

const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET() {
  const stored = await readNote();

  return Response.json(
    {
      note: stored?.note ?? null,
      signature: stored?.signature ?? null,
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

  const { note, signature } = body as { note?: unknown; signature?: unknown };

  if (
    typeof note !== "string" ||
    typeof signature !== "string" ||
    note.length > 10_000 ||
    signature.length > 200
  ) {
    return Response.json(
      { error: "Invalid note." },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    await saveNote({ note, signature });
    return Response.json({ ok: true }, { headers: NO_STORE });
  } catch {
    return Response.json(
      { error: "Could not save note." },
      { status: 503, headers: NO_STORE },
    );
  }
}
