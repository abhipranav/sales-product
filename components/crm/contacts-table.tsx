"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
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
import { buildStakeholderCoverage } from "@/lib/services/capabilities";

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
  const abortRef = useRef<AbortController | null>(null);
  const debouncedSearch = useDebouncedValue(search, 220);
  const normalizedSearch = debouncedSearch.trim();
  const limit = 20;

  const fetchContacts = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      params.set("offset", offset.toString());
      if (normalizedSearch) params.set("search", normalizedSearch);
      if (role !== "all") params.set("role", role);
      if (accountId) params.set("accountId", accountId);

      const res = await fetch(`/api/contacts?${params.toString()}`, {
        signal: controller.signal
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data.items);
        setTotal(data.total);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        toast.error("Failed to load contacts.");
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }, [normalizedSearch, role, offset, accountId]);

  useEffect(() => {
    if (!initialData || normalizedSearch || role !== "all" || offset > 0) {
      fetchContacts();
    }
  }, [fetchContacts, initialData, normalizedSearch, role, offset]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

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

  // Map state contacts to domain contacts for capabilities calculations
  const mappedContactsForCoverage = contacts.map(c => ({
    id: c.id,
    accountId: c.accountId,
    fullName: c.fullName,
    title: c.title,
    email: c.email || undefined,
    linkedInUrl: c.linkedIn || undefined,
    role: c.role
  }));

  const coverage = buildStakeholderCoverage(mappedContactsForCoverage);

  return (
    <Card className="border-[2px] border-[hsl(var(--border))] rounded-lg shadow-none overflow-hidden bg-[hsl(var(--card))]">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 pb-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.1)]">
        <CardTitle className="font-mono text-base uppercase tracking-wider text-[hsl(var(--foreground))]">
          Contacts Registry
        </CardTitle>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            className="w-full md:w-64 border-[2px] bg-[hsl(var(--muted)/0.35)]"
          />
          <Select
            value={role}
            onValueChange={(value) => {
              setRole(value);
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-full md:w-40 border-[2px] bg-[hsl(var(--muted)/0.35)] font-mono text-xs uppercase">
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
            <Button onClick={onCreateClick} variant="cta" className="w-full md:w-auto">
              + New Contact
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse font-mono text-xs uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              Querying database registry...
            </div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center font-mono">
            <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">No records returned</p>
            {onCreateClick && (
              <Button variant="outline" className="mt-4" onClick={onCreateClick}>
                Add first registry entry
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* STAKEHOLDER COVERAGE ANALYTICS INSTRUMENT */}
            <div className="mb-6 p-4 border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)] font-mono">
              <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
                  Stakeholder Coverage Instrument
                </span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase">
                  Status: Active Analysis
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { role: "champion", label: "CHAMPION", active: coverage.hasChampion, color: "text-[hsl(var(--success))] border-[hsl(var(--success))] bg-[hsl(var(--success))/0.08]" },
                  { role: "approver", label: "APPROVER", active: coverage.hasApprover, color: "text-blue-500 border-blue-500 bg-blue-500/0.08" },
                  { role: "blocker", label: "BLOCKER", active: coverage.hasBlocker, color: "text-red-500 border-red-500 bg-red-500/0.08" },
                  { role: "influencer", label: "INFLUENCER", active: coverage.hasInfluencer, color: "text-yellow-500 border-yellow-500 bg-yellow-500/0.08" }
                ].map((item) => (
                  <div
                    key={item.role}
                    className={`flex items-center justify-between p-2 border-[2px] text-[11px] transition-colors ${
                      item.active 
                        ? `${item.color} font-bold` 
                        : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] bg-transparent opacity-50 font-normal"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[9px] tracking-wide font-bold">{item.active ? "[ COVERED ]" : "[ MISSING ]"}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[11px] flex flex-col md:flex-row md:items-center justify-between text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted)/0.4)] p-2.5 border border-[hsl(var(--border))] gap-2">
                <span className="tracking-wide">SYSTEM DIAGNOSIS: {coverage.gapSummary}</span>
                {coverage.gapSummary.includes("Missing") ? (
                  <span className="text-yellow-500 font-bold px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/30 text-[9px] uppercase tracking-wider relative overflow-hidden shrink-0 self-start md:self-auto">
                    Coverage Deficit Detected
                  </span>
                ) : (
                  <span className="text-[hsl(var(--success))] font-bold px-1.5 py-0.5 bg-[hsl(var(--success))/0.1] border border-[hsl(var(--success))/0.3] text-[9px] uppercase tracking-wider shrink-0 self-start md:self-auto">
                    Full Coverage Secured
                  </span>
                )}
              </div>
            </div>

            {/* HIGH-DENSITY INTEL TABLE */}
            <div className="overflow-x-auto border-[2px] border-[hsl(var(--border))] rounded">
              <table className="w-full border-collapse">
                <thead className="border-b-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] font-mono text-[11px] font-bold text-[hsl(var(--muted-foreground))]">
                  <tr>
                    <th className="px-4 py-3 text-left uppercase tracking-wider border-r-[2px] border-[hsl(var(--border))] last:border-r-0">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left uppercase tracking-wider border-r-[2px] border-[hsl(var(--border))] last:border-r-0">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left uppercase tracking-wider border-r-[2px] border-[hsl(var(--border))] last:border-r-0">
                      Account
                    </th>
                    <th className="px-4 py-3 text-left uppercase tracking-wider border-r-[2px] border-[hsl(var(--border))] last:border-r-0">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left uppercase tracking-wider border-r-[2px] border-[hsl(var(--border))] last:border-r-0">
                      Email
                    </th>
                    <th className="px-4 py-3 text-right uppercase tracking-wider last:border-r-0">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-[2px] divide-[hsl(var(--border))] font-mono text-[12px]">
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="group transition-colors hover:bg-[hsl(var(--muted)/0.5)]"
                    >
                      <td className="px-4 py-3 border-r-[2px] border-[hsl(var(--border))] last:border-r-0">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="font-bold text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline"
                        >
                          {contact.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 border-r-[2px] border-[hsl(var(--border))] last:border-r-0 text-[hsl(var(--muted-foreground))]">
                        {contact.title}
                      </td>
                      <td className="px-4 py-3 border-r-[2px] border-[hsl(var(--border))] last:border-r-0">
                        <Link
                          href={`/accounts/${contact.accountId}`}
                          className="text-[hsl(var(--primary))] hover:underline font-bold"
                        >
                          {contact.accountName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 border-r-[2px] border-[hsl(var(--border))] last:border-r-0">
                        <Badge variant={roleColor(contact.role)} className="border-[2px] border-[hsl(var(--border))] font-bold text-[9px] uppercase tracking-wider rounded-sm px-1.5 py-0.5">
                          {contact.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 border-r-[2px] border-[hsl(var(--border))] last:border-r-0 text-[hsl(var(--muted-foreground))] font-mono text-[11px]">
                        {contact.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-right last:border-r-0">
                        <Link href={`/contacts/${contact.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-[10px] uppercase font-bold border-[2px] border-transparent hover:border-[hsl(var(--border))] rounded">
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
            <div className="mt-4 flex items-center justify-between border-t-[2px] border-[hsl(var(--border))] pt-4 font-mono text-[11px]">
              <p className="text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Showing {offset + 1}–{Math.min(offset + contacts.length, total)} of {total} entries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  className="h-8 text-[10px] uppercase"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore}
                  onClick={() => setOffset(offset + limit)}
                  className="h-8 text-[10px] uppercase"
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
