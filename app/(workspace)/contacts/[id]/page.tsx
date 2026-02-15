import { notFound } from "next/navigation";
import Link from "next/link";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { getContact } from "@/lib/services/crm-records";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactDetailClient } from "./client";

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
        <Link href="/contacts" className="hover:text-[hsl(var(--foreground))]">
          Contacts
        </Link>
        <span>/</span>
        <span className="text-[hsl(var(--foreground))]">{contact.fullName}</span>
      </nav>

      {/* Header */}
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-['Sora',sans-serif] text-3xl font-bold text-[hsl(var(--foreground))]">
            {contact.fullName}
          </h1>
          <p className="mt-1 text-lg text-[hsl(var(--muted-foreground))]">{contact.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={roleColor(contact.role)}>{contact.role}</Badge>
            <Link
              href={`/accounts/${contact.account.id}`}
              className="text-sm text-[hsl(var(--primary))] hover:underline"
            >
              {contact.account.name}
            </Link>
            <Badge variant="outline">{contact.account.segment}</Badge>
          </div>
        </div>
        <ContactDetailClient contactId={contact.id} contactName={contact.fullName} />
      </header>

      {/* Contact Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">Email</span>
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="text-sm text-[hsl(var(--primary))] hover:underline">
                  {contact.email}
                </a>
              ) : (
                <span className="text-sm text-[hsl(var(--muted-foreground))]">—</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">LinkedIn</span>
              {contact.linkedIn ? (
                <a
                  href={contact.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[hsl(var(--primary))] hover:underline"
                >
                  View Profile
                </a>
              ) : (
                <span className="text-sm text-[hsl(var(--muted-foreground))]">—</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">Created</span>
              <span className="text-sm text-[hsl(var(--foreground))]">
                {new Date(contact.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">Updated</span>
              <span className="text-sm text-[hsl(var(--foreground))]">
                {new Date(contact.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-[hsl(var(--border))] p-4">
              <Link
                href={`/accounts/${contact.account.id}`}
                className="font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline"
              >
                {contact.account.name}
              </Link>
              <div className="mt-2">
                <Badge variant="outline">{contact.account.segment}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sequence Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {contact.recentSequences.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No sequence activity yet</p>
            ) : (
              <ul className="space-y-3">
                {contact.recentSequences.map((seq) => (
                  <li
                    key={seq.id}
                    className="flex items-center justify-between rounded-md border border-[hsl(var(--border))] p-3"
                  >
                    <div>
                      <p className="font-medium text-[hsl(var(--foreground))]">{seq.title}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {new Date(seq.createdAt).toLocaleDateString()}
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
