import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Deal, Signal } from "@/lib/domain/types";
import { buildBuyingSignalAlerts } from "@/lib/services/capabilities";

interface BuyingSignalAlertsProps {
  deal: Deal;
  signals: Signal[];
}

export function BuyingSignalAlerts({ deal, signals }: BuyingSignalAlertsProps) {
  const alerts = buildBuyingSignalAlerts(signals, deal);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-['Sora',sans-serif]">Buying-Signal Alerts</CardTitle>
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
