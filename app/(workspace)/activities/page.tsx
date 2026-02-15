import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { getCachedDashboardData } from "@/lib/services/dashboard-cache";
import { listRecentActivities, ActivityServiceUnavailableError } from "@/lib/services/activities";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { logger } from "@/lib/logger";

type ActivityRow = Awaited<ReturnType<typeof listRecentActivities>>[number];

export default async function ActivityFeedPage() {
  const actor = await getActorFromServerContext();
  const data = await getCachedDashboardData(actor, "/activities");

  let activities: ActivityRow[] = [];
  try {
    activities = await listRecentActivities(50, actor);
  } catch (error) {
    if (error instanceof ActivityServiceUnavailableError || error instanceof WorkspaceAccessDeniedError) {
      logger.warn("Activity feed load skipped", { module: "activities", route: "/activities" }, error);
    } else {
      logger.error("Failed to load activity feed", { module: "activities", route: "/activities" }, error);
    }
  }

  const typeIcons: Record<string, string> = {
    call: "📞",
    email: "✉️",
    meeting: "📅",
    note: "📝",
  };

  const typeCounts = activities.reduce(
    (acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Activity Feed</p>
        <h2 className="font-['Sora',sans-serif] text-3xl font-bold text-zinc-900">All Activities</h2>
        <p className="mt-1 text-sm text-zinc-700">
          Unified timeline across all deals.{" · "}
          <Link
            href={`/pipeline/${data.deal.id}` as "/pipeline"}
            className="text-[hsl(var(--primary))] hover:underline"
          >
            {data.deal.name}
          </Link>
          {" · "}
          <Link
            href={`/accounts/${data.account.id}` as "/accounts"}
            className="text-[hsl(var(--primary))] hover:underline"
          >
            {data.account.name}
          </Link>
        </p>
      </header>

      {/* Summary Cards */}
      <section className="mb-6 grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{activities.length}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Activities</p>
          </CardContent>
        </Card>
        {(["call", "email", "meeting", "note"] as const).map((type) => (
          <Card key={type}>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {typeIcons[type]} {typeCounts[type] || 0}
              </p>
              <p className="text-xs capitalize text-[hsl(var(--muted-foreground))]">{type}s</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">
              No activities yet. Log your first interaction from a{" "}
              <Link href="/pipeline" className="text-[hsl(var(--primary))] hover:underline">
                deal detail page
              </Link>.
            </p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-[hsl(var(--border))]" />

              <ul className="space-y-4">
                {activities.map((activity) => (
                  <li key={activity.id} className="relative pl-10">
                    <div
                      className="absolute left-[11px] top-3 h-[10px] w-[10px] rounded-full border-2 border-[hsl(var(--background))]"
                      style={{
                        backgroundColor:
                          activity.type === "call"
                            ? "hsl(210, 70%, 50%)"
                            : activity.type === "email"
                            ? "hsl(280, 60%, 50%)"
                            : activity.type === "meeting"
                            ? "hsl(45, 80%, 45%)"
                            : "hsl(var(--muted-foreground))",
                      }}
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

                      <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] mb-1">
                        <Link
                          href={`/pipeline/${activity.dealDisplayId}` as "/pipeline"}
                          className="hover:text-[hsl(var(--primary))] hover:underline"
                        >
                          {activity.dealName}
                        </Link>
                        <span>·</span>
                        <Link
                          href={`/accounts/${activity.accountId}` as "/accounts"}
                          className="hover:text-[hsl(var(--primary))] hover:underline"
                        >
                          {activity.accountName}
                        </Link>
                      </div>

                      <p className="text-sm text-[hsl(var(--foreground))]">{activity.summary}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
