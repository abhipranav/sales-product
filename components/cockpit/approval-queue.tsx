import type { OutboundApproval } from "@/lib/domain/types";
import { approveApprovalAction, rejectApprovalAction } from "@/app/actions/approvals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ApprovalQueueProps {
  approvals: OutboundApproval[];
}

export function ApprovalQueue({ approvals }: ApprovalQueueProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-['Sora',sans-serif]">Outbound Approval Queue</CardTitle>
        <Badge variant="secondary">Human-in-Loop</Badge>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {approvals.length === 0 ? (
            <li className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">No approval requests yet.</li>
          ) : (
            approvals.map((approval) => (
              <li key={approval.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="font-medium text-zinc-900">{approval.subject}</p>
                  <Badge variant="outline">{approval.status}</Badge>
                </div>
                <p className="text-sm text-zinc-700">{approval.body}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Requested by {approval.requestedBy} via {approval.channel} on {new Date(approval.createdAt).toLocaleString()}
                </p>
                {approval.status === "pending" ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <form action={approveApprovalAction}>
                      <input type="hidden" name="approvalId" value={approval.id} />
                      <Button type="submit" variant="success" size="sm">
                        Approve
                      </Button>
                    </form>
                    <form action={rejectApprovalAction} className="flex items-center gap-2">
                      <input type="hidden" name="approvalId" value={approval.id} />
                      <Input name="rejectionReason" required minLength={3} placeholder="Reason" className="h-8 text-xs" />
                      <Button type="submit" variant="destructive" size="sm">
                        Reject
                      </Button>
                    </form>
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
