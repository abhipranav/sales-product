import { getActorFromRequest } from "@/lib/auth/actor";
import {
  ApprovalDealNotFoundError,
  ApprovalServiceUnavailableError,
  createApprovalRequest,
  listApprovalRequests,
  parseCreateApprovalInput
} from "@/lib/services/approvals";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export async function GET(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const url = new URL(request.url);
    const dealId = url.searchParams.get("dealId") ?? undefined;
    const statusRaw = url.searchParams.get("status") ?? undefined;
    const limitRaw = Number(url.searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 50) : 20;
    const status =
      statusRaw === "pending" || statusRaw === "approved" || statusRaw === "rejected" ? statusRaw : undefined;

    const approvals = await listApprovalRequests({ dealId, status, limit }, actor);
    return NextResponse.json({ approvals });
  } catch (error) {
    if (error instanceof ApprovalServiceUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof ApprovalDealNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Approval list failed", error);
    return NextResponse.json({ error: "Failed to fetch approvals." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const payload = parseCreateApprovalInput(await request.json());
    const approval = await createApprovalRequest(payload, actor);

    return NextResponse.json({ approval }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid approval payload.",
          details: error.flatten()
        },
        { status: 400 }
      );
    }

    if (error instanceof ApprovalServiceUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof ApprovalDealNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Approval create failed", error);
    return NextResponse.json({ error: "Failed to create approval request." }, { status: 500 });
  }
}
