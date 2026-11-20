"use client";

import { useState, useEffect } from "react";

export function useCloudinaryConfig() {
  const [cloudName, setCloudName] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cloudinary-config")
      .then((res) => {
        if (!res.ok) throw new Error("Upload configuration is unavailable");
        return res.json();
      })
      .then((data) => {
        setCloudName(data?.cloudName ?? null);
        setApiKey(data?.apiKey ?? null);
        setConfigured(Boolean(data?.cloudName && data?.apiKey));
      })
      .catch(() => {
        setCloudName(null);
        setApiKey(null);
        setConfigured(false);
      })
      .finally(() => setLoading(false));
  }, []);

  return { cloudName, apiKey, configured, loading };
}
