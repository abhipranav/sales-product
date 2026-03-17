"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

/* ─── data ─────────────────────────────────────────────────────────────── */

const ticker = [
  "AI MEETING NOTES → ACTIONS IN UNDER 30S",
  "PIPELINE RISK UPDATES EVERY 5 MINUTES",
  "SIGNAL INBOX PRIORITIZED BY DEAL IMPACT",
  "HUMAN APPROVALS FOR OUTBOUND AI MESSAGES",
  "WORKSPACE-SCOPED CRM SYNCHRONIZATION",
] as const;

const modules = [
  { id: "MODULE_01", title: "WORKSPACE", href: "/workspace", summary: "Cross-module launchpad and KPI command view." },
  { id: "MODULE_02", title: "COCKPIT", href: "/cockpit", summary: "Rep execution surface for daily actions." },
  { id: "MODULE_03", title: "ACCOUNTS", href: "/accounts", summary: "Stakeholder map and account intelligence." },
  { id: "MODULE_04", title: "PIPELINE", href: "/pipeline", summary: "Revenue pressure and close-risk controls." },
  { id: "MODULE_05", title: "INTELLIGENCE", href: "/intelligence", summary: "Strategy, notes, and follow-up orchestration." },
  { id: "MODULE_06", title: "NOTIFICATIONS", href: "/notifications", summary: "Buying-signal inbox with action cues." },
  { id: "MODULE_07", title: "INTEGRATIONS", href: "/integrations", summary: "CRM and calendar sync observability." },
  { id: "MODULE_08", title: "WORKFLOWS", href: "/workflows", summary: "Tasks, approvals, and execution audit trail." },
] as const;

const pillars = [
  {
    id: "P_01",
    title: "Editorial Clarity",
    body: "Decision-critical metrics are surfaced first so teams move on facts, not tabs.",
  },
  {
    id: "P_02",
    title: "AI + Human Control",
    body: "AI drafts and recommendations are fast, while approvals and governance stay explicit.",
  },
  {
    id: "P_03",
    title: "Systemized Execution",
    body: "Each insight is immediately tied to tasks, sequences, and owner accountability.",
  },
] as const;

const capabilities = [
  "Guided sign-up and first-workspace onboarding",
  "Call intelligence with notes-to-actions",
  "Buying-signal detection with priority scoring",
  "Sequence planning and step-level execution tracking",
  "CRM command center for account/contact/deal updates",
  "LinkedIn companion capture into editable CRM records",
  "Workspace access controls with actor scoping",
  "Audit-ready workflow logs across every mutation",
] as const;

const integrationLogos = [
  { name: "Salesforce", src: "/brand-logos/salesforce.svg" },
  { name: "HubSpot", src: "/brand-logos/hubspot.svg" },
  { name: "Google Workspace", src: "/brand-logos/google-workspace.svg" },
  { name: "Microsoft", src: "/brand-logos/microsoft.svg" },
  { name: "Zoom", src: "/brand-logos/zoom.svg" },
  { name: "Slack", src: "/brand-logos/slack.svg" },
] as const;

const faqs = [
  {
    question: "Can we keep our current CRM setup?",
    answer: "Yes. Sync endpoints are designed for incremental upsert workflows, not forced migrations.",
  },
  {
    question: "Can AI send messages automatically?",
    answer: "Only where you allow it. Approval queues can gate outbound communication.",
  },
  {
    question: "Can we run polyglot services later?",
    answer: "Yes. The product surface stays in TypeScript while heavy AI paths can move to Python or Go.",
  },
] as const;

