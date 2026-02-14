import type { Task } from "@/lib/domain/types";
import { completeTaskAction, createTaskAction, deleteTaskAction, updateTaskAction } from "@/app/actions/tasks";
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
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>What to do now</CardTitle>
        <Badge variant="secondary">Task Engine</Badge>
      </CardHeader>
      <CardContent>
        <form action={createTaskAction} className="mb-4 grid gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 md:grid-cols-[1.4fr_0.9fr_0.9fr_auto]">
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
          <Button type="submit">Add</Button>
        </form>
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
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
                  <form action={updateTaskAction} className="flex items-center gap-1">
                    <input type="hidden" name="taskId" value={task.id} />
                    <NativeSelect name="status" defaultValue={task.status} className="h-8 text-xs font-semibold">
                      <option value="todo">todo</option>
                      <option value="in-progress">in-progress</option>
                      <option value="done">done</option>
                    </NativeSelect>
                    <Button type="submit" variant="outline" size="sm">Save</Button>
                  </form>
                  <form action={completeTaskAction}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <Button type="submit" variant="success" size="sm">Complete</Button>
                  </form>
                  <form action={deleteTaskAction}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <Button type="submit" variant="destructive" size="sm">Delete</Button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
