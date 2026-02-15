import { notFound } from "next/navigation";
import Link from "next/link";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { getAccount } from "@/lib/services/crm-records";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AccountDetailClient } from "./client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailPage({ params }: PageProps) {
  const { id } = await params;
  const actor = await getActorFromServerContext();

  let account;
  try {
    account = await getAccount(id, actor);
  } catch {
    notFound();
  }

  const segmentColor = (seg: string) => {
    switch (seg) {
      case "enterprise":
        return "default";
      case "mid-market":
        return "secondary";
      case "startup":
        return "outline";
      default:
        return "secondary";
    }
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
      <nav className="mb-4 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
        <Link href="/accounts" className="hover:text-[hsl(var(--foreground))]">
          Accounts
        </Link>
        <span>/</span>
        <span className="text-[hsl(var(--foreground))]">{account.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-['Sora',sans-serif] text-3xl font-bold text-[hsl(var(--foreground))]">
            {account.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={segmentColor(account.segment)}>{account.segment}</Badge>
            {account.employeeBand && (
              <Badge variant="outline">{account.employeeBand} employees</Badge>
            )}
            {account.website && (
              <a
                href={account.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[hsl(var(--primary))] hover:underline"
              >
                {account.website}
              </a>
            )}
          </div>
        </div>
        <AccountDetailClient accountId={account.id} accountName={account.name} />
      </header>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Link href={`/contacts?accountId=${account.id}` as "/contacts"} className="block">
          <Card className="h-full transition-colors hover:border-[hsl(var(--primary)/0.3)] cursor-pointer">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{account.counts.contacts}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Contacts</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/pipeline?accountId=${account.id}` as "/pipeline"} className="block">
          <Card className="h-full transition-colors hover:border-[hsl(var(--primary)/0.3)] cursor-pointer">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{account.counts.deals}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Deals</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/intelligence" className="block">
          <Card className="h-full transition-colors hover:border-[hsl(var(--primary)/0.3)] cursor-pointer">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{account.counts.signals}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Signals</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Contacts</CardTitle>
            <Link href={`/contacts?accountId=${account.id}` as "/contacts"}>
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {account.contacts.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No contacts yet</p>
            ) : (
              <ul className="space-y-3">
                {account.contacts.map((contact) => (
                  <li
                    key={contact.id}
                    className="flex items-center justify-between rounded-md border border-[hsl(var(--border))] p-3 transition-colors hover:bg-[hsl(var(--muted)/0.5)]"
                  >
                    <div>
                      <Link
                        href={`/contacts/${contact.id}` as "/contacts"}
                        className="font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline"
                      >
                        {contact.fullName}
                      </Link>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">{contact.title}</p>
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="text-xs text-[hsl(var(--primary))] hover:underline">{contact.email}</a>
                      )}
                    </div>
                    <Badge variant={roleColor(contact.role)}>{contact.role}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Deals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Deals</CardTitle>
            <Link href={`/pipeline?accountId=${account.id}` as "/pipeline"}>
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {account.deals.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No deals yet</p>
            ) : (
              <ul className="space-y-3">
                {account.deals.map((deal) => (
                  <li
                    key={deal.id}
                    className="rounded-md border border-[hsl(var(--border))] p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          href={`/pipeline/${deal.id}` as "/pipeline"}
                          className="font-medium text-[hsl(var(--foreground))] hover:underline"
                        >
                          {deal.name}
                        </Link>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          ${deal.amount.toLocaleString()} · {Math.round(deal.confidence * 100)}% confidence
                        </p>
                      </div>
                      <Badge variant="secondary">{deal.stage}</Badge>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                      <Link href={`/pipeline/${deal.id}` as "/pipeline"} className="hover:text-[hsl(var(--primary))] hover:underline">
                        {deal.taskCount} tasks
                      </Link>
                      <Link href={`/pipeline/${deal.id}` as "/pipeline"} className="hover:text-[hsl(var(--primary))] hover:underline">
                        {deal.activityCount} activities
                      </Link>
                      <span>Close: {new Date(deal.closeDate).toLocaleDateString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Signals */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Signals</CardTitle>
          </CardHeader>
          <CardContent>
            {account.signals.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No signals detected yet</p>
            ) : (
              <ul className="space-y-3">
                {account.signals.map((signal) => (
                  <li
                    key={signal.id}
                    className="flex items-center justify-between rounded-md border border-[hsl(var(--border))] p-3"
                  >
                    <div>
                      <p className="font-medium text-[hsl(var(--foreground))]">{signal.summary}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {signal.type.toUpperCase()} · {new Date(signal.happenedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={signal.score >= 75 ? "success" : signal.score >= 50 ? "warning" : "secondary"}
                    >
                      Score: {signal.score}
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
