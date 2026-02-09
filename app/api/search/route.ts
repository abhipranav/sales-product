import { NextRequest, NextResponse } from "next/server";
import { getActorFromRequest } from "@/lib/auth/actor";
import { searchCrmRecords, CrmServiceUnavailableError } from "@/lib/services/crm-records";

export async function GET(request: NextRequest) {
  try {
    const actor = getActorFromRequest(request);
    const searchParams = request.nextUrl.searchParams;

    const query = searchParams.get("q") ?? "";
    if (!query || query.length < 2) {
      return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
    }

    const typesParam = searchParams.get("types");
    let types: Array<"account" | "contact" | "deal"> = ["account", "contact", "deal"];
    if (typesParam) {
      const parsedTypes = typesParam.split(",").filter((t) =>
        ["account", "contact", "deal"].includes(t)
      ) as Array<"account" | "contact" | "deal">;
      if (parsedTypes.length > 0) {
        types = parsedTypes;
      }
    }

    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 50);

    const results = await searchCrmRecords(query, types, limit, actor);
    return NextResponse.json({ results, query, total: results.length });
  } catch (error) {
    if (error instanceof CrmServiceUnavailableError) {
      return NextResponse.json({ error: "CRM service unavailable" }, { status: 503 });
    }
    console.error("Error searching CRM records:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
