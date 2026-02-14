import {
  createContactAction,
  createDealAction,
  updateAccountAction,
  updateDealAction
} from "@/app/actions/crm-records";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { Account, Deal } from "@/lib/domain/types";

interface CrmCommandCenterProps {
  account: Account;
  deal: Deal;
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CrmCommandCenter({ account, deal }: CrmCommandCenterProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-['Sora',sans-serif]">CRM Command Center</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={updateAccountAction} className="grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <input type="hidden" name="accountId" value={account.id} />
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Update Account</p>
          <div className="grid gap-2 md:grid-cols-2">
            <Input name="name" defaultValue={account.name} />
            <NativeSelect name="segment" defaultValue={account.segment}>
              <option value="startup">startup</option>
              <option value="mid-market">mid-market</option>
              <option value="enterprise">enterprise</option>
            </NativeSelect>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <Input name="website" defaultValue={account.website ?? ""} placeholder="https://company.com" />
            <Input name="employeeBand" defaultValue={account.employeeBand ?? ""} placeholder="100-500" />
          </div>
          <Button type="submit" variant="outline">
            Save Account
          </Button>
        </form>

        <form action={createContactAction} className="grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <input type="hidden" name="accountId" value={account.id} />
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Add Stakeholder</p>
          <div className="grid gap-2 md:grid-cols-2">
            <Input name="fullName" required minLength={2} placeholder="Full name" />
            <Input name="title" required minLength={2} placeholder="Title" />
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <Input name="email" type="email" placeholder="work email" />
            <Input name="linkedInUrl" placeholder="https://linkedin.com/in/..." />
            <NativeSelect name="role" defaultValue="influencer">
              <option value="champion">champion</option>
              <option value="approver">approver</option>
              <option value="blocker">blocker</option>
              <option value="influencer">influencer</option>
            </NativeSelect>
          </div>
          <Button type="submit">Create Contact</Button>
        </form>

        <form action={createDealAction} className="grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <input type="hidden" name="accountId" value={account.id} />
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Create New Deal</p>
          <div className="grid gap-2 md:grid-cols-2">
            <Input name="name" required minLength={2} placeholder="Deal name" />
            <NativeSelect name="stage" defaultValue="discovery">
              <option value="discovery">discovery</option>
              <option value="evaluation">evaluation</option>
              <option value="proposal">proposal</option>
              <option value="procurement">procurement</option>
              <option value="closed-won">closed-won</option>
              <option value="closed-lost">closed-lost</option>
            </NativeSelect>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <Input name="amount" type="number" min={0} step={1000} defaultValue={50000} />
            <Input name="confidence" type="number" min={0} max={1} step={0.01} defaultValue={0.5} />
            <Input name="closeDate" type="datetime-local" required />
          </div>
          <Textarea name="riskSummary" minLength={5} placeholder="Primary risk summary..." required rows={2} />
          <Button type="submit" variant="outline">
            Create Deal
          </Button>
        </form>

        <form action={updateDealAction} className="grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <input type="hidden" name="dealId" value={deal.id} />
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Update Active Deal</p>
          <div className="grid gap-2 md:grid-cols-2">
            <Input name="name" defaultValue={deal.name} />
            <NativeSelect name="stage" defaultValue={deal.stage}>
              <option value="discovery">discovery</option>
              <option value="evaluation">evaluation</option>
              <option value="proposal">proposal</option>
              <option value="procurement">procurement</option>
              <option value="closed-won">closed-won</option>
              <option value="closed-lost">closed-lost</option>
            </NativeSelect>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <Input name="amount" type="number" min={0} step={1000} defaultValue={deal.amount} />
            <Input name="confidence" type="number" min={0} max={1} step={0.01} defaultValue={deal.confidence} />
            <Input name="closeDate" type="datetime-local" defaultValue={toDateTimeLocal(deal.closeDate)} />
          </div>
          <Textarea name="riskSummary" defaultValue={deal.riskSummary} rows={2} />
          <Button type="submit">Save Deal</Button>
        </form>
      </CardContent>
    </Card>
  );
}
