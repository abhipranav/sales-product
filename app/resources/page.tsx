import type { Route } from "next";
import Link from "next/link";

export const metadata = {
  title: "Resources | Velocity_OS",
  description: "Free tools, templates, and calculators for B2B sales teams.",
};

const RESOURCES = [
  {
    title: "Sequence Capacity Calculator",
    type: "TOOL",
    description: "Determine exactly how many active sequences a rep can manage before pipeline decay sets in.",
  },
  {
    title: "The Enterprise Handover Framework",
    type: "TEMPLATE",
    description: "Figma template mapping the exact qualification criteria needed to pass a deal from SDR to AE.",
  },
  {
    title: "AI Response Evaluator",
    type: "TOOL",
    description: "Paste an inbound prospect response. Automatically score intent and generate the optimal counter-narrative.",
  }
];

export default function ResourcesHubPage() {
  return (
    <main className="min-h-screen ind-grid-bg pb-20">
      {/* ── HEADER NAVIGATION ── */}
      <header className="sticky top-0 z-30 border-b-[2px] border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-2.5 md:px-8">
          <Link href="/" className="flex items-center gap-0">
            <span className="font-mono text-base font-bold tracking-tight text-[hsl(var(--foreground))]">
              VELOCITY_OS
            </span>
            <span className="font-mono text-[10px] font-bold text-[hsl(var(--muted-foreground))] ml-0.5">®</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href={"/blog" as Route} className="ind-btn-outline border-transparent hover:border-[hsl(var(--foreground))] text-xs py-1.5 px-3">
              BLOG
            </Link>
            <Link href={"/book-demo" as Route} className="ind-btn text-xs py-1.5 px-3">
              BOOK DEMO
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-12 w-full max-w-5xl px-5 md:px-8">
        <div className="mb-4">
          <span className="ind-badge-black">RESOURCES</span>
        </div>
        <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-[hsl(var(--foreground))] mb-6">
          Architect your GTM.
        </h1>
        <p className="font-mono text-sm leading-relaxed text-[hsl(var(--muted-foreground))] mb-12 max-w-xl">
          Free infrastructure for revenue teams. Calculators, templates, and mini-tools designed by our implementation engineers.
        </p>

        <div className="grid md:grid-cols-3 gap-5">
          {RESOURCES.map((res, idx) => (
            <div key={idx} className="ind-card flex flex-col ind-hover cursor-default">
              <div className="flex items-center justify-between mb-4">
                <span className="ind-badge">{res.type}</span>
              </div>
              <h2 className="font-sans text-xl font-bold text-[hsl(var(--foreground))] mb-2 ind-hover-invert">
                {res.title}
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed flex-1 ind-hover-invert">
                {res.description}
              </p>
              <div className="mt-6 flex justify-end">
                <div className="font-mono text-[10px] font-bold tracking-wider text-[hsl(var(--foreground))] px-2 py-1 border-[1px] border-[hsl(var(--foreground))] ind-hover-invert">
                  ACCESS_RESOURCE
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 caution-stripe h-2 w-full" />
      </div>
    </main>
  );
}
