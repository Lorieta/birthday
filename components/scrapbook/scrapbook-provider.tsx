"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { titleFromCloudinaryPublicId } from "@/lib/cloudinary-asset";
import { normalizeMediaAsset } from "@/lib/media";
import {
  GALLERY_SEED_ALBUMS,
  TIMELINE_ALBUM,
  defaultBoardNote,
  defaultScrapbook,
  seededGalleryAlbumId,
} from "@/lib/seed-data";
import type {
  Album,
  BoardNote,
  MediaAsset,
  Memory,
  NewBoardNote,
  NewMemory,
  NoteColor,
  ScrapbookState,
} from "@/lib/scrapbook-types";

const STORAGE_KEY = "our-digital-scrapbook:v1";
const NOTE_COLORS = new Set<NoteColor>([
  "blush",
  "sage",
  "butter",
  "lavender",
]);
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
  setCover: (cover: MediaAsset) => Promise<boolean>;
  addBoardNote: (note: NewBoardNote) => Promise<boolean>;
  updateBoardNote: (id: string, note: NewBoardNote) => Promise<boolean>;
  deleteBoardNote: (id: string) => Promise<boolean>;
  setSince: (since: string) => void;
}

const ScrapbookContext = createContext<ScrapbookContextValue | null>(null);

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `memory-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeBoardNote(value: unknown): BoardNote | null {
  if (!value || typeof value !== "object") return null;

  const note = value as Partial<BoardNote>;
  if (
    typeof note.id !== "string" ||
    !note.id ||
    typeof note.title !== "string" ||
    typeof note.text !== "string" ||
    typeof note.signature !== "string" ||
    !NOTE_COLORS.has(note.color as NoteColor)
  ) {
    return null;
  }

  return {
    id: note.id,
    title: note.title,
    text: note.text,
    signature: note.signature,
    color: note.color as NoteColor,
  };
}

function normalizeBoardNotes(value: unknown): BoardNote[] | null {
  if (!Array.isArray(value)) return null;

  const notes: BoardNote[] = [];
  for (const item of value) {
    const note = normalizeBoardNote(item);
    if (!note) return null;
    notes.push(note);
  }

  return notes;
}

function legacyBoardNote(text: string, signature: string): BoardNote {
  return {
    ...defaultBoardNote,
    id: "note-legacy",
    text,
    signature,
  };
}

function withBoardNotes(
  state: ScrapbookState,
  notes: BoardNote[],
): ScrapbookState {
  return {
    ...state,
    notes,
    note: notes[0]?.text ?? "",
    signature: notes[0]?.signature ?? "",
  };
}

interface SyncedCloudinaryMedia {
  media: MediaAsset;
  createdAt?: string;
}

function normalizeSyncedCloudinaryMedia(
  value: unknown,
): SyncedCloudinaryMedia | null {
  if (!value || typeof value !== "object") return null;

  const item = value as { media?: unknown; createdAt?: unknown };
  const media = normalizeMedia(item.media, defaultScrapbook.cover);
  if (media.source !== "cloudinary" || !media.publicId) return null;

  return {
    media,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined,
  };
}

function dateFromCreatedAt(createdAt: string | undefined) {
  if (!createdAt) return new Date().toISOString().slice(0, 10);
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime())
    ? new Date().toISOString().slice(0, 10)
    : date.toISOString().slice(0, 10);
}

function cloudinaryMemoryId(publicId: string) {
  const slug = publicId.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80);
  return `cloudinary-${slug || "media"}`;
}

function withCloudinaryDeleted(state: ScrapbookState, publicId: string) {
  if (!publicId || state.deletedCloudinaryPublicIds.includes(publicId)) {
    return state;
  }

  return {
    ...state,
    deletedCloudinaryPublicIds: [
      ...state.deletedCloudinaryPublicIds,
      publicId,
    ],
  };
}

function mergeCloudinaryMedia(
  state: ScrapbookState,
  items: SyncedCloudinaryMedia[],
): ScrapbookState {
  const publicIds = new Set(
    state.memories
      .map((memory) => memory.media.publicId)
      .filter((id): id is string => Boolean(id)),
  );
  const memoryIds = new Set(state.memories.map((memory) => memory.id));
  const deleted = new Set(state.deletedCloudinaryPublicIds);
  const additions: Memory[] = [];

  for (const item of items) {
    const publicId = item.media.publicId;
    if (!publicId || deleted.has(publicId) || publicIds.has(publicId)) continue;
    if (state.cover.publicId === publicId) continue;

    const id = cloudinaryMemoryId(publicId);
    if (memoryIds.has(id)) continue;

    publicIds.add(publicId);
    memoryIds.add(id);
    additions.push({
      id,
      title: item.media.alt ?? titleFromCloudinaryPublicId(publicId),
      date: dateFromCreatedAt(item.createdAt),
      caption: "",
      media: item.media,
      sticker: "heart",
      section: "gallery",
      sections: ["timeline", "gallery"],
      albumId: seededGalleryAlbumId(id),
    });
  }

  if (!additions.length) return state;
  return { ...state, memories: [...additions, ...state.memories] };
}

function normalizeMedia(value: unknown, fallback: MediaAsset): MediaAsset {
  return normalizeMediaAsset(value) ?? fallback;
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
  const sections = Array.isArray(memory.sections)
    ? memory.sections.filter(
        (section): section is "timeline" | "gallery" =>
          section === "timeline" || section === "gallery",
      )
    : [];

  return {
    id: memory.id,
    title: memory.title,
    date: memory.date,
    caption: memory.caption,
    sticker: typeof memory.sticker === "string" ? memory.sticker : "heart",
    section: memory.section,
    sections: sections.length ? sections : [memory.section],
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
    cover === state.cover && !memoriesChanged
      ? state
      : { ...state, cover, memories: migratedMemories };

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

  const legacyNote =
    typeof state.note === "string" ? state.note : defaultScrapbook.note;
  const legacySignature =
    typeof state.signature === "string"
      ? state.signature
      : defaultScrapbook.signature;
  const storedNotes = normalizeBoardNotes(state.notes);
  const notes = storedNotes ?? [legacyBoardNote(legacyNote, legacySignature)];
  const migratedNotes =
    notes[0]?.text === OLD_NOTE
      ? [{ ...notes[0], text: defaultScrapbook.note }, ...notes.slice(1)]
      : notes;

  return migrateState(
    withBoardNotes(
      {
        version: 1,
        since:
          typeof state.since === "string" ? state.since : defaultScrapbook.since,
        cover: normalizeMedia(state.cover, defaultScrapbook.cover),
        note: "",
        signature: "",
        notes: migratedNotes,
        memories: memories.length ? memories : defaultScrapbook.memories,
        deletedCloudinaryPublicIds: Array.isArray(
          state.deletedCloudinaryPublicIds,
        )
          ? state.deletedCloudinaryPublicIds.filter(
              (id): id is string => typeof id === "string",
            )
          : [],
        albums: normalizeAlbums(state.albums),
      },
      migratedNotes,
    ),
  );
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
  const noteVersion = useRef(0);
  const mediaVersion = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const versionAtStart = noteVersion.current;

    fetch("/api/note", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        if (versionAtStart !== noteVersion.current) return;
        if (!data || typeof data !== "object") return;

        const stored = data as { notes?: unknown; cover?: unknown };
        const notes = normalizeBoardNotes(stored.notes);
        const cover = normalizeMediaAsset(stored.cover);
        if (!notes && !cover?.src) return;

        updateState((current) => {
          let next = current;
          if (notes) next = withBoardNotes(next, notes);
          if (cover?.src) next = { ...next, cover };
          return next;
        });
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const versionAtStart = mediaVersion.current;

    fetch("/api/cloudinary-media", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        if (versionAtStart !== mediaVersion.current) return;
        if (!data || typeof data !== "object") return;

        const rawMedia = (data as { media?: unknown }).media;
        if (!Array.isArray(rawMedia)) return;

        const items = rawMedia
          .map(normalizeSyncedCloudinaryMedia)
          .filter(
            (item): item is SyncedCloudinaryMedia => Boolean(item),
          );
        if (!items.length) return;

        updateState((current) => mergeCloudinaryMedia(current, items));
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  const addMemory = useCallback((memory: NewMemory) => {
    mediaVersion.current += 1;
    const created: Memory = {
      ...memory,
      id: generateId(),
      sections: memory.sections?.length ? memory.sections : [memory.section],
    };

    updateState((current) => ({
      ...current,
      memories: [created, ...current.memories],
    }));

    return created;
  }, []);

  const updateMemory = useCallback((id: string, memory: NewMemory) => {
    mediaVersion.current += 1;

    updateState((current) => {
      const existing = current.memories.find((item) => item.id === id);
      const replacedPublicId =
        existing?.media.source === "cloudinary" &&
        existing.media.publicId !== memory.media.publicId
          ? existing.media.publicId
          : undefined;

      const next = {
        ...current,
        memories: current.memories.map((item) =>
          item.id === id ? { ...item, ...memory } : item,
        ),
      };

      return replacedPublicId
        ? withCloudinaryDeleted(next, replacedPublicId)
        : next;
    });
  }, []);

  const deleteMemory = useCallback((id: string) => {
    mediaVersion.current += 1;

    updateState((current) => {
      const deleted = current.memories.find((item) => item.id === id);
      const next = {
        ...current,
        memories: current.memories.filter((item) => item.id !== id),
      };

      return deleted?.media.source === "cloudinary" && deleted.media.publicId
        ? withCloudinaryDeleted(next, deleted.media.publicId)
        : next;
    });
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

  const persistNoteBoard = useCallback(
    async (updater?: (state: ScrapbookState) => ScrapbookState) => {
      noteVersion.current += 1;
      const next = updater ? updater(currentState) : currentState;
      if (updater) updateState(() => next);

      const cover = next.cover?.src ? next.cover : undefined;

      try {
        const response = await fetch("/api/note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: next.notes, cover }),
        });
        return response.ok;
      } catch {
        return false;
      }
    },
    [],
  );

  const setCover = useCallback(
    (cover: MediaAsset) => persistNoteBoard((current) => ({ ...current, cover })),
    [persistNoteBoard],
  );

  const persistBoardNotes = useCallback(
    (updater: (notes: BoardNote[]) => BoardNote[]) =>
      persistNoteBoard((current) => withBoardNotes(current, updater(current.notes))),
    [persistNoteBoard],
  );

  const addBoardNote = useCallback(
    (draft: NewBoardNote) =>
      persistBoardNotes((notes) => [
        { ...draft, id: `note-${generateId()}` },
        ...notes,
      ]),
    [persistBoardNotes],
  );

  const updateBoardNote = useCallback(
    (id: string, draft: NewBoardNote) =>
      persistBoardNotes((notes) =>
        notes.map((note) => (note.id === id ? { ...draft, id } : note)),
      ),
    [persistBoardNotes],
  );

  const deleteBoardNote = useCallback(
    (id: string) =>
      persistBoardNotes((notes) => notes.filter((note) => note.id !== id)),
    [persistBoardNotes],
  );

  const setSince = useCallback((since: string) => {
    updateState((current) => ({ ...current, since }));
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
      addBoardNote,
      updateBoardNote,
      deleteBoardNote,
      setSince,
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
      addBoardNote,
      updateBoardNote,
      deleteBoardNote,
      setSince,
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
