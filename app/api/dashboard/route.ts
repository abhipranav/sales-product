import { getActorFromRequest } from "@/lib/auth/actor";
import { getDashboardData } from "@/lib/services/dashboard";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { measureRoutePhase } from "@/lib/observability/perf";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const snapshot = await measureRoutePhase("/api/dashboard", "request", () => getDashboardData(actor));
    return NextResponse.json(snapshot);
  } catch (error) {
    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Failed to build dashboard response", error);
    return NextResponse.json({ error: "Failed to build dashboard response." }, { status: 500 });
  }
}
