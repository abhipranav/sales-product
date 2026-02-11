import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90",
        secondary:
          "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/80",
        outline:
          "border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",
        ghost:
          "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",
        destructive:
          "bg-[hsl(var(--destructive))] text-white hover:bg-[hsl(var(--destructive))]/90",
        success:
          "bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90",
        cta:
          "bg-[hsl(var(--cta))] text-[hsl(var(--cta-foreground))] font-semibold hover:bg-[hsl(var(--cta))]/90",
        accent:
          "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90"
      },
      size: {
        default: "h-9 px-4 py-2 rounded-md",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-10 px-5 text-sm rounded-md",
        icon: "h-9 w-9 rounded-md"
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
