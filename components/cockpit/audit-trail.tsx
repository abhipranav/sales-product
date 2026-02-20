import type { AuditEvent } from "@/lib/domain/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AuditTrailProps {
  events: AuditEvent[];
}

export function AuditTrail({ events }: AuditTrailProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-['Sora',sans-serif]">Execution Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {events.length === 0 ? (
            <li className=" bg-[hsl(var(--muted))] p-3 text-sm text-[hsl(var(--muted-foreground))]">No audit events yet.</li>
          ) : (
            events.map((event) => (
              <li key={event.id} className=" bg-[hsl(var(--muted))] p-3 text-sm text-[hsl(var(--muted-foreground))]">
                <p className="font-medium text-[hsl(var(--foreground))]">{event.action}</p>
                <p>{event.details}</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  {event.actor} · {new Date(event.happenedAt).toLocaleString()}
                </p>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
