import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WorkspaceNav } from "@/components/shell/workspace-nav";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { CommandPalette } from "@/components/shell/command-palette";
import { getActorFromServerContext } from "@/lib/auth/actor";

interface WorkspaceLayoutProps {
  children: ReactNode;
}

export default async function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const actor = await getActorFromServerContext();
  const actorEmail = actor.email ?? process.env.APP_ACTOR_EMAIL ?? "rep@local";
  const actorName = actor.name ?? process.env.APP_ACTOR_NAME ?? "Default Rep";
  const workspaceName = process.env.APP_WORKSPACE_NAME ?? "Sales Workspace";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1360px] flex-col gap-5 px-5 py-5 md:flex-row md:px-6">
      {/* Sleek Sidebar */}
      <aside className="md:sticky md:top-5 md:h-[calc(100vh-2.5rem)] md:w-60">
        <div className="flex h-full flex-col rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[0_1px_3px_0_hsl(var(--foreground)/0.04)]">
          {/* Brand */}
          <Link href="/" className="block">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded bg-[hsl(var(--primary))]" />
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  Sales Super App
                </p>
                <h1 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  {workspaceName}
                </h1>
              </div>
            </div>
          </Link>

          {/* Actor */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{actorName}</Badge>
            <Badge variant="outline">{actorEmail}</Badge>
            <ThemeToggle />
          </div>

          <Separator className="my-4 bg-[hsl(var(--border))]" />

          {/* Navigation */}
          <WorkspaceNav />

          {/* Footer */}
          <p className="mt-auto pt-4 text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">
            AI-first sales execution.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1">{children}</main>

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
}
