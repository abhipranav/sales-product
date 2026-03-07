import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type RuntimeSecretState = "active" | "pending-restart" | "missing";

export interface RuntimeSecretStatus {
  state: RuntimeSecretState;
  filePath: string | null;
}

const ENV_FILE_ORDER = [".env.local", ".env"];
const RUNTIME_SECRET_CACHE_TTL_MS = 5_000;

const runtimeSecretCache = new Map<string, { expiresAt: number; value: RuntimeSecretStatus }>();

function normalizeEnvValue(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseEnvAssignment(content: string, key: string): string | null {
  const pattern = new RegExp(`^\\s*(?:export\\s+)?${key.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*=\\s*(.*)\\s*$`, "m");
  const match = content.match(pattern);
  if (!match) {
    return null;
  }

  const rawValue = match[1]?.trim() ?? "";
  if (!rawValue || rawValue.startsWith("#")) {
    return null;
  }

  const unquoted =
    (rawValue.startsWith('"') && rawValue.endsWith('"')) || (rawValue.startsWith("'") && rawValue.endsWith("'"))
      ? rawValue.slice(1, -1)
      : rawValue;

  return normalizeEnvValue(unquoted);
}

function getEnvFileStatus(key: string): RuntimeSecretStatus {
  const cwd = process.cwd();

  for (const fileName of ENV_FILE_ORDER) {
    const filePath = path.join(cwd, fileName);
    if (!existsSync(filePath)) {
      continue;
    }

    try {
      const content = readFileSync(filePath, "utf8");
      if (parseEnvAssignment(content, key)) {
        return {
          state: "pending-restart",
          filePath
        };
      }
    } catch {
      // Ignore env-file read issues and fall through to "missing".
    }
  }

  return {
    state: "missing",
    filePath: null
  };
}

export function getRuntimeSecretStatus(key: string): RuntimeSecretStatus {
  const normalizedLoadedValue = normalizeEnvValue(process.env[key]);
  if (normalizedLoadedValue) {
    return {
      state: "active",
      filePath: null
    };
  }

  const now = Date.now();
  const cached = runtimeSecretCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const nextValue = getEnvFileStatus(key);
  runtimeSecretCache.set(key, {
    value: nextValue,
    expiresAt: now + RUNTIME_SECRET_CACHE_TTL_MS
  });

  return nextValue;
}
