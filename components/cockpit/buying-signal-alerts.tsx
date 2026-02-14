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
            <li key={alert.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{alert.summary}</p>
                <Badge variant={alert.priority === "high" ? "destructive" : alert.priority === "medium" ? "warning" : "secondary"}>
                  {alert.priority}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{alert.detail}</p>
              <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">{alert.recommendedAction}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
