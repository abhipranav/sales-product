"use server";

import { getActorFromServerContext } from "@/lib/auth/actor";
import {
  ApprovalDealNotFoundError,
  ApprovalNotFoundError,
  ApprovalServiceUnavailableError,
  createApprovalRequest,
  parseCreateApprovalInput,
  parseReviewApprovalInput,
  reviewApprovalRequest
} from "@/lib/services/approvals";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { revalidateDashboardViews } from "@/lib/services/cache-invalidation";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "actions/approvals" });

export async function queueApprovalAction(formData: FormData) {
  try {
    const actor = await getActorFromServerContext();
    const payload = parseCreateApprovalInput({
      dealId: String(formData.get("dealId") ?? "").trim(),
      channel: String(formData.get("channel") ?? "email"),
      subject: String(formData.get("subject") ?? "").trim(),
      body: String(formData.get("body") ?? "").trim()
    });

    await createApprovalRequest(payload, actor);
    revalidateDashboardViews();
  } catch (error) {
    if (
      error instanceof ApprovalServiceUnavailableError ||
      error instanceof ApprovalDealNotFoundError ||
      error instanceof WorkspaceAccessDeniedError
    ) {
      log.warn("Approval queue skipped", { action: "queue" }, error);
      return;
    }

    log.error("Queue approval action failed", { action: "queue" }, error);
  }
}

export async function approveApprovalAction(formData: FormData) {
  const approvalId = String(formData.get("approvalId") ?? "").trim();

  if (!approvalId) {
    return;
  }

  try {
    const actor = await getActorFromServerContext();
    const payload = parseReviewApprovalInput({ decision: "approved" });
    await reviewApprovalRequest(approvalId, payload, actor);
    revalidateDashboardViews();
  } catch (error) {
    if (
      error instanceof ApprovalServiceUnavailableError ||
      error instanceof ApprovalNotFoundError ||
      error instanceof WorkspaceAccessDeniedError
    ) {
      log.warn("Approval approve skipped", { action: "approve" }, error);
      return;
    }

    log.error("Approve approval action failed", { action: "approve" }, error);
  }
}

export async function rejectApprovalAction(formData: FormData) {
  const approvalId = String(formData.get("approvalId") ?? "").trim();
  const rejectionReason = String(formData.get("rejectionReason") ?? "").trim();

  if (!approvalId) {
    return;
  }

  try {
    const actor = await getActorFromServerContext();
    const payload = parseReviewApprovalInput({ decision: "rejected", rejectionReason });
    await reviewApprovalRequest(approvalId, payload, actor);
    revalidateDashboardViews();
  } catch (error) {
    if (
      error instanceof ApprovalServiceUnavailableError ||
      error instanceof ApprovalNotFoundError ||
      error instanceof WorkspaceAccessDeniedError
    ) {
      log.warn("Approval reject skipped", { action: "reject" }, error);
      return;
    }

    log.error("Reject approval action failed", { action: "reject" }, error);
  }
}
