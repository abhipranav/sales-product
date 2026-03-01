"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { OutboundApproval } from "@/lib/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ApprovalQueueProps {
  approvals: OutboundApproval[];
}

export function ApprovalQueue({ approvals }: ApprovalQueueProps) {
  const router = useRouter();
  const [busyApprovalId, setBusyApprovalId] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  async function handleApprove(approvalId: string) {
    if (busyApprovalId) {
      return;
    }

    setBusyApprovalId(approvalId);
    toast.loading("Approving outbound draft...", { id: `approval-${approvalId}` });

    try {
      const response = await fetch(`/api/approvals/${approvalId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ decision: "approved" })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? "Failed to approve draft.", { id: `approval-${approvalId}` });
        return;
      }

      const dispatch = payload?.approval?.dispatch;
      if (dispatch?.status === "failed") {
        toast.error(`Approved, but send failed: ${dispatch.error ?? "Unknown error"}`, { id: `approval-${approvalId}` });
      } else if (dispatch?.status === "already-sent") {
        toast.success("Approved. Outbound artifact was already sent.", { id: `approval-${approvalId}` });
      } else if (dispatch?.status === "sent") {
        toast.success(`Approved and sent (${dispatch.provider ?? "provider"}).`, { id: `approval-${approvalId}` });
      } else {
        toast.success("Approved.", { id: `approval-${approvalId}` });
      }

      router.refresh();
    } catch {
      toast.error("Failed to approve draft.", { id: `approval-${approvalId}` });
    } finally {
      setBusyApprovalId(null);
    }
  }

  async function handleReject(approvalId: string) {
    if (busyApprovalId) {
      return;
    }

    const rejectionReason = (rejectionReasons[approvalId] ?? "").trim();
    if (rejectionReason.length < 3) {
      toast.error("Rejection reason must be at least 3 characters.");
      return;
    }

    setBusyApprovalId(approvalId);
    toast.loading("Rejecting outbound draft...", { id: `approval-${approvalId}` });

    try {
      const response = await fetch(`/api/approvals/${approvalId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ decision: "rejected", rejectionReason })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? "Failed to reject draft.", { id: `approval-${approvalId}` });
        return;
      }

      toast.success("Rejected.", { id: `approval-${approvalId}` });
      setRejectionReasons((current) => ({ ...current, [approvalId]: "" }));
      router.refresh();
    } catch {
      toast.error("Failed to reject draft.", { id: `approval-${approvalId}` });
    } finally {
      setBusyApprovalId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-['Sora',sans-serif]">Outbound Approval Queue</CardTitle>
        <Badge variant="secondary">Human-in-Loop</Badge>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {approvals.length === 0 ? (
            <li className=" bg-[hsl(var(--muted))] p-3 text-sm text-[hsl(var(--muted-foreground))]">No approval requests yet.</li>
          ) : (
            approvals.map((approval) => (
              <li key={approval.id} className=" border border-zinc-100 bg-[hsl(var(--muted))] p-3">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="font-medium text-[hsl(var(--foreground))]">{approval.subject}</p>
                  <Badge variant="outline">{approval.status}</Badge>
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{approval.body}</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Requested by {approval.requestedBy} via {approval.channel} on {new Date(approval.createdAt).toLocaleString()}
                </p>
                {approval.status === "pending" ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="success"
                      size="sm"
                      onClick={() => handleApprove(approval.id)}
                      disabled={busyApprovalId !== null}
                    >
                      Approve
                    </Button>
                    <div className="flex items-center gap-2">
                      <Input
                        value={rejectionReasons[approval.id] ?? ""}
                        onChange={(event) =>
                          setRejectionReasons((current) => ({
                            ...current,
                            [approval.id]: event.target.value
                          }))
                        }
                        required
                        minLength={3}
                        placeholder="Reason"
                        className="h-8 text-xs"
                        disabled={busyApprovalId !== null}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(approval.id)}
                        disabled={busyApprovalId !== null}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
