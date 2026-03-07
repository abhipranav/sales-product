"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContactForm } from "@/components/crm/contact-form";
import { ContactsTable } from "@/components/crm/contacts-table";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ContactsPageClientProps {
  accountIdParam?: string;
  accounts: Array<{
    id: string;
    name: string;
  }>;
  initialData: {
    items: Array<{
      id: string;
      fullName: string;
      title: string;
      email: string | null;
      linkedIn: string | null;
      role: "champion" | "approver" | "blocker" | "influencer";
      accountId: string;
      accountName: string;
      createdAt: string;
    }>;
    total: number;
    hasMore: boolean;
  };
}

export function ContactsPageClient({ accountIdParam, accounts, initialData }: ContactsPageClientProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="mb-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
          CRM // CONTACTS
        </p>
        <h2 className="font-serif text-3xl font-bold text-[hsl(var(--foreground))]">Contacts</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Manage your contacts and track stakeholder relationships.
        </p>
      </header>

      <ContactsTable accountId={accountIdParam} initialData={initialData} onCreateClick={() => setCreateOpen(true)} />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogClose onClose={() => setCreateOpen(false)} />
          <DialogHeader>
            <DialogTitle>CREATE CONTACT</DialogTitle>
          </DialogHeader>
          <ContactForm
            mode="create"
            accounts={accounts}
            initialData={
              accountIdParam ? { accountId: accountIdParam, fullName: "", title: "", role: "influencer" } : undefined
            }
            onSuccess={(result) => {
              setCreateOpen(false);
              router.push(`/contacts/${result.id}`);
            }}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
