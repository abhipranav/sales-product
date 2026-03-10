import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { getSystemReadiness, type ReadinessCheck } from "@/lib/services/system-readiness";

function levelToVariant(level: ReadinessCheck["level"]) {
  if (level === "ready") {
    return "success" as const;
  }

  if (level === "needs-action") {
    return "destructive" as const;
  }

  return "warning" as const;
}

export default async function SetupPage() {
  const actor = await getActorFromServerContext();
  const readiness = await getSystemReadiness(actor);
  const pending = readiness.checks.filter((check) => check.level !== "ready").length;

  const bootstrapCommands = [
    "npm install",
    "npm run db:generate",
    "npm run db:push",
    "npm run db:seed",
    "npm run dev"
  ];

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="mb-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
          SETUP // LIVE READINESS
        </p>
        <h2 className="font-serif text-3xl font-bold text-[hsl(var(--foreground))]">Production Activation Checklist</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Move from demo-safe UI to fully working workflows with explicit infrastructure checks.
        </p>
      </header>

      <section className="mb-4 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">CURRENT_MODE</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={readiness.mode === "live" ? "success" : "destructive"}>{readiness.mode}</Badge>
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{readiness.summary}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">PENDING_ITEMS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{pending}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Checks not fully ready.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">LIVE_RECORDS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{readiness.stats.deals}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Deals across {readiness.stats.accounts} accounts.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">HUBSPOT_SYNC</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={readiness.hubspot.status === "ok" ? "success" : "warning"}>
              {readiness.hubspot.status ?? "unavailable"}
            </Badge>
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
              {readiness.hubspot.lastRunAt
                ? `Last run: ${new Date(readiness.hubspot.lastRunAt).toLocaleString()}`
                : "No successful run timestamp yet."}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">CHECKLIST</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {readiness.checks.map((check) => (
              <div key={check.id} className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={levelToVariant(check.level)}>{check.level.replace("-", " ")}</Badge>
                  <p className="text-sm font-bold text-[hsl(var(--foreground))]">{check.label}</p>
                </div>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{check.detail}</p>
                {check.action?.command || check.action?.href ? (
                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                    {check.action?.command ? (
                      <code className="block border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-2 text-xs">
                        {check.action.command}
                      </code>
                    ) : (
                      <div />
                    )}
                    {check.action?.href ? (
                      <Button asChild variant="outline" size="sm" className="w-full md:w-auto">
                        <a href={check.action.href}>{check.action.label}</a>
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-xs uppercase tracking-wider">BOOTSTRAP RUNBOOK</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
                {bootstrapCommands.map((command, index) => (
                  <li key={command} className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--foreground))]">Step {index + 1}</span>
                    <code className="mt-1 block text-xs">{command}</code>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-xs uppercase tracking-wider">AI WORKFLOWS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
              <div className="flex flex-wrap gap-2">
                <Badge variant={readiness.ai.hasApiKey ? "success" : readiness.ai.systemKeyStatus === "pending-restart" ? "warning" : "destructive"}>
                  {readiness.ai.hasApiKey
                    ? readiness.ai.source === "user"
                      ? "personal key active"
                      : "system key active"
                    : readiness.ai.systemKeyStatus === "pending-restart"
                      ? "restart required"
                      : "no active key"}
                </Badge>
                <Badge variant={readiness.ai.strategyMode === "ai-enabled" ? "accent" : "outline"}>
                  {readiness.ai.strategyMode === "ai-enabled" ? "strategy ai enabled" : "strategy lab rule-based"}
                </Badge>
                <Badge variant="outline">{readiness.ai.model}</Badge>
              </div>

              <p>{readiness.ai.statusNote}</p>

              <ul className="space-y-2">
                {readiness.ai.workflowLabels.map((workflow) => (
                  <li
                    key={workflow}
                    className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2"
                  >
                    {workflow}
                  </li>
                ))}
              </ul>

              <div className="grid gap-2">
                <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                    AI settings
                  </p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Manage the active OpenAI key, model, and daily token visibility.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                    <Link href="/settings">Open AI Settings</Link>
                  </Button>
                </div>
                <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                    Guided onboarding
                  </p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Jump into first-run setup for accounts, contacts, and capture workflows.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                    <Link href={"/workspace/get-started" as Route}>Open Get Started</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-xs uppercase tracking-wider">LINKEDIN PREVIEW READINESS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
              <p>
                LinkedIn only renders previews for public URLs. Localhost links will not show cards or screenshots.
              </p>
              <p>
                Current base URL:{" "}
                <span className="font-mono text-xs text-[hsl(var(--foreground))]">
                  {readiness.publicUrl ?? "not configured"}
                </span>
              </p>
              <div className="grid gap-2">
                <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                    LinkedIn companion
                  </p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Install the tab-to-CRM companion and test the capture flow inside the app.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                    <Link href={"/integrations/linkedin" as Route}>Open Companion</Link>
                  </Button>
                </div>
                <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                    Preview validation
                  </p>
                  <div className="mt-3 grid gap-2">
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <a href="https://www.linkedin.com/post-inspector/" target="_blank" rel="noreferrer">
                        Open Post Inspector
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <a href="https://www.linkedin.com/help/linkedin/answer/a507663" target="_blank" rel="noreferrer">
                        LinkedIn Preview Docs
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </section>
  );
}
