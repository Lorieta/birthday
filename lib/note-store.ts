import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryConfig } from "@/lib/cloudinary-server";

const NOTE_PUBLIC_ID = "birthday-scrapbook/note.json";

export interface StoredNote {
  note: string;
  signature: string;
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

function parseStoredNote(value: string): StoredNote | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;

    const stored = parsed as Partial<StoredNote>;
    if (
      typeof stored.note !== "string" ||
      typeof stored.signature !== "string"
    ) {
      return null;
    }

    return { note: stored.note, signature: stored.signature };
  } catch {
    return null;
  }
}

export async function readNote(): Promise<StoredNote | null> {
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
    return parseStoredNote(await response.text());
  } catch {
    return null;
  }
}

export async function saveNote(stored: StoredNote): Promise<void> {
  if (!configureCloudinary()) {
    throw new Error("Cloudinary is not configured");
  }

  const data = Buffer.from(JSON.stringify(stored), "utf8").toString("base64");

  await cloudinary.uploader.upload(`data:application/json;base64,${data}`, {
    resource_type: "raw",
    type: "private",
    public_id: NOTE_PUBLIC_ID,
    overwrite: true,
    invalidate: true,
  });
}
