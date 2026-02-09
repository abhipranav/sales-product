import { NextRequest, NextResponse } from "next/server";
import { getActorFromRequest } from "@/lib/auth/actor";
import {
  listAccounts,
  createAccount,
  parseCreateAccountInput,
  CrmServiceUnavailableError
} from "@/lib/services/crm-records";
import type { AccountFilters, SortInput } from "@/lib/services/crm-records";

export async function GET(request: NextRequest) {
  try {
    const actor = getActorFromRequest(request);
    const searchParams = request.nextUrl.searchParams;

    const filters: AccountFilters = {};
    const segment = searchParams.get("segment");
    if (segment && ["startup", "mid-market", "enterprise"].includes(segment)) {
      filters.segment = segment as AccountFilters["segment"];
    }
    const search = searchParams.get("search");
    if (search) {
      filters.search = search;
    }

    const pagination = {
      limit: parseInt(searchParams.get("limit") ?? "20", 10),
      offset: parseInt(searchParams.get("offset") ?? "0", 10)
    };

    const sortField = searchParams.get("sortBy") ?? "name";
    const sortOrder = searchParams.get("sortOrder") ?? "asc";
    const sort: SortInput = {
      field: sortField,
      order: sortOrder as "asc" | "desc"
    };

    const result = await listAccounts(filters, pagination, sort, actor);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CrmServiceUnavailableError) {
      return NextResponse.json({ error: "CRM service unavailable" }, { status: 503 });
    }
    console.error("Error listing accounts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = getActorFromRequest(request);
    const body = await request.json();
    const input = parseCreateAccountInput(body);
    const result = await createAccount(input, actor);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof CrmServiceUnavailableError) {
      return NextResponse.json({ error: "CRM service unavailable" }, { status: 503 });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: error }, { status: 400 });
    }
    console.error("Error creating account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
