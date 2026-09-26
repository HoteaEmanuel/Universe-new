// Simple in-process TTL cache for hot read paths (feed pages, public
// profiles). Deliberately not Redis: single-process, lost on restart, and
// each app instance would have its own copy - fine for now, but reconsider
// if the app ever runs as more than one instance.
//
// Most callers don't bother invalidating - a write (new post, profile edit)
// just isn't reflected in cached reads until the entry expires. `invalidate`
// exists for the cases where that staleness window is actually unacceptable
// (e.g. a blocked user's content should disappear immediately, not in ~5min).
const DEFAULT_TTL_MS = 3 * 60 * 1000;

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

// Methods are generic per-call rather than the class being generic, so one
// cache instance can hold differently-shaped values (e.g. feedCache holds
// the Global/Following/University feed pages, which all happen to share a
// shape, but nothing here requires that).
export class MemoryCache {
  private store = new Map<string, CacheEntry>();

  constructor(private readonly ttlMs = DEFAULT_TTL_MS) {
    const sweep = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (entry.expiresAt < now) this.store.delete(key);
      }
    }, this.ttlMs);
    sweep.unref();
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  async getOrSet<T>(key: string, fetch: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;
    const value = await fetch();
    this.set(key, value);
    return value;
  }

  invalidate(key: string) {
    this.store.delete(key);
  }
}
