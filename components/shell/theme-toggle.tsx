"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const label = mounted
    ? isDark
      ? "◐ LIGHT_MODE"
      : "◑ DARK_MODE"
    : "THEME";

  return (
    <button
      type="button"
      aria-label={mounted ? "Toggle theme" : undefined}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-full border-[2px] border-[hsl(var(--border))] bg-transparent px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] transition-all duration-150 hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))]"
    >
      {label}
    </button>
  );
}
