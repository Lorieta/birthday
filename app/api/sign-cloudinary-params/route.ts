import { getCloudinaryConfig } from "@/lib/cloudinary-server";
import { v2 as cloudinary } from "cloudinary";

export async function POST(request: Request) {
  const cfg = getCloudinaryConfig();
  if (!cfg)
    return new Response(
      JSON.stringify({ error: "Cloudinary is not configured. Add CLOUDINARY_URL to .env.local." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );

  cloudinary.config({
    cloud_name: cfg.cloudName,
    api_key: cfg.apiKey,
    api_secret: cfg.apiSecret,
  });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const paramsToSign =
    body && typeof body === "object" && "paramsToSign" in body
      ? (body as { paramsToSign?: unknown }).paramsToSign
      : undefined;

  if (!paramsToSign || typeof paramsToSign !== "object") {
    return new Response(JSON.stringify({ error: "Missing paramsToSign." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign as Record<string, string | number>,
    cfg.apiSecret,
  );

  return new Response(JSON.stringify({ signature }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}