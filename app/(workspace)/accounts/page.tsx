"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AccountsTable } from "@/components/crm/accounts-table";
import { AccountForm } from "@/components/crm/account-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

export default function AccountsPage() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
          CRM
        </p>
        <h2 className="font-['Sora',sans-serif] text-3xl font-bold text-[hsl(var(--foreground))]">
          Accounts
        </h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Manage your company accounts and track relationships.
        </p>
      </header>

      <AccountsTable onCreateClick={() => setCreateOpen(true)} />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogClose onClose={() => setCreateOpen(false)} />
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
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
