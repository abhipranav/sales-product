import type { Route } from "next";
import Link from "next/link";

export const metadata = {
  title: "Blog | Velocity_OS",
  description: "B2B Sales execution insights, AI playbooks, and systems thinking for high-growth revenue ops.",
};

const POSTS = [
  {
    title: "The End of 'Just Checking In': How AI Replaced Generic Outreach",
    date: "March 15, 2026",
    category: "AI execution",
    excerpt: "We analyzed 40,000 follow-up emails. The rule-based nurture campaign is officially dead. Here's what top performers are doing instead."
  },
  {
    title: "Systemizing the Enterprise Deal Cycle: A Framework",
    date: "February 28, 2026",
    category: "Playbooks",
    excerpt: "Why the best reps don't rely on 'feel'. A breakdown of the 6-stage execution loop used by our highest-converting enterprise teams."
  },
  {
    title: "Why We Built Velocity_OS Without HubSpot",
    date: "January 14, 2026",
    category: "Product",
    excerpt: "The controversial decision to build an in-house CRM layer instead of forcing a sync. The architecture, the trade-offs, and the speed."
  }
];

export default function BlogHubPage() {
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
            <Link href={"/book-demo" as Route} className="ind-btn-outline text-xs py-1.5 px-3">
              BOOK DEMO
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-12 w-full max-w-4xl px-5 md:px-8">
        <div className="mb-4">
          <span className="ind-badge-black">LOG</span>
        </div>
        <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-[hsl(var(--foreground))] mb-6">
          Systemized revenue.
        </h1>
        <p className="font-mono text-sm leading-relaxed text-[hsl(var(--muted-foreground))] mb-12 max-w-xl">
          Essays on modern sales execution, AI architecture, and engineering high-velocity revenue systems.
        </p>

        <div className="space-y-6">
          {POSTS.map((post, idx) => (
            <div key={idx} className="ind-card-dashed ind-hover cursor-default group flex flex-col md:flex-row md:items-start gap-4 p-6">
              <div className="md:w-48 shrink-0">
                <p className="font-mono text-xs text-[hsl(var(--muted-foreground))] mt-1 group-hover:text-[hsl(var(--background))]">{post.date}</p>
                <div className="mt-2 ind-badge text-[10px] group-hover:bg-[hsl(var(--background))] group-hover:text-[hsl(var(--foreground))] group-hover:border-[hsl(var(--background))] inline-flex">{post.category.toUpperCase()}</div>
              </div>
              <div>
                <h2 className="font-sans text-xl font-bold text-[hsl(var(--foreground))] mb-2 ind-hover-invert leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed ind-hover-invert">
                  {post.excerpt}
                </p>
                <div className="mt-4 font-mono text-[10px] font-bold tracking-wider text-[hsl(var(--accent))]">
                  READ_LOG →
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 p-8 ind-card border-[3px] border-[hsl(var(--foreground))] flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-sans text-lg font-bold text-[hsl(var(--foreground))]">Build from one execution surface.</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Get the product, not just the playbooks.</p>
          </div>
          <Link href={"/book-demo" as Route} className="ind-btn shrink-0">
            BOOK A DEMO TODAY
          </Link>
        </div>
      </div>
    </main>
  );
}
