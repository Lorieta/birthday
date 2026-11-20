"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  GALLERY_SEED_ALBUMS,
  TIMELINE_ALBUM,
  defaultScrapbook,
  seededGalleryAlbumId,
} from "@/lib/seed-data";
import type {
  Album,
  MediaAsset,
  Memory,
  NewMemory,
  ScrapbookState,
} from "@/lib/scrapbook-types";

const STORAGE_KEY = "our-digital-scrapbook:v1";
const OLD_COVER = "/scrapbook/cover-sunset.svg";
const OLD_SEED_IDS = new Set([
  "timeline-first-date",
  "timeline-cafe-date",
  "timeline-game-date",
  "timeline-kiss",
  "timeline-just-us",
  "gallery-golden-hour",
  "gallery-daisies",
  "gallery-city-lights",
  "gallery-cake",
  "gallery-drinks",
  "gallery-carnival",
  "gallery-arcade",
  "gallery-heart-hands",
]);

const OLD_NOTE = "Thank you for being here...\nfor the laughs, the dates,\nthe random chats, and\neverything in between.\n\nI hope we keep making\nmore memories together.\n\nI love you.";
const OLD_PHOTO_ALT = "A scrapbook photo of the couple";
const OLD_VIDEO_ALT = "A scrapbook video of the couple";

const OLD_TIMELINE_COPY: Record<string, { title: string; caption: string }> = {
  "timeline-highlight-just-us": {
    title: "Just Us",
    caption: "The best kind of ordinary.",
  },
  "timeline-highlight-silly": {
    title: "Silly Together",
    caption: "I'd pick you every time.",
  },
  "timeline-highlight-favorite": {
    title: "My Favorite Face",
    caption: "That face.",
  },
  "timeline-highlight-little": {
    title: "Little Moments",
    caption: "Just us being us.",
  },
  "timeline-highlight-you-me": {
    title: "You & Me",
    caption: "Always you.",
  },
};

const OLD_GALLERY_TITLES = new Set([
  "Just us",
  "You & me",
  "Little moment",
  "My favorite",
  "Together",
  "Us, lately",
  "A good day",
  "So us",
  "With you",
  "Always",
  "A little video",
  "Moving memories",
  "Us in motion",
  "Caught on camera",
]);

const defaultMemoryById = new Map(
  defaultScrapbook.memories.map((memory) => [memory.id, memory]),
);

interface ScrapbookContextValue {
  state: ScrapbookState;
  addMemory: (memory: NewMemory) => Memory;
  updateMemory: (id: string, memory: NewMemory) => void;
  deleteMemory: (id: string) => void;
  addAlbum: (name: string) => Album | null;
  renameAlbum: (id: string, name: string) => void;
  deleteAlbum: (id: string) => void;
  setCover: (cover: MediaAsset) => void;
  setNote: (note: string) => void;
  setSignature: (signature: string) => void;
  setSince: (since: string) => void;
  reset: () => void;
}

