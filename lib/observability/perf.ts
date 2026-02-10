type TimingMeta = Record<string, string | number | boolean | undefined>;

function isPerfLoggingEnabled() {
  return process.env.APP_PERF_LOGS === "1" || process.env.NODE_ENV === "development";
}

function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function formatMeta(meta?: TimingMeta) {
  if (!meta) {
    return "";
  }

  const chunks = Object.entries(meta)
    .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
    .map(([key, value]) => `${key}=${value}`);

  return chunks.length > 0 ? ` ${chunks.join(" ")}` : "";
}

export function logRouteTiming(route: string, phase: string, durationMs: number, meta?: TimingMeta) {
  if (!isPerfLoggingEnabled()) {
    return;
  }

  console.info(`[perf] route=${route} phase=${phase} duration_ms=${durationMs.toFixed(1)}${formatMeta(meta)}`);
}

export async function measureRoutePhase<T>(route: string, phase: string, fn: () => Promise<T>, meta?: TimingMeta): Promise<T> {
  const startedAt = nowMs();

  try {
    return await fn();
  } finally {
    logRouteTiming(route, phase, nowMs() - startedAt, meta);
  }
}
