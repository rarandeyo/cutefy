import type { TrackWithAddedAt } from "./spotify";

const CACHE_KEY = "spotify-tracks";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24時間

type CacheData = {
  tracks: TrackWithAddedAt[];
  cachedAt: number;
};

let listeners: (() => void)[] = [];
let cachedResult: TrackWithAddedAt[] | null = null;
let cachedRaw: string | null = null;

function emitChange() {
  cachedResult = null;
  cachedRaw = null;
  for (const listener of listeners) {
    listener();
  }
}

function parseCache(raw: string): TrackWithAddedAt[] | null {
  const data: CacheData = JSON.parse(raw);
  if (Date.now() - data.cachedAt > CACHE_TTL) return null;
  return data.tracks.map((track) => ({
    ...track,
    addedAt: new Date(track.addedAt),
  }));
}

export const trackCache = {
  subscribe(listener: () => void) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  getSnapshot(): TrackWithAddedAt[] | null {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    if (raw === cachedRaw) return cachedResult;
    cachedRaw = raw;
    cachedResult = parseCache(raw);
    return cachedResult;
  },

  getServerSnapshot(): null {
    return null;
  },

  set(tracks: TrackWithAddedAt[]) {
    const data: CacheData = { tracks, cachedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    emitChange();
  },

  clear() {
    localStorage.removeItem(CACHE_KEY);
    emitChange();
  },
};