const ScrapbookContext = createContext<ScrapbookContextValue | null>(null);

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `memory-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeMedia(value: unknown, fallback: MediaAsset): MediaAsset {
  if (!value || typeof value !== "object") return fallback;

  const media = value as Partial<MediaAsset>;

  if (
    (media.kind !== "image" && media.kind !== "video") ||
    typeof media.src !== "string" ||
    (media.source !== "cloudinary" && media.source !== "local")
  ) {
    return fallback;
  }

  return {
    kind: media.kind,
    source: media.source,
    src: media.src,
    publicId: typeof media.publicId === "string" ? media.publicId : undefined,
    poster: typeof media.poster === "string" ? media.poster : undefined,
    width: typeof media.width === "number" ? media.width : undefined,
    height: typeof media.height === "number" ? media.height : undefined,
    duration: typeof media.duration === "number" ? media.duration : undefined,
    alt: typeof media.alt === "string" ? media.alt : undefined,
  };
}

function normalizeMemory(value: unknown): Memory | null {
  if (!value || typeof value !== "object") return null;

  const memory = value as Partial<Memory>;

  if (
    typeof memory.id !== "string" ||
    typeof memory.title !== "string" ||
    typeof memory.date !== "string" ||
    typeof memory.caption !== "string" ||
    (memory.section !== "timeline" && memory.section !== "gallery")
  ) {
    return null;
  }

  const albumId =
    typeof memory.albumId === "string" && memory.albumId ? memory.albumId : undefined;

  return {
    id: memory.id,
    title: memory.title,
    date: memory.date,
    caption: memory.caption,
    sticker: typeof memory.sticker === "string" ? memory.sticker : "heart",
    section: memory.section,
    albumId,
    media: normalizeMedia(
      memory.media,
      defaultScrapbook.memories[0]?.media ?? defaultScrapbook.cover,
    ),
  } as Memory;
}

function isOldSeedMemory(memory: Memory) {
  return (
    OLD_SEED_IDS.has(memory.id) &&
    memory.media.source === "local" &&
    memory.media.src.startsWith("/scrapbook/")
  );
}

function isMissingImportedMedia(media: MediaAsset) {
  return (
    media.source === "local" &&
    (media.src.startsWith("/photos/") ||
      media.src.startsWith("/videos/") ||
      (media.poster?.startsWith("/videos/posters/") ?? false))
  );
}

function migrateCopyMemory(memory: Memory): Memory {
  const fresh = defaultMemoryById.get(memory.id);
  if (!fresh) return memory;

  const oldTimeline = OLD_TIMELINE_COPY[memory.id];
  const isOldTimeline =
    oldTimeline?.title === memory.title &&
    oldTimeline.caption === memory.caption;
  const isOldGallery =
    memory.id.startsWith("library-") &&
    memory.caption === "" &&
    OLD_GALLERY_TITLES.has(memory.title);

  const needsUpdate =
    memory.title !== fresh.title ||
    memory.caption !== fresh.caption ||
    memory.media.alt !== fresh.media.alt;

  if ((!isOldTimeline && !isOldGallery) || !needsUpdate) return memory;

  return {
    ...memory,
    title: fresh.title,
    caption: fresh.caption,
    media: { ...memory.media, alt: fresh.media.alt },
  };
}

function normalizeAlbums(albums: Album[] | undefined): Album[] {
  const base = [TIMELINE_ALBUM, ...GALLERY_SEED_ALBUMS];
  const byId = new Map<string, Album>();

  for (const album of base) byId.set(album.id, album);

  for (const raw of albums ?? []) {
    if (!raw || typeof raw !== "object") continue;
    const a = raw as Partial<Album>;
    if (typeof a.id !== "string" || typeof a.name !== "string") continue;
    if (a.section !== "timeline" && a.section !== "gallery") continue;
    if (byId.has(a.id)) continue; // keep stable seeded defaults
    byId.set(a.id, {
      id: a.id,
      name: a.name,
      section: a.section,
      createdAt: typeof a.createdAt === "string" ? a.createdAt : undefined,
    });
  }

  return [...byId.values()];
}

function isLegacyGalleryAlbumId(albumId: string | undefined) {
  return (
    !albumId ||
    albumId === "default-gallery" ||
    albumId.startsWith("default-gallery-")
  );
}

function migrateAlbumsAndMemoryLinks(state: ScrapbookState): ScrapbookState {
  const albums = normalizeAlbums(state.albums);
  const albumIds = new Set(albums.map((a) => a.id));

  let changed = state.albums !== albums;
  const memories = state.memories.map((memory) => {
    if (memory.section === "timeline") {
      if (memory.albumId === TIMELINE_ALBUM.id) return memory;
      changed = true;
      return { ...memory, albumId: TIMELINE_ALBUM.id };
    }

    // gallery
    if (memory.albumId && albumIds.has(memory.albumId) && !isLegacyGalleryAlbumId(memory.albumId)) {
      return memory;
    }

    if (memory.albumId && albumIds.has(memory.albumId) && !isLegacyGalleryAlbumId(memory.albumId)) {
      return memory;
    }

    // legacy/missing -> deterministic seeded album (idempotent)
    if (isLegacyGalleryAlbumId(memory.albumId) || !memory.albumId || !albumIds.has(memory.albumId)) {
      // if user-assigned to a non-seeded custom album that still exists, keep it
      if (memory.albumId && albumIds.has(memory.albumId) && !isLegacyGalleryAlbumId(memory.albumId)) {
        return memory;
      }
      const nextAlbumId = seededGalleryAlbumId(memory.id);
      if (memory.albumId === nextAlbumId) return memory;
      changed = true;
      return { ...memory, albumId: nextAlbumId };
    }

    return memory;
  });

  if (!changed) return state;
  return { ...state, albums, memories };
}

function migrateState(state: ScrapbookState): ScrapbookState {
  const baseCover =
    isMissingImportedMedia(state.cover) ||
    (state.cover.source === "local" && state.cover.src === OLD_COVER)
      ? defaultScrapbook.cover
      : state.cover;
  const cover =
    baseCover.alt === OLD_PHOTO_ALT
      ? { ...baseCover, alt: "A scrapbook photo" }
      : baseCover.alt === OLD_VIDEO_ALT
        ? { ...baseCover, alt: "A scrapbook video" }
        : baseCover;
  const note = state.note === OLD_NOTE ? defaultScrapbook.note : state.note;
  const availableMemories = state.memories.filter(
    (memory) => !isMissingImportedMedia(memory.media),
  );
  const removedImportedMemories =
    availableMemories.length !== state.memories.length;
  const oldSeedMemories = availableMemories.filter(isOldSeedMemory);
  let memories = availableMemories;

  if (oldSeedMemories.length) {
    const remaining = availableMemories.filter(
      (memory) => !isOldSeedMemory(memory),
    );
    const existingIds = new Set(remaining.map((memory) => memory.id));
    const freshSeed = defaultScrapbook.memories.filter(
      (memory) => !existingIds.has(memory.id),
    );

    memories = [...remaining, ...freshSeed];
  }

  const migratedMemories = memories.map(migrateCopyMemory);
  const memoriesChanged =
    removedImportedMemories ||
    memories !== availableMemories ||
    migratedMemories.some((memory, index) => memory !== memories[index]);

  let next: ScrapbookState =
    cover === state.cover && note === state.note && !memoriesChanged
      ? state
      : { ...state, cover, note, memories: migratedMemories };

  next = migrateAlbumsAndMemoryLinks(next);
  return next;
}

function normalizeState(value: unknown): ScrapbookState {
  if (!value || typeof value !== "object") return defaultScrapbook;

  const state = value as Partial<ScrapbookState>;

  if (!Array.isArray(state.memories)) return defaultScrapbook;

  const memories = state.memories
    .map(normalizeMemory)
    .filter((memory): memory is Memory => Boolean(memory));

  // albums normalized/migrated in migrateState

  return migrateState({
    version: 1,
    since:
      typeof state.since === "string" ? state.since : defaultScrapbook.since,
    cover: normalizeMedia(state.cover, defaultScrapbook.cover),
    note: typeof state.note === "string" ? state.note : defaultScrapbook.note,
    signature:
      typeof state.signature === "string"
        ? state.signature
        : defaultScrapbook.signature,
    memories: memories.length ? memories : defaultScrapbook.memories,
    albums: normalizeAlbums(state.albums),
  });
}

function readState() {
  if (typeof window === "undefined") return defaultScrapbook;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultScrapbook;
    return normalizeState(JSON.parse(stored));
  } catch {
    return defaultScrapbook;
  }
}

let currentState: ScrapbookState = defaultScrapbook;
let initialized = false;
const listeners = new Set<() => void>();

function getSnapshot() {
  if (typeof window === "undefined") return defaultScrapbook;

  if (!initialized) {
    currentState = readState();
    initialized = true;
  }

  return currentState;
}

function getServerSnapshot() {
  return defaultScrapbook;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

function updateState(updater: (current: ScrapbookState) => ScrapbookState) {
  currentState = updater(currentState);
  initialized = true;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
  } catch {
    return;
  }

  emit();
}

export function ScrapbookProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const addMemory = useCallback((memory: NewMemory) => {
    const created: Memory = { ...memory, id: generateId() };

    updateState((current) => ({
      ...current,
      memories: [created, ...current.memories],
    }));

    return created;
  }, []);

  const updateMemory = useCallback((id: string, memory: NewMemory) => {
    updateState((current) => ({
      ...current,
      memories: current.memories.map((item) =>
        item.id === id ? { ...item, ...memory } : item,
      ),
    }));
  }, []);

  const deleteMemory = useCallback((id: string) => {
    updateState((current) => ({
      ...current,
      memories: current.memories.filter((item) => item.id !== id),
    }));
  }, []);

  const addAlbum = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const created: Album = {
      id: `album-${generateId()}`,
      name: trimmed,
      section: "gallery",
      createdAt: new Date().toISOString(),
    };
    updateState((current) => ({
      ...current,
      albums: [...current.albums, created],
    }));
    return created;
  }, []);

  const renameAlbum = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateState((current) => ({
      ...current,
      albums: current.albums.map((album) =>
        album.id === id ? { ...album, name: trimmed } : album,
      ),
    }));
  }, []);

  const deleteAlbum = useCallback((id: string) => {
    updateState((current) => ({
      ...current,
      albums: current.albums.filter((album) => album.id !== id),
      memories: current.memories.map((memory) =>
        memory.albumId === id ? { ...memory, albumId: undefined } : memory,
      ),
    }));
  }, []);

  const setCover = useCallback((cover: MediaAsset) => {
    updateState((current) => ({ ...current, cover }));
  }, []);

  const setNote = useCallback((note: string) => {
    updateState((current) => ({ ...current, note }));
  }, []);

  const setSignature = useCallback((signature: string) => {
    updateState((current) => ({ ...current, signature }));
  }, []);

  const setSince = useCallback((since: string) => {
    updateState((current) => ({ ...current, since }));
  }, []);

  const reset = useCallback(() => {
    updateState(() => defaultScrapbook);
  }, []);

  const value = useMemo<ScrapbookContextValue>(
    () => ({
      state,
      addMemory,
      updateMemory,
      deleteMemory,
      addAlbum,
      renameAlbum,
      deleteAlbum,
      setCover,
      setNote,
      setSignature,
      setSince,
      reset,
    }),
    [
      state,
      addMemory,
      updateMemory,
      deleteMemory,
      addAlbum,
      renameAlbum,
      deleteAlbum,
      setCover,
      setNote,
      setSignature,
      setSince,
      reset,
    ],
  );

  return (
    <ScrapbookContext.Provider value={value}>
      {children}
    </ScrapbookContext.Provider>
  );
}

export function useScrapbook() {
  const context = useContext(ScrapbookContext);

  if (!context) {
    throw new Error("useScrapbook must be used inside ScrapbookProvider");
  }

  return context;
}
