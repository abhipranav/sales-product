"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import type { Task } from "@/lib/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

interface NextActionsProps {
  dealId: string;
  tasks: Task[];
}

export function NextActions({ dealId, tasks }: NextActionsProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreating) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const dueAtInput = String(formData.get("dueAt") ?? "").trim();
    const dueAtDate = new Date(dueAtInput);

    if (Number.isNaN(dueAtDate.getTime())) {
      toast.error("Please provide a valid due date.");
      return;
    }

    setIsCreating(true);
    toast.loading("Creating task...", { id: "task-create" });

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dealId: String(formData.get("dealId") ?? "").trim(),
          title: String(formData.get("title") ?? "").trim(),
          owner: String(formData.get("owner") ?? "rep"),
          dueAt: dueAtDate.toISOString(),
          priority: String(formData.get("priority") ?? "medium"),
          suggestedChannel: String(formData.get("suggestedChannel") ?? "email")
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? "Failed to create task.", { id: "task-create" });
        return;
      }

      toast.success("Task created.", { id: "task-create" });
      form.reset();
      router.refresh();
    } catch {
      toast.error("Failed to create task.", { id: "task-create" });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleStatusUpdate(event: FormEvent<HTMLFormElement>, taskId: string) {
    event.preventDefault();
    if (busyTaskId) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const status = String(formData.get("status") ?? "").trim();
    if (!status) {
      toast.error("Status is required.");
      return;
    }

    setBusyTaskId(taskId);
    toast.loading("Updating task...", { id: `task-update-${taskId}` });

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? "Failed to update task.", { id: `task-update-${taskId}` });
        return;
      }

      toast.success("Task updated.", { id: `task-update-${taskId}` });
      router.refresh();
    } catch {
      toast.error("Failed to update task.", { id: `task-update-${taskId}` });
    } finally {
      setBusyTaskId(null);
    }
  }

  async function handleCompleteTask(taskId: string) {
    if (busyTaskId) {
      return;
    }

    setBusyTaskId(taskId);
    toast.loading("Completing task...", { id: `task-complete-${taskId}` });

    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? "Failed to complete task.", { id: `task-complete-${taskId}` });
        return;
      }

      toast.success("Task completed.", { id: `task-complete-${taskId}` });
      router.refresh();
    } catch {
      toast.error("Failed to complete task.", { id: `task-complete-${taskId}` });
    } finally {
      setBusyTaskId(null);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (busyTaskId) {
      return;
    }

    setBusyTaskId(taskId);
    toast.loading("Deleting task...", { id: `task-delete-${taskId}` });

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? "Failed to delete task.", { id: `task-delete-${taskId}` });
        return;
      }

      toast.success("Task deleted.", { id: `task-delete-${taskId}` });
      router.refresh();
    } catch {
      toast.error("Failed to delete task.", { id: `task-delete-${taskId}` });
    } finally {
      setBusyTaskId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>What to do now</CardTitle>
        <Badge variant="secondary">Task Engine</Badge>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleCreateTask}
          className="mb-4 grid gap-2 border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 md:grid-cols-[1.4fr_0.9fr_0.9fr_auto]"
        >
          <input type="hidden" name="dealId" value={dealId} />
          <Input type="text" name="title" required minLength={3} placeholder="Add follow-up task..." />
          <Input type="datetime-local" name="dueAt" required />
          <NativeSelect name="priority" defaultValue="medium">
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </NativeSelect>
          <div className="hidden">
            <NativeSelect name="owner" defaultValue="rep">
              <option value="rep">rep</option>
              <option value="manager">manager</option>
              <option value="system">system</option>
            </NativeSelect>
            <NativeSelect name="suggestedChannel" defaultValue="email">
              <option value="email">email</option>
              <option value="phone">phone</option>
              <option value="linkedin">linkedin</option>
              <option value="meeting">meeting</option>
            </NativeSelect>
          </div>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? "Adding..." : "Add"}
          </Button>
        </form>
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className=" border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
              <div className="mb-1 flex items-start justify-between gap-2">
                <p className="font-medium text-[hsl(var(--foreground))]">{task.title}</p>
                <Badge variant={task.priority === "high" ? "destructive" : task.priority === "low" ? "success" : "warning"}>
                  {task.priority}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Due {new Date(task.dueAt).toLocaleString()} via <span className="font-medium">{task.suggestedChannel}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <form onSubmit={(event) => handleStatusUpdate(event, task.id)} className="flex items-center gap-1">
                    <NativeSelect name="status" defaultValue={task.status} className="h-8 text-xs font-semibold">
                      <option value="todo">todo</option>
                      <option value="in-progress">in-progress</option>
                      <option value="done">done</option>
                    </NativeSelect>
                    <Button type="submit" variant="outline" size="sm" disabled={busyTaskId !== null}>
                      Save
                    </Button>
                  </form>
                  <Button
                    type="button"
                    variant="success"
                    size="sm"
                    onClick={() => handleCompleteTask(task.id)}
                    disabled={busyTaskId !== null}
                  >
                    Complete
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTask(task.id)}
                    disabled={busyTaskId !== null}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
