import type { Metadata } from "next";
import { LandingPageClient } from "@/components/marketing/landing-client";

export const metadata: Metadata = {
  title: "VelocityOS — AI Sales Execution Operating System",
  description: "The conversation-first, admin-last AI sales operating system. Automatically generate meeting summaries, map multithreaded account champions, analyze deal stage pressure risks, and synchronize CRM actions in one seamless execution dashboard.",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "AI sales cockpit",
    "revenue execution platform",
    "B2B pipeline pressure",
    "SDR workflow automation",
    "multithreaded account map",
    "zero latency CRM writes",
    "sales call intelligence",
    "outbound campaign approvals"
  ]
};

export default function Homepage() {
  return <LandingPageClient />;
}
