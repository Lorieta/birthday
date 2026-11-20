import type {
  Album,
  BoardNote,
  MediaAsset,
  Memory,
  ScrapbookState,
} from "@/lib/scrapbook-types";

export const TIMELINE_ALBUM: Album = {
  id: "default-timeline",
  name: "All memories",
  section: "timeline",
};

export const GALLERY_SEED_ALBUMS: Album[] = [
  { id: "album-dates-everyday", name: "Dates & everyday moments", section: "gallery" },
  { id: "album-food-drinks", name: "Food & drinks", section: "gallery" },
  { id: "album-gym-meeting", name: "Gym meeting", section: "gallery" },
];

export function seededGalleryAlbumId(memoryId: string) {
  let hash = 0;
  for (let i = 0; i < memoryId.length; i += 1) {
    hash = (hash * 31 + memoryId.charCodeAt(i)) | 0;
  }
  return GALLERY_SEED_ALBUMS[Math.abs(hash) % GALLERY_SEED_ALBUMS.length].id;
}

const defaultAlbums: Album[] = [TIMELINE_ALBUM, ...GALLERY_SEED_ALBUMS];

const placeholderCover: MediaAsset = {
  kind: "image",
  source: "local",
  src: "",
  alt: "Scrapbook cover",
};

const defaultNoteText =
  "Thanks for the laughs,\nfor the random chats,\nand everything in between.\n\nHere's to more good days\nand more memories worth keeping.";

export const defaultBoardNote: BoardNote = {
  id: "note-default",
  title: "A Little Note",
  text: defaultNoteText,
  signature: "— JC",
  color: "blush",
};

export const defaultScrapbook: ScrapbookState = {
  version: 1,
  since: "2026-11-15",
  cover: placeholderCover,
  note: defaultNoteText,
  signature: defaultBoardNote.signature,
  notes: [defaultBoardNote],
  albums: defaultAlbums,
  memories: [],
  deletedCloudinaryPublicIds: [],
};

export const galleryMemories: Memory[] = [];
export const timelineMemories: Memory[] = [];
