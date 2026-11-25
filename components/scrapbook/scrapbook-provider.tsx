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
import { cleanCloudinaryName } from "@/lib/cloudinary-asset";
import { normalizeMediaAsset } from "@/lib/media";
import {
  normalizeAlbums,
  normalizeBoardNotes,
  normalizeDeletedIds,
  normalizeMemories,
  normalizeMemory,
} from "@/lib/scrapbook-normalize";
import {
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
  ScrapbookState,
} from "@/lib/scrapbook-types";

const STORAGE_KEY = "our-digital-scrapbook:v1";
const PENDING_KEY = "our-digital-scrapbook:pending-sync";
const KEEPALIVE_MAX_BYTES = 60_000;

function setPendingSync(pending: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (pending) window.localStorage.setItem(PENDING_KEY, "1");
    else window.localStorage.removeItem(PENDING_KEY);
  } catch {
    // Storage unavailable; saves still go through normally.
  }
}

function hasPendingSync() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

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

const OLD_NOTE =
  "Thank you for being here...\nfor the laughs, the dates,\nthe random chats, and\neverything in between.\n\nI hope we keep making\nmore memories together.\n\nI love you.";
const OLD_PHOTO_ALT = "A scrapbook photo of the couple";
const OLD_VIDEO_ALT = "A scrapbook video of the couple";
const FALLBACK_MEMORY_TITLE = "A little memory";

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
  addMemory: (memory: NewMemory) => Promise<boolean>;
  updateMemory: (id: string, memory: NewMemory) => Promise<boolean>;
  archiveMemory: (id: string) => Promise<boolean>;
  restoreMemory: (id: string) => Promise<boolean>;
  deleteMemory: (id: string) => Promise<boolean>;
  addAlbum: (name: string) => Album | null;
  renameAlbum: (id: string, name: string) => void;
  deleteAlbum: (id: string) => void;
  setCover: (cover: MediaAsset) => Promise<boolean>;
  addBoardNote: (note: NewBoardNote) => Promise<boolean>;
  updateBoardNote: (id: string, note: NewBoardNote) => Promise<boolean>;
  archiveBoardNote: (id: string) => Promise<boolean>;
  restoreBoardNote: (id: string) => Promise<boolean>;
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
  const firstActive = notes.find((note) => !note.archivedAt);
  return {
    ...state,
    notes,
    note: firstActive?.text ?? "",
    signature: firstActive?.signature ?? "",
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

function isPublicIdStillReferenced(state: ScrapbookState, publicId: string) {
  if (state.cover.publicId === publicId) return true;
  return state.memories.some((memory) => memory.media.publicId === publicId);
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
      title:
        cleanCloudinaryName(item.media.alt) ??
        cleanCloudinaryName(publicId) ??
        FALLBACK_MEMORY_TITLE,
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

function isDerivedCloudinaryTitle(memory: Memory) {
  const media = memory.media;
  if (media.source !== "cloudinary" || !media.publicId) return false;

  const title = memory.title.trim();
  if (!title) return true;

  const bareId = media.publicId.split("/").pop() ?? media.publicId;
  return (
    title === media.publicId ||
    title === bareId ||
    title === media.alt ||
    title === cleanCloudinaryName(media.publicId) ||
    title === cleanCloudinaryName(media.alt)
  );
}

function isPlaceholderMemoryTitle(memory: Memory) {
  if (!memory.title.trim()) return true;
  if (memory.title === FALLBACK_MEMORY_TITLE) return true;
  return isDerivedCloudinaryTitle(memory);
}

function migrateOpaqueMemoryTitle(memory: Memory): Memory {
  if (!isDerivedCloudinaryTitle(memory)) return memory;

  return {
    ...memory,
    title:
      cleanCloudinaryName(memory.media.alt) ??
      cleanCloudinaryName(memory.media.publicId) ??
      FALLBACK_MEMORY_TITLE,
  };
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

    if (
      memory.albumId &&
      albumIds.has(memory.albumId) &&
      !isLegacyGalleryAlbumId(memory.albumId)
    ) {
      return memory;
    }

    const nextAlbumId = seededGalleryAlbumId(memory.id);
    if (memory.albumId === nextAlbumId) return memory;
    changed = true;
    return { ...memory, albumId: nextAlbumId };
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

  const migratedMemories = memories
    .map(migrateCopyMemory)
    .map(migrateOpaqueMemoryTitle);
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
        deletedCloudinaryPublicIds:
          normalizeDeletedIds(state.deletedCloudinaryPublicIds) ?? [],
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
    // Even if localStorage quota is exceeded, still notify UI listeners.
  }

  emit();
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let saveSeq = 0;
let activeSave: Promise<boolean> | null = null;
let queuedSave = false;

function buildBoardPayload() {
  return JSON.stringify({
    notes: currentState.notes,
    cover: currentState.cover?.src ? currentState.cover : null,
    memories: currentState.memories,
    deletedCloudinaryPublicIds: currentState.deletedCloudinaryPublicIds,
    albums: currentState.albums,
    since: currentState.since,
  });
}

async function postBoard(body: string, options?: { keepalive?: boolean }) {
  const useKeepalive =
    Boolean(options?.keepalive) && body.length < KEEPALIVE_MAX_BYTES;

  try {
    const response = await fetch("/api/note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      ...(useKeepalive ? { keepalive: true } : {}),
      body,
    });
    return response.ok;
  } catch {
    if (!useKeepalive) return false;
    try {
      const response = await fetch("/api/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

async function saveBoardToServer(options?: {
  keepalive?: boolean;
}): Promise<boolean> {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }

  setPendingSync(true);

  if (activeSave) {
    queuedSave = true;
    return activeSave;
  }

  activeSave = (async () => {
    let lastOk = false;
    do {
      queuedSave = false;
      const seq = ++saveSeq;
      const body = buildBoardPayload();
      lastOk = await postBoard(body, options);
      if (lastOk && seq === saveSeq && !queuedSave) {
        setPendingSync(false);
      }
    } while (queuedSave);
    return lastOk;
  })().finally(() => {
    activeSave = null;
  });

  return activeSave;
}

function scheduleBoardSave() {
  setPendingSync(true);
  if (persistTimer !== null) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void saveBoardToServer();
  }, 300);
}

function flushBoardSave() {
  if (persistTimer === null) return;
  clearTimeout(persistTimer);
  persistTimer = null;
  void saveBoardToServer({ keepalive: true });
}

async function destroyCloudinaryAsset(
  publicId: string,
  resourceType: "image" | "video",
) {
  try {
    await fetch("/api/cloudinary-media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId, resourceType }),
    });
  } catch {
    // Deleted publicId is still persisted in DB so it stays hidden.
  }
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

    const load = async () => {
      const noteVersionAtStart = noteVersion.current;
      const mediaVersionAtStart = mediaVersion.current;

      try {
        const response = await fetch("/api/note", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data: unknown = response.ok ? await response.json() : null;

        if (
          noteVersionAtStart === noteVersion.current &&
          mediaVersionAtStart === mediaVersion.current &&
          data &&
          typeof data === "object"
        ) {
          const stored = data as {
            notes?: unknown;
            cover?: unknown;
            memories?: unknown;
            deletedCloudinaryPublicIds?: unknown;
            albums?: unknown;
            since?: unknown;
          };
          const notes = normalizeBoardNotes(stored.notes);
          const cover = normalizeMediaAsset(stored.cover);
          const serverMemories = Array.isArray(stored.memories)
            ? normalizeMemories(stored.memories)
            : null;
          const serverDeletedIds = normalizeDeletedIds(
            stored.deletedCloudinaryPublicIds,
          );
          const serverAlbums = Array.isArray(stored.albums)
            ? normalizeAlbums(stored.albums)
            : null;
          const serverSince =
            typeof stored.since === "string" && stored.since
              ? stored.since
              : undefined;
          const keepLocal = hasPendingSync();

          if (
            notes ||
            cover?.src ||
            serverMemories !== null ||
            serverDeletedIds !== null ||
            serverAlbums !== null ||
            serverSince
          ) {
            updateState((current) => {
              let next = current;

              if (!keepLocal) {
                if (notes) next = withBoardNotes(next, notes);
                if (cover?.src) next = { ...next, cover };
                if (serverAlbums) next = { ...next, albums: serverAlbums };
                if (serverSince) next = { ...next, since: serverSince };
                if (serverDeletedIds !== null) {
                  next = {
                    ...next,
                    deletedCloudinaryPublicIds: serverDeletedIds,
                  };
                }
                if (serverMemories !== null) {
                  const localById = new Map(
                    current.memories.map((memory) => [memory.id, memory]),
                  );
                  next = {
                    ...next,
                    memories: serverMemories.map((serverMemory) => {
                      const localMemory = localById.get(serverMemory.id);
                      if (
                        localMemory &&
                        isPlaceholderMemoryTitle(serverMemory) &&
                        !isPlaceholderMemoryTitle(localMemory)
                      ) {
                        return { ...serverMemory, title: localMemory.title };
                      }
                      return serverMemory;
                    }),
                  };
                }
              } else {
                const deletedSet = new Set([
                  ...current.deletedCloudinaryPublicIds,
                  ...(serverDeletedIds ?? []),
                ]);
                if (serverDeletedIds?.length) {
                  next = {
                    ...next,
                    deletedCloudinaryPublicIds: [...deletedSet],
                  };
                }
                if (serverMemories?.length) {
                  const localIds = new Set(
                    current.memories.map((memory) => memory.id),
                  );
                  const missingFromLocal = serverMemories.filter(
                    (memory) =>
                      !localIds.has(memory.id) &&
                      (!memory.media.publicId ||
                        !deletedSet.has(memory.media.publicId)),
                  );
                  if (missingFromLocal.length) {
                    next = {
                      ...next,
                      memories: [...current.memories, ...missingFromLocal],
                    };
                  }
                }
              }

              return next;
            });
          }
        }
      } catch {
        // Aborted or offline; keep the current local state.
      }

      if (hasPendingSync()) void saveBoardToServer();

      if (controller.signal.aborted) return;

      try {
        const response = await fetch("/api/cloudinary-media", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data: unknown = response.ok ? await response.json() : null;
        if (mediaVersionAtStart !== mediaVersion.current) return;
        if (!data || typeof data !== "object") return;

        const rawMedia = (data as { media?: unknown }).media;
        if (!Array.isArray(rawMedia)) return;

        const items = rawMedia
          .map(normalizeSyncedCloudinaryMedia)
          .filter((item): item is SyncedCloudinaryMedia => Boolean(item));
        if (!items.length) return;

        updateState((current) => mergeCloudinaryMedia(current, items));
      } catch {
        // Aborted or offline; keep the current local state.
      }
    };

    void load();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const flush = () => flushBoardSave();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushBoardSave();
    };

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flushBoardSave();
    };
  }, []);

  const addMemory = useCallback(async (memory: NewMemory) => {
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

    return saveBoardToServer();
  }, []);

  const updateMemory = useCallback(async (id: string, memory: NewMemory) => {
    mediaVersion.current += 1;

    updateState((current) => {
      const existing = current.memories.find((item) => item.id === id);
      const nextMemories = current.memories.map((item) =>
        item.id === id ? { ...item, ...memory } : item,
      );
      const next: ScrapbookState = {
        ...current,
        memories: nextMemories,
      };
      const replacedPublicId =
        existing?.media.source === "cloudinary" &&
        existing.media.publicId &&
        existing.media.publicId !== memory.media.publicId &&
        !isPublicIdStillReferenced(next, existing.media.publicId)
          ? existing.media.publicId
          : undefined;

      return replacedPublicId
        ? withCloudinaryDeleted(next, replacedPublicId)
        : next;
    });

    return saveBoardToServer();
  }, []);

  const archiveMemory = useCallback(async (id: string) => {
    mediaVersion.current += 1;
    const archivedAt = new Date().toISOString();

    updateState((current) => ({
      ...current,
      memories: current.memories.map((item) =>
        item.id === id ? { ...item, archivedAt } : item,
      ),
    }));

    return saveBoardToServer();
  }, []);

  const restoreMemory = useCallback(async (id: string) => {
    mediaVersion.current += 1;

    updateState((current) => ({
      ...current,
      memories: current.memories.map((item) =>
        item.id === id ? { ...item, archivedAt: undefined } : item,
      ),
    }));

    return saveBoardToServer();
  }, []);

  const deleteMemory = useCallback(async (id: string) => {
    mediaVersion.current += 1;
    const deleted = currentState.memories.find((item) => item.id === id);
    let shouldDestroyCloudinary = false;

    updateState((current) => {
      const target = current.memories.find((item) => item.id === id);
      const next: ScrapbookState = {
        ...current,
        memories: current.memories.filter((item) => item.id !== id),
      };

      if (
        target?.media.source === "cloudinary" &&
        target.media.publicId &&
        !isPublicIdStillReferenced(next, target.media.publicId)
      ) {
        shouldDestroyCloudinary = true;
        return withCloudinaryDeleted(next, target.media.publicId);
      }

      return next;
    });

    const saved = await saveBoardToServer();

    if (
      shouldDestroyCloudinary &&
      deleted?.media.source === "cloudinary" &&
      deleted.media.publicId
    ) {
      void destroyCloudinaryAsset(deleted.media.publicId, deleted.media.kind);
    }

    return saved;
  }, []);

  const addAlbum = useCallback((name: string) => {
    mediaVersion.current += 1;
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
    void saveBoardToServer();
    return created;
  }, []);

  const renameAlbum = useCallback((id: string, name: string) => {
    mediaVersion.current += 1;
    const trimmed = name.trim();
    if (!trimmed) return;
    updateState((current) => ({
      ...current,
      albums: current.albums.map((album) =>
        album.id === id ? { ...album, name: trimmed } : album,
      ),
    }));
    void saveBoardToServer();
  }, []);

  const deleteAlbum = useCallback((id: string) => {
    mediaVersion.current += 1;
    updateState((current) => ({
      ...current,
      albums: current.albums.filter((album) => album.id !== id),
      memories: current.memories.map((memory) =>
        memory.albumId === id ? { ...memory, albumId: undefined } : memory,
      ),
    }));
    void saveBoardToServer();
  }, []);

  const persistNoteBoard = useCallback(
    async (updater?: (state: ScrapbookState) => ScrapbookState) => {
      noteVersion.current += 1;
      if (updater) updateState(updater);
      return saveBoardToServer();
    },
    [],
  );

  const setCover = useCallback(
    (cover: MediaAsset) =>
      persistNoteBoard((current) => ({ ...current, cover })),
    [persistNoteBoard],
  );

  const persistBoardNotes = useCallback(
    (updater: (notes: BoardNote[]) => BoardNote[]) =>
      persistNoteBoard((current) =>
        withBoardNotes(current, updater(current.notes)),
      ),
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
        notes.map((note) => (note.id === id ? { ...note, ...draft, id } : note)),
      ),
    [persistBoardNotes],
  );

  const archiveBoardNote = useCallback(
    (id: string) => {
      const archivedAt = new Date().toISOString();
      return persistBoardNotes((notes) =>
        notes.map((note) => (note.id === id ? { ...note, archivedAt } : note)),
      );
    },
    [persistBoardNotes],
  );

  const restoreBoardNote = useCallback(
    (id: string) =>
      persistBoardNotes((notes) =>
        notes.map((note) =>
          note.id === id ? { ...note, archivedAt: undefined } : note,
        ),
      ),
    [persistBoardNotes],
  );

  const deleteBoardNote = useCallback(
    (id: string) =>
      persistBoardNotes((notes) => notes.filter((note) => note.id !== id)),
    [persistBoardNotes],
  );

  const setSince = useCallback((since: string) => {
    noteVersion.current += 1;
    updateState((current) => ({ ...current, since }));
    scheduleBoardSave();
  }, []);

  const value = useMemo<ScrapbookContextValue>(
    () => ({
      state,
      addMemory,
      updateMemory,
      archiveMemory,
      restoreMemory,
      deleteMemory,
      addAlbum,
      renameAlbum,
      deleteAlbum,
      setCover,
      addBoardNote,
      updateBoardNote,
      archiveBoardNote,
      restoreBoardNote,
      deleteBoardNote,
      setSince,
    }),
    [
      state,
      addMemory,
      updateMemory,
      archiveMemory,
      restoreMemory,
      deleteMemory,
      addAlbum,
      renameAlbum,
      deleteAlbum,
      setCover,
      addBoardNote,
      updateBoardNote,
      archiveBoardNote,
      restoreBoardNote,
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
