import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden pb-14">
      {/* Subtle background */}
      <div className="landing-grid pointer-events-none absolute inset-0 -z-20" />
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="landing-orb landing-orb-a" />
        <div className="landing-orb landing-orb-b" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded bg-[hsl(var(--primary))]" />
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">Sales AI</p>
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">VelocityOS</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-5 text-[13px] font-medium text-[hsl(var(--muted-foreground))] md:flex">
            <a href="#command-center" className="transition-colors hover:text-[hsl(var(--foreground))]">Command Center</a>
            <a href="#modules" className="transition-colors hover:text-[hsl(var(--foreground))]">Modules</a>
            <a href="#pricing" className="transition-colors hover:text-[hsl(var(--foreground))]">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/workspace">Open App</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO - Command Center Preview
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="text-center mb-8">
          <Badge variant="accent" className="mb-3">AI-Native Revenue Execution</Badge>
          <h1 className="text-3xl font-bold leading-tight tracking-[-0.02em] text-[hsl(var(--foreground))] md:text-4xl lg:text-[42px]">
            Your Sales Command Center
          </h1>
          <p className="mt-3 mx-auto max-w-xl text-[15px] leading-relaxed text-[hsl(var(--muted-foreground))]">
            CRM execution, pipeline intelligence, call insights, and workflow orchestration. All in one unified interface.
          </p>
          <div className="mt-5 flex justify-center gap-2.5">
            <Button asChild variant="cta" size="lg">
              <Link href="/workspace">Launch Command Center</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/cockpit">Preview Cockpit</Link>
            </Button>
          </div>
        </div>

        {/* Hero Stats Bar */}
        <div className="grid grid-cols-3 gap-px bg-[hsl(var(--border))] rounded-lg overflow-hidden max-w-lg mx-auto">
          {[
            { value: "37%", label: "Less admin" },
            { value: "2.4×", label: "Faster follow-up" },
            { value: "9 days", label: "Cycle reduction" }
          ].map((stat) => (
            <div key={stat.label} className="bg-[hsl(var(--card))] p-3 text-center">
              <p className="text-lg font-bold text-[hsl(var(--primary))]">{stat.value}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          COMMAND CENTER - Bento Grid Layout
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="command-center" className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--accent))]">Command Center</p>
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-[hsl(var(--foreground))] mt-1">
            Every module, one unified dashboard.
          </h2>
        </div>

        {/* Bento Grid - Command Center Style */}
        <div className="grid grid-cols-12 gap-3">
          {/* Main Preview - spans 8 cols */}
          <Card className="col-span-12 lg:col-span-8 overflow-hidden">
            <CardContent className="p-0">
              <Image
                src="https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&w=1800&q=75"
                alt="Command center dashboard"
                width={1600}
                height={800}
                priority
                className="h-48 lg:h-64 w-full object-cover"
              />
              <div className="p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Rep Cockpit</p>
                <p className="mt-1 text-sm font-semibold text-[hsl(var(--foreground))]">Daily priorities, approvals, meeting prep, and follow-up drafting in one surface.</p>
              </div>
            </CardContent>
          </Card>

          {/* Side Stats - spans 4 cols */}
          <div className="col-span-12 lg:col-span-4 grid gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Pipeline Intelligence</p>
                <p className="mt-2 text-2xl font-bold text-[hsl(var(--foreground))]">$174K</p>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Weighted pipeline value</p>
                <div className="mt-3 h-1.5 w-full bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-[hsl(var(--accent))] rounded-full" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Task Engine</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))]">7</p>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">tasks due today</p>
                </div>
                <div className="mt-3 flex gap-1">
                  <span className="h-6 w-6 rounded bg-[hsl(var(--destructive))] flex items-center justify-center text-[10px] text-white font-medium">2</span>
                  <span className="h-6 w-6 rounded bg-[hsl(var(--warning))] flex items-center justify-center text-[10px] text-white font-medium">3</span>
                  <span className="h-6 w-6 rounded bg-[hsl(var(--success))] flex items-center justify-center text-[10px] text-white font-medium">2</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row - 3 equal panels */}
          <Card className="col-span-12 md:col-span-4">
            <CardContent className="p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Call Intelligence</p>
              <p className="mt-2 text-sm font-semibold text-[hsl(var(--foreground))]">Meeting notes → actions</p>
              <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">Conversation data becomes tasks, briefs, and strategy updates automatically.</p>
            </CardContent>
          </Card>
          <Card className="col-span-12 md:col-span-4">
            <CardContent className="p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Workflow Engine</p>
              <p className="mt-2 text-sm font-semibold text-[hsl(var(--foreground))]">Structured orchestration</p>
              <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">Owner, priority, due date, and completion states for every action.</p>
            </CardContent>
          </Card>
          <Card className="col-span-12 md:col-span-4">
            <CardContent className="p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Governance Controls</p>
              <p className="mt-2 text-sm font-semibold text-[hsl(var(--foreground))]">Human-in-the-loop</p>
              <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">Approval queue for outbound AI messaging and sensitive actions.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODULES - Organized Grid
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="modules" className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--accent))]">App Surface</p>
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-[hsl(var(--foreground))] mt-1">
            Seven modules. Zero guessing.
          </h2>
        </div>

        <div className="grid grid-cols-12 gap-2">
          {([
            { title: "Workspace", href: "/workspace", desc: "Super-app launchpad", span: "col-span-6 md:col-span-3" },
            { title: "Cockpit", href: "/cockpit", desc: "Rep execution center", span: "col-span-6 md:col-span-3" },
            { title: "Accounts", href: "/accounts", desc: "Stakeholder intel", span: "col-span-6 md:col-span-3" },
            { title: "Pipeline", href: "/pipeline", desc: "Revenue visibility", span: "col-span-6 md:col-span-3" },
            { title: "Intelligence", href: "/intelligence", desc: "AI strategy flows", span: "col-span-6 md:col-span-4" },
            { title: "Notifications", href: "/notifications", desc: "Signal inbox", span: "col-span-6 md:col-span-4" },
            { title: "Workflows", href: "/workflows", desc: "Tasks + approvals", span: "col-span-12 md:col-span-4" }
          ] as const).map((module) => (
            <Link 
              key={module.title} 
              href={module.href}
              className={`${module.span} group rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 transition-colors hover:border-[hsl(var(--accent))]`}
            >
              <p className="text-[13px] font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--accent))]">{module.title}</p>
              <p className="mt-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">{module.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          INTEGRATIONS + SECURITY - Side by Side
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="grid grid-cols-12 gap-3">
          <Card className="col-span-12 lg:col-span-6">
            <CardHeader className="pb-3">
              <CardTitle>Integrations</CardTitle>
              <CardDescription>CRM + calendar ingestion with operational controls.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 text-[12px] text-[hsl(var(--muted-foreground))]">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--success))]" />
                  Incremental sync checkpoints per workspace
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--success))]" />
                  Manual + automated ingest paths
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--success))]" />
                  Payload-driven upsert for account/contact/deal
                </li>
              </ul>
              {/* Logo strip */}
              <div className="mt-4 flex gap-2">
                {["Salesforce", "HubSpot", "Google", "Slack"].map((name) => (
                  <span key={name} className="rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-2 py-1 text-[9px] font-medium text-[hsl(var(--muted-foreground))]">
                    {name}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-12 lg:col-span-6">
            <CardHeader className="pb-3">
              <CardTitle>Security & Governance</CardTitle>
              <CardDescription>Enterprise-grade execution controls.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 text-[12px] text-[hsl(var(--muted-foreground))]">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
                  Workspace membership scoping on data paths
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
                  Approval gates for outbound AI actions
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
                  Full audit trail for task and event mutations
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          PRICING - 3 Cards
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--accent))]">Pricing</p>
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-[hsl(var(--foreground))] mt-1">Predictable plans.</h2>
        </div>
        <div className="grid grid-cols-12 gap-3">
          <Card className="col-span-12 md:col-span-4">
            <CardContent className="p-4">
              <p className="text-[13px] font-semibold text-[hsl(var(--foreground))]">Starter</p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Per rep / month</p>
              <p className="mt-3 text-2xl font-bold text-[hsl(var(--foreground))]">$39</p>
              <ul className="mt-3 space-y-1.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                <li>• Cockpit and workflows</li>
                <li>• Task engine</li>
                <li>• CRM baseline</li>
              </ul>
              <Button variant="outline" size="sm" className="w-full mt-4">Get Started</Button>
            </CardContent>
          </Card>
          <Card className="col-span-12 md:col-span-4 border-[hsl(var(--primary))] border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-[hsl(var(--foreground))]">Growth</p>
                <Badge>Popular</Badge>
              </div>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Per rep / month</p>
              <p className="mt-3 text-2xl font-bold text-[hsl(var(--foreground))]">$89</p>
              <ul className="mt-3 space-y-1.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                <li>• Everything in Starter</li>
                <li>• Call intelligence</li>
                <li>• Advanced pipeline</li>
              </ul>
              <Button variant="cta" size="sm" className="w-full mt-4">Get Started</Button>
            </CardContent>
          </Card>
          <Card className="col-span-12 md:col-span-4">
            <CardContent className="p-4">
              <p className="text-[13px] font-semibold text-[hsl(var(--foreground))]">Enterprise</p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Annual</p>
              <p className="mt-3 text-2xl font-bold text-[hsl(var(--foreground))]">Custom</p>
              <ul className="mt-3 space-y-1.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                <li>• Governance</li>
                <li>• Model routing</li>
                <li>• Architecture support</li>
              </ul>
              <Button variant="outline" size="sm" className="w-full mt-4">Contact Sales</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CTA
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-10 pt-4">
        <Card className="bg-[hsl(var(--primary))] border-0 text-white">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold">Launch your command center.</h3>
              <p className="mt-1 text-white/70 text-[12px]">Connect your stack and operate from a single surface.</p>
            </div>
            <div className="flex gap-2">
              <Button asChild className="bg-white text-[hsl(var(--primary))] hover:bg-white/90">
                <Link href="/workspace">Open Workspace</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Link href="/integrations">Integrations</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-6xl px-5 py-4 text-[10px] text-[hsl(var(--muted-foreground))]">
        <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-3">
          <p>VelocityOS • Sales AI Command Center</p>
          <p>Built for revenue teams.</p>
        </div>
      </footer>
    </main>
  );
}
