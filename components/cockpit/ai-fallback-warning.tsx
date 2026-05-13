"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SystemReadiness {
  ai: {
    hasApiKey: boolean;
  };
}

export function AiFallbackWarning() {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    async function loadStatus() {
      try {
        const response = await fetch("/api/system/status");
        if (response.ok) {
          const data: SystemReadiness = await response.json();
          if (active) {
            setHasApiKey(data.ai.hasApiKey);
          }
        } else {
          if (active) setHasApiKey(false);
        }
      } catch {
        if (active) setHasApiKey(false);
      }
    }
    loadStatus();
    return () => {
      active = false;
    };
  }, []);

  if (hasApiKey !== false) {
    return null;
  }

  return (
    <div className="border-[2px] border-[var(--ind-yellow)] bg-[hsl(var(--card))] overflow-hidden rounded-lg my-4">
      {/* Visual Hazard Caution Bar */}
      <div className="caution-stripe-thin" />
      
      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider bg-[var(--ind-yellow)] text-[var(--ind-black)] px-1.5 py-0.5 border border-[var(--ind-black)] animate-pulse">
              AI_FALLBACK
            </span>
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[hsl(var(--muted-foreground))]">
              RULE_BASED_TEMPLATES_ACTIVE
            </span>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono leading-normal">
            OpenAI credentials are not configured. The workspace is defaulting to deterministic rule-based templates for follow-up and meeting prep generations.
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button asChild variant="cta" size="sm" className="font-bold">
            <Link href="/settings">
              [ CONFIGURE OPENAI KEY ]
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
