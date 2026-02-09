import { getActorFromRequest } from "@/lib/auth/actor";
import {
  NotificationServiceUnavailableError,
  listSignalNotifications
} from "@/lib/services/notifications";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const url = new URL(request.url);
    const limitRaw = Number(url.searchParams.get("limit") ?? "30");
    const limit = Number.isFinite(limitRaw) ? limitRaw : 30;
    const notifications = await listSignalNotifications(limit, actor);
    return NextResponse.json({ notifications });
  } catch (error) {
    if (error instanceof NotificationServiceUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Notification list failed", error);
    return NextResponse.json({ error: "Failed to fetch notifications." }, { status: 500 });
  }
}
