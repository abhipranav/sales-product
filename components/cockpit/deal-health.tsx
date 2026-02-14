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
        <div className="grid gap-2 text-sm text-zinc-700">
          <p>
            <span className="font-semibold text-zinc-900">Stage:</span>{" "}
            <Link href="/pipeline" className="text-[hsl(var(--primary))] hover:underline">
              {deal.stage}
            </Link>
          </p>
          <p>
            <span className="font-semibold text-zinc-900">Confidence:</span> {Math.round(deal.confidence * 100)}%
          </p>
          <p>
            <span className="font-semibold text-zinc-900">Risk:</span> {deal.riskSummary}
          </p>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Stakeholders</h3>
            <Link href="/contacts" className="text-xs text-[hsl(var(--primary))] hover:underline">
              View All
            </Link>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-zinc-700">
            {contacts.map((contact) => (
              <li key={contact.id} className="rounded px-1 py-0.5 transition-colors hover:bg-zinc-50">
                <Link
                  href={`/contacts/${contact.id}` as "/contacts"}
                  className="hover:text-[hsl(var(--primary))]"
                >
                  <span className="font-medium text-zinc-900">{contact.fullName}</span>
                </Link>
                {" · "}{contact.title} · {contact.role}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Signals</h3>
            <Link href="/intelligence" className="text-xs text-[hsl(var(--primary))] hover:underline">
              View All
            </Link>
          </div>
          <ul className="mt-2 space-y-2">
            {signals.map((signal) => (
              <li key={signal.id} className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 p-2 transition-colors hover:bg-zinc-100">
                <Link href="/intelligence" className="text-sm text-zinc-700 hover:text-[hsl(var(--primary))]">
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
