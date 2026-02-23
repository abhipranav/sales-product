import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium font-mono uppercase tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-[2px] border-[hsl(var(--foreground))] bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:bg-[var(--ind-yellow)] hover:text-[var(--ind-black)] hover:border-[var(--ind-black)]",
        secondary:
          "border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))]",
        outline:
          "border-[2px] border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))]",
        ghost:
          "border-[2px] border-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",
        destructive:
          "border-[2px] border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))] text-[hsl(var(--background))] hover:bg-transparent hover:text-[hsl(var(--destructive))]",
        success:
          "border-[2px] border-[hsl(var(--success))] bg-[hsl(var(--success))] text-[hsl(var(--background))] hover:bg-transparent hover:text-[hsl(var(--success))]",
        cta:
          "border-[2px] border-[var(--ind-black)] bg-[var(--ind-yellow)] text-[var(--ind-black)] font-bold hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))] hover:border-[hsl(var(--foreground))]",
        accent:
          "border-[2px] border-[hsl(var(--accent))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-transparent hover:text-[hsl(var(--foreground))]"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-[11px]",
        lg: "h-10 px-5 text-sm",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
