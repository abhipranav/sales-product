"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";

interface AccountFormProps {
  mode: "create" | "edit";
  initialData?: {
    id?: string;
    name: string;
    segment: "startup" | "mid-market" | "enterprise";
    website?: string;
    employeeBand?: string;
  };
  onSuccess?: (result: { id: string; name: string }) => void;
  onCancel?: () => void;
}

export function AccountForm({ mode, initialData, onSuccess, onCancel }: AccountFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialData?.name ?? "");
  const [segment, setSegment] = useState<"startup" | "mid-market" | "enterprise">(
    initialData?.segment ?? "mid-market"
  );
  const [website, setWebsite] = useState(initialData?.website ?? "");
  const [employeeBand, setEmployeeBand] = useState(initialData?.employeeBand ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name,
        segment,
        ...(website ? { website } : {}),
        ...(employeeBand ? { employeeBand } : {})
      };

      const url = mode === "edit" && initialData?.id 
        ? `/api/accounts/${initialData.id}` 
        : "/api/accounts";
      
      const res = await fetch(url, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(mode === "edit" ? "Account updated" : "Account created");
        onSuccess?.(result);
      } else {
        const error = await res.json();
        toast.error(error.error ?? "Failed to save account");
      }
    } catch (error) {
      console.error("Error saving account:", error);
      toast.error("Failed to save account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[hsl(var(--foreground))]">
          Account Name *
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Corporation"
          required
          minLength={2}
          maxLength={120}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[hsl(var(--foreground))]">
          Segment
        </label>
        <Select value={segment} onValueChange={(v) => setSegment(v as typeof segment)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="startup">Startup</SelectItem>
            <SelectItem value="mid-market">Mid-Market</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[hsl(var(--foreground))]">
          Website
        </label>
        <Input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[hsl(var(--foreground))]">
          Employee Band
        </label>
        <Input
          value={employeeBand}
          onChange={(e) => setEmployeeBand(e.target.value)}
          placeholder="50-200"
          maxLength={40}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading || !name}>
          {loading ? "Saving..." : mode === "edit" ? "Update Account" : "Create Account"}
        </Button>
      </div>
    </form>
  );
}
