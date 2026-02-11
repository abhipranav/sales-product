import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium tracking-wide",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
        secondary:
          "border-transparent bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
        outline:
          "border-[hsl(var(--border))] bg-transparent text-[hsl(var(--muted-foreground))]",
        success:
          "border-transparent bg-[hsl(var(--success))] text-white",
        warning:
          "border-transparent bg-[hsl(var(--warning))] text-white",
        destructive:
          "border-transparent bg-[hsl(var(--destructive))] text-white",
        accent:
          "border-transparent bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
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
