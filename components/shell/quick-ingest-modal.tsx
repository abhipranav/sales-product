"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ActiveTab = "task" | "meeting" | "contact" | "deal";

interface AccountOption {
  id: string;
  name: string;
}

interface DealOption {
  id: string;
  name: string;
}

export function QuickIngestModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("task");
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [deals, setDeals] = useState<DealOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states - Task
  const [taskDealId, setTaskDealId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [taskChannel, setTaskChannel] = useState<"email" | "phone" | "linkedin" | "meeting">("email");
  const [taskDueAt, setTaskDueAt] = useState("");

  // Form states - Meeting Notes
  const [meetingDealId, setMeetingDealId] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingHappenedAt, setMeetingHappenedAt] = useState("");

  // Form states - Contact
  const [contactAccountId, setContactAccountId] = useState("");
  const [contactFullName, setContactFullName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactLinkedIn, setContactLinkedIn] = useState("");
  const [contactRole, setContactRole] = useState<"champion" | "approver" | "blocker" | "influencer">("influencer");

  // Form states - Deal
  const [dealAccountId, setDealAccountId] = useState("");
  const [dealName, setDealName] = useState("");
  const [dealStage, setDealStage] = useState<"discovery" | "evaluation" | "proposal" | "procurement" | "closed-won" | "closed-lost">("discovery");
  const [dealAmount, setDealAmount] = useState("");
  const [dealConfidence, setDealConfidence] = useState("0.8");
  const [dealCloseDate, setDealCloseDate] = useState("");
  const [dealRiskSummary, setDealRiskSummary] = useState("");

  // Listen for hotkey Q and custom event
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "q") {
        // Skip if typing in an input, textarea or editable field
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        setOpen((o) => !o);
      }
    }

    function handleOpenEvent() {
      setOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-quick-ingest", handleOpenEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-quick-ingest", handleOpenEvent);
    };
  }, []);

  // Fetch accounts and deals when modal opens
  useEffect(() => {
    if (!open) return;

    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const [accRes, dealRes] = await Promise.all([
          fetch("/api/accounts?limit=100"),
          fetch("/api/deals?limit=100"),
        ]);
        const accData = await accRes.json().catch(() => ({}));
        const dealData = await dealRes.json().catch(() => ({}));

        const accOptions = accData.results || [];
        const dealOptions = dealData.results || [];

        setAccounts(accOptions);
        setDeals(dealOptions);

        if (accOptions.length > 0) {
          setContactAccountId(accOptions[0].id);
          setDealAccountId(accOptions[0].id);
        }
        if (dealOptions.length > 0) {
          setTaskDealId(dealOptions[0].id);
          setMeetingDealId(dealOptions[0].id);
        }
      } catch (err) {
        console.error("Failed to load quick-ingest options", err);
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, [open]);

  // Set default due/close dates
  useEffect(() => {
    if (!open) return;
    
    // Set due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const tomorrowLocal = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
    setTaskDueAt(tomorrowLocal);

    // Set meeting happened at to now
    const now = new Date();
    const nowLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setMeetingHappenedAt(nowLocal);

    // Set close date to 1 month from now
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setHours(17, 0, 0, 0);
    const nextMonthLocal = new Date(nextMonth.getTime() - nextMonth.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setDealCloseDate(nextMonthLocal);
  }, [open]);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle) {
      toast.error("Task title is required.");
      return;
    }
    if (!taskDealId) {
      toast.error("No active deal available. Please seed or create a deal first.");
      return;
    }

    setSubmitting(true);
    toast.loading("Creating task...", { id: "quick-ingest" });

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: taskDealId,
          title: taskTitle,
          priority: taskPriority,
          suggestedChannel: taskChannel,
          dueAt: new Date(taskDueAt).toISOString(),
          owner: "rep",
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to create task.");

      toast.success("Task created successfully!", { id: "quick-ingest" });
      setTaskTitle("");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message, { id: "quick-ingest" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (meetingNotes.length < 20) {
      toast.error("Meeting notes must be at least 20 characters.");
      return;
    }
    if (!meetingDealId) {
      toast.error("No active deal available.");
      return;
    }

    setSubmitting(true);
    toast.loading("Processing meeting notes...", { id: "quick-ingest" });

    try {
      const res = await fetch("/api/meetings/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: meetingDealId,
          notes: meetingNotes,
          happenedAt: new Date(meetingHappenedAt).toISOString(),
          actor: "rep",
          source: "manual-notes",
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to process meeting notes.");

      toast.success("Meeting notes processed! Signal and follow-up generated.", { id: "quick-ingest" });
      setMeetingNotes("");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message, { id: "quick-ingest" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactFullName || !contactTitle) {
      toast.error("Name and title are required.");
      return;
    }
    if (!contactAccountId) {
      toast.error("No active account available.");
      return;
    }

    setSubmitting(true);
    toast.loading("Adding stakeholder contact...", { id: "quick-ingest" });

    try {
      const bodyPayload: any = {
        accountId: contactAccountId,
        fullName: contactFullName,
        title: contactTitle,
        role: contactRole,
      };
      if (contactEmail) bodyPayload.email = contactEmail;
      if (contactLinkedIn) bodyPayload.linkedInUrl = contactLinkedIn;

      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to create contact.");

      toast.success("Stakeholder contact added successfully!", { id: "quick-ingest" });
      setContactFullName("");
      setContactTitle("");
      setContactEmail("");
      setContactLinkedIn("");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message, { id: "quick-ingest" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateDeal(e: React.FormEvent) {
    e.preventDefault();
    if (!dealName || !dealAmount || dealRiskSummary.length < 5) {
      toast.error("Please fill in deal name, amount, and a short risk summary.");
      return;
    }
    if (!dealAccountId) {
      toast.error("No active account available.");
      return;
    }

    setSubmitting(true);
    toast.loading("Creating sales opportunity...", { id: "quick-ingest" });

    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: dealAccountId,
          name: dealName,
          stage: dealStage,
          amount: parseInt(dealAmount, 10),
          confidence: parseFloat(dealConfidence),
          closeDate: new Date(dealCloseDate).toISOString(),
          riskSummary: dealRiskSummary,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to create deal.");

      toast.success("Sales pipeline opportunity captured!", { id: "quick-ingest" });
      setDealName("");
      setDealAmount("");
      setDealRiskSummary("");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message, { id: "quick-ingest" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-[hsl(var(--card))] border-[2px] border-[hsl(var(--border))] rounded-lg">
        <DialogClose onClose={() => setOpen(false)} />
        
        {/* Banner stripes */}
        <div className="caution-stripe-thin" />

        <DialogHeader className="p-4 border-b border-[hsl(var(--border))] flex justify-between items-center">
          <DialogTitle className="font-mono text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <span>⚡</span> GTM Speed-Ingestion Console
          </DialogTitle>
        </DialogHeader>

        {/* Tactile Tab bar */}
        <div className="flex border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
          {(["task", "meeting", "contact", "deal"] as ActiveTab[]).map((tab, idx) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 font-mono text-[10px] font-bold uppercase tracking-wider py-2.5 transition-all text-center border-r last:border-r-0 border-[hsl(var(--border))] ${
                  active
                    ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]"
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted)/0.5)]"
                }`}
              >
                [{idx + 1}] {tab}
              </button>
            );
          })}
        </div>

        <div className="p-5 md:p-6 max-h-[480px] overflow-y-auto">
          {loadingOptions ? (
            <div className="py-12 text-center font-mono text-xs text-[hsl(var(--muted-foreground))] animate-pulse">
              LOADING_CRM_Telemetries...
            </div>
          ) : (
            <>
              {/* TASK TAB */}
              {activeTab === "task" && (
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="task-deal" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                      Target Sales Deal
                    </Label>
                    <select
                      id="task-deal"
                      value={taskDealId}
                      onChange={(e) => setTaskDealId(e.target.value)}
                      className="w-full bg-[hsl(var(--card))] border-[2px] border-[hsl(var(--border))] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[hsl(var(--foreground))]"
                    >
                      {deals.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="task-title" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                      Task Description / Action Required
                    </Label>
                    <Input
                      id="task-title"
                      placeholder="e.g. Schedule security review call with Maya"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="font-mono text-xs border-[2px] border-[hsl(var(--border))]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="task-channel" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                        Engagement Channel
                      </Label>
                      <select
                        id="task-channel"
                        value={taskChannel}
                        onChange={(e) => setTaskChannel(e.target.value as any)}
                        className="w-full bg-[hsl(var(--card))] border-[2px] border-[hsl(var(--border))] px-3 py-2 text-sm font-mono focus:outline-none"
                      >
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="meeting">Meeting</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="task-priority" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                        Priority Level
                      </Label>
                      <select
                        id="task-priority"
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value as any)}
                        className="w-full bg-[hsl(var(--card))] border-[2px] border-[hsl(var(--border))] px-3 py-2 text-sm font-mono focus:outline-none"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="task-due" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                      Execution Deadline
                    </Label>
                    <Input
                      id="task-due"
                      type="datetime-local"
                      value={taskDueAt}
                      onChange={(e) => setTaskDueAt(e.target.value)}
                      className="font-mono text-xs border-[2px] border-[hsl(var(--border))]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 font-mono text-[11px] uppercase font-bold tracking-wider"
                  >
                    {submitting ? "CREATING..." : "[ REGISTER_TASK ]"}
                  </Button>
                </form>
              )}

              {/* MEETING NOTES TAB */}
              {activeTab === "meeting" && (
                <form onSubmit={handleLogMeeting} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="meeting-deal" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                      Select Deal Context
                    </Label>
                    <select
                      id="meeting-deal"
                      value={meetingDealId}
                      onChange={(e) => setMeetingDealId(e.target.value)}
                      className="w-full bg-[hsl(var(--card))] border-[2px] border-[hsl(var(--border))] px-3 py-2 text-sm font-mono focus:outline-none"
                    >
                      {deals.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="meeting-notes" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                      Meeting Conversation Notes (Min 20 characters)
                    </Label>
                    <Textarea
                      id="meeting-notes"
                      placeholder="e.g. Maya confirmed interest in moving to enterprise tier. Objection on integration complexity and timing..."
                      value={meetingNotes}
                      onChange={(e) => setMeetingNotes(e.target.value)}
                      rows={5}
                      className="font-mono text-xs border-[2px] border-[hsl(var(--border))]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="meeting-date" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                      Interaction Date & Time
                    </Label>
                    <Input
                      id="meeting-date"
                      type="datetime-local"
                      value={meetingHappenedAt}
                      onChange={(e) => setMeetingHappenedAt(e.target.value)}
                      className="font-mono text-xs border-[2px] border-[hsl(var(--border))]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 font-mono text-[11px] uppercase font-bold tracking-wider"
                  >
                    {submitting ? "PROCESSING..." : "[ PROCESS_MEETING_NOTES ]"}
                  </Button>
                </form>
              )}

              {/* CONTACT TAB */}
              {activeTab === "contact" && (
                <form onSubmit={handleAddContact} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-account" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                      Select CRM Target Account
                    </Label>
                    <select
                      id="contact-account"
                      value={contactAccountId}
                      onChange={(e) => setContactAccountId(e.target.value)}
                      className="w-full bg-[hsl(var(--card))] border-[2px] border-[hsl(var(--border))] px-3 py-2 text-sm font-mono focus:outline-none"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-name" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                        Full Name
                      </Label>
                      <Input
                        id="contact-name"
                        placeholder="e.g. Maya Kim"
                        value={contactFullName}
                        onChange={(e) => setContactFullName(e.target.value)}
                        className="font-mono text-xs border-[2px] border-[hsl(var(--border))]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="contact-title" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                        Corporate Title
                      </Label>
                      <Input
                        id="contact-title"
                        placeholder="e.g. VP of Operations"
                        value={contactTitle}
                        onChange={(e) => setContactTitle(e.target.value)}
                        className="font-mono text-xs border-[2px] border-[hsl(var(--border))]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-role" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                        Relationship Role
                      </Label>
                      <select
                        id="contact-role"
                        value={contactRole}
                        onChange={(e) => setContactRole(e.target.value as any)}
                        className="w-full bg-[hsl(var(--card))] border-[2px] border-[hsl(var(--border))] px-3 py-2 text-sm font-mono focus:outline-none"
                      >
                        <option value="champion">Champion</option>
                        <option value="approver">Approver</option>
                        <option value="blocker">Blocker</option>
                        <option value="influencer">Influencer</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="contact-email" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                        Email Address (Optional)
                      </Label>
                      <Input
                        id="contact-email"
                        placeholder="e.g. maya@domain.com"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="font-mono text-xs border-[2px] border-[hsl(var(--border))]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-linkedin" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                      LinkedIn URL (Optional)
                    </Label>
                    <Input
                      id="contact-linkedin"
                      placeholder="e.g. https://linkedin.com/in/mayakim"
                      value={contactLinkedIn}
                      onChange={(e) => setContactLinkedIn(e.target.value)}
                      className="font-mono text-xs border-[2px] border-[hsl(var(--border))]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 font-mono text-[11px] uppercase font-bold tracking-wider"
                  >
                    {submitting ? "ADDING..." : "[ REGISTER_CONTACT_ROLE ]"}
                  </Button>
                </form>
              )}

              {/* DEAL TAB */}
              {activeTab === "deal" && (
                <form onSubmit={handleCreateDeal} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="deal-account" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                      Associate CRM Account
                    </Label>
                    <select
                      id="deal-account"
                      value={dealAccountId}
                      onChange={(e) => setDealAccountId(e.target.value)}
                      className="w-full bg-[hsl(var(--card))] border-[2px] border-[hsl(var(--border))] px-3 py-2 text-sm font-mono focus:outline-none"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="deal-name" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                        Opportunity Name
                      </Label>
                      <Input
                        id="deal-name"
                        placeholder="e.g. Aurora Enterprise Expansion"
                        value={dealName}
                        onChange={(e) => setDealName(e.target.value)}
                        className="font-mono text-xs border-[2px] border-[hsl(var(--border))]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="deal-stage" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                        Pipeline Stage
                      </Label>
                      <select
                        id="deal-stage"
                        value={dealStage}
                        onChange={(e) => setDealStage(e.target.value as any)}
                        className="w-full bg-[hsl(var(--card))] border-[2px] border-[hsl(var(--border))] px-3 py-2 text-sm font-mono focus:outline-none"
                      >
                        <option value="discovery">Discovery</option>
                        <option value="evaluation">Evaluation</option>
                        <option value="proposal">Proposal</option>
                        <option value="procurement">Procurement</option>
                        <option value="closed-won">Closed Won</option>
                        <option value="closed-lost">Closed Lost</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="deal-amount" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                        Deal Value ($)
                      </Label>
                      <Input
                        id="deal-amount"
                        type="number"
                        placeholder="e.g. 150000"
                        value={dealAmount}
                        onChange={(e) => setDealAmount(e.target.value)}
                        className="font-mono text-xs border-[2px] border-[hsl(var(--border))]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="deal-confidence" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                        Win Confidence (0.0 to 1.0)
                      </Label>
                      <Input
                        id="deal-confidence"
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={dealConfidence}
                        onChange={(e) => setDealConfidence(e.target.value)}
                        className="font-mono text-xs border-[2px] border-[hsl(var(--border))]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="deal-close" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                      Target Close Date
                    </Label>
                    <Input
                      id="deal-close"
                      type="datetime-local"
                      value={dealCloseDate}
                      onChange={(e) => setDealCloseDate(e.target.value)}
                      className="font-mono text-xs border-[2px] border-[hsl(var(--border))]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="deal-risk" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                      Opportunity Risk Summary (Min 5 characters)
                    </Label>
                    <Textarea
                      id="deal-risk"
                      placeholder="e.g. Tight timeline for procurement clearance. Blocker is Neil Grant from IT Security..."
                      value={dealRiskSummary}
                      onChange={(e) => setDealRiskSummary(e.target.value)}
                      rows={3}
                      className="font-mono text-xs border-[2px] border-[hsl(var(--border))]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 font-mono text-[11px] uppercase font-bold tracking-wider"
                  >
                    {submitting ? "REGISTERING..." : "[ CREATE_SALES_OPPORTUNITY ]"}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>

        <div className="border-t border-[hsl(var(--border))] px-4 py-2 bg-[hsl(var(--muted)/0.2)] text-[10px] text-[hsl(var(--muted-foreground))] flex justify-between font-mono">
          <span>HOTKEY: <kbd className="bg-[hsl(var(--muted))] px-1 py-0.5 border">Q</kbd> to toggle</span>
          <span>REVENUE_OS // TELEMETRY_INGEST</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
