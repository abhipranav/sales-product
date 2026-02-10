import { headers } from "next/headers";

export interface ActorIdentity {
  email?: string;
  name?: string;
}

function sanitizeEmail(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 3 && normalized.includes("@") ? normalized : undefined;
}

function sanitizeName(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 1 ? normalized : undefined;
}

export function getActorFromRequest(request: Request): ActorIdentity {
  return {
    email: sanitizeEmail(request.headers.get("x-actor-email")),
    name: sanitizeName(request.headers.get("x-actor-name"))
  };
}

export async function getActorFromServerContext(): Promise<ActorIdentity> {
  const headerStore = await headers();

  return {
    email: sanitizeEmail(headerStore.get("x-actor-email")),
    name: sanitizeName(headerStore.get("x-actor-name"))
  };
}
