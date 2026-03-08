import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

export default function BookDemoPage() {
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
            <Link href={"/auth/signup" as Route} className="ind-btn text-xs py-1.5 px-3">
              CREATE ACCOUNT
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-12 w-full max-w-4xl px-5 md:px-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left Side: Copy */}
          <div>
            <div className="mb-4">
              <span className="ind-badge-black">BOOK DEMO</span>
            </div>
            <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-[hsl(var(--foreground))] mb-6">
              See Velocity_OS in action.
            </h1>
            <p className="font-mono text-sm leading-relaxed text-[hsl(var(--muted-foreground))] mb-8">
              Tour the platform that replaces 5 disjointed tools with one execution surface. 
              We&apos;ll show you how top performing teams use our AI to cut cycle times by 9 days and 
              reduce admin load by 37%.
            </p>

            <div className="space-y-6">
              <div className="border-l-[2px] border-[hsl(var(--foreground))] pl-4">
                <p className="font-bold text-[hsl(var(--foreground))] text-sm">&quot;Velocity completely eliminated our tech stack sprawl.&quot;</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">VP of Sales, Acme Corp</p>
              </div>
              <div className="border-l-[2px] border-[hsl(var(--foreground))] pl-4">
                <p className="font-bold text-[hsl(var(--foreground))] text-sm">&quot;The LinkedIn companion alone saves our SDRs 20 hours a week.&quot;</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Director of Revenue Operations, Globex</p>
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="ind-card border-[2px] border-[hsl(var(--border))]">
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" name="firstName" placeholder="Jane" required className="bg-[hsl(var(--background))]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" name="lastName" placeholder="Doe" required className="bg-[hsl(var(--background))]" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workEmail">Work email</Label>
                <Input id="workEmail" name="workEmail" type="email" placeholder="jane@company.com" required className="bg-[hsl(var(--background))]" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize">Company size</Label>
                <NativeSelect id="companySize" name="companySize" className="bg-[hsl(var(--background))]">
                  <option value="1-49">1-49 employees</option>
                  <option value="50-199">50-199 employees</option>
                  <option value="200-999">200-999 employees</option>
                  <option value="1000+">1000+ employees</option>
                </NativeSelect>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Your role</Label>
                <NativeSelect id="role" name="role" className="bg-[hsl(var(--background))]">
                  <option value="exec">VP / C-Level</option>
                  <option value="director">Director / Manager</option>
                  <option value="rep">Individual Contributor</option>
                  <option value="ops">RevOps / Enablement</option>
                </NativeSelect>
              </div>

              <Button type="button" className="w-full mt-4 ind-btn h-12">
                REQUEST DEMO
              </Button>
            </form>

            <div className="mt-4 caution-stripe-thin h-2" />
          </div>
        </div>
      </div>
    </main>
  );
}
