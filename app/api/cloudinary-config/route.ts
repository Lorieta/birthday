import { getCloudinaryConfig } from "@/lib/cloudinary-server";

export async function GET() {
  const cfg = getCloudinaryConfig();
  if (!cfg)
    return new Response(
      JSON.stringify({ error: "Cloudinary not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );

  // Expose only the cloud name and API key – the secret stays on the server.
  return new Response(
    JSON.stringify({ cloudName: cfg.cloudName, apiKey: cfg.apiKey }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}