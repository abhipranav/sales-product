import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border-[2px] px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-[0.08em]",
  {
    variants: {
      variant: {
        default:
          "border-[hsl(var(--foreground))] bg-[hsl(var(--foreground))] text-[hsl(var(--background))]",
        secondary:
          "border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
        outline:
          "border-[hsl(var(--border))] bg-transparent text-[hsl(var(--muted-foreground))]",
        success:
          "border-[hsl(var(--success))] bg-[hsl(var(--success))] text-[hsl(var(--background))]",
        warning:
          "border-[hsl(var(--warning))] bg-[hsl(var(--warning))] text-[hsl(var(--background))]",
        destructive:
          "border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))] text-[hsl(var(--background))]",
        accent:
          "border-[var(--ind-black)] bg-[var(--ind-yellow)] text-[var(--ind-black)]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
