"use client";

import dynamic from "next/dynamic";

const CommandPalette = dynamic(
  () => import("@/components/shell/command-palette").then((mod) => mod.CommandPalette),
  { ssr: false }
);

export function CommandPaletteMount() {
  return <CommandPalette />;
}
