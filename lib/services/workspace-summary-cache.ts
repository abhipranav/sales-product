import { unstable_cache } from "next/cache";
import type { ActorIdentity } from "@/lib/auth/actor";
import { measureRoutePhase } from "@/lib/observability/perf";
import { getWorkspaceSummary } from "@/lib/services/workspace-summary";

export const WORKSPACE_SUMMARY_CACHE_TAG = "workspace-summary";

const getWorkspaceSummaryCachedByActor = unstable_cache(
  async (actorEmail: string, actorName: string) => {
    return getWorkspaceSummary({
      email: actorEmail,
      name: actorName
    });
  },
  ["workspace-summary-by-actor-v1"],
  {
    revalidate: 30,
    tags: [WORKSPACE_SUMMARY_CACHE_TAG]
  }
);

export async function getCachedWorkspaceSummary(actor?: ActorIdentity, route = "workspace") {
  const actorEmail = actor?.email ?? process.env.APP_ACTOR_EMAIL ?? "rep@aurora.local";
  const actorName = actor?.name ?? process.env.APP_ACTOR_NAME ?? "Default Rep";

  return measureRoutePhase(route, "workspace_summary", () => getWorkspaceSummaryCachedByActor(actorEmail, actorName), {
    cache_ttl_s: 30
  });
}
