import { connection } from "next/server";
import { listCloudinaryMedia } from "@/lib/cloudinary-media";

const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET() {
  await connection();

  const media = await listCloudinaryMedia().catch(() => []);
  return Response.json({ media }, { headers: NO_STORE });
}
