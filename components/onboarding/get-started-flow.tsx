"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountForm } from "@/components/crm/account-form";
import { ContactForm } from "@/components/crm/contact-form";

interface GetStartedFlowProps {
  actorName: string;
  workspaceName: string;
  initialAccounts: Array<{ id: string; name: string }>;
}

export function GetStartedFlow({ actorName, workspaceName, initialAccounts }: GetStartedFlowProps) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccounts[0]?.id ?? "");
  const [lastAccount, setLastAccount] = useState(initialAccounts[0] ?? null);
  const [lastContactId, setLastContactId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-xs uppercase tracking-wider">FIRST-RUN BOOTSTRAP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="accent">{workspaceName}</Badge>
            <Badge variant="outline">{actorName}</Badge>
            <Badge variant={accounts.length > 0 ? "success" : "warning"}>
              {accounts.length > 0 ? `${accounts.length} account records ready` : "no accounts yet"}
            </Badge>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Create the first company record, add the first stakeholder, then attach the LinkedIn companion so the app
            can move from shell to daily workflow.
          </p>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">STEP 1 // CREATE ACCOUNT</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountForm
              mode="create"
              onSuccess={(result) => {
                const nextAccount = { id: result.id, name: result.name };
                setAccounts((prev) => [nextAccount, ...prev.filter((account) => account.id !== result.id)]);
                setSelectedAccountId(result.id);
                setLastAccount(nextAccount);
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">STEP 2 // ADD FIRST CONTACT</CardTitle>
          </CardHeader>
          <CardContent>
            {accounts.length > 0 ? (
              <ContactForm
                key={`${selectedAccountId}-${accounts.length}`}
                mode="create"
                accounts={accounts}
                initialData={{
                  accountId: selectedAccountId,
                  fullName: "",
                  title: "",
                  role: "champion"
                }}
                onSuccess={(result) => setLastContactId(result.id)}
              />
            ) : (
              <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
                Create the first account first. The contact form unlocks as soon as an account exists.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">STEP 3 // CONNECT COMPANION</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
            <p>
              Install the LinkedIn companion to open prefilled capture forms from the current tab without changing auth
              or CRM architecture.
            </p>
            <Button asChild variant="cta" size="sm">
              <Link href={"/integrations/linkedin" as Route}>Open LinkedIn Companion</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">CRM READY</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
            <p>
              Once the first records are in place, reps can edit company and stakeholder details directly from the CRM
              views.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={lastAccount ? `/accounts/${lastAccount.id}` : "/accounts"} as="/accounts">
                Open Accounts
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">CONTACT READY</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
            <p>
              The contact record unlocks stakeholder roles, follow-up drafting, and sequence execution in downstream
              workflows.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={lastContactId ? `/contacts/${lastContactId}` : "/contacts"} as="/contacts">
                Open Contacts
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
