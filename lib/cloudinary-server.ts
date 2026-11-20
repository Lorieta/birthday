import { v2 as cloudinary } from "cloudinary";

/**
 * Reads CLOUDINARY_URL, configures the Cloudinary SDK from it and returns
 * the public cloud name and API key (the secret stays on the server).
 *
 * Returns { cloudName, apiKey } or null if the URL is missing / malformed.
 */
export function getCloudinaryConfig() {
  const url = process.env.CLOUDINARY_URL;
  if (!url) return null;

  try {
    cloudinary.config({ cloudinary_url: url });
    const cfg = cloudinary.config(); // { cloud_name, api_key, api_secret, … }
    if (!cfg?.cloud_name || !cfg?.api_key || !cfg?.api_secret) return null;

    return {
      cloudName: cfg.cloud_name,
      apiKey: cfg.api_key,
      apiSecret: cfg.api_secret,
    };
  } catch {
    return null;
  }
}