import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Contact, Signal } from "@/lib/domain/types";
import { enrichContacts, findContactDedupeClusters } from "@/lib/services/capabilities";

interface LeadEnrichmentDedupeProps {
  contacts: Contact[];
  signals: Signal[];
}

export function LeadEnrichmentDedupe({ contacts, signals }: LeadEnrichmentDedupeProps) {
  const enriched = enrichContacts(contacts, signals);
  const dedupeClusters = findContactDedupeClusters(contacts);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-['Sora',sans-serif]">Lead Enrichment + Dedupe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {enriched.map((contact) => (
            <li key={contact.contactId} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {contact.fullName} · {contact.title}
                </p>
                <Badge variant={contact.engagementPriority === "high" ? "success" : contact.engagementPriority === "medium" ? "warning" : "secondary"}>
                  {contact.influenceScore}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {contact.persona} · role {contact.role}
              </p>
              <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">{contact.recommendedAngle}</p>
            </li>
          ))}
        </ul>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Potential Duplicates</p>
          {dedupeClusters.length === 0 ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">No duplicate candidates found.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {dedupeClusters.map((cluster) => (
                <li key={cluster.key} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                  <p className="font-medium">Reason: {cluster.reason === "email" ? "same email" : "same name + title"}</p>
                  <p className="text-xs">{cluster.contacts.map((contact) => contact.fullName).join(" · ")}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
