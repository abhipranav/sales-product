import { NextRequest, NextResponse } from "next/server";
import { getActorFromRequest } from "@/lib/auth/actor";
import {
  listDeals,
  createDeal,
  parseCreateDealInput,
  CrmServiceUnavailableError,
  CrmRecordNotFoundError
} from "@/lib/services/crm-records";
import type { DealFilters, SortInput } from "@/lib/services/crm-records";

export async function GET(request: NextRequest) {
  try {
    const actor = getActorFromRequest(request);
    const searchParams = request.nextUrl.searchParams;

    const filters: DealFilters = {};
    const accountId = searchParams.get("accountId");
    if (accountId) {
      filters.accountId = accountId;
    }
    const stage = searchParams.get("stage");
    if (stage && ["discovery", "evaluation", "proposal", "procurement", "closed-won", "closed-lost"].includes(stage)) {
      filters.stage = stage as DealFilters["stage"];
    }
    const stages = searchParams.get("stages");
    if (stages) {
      const stageList = stages.split(",").filter((s) =>
        ["discovery", "evaluation", "proposal", "procurement", "closed-won", "closed-lost"].includes(s)
      ) as DealFilters["stages"];
      if (stageList && stageList.length > 0) {
        filters.stages = stageList;
      }
    }
    const search = searchParams.get("search");
    if (search) {
      filters.search = search;
    }
    const minAmount = searchParams.get("minAmount");
    if (minAmount) {
      filters.minAmount = parseInt(minAmount, 10);
    }
    const maxAmount = searchParams.get("maxAmount");
    if (maxAmount) {
      filters.maxAmount = parseInt(maxAmount, 10);
    }

    const pagination = {
      limit: parseInt(searchParams.get("limit") ?? "20", 10),
      offset: parseInt(searchParams.get("offset") ?? "0", 10)
    };

    const sortField = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";
    const sort: SortInput = {
      field: sortField,
      order: sortOrder as "asc" | "desc"
    };

    const result = await listDeals(filters, pagination, sort, actor);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CrmServiceUnavailableError) {
      return NextResponse.json({ error: "CRM service unavailable" }, { status: 503 });
    }
    console.error("Error listing deals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = getActorFromRequest(request);
    const body = await request.json();
    const input = parseCreateDealInput(body);
    const result = await createDeal(input, actor);
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
    console.error("Error creating deal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
