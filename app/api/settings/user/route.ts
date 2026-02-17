import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getActorFromRequest } from "@/lib/auth/actor";
import {
  getUserSettings,
  parseUpdateUserSettingsInput,
  updateUserSettings,
  UserSettingsServiceUnavailableError
} from "@/lib/services/user-settings";

export async function GET(request: NextRequest) {
  try {
    const actor = getActorFromRequest(request);
    const settings = await getUserSettings(actor);
    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof UserSettingsServiceUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error("Failed to load user settings", error);
    return NextResponse.json({ error: "Failed to load user settings." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = getActorFromRequest(request);
    const body = await request.json();
    const input = parseUpdateUserSettingsInput(body);
    const settings = await updateUserSettings(input, actor);
    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid settings payload.", details: error.issues }, { status: 400 });
    }

    if (error instanceof UserSettingsServiceUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error("Failed to update user settings", error);
    return NextResponse.json({ error: "Failed to update user settings." }, { status: 500 });
  }
}
