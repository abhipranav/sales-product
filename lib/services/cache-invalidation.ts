import { revalidatePath, revalidateTag } from "next/cache";
import { DASHBOARD_CACHE_TAG } from "@/lib/services/dashboard-cache";

const DASHBOARD_PATHS = ["/workspace", "/cockpit", "/accounts", "/pipeline", "/intelligence", "/notifications", "/integrations", "/workflows"];

export function revalidateDashboardViews() {
  revalidateTag(DASHBOARD_CACHE_TAG);
  for (const path of DASHBOARD_PATHS) {
    revalidatePath(path);
  }
}
