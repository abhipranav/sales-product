import { unstable_cache } from "next/cache";
import { getDashboardData } from "@/lib/services/dashboard";
import type { ActorIdentity } from "@/lib/auth/actor";
import { measureRoutePhase } from "@/lib/observability/perf";

export const DASHBOARD_CACHE_TAG = "dashboard-data";

const getDashboardDataCachedByActor = unstable_cache(
  async (actorEmail: string, actorName: string, includeStrategyPlays: boolean) => {
    return getDashboardData(
      {
        email: actorEmail,
        name: actorName
      },
      {
        includeStrategyPlays
      }
    );
  },
  ["dashboard-data-by-actor-v2"],
  {
    revalidate: 30,
    tags: [DASHBOARD_CACHE_TAG]
  }
);

interface CachedDashboardOptions {
  includeStrategyPlays?: boolean;
}

export async function getCachedDashboardData(actor?: ActorIdentity, route = "workspace", options?: CachedDashboardOptions) {
  const actorEmail = actor?.email ?? process.env.APP_ACTOR_EMAIL ?? "rep@aurora.local";
  const actorName = actor?.name ?? process.env.APP_ACTOR_NAME ?? "Default Rep";
  const includeStrategyPlays = options?.includeStrategyPlays ?? true;
  return measureRoutePhase(
    route,
    "dashboard_data",
    () => getDashboardDataCachedByActor(actorEmail, actorName, includeStrategyPlays),
    {
      cache_ttl_s: 30,
      include_strategy_plays: includeStrategyPlays
    }
  );
}
