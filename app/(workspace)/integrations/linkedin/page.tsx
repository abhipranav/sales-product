import { listAccounts } from "@/lib/services/crm-records";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { LinkedInCaptureWorkbench } from "@/components/integrations/linkedin-capture-workbench";

interface LinkedInCompanionPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LinkedInCompanionPage({ searchParams }: LinkedInCompanionPageProps) {
  const actor = await getActorFromServerContext();
  const [accountResult, params] = await Promise.all([
    listAccounts({}, { limit: 25, offset: 0 }, { field: "name", order: "asc" }, actor),
    searchParams
  ]);

  const sourceUrl = typeof params.sourceUrl === "string" ? params.sourceUrl : undefined;
  const sourceTitle = typeof params.sourceTitle === "string" ? params.sourceTitle : undefined;

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="mb-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
          INTEGRATIONS // LINKEDIN_COMPANION
        </p>
        <h2 className="font-serif text-3xl font-bold text-[hsl(var(--foreground))]">LinkedIn Companion</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Capture page context into editable CRM records, then keep refining accounts and contacts inside the app.
        </p>
      </header>

      <LinkedInCaptureWorkbench
        accounts={accountResult.items.map((account) => ({
          id: account.id,
          name: account.name
        }))}
        initialSourceUrl={sourceUrl}
        initialSourceTitle={sourceTitle}
      />
    </section>
  );
}
