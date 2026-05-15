"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deriveLinkedInCaptureHints } from "@/lib/integrations/linkedin-companion";

interface LinkedInCaptureWorkbenchProps {
  accounts: Array<{ id: string; name: string }>;
  initialSourceUrl?: string;
  initialSourceTitle?: string;
}

interface CaptureResult {
  account: {
    id: string;
    name: string;
    status: "created" | "updated" | "matched";
  };
  contact: {
    id: string;
    fullName: string;
    status: "created" | "updated" | "matched";
  } | null;
}

export function LinkedInCaptureWorkbench({
  accounts,
  initialSourceUrl,
  initialSourceTitle
}: LinkedInCaptureWorkbenchProps) {
  const router = useRouter();
  const initialHints = useMemo(
    () => deriveLinkedInCaptureHints(initialSourceUrl, initialSourceTitle),
    [initialSourceTitle, initialSourceUrl]
  );

  const [existingAccountId, setExistingAccountId] = useState("");
  const [sourceUrl, setSourceUrl] = useState(initialSourceUrl ?? "");
  const [sourceTitle, setSourceTitle] = useState(initialSourceTitle ?? "");
  const [companyName, setCompanyName] = useState(initialHints.companyName ?? "");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [employeeBand, setEmployeeBand] = useState("");
  const [segment, setSegment] = useState<"startup" | "mid-market" | "enterprise">("mid-market");
  const [contactName, setContactName] = useState(initialHints.contactName ?? "");
  const [contactTitle, setContactTitle] = useState(initialHints.contactTitle ?? "");
  const [contactEmail, setContactEmail] = useState("");
  const [contactLinkedInUrl, setContactLinkedInUrl] = useState(initialHints.contactLinkedInUrl ?? "");
  const [contactRole, setContactRole] = useState<"champion" | "approver" | "blocker" | "influencer">("champion");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<CaptureResult | null>(null);

  const canSubmit = Boolean(existingAccountId || companyName.trim()) && !isSaving;
  const hasSourceContext = Boolean(sourceUrl.trim() || sourceTitle.trim());

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/integrations/linkedin/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accountId: existingAccountId || undefined,
          sourceUrl: sourceUrl.trim() || undefined,
          sourceTitle: sourceTitle.trim() || undefined,
          companyName: companyName.trim() || undefined,
          companyWebsite: companyWebsite.trim() || undefined,
          employeeBand: employeeBand.trim() || undefined,
          segment,
          contactName: contactName.trim() || undefined,
          contactTitle: contactTitle.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          contactLinkedInUrl: contactLinkedInUrl.trim() || undefined,
          contactRole
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to save capture.");
      }

      setLastSaved(payload as CaptureResult);
      toast.success(payload?.contact ? "Account and contact saved." : "Account saved.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save capture.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-[2px] border-[hsl(var(--border))] rounded-lg shadow-none bg-[hsl(var(--card))]">
        <CardHeader>
          <CardTitle className="font-mono text-xs uppercase tracking-wider">CAPTURE WORKBENCH</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="accent">user-confirmed import</Badge>
            <Badge variant="outline">no DOM scraping</Badge>
            <Badge variant={hasSourceContext ? "success" : "warning"}>
              {hasSourceContext ? "page context attached" : "manual entry mode"}
            </Badge>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="source-url">Source URL</Label>
                <Input
                  id="source-url"
                  type="url"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://www.linkedin.com/in/example/"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="source-title">Source title</Label>
                <Input
                  id="source-title"
                  value={sourceTitle}
                  onChange={(event) => setSourceTitle(event.target.value)}
                  placeholder="Jane Doe - VP Sales - Acme | LinkedIn"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="existing-account">Attach to existing account (optional)</Label>
                <Select
                  value={existingAccountId}
                  onValueChange={(val) => setExistingAccountId(val)}
                >
                  <SelectTrigger id="existing-account" className="w-full">
                    <SelectValue placeholder="Create or match by company details">
                      {accounts.find((a) => a.id === existingAccountId)?.name || "Create or match by company details"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Create or match by company details</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)] p-3 rounded-md">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                Company
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="company-name">Company name</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="Acme Systems"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="company-website">Website</Label>
                  <Input
                    id="company-website"
                    type="url"
                    value={companyWebsite}
                    onChange={(event) => setCompanyWebsite(event.target.value)}
                    placeholder="https://acme.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="employee-band">Employee band</Label>
                  <Input
                    id="employee-band"
                    value={employeeBand}
                    onChange={(event) => setEmployeeBand(event.target.value)}
                    placeholder="200-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="segment">Segment</Label>
                  <Select
                    value={segment}
                    onValueChange={(val) => setSegment(val as typeof segment)}
                  >
                    <SelectTrigger id="segment" className="w-full">
                      <SelectValue placeholder="Select segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">startup</SelectItem>
                      <SelectItem value="mid-market">mid-market</SelectItem>
                      <SelectItem value="enterprise">enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)] p-3 rounded-md">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                Contact
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="contact-name">Full name</Label>
                  <Input
                    id="contact-name"
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contact-title">Title</Label>
                  <Input
                    id="contact-title"
                    value={contactTitle}
                    onChange={(event) => setContactTitle(event.target.value)}
                    placeholder="VP Sales"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    placeholder="jane@acme.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contact-linkedin">LinkedIn URL</Label>
                  <Input
                    id="contact-linkedin"
                    type="url"
                    value={contactLinkedInUrl}
                    onChange={(event) => setContactLinkedInUrl(event.target.value)}
                    placeholder="https://www.linkedin.com/in/jane-doe/"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="contact-role">Relationship role</Label>
                  <Select
                    value={contactRole}
                    onValueChange={(val) => setContactRole(val as typeof contactRole)}
                  >
                    <SelectTrigger id="contact-role" className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="champion">champion</SelectItem>
                      <SelectItem value="approver">approver</SelectItem>
                      <SelectItem value="blocker">blocker</SelectItem>
                      <SelectItem value="influencer">influencer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="cta" disabled={!canSubmit}>
                {isSaving ? "Saving..." : contactName.trim() ? "Save Account + Contact" : "Save Account"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/accounts">Open Accounts</Link>
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/contacts">Open Contacts</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-[2px] border-[hsl(var(--border))] rounded-lg shadow-none bg-[hsl(var(--card))]">
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">INSTALL FLOW</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
            <p>
              Load the unpacked companion from{" "}
              <span className="font-mono text-[11px] text-[hsl(var(--foreground))]">extensions/linkedin-companion</span>.
            </p>
            <ol className="space-y-2">
              <li className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)] px-3 py-2 flex items-start gap-3 rounded-md">
                <span className="font-mono font-bold text-[hsl(var(--warning))]">[01]</span>
                <span>Open Chrome extension management and enable Developer Mode.</span>
              </li>
              <li className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)] px-3 py-2 flex items-start gap-3 rounded-md">
                <span className="font-mono font-bold text-[hsl(var(--warning))]">[02]</span>
                <span>Choose Load unpacked and point to the companion folder.</span>
              </li>
              <li className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)] px-3 py-2 flex items-start gap-3 rounded-md">
                <span className="font-mono font-bold text-[hsl(var(--warning))]">[03]</span>
                <span>Set your app base URL once, then capture the active tab into this page.</span>
              </li>
            </ol>
            <Button asChild variant="outline" size="sm">
              <Link href={"/linkedin-extension" as Route}>Open Public Install Guide</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[2px] border-[hsl(var(--border))] rounded-lg shadow-none bg-[hsl(var(--card))]">
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">WHY THIS FLOW</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
            <p>
              The companion opens a capture form with the current tab URL and title, then the operator confirms what
              should be saved. That keeps the workflow fast without depending on brittle scraping.
            </p>
            <p>
              Account and contact records remain editable in the CRM after import, so reps can correct names, roles,
              websites, and ownership immediately.
            </p>
          </CardContent>
        </Card>

        {lastSaved ? (
          <Card className="border-[2px] border-[hsl(var(--warning))] bg-[hsl(var(--warning)/0.03)] shadow-none rounded-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[hsl(var(--warning))]" />
            <CardHeader>
              <CardTitle className="font-mono text-xs uppercase tracking-wider flex items-center justify-between text-[hsl(var(--warning))]">
                <span>LAST SAVED // SYNC_STATUS_ACTIVE</span>
                <span className="h-2 w-2 rounded-full bg-[hsl(var(--warning))] animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant={lastSaved.account.status === "created" ? "success" : "outline"} className="font-mono text-[10px]">
                  ACC_{lastSaved.account.status.toUpperCase()}
                </Badge>
                {lastSaved.contact ? (
                  <Badge variant={lastSaved.contact.status === "created" ? "success" : "outline"} className="font-mono text-[10px]">
                    CON_{lastSaved.contact.status.toUpperCase()}
                  </Badge>
                ) : null}
              </div>
              <div className="space-y-2 text-xs font-mono text-[hsl(var(--muted-foreground))]">
                <p className="font-semibold text-sm text-[hsl(var(--foreground))] uppercase tracking-wider">{lastSaved.account.name}</p>
                {lastSaved.contact ? (
                  <p className="text-[hsl(var(--foreground))]">{lastSaved.contact.fullName}</p>
                ) : (
                  <p>No contact was saved in this capture.</p>
                )}
                
                <div className="mt-2 pt-2 border-t border-dashed border-[hsl(var(--border))] text-[10px] space-y-1">
                  <p>TELEMETRY_REF: {lastSaved.account.id.substring(0, 8).toUpperCase()}</p>
                  {lastSaved.contact && <p>CONTACT_REF: {lastSaved.contact.id.substring(0, 8).toUpperCase()}</p>}
                  <p className="text-[hsl(var(--warning))]">✔ SYNCED_TO_CRM_DATABASE</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild size="sm" variant="cta" className="h-7 text-[10px] px-3 font-mono">
                  <Link href={`/accounts/${lastSaved.account.id}` as "/accounts"}>OPEN ACCOUNT</Link>
                </Button>
                {lastSaved.contact ? (
                  <Button asChild size="sm" variant="outline" className="h-7 text-[10px] px-3 font-mono">
                    <Link href={`/contacts/${lastSaved.contact.id}` as "/contacts"}>OPEN CONTACT</Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
