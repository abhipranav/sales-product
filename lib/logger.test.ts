import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "./logger";

describe("logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should log info messages via console.info", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logger.info("test message", { module: "test" });
    expect(spy).toHaveBeenCalled();
  });

  it("should log warn messages", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("test warning", { module: "test" });
    expect(spy).toHaveBeenCalled();
  });

  it("should log error messages with error details", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("test error");
    logger.error("test error message", { module: "test" }, error);
    expect(spy).toHaveBeenCalled();
  });

  it("should create child loggers with preset context", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const child = logger.child({ module: "child-test", route: "/test" });
    child.info("child message");
    expect(spy).toHaveBeenCalled();
  });

  it("should measure async operation duration with timed()", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const result = await logger.timed("timed op", { module: "test" }, async () => {
      return 42;
    });
    expect(result).toBe(42);
    expect(spy).toHaveBeenCalled();
  });

  it("should catch errors in timed() and re-throw", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      logger.timed("failing op", { module: "test" }, async () => {
        throw new Error("timed failure");
      })
    ).rejects.toThrow("timed failure");
  });

  it("should safely serialize non-Error objects", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("string error", { module: "test" }, "just a string");
    expect(spy).toHaveBeenCalled();
  });
});
