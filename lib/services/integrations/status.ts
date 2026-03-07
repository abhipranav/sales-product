import { testCalendarConnection, type CalendarConnectionStatus } from "@/lib/services/integrations/calendar-oauth";
import { testHubSpotConnection, type HubSpotConnectionStatus } from "@/lib/services/integrations/hubspot-oauth";

export interface IntegrationStatusSnapshot {
  hubspot: HubSpotConnectionStatus;
  calendar: CalendarConnectionStatus;
  checkedAt: string;
}

const INTEGRATION_STATUS_CACHE_TTL_MS = 60_000;

let cachedStatus: IntegrationStatusSnapshot | null = null;
let cachedStatusExpiresAt = 0;
let inFlightStatus: Promise<IntegrationStatusSnapshot> | null = null;

async function computeIntegrationStatus(): Promise<IntegrationStatusSnapshot> {
  const [hubspot, calendar] = await Promise.all([testHubSpotConnection(), testCalendarConnection()]);

  return {
    hubspot,
    calendar,
    checkedAt: new Date().toISOString()
  };
}

export async function getIntegrationStatus(): Promise<IntegrationStatusSnapshot> {
  const now = Date.now();

  if (cachedStatus && cachedStatusExpiresAt > now) {
    return cachedStatus;
  }

  if (inFlightStatus) {
    return inFlightStatus;
  }

  inFlightStatus = computeIntegrationStatus()
    .then((status) => {
      cachedStatus = status;
      cachedStatusExpiresAt = Date.now() + INTEGRATION_STATUS_CACHE_TTL_MS;
      return status;
    })
    .finally(() => {
      inFlightStatus = null;
    });

  return inFlightStatus;
}
