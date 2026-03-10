import type { ReactNode } from "react";
import Link from "next/link";
import { WorkspaceNav } from "@/components/shell/workspace-nav";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { AIStatusIndicator } from "@/components/shell/ai-status-indicator";
import { CommandPaletteMount } from "@/components/shell/command-palette-mount";
import { SystemReadinessBanner } from "@/components/shell/system-readiness-banner";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { getSystemReadiness } from "@/lib/services/system-readiness";
import { signOut } from "@/auth";

interface WorkspaceLayoutProps {
  children: ReactNode;
}

export default async function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/auth/signin" });
  }

  const actor = await getActorFromServerContext();
  const readiness = await getSystemReadiness(actor);
  const actorEmail = actor.email ?? process.env.APP_ACTOR_EMAIL ?? "rep@local";
  const actorName = actor.name ?? process.env.APP_ACTOR_NAME ?? "Default Rep";
  const workspaceName = process.env.APP_WORKSPACE_NAME ?? "Sales Workspace";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1360px] flex-col gap-4 px-5 py-4 md:flex-row md:px-6">
      {/* Industrial Sidebar */}
      <aside className="md:sticky md:top-4 md:h-[calc(100vh-2rem)] md:w-56">
        <div className="flex h-full flex-col border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          {/* Brand */}
          <Link href="/" className="block">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 bg-[hsl(var(--foreground))]" />
              <div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                  REVENUE_OS
                </p>
                <h1 className="font-mono text-xs font-bold uppercase tracking-tight text-[hsl(var(--foreground))]">
                  {workspaceName}
                </h1>
              </div>
            </div>
          </Link>

          {/* Actor */}
          <div className="mt-4 border-[2px] border-dashed border-[hsl(var(--border))] px-3 py-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">{actorName}</p>
            <p className="font-mono text-[9px] text-[hsl(var(--muted-foreground))] tracking-wider truncate" title={actorEmail}>{actorEmail}</p>
            <div className="mt-2 flex items-center gap-2">
              <Link
                href="/settings"
                className="inline-block font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--foreground))] hover:underline"
              >
                Manage Account
              </Link>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>

          <div className="my-3 h-[2px] w-full bg-[hsl(var(--border))]" />

          {/* Navigation */}
          <WorkspaceNav />

          {/* Footer */}
          <div className="mt-auto pt-4 space-y-2">
            <AIStatusIndicator />
            <ThemeToggle />
            <div className="caution-stripe-thin" />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                SYS_STATUS
              </span>
              <span className="font-mono text-[9px] font-bold text-[hsl(var(--foreground))] uppercase">
                ONLINE
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1">
        <SystemReadinessBanner readiness={readiness} />
        {children}
      </main>

      {/* Global Command Palette */}
      <CommandPaletteMount />
    </div>
  );
}
