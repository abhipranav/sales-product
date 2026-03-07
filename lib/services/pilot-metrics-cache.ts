import { unstable_cache } from "next/cache";
import type { ActorIdentity } from "@/lib/auth/actor";
import { measureRoutePhase } from "@/lib/observability/perf";
import { getPilotMetrics } from "@/lib/services/pilot-metrics";

export const PILOT_METRICS_CACHE_TAG = "pilot-metrics";

const getPilotMetricsCachedByActor = unstable_cache(
  async (actorEmail: string, actorName: string) => {
    return getPilotMetrics({
      email: actorEmail,
      name: actorName
    });
  },
  ["pilot-metrics-by-actor-v1"],
  {
    revalidate: 30,
    tags: [PILOT_METRICS_CACHE_TAG]
  }
);

export async function getCachedPilotMetrics(actor?: ActorIdentity, route = "pilot-metrics") {
  const actorEmail = actor?.email ?? process.env.APP_ACTOR_EMAIL ?? "rep@aurora.local";
  const actorName = actor?.name ?? process.env.APP_ACTOR_NAME ?? "Default Rep";

  return measureRoutePhase(route, "pilot_metrics", () => getPilotMetricsCachedByActor(actorEmail, actorName), {
    cache_ttl_s: 30
  });
}
