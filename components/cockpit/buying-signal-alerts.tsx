"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Deal, Signal } from "@/lib/domain/types";
import { buildBuyingSignalAlerts } from "@/lib/services/capabilities";

interface BuyingSignalAlertsProps {
  deal: Deal;
  signals: Signal[];
}

export function BuyingSignalAlerts({ deal, signals }: BuyingSignalAlertsProps) {
  const alerts = buildBuyingSignalAlerts(signals, deal);
  const router = useRouter();
  const [isSimulating, setIsSimulating] = useState(false);

  async function handleSimulate() {
    if (isSimulating) return;
    setIsSimulating(true);
    toast.loading("Simulating new high-impact buying signal...", { id: "sim-signal" });

    try {
      const res = await fetch("/api/setup/simulate-signal", {
        method: "POST"
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to simulate signal.");
      }

      toast.success(`[SIGNAL_INJECTED] ${data.signal.summary}`, { id: "sim-signal" });
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to simulate buying signal.", { id: "sim-signal" });
    } finally {
      setIsSimulating(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="font-['Sora',sans-serif]">Buying-Signal Alerts</CardTitle>
        <Button
          type="button"
          size="sm"
          variant="cta"
          disabled={isSimulating}
          onClick={handleSimulate}
          className="font-mono text-[9px] font-bold"
        >
          {isSimulating ? "SIMULATING..." : "[ SIMULATE SIGNAL ]"}
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {alerts.map((alert) => (
            <li key={alert.id} className=" border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--foreground))]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-[hsl(var(--foreground))] dark:text-[hsl(var(--foreground))]">{alert.summary}</p>
                <Badge variant={alert.priority === "high" ? "destructive" : alert.priority === "medium" ? "warning" : "secondary"}>
                  {alert.priority}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] dark:text-[hsl(var(--muted-foreground))]">{alert.detail}</p>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] dark:text-[hsl(var(--muted-foreground))]">{alert.recommendedAction}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
