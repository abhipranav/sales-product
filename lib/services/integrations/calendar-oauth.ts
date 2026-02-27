/**
 * Google Calendar OAuth Integration Stub
 *
 * Defines the interface and lifecycle for Google Calendar provider OAuth.
 * Actual API calls require provider credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET).
 */

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface CalendarOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface CalendarOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string;
}

export interface CalendarConnectionStatus {
  connected: boolean;
  provider: "google" | "microsoft" | "none";
  lastSyncAt: string | null;
  scopeGranted: string[];
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Config                                                            */
/* ------------------------------------------------------------------ */

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events.readonly",
];

export function getCalendarOAuthConfig(): CalendarOAuthConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/api/integrations/calendar/callback`;

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes: GOOGLE_SCOPES,
  };
}

/* ------------------------------------------------------------------ */
/*  OAuth Flow                                                        */
/* ------------------------------------------------------------------ */

export function buildCalendarAuthUrl(): string | null {
  const config = getCalendarOAuthConfig();
  if (!config) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCalendarCode(code: string): Promise<CalendarOAuthTokens> {
  const config = getCalendarOAuthConfig();
  if (!config) {
    throw new Error("Calendar OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
  }

  // TODO: Implement actual token exchange when provider credentials are available
  // const response = await fetch("https://oauth2.googleapis.com/token", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
  //   body: new URLSearchParams({
  //     code,
  //     client_id: config.clientId,
  //     client_secret: config.clientSecret,
  //     redirect_uri: config.redirectUri,
  //     grant_type: "authorization_code",
  //   }),
  // });

  void code;

  throw new Error("Calendar OAuth token exchange is not yet implemented. Awaiting provider credentials.");
}

export async function refreshCalendarToken(refreshToken: string): Promise<CalendarOAuthTokens> {
  const config = getCalendarOAuthConfig();
  if (!config) {
    throw new Error("Calendar OAuth is not configured.");
  }

  // TODO: Implement actual token refresh
  void refreshToken;

  throw new Error("Calendar OAuth token refresh is not yet implemented. Awaiting provider credentials.");
}

/* ------------------------------------------------------------------ */
/*  Connection Test                                                   */
/* ------------------------------------------------------------------ */

export async function testCalendarConnection(): Promise<CalendarConnectionStatus> {
  const config = getCalendarOAuthConfig();

  if (!config) {
    return {
      connected: false,
      provider: "none",
      lastSyncAt: null,
      scopeGranted: [],
      error: "Calendar OAuth provider credentials are not configured.",
    };
  }

  // TODO: Check stored tokens and test API connectivity
  return {
    connected: false,
    provider: "google",
    lastSyncAt: null,
    scopeGranted: [],
    error: "No stored OAuth tokens. User needs to initiate the connection flow.",
  };
}
