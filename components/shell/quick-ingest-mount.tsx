"use client";

import dynamic from "next/dynamic";

const QuickIngestModal = dynamic(
  () => import("@/components/shell/quick-ingest-modal").then((mod) => mod.QuickIngestModal),
  { ssr: false }
);

export function QuickIngestMount() {
  return <QuickIngestModal />;
}
