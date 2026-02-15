"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/crm/contact-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ContactDetailClientProps {
  contactId: string;
  contactName: string;
}

export function ContactDetailClient({ contactId, contactName }: ContactDetailClientProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Contact deleted");
        router.push("/contacts");
      } else {
        const error = await res.json();
        toast.error(error.error ?? "Failed to delete contact");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
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
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <ContactForm
            mode="edit"
            initialData={{ id: contactId, fullName: contactName, title: "", role: "influencer" }}
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
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{contactName}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Contact"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
