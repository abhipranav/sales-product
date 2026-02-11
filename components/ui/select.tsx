"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Context for Select
interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select");
  }
  return context;
}

// Select Root
interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ value = "", onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: onValueChange ?? (() => {}),
        open,
        setOpen
      }}
    >
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

// Select Trigger
interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
}

export function SelectTrigger({ className, children, ...props }: SelectTriggerProps) {
  const { open, setOpen } = useSelectContext();

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm text-[hsl(var(--foreground))] shadow-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("transition-transform", open ? "rotate-180" : "")}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

// Select Value
interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const { value } = useSelectContext();
  return <span className={!value ? "text-[hsl(var(--muted-foreground))]" : ""}>{value || placeholder}</span>;
}

// Select Content
interface SelectContentProps {
  children: React.ReactNode;
}

export function SelectContent({ children }: SelectContentProps) {
  const { open, setOpen } = useSelectContext();

  React.useEffect(() => {
    if (open) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest("[data-select-content]") && !target.closest("[data-select-trigger]")) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      data-select-content
      className="absolute z-50 mt-1 min-w-[8rem] w-full overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-md animate-in fade-in-0 zoom-in-95"
    >
      <div className="p-1">{children}</div>
    </div>
  );
}

// Select Item
interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export function SelectItem({ value, children }: SelectItemProps) {
  const { value: selectedValue, onValueChange, setOpen } = useSelectContext();
  const isSelected = selectedValue === value;

  return (
    <div
      onClick={() => {
        onValueChange(value);
        setOpen(false);
      }}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:bg-[hsl(var(--muted))]",
        isSelected && "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
      )}
    >
      {children}
    </div>
  );
}
