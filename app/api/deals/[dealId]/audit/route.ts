import { getActorFromRequest } from "@/lib/auth/actor";
import { getPrismaClient } from "@/lib/db/prisma";
import { getRecentAuditEvents } from "@/lib/services/audit";
import { resolveWorkspaceScope, WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{
    dealId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const actor = getActorFromRequest(request);
    const { dealId } = await context.params;
    const url = new URL(request.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "10");
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 10;
    const prisma = getPrismaClient();
    const workspaceScope = prisma ? await resolveWorkspaceScope(prisma, actor) : null;

    const events = await getRecentAuditEvents(dealId, limit, workspaceScope?.workspaceId);
    return NextResponse.json({ events });
  } catch (error) {
    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Failed to fetch audit events", error);
    return NextResponse.json({ error: "Failed to fetch audit events." }, { status: 500 });
  }
}
