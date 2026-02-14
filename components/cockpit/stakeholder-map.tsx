import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Contact } from "@/lib/domain/types";
import { buildStakeholderCoverage } from "@/lib/services/capabilities";

interface StakeholderMapProps {
  contacts: Contact[];
}

function getContactsByRole(contacts: Contact[], role: Contact["role"]) {
  return contacts.filter((contact) => contact.role === role);
}

function hasRole(contacts: Contact[], role: Contact["role"]) {
  return contacts.some((contact) => contact.role === role);
}

export function StakeholderMap({ contacts }: StakeholderMapProps) {
  const coverage = buildStakeholderCoverage(contacts);

  const roleCards = [
    { role: "champion" as const, label: "Champion", hasVariant: coverage.hasChampion, variantTrue: "success", variantFalse: "destructive", statusTrue: "covered", statusFalse: "missing" },
    { role: "approver" as const, label: "Approver", hasVariant: coverage.hasApprover, variantTrue: "success", variantFalse: "destructive", statusTrue: "covered", statusFalse: "missing" },
    { role: "blocker" as const, label: "Blocker", hasVariant: coverage.hasBlocker, variantTrue: "warning", variantFalse: "secondary", statusTrue: "identified", statusFalse: "none" },
    { role: "influencer" as const, label: "Influencer", hasVariant: coverage.hasInfluencer, variantTrue: "success", variantFalse: "warning", statusTrue: "covered", statusFalse: "gap" }
  ] as const;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-['Sora',sans-serif]">Stakeholder Mapping</CardTitle>
        <Link href="/contacts" className="text-xs text-[hsl(var(--primary))] hover:underline">
          View All
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {roleCards.map((card) => {
            const roleContacts = getContactsByRole(contacts, card.role);
            return (
              <div key={card.role} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">{card.label}</p>
                <Badge variant={card.hasVariant ? card.variantTrue : card.variantFalse}>
                  {card.hasVariant ? card.statusTrue : card.statusFalse}
                </Badge>
                {roleContacts.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {roleContacts.slice(0, 2).map((contact) => (
                      <Link
                        key={contact.id}
                        href={`/contacts/${contact.id}` as "/contacts"}
                        className="block text-xs text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline"
                      >
                        {contact.fullName}
                      </Link>
                    ))}
                    {roleContacts.length > 2 && (
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        +{roleContacts.length - 2} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">No contacts</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-sm text-[hsl(var(--foreground))]">
          {coverage.gapSummary}
        </div>

        <ul className="space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
          {hasRole(contacts, "champion") ? <li>• Champion identified for internal alignment.</li> : null}
          {hasRole(contacts, "approver") ? <li>• Approver route available for commercial sign-off.</li> : null}
          {hasRole(contacts, "blocker") ? <li>• Blocker presence detected. Run proactive objection handling.</li> : null}
          {hasRole(contacts, "influencer") ? <li>• Influencer channel available for consensus building.</li> : null}
        </ul>
      </CardContent>
    </Card>
  );
}
