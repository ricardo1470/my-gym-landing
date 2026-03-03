type RedisPipelineResult = Array<{ result?: unknown; error?: string } | unknown>;

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return { url, token, enabled: Boolean(url && token) };
}

async function runPipeline(commands: unknown[][]): Promise<unknown[] | null> {
  const cfg = getRedisConfig();
  if (!cfg.enabled || !cfg.url || !cfg.token) return null;

  try {
    const response = await fetch(`${cfg.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      console.error("Redis pipeline failed with status:", response.status);
      return null;
    }

    const data = (await response.json()) as { result?: RedisPipelineResult } | RedisPipelineResult;
    const rawResults = Array.isArray(data) ? data : data.result;
    if (!Array.isArray(rawResults)) return null;

    return rawResults.map((item) => {
      if (typeof item === "object" && item !== null && "result" in item) {
        const maybe = item as { result?: unknown };
        return maybe.result;
      }
      return item;
    });
  } catch (error) {
    console.error("Redis pipeline error:", error);
    return null;
  }
}

export async function incrementWithWindow(
  key: string,
  windowMs: number
): Promise<{ count: number; ttlMs: number } | null> {
  const redisKey = `sec:rl:${key}`;
  const results = await runPipeline([
    ["INCR", redisKey],
    ["PTTL", redisKey],
    ["PEXPIRE", redisKey, String(windowMs), "NX"],
    ["PTTL", redisKey],
  ]);

  if (!results || results.length < 4) return null;

  const count = Number(results[0]);
  const pttlBefore = Number(results[1]);
  const pttlAfter = Number(results[3]);
  const ttlMs =
    Number.isFinite(pttlAfter) && pttlAfter > 0
      ? pttlAfter
      : Number.isFinite(pttlBefore) && pttlBefore > 0
        ? pttlBefore
        : windowMs;

  if (!Number.isFinite(count) || count <= 0) return null;
  return { count, ttlMs };
}

export async function setIfNotExistsWithTtl(key: string, ttlMs: number): Promise<boolean | null> {
  const redisKey = `sec:rp:${key}`;
  const results = await runPipeline([["SET", redisKey, "1", "PX", String(ttlMs), "NX"]]);
  if (!results || results.length < 1) return null;

  // Redis SET NX returns "OK" when inserted, null when key already exists.
  return results[0] === "OK";
}
