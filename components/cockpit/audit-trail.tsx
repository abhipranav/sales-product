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
            <li className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">No audit events yet.</li>
          ) : (
            events.map((event) => (
              <li key={event.id} className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">
                <p className="font-medium text-zinc-900">{event.action}</p>
                <p>{event.details}</p>
                <p className="mt-1 text-xs text-zinc-500">
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
