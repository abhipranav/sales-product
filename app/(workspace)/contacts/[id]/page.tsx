import { notFound } from "next/navigation";
import Link from "next/link";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { getContact, getAccount } from "@/lib/services/crm-records";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactDetailClient } from "./client";
import { enrichContacts } from "@/lib/services/capabilities";
import type { Contact, Signal } from "@/lib/domain/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params;
  const actor = await getActorFromServerContext();

  let contact;
  try {
    contact = await getContact(id, actor);
  } catch {
    notFound();
  }

  // Fetch complete account info for GTM signal analysis
  let account;
  try {
    account = await getAccount(contact.account.id, actor);
  } catch {
    account = {
      id: contact.account.id,
      name: contact.account.name,
      segment: contact.account.segment,
      signals: []
    };
  }

  // Convert CRM records to domain shapes for enrichment functions
  const mappedContact: Contact = {
    id: contact.id,
    accountId: contact.account.id,
    fullName: contact.fullName,
    title: contact.title,
    email: contact.email || undefined,
    linkedInUrl: contact.linkedIn || undefined,
    role: contact.role as Contact["role"]
  };

  const mappedSignals: Signal[] = (account.signals || []).map((sig: any) => ({
    id: sig.id,
    accountId: contact.account.id,
    type: sig.type,
    summary: sig.summary,
    happenedAt: new Date(sig.happenedAt).toISOString(),
    score: sig.score
  }));

  // Perform GTM Lead Intelligence computations
  const enrichedList = enrichContacts([mappedContact], mappedSignals);
  const enriched = enrichedList[0] || {
    persona: "Stakeholder",
    influenceScore: 70,
    engagementPriority: "medium" as const,
    recommendedAngle: "Address general needs and maintain active cadence."
  };

  const roleColor = (role: string) => {
    switch (role) {
      case "champion":
        return "success";
      case "blocker":
        return "destructive";
      case "approver":
        return "accent";
      default:
        return "secondary";
    }
  };

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
        <Link href="/contacts" className="hover:text-[hsl(var(--foreground))]">
          Contacts Registry
        </Link>
        <span>/</span>
        <span className="text-[hsl(var(--foreground))]">{contact.fullName}</span>
      </nav>

      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4 border-b-[2px] border-[hsl(var(--border))] pb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
            {contact.fullName}
          </h1>
          <p className="mt-1.5 text-lg font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
            {contact.title}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant={roleColor(contact.role)} className="border-[2px] border-[hsl(var(--border))] uppercase tracking-wider font-bold text-[10px] rounded px-2 py-0.5">
              {contact.role}
            </Badge>
            <span className="text-[hsl(var(--muted-foreground))] font-mono text-xs">at</span>
            <Link
              href={`/accounts/${contact.account.id}`}
              className="text-sm font-mono font-bold text-[hsl(var(--primary))] hover:underline uppercase tracking-wider"
            >
              {contact.account.name}
            </Link>
            <Badge variant="outline" className="border-[2px] uppercase tracking-wider font-bold text-[10px] rounded px-2 py-0.5">
              {contact.account.segment}
            </Badge>
          </div>
        </div>
        <div className="shrink-0 self-start md:self-auto">
          <ContactDetailClient contactId={contact.id} contactName={contact.fullName} />
        </div>
      </header>

      {/* Contact Info and Intelligence Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: GTM Lead Intelligence Card (Spans 2 columns on desktop) */}
        <Card className="md:col-span-2 border-[2px] border-[hsl(var(--border))] rounded-lg shadow-none overflow-hidden font-mono bg-[hsl(var(--card))]">
          <CardHeader className="border-b-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.15)] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))] flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse border border-black" />
                GTM Lead Intelligence Console
              </CardTitle>
              <Badge variant={enriched.engagementPriority === "high" ? "destructive" : enriched.engagementPriority === "medium" ? "default" : "secondary"} className="border-[2px] border-[hsl(var(--border))] text-[9px] font-bold uppercase tracking-wider">
                PRIORITY: {enriched.engagementPriority}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.1)] p-4 rounded">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Persona Classification</span>
                <p className="text-xs font-bold text-[hsl(var(--foreground))] uppercase">{enriched.persona}</p>
              </div>
              <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-[hsl(var(--border))] pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Influence Rating</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[hsl(var(--foreground))]">{enriched.influenceScore} / 99</span>
                  <div className="h-2 w-16 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] overflow-hidden rounded-sm">
                    <div className="h-full bg-yellow-500" style={{ width: `${(enriched.influenceScore / 99) * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-[hsl(var(--border))] pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Engagement Status</span>
                <div>
                  <span className={`inline-block px-1.5 py-0.5 border text-[9px] font-bold uppercase tracking-wider rounded-sm ${
                    enriched.engagementPriority === "high" 
                      ? "bg-red-500/10 border-red-500/30 text-red-500" 
                      : enriched.engagementPriority === "medium"
                      ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500"
                      : "bg-blue-500/10 border-blue-500/30 text-blue-500"
                  }`}>
                    {enriched.engagementPriority} cadence
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-[hsl(var(--muted-foreground))] flex items-center gap-1.5 tracking-wider">
                <span>[►]</span> Recommended Outreach Angle
              </span>
              <div className="p-4 border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)] relative overflow-hidden rounded">
                <p className="text-xs leading-relaxed text-[hsl(var(--foreground))] pl-2 font-mono">
                  {enriched.recommendedAngle}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Contact Details */}
        <Card className="border-[2px] border-[hsl(var(--border))] rounded-lg shadow-none overflow-hidden bg-[hsl(var(--card))]">
          <CardHeader className="border-b-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.1)] pb-4">
            <CardTitle className="font-mono text-xs uppercase tracking-wider">Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 font-mono text-[11px]">
            <div className="flex justify-between border-b border-[hsl(var(--border))] pb-2">
              <span className="text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Email Address</span>
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="text-[hsl(var(--primary))] font-bold hover:underline">
                  {contact.email}
                </a>
              ) : (
                <span className="text-[hsl(var(--muted-foreground))]">—</span>
              )}
            </div>
            <div className="flex justify-between border-b border-[hsl(var(--border))] pb-2">
              <span className="text-[hsl(var(--muted-foreground))] uppercase tracking-wider">LinkedIn Profile</span>
              {contact.linkedIn ? (
                <a
                  href={contact.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[hsl(var(--primary))] font-bold hover:underline uppercase"
                >
                  View Profile
                </a>
              ) : (
                <span className="text-[hsl(var(--muted-foreground))]">—</span>
              )}
            </div>
            <div className="flex justify-between border-b border-[hsl(var(--border))] pb-2">
              <span className="text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Created At</span>
              <span className="text-[hsl(var(--foreground))] font-bold">
                {new Date(contact.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Updated At</span>
              <span className="text-[hsl(var(--foreground))] font-bold">
                {new Date(contact.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Account Reference */}
        <Card className="border-[2px] border-[hsl(var(--border))] rounded-lg shadow-none overflow-hidden bg-[hsl(var(--card))]">
          <CardHeader className="border-b-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.1)] pb-4">
            <CardTitle className="font-mono text-xs uppercase tracking-wider">Account Context</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 font-mono text-xs space-y-4">
            <div className="border-[2px] border-[hsl(var(--border))] p-4 bg-[hsl(var(--muted)/0.1)] rounded space-y-3">
              <Link
                href={`/accounts/${contact.account.id}`}
                className="font-bold text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline block text-sm uppercase tracking-wider"
              >
                {contact.account.name}
              </Link>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-[2px] border-[hsl(var(--border))] uppercase text-[9px] font-bold rounded-sm px-1.5 py-0.5">
                  {contact.account.segment}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Sequence Activity */}
        <Card className="md:col-span-2 lg:col-span-3 border-[2px] border-[hsl(var(--border))] rounded-lg shadow-none overflow-hidden bg-[hsl(var(--card))]">
          <CardHeader className="border-b-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.15)] pb-4">
            <CardTitle className="font-mono text-xs uppercase tracking-wider">Outbound Sequence History</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {contact.recentSequences.length === 0 ? (
              <p className="text-xs font-mono uppercase tracking-wider text-[hsl(var(--muted-foreground))] py-6 text-center">
                No active sequence metrics logged for this lead
              </p>
            ) : (
              <ul className="space-y-3 font-mono text-xs">
                {contact.recentSequences.map((seq) => (
                  <li
                    key={seq.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between border-[2px] border-[hsl(var(--border))] p-3.5 bg-[hsl(var(--muted)/0.1)] gap-2 rounded"
                  >
                    <div>
                      <p className="font-bold text-[hsl(var(--foreground))] uppercase tracking-wide">{seq.title}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 uppercase">
                        TIMESTAMP: {new Date(seq.createdAt).toLocaleDateString()} at {new Date(seq.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        seq.status === "completed"
                          ? "success"
                          : seq.status === "active"
                          ? "default"
                          : "secondary"
                      }
                      className="border-[2px] border-[hsl(var(--border))] text-[9px] uppercase font-bold tracking-wider rounded-sm px-2 py-0.5 self-start sm:self-auto"
                    >
                      {seq.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
