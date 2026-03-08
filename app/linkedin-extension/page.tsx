import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function LinkedInExtensionPage() {
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
            <Link href={"/book-demo" as Route} className="ind-btn text-xs py-1.5 px-3">
              BOOK DEMO
            </Link>
            <Link href={"/auth/signup" as Route} className="ind-btn-outline text-xs py-1.5 px-3">
              CREATE ACCOUNT
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-12 w-full max-w-5xl px-5 md:px-8">
        {/* ── HERO SECTION ── */}
        <section className="ind-card relative p-8 md:p-12 mb-8 border-[3px] border-[hsl(var(--foreground))]">
          <div className="absolute -top-4 -right-3 z-10">
            <span className="ind-badge" style={{ fontSize: '12px', padding: '6px 12px' }}>AI-POWERED</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start gap-8">
            <div className="flex-1">
              <p className="font-mono text-xs font-bold text-[hsl(var(--muted-foreground))] mb-4 tracking-wider">
                VELOCITY_OS // LINKEDIN COMPANION
              </p>
              
              <h1 className="font-serif text-4xl font-black leading-[1.05] tracking-[-0.02em] text-[hsl(var(--foreground))] md:text-[4rem] mb-6">
                Stop pasting. <br />
                <span className="text-[hsl(var(--accent))]">Start selling.</span>
              </h1>
              
              <p className="font-mono text-base leading-relaxed text-[hsl(var(--muted-foreground))] mb-8 max-w-xl">
                The average AE wastes 4 hours a week manually copying LinkedIn data into their CRM. 
                Velocity Companion extracts deep profile intelligence, generates an AI sales brief, and saves structured CRM records—<span className="font-bold text-[hsl(var(--foreground))]">in one click.</span>
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href={"/auth/signup?callbackUrl=%2Fintegrations%2Flinkedin" as Route} className="ind-btn px-6 py-3 text-sm">
                  INSTALL COMPANION
                </Link>
                <Link href={"/book-demo" as Route} className="ind-btn-outline px-6 py-3 text-sm">
                  SEE HOW IT WORKS
                </Link>
              </div>
            </div>

            {/* Visual Stats Block */}
            <div className="md:w-72 flex flex-col gap-3">
              <div className="ind-card-dashed p-4 bg-[hsl(var(--muted))]/50">
                <p className="font-mono text-[10px] text-[hsl(var(--muted-foreground))] mb-1">CRM ENTRY TIME</p>
                <p className="font-sans text-3xl font-black text-[hsl(var(--foreground))]">1 Click</p>
                <p className="text-xs mt-1 text-[hsl(var(--muted-foreground))]">Down from 12+ fields</p>
              </div>
              <div className="ind-card-dashed p-4 bg-[hsl(var(--muted))]/50">
                <p className="font-mono text-[10px] text-[hsl(var(--muted-foreground))] mb-1">AI ENRICHMENT</p>
                <p className="font-sans text-3xl font-black text-[hsl(var(--foreground))]">Instant</p>
                <p className="text-xs mt-1 text-[hsl(var(--muted-foreground))]">Sales briefs & icebreakers</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES GRID ── */}
        <div className="mb-4">
          <span className="ind-badge-black">ARSENAL</span>
        </div>
        
        <section className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="ind-card">
            <div className="h-10 w-10 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] flex items-center justify-center font-black text-lg mb-4">1</div>
            <h3 className="font-sans text-xl font-bold text-[hsl(var(--foreground))] mb-2">Deep DOM Scraping</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              We extract Name, Title, Company, Location, About, Experience, and Education summaries—bypassing LinkedIn&apos;s UI hurdles to fetch the raw data you need.
            </p>
          </div>

          <div className="ind-card border-[3px] border-[hsl(var(--accent))]">
            <div className="flex justify-between items-start mb-4">
              <div className="h-10 w-10 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] flex items-center justify-center font-black text-lg">✨</div>
              <Badge variant="default" className="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]">NEW</Badge>
            </div>
            <h3 className="font-sans text-xl font-bold text-[hsl(var(--foreground))] mb-2">Generative AI Briefs</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              Don&apos;t just capture data. Send the profile context to our OpenAI integration to instantly generate executive summaries, seniority estimates, and hyper-personalized icebreakers.
            </p>
          </div>

          <div className="ind-card">
            <div className="h-10 w-10 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] flex items-center justify-center font-black text-lg mb-4">3</div>
            <h3 className="font-sans text-xl font-bold text-[hsl(var(--foreground))] mb-2">One-Click CRM Upsert</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              Directly hits the Velocity_OS backend. Creates Accounts and Contacts with an intelligent matching algorithm to prevent duplicates.
            </p>
          </div>
        </section>

        {/* ── TECHNICAL EXECUTION ── */}
        <section className="grid md:grid-cols-[1.2fr_0.8fr] gap-4">
          <div className="ind-card p-0 overflow-hidden flex flex-col">
            <div className="px-6 py-5 bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
              <p className="font-mono text-sm font-bold tracking-widest">WHY THIS SHIPS SAFELY</p>
            </div>
            <div className="p-6">
              <p className="font-sans text-[hsl(var(--foreground))] text-lg leading-relaxed mb-4">
                &quot;Other scrapers break when LinkedIn changes a div class. Velocity isolates the execution.&quot;
              </p>
              <p className="font-mono text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                The companion uses content injected scripts and a lightweight service worker to parse the DOM, 
                then hands control back to the operator in a beautifully styled popup for the final save. 
                It avoids making production auth or core CRM sync depend on a brittle scraping path.
              </p>
              <div className="mt-8">
                <Link href={"/auth/signup?callbackUrl=%2Fintegrations%2Flinkedin" as Route} className="ind-btn">
                  GET THE EXTENSION NOW
                </Link>
              </div>
            </div>
          </div>

          <div className="ind-card-dashed space-y-4 flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-[hsl(var(--success))] rounded-full animate-pulse"></div>
              <p className="font-mono text-sm text-[hsl(var(--foreground))]">Manifest V3 Compliant</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-[hsl(var(--success))] rounded-full"></div>
              <p className="font-mono text-sm text-[hsl(var(--foreground))]">No Background Polling</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-[hsl(var(--success))] rounded-full"></div>
              <p className="font-mono text-sm text-[hsl(var(--foreground))]">Encrypted Payload Transfer</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-[hsl(var(--success))] rounded-full"></div>
              <p className="font-mono text-sm text-[hsl(var(--foreground))]">Native Next.js API Integration</p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
