import { ContactsPageClient } from "@/app/(workspace)/contacts/page-client";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { listAccounts, listContacts } from "@/lib/services/crm-records";

interface ContactsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const actor = await getActorFromServerContext();
  const params = await searchParams;
  const accountIdParam = typeof params.accountId === "string" ? params.accountId : undefined;
  const [initialData, accounts] = await Promise.all([
    listContacts(
      accountIdParam ? { accountId: accountIdParam } : {},
      { limit: 20, offset: 0 },
      { field: "fullName", order: "asc" },
      actor
    ),
    listAccounts({}, { limit: 100, offset: 0 }, { field: "name", order: "asc" }, actor)
  ]);

  return (
    <ContactsPageClient
      accountIdParam={accountIdParam}
      accounts={accounts.items.map((account) => ({
        id: account.id,
        name: account.name
      }))}
      initialData={{
        items: initialData.items.map((contact) => ({
          ...contact,
          createdAt: contact.createdAt.toISOString()
        })),
        total: initialData.total,
        hasMore: initialData.hasMore
      }}
    />
  );
}
