type ReplayStore = Map<string, number>;
import { setIfNotExistsWithTtl } from "@/lib/security-store";

declare global {
  var __replayStore: ReplayStore | undefined;
}

function getStore(): ReplayStore {
  if (!global.__replayStore) {
    global.__replayStore = new Map<string, number>();
  }
  return global.__replayStore;
}

function cleanupExpired(store: ReplayStore, now: number) {
  for (const [key, expiresAt] of store.entries()) {
    if (expiresAt <= now) {
      store.delete(key);
    }
  }
}

function isReplayRequestLocal(key: string, ttlMs: number): boolean {
  const now = Date.now();
  const store = getStore();
  cleanupExpired(store, now);

  const existing = store.get(key);
  if (existing && existing > now) {
    return true;
  }

  store.set(key, now + ttlMs);
  return false;
}

export async function isReplayRequest(key: string, ttlMs: number): Promise<boolean> {
  const distributed = await setIfNotExistsWithTtl(key, ttlMs);
  if (distributed !== null) {
    return !distributed;
  }

  return isReplayRequestLocal(key, ttlMs);
}
