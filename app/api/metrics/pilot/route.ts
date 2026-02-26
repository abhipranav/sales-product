import { getActorFromRequest } from "@/lib/auth/actor";
import { isPrismaConnectionError } from "@/lib/db/prisma";
import { getPilotMetricsSnapshot } from "@/lib/mock/pilot-metrics";
import { PilotMetricsServiceUnavailableError, getPilotMetrics } from "@/lib/services/pilot-metrics";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const metrics = await getPilotMetrics(actor);
    return NextResponse.json({ mode: "live", metrics });
  } catch (error) {
    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof PilotMetricsServiceUnavailableError || isPrismaConnectionError(error)) {
      return NextResponse.json({ mode: "mock", metrics: getPilotMetricsSnapshot() });
    }

    console.error("Failed to fetch pilot metrics", error);
    return NextResponse.json({ error: "Failed to fetch pilot metrics." }, { status: 500 });
  }
}
