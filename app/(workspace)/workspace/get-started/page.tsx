import { getActorFromServerContext } from "@/lib/auth/actor";
import { GetStartedFlow } from "@/components/onboarding/get-started-flow";
import { getPrismaClient } from "@/lib/db/prisma";
import { listAccounts } from "@/lib/services/crm-records";
import { resolveWorkspaceScope } from "@/lib/services/workspace";

export default async function WorkspaceGetStartedPage() {
  const actor = await getActorFromServerContext();
  const prisma = getPrismaClient();
  const [workspaceScope, accountResult] = await Promise.all([
    prisma ? resolveWorkspaceScope(prisma, actor).catch(() => null) : Promise.resolve(null),
    listAccounts({}, { limit: 12, offset: 0 }, { field: "name", order: "asc" }, actor)
  ]);

  const actorName = workspaceScope?.actorName ?? actor.name ?? actor.email ?? "Workspace Operator";
  const workspaceName =
    workspaceScope?.workspaceName ?? process.env.APP_WORKSPACE_NAME?.trim() ?? "Velocity Workspace";

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="mb-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
          ONBOARDING // GET_STARTED
        </p>
        <h2 className="font-serif text-3xl font-bold text-[hsl(var(--foreground))]">Create Your First Revenue Loop</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Set up the first account, first contact, and first capture workflow without touching the production auth path.
        </p>
      </header>

      <GetStartedFlow
        actorName={actorName}
        workspaceName={workspaceName}
        initialAccounts={accountResult.items.map((account) => ({
          id: account.id,
          name: account.name
        }))}
      />
    </section>
  );
}
