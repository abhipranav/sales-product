"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="w-full border-[2px] border-[hsl(var(--border))] bg-transparent px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]"
      >
        THEME
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-full border-[2px] border-[hsl(var(--border))] bg-transparent px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] transition-all duration-150 hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))]"
    >
      {isDark ? "◐ LIGHT_MODE" : "◑ DARK_MODE"}
    </button>
  );
}
