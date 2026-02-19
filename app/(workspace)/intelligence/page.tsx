import Link from "next/link";
import { FollowUpComposer } from "@/components/cockpit/follow-up-composer";
import { MeetingBriefCard } from "@/components/cockpit/meeting-brief";
import { MeetingNotesCapture } from "@/components/cockpit/meeting-notes-capture";
import { StrategyLab } from "@/components/cockpit/strategy-lab";
import { BuyingSignalAlerts } from "@/components/cockpit/buying-signal-alerts";
import { SequencePersonalization } from "@/components/cockpit/sequence-personalization";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { getCachedDashboardData } from "@/lib/services/dashboard-cache";

export default async function IntelligencePage() {
  const actor = await getActorFromServerContext();
  const data = await getCachedDashboardData(actor, "/intelligence");

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="mb-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">INTELLIGENCE // DEAL_STUDIO</p>
        <h2 className="font-serif text-3xl font-bold text-[hsl(var(--foreground))]">Deal Intelligence Studio</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          From transcripts and signals to next-best strategic moves.{" · "}
          <Link
            href={`/pipeline/${data.deal.id}` as "/pipeline"}
            className="text-[hsl(var(--foreground))] font-bold hover:underline"
          >
            {data.deal.name}
          </Link>
          {" · "}
          <Link
            href={`/accounts/${data.account.id}` as "/accounts"}
            className="text-[hsl(var(--foreground))] font-bold hover:underline"
          >
            {data.account.name}
          </Link>
        </p>
      </header>

      <section className="mb-4 grid gap-4 md:grid-cols-3">
        <Link href="/notifications" className="block">
          <Card className="h-full transition-all duration-150 hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))] cursor-pointer group">
            <CardHeader>
              <CardTitle className="font-mono text-xs uppercase tracking-wider group-hover:text-[hsl(var(--background))]">SIGNAL_STRENGTH</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--background))]">
                {Math.round(data.account.signals.reduce((sum, signal) => sum + signal.score, 0) / data.account.signals.length || 0)}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]/60">Average account signal score</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">STRATEGY_PLAYS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{data.strategyPlays.length}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">AI-generated active plays</p>
          </CardContent>
        </Card>
        <Link href={`/pipeline/${data.deal.id}` as "/pipeline"} className="block">
          <Card className="h-full transition-all duration-150 hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))] cursor-pointer group">
            <CardHeader>
              <CardTitle className="font-mono text-xs uppercase tracking-wider group-hover:text-[hsl(var(--background))]">CURRENT_STAGE</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{data.deal.stage}</Badge>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]/60">Confidence {Math.round(data.deal.confidence * 100)}%</p>
            </CardContent>
          </Card>
        </Link>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <BuyingSignalAlerts deal={data.deal} signals={data.account.signals} />
          <MeetingBriefCard brief={data.meetingBrief} />
          <MeetingNotesCapture dealId={data.deal.id} />
        </div>
        <div className="space-y-4">
          <StrategyLab plays={data.strategyPlays} dealId={data.deal.id} />
          <SequencePersonalization contacts={data.contacts} deal={data.deal} signals={data.account.signals} />
          <FollowUpComposer dealId={data.deal.id} draft={data.followUpDraft} />
        </div>
      </section>
    </section>
  );
}
