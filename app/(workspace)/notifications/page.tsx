import { acknowledgeNotificationAction } from "@/app/actions/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { logger } from "@/lib/logger";
import { NotificationServiceUnavailableError, listSignalNotifications } from "@/lib/services/notifications";
import { getCachedWorkspaceSummary } from "@/lib/services/workspace-summary-cache";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import Link from "next/link";

export default async function NotificationsPage() {
  const actor = await getActorFromServerContext();
  const summary = await getCachedWorkspaceSummary(actor, "/notifications");
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
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">SIGNAL_INBOX // NOTIFICATIONS</p>
        <h2 className="font-serif text-3xl font-bold text-[hsl(var(--foreground))]">Buying-Signal Inbox</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Actionable signal alerts connected directly to active deal execution.</p>
      </header>

      <section className="mb-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">UNREAD_ALERTS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{unreadCount}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Signals awaiting acknowledgment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">HIGH_PRIORITY</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{highPriorityCount}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Needs same-day outbound response</p>
          </CardContent>
        </Card>
        <Card className="h-full transition-all duration-150 hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))] group">
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider group-hover:text-[hsl(var(--background))]">DEAL_CONTEXT</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
            <Link
              href={`/pipeline/${summary.deal.id}` as "/pipeline"}
              className="block font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--background))] hover:underline"
            >
              {summary.deal.name}
            </Link>
            <Link
              href={`/accounts/${summary.account.id}` as "/accounts"}
              className="block text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:underline"
            >
              {summary.account.name}
            </Link>
            <Badge variant="outline">{summary.deal.stage}</Badge>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="font-mono text-xs uppercase tracking-wider">SIGNAL_NOTIFICATIONS</CardTitle>
          <Link href="/intelligence" className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
            VIEW INTELLIGENCE →
          </Link>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No notifications yet. Signals will appear here as account momentum changes.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.map((notification) => (
                <li key={notification.id} className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-[hsl(var(--foreground))]">{notification.summary}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        {notification.dealId ? (
                          <Link
                            href={`/pipeline/${notification.dealId}` as "/pipeline"}
                            className="hover:text-[hsl(var(--foreground))] hover:underline"
                          >
                            {notification.dealName ?? "View Deal"}
                          </Link>
                        ) : (
                          <span>{notification.dealName ?? "Unmapped deal"}</span>
                        )}
                        {" · "}
                        <Link href="/intelligence" className="hover:text-[hsl(var(--foreground))] hover:underline">
                          {notification.signalType}
                        </Link>
                        {" · SCORE "}
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
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{notification.recommendedAction}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      {new Date(notification.happenedAt).toLocaleString()}
                      {notification.acknowledgedAt ? ` · ACK ${new Date(notification.acknowledgedAt).toLocaleString()}` : ""}
                    </p>
                    {notification.status === "unread" ? (
                      <form action={acknowledgeNotificationAction}>
                        <input type="hidden" name="notificationId" value={notification.id} />
                        <Button type="submit" size="sm" variant="outline">
                          ACKNOWLEDGE
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
