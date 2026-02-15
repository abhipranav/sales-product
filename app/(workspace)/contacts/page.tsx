"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ContactsTable } from "@/components/crm/contacts-table";
import { ContactForm } from "@/components/crm/contact-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

export default function ContactsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountIdParam = searchParams.get("accountId");
  const [createOpen, setCreateOpen] = useState(false);
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    // Fetch accounts for the create form
    fetch("/api/accounts?limit=100")
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setAccounts(data.items.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })));
        }
      })
      .catch(console.error);
  }, []);

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
          CRM
        </p>
        <h2 className="font-['Sora',sans-serif] text-3xl font-bold text-[hsl(var(--foreground))]">
          Contacts
        </h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Manage your contacts and track stakeholder relationships.
        </p>
      </header>

      <ContactsTable
        accountId={accountIdParam ?? undefined}
        onCreateClick={() => setCreateOpen(true)}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogClose onClose={() => setCreateOpen(false)} />
          <DialogHeader>
            <DialogTitle>Create Contact</DialogTitle>
          </DialogHeader>
          <ContactForm
            mode="create"
            accounts={accounts}
            initialData={accountIdParam ? { accountId: accountIdParam, fullName: "", title: "", role: "influencer" } : undefined}
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
