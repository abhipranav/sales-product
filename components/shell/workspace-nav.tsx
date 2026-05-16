"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const routes = [
  { href: "/workspace", label: "OVERVIEW", id: "NAV_01" },
  { href: "/cockpit", label: "COCKPIT", id: "NAV_02" },
  { href: "/pipeline", label: "PIPELINE", id: "NAV_03" },
  { href: "/accounts", label: "ACCOUNTS", id: "NAV_04" },
  { href: "/contacts", label: "CONTACTS", id: "NAV_05" },
  { href: "/activities", label: "ACTIVITIES", id: "NAV_06" },
  { href: "/intelligence", label: "INTELLIGENCE", id: "NAV_07" },
  { href: "/workflows", label: "WORKFLOWS", id: "NAV_08" },
  { href: "/notifications", label: "NOTIFICATIONS", id: "NAV_09" },
  { href: "/integrations", label: "INTEGRATIONS", id: "NAV_10" },
  { href: "/settings", label: "SETTINGS", id: "NAV_11" },
  { href: "/user-guide", label: "USER GUIDE", id: "NAV_12" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkspaceNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col">
      <nav className="flex flex-col gap-0.5">
        {routes.map((route) => {
          const active = isActive(pathname, route.href);
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] transition-all duration-150",
                active
                  ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]"
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))]"
              )}
            >
              <span className="text-[9px] opacity-50">{route.id}</span>
              {route.label}
            </Link>
          );
        })}
      </nav>

      {/* Global Ingestion Trigger */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("open-quick-ingest"))}
        className="mt-3 w-full flex items-center justify-between border-[2px] border-[hsl(var(--border))] hover:border-[hsl(var(--foreground))] bg-[hsl(var(--card))] hover:bg-yellow-400 hover:text-black p-2 font-mono text-[10px] font-black uppercase tracking-wider text-left transition-all duration-150 relative cursor-pointer group"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full border border-black animate-pulse" />
          [ QUICK_CAPTURE ]
        </span>
        <span className="text-[8px] bg-[hsl(var(--muted))] group-hover:bg-black group-hover:text-yellow-400 px-1 py-0.5 border text-[hsl(var(--muted-foreground))] font-bold font-mono">
          Q
        </span>
      </button>
    </div>
  );
}

