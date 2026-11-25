import { createClient, type Client } from "@libsql/client";

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

// Single-row note_board table (id = 1, data = JSON of the StoredNoteBoard payload).
function ensureSchema(): Promise<void> {
  schemaPromise ??= getClient()
    .execute(
      "CREATE TABLE IF NOT EXISTS note_board (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL)",
    )
    .then(() => undefined);
  return schemaPromise;
}

export async function getNoteBoardText(): Promise<string | null> {
  await ensureSchema();
  const result = await getClient().execute(
    "SELECT data FROM note_board WHERE id = 1",
  );
  const row = result.rows[0] as { data?: unknown } | undefined;
  return row && typeof row.data === "string" ? row.data : null;
}

export async function saveNoteBoardText(data: string): Promise<void> {
  await ensureSchema();
  await getClient().execute({
    sql: "INSERT INTO note_board (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
    args: [data],
  });
}

export async function deleteNoteBoard(): Promise<void> {
  await ensureSchema();
  await getClient().execute("DELETE FROM note_board WHERE id = 1");
}
