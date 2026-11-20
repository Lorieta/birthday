export type MediaKind = "image" | "video";

export type MediaSource = "cloudinary" | "local";

export type StickerName =
  | "heart"
  | "matcha"
  | "strawberry"
  | "couple-hug"
  | "couple-kiss"
  | "couple-peace"
  | "girl-shy"
  | "boy-shy"
  | "couple-drinks"
  | "gamepad"
  | "ferris"
  | "cake"
  | "flower"
  | "camera"
  | "cat"
  | "bow"
  | "sparkle";

export type NoteColor = "blush" | "sage" | "butter" | "lavender";

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

export interface BoardNote {
  id: string;
  title: string;
  text: string;
  signature: string;
  color: NoteColor;
}

export interface ScrapbookState {
  version: 1;
  since: string;
  cover: MediaAsset;
  note: string;
  signature: string;
  notes: BoardNote[];
  memories: Memory[];
  deletedCloudinaryPublicIds: string[];
  albums: Album[];
}

export type NewMemory = Omit<Memory, "id">;
export type NewBoardNote = Omit<BoardNote, "id">;
