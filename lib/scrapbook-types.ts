export type MediaKind = "image" | "video";

export type MediaSource = "cloudinary" | "local";

export type StickerName =
  | "heart"
  | "matcha"
  | "strawberry"
  | "gamepad"
  | "ferris"
  | "cake"
  | "flower"
  | "camera"
  | "cat"
  | "bow"
  | "sparkle";

export interface MediaAsset {
  kind: MediaKind;
  source: MediaSource;
  src: string;
  publicId?: string;
  poster?: string;
  width?: number;
  height?: number;
  duration?: number;
  alt?: string;
}

export interface Memory {
  id: string;
  title: string;
  date: string;
  caption: string;
  media: MediaAsset;
  sticker: StickerName;
  section: "timeline" | "gallery";
  albumId?: string;
}

export interface Album {
  id: string;
  name: string;
  section: "timeline" | "gallery";
  createdAt?: string;
}

export interface ScrapbookState {
  version: 1;
  since: string;
  cover: MediaAsset;
  note: string;
  signature: string;
  memories: Memory[];
  albums: Album[];
}

export type NewMemory = Omit<Memory, "id">;
