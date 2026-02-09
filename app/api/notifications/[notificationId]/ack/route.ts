import { getActorFromRequest } from "@/lib/auth/actor";
import {
  NotificationNotFoundError,
  NotificationServiceUnavailableError,
  acknowledgeSignalNotification
} from "@/lib/services/notifications";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{
    notificationId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = getActorFromRequest(request);
    const { notificationId } = await context.params;
    const notification = await acknowledgeSignalNotification(notificationId, actor);
    return NextResponse.json({ notification });
  } catch (error) {
    if (error instanceof NotificationServiceUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof NotificationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Notification acknowledge failed", error);
    return NextResponse.json({ error: "Failed to acknowledge notification." }, { status: 500 });
  }
}
