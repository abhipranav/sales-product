"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AIStatusData {
  hasApiKey: boolean;
  model: string;
  source: "user" | "system" | "none";
  dailyUsage: {
    selectedModelTokens: number;
    selectedModelDailyLimit: number | null;
    selectedModelPercentUsed: number | null;
  };
}

function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(0)}K`;
  }
  return String(tokens);
}

export function AIStatusIndicator() {
  const [data, setData] = useState<AIStatusData | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/settings/user/ai");
        if (response.ok) {
          setData(await response.json());
        }
      } catch {
        // Silently fail — AI status is non-critical
      }
    }
    load();
  }, []);

  if (!data) {
    return null;
  }

  const isActive = data.hasApiKey;
  const percentUsed = data.dailyUsage.selectedModelPercentUsed ?? 0;

  return (
    <Link
      href="/settings"
      className="block border-[2px] border-[hsl(var(--border))] px-3 py-2 transition-all duration-150 hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))] group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs" aria-hidden>✨</span>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--background))]">
            AI
          </span>
        </div>
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            isActive ? "bg-[hsl(var(--success))]" : "bg-[hsl(var(--destructive))]"
          }`}
          title={isActive ? "AI Active" : "No API Key"}
        />
      </div>

      {isActive && (
        <div className="mt-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[8px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]">
              {data.model}
            </span>
            <span className="font-mono text-[8px] text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]">
              {formatTokenCount(data.dailyUsage.selectedModelTokens)}
            </span>
          </div>
          {data.dailyUsage.selectedModelDailyLimit !== null && (
            <div className="mt-1 h-[3px] w-full bg-[hsl(var(--muted))] group-hover:bg-[hsl(var(--background))]/20 overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, percentUsed)}%`,
                  background: percentUsed > 80 ? "hsl(var(--destructive))" : "hsl(var(--accent))"
                }}
              />
            </div>
          )}
        </div>
      )}

      {!isActive && (
        <p className="mt-1 font-mono text-[8px] text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]">
          Add key in Settings
        </p>
      )}
    </Link>
  );
}
