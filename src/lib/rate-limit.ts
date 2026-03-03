type Bucket = {
  count: number;
  resetAt: number;
};

type Store = Map<string, Bucket>;

declare global {
  var __rateLimitStore: Store | undefined;
}

import { incrementWithWindow } from "@/lib/security-store";

function getStore(): Store {
  if (!global.__rateLimitStore) {
    global.__rateLimitStore = new Map<string, Bucket>();
  }
  return global.__rateLimitStore;
}

function rateLimitLocal(options: {
  key: string;
  limit: number;
  windowMs: number;
}): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const { key, limit, windowMs } = options;
  const store = getStore();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, limit - 1), retryAfterMs: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, entry.resetAt - now),
    };
  }

  entry.count += 1;
  store.set(key, entry);
  return {
    allowed: true,
    remaining: Math.max(0, limit - entry.count),
    retryAfterMs: 0,
  };
}

export async function rateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  const { key, limit, windowMs } = options;

  const distributed = await incrementWithWindow(key, windowMs);
  if (distributed) {
    const count = distributed.count;
    const retryAfterMs = Math.max(0, distributed.ttlMs);

    if (count > limit) {
      return { allowed: false, remaining: 0, retryAfterMs };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - count),
      retryAfterMs: 0,
    };
  }

  return rateLimitLocal(options);
}
