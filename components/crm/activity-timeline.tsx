"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logActivityAction } from "@/app/actions/activities";

interface Activity {
  id: string;
  dealId?: string;
  type: string;
  summary: string;
  happenedAt: string | Date;
  dealName?: string;
  dealDisplayId?: string;
  accountId?: string;
  accountName?: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
  dealId: string;
  showDealContext?: boolean;
  showLogForm?: boolean;
}

const typeIcons: Record<string, string> = {
  call: "📞",
  email: "✉️",
  meeting: "📅",
  note: "📝",
};

const typeColors: Record<string, string> = {
  call: "hsl(210, 70%, 50%)",
  email: "hsl(280, 60%, 50%)",
  meeting: "hsl(45, 80%, 45%)",
  note: "hsl(var(--muted-foreground))",
};

export function ActivityTimeline({
  activities,
  dealId,
  showDealContext = false,
  showLogForm = true,
}: ActivityTimelineProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Activity Timeline</CardTitle>
        {showLogForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            {isFormOpen ? "Cancel" : "+ Log Activity"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Log Activity Form */}
        {isFormOpen && (
          <form
            className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 space-y-3"
            action={(formData) => {
              startTransition(async () => {
                await logActivityAction(formData);
                setIsFormOpen(false);
              });
            }}
          >
            <input type="hidden" name="dealId" value={dealId} />

            <div className="flex gap-2">
              <select
                name="type"
                defaultValue="note"
                className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
              >
                <option value="call">📞 Call</option>
                <option value="email">✉️ Email</option>
                <option value="meeting">📅 Meeting</option>
                <option value="note">📝 Note</option>
              </select>

              <input
                type="datetime-local"
                name="happenedAt"
                defaultValue={new Date().toISOString().slice(0, 16)}
                className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm flex-1"
              />
            </div>

            <textarea
              name="summary"
              required
              placeholder="What happened? Key takeaways, next steps..."
              rows={3}
              className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm placeholder:text-[hsl(var(--muted-foreground))] resize-none"
            />

            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Saving..." : "Log Activity"}
              </Button>
            </div>
          </form>
        )}

        {/* Timeline */}
        {activities.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-6">
            No activities yet. Log your first interaction above.
          </p>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-[hsl(var(--border))]" />

            <ul className="space-y-4">
              {activities.map((activity) => (
                <li key={activity.id} className="relative pl-10">
                  {/* Dot */}
                  <div
                    className="absolute left-[11px] top-3 h-[10px] w-[10px] rounded-full border-2 border-[hsl(var(--background))]"
                    style={{ backgroundColor: typeColors[activity.type] }}
                  />

                  <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-sm">{typeIcons[activity.type]}</span>
                      <Badge variant="secondary" className="capitalize text-xs">
                        {activity.type}
                      </Badge>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {new Date(activity.happenedAt).toLocaleString()}
                      </span>
                    </div>

                    {showDealContext && activity.dealName && (
                      <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] mb-1">
                        <Link
                          href={`/pipeline/${activity.dealDisplayId}` as "/pipeline"}
                          className="hover:text-[hsl(var(--primary))] hover:underline"
                        >
                          {activity.dealName}
                        </Link>
                        {activity.accountName && (
                          <>
                            <span>·</span>
                            <Link
                              href={`/accounts/${activity.accountId}` as "/accounts"}
                              className="hover:text-[hsl(var(--primary))] hover:underline"
                            >
                              {activity.accountName}
                            </Link>
                          </>
                        )}
                      </div>
                    )}

                    <p className="text-sm text-[hsl(var(--foreground))]">
                      {activity.summary}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
