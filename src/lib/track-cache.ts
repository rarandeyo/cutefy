import { z } from "zod";
import type { TrackWithAddedAt } from "./spotify";

const CACHE_KEY = "spotify-tracks";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24時間

const cacheDataSchema = z.object({
  tracks: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      uri: z.string(),
      artists: z.string(),
      albumName: z.string(),
      albumImageUrl: z.string().or(z.undefined()),
      addedAt: z.coerce.date(),
    }),
  ),
  cachedAt: z.number(),
});

let listeners: (() => void)[] = [];
let cachedResult: TrackWithAddedAt[] | null = null;
let cachedRaw: string | null = null;

const emitChange = () => {
  cachedResult = null;
  cachedRaw = null;
  for (const listener of listeners) {
    listener();
  }
};

const parseCache = (raw: string): TrackWithAddedAt[] | null => {
  try {
    const parsed = cacheDataSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    if (Date.now() - parsed.data.cachedAt > CACHE_TTL) return null;
    return parsed.data.tracks;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

export const trackCache = {
  subscribe: (listener: () => void) => {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  getSnapshot: (): TrackWithAddedAt[] | null => {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    if (raw === cachedRaw) return cachedResult;
    cachedRaw = raw;
    cachedResult = parseCache(raw);
    return cachedResult;
  },

  getServerSnapshot: (): null => null,

  set: (tracks: TrackWithAddedAt[]) => {
    const data = { tracks, cachedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    emitChange();
  },

  clear: () => {
    localStorage.removeItem(CACHE_KEY);
    emitChange();
  },
};
