"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AccountForm } from "@/components/crm/account-form";
import { AccountsTable } from "@/components/crm/accounts-table";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AccountsPageClientProps {
  initialData: {
    items: Array<{
      id: string;
      name: string;
      segment: "startup" | "mid-market" | "enterprise";
      website: string | null;
      employeeBand: string | null;
      contactCount: number;
      dealCount: number;
      createdAt: string;
    }>;
    total: number;
    hasMore: boolean;
  };
}

export function AccountsPageClient({ initialData }: AccountsPageClientProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="mb-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
          CRM // ACCOUNTS
        </p>
        <h2 className="font-serif text-3xl font-bold text-[hsl(var(--foreground))]">Accounts</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Manage your company accounts and track relationships.
        </p>
      </header>

      <AccountsTable initialData={initialData} onCreateClick={() => setCreateOpen(true)} />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogClose onClose={() => setCreateOpen(false)} />
          <DialogHeader>
            <DialogTitle>CREATE ACCOUNT</DialogTitle>
          </DialogHeader>
          <AccountForm
            mode="create"
            onSuccess={(result) => {
              setCreateOpen(false);
              router.push(`/accounts/${result.id}`);
            }}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
