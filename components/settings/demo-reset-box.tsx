"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DemoResetBox() {
  const router = useRouter();
  const [isSeeding, setIsSeeding] = useState(false);

  async function handleReset() {
    if (isSeeding) return;

    const confirmReset = window.confirm(
      "WARNING: This will completely wipe all current CRM accounts, deals, contacts, activities, and tasks, and replace them with fresh, high-value demo dataset. Are you sure you want to proceed?"
    );

    if (!confirmReset) return;

    setIsSeeding(true);
    toast.loading("Wiping database and seeding high-value demo workspace...", {
      id: "demo-reset",
    });

    try {
      const res = await fetch("/api/setup/seed", {
        method: "POST",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to seed database.");
      }

      toast.success("Workspace database seeded successfully!", {
        id: "demo-reset",
      });

      // Force-refresh the active page to load seeded metrics
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to wipe and seed database.", {
        id: "demo-reset",
      });
    } finally {
      setIsSeeding(false);
    }
  }

  return (
    <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden rounded-lg">
      {/* Visual Hazard Caution Bar */}
      <div className="caution-stripe-thin" />
      
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider bg-yellow-400 text-black px-1.5 py-0.5 border border-black animate-pulse">
                DANGER_ZONE
              </span>
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[hsl(var(--muted-foreground))]">
                SYS_DATABASE_RESET
              </span>
            </div>
            <h3 className="mt-2 font-serif text-lg font-bold text-[hsl(var(--foreground))] uppercase tracking-tight">
              One-Click Demo Workspace Reset
            </h3>
            <p className="mt-1 max-w-xl text-xs text-[hsl(var(--muted-foreground))] leading-normal font-mono">
              [ ACTION // RESTORE_SYSTEM_SEED_STATE ]
              <br />
              Wipes all current records in your local database and seeds realistic accounts (Aurora Logistics, TechVenture Labs, Bloom Dynamics), buyer signals, and email sequences.
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <Button
              type="button"
              variant="destructive"
              disabled={isSeeding}
              onClick={handleReset}
              className="w-full font-mono text-[11px] font-bold uppercase tracking-wider border-[2px] border-black bg-red-600 text-white hover:bg-red-700"
            >
              {isSeeding ? "SEEDING_DATABASE..." : "WIPE & SEED WORKSPACE"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
