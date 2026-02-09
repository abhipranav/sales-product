import { getActorFromRequest } from "@/lib/auth/actor";
import {
  ApprovalNotFoundError,
  ApprovalServiceUnavailableError,
  parseReviewApprovalInput,
  reviewApprovalRequest
} from "@/lib/services/approvals";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

interface RouteContext {
  params: Promise<{
    approvalId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = getActorFromRequest(request);
    const { approvalId } = await context.params;
    const payload = parseReviewApprovalInput(await request.json());
    const approval = await reviewApprovalRequest(approvalId, payload, actor);

    return NextResponse.json({ approval });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid approval review payload.",
          details: error.flatten()
        },
        { status: 400 }
      );
    }

    if (error instanceof ApprovalServiceUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof ApprovalNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Approval review failed", error);
    return NextResponse.json({ error: "Failed to review approval." }, { status: 500 });
  }
}
