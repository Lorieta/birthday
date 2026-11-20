import type { StickerName } from "@/lib/scrapbook-types";

export type ArtName = string;

export interface ArtAsset {
  src: string;
  width: number;
  height: number;
}

export const artAssets = {} as Record<string, ArtAsset>;

export const STICKER_ART: Partial<Record<StickerName, ArtName>> = {};

export const WASHI_ART: Record<"pink" | "sage", ArtName> = {
  pink: "washi-pink-gingham",
  sage: "washi-green-gingham",
};

export function getArt(name: ArtName): ArtAsset | undefined {
  return artAssets[name];
}
