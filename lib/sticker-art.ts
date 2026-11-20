import artManifest from "@/public/scrapbook/art/manifest.json";
import type { StickerName } from "@/lib/scrapbook-types";

export type ArtName = string;

export interface ArtAsset {
  src: string;
  width: number;
  height: number;
}

export const artAssets: Record<ArtName, ArtAsset> = Object.fromEntries(
  artManifest.map(
    (entry): [string, ArtAsset] => [
      entry.name,
      {
        src: `/scrapbook/art/${entry.file}`,
        width: entry.width,
        height: entry.height,
      },
    ],
  ),
);

export const STICKER_ART: Partial<Record<StickerName, ArtName>> = {
  heart: "heart",
  matcha: "matcha",
  strawberry: "strawberry",
  "couple-hug": "couple-hug",
  "couple-kiss": "couple-kiss",
  "couple-peace": "couple-peace",
  "girl-shy": "girl-shy",
  "boy-shy": "boy-shy",
  "couple-drinks": "couple-drinks",
  flower: "flower",
  camera: "camera",
  cat: "cat-sleep",
  bow: "bow-small",
  sparkle: "sparkle",
};

export const PERSON_ART = new Set<ArtName>([
  "couple-hug",
  "couple-kiss",
  "couple-peace",
  "girl-shy",
  "boy-shy",
  "couple-drinks",
]);

export function isPersonArt(name: ArtName) {
  return PERSON_ART.has(name);
}

export const WASHI_ART: Record<"pink" | "sage", ArtName> = {
  pink: "washi-pink-gingham",
  sage: "washi-green-gingham",
};

export function getArt(name: ArtName): ArtAsset | undefined {
  return artAssets[name];
}
