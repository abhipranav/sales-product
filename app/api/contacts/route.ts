import { NextRequest, NextResponse } from "next/server";
import { getActorFromRequest } from "@/lib/auth/actor";
import {
  listContacts,
  createContact,
  parseCreateContactInput,
  CrmServiceUnavailableError,
  CrmRecordNotFoundError
} from "@/lib/services/crm-records";
import type { ContactFilters, SortInput } from "@/lib/services/crm-records";

export async function GET(request: NextRequest) {
  try {
    const actor = getActorFromRequest(request);
    const searchParams = request.nextUrl.searchParams;

    const filters: ContactFilters = {};
    const accountId = searchParams.get("accountId");
    if (accountId) {
      filters.accountId = accountId;
    }
    const role = searchParams.get("role");
    if (role && ["champion", "approver", "blocker", "influencer"].includes(role)) {
      filters.role = role as ContactFilters["role"];
    }
    const search = searchParams.get("search");
    if (search) {
      filters.search = search;
    }

    const pagination = {
      limit: parseInt(searchParams.get("limit") ?? "20", 10),
      offset: parseInt(searchParams.get("offset") ?? "0", 10)
    };

    const sortField = searchParams.get("sortBy") ?? "fullName";
    const sortOrder = searchParams.get("sortOrder") ?? "asc";
    const sort: SortInput = {
      field: sortField,
      order: sortOrder as "asc" | "desc"
    };

    const result = await listContacts(filters, pagination, sort, actor);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CrmServiceUnavailableError) {
      return NextResponse.json({ error: "CRM service unavailable" }, { status: 503 });
    }
    console.error("Error listing contacts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = getActorFromRequest(request);
    const body = await request.json();
    const input = parseCreateContactInput(body);
    const result = await createContact(input, actor);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof CrmServiceUnavailableError) {
      return NextResponse.json({ error: "CRM service unavailable" }, { status: 503 });
    }
    if (error instanceof CrmRecordNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: error }, { status: 400 });
    }
    console.error("Error creating contact:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
