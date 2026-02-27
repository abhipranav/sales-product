/**
 * HubSpot OAuth Integration Stub
 *
 * Defines the interface and lifecycle for HubSpot OAuth.
 * Currently the system uses a private app token (HUBSPOT_PRIVATE_APP_TOKEN).
 * This module provides the migration path to full OAuth when needed.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface HubSpotOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface HubSpotOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface HubSpotConnectionStatus {
  connected: boolean;
  authMode: "private-app" | "oauth" | "none";
  lastSyncAt: string | null;
  scopeGranted: string[];
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Config                                                            */
/* ------------------------------------------------------------------ */

const HUBSPOT_SCOPES = [
  "crm.objects.contacts.read",
  "crm.objects.companies.read",
  "crm.objects.deals.read",
  "crm.objects.contacts.write",
  "crm.objects.companies.write",
  "crm.objects.deals.write",
];

export function getHubSpotOAuthConfig(): HubSpotOAuthConfig | null {
  const clientId = process.env.HUBSPOT_CLIENT_ID?.trim();
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET?.trim();
  const redirectUri = process.env.HUBSPOT_REDIRECT_URI?.trim() || `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/api/integrations/hubspot/callback`;

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes: HUBSPOT_SCOPES,
  };
}

/* ------------------------------------------------------------------ */
/*  OAuth Flow                                                        */
/* ------------------------------------------------------------------ */

export function buildHubSpotAuthUrl(): string | null {
  const config = getHubSpotOAuthConfig();
  if (!config) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
  });

  return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeHubSpotCode(code: string): Promise<HubSpotOAuthTokens> {
  const config = getHubSpotOAuthConfig();
  if (!config) {
    throw new Error("HubSpot OAuth is not configured. Set HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET.");
  }

  // TODO: Implement actual token exchange
  // const response = await fetch("https://api.hubapi.com/oauth/v1/token", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
  //   body: new URLSearchParams({
  //     grant_type: "authorization_code",
  //     client_id: config.clientId,
  //     client_secret: config.clientSecret,
  //     redirect_uri: config.redirectUri,
  //     code,
  //   }),
  // });

  void code;

  throw new Error("HubSpot OAuth token exchange is not yet implemented. Awaiting provider credentials.");
}

export async function refreshHubSpotToken(refreshToken: string): Promise<HubSpotOAuthTokens> {
  const config = getHubSpotOAuthConfig();
  if (!config) {
    throw new Error("HubSpot OAuth is not configured.");
  }

  // TODO: Implement actual token refresh
  void refreshToken;

  throw new Error("HubSpot OAuth token refresh is not yet implemented. Awaiting provider credentials.");
}

/* ------------------------------------------------------------------ */
/*  Connection Test                                                   */
/* ------------------------------------------------------------------ */

export async function testHubSpotConnection(): Promise<HubSpotConnectionStatus> {
  const privateToken = process.env.HUBSPOT_PRIVATE_APP_TOKEN?.trim();
  const oauthConfig = getHubSpotOAuthConfig();

  if (privateToken) {
    // Private app token mode — verify it works
    try {
      const response = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
        headers: {
          Authorization: `Bearer ${privateToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (response.ok) {
        return {
          connected: true,
          authMode: "private-app",
          lastSyncAt: null,
          scopeGranted: HUBSPOT_SCOPES,
        };
      }

      return {
        connected: false,
        authMode: "private-app",
        lastSyncAt: null,
        scopeGranted: [],
        error: `HubSpot API returned ${response.status}. Token may be invalid.`,
      };
    } catch (error) {
      return {
        connected: false,
        authMode: "private-app",
        lastSyncAt: null,
        scopeGranted: [],
        error: `Connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  if (oauthConfig) {
    // OAuth configured but no tokens stored yet
    return {
      connected: false,
      authMode: "oauth",
      lastSyncAt: null,
      scopeGranted: [],
      error: "OAuth configured but no tokens stored. User needs to complete the OAuth flow.",
    };
  }

  return {
    connected: false,
    authMode: "none",
    lastSyncAt: null,
    scopeGranted: [],
    error: "No HubSpot credentials configured. Set HUBSPOT_PRIVATE_APP_TOKEN or HUBSPOT_CLIENT_ID.",
  };
}
