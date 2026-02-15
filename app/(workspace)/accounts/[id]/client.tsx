"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AccountForm } from "@/components/crm/account-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AccountDetailClientProps {
  accountId: string;
  accountName: string;
}

export function AccountDetailClient({ accountId, accountName }: AccountDetailClientProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Account deleted");
        router.push("/accounts");
      } else {
        const error = await res.json();
        toast.error(error.error ?? "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          Edit
        </Button>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
          Delete
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogClose onClose={() => setEditOpen(false)} />
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <AccountForm
            mode="edit"
            initialData={{ id: accountId, name: accountName, segment: "mid-market" }}
            onSuccess={() => {
              setEditOpen(false);
              router.refresh();
            }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogClose onClose={() => setDeleteOpen(false)} />
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{accountName}&quot;? This action cannot be undone.
              All associated contacts and deals will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
