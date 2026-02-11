"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Native HTML Select component - simpler version for forms
export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-md border border-[hsl(var(--border))] bg-transparent px-3 py-1 text-sm text-[hsl(var(--foreground))] shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:border-[hsl(var(--ring))]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
NativeSelect.displayName = "NativeSelect";
