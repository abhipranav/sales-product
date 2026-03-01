"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { Account, Deal } from "@/lib/domain/types";

interface CrmCommandCenterProps {
  account: Account;
  deal: Deal;
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CrmCommandCenter({ account, deal }: CrmCommandCenterProps) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function handleUpdateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyKey) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    setBusyKey("account-update");
    toast.loading("Updating account...", { id: "crm-account-update" });

    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: String(formData.get("name") ?? "").trim(),
          segment: String(formData.get("segment") ?? "mid-market"),
          website: String(formData.get("website") ?? "").trim() || undefined,
          employeeBand: String(formData.get("employeeBand") ?? "").trim() || undefined
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? "Failed to update account.", { id: "crm-account-update" });
        return;
      }

      toast.success("Account updated.", { id: "crm-account-update" });
      router.refresh();
    } catch {
      toast.error("Failed to update account.", { id: "crm-account-update" });
    } finally {
      setBusyKey(null);
    }
  }

  async function handleCreateContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyKey) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    setBusyKey("contact-create");
    toast.loading("Creating contact...", { id: "crm-contact-create" });

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accountId: String(formData.get("accountId") ?? "").trim(),
          fullName: String(formData.get("fullName") ?? "").trim(),
          title: String(formData.get("title") ?? "").trim(),
          email: String(formData.get("email") ?? "").trim() || undefined,
          linkedInUrl: String(formData.get("linkedInUrl") ?? "").trim() || undefined,
          role: String(formData.get("role") ?? "influencer")
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? "Failed to create contact.", { id: "crm-contact-create" });
        return;
      }

      toast.success("Contact created.", { id: "crm-contact-create" });
      form.reset();
      router.refresh();
    } catch {
      toast.error("Failed to create contact.", { id: "crm-contact-create" });
    } finally {
      setBusyKey(null);
    }
  }

  async function handleCreateDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyKey) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const closeDateInput = String(formData.get("closeDate") ?? "").trim();
    const closeDate = new Date(closeDateInput);
    if (Number.isNaN(closeDate.getTime())) {
      toast.error("Please provide a valid close date.");
      return;
    }

    setBusyKey("deal-create");
    toast.loading("Creating deal...", { id: "crm-deal-create" });

    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accountId: String(formData.get("accountId") ?? "").trim(),
          name: String(formData.get("name") ?? "").trim(),
          stage: String(formData.get("stage") ?? "discovery"),
          amount: Number(formData.get("amount") ?? 0),
          confidence: Number(formData.get("confidence") ?? 0.5),
          closeDate: closeDate.toISOString(),
          riskSummary: String(formData.get("riskSummary") ?? "").trim()
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? "Failed to create deal.", { id: "crm-deal-create" });
        return;
      }

      toast.success("Deal created.", { id: "crm-deal-create" });
      form.reset();
      router.refresh();
    } catch {
      toast.error("Failed to create deal.", { id: "crm-deal-create" });
    } finally {
      setBusyKey(null);
    }
  }

  async function handleUpdateDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyKey) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const closeDateInput = String(formData.get("closeDate") ?? "").trim();
    const closeDate = new Date(closeDateInput);
    if (closeDateInput && Number.isNaN(closeDate.getTime())) {
      toast.error("Please provide a valid close date.");
      return;
    }

    setBusyKey("deal-update");
    toast.loading("Updating deal...", { id: "crm-deal-update" });

    try {
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: String(formData.get("name") ?? "").trim(),
          stage: String(formData.get("stage") ?? deal.stage),
          amount: Number(formData.get("amount") ?? deal.amount),
          confidence: Number(formData.get("confidence") ?? deal.confidence),
          closeDate: closeDateInput ? closeDate.toISOString() : undefined,
          riskSummary: String(formData.get("riskSummary") ?? "").trim()
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? "Failed to update deal.", { id: "crm-deal-update" });
        return;
      }

      toast.success("Deal updated.", { id: "crm-deal-update" });
      router.refresh();
    } catch {
      toast.error("Failed to update deal.", { id: "crm-deal-update" });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-['Sora',sans-serif]">CRM Command Center</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={handleUpdateAccount}
          className="grid gap-2 border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--card))]"
        >
          <input type="hidden" name="accountId" value={account.id} />
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))] dark:text-[hsl(var(--muted-foreground))]">Update Account</p>
          <div className="grid gap-2 md:grid-cols-2">
            <Input name="name" defaultValue={account.name} disabled={busyKey !== null} />
            <NativeSelect name="segment" defaultValue={account.segment} disabled={busyKey !== null}>
              <option value="startup">startup</option>
              <option value="mid-market">mid-market</option>
              <option value="enterprise">enterprise</option>
            </NativeSelect>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <Input
              name="website"
              defaultValue={account.website ?? ""}
              placeholder="https://company.com"
              disabled={busyKey !== null}
            />
            <Input
              name="employeeBand"
              defaultValue={account.employeeBand ?? ""}
              placeholder="100-500"
              disabled={busyKey !== null}
            />
          </div>
          <Button type="submit" variant="outline" disabled={busyKey !== null}>
            {busyKey === "account-update" ? "Saving..." : "Save Account"}
          </Button>
        </form>

        <form
          onSubmit={handleCreateContact}
          className="grid gap-2 border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--card))]"
        >
          <input type="hidden" name="accountId" value={account.id} />
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))] dark:text-[hsl(var(--muted-foreground))]">Add Stakeholder</p>
          <div className="grid gap-2 md:grid-cols-2">
            <Input name="fullName" required minLength={2} placeholder="Full name" disabled={busyKey !== null} />
            <Input name="title" required minLength={2} placeholder="Title" disabled={busyKey !== null} />
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <Input name="email" type="email" placeholder="work email" disabled={busyKey !== null} />
            <Input name="linkedInUrl" placeholder="https://linkedin.com/in/..." disabled={busyKey !== null} />
            <NativeSelect name="role" defaultValue="influencer" disabled={busyKey !== null}>
              <option value="champion">champion</option>
              <option value="approver">approver</option>
              <option value="blocker">blocker</option>
              <option value="influencer">influencer</option>
            </NativeSelect>
          </div>
          <Button type="submit" disabled={busyKey !== null}>
            {busyKey === "contact-create" ? "Creating..." : "Create Contact"}
          </Button>
        </form>

        <form
          onSubmit={handleCreateDeal}
          className="grid gap-2 border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--card))]"
        >
          <input type="hidden" name="accountId" value={account.id} />
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))] dark:text-[hsl(var(--muted-foreground))]">Create New Deal</p>
          <div className="grid gap-2 md:grid-cols-2">
            <Input name="name" required minLength={2} placeholder="Deal name" disabled={busyKey !== null} />
            <NativeSelect name="stage" defaultValue="discovery" disabled={busyKey !== null}>
              <option value="discovery">discovery</option>
              <option value="evaluation">evaluation</option>
              <option value="proposal">proposal</option>
              <option value="procurement">procurement</option>
              <option value="closed-won">closed-won</option>
              <option value="closed-lost">closed-lost</option>
            </NativeSelect>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <Input name="amount" type="number" min={0} step={1000} defaultValue={50000} disabled={busyKey !== null} />
            <Input
              name="confidence"
              type="number"
              min={0}
              max={1}
              step={0.01}
              defaultValue={0.5}
              disabled={busyKey !== null}
            />
            <Input name="closeDate" type="datetime-local" required disabled={busyKey !== null} />
          </div>
          <Textarea
            name="riskSummary"
            minLength={5}
            placeholder="Primary risk summary..."
            required
            rows={2}
            disabled={busyKey !== null}
          />
          <Button type="submit" variant="outline" disabled={busyKey !== null}>
            {busyKey === "deal-create" ? "Creating..." : "Create Deal"}
          </Button>
        </form>

        <form
          onSubmit={handleUpdateDeal}
          className="grid gap-2 border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--card))]"
        >
          <input type="hidden" name="dealId" value={deal.id} />
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))] dark:text-[hsl(var(--muted-foreground))]">Update Active Deal</p>
          <div className="grid gap-2 md:grid-cols-2">
            <Input name="name" defaultValue={deal.name} disabled={busyKey !== null} />
            <NativeSelect name="stage" defaultValue={deal.stage} disabled={busyKey !== null}>
              <option value="discovery">discovery</option>
              <option value="evaluation">evaluation</option>
              <option value="proposal">proposal</option>
              <option value="procurement">procurement</option>
              <option value="closed-won">closed-won</option>
              <option value="closed-lost">closed-lost</option>
            </NativeSelect>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <Input name="amount" type="number" min={0} step={1000} defaultValue={deal.amount} disabled={busyKey !== null} />
            <Input
              name="confidence"
              type="number"
              min={0}
              max={1}
              step={0.01}
              defaultValue={deal.confidence}
              disabled={busyKey !== null}
            />
            <Input
              name="closeDate"
              type="datetime-local"
              defaultValue={toDateTimeLocal(deal.closeDate)}
              disabled={busyKey !== null}
            />
          </div>
          <Textarea name="riskSummary" defaultValue={deal.riskSummary} rows={2} disabled={busyKey !== null} />
          <Button type="submit" disabled={busyKey !== null}>
            {busyKey === "deal-update" ? "Saving..." : "Save Deal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
