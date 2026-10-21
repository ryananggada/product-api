const store = new Map<string, { value: unknown; expires: number }>();

export const cache = {
  get<T>(key: string): T | undefined {
    const hit = store.get(key);
    if (!hit) return;
    if (hit.expires < Date.now()) {
      store.delete(key);
      return;
    }
    return hit.value as T;
  },
  set(key: string, value: unknown, ttlMs = 30_000) {
    store.set(key, { value, expires: Date.now() + ttlMs });
  },
  clear() {
    store.clear();
  },
};
