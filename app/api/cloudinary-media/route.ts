import { connection } from "next/server";
import {
  deleteCloudinaryMedia,
  listCloudinaryMedia,
} from "@/lib/cloudinary-media";

const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET() {
  await connection();

  const media = await listCloudinaryMedia().catch(() => []);
  return Response.json({ media }, { headers: NO_STORE });
}

export async function DELETE(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body." },
      { status: 400, headers: NO_STORE },
    );
  }

  const payload =
    body && typeof body === "object"
      ? (body as { publicId?: unknown; resourceType?: unknown })
      : null;

  const publicId =
    typeof payload?.publicId === "string" ? payload.publicId.trim() : "";
  if (!publicId || publicId.length > 255) {
    return Response.json(
      { error: "Invalid publicId." },
      { status: 400, headers: NO_STORE },
    );
  }

  const resourceType = payload?.resourceType === "video" ? "video" : "image";

  try {
    const result = await deleteCloudinaryMedia(publicId, resourceType);
    if (!result.ok) {
      return Response.json(
        { error: "Could not delete Cloudinary media.", result: result.result },
        { status: 502, headers: NO_STORE },
      );
    }
    return Response.json(
      { ok: true, result: result.result },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error("Failed to delete Cloudinary media:", error);
    return Response.json(
      { error: "Could not delete Cloudinary media." },
      { status: 503, headers: NO_STORE },
    );
  }
}
