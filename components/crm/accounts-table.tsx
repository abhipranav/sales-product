"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
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

interface Account {
  id: string;
  name: string;
  segment: "startup" | "mid-market" | "enterprise";
  website: string | null;
  employeeBand: string | null;
  contactCount: number;
  dealCount: number;
  createdAt: string;
}

interface AccountsTableProps {
  initialData?: {
    items: Account[];
    total: number;
    hasMore: boolean;
  };
  onCreateClick?: () => void;
}

export function AccountsTable({ initialData, onCreateClick }: AccountsTableProps) {
  const [accounts, setAccounts] = useState<Account[]>(initialData?.items ?? []);
  const [total, setTotal] = useState(initialData?.total ?? 0);
  const [hasMore, setHasMore] = useState(initialData?.hasMore ?? false);
  const [loading, setLoading] = useState(!initialData);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<string>("all");
  const [offset, setOffset] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSegment, setBulkSegment] = useState<string>("");
  const limit = 20;

  const allSelected = useMemo(
    () => accounts.length > 0 && accounts.every((a) => selectedIds.has(a.id)),
    [accounts, selectedIds]
  );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(accounts.map((a) => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkUpdateSegment = async () => {
    if (!bulkSegment || selectedIds.size === 0) return;
    let updated = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/accounts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segment: bulkSegment }),
        });
        if (res.ok) updated++;
      } catch { /* skip */ }
    }
    toast.success(`Updated segment for ${updated} account(s)`);
    setSelectedIds(new Set());
    setBulkSegment("");
    fetchAccounts();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} account(s)? This cannot be undone.`)) return;
    let deleted = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
        if (res.ok) deleted++;
      } catch { /* skip */ }
    }
    toast.success(`Deleted ${deleted} account(s)`);
    setSelectedIds(new Set());
    fetchAccounts();
  };

  const handleBulkExport = () => {
    const selected = accounts.filter((a) => selectedIds.has(a.id));
    const headers = ["Name", "Segment", "Website", "Employees", "Contacts", "Deals"];
    const rows = selected.map((a) => [
      a.name,
      a.segment,
      a.website ?? "",
      a.employeeBand ?? "",
      String(a.contactCount),
      String(a.dealCount),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accounts-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selected.length} account(s)`);
  };

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      params.set("offset", offset.toString());
      if (search) params.set("search", search);
      if (segment !== "all") params.set("segment", segment);

      const res = await fetch(`/api/accounts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.items);
        setTotal(data.total);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  }, [search, segment, offset]);

  useEffect(() => {
    if (!initialData || search || segment !== "all" || offset > 0) {
      fetchAccounts();
    }
  }, [fetchAccounts, initialData, search, segment, offset]);

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Accounts</CardTitle>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            className="w-64"
          />
          <Select
            value={segment}
            onValueChange={(value) => {
              setSegment(value);
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All segments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              <SelectItem value="startup">Startup</SelectItem>
              <SelectItem value="mid-market">Mid-Market</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          {onCreateClick && (
            <Button onClick={onCreateClick}>
              + New Account
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.05)] p-3">
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <Select value={bulkSegment} onValueChange={setBulkSegment}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Set segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="mid-market">Mid-Market</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" disabled={!bulkSegment} onClick={handleBulkUpdateSegment}>
                Apply
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkExport}>
                Export CSV
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-[hsl(var(--muted-foreground))]">Loading accounts...</div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-[hsl(var(--muted-foreground))]">No accounts found</p>
            {onCreateClick && (
              <Button variant="outline" className="mt-4" onClick={onCreateClick}>
                Create your first account
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[hsl(var(--border))]">
                  <tr>
                    <th className="px-2 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-[hsl(var(--border))] cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Account
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Segment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Contacts
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Deals
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Website
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {accounts.map((account) => (
                    <tr
                      key={account.id}
                      className={`group transition-colors hover:bg-[hsl(var(--muted)/0.5)] ${selectedIds.has(account.id) ? "bg-[hsl(var(--primary)/0.05)]" : ""}`}
                    >
                      <td className="px-2 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(account.id)}
                          onChange={() => toggleSelect(account.id)}
                          className="rounded border-[hsl(var(--border))] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/accounts/${account.id}`}
                          className="font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline"
                        >
                          {account.name}
                        </Link>
                        {account.employeeBand && (
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            {account.employeeBand} employees
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={segmentColor(account.segment)}>
                          {account.segment}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/contacts?accountId=${account.id}`}
                          className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline"
                        >
                          {account.contactCount}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/pipeline?accountId=${account.id}`}
                          className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline"
                        >
                          {account.dealCount}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {account.website ? (
                          <a
                            href={account.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[hsl(var(--primary))] hover:underline"
                          >
                            {new URL(account.website).hostname}
                          </a>
                        ) : (
                          <span className="text-sm text-[hsl(var(--muted-foreground))]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/accounts/${account.id}`}>
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
                Showing {offset + 1}–{Math.min(offset + accounts.length, total)} of {total} accounts
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
