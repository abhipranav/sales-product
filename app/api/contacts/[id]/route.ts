import { NextRequest, NextResponse } from "next/server";
import { getActorFromRequest } from "@/lib/auth/actor";
import {
  getContact,
  updateContact,
  deleteContact,
  parseUpdateContactInput,
  CrmServiceUnavailableError,
  CrmRecordNotFoundError
} from "@/lib/services/crm-records";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = getActorFromRequest(request);
    const result = await getContact(id, actor);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CrmServiceUnavailableError) {
      return NextResponse.json({ error: "CRM service unavailable" }, { status: 503 });
    }
    if (error instanceof CrmRecordNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error getting contact:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = getActorFromRequest(request);
    const body = await request.json();
    const input = parseUpdateContactInput(body);
    const result = await updateContact(id, input, actor);
    return NextResponse.json(result);
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
    console.error("Error updating contact:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = getActorFromRequest(request);
    const result = await deleteContact(id, actor);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CrmServiceUnavailableError) {
      return NextResponse.json({ error: "CRM service unavailable" }, { status: 503 });
    }
    if (error instanceof CrmRecordNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error deleting contact:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
