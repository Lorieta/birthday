import type { NextConfig } from "next";

function cloudNameFromUrl(value: string | undefined) {
  if (!value) return undefined;
  try {
    return new URL(value).hostname || undefined;
  } catch {
    return undefined;
  }
}

const cloudinaryCloudName = cloudNameFromUrl(process.env.CLOUDINARY_URL);

const nextConfig: NextConfig = {
  /* config options here */
  env: cloudinaryCloudName
    ? { NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: cloudinaryCloudName }
    : {},
  experimental: {
    agentFeedback: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
