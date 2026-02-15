"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { deleteDealAction, updateDealAction } from "@/app/actions/crm-records";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

interface Deal {
  id: string;
  name: string;
  stage: string;
  amount: number;
  confidence: number;
  closeDate: Date;
  riskSummary: string;
}

interface DealDetailClientProps {
  deal: Deal;
}

export function DealDetailClient({ deal }: DealDetailClientProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const formData = new FormData();
    formData.append("dealId", deal.id);
    await deleteDealAction(formData);
    router.push("/pipeline");
  };

  const closeDate = new Date(deal.closeDate);
  const formattedCloseDate = closeDate.toISOString().slice(0, 16);

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setIsEditOpen(true)}>
          Edit Deal
        </Button>
        <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
          Delete
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
            <DialogDescription>Update deal information</DialogDescription>
          </DialogHeader>
          <form
            action={async (formData) => {
              await updateDealAction(formData);
              setIsEditOpen(false);
              router.refresh();
            }}
            className="space-y-4"
          >
            <input type="hidden" name="dealId" value={deal.id} />

            <div className="space-y-2">
              <Label htmlFor="name">Deal Name</Label>
              <Input id="name" name="name" defaultValue={deal.name} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <NativeSelect id="stage" name="stage" defaultValue={deal.stage}>
                <option value="discovery">Discovery</option>
                <option value="evaluation">Evaluation</option>
                <option value="proposal">Proposal</option>
                <option value="procurement">Procurement</option>
                <option value="closed-won">Closed Won</option>
                <option value="closed-lost">Closed Lost</option>
              </NativeSelect>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min={0}
                  step={1000}
                  defaultValue={deal.amount}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confidence">Confidence (0-1)</Label>
                <Input
                  id="confidence"
                  name="confidence"
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  defaultValue={deal.confidence}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closeDate">Close Date</Label>
              <Input
                id="closeDate"
                name="closeDate"
                type="datetime-local"
                defaultValue={formattedCloseDate}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskSummary">Risk Summary</Label>
              <Textarea
                id="riskSummary"
                name="riskSummary"
                defaultValue={deal.riskSummary}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deal.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
