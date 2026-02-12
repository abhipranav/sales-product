"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const routes = [
  { href: "/workspace", label: "Overview" },
  { href: "/cockpit", label: "Cockpit" },
  { href: "/accounts", label: "Accounts" },
  { href: "/contacts", label: "Contacts" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/intelligence", label: "Intelligence" },
  { href: "/notifications", label: "Notifications" },
  { href: "/integrations", label: "Integrations" },
  { href: "/workflows", label: "Workflows" }
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
              "rounded px-2.5 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            )}
          >
            {route.label}
          </Link>
        );
      })}
    </nav>
  );
}
