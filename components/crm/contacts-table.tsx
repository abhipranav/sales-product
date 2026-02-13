"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface Contact {
  id: string;
  fullName: string;
  title: string;
  email: string | null;
  linkedIn: string | null;
  role: "champion" | "approver" | "blocker" | "influencer";
  accountId: string;
  accountName: string;
  createdAt: string;
}

interface ContactsTableProps {
  initialData?: {
    items: Contact[];
    total: number;
    hasMore: boolean;
  };
  accountId?: string;
  onCreateClick?: () => void;
}

export function ContactsTable({ initialData, accountId, onCreateClick }: ContactsTableProps) {
  const [contacts, setContacts] = useState<Contact[]>(initialData?.items ?? []);
  const [total, setTotal] = useState(initialData?.total ?? 0);
  const [hasMore, setHasMore] = useState(initialData?.hasMore ?? false);
  const [loading, setLoading] = useState(!initialData);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      params.set("offset", offset.toString());
      if (search) params.set("search", search);
      if (role !== "all") params.set("role", role);
      if (accountId) params.set("accountId", accountId);

      const res = await fetch(`/api/contacts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data.items);
        setTotal(data.total);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  }, [search, role, offset, accountId]);

  useEffect(() => {
    if (!initialData || search || role !== "all" || offset > 0) {
      fetchContacts();
    }
  }, [fetchContacts, initialData, search, role, offset]);

  const roleColor = (r: string) => {
    switch (r) {
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Contacts</CardTitle>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            className="w-64"
          />
          <Select
            value={role}
            onValueChange={(value) => {
              setRole(value);
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="champion">Champion</SelectItem>
              <SelectItem value="approver">Approver</SelectItem>
              <SelectItem value="blocker">Blocker</SelectItem>
              <SelectItem value="influencer">Influencer</SelectItem>
            </SelectContent>
          </Select>
          {onCreateClick && (
            <Button onClick={onCreateClick}>
              + New Contact
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-[hsl(var(--muted-foreground))]">Loading contacts...</div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-[hsl(var(--muted-foreground))]">No contacts found</p>
            {onCreateClick && (
              <Button variant="outline" className="mt-4" onClick={onCreateClick}>
                Create your first contact
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[hsl(var(--border))]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Account
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Email
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="group transition-colors hover:bg-[hsl(var(--muted)/0.5)]"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline"
                        >
                          {contact.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
                        {contact.title}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/accounts/${contact.accountId}`}
                          className="text-sm text-[hsl(var(--primary))] hover:underline"
                        >
                          {contact.accountName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={roleColor(contact.role)}>
                          {contact.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
                        {contact.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/contacts/${contact.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between border-t border-[hsl(var(--border))] pt-4">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Showing {offset + 1}–{Math.min(offset + contacts.length, total)} of {total} contacts
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore}
                  onClick={() => setOffset(offset + limit)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
