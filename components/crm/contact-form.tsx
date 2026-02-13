"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";

interface ContactFormProps {
  mode: "create" | "edit";
  initialData?: {
    id?: string;
    fullName: string;
    title: string;
    email?: string;
    linkedIn?: string;
    role: "champion" | "approver" | "blocker" | "influencer";
    accountId?: string;
  };
  accounts?: Array<{ id: string; name: string }>;
  onSuccess?: (result: { id: string; fullName: string }) => void;
  onCancel?: () => void;
}

export function ContactForm({ mode, initialData, accounts = [], onSuccess, onCancel }: ContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(initialData?.fullName ?? "");
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [linkedIn, setLinkedIn] = useState(initialData?.linkedIn ?? "");
  const [role, setRole] = useState<"champion" | "approver" | "blocker" | "influencer">(
    initialData?.role ?? "influencer"
  );
  const [accountId, setAccountId] = useState(initialData?.accountId ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        fullName,
        title,
        role,
        accountId,
        ...(email ? { email } : {}),
        ...(linkedIn ? { linkedIn } : {})
      };

      const url = mode === "edit" && initialData?.id 
        ? `/api/contacts/${initialData.id}` 
        : "/api/contacts";
      
      const res = await fetch(url, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(mode === "edit" ? "Contact updated" : "Contact created");
        onSuccess?.(result);
      } else {
        const error = await res.json();
        toast.error(error.error ?? "Failed to save contact");
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      toast.error("Failed to save contact");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[hsl(var(--foreground))]">
          Full Name *
        </label>
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Smith"
          required
          minLength={2}
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[hsl(var(--foreground))]">
          Title *
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="VP of Engineering"
          required
          minLength={2}
          maxLength={100}
        />
      </div>

      {mode === "create" && accounts.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-[hsl(var(--foreground))]">
            Account *
          </label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-[hsl(var(--foreground))]">
          Role
        </label>
        <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="champion">Champion</SelectItem>
            <SelectItem value="approver">Approver</SelectItem>
            <SelectItem value="blocker">Blocker</SelectItem>
            <SelectItem value="influencer">Influencer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[hsl(var(--foreground))]">
          Email
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[hsl(var(--foreground))]">
          LinkedIn
        </label>
        <Input
          type="url"
          value={linkedIn}
          onChange={(e) => setLinkedIn(e.target.value)}
          placeholder="https://linkedin.com/in/janesmith"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading || !fullName || !title || (mode === "create" && !accountId)}>
          {loading ? "Saving..." : mode === "edit" ? "Update Contact" : "Create Contact"}
        </Button>
      </div>
    </form>
  );
}
