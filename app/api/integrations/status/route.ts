import { NextResponse } from "next/server";
import { testHubSpotConnection } from "@/lib/services/integrations/hubspot-oauth";
import { testCalendarConnection } from "@/lib/services/integrations/calendar-oauth";

export async function GET() {
  try {
    const [hubspot, calendar] = await Promise.all([
      testHubSpotConnection(),
      testCalendarConnection(),
    ]);

    return NextResponse.json({
      hubspot,
      calendar,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Integration status check failed", error);
    return NextResponse.json({ error: "Failed to check integration status." }, { status: 500 });
  }
}