/* ─── page ─────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="relative overflow-hidden pb-0 ind-grid-bg">
      {/* ── TICKER ─────────────────────────────────────────────────────── */}
      <div className="pm-ticker">
        <div className="pm-ticker-track">
          {[...ticker, ...ticker].map((item, index) => (
            <span key={`${item}-${index}`} className="pm-ticker-item">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b-[2px] border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-2.5 md:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-0">
            <span className="font-mono text-base font-bold tracking-tight text-[hsl(var(--foreground))]">
              VELOCITY_OS
            </span>
            <span className="font-mono text-[10px] font-bold text-[hsl(var(--muted-foreground))] ml-0.5">®</span>
          </Link>

          {/* Nav — separated by vertical dividers like Ankitkr0 */}
          <nav className="hidden items-center md:flex">
            <div className="ind-divider-v h-5 mx-4" />
            <a href="#features" className="ind-label hover:text-[hsl(var(--foreground))] transition-colors">
              Features
            </a>
            <div className="ind-divider-v h-5 mx-4" />
            <a href="#modules" className="ind-label hover:text-[hsl(var(--foreground))] transition-colors">
              Modules
            </a>
            <div className="ind-divider-v h-5 mx-4" />
            <a href="#pricing" className="ind-label hover:text-[hsl(var(--foreground))] transition-colors">
              Pricing
            </a>
            <div className="ind-divider-v h-5 mx-4" />
            <a href="#faq" className="ind-label hover:text-[hsl(var(--foreground))] transition-colors">
              FAQ
            </a>
            <div className="ind-divider-v h-5 mx-4" />
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href={"/auth/signup" as Route} className="ind-btn text-xs py-1.5 px-3">
              CREATE ACCOUNT
            </Link>
            <Link href={"/book-demo" as Route} className="ind-btn-outline text-xs py-1.5 px-3">
              BOOK DEMO
            </Link>
            <Link href="/auth/signin" className="ind-btn-outline border-transparent hover:border-[hsl(var(--foreground))] text-xs py-1.5 px-3">
              SIGN IN
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-0 pt-8 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          {/* Left — Main hero card */}
          <div className="ind-card relative">
            {/* Yellow badge rotated — Ankitkr0 "IN STOCK" style */}
            <div className="absolute -top-3 -right-2 z-10">
              <span className="ind-badge">AI-NATIVE</span>
            </div>

            <div className="ind-label mb-4">REVENUE_OS // V1.0</div>

            <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-[hsl(var(--foreground))] md:text-[3.5rem]">
              Reimagine how
              <br />
              sales teams execute
              <br />
              <span className="relative">
                with AI.
                <svg className="absolute -bottom-1 left-0 w-full h-2 text-[hsl(var(--foreground))]" viewBox="0 0 200 8" preserveAspectRatio="none">
                  <path d="M0 5 Q50 0 100 5 T200 5" stroke="currentColor" strokeWidth="3" fill="none" />
                </svg>
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-relaxed text-[hsl(var(--muted-foreground))] font-mono">
              One command layer for CRM actions, call intelligence, pipeline control, and execution workflows.
              Fast enough for reps, structured enough for leaders.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={"/auth/signup?callbackUrl=%2Fworkspace%2Fget-started" as Route} className="ind-btn">
                CREATE ACCOUNT →
              </Link>
              <Link href={"/linkedin-extension" as Route} className="ind-btn-outline">
                INSTALL LINKEDIN COMPANION
              </Link>
              <Link href="/workspace" className="ind-btn-outline">
                OPEN APP
              </Link>
            </div>

            {/* Barcode decorative */}
            <div className="mt-6 flex items-end justify-between">
              <div className="ind-barcode">VELOCITY V1</div>
              <div className="ind-label text-right">
                EST. 2026<br />
                <span className="text-[hsl(var(--foreground))] font-bold">BANGALORE</span>
              </div>
            </div>
          </div>

          {/* Right — Status + Stats stack */}
          <div className="flex flex-col gap-4">
            {/* Status card — Ankitkr0 "STATUS: OPEN" */}
            <div className="ind-card p-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center  bg-[hsl(var(--foreground))] text-lg">
                    ⚡
                  </span>
                  <div>
                    <p className="font-mono text-base font-bold tracking-tight text-[hsl(var(--foreground))]">STATUS: LIVE</p>
                    <p className="font-mono text-[10px] text-[hsl(var(--muted-foreground))] tracking-wider">
                      ACCEPTING NEW TEAMS [GROWTH/ENTERPRISE]
                    </p>
                  </div>
                </div>
                <Link href={"/auth/signup?callbackUrl=%2Fworkspace%2Fget-started" as Route} className="ind-btn text-xs py-1.5 px-3">
                  START SETUP
                </Link>
              </div>
              <div className="caution-stripe" />
            </div>

            {/* Archive / work cards — Ankitkr0 "ARCHIVE_01" style */}
            <div className="grid grid-cols-2 gap-4">
              <Link href="/workspace" className="ind-card-dashed ind-hover cursor-pointer block">
                <div className="flex items-center justify-between mb-4">
                  <span className="ind-label">ARCHIVE_01</span>
                  <span className="flex h-7 w-7 items-center justify-center  bg-[hsl(var(--foreground))] text-white text-xs">📊</span>
                </div>
                <p className="font-sans text-2xl font-bold leading-tight text-[hsl(var(--foreground))] ind-hover-invert">
                  LIVE<br />EXECUTION
                </p>
                <p className="ind-label mt-3 ind-hover-invert">WEIGHTED: $174,300</p>
              </Link>

              <Link href="/notifications" className="ind-card-dashed ind-hover cursor-pointer block">
                <div className="flex items-center justify-between mb-4">
                  <span className="ind-label">ARCHIVE_02</span>
                  <span className="flex h-7 w-7 items-center justify-center  bg-caution text-ink text-xs">🎯</span>
                </div>
                <p className="font-sans text-2xl font-bold leading-tight text-[hsl(var(--foreground))] ind-hover-invert">
                  SIGNAL<br />INBOX
                </p>
                <p className="ind-label mt-3 ind-hover-invert">3 HIGH PRIORITY</p>
              </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="ind-card text-center">
                <p className="ind-label">ADMIN_LOAD</p>
                <p className="mt-1 text-3xl font-black text-[hsl(var(--foreground))] font-sans">-37%</p>
              </div>
              <div className="ind-card text-center">
                <p className="ind-label">FOLLOW_UP</p>
                <p className="mt-1 text-3xl font-black text-[hsl(var(--foreground))] font-sans">2.4x</p>
              </div>
              <div className="ind-card text-center">
                <p className="ind-label">CYCLE_TIME</p>
                <p className="mt-1 text-3xl font-black text-[hsl(var(--foreground))] font-sans">-9d</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ──────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8">
        <div className="ind-divider-h mb-6" />
        <p className="ind-label text-center mb-4">WORKS_WITH // YOUR STACK</p>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {integrationLogos.map((logo) => (
            <div
              key={logo.name}
              className="ind-card text-center py-2.5 px-3 ind-hover cursor-default"
            >
              <div className="flex min-h-[62px] flex-col items-center justify-center gap-2">
                <img
                  src={logo.src}
                  alt={`${logo.name} logo`}
                  loading="lazy"
                  width="28"
                  height="28"
                  className="h-7 w-7 opacity-80 brightness-0 saturate-0 ind-hover-invert"
                />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] ind-hover-invert">
                  {logo.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DESIGN PRINCIPLES ─────────────────────────────────────────── */}
      <section id="features" className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8">
        <div className="ind-divider-h mb-8" />
        <div className="mb-8">
          <span className="ind-badge-black">DESIGN_PRINCIPLES</span>
          <h2 className="mt-4 font-serif text-3xl font-bold text-[hsl(var(--foreground))] md:text-4xl leading-tight">
            Minimal visuals.<br />
            Maximum execution signal.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.id} className="ind-card ind-hover cursor-default">
              <div className="flex items-center justify-between mb-3">
                <span className="ind-label">{pillar.id}</span>
              </div>
              <h3 className="font-sans text-lg font-bold text-[hsl(var(--foreground))] mb-2 ind-hover-invert">
                {pillar.title}
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] ind-hover-invert leading-relaxed">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CAPABILITIES + EXECUTION LOOP ─────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-5 py-4 md:px-8">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Capability Surface */}
          <div className="ind-card">
            <div className="flex items-center justify-between mb-4">
              <span className="ind-badge-black">CAPABILITY_SURFACE</span>
            </div>
            <p className="ind-label mb-4">PRODUCTION-FOCUSED FUNCTIONALITY // ALREADY WIRED</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {capabilities.map((cap, i) => (
                <div key={cap} className="flex items-start gap-2 border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2.5">
                  <span className="font-mono text-[10px] font-bold text-[hsl(var(--muted-foreground))] mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-[hsl(var(--foreground))]">{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Execution Loop */}
          <div className="ind-card-dashed">
            <span className="ind-badge-black mb-4">EXECUTION_LOOP</span>
            <div className="space-y-3 mt-4">
              {["Ingest context", "Score risk and momentum", "Generate tasks and sequences", "Execute with approvals"].map(
                (step, index) => (
                  <div key={step} className="flex items-center gap-3 border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[hsl(var(--foreground))] text-[hsl(var(--background))] font-mono text-xs font-bold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">{step}</p>
                  </div>
                )
              )}
            </div>
            <div className="caution-stripe-thin mt-4" />
          </div>
        </div>
      </section>

      {/* ── MODULES ───────────────────────────────────────────────────── */}
      <section id="modules" className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8">
        <div className="ind-divider-h mb-8" />
        <div className="mb-8">
          <span className="ind-badge-black">PRODUCT_MODULES</span>
          <h2 className="mt-4 font-serif text-3xl font-bold text-[hsl(var(--foreground))] md:text-4xl leading-tight">
            Defined surfaces for<br />
            every GTM motion.
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((mod) => (
            <Link key={mod.id} href={mod.href} className="group">
              <div className="ind-card-dashed ind-hover h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="ind-label ind-hover-invert">{mod.id}</span>
                  <span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))] ind-hover-invert">→</span>
                </div>
                <h3 className="font-sans text-lg font-bold text-[hsl(var(--foreground))] ind-hover-invert">
                  {mod.title}
                </h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 ind-hover-invert leading-relaxed flex-1">
                  {mod.summary}
                </p>
                <div className="mt-4 ind-btn-outline text-[10px] py-1 px-2 w-full text-center group-hover:bg-[hsl(var(--background))] group-hover:text-[hsl(var(--foreground))]">
                  OPEN
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────── */}
      <section id="pricing" className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8">
        <div className="ind-divider-h mb-8" />
        <div className="mb-8">
          <span className="ind-badge-black">PRICING</span>
          <h2 className="mt-4 font-serif text-3xl font-bold text-[hsl(var(--foreground))] md:text-4xl leading-tight">
            Built for teams<br />
            that execute daily.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Starter */}
          <div className="ind-card flex flex-col">
            <span className="ind-label mb-1">TIER_01</span>
            <h3 className="font-sans text-xl font-bold text-[hsl(var(--foreground))]">STARTER</h3>
            <p className="ind-label mt-1">PER REP / MONTH</p>
            <p className="text-4xl font-black text-[hsl(var(--foreground))] mt-4 font-sans">$39</p>
            <ul className="mt-4 space-y-2 text-sm text-[hsl(var(--muted-foreground))] flex-1">
              <li className="flex items-center gap-2"><span className="text-xs">▪</span> Cockpit + workflows</li>
              <li className="flex items-center gap-2"><span className="text-xs">▪</span> Tasks and approvals</li>
              <li className="flex items-center gap-2"><span className="text-xs">▪</span> Core CRM sync</li>
            </ul>
            <Link href={"/auth/signup?plan=starter&callbackUrl=%2Fworkspace%2Fget-started" as Route} className="ind-btn-outline w-full mt-5 text-xs py-2 text-center">
              GET STARTED
            </Link>
          </div>

          {/* Growth — Featured */}
          <div className="ind-card flex flex-col relative border-[hsl(var(--foreground))] border-[3px]">
            <div className="absolute -top-3 right-3">
              <span className="ind-badge">POPULAR</span>
            </div>
            <span className="ind-label mb-1">TIER_02</span>
            <h3 className="font-sans text-xl font-bold text-[hsl(var(--foreground))]">GROWTH</h3>
            <p className="ind-label mt-1">PER REP / MONTH</p>
            <p className="text-4xl font-black text-[hsl(var(--foreground))] mt-4 font-sans">$89</p>
            <ul className="mt-4 space-y-2 text-sm text-[hsl(var(--muted-foreground))] flex-1">
              <li className="flex items-center gap-2"><span className="text-xs">▪</span> Everything in Starter</li>
              <li className="flex items-center gap-2"><span className="text-xs">▪</span> Intelligence + signals</li>
              <li className="flex items-center gap-2"><span className="text-xs">▪</span> Sequence tracking</li>
            </ul>
            <Link href={"/auth/signup?plan=growth&callbackUrl=%2Fworkspace%2Fget-started" as Route} className="ind-btn w-full mt-5 text-xs py-2 text-center">
              CHOOSE GROWTH
            </Link>
          </div>

          {/* Enterprise */}
          <div className="ind-card flex flex-col">
            <span className="ind-label mb-1">TIER_03</span>
            <h3 className="font-sans text-xl font-bold text-[hsl(var(--foreground))]">ENTERPRISE</h3>
            <p className="ind-label mt-1">ANNUAL PLAN</p>
            <p className="text-4xl font-black text-[hsl(var(--foreground))] mt-4 font-sans">Custom</p>
            <ul className="mt-4 space-y-2 text-sm text-[hsl(var(--muted-foreground))] flex-1">
              <li className="flex items-center gap-2"><span className="text-xs">▪</span> Governance + policy controls</li>
              <li className="flex items-center gap-2"><span className="text-xs">▪</span> Dedicated architecture support</li>
              <li className="flex items-center gap-2"><span className="text-xs">▪</span> Custom deployment lanes</li>
            </ul>
            <Link href={"/linkedin-extension" as Route} className="ind-btn-outline w-full mt-5 text-xs py-2 text-center">
              SEE CAPTURE FLOW
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ — Accordion style like Ankitkr0 "Side Projects" ───── */}
      <section id="faq" className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8">
        <div className="ind-divider-h mb-8" />
        <div className="mb-8">
          <span className="ind-badge-black">FAQ</span>
          <h2 className="mt-4 font-serif text-3xl font-bold text-[hsl(var(--foreground))] md:text-4xl leading-tight">
            Questions from<br />
            GTM operators.
          </h2>
        </div>
        <div className="ind-card-dashed space-y-0">
          {faqs.map((faq, i) => (
            <div key={faq.question}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between py-4 px-1 text-left group"
              >
                <div className="flex items-center gap-3">
                  <span className="ind-label">Q_{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-sans text-sm font-bold text-[hsl(var(--foreground))]">
                    {faq.question}
                  </span>
                </div>
                <span className="font-mono text-lg text-[hsl(var(--muted-foreground))] transition-transform duration-200"
                  style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0)" }}
                >
                  ▾
                </span>
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: openFaq === i ? "200px" : "0", opacity: openFaq === i ? 1 : 0 }}
              >
                <p className="text-sm text-[hsl(var(--muted-foreground))] pb-4 pl-[3.5rem] leading-relaxed">
                  {faq.answer}
                </p>
              </div>
              {i < faqs.length - 1 && <div className="ind-divider-h" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-0 pt-4 md:px-8">
        <div className="border-[2px] border-[hsl(var(--foreground))] bg-[hsl(var(--foreground))] p-5">
          <div className="flex flex-col gap-5 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-serif text-2xl font-bold text-[hsl(var(--background))]">
                Build from one execution surface.
              </h3>
              <p className="mt-1 text-sm font-mono text-[hsl(var(--background))]/70 tracking-wider">
                CONNECT YOUR STACK // RUN YOUR SALES MOTION WITH AI + OPERATOR CONTROL
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link href={"/auth/signup?callbackUrl=%2Fworkspace%2Fget-started" as Route} className="ind-btn-banner-solid">
                CREATE ACCOUNT
              </Link>
              <Link href={"/book-demo" as Route} className="ind-btn-banner-outline">
                BOOK DEMO
              </Link>
              <Link href={"/linkedin-extension" as Route} className="ind-btn-banner-outline">
                INSTALL COMPANION
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="mx-auto w-full max-w-7xl px-5 pb-4 pt-6 md:px-8">
        <div className="caution-stripe-thin mb-4" />
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs font-bold text-[hsl(var(--foreground))]">VELOCITY_OS®</span>
            <div className="ind-divider-v h-3" />
            <span className="ind-label">AI-NATIVE SALES EXECUTION</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="ind-label">EST. 2026</span>
            <div className="ind-divider-v h-3" />
            <span className="ind-label">SYSTEM_STATUS: <span className="text-[hsl(var(--foreground))] font-bold">OPERATIONAL</span></span>
          </div>
        </div>
      </footer>
    </main>
  );
}
