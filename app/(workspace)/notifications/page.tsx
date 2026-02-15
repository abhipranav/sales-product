import { acknowledgeNotificationAction } from "@/app/actions/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { getCachedDashboardData } from "@/lib/services/dashboard-cache";
import { logger } from "@/lib/logger";
import { NotificationServiceUnavailableError, listSignalNotifications } from "@/lib/services/notifications";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import Link from "next/link";

export default async function NotificationsPage() {
  const actor = await getActorFromServerContext();
  const data = await getCachedDashboardData(actor, "/notifications");
  let notifications: Awaited<ReturnType<typeof listSignalNotifications>> = [];

  try {
    notifications = await listSignalNotifications(40, actor);
  } catch (error) {
    if (error instanceof NotificationServiceUnavailableError || error instanceof WorkspaceAccessDeniedError) {
      logger.warn("Notifications load skipped", { module: "notifications", route: "/notifications" }, error);
      notifications = [];
    } else {
      logger.error("Failed to load notifications", { module: "notifications", route: "/notifications" }, error);
      notifications = [];
    }
  }

  const unreadCount = notifications.filter((notification) => notification.status === "unread").length;
  const highPriorityCount = notifications.filter((notification) => notification.priority === "high").length;

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Notifications</p>
        <h2 className="font-['Sora',sans-serif] text-3xl font-bold text-zinc-900">Buying-Signal Inbox</h2>
        <p className="mt-1 text-sm text-zinc-700">Actionable signal alerts connected directly to active deal execution.</p>
      </header>

      <section className="mb-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unread Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-900">{unreadCount}</p>
            <p className="text-sm text-zinc-600">Signals awaiting acknowledgment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-900">{highPriorityCount}</p>
            <p className="text-sm text-zinc-600">Needs same-day outbound response</p>
          </CardContent>
        </Card>
        <Link href={`/pipeline/${data.deal.id}` as "/pipeline"} className="block">
          <Card className="h-full transition-colors hover:border-[hsl(var(--primary)/0.3)] cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">Current Deal Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-700">
              <p className="font-semibold text-[hsl(var(--primary))]">{data.deal.name}</p>
              <Link
                href={`/accounts/${data.account.id}` as "/accounts"}
                className="block text-zinc-700 hover:text-[hsl(var(--primary))] hover:underline"
              >
                {data.account.name}
              </Link>
              <Badge variant="outline">{data.deal.stage}</Badge>
            </CardContent>
          </Card>
        </Link>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Signal Notifications</CardTitle>
          <Link href="/intelligence" className="text-xs text-[hsl(var(--primary))] hover:underline">
            View Intelligence →
          </Link>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-sm text-zinc-600">No notifications yet. Signals will appear here as account momentum changes.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.map((notification) => (
                <li key={notification.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{notification.summary}</p>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        {notification.dealId ? (
                          <Link
                            href={`/pipeline/${notification.dealId}` as "/pipeline"}
                            className="text-[hsl(var(--primary))] hover:underline"
                          >
                            {notification.dealName ?? "View Deal"}
                          </Link>
                        ) : (
                          <span>{notification.dealName ?? "Unmapped deal"}</span>
                        )}
                        {" · "}
                        <Link href="/intelligence" className="hover:text-[hsl(var(--primary))] hover:underline">
                          {notification.signalType}
                        </Link>
                        {" · score "}
                        {notification.score}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          notification.priority === "high"
                            ? "destructive"
                            : notification.priority === "medium"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {notification.priority}
                      </Badge>
                      <Badge variant={notification.status === "acknowledged" ? "success" : "outline"}>{notification.status}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{notification.recommendedAction}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-zinc-500">
                      {new Date(notification.happenedAt).toLocaleString()}
                      {notification.acknowledgedAt ? ` · acknowledged ${new Date(notification.acknowledgedAt).toLocaleString()}` : ""}
                    </p>
                    {notification.status === "unread" ? (
                      <form action={acknowledgeNotificationAction}>
                        <input type="hidden" name="notificationId" value={notification.id} />
                        <Button type="submit" size="sm" variant="outline">
                          Acknowledge
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
