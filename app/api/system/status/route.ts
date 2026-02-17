import { NextResponse } from "next/server";
import { getActorFromRequest } from "@/lib/auth/actor";
import { getSystemReadiness } from "@/lib/services/system-readiness";

export async function GET(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const readiness = await getSystemReadiness(actor);
    return NextResponse.json(readiness);
  } catch (error) {
    console.error("Failed to load system readiness", error);
    return NextResponse.json({ error: "Failed to load system readiness." }, { status: 500 });
  }
}
