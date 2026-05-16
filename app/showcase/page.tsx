import type { Metadata } from "next";
import { ShowcaseClient } from "@/components/marketing/showcase-client";

export const metadata: Metadata = {
  title: "Product Showcase & Interactive Sandbox — VelocityOS",
  description: "Tour the next-generation AI Sales Cockpit. Experiment with our live signal telemetry sandbox, view quick capture flows, see system fallback alerts, and explore modern revenue execution surfaces.",
  alternates: {
    canonical: "/showcase",
  },
  keywords: [
    "VelocityOS showcase",
    "interactive sales sandbox",
    "buying signal simulation",
    "sales console tour",
    "real-time sales operations",
    "CRM command interface"
  ]
};

export default function ShowcasePage() {
  return <ShowcaseClient />;
}
