import { NextResponse } from "next/server";
import { getIntegrationStatus } from "@/lib/services/integrations/status";

export async function GET() {
  try {
    const status = await getIntegrationStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("Integration status check failed", error);
    return NextResponse.json({ error: "Failed to check integration status." }, { status: 500 });
  }
}
