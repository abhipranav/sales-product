import Link from "next/link";
import type { Contact, Deal, Signal } from "@/lib/domain/types";
import { ScorePill } from "@/components/ui/score-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DealHealthProps {
  deal: Deal;
  contacts: Contact[];
  signals: Signal[];
}

export function DealHealth({ deal, contacts, signals }: DealHealthProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-['Sora',sans-serif]">Deal Health</CardTitle>
        <Link
          href={`/pipeline/${deal.id}` as "/pipeline"}
          className="text-xs text-[hsl(var(--primary))] hover:underline"
        >
          View Detail →
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 text-sm text-[hsl(var(--muted-foreground))]">
          <p>
            <span className="font-semibold text-[hsl(var(--foreground))]">Stage:</span>{" "}
            <Link href="/pipeline" className="text-[hsl(var(--primary))] hover:underline">
              {deal.stage}
            </Link>
          </p>
          <p>
            <span className="font-semibold text-[hsl(var(--foreground))]">Confidence:</span> {Math.round(deal.confidence * 100)}%
          </p>
          <p>
            <span className="font-semibold text-[hsl(var(--foreground))]">Risk:</span> {deal.riskSummary}
          </p>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">Stakeholders</h3>
            <Link href="/contacts" className="text-xs text-[hsl(var(--primary))] hover:underline">
              View All
            </Link>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
            {contacts.map((contact) => (
              <li key={contact.id} className="rounded px-1 py-0.5 transition-colors hover:bg-[hsl(var(--muted))]">
                <Link
                  href={`/contacts/${contact.id}` as "/contacts"}
                  className="hover:text-[hsl(var(--primary))]"
                >
                  <span className="font-medium text-[hsl(var(--foreground))]">{contact.fullName}</span>
                </Link>
                {" · "}{contact.title} · {contact.role}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">Signals</h3>
            <Link href="/intelligence" className="text-xs text-[hsl(var(--primary))] hover:underline">
              View All
            </Link>
          </div>
          <ul className="mt-2 space-y-2">
            {signals.map((signal) => (
              <li key={signal.id} className="flex items-center justify-between gap-2  bg-[hsl(var(--muted))] p-2 transition-colors hover:bg-[hsl(var(--muted))]">
                <Link href="/intelligence" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]">
                  {signal.summary}
                </Link>
                <ScorePill score={signal.score} />
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
