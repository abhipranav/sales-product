"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const routes = [
  { href: "/workspace", label: "OVERVIEW", id: "NAV_01" },
  { href: "/cockpit", label: "COCKPIT", id: "NAV_02" },
  { href: "/accounts", label: "ACCOUNTS", id: "NAV_03" },
  { href: "/contacts", label: "CONTACTS", id: "NAV_04" },
  { href: "/pipeline", label: "PIPELINE", id: "NAV_05" },
  { href: "/intelligence", label: "INTELLIGENCE", id: "NAV_06" },
  { href: "/notifications", label: "NOTIFICATIONS", id: "NAV_07" },
  { href: "/integrations", label: "INTEGRATIONS", id: "NAV_08" },
  { href: "/workflows", label: "WORKFLOWS", id: "NAV_09" },
  { href: "/activities", label: "ACTIVITIES", id: "NAV_10" },
  { href: "/settings", label: "SETTINGS", id: "NAV_11" },
  { href: "/setup", label: "SETUP", id: "NAV_12" },
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
  );
}
