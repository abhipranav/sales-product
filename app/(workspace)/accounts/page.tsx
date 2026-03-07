import { AccountsPageClient } from "@/app/(workspace)/accounts/page-client";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { listAccounts } from "@/lib/services/crm-records";

export default async function AccountsPage() {
  const actor = await getActorFromServerContext();
  const initialData = await listAccounts({}, { limit: 20, offset: 0 }, { field: "name", order: "asc" }, actor);

  return (
    <AccountsPageClient
      initialData={{
        items: initialData.items.map((account) => ({
          ...account,
          createdAt: account.createdAt.toISOString()
        })),
        total: initialData.total,
        hasMore: initialData.hasMore
      }}
    />
  );
}
