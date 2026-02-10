/**
 * Structured Logger
 *
 * Best practices:
 *  - JSON-structured output for machine parsing in production
 *  - Consistent severity levels: debug, info, warn, error
 *  - Contextual metadata (module, action, duration, entity IDs)
 *  - Safe serialization of errors
 *  - Environment-aware: pretty in dev, JSON in prod
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  module?: string;
  action?: string;
  durationMs?: number;
  dealId?: string;
  accountId?: string;
  contactId?: string;
  userId?: string;
  route?: string;
  [key: string]: unknown;
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      ...(error as Error & { digest?: string }).digest
        ? { digest: (error as Error & { digest?: string }).digest }
        : {},
    };
  }
  return { raw: String(error) };
}

function formatLog(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
  const timestamp = new Date().toISOString();
  const entry: Record<string, unknown> = {
    timestamp,
    level,
    message,
    ...context,
  };
  if (error) {
    entry.error = serializeError(error);
  }
  return entry;
}

const isDev = process.env.NODE_ENV === "development";

function emit(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
  const entry = formatLog(level, message, context, error);

  if (isDev) {
    const prefix = {
      debug: "\x1b[36m[DEBUG]\x1b[0m",
      info: "\x1b[32m[INFO]\x1b[0m",
      warn: "\x1b[33m[WARN]\x1b[0m",
      error: "\x1b[31m[ERROR]\x1b[0m",
    }[level];

    const meta = context
      ? ` ${Object.entries(context)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
          .join(" ")}`
      : "";

    const errorStr = error ? ` | ${serializeError(error).message}` : "";

    // eslint-disable-next-line no-console
    console[level === "debug" ? "log" : level](`${prefix} ${message}${meta}${errorStr}`);
  } else {
    const method = level === "debug" ? "log" : level;
    // eslint-disable-next-line no-console
    console[method](JSON.stringify(entry));
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit("debug", message, context),
  info: (message: string, context?: LogContext) => emit("info", message, context),
  warn: (message: string, context?: LogContext, error?: unknown) => emit("warn", message, context, error),
  error: (message: string, context?: LogContext, error?: unknown) => emit("error", message, context, error),

  /** Create a child logger with preset context */
  child: (defaultContext: LogContext) => ({
    debug: (message: string, context?: LogContext) => emit("debug", message, { ...defaultContext, ...context }),
    info: (message: string, context?: LogContext) => emit("info", message, { ...defaultContext, ...context }),
    warn: (message: string, context?: LogContext, error?: unknown) => emit("warn", message, { ...defaultContext, ...context }, error),
    error: (message: string, context?: LogContext, error?: unknown) => emit("error", message, { ...defaultContext, ...context }, error),
  }),

  /** Measure async operation duration */
  async timed<T>(message: string, context: LogContext, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      emit("info", message, { ...context, durationMs: Math.round(performance.now() - start) });
      return result;
    } catch (error) {
      emit("error", message, { ...context, durationMs: Math.round(performance.now() - start) }, error);
      throw error;
    }
  },
};
