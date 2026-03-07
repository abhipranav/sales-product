import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SystemReadiness } from "@/lib/services/system-readiness";

function levelToBadge(level: "ready" | "needs-action" | "warning") {
  if (level === "ready") {
    return "success" as const;
  }

  if (level === "needs-action") {
    return "destructive" as const;
  }

  return "warning" as const;
}

interface SystemReadinessBannerProps {
  readiness: SystemReadiness;
}

export function SystemReadinessBanner({ readiness }: SystemReadinessBannerProps) {
  const blockers = readiness.checks.filter((check) => check.level !== "ready");
  const aiBadgeLabel =
    readiness.ai.source === "user"
      ? "AI: PERSONAL KEY"
      : readiness.ai.source === "system"
        ? "AI: SYSTEM KEY"
        : readiness.ai.systemKeyStatus === "pending-restart"
          ? "AI: RESTART REQUIRED"
          : "AI: UNAVAILABLE";
  const aiBadgeVariant =
    readiness.ai.hasApiKey
      ? "success"
      : readiness.ai.systemKeyStatus === "pending-restart"
        ? "warning"
        : "destructive";

  if (readiness.mode === "live" && blockers.length === 0) {
    return (
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">LIVE MODE</Badge>
            <Badge variant={aiBadgeVariant}>{aiBadgeLabel}</Badge>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Workspace is fully wired: {readiness.stats.deals} deals, {readiness.stats.accounts} accounts. {readiness.ai.statusNote}
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/setup">System Setup</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-[hsl(var(--warning))]">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={readiness.mode === "live" ? "warning" : "destructive"}>
                {readiness.mode === "live" ? "LIVE (ATTENTION)" : "DEMO MODE"}
              </Badge>
              <Badge variant={aiBadgeVariant}>{aiBadgeLabel}</Badge>
              <Badge variant="outline">{blockers.length} ACTIONS NEEDED</Badge>
            </div>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              {readiness.summary} {readiness.ai.statusNote}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="cta">
              <Link href="/setup">Open Setup Checklist</Link>
            </Button>
          </div>
        </div>

        {blockers.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {blockers.slice(0, 3).map((check) => (
              <li
                key={check.id}
                className="flex flex-wrap items-center gap-2 border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2"
              >
                <Badge variant={levelToBadge(check.level)}>{check.level.replace("-", " ")}</Badge>
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{check.label}</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">{check.detail}</span>
                {check.action?.command ? (
                  <code className="ml-auto border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-1 text-[10px]">
                    {check.action.command}
                  </code>
                ) : null}
                {check.action?.href ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={check.action.href}>{check.action.label}</a>
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
