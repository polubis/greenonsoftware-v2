import { Button } from "@/components/ui/button";
import {
Card,
CardContent,
CardDescription,
CardHeader,
CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
Timeline,
TimelineItem,
TimelineIndicator,
TimelineContent,
TimelineHeader,
TimelineTime,
TimelineTitle,
TimelineDescription,
TimelineConnector,
} from "@/components/ui/timeline";
import { Clock, Trash2 } from "lucide-react";
import { AppRouter } from "../../shared/routing/app-router";
import { NavBar } from "../../shared/components/nav-bar";
import { useAuth } from "../../shared/client-auth/use-client-auth";
import type { ClientAuthState } from "../../shared/client-auth/client-auth-store";
import { useEffect, useState } from "react";
import { APIRouter } from "../../shared/routing/api-router";
import type { Focus4Contracts } from "@/shared/contracts";
import { useTasksLoad } from "./use-tasks-load";
import { FocusSessionView } from "@/shared/focus-session/focus-session-view";
import { useFocusSessionLoad } from "@/shared/focus-session/use-focus-session-load";

const TasksView = () => {
useTasksLoad();
const auth = useAuth();
const [focusSessionState] = useFocusSessionLoad();
const [tasks, setTasks] = useState<
Array<{
id: number;
title: string;
description: string | null;
priority: string;
status: string;
creation_date: string;
update_date: string;
}>

> ([]);
> const [loading, setLoading] = useState(false);
> const [loadError, setLoadError] = useState<string | null>(null);
> const [editingId, setEditingId] = useState<number | null>(null);
> const [editTitle, setEditTitle] = useState("");
> const [editDescription, setEditDescription] = useState<string | null>(null);
> const [editPriority, setEditPriority] = useState("normal");
> const [editStatus, setEditStatus] = useState("todo");
> const [saving, setSaving] = useState(false);
> const [saveError, setSaveError] = useState<string | null>(null);
> const [deletingId, setDeletingId] = useState<number | null>(null);
> const [deleteError, setDeleteError] = useState<string | null>(null);
> const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
> const [historyByTaskId, setHistoryByTaskId] = useState<

    Record<
      number,
      Array<{
        id: number;
        task_id: number;
        operation: string;
        changed_at: string;
        title: string | null;
        description: string | null;
        priority: string | null;
        status: string | null;
        creation_date: string | null;
        update_date: string | null;
      }>
    >

> ({});
> const [historyLoadingId, setHistoryLoadingId] = useState<number | null>(null);
> const [historyErrorByTaskId, setHistoryErrorByTaskId] = useState<

    Record<number, string | null>

> ({});

useEffect(() => {
let mounted = true;
const fetchTasks = async () => {
if (auth.status !== "authenticated") return;
setLoading(true);
setLoadError(null);
try {
const res = await fetch(APIRouter.getPath("tasks"));
if (!res.ok) {
const text = await res.text();
console.log(text);
throw new Error(text || "Failed to load tasks");
}
const data = (await res.json()) as Focus4Contracts["getTasks"]["dto"];
console.log(data);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (mounted) setTasks(data.tasks as any);
} catch (e) {
if (mounted) setLoadError((e as Error).message);
} finally {
if (mounted) setLoading(false);
}
};
fetchTasks();
return () => {
mounted = false;
};
}, [auth.status]);

const startEditing = (t: (typeof tasks)[number]) => {
setEditingId(t.id);
setEditTitle(t.title);
setEditDescription(t.description);
setEditPriority(t.priority);
setEditStatus(t.status);
setSaveError(null);
};

const cancelEditing = () => {
setEditingId(null);
setSaveError(null);
};

const saveEdits = async () => {
if (editingId == null) return;
setSaving(true);
setSaveError(null);
try {
const body: Record<string, unknown> = {
title: editTitle,
description: editDescription,
priority: editPriority,
status: editStatus,
};
const res = await fetch(APIRouter.getPath("tasks"), {
method: "PATCH",
headers: {
accept: "application/json",
"content-type": "application/json",
},
body: JSON.stringify({ id: editingId, ...body }),
});
if (!res.ok) {
const text = await res.text();
throw new Error(text || "Failed to update task");
}
const updated = (await res.json()) as (typeof tasks)[number];
setTasks((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
setEditingId(null);
} catch (e) {
setSaveError((e as Error).message);
} finally {
setSaving(false);
}
};

const deleteTask = async (taskId: number) => {
setDeleteError(null);
setDeletingId(taskId);
const previous = tasks;
try {
// optimistic UI
setTasks((prev) => prev.filter((t) => t.id !== taskId));
const res = await fetch(APIRouter.getPath("tasks"), {
method: "DELETE",
headers: {
accept: "application/json",
"content-type": "application/json",
},
body: JSON.stringify({ id: taskId }),
});
if (!res.ok) {
const text = await res.text();
throw new Error(text || "Failed to delete task");
}
} catch (e) {
setTasks(previous);
setDeleteError((e as Error).message);
} finally {
setDeletingId(null);
}
};

const toggleHistory = async (taskId: number) => {
if (expandedTaskId === taskId) {
setExpandedTaskId(null);
return;
}
setExpandedTaskId(taskId);
if (!historyByTaskId[taskId]) {
setHistoryLoadingId(taskId);
setHistoryErrorByTaskId((p) => ({ ...p, [taskId]: null }));
try {
const res = await fetch(
`${APIRouter.getPath("tasks-history")}?id=${taskId}`,
{
headers: { accept: "application/json" },
},
);
if (!res.ok) {
const text = await res.text();
throw new Error(text || "Failed to load history");
}
const history = (await res.json()) as Array<{
id: number;
task_id: number;
operation: string;
changed_at: string;
title: string | null;
description: string | null;
priority: string | null;
status: string | null;
creation_date: string | null;
update_date: string | null;
}>;
setHistoryByTaskId((prev) => ({ ...prev, [taskId]: history }));
} catch (e) {
setHistoryErrorByTaskId((p) => ({
...p,
[taskId]: (e as Error).message,
}));
} finally {
setHistoryLoadingId(null);
}
}
};

if (auth.status === "idle") {
return (

<div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
<div className="w-full max-w-md text-center">
<p className="text-foreground">Verifying session...</p>
</div>
</div>
);
}

if (auth.status === "unauthenticated") {
return (

<div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
<div className="w-full max-w-md text-center">
<p className="text-foreground">
Session lost{" "}
<a
href={AppRouter.getPath("login")}
className="text-primary hover:text-primary/80" >
Login
</a>
</p>
</div>
</div>
);
}

if (auth.status === "authenticated") {
// Check if there's an active focus session
if (
focusSessionState.status === "success" &&
focusSessionState.data.hasActiveSession
) {
return (

<div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
<div className="w-full max-w-md">
<FocusSessionView />
</div>
</div>
);
}

    // Show tasks view if no active focus session
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <div className="w-full max-w-4xl">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">
                Create a Task
              </CardTitle>
              <CardDescription>Add a new task to your list</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-6"
                action={APIRouter.getPath("tasks")}
                method="POST"
                data-astro-reload
              >
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    type="text"
                    required
                    minLength={3}
                    maxLength={280}
                    placeholder="Enter task title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDurationMinutes">
                    Estimated Duration (minutes)
                  </Label>
                  <Input
                    id="estimatedDurationMinutes"
                    name="estimatedDurationMinutes"
                    type="number"
                    required
                    min={1}
                    max={1000}
                    placeholder="Enter duration in minutes"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Optional description"
                    minLength={10}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty or use 10–500 characters.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue="todo">
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To do</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Create Task
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-10">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Your Tasks
            </h3>
            {loading ? (
              <div className="text-sm text-muted-foreground">
                Loading tasks...
              </div>
            ) : loadError ? (
              <div className="text-sm text-destructive">{loadError}</div>
            ) : tasks.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No tasks yet. Create your first task above.
              </div>
            ) : (
              <ul role="list" className="space-y-3">
                {tasks.map((t) => {
                  const isEditing = editingId === t.id;
                  return (
                    <li
                      key={t.id}
                      className="border border-border rounded-md p-4 bg-card shadow-sm cursor-pointer"
                      onClick={() => !isEditing && startEditing(t)}
                    >
                      {!isEditing ? (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-base font-medium text-foreground">
                                {t.title}
                              </h4>
                              {t.description ? (
                                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                                  {t.description}
                                </p>
                              ) : null}
                            </div>
                            <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                              <Badge variant="secondary">{t.status}</Badge>
                              <Badge variant="default">{t.priority}</Badge>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void toggleHistory(t.id);
                                }}
                                aria-label="Show history"
                                title="History"
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                            <div>
                              Created{" "}
                              {new Date(t.creation_date).toLocaleString()} ·
                              Updated {new Date(t.update_date).toLocaleString()}
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                void deleteTask(t.id);
                              }}
                              disabled={deletingId === t.id}
                              aria-label="Delete task"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              {deletingId === t.id ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                          {expandedTaskId === t.id ? (
                            <div className="mt-3 border-t border-border pt-3">
                              {historyLoadingId === t.id ? (
                                <div className="text-xs text-muted-foreground">
                                  Loading history...
                                </div>
                              ) : historyErrorByTaskId[t.id] ? (
                                <div className="text-xs text-destructive">
                                  {historyErrorByTaskId[t.id]}
                                </div>
                              ) : (
                                <Timeline className="mt-4">
                                  {(historyByTaskId[t.id] ?? []).map(
                                    (h, index) => (
                                      <TimelineItem key={h.id}>
                                        <TimelineIndicator>
                                          {h.operation === "I"
                                            ? "C"
                                            : h.operation === "U"
                                              ? "U"
                                              : "D"}
                                        </TimelineIndicator>
                                        <TimelineContent>
                                          <TimelineHeader>
                                            <TimelineTime>
                                              {new Date(
                                                h.changed_at,
                                              ).toLocaleString()}
                                            </TimelineTime>
                                            <TimelineTitle>
                                              {h.operation === "I"
                                                ? "Task Created"
                                                : h.operation === "U"
                                                  ? "Task Updated"
                                                  : "Task Deleted"}
                                            </TimelineTitle>
                                          </TimelineHeader>
                                          <TimelineDescription>
                                            {h.title && (
                                              <div className="mb-1">
                                                <span className="font-medium">
                                                  Title:
                                                </span>{" "}
                                                {h.title}
                                              </div>
                                            )}
                                            {h.description && (
                                              <div className="mb-1">
                                                <span className="font-medium">
                                                  Description:
                                                </span>{" "}
                                                {h.description}
                                              </div>
                                            )}
                                            {h.priority && (
                                              <div className="mb-1">
                                                <span className="font-medium">
                                                  Priority:
                                                </span>{" "}
                                                {h.priority}
                                              </div>
                                            )}
                                            {h.status && (
                                              <div>
                                                <span className="font-medium">
                                                  Status:
                                                </span>{" "}
                                                {h.status}
                                              </div>
                                            )}
                                          </TimelineDescription>
                                        </TimelineContent>
                                        {index <
                                          (historyByTaskId[t.id] ?? []).length -
                                            1 && <TimelineConnector />}
                                      </TimelineItem>
                                    ),
                                  )}
                                  {(historyByTaskId[t.id] ?? []).length ===
                                    0 && (
                                    <div className="text-xs text-muted-foreground pl-10">
                                      No history yet.
                                    </div>
                                  )}
                                </Timeline>
                              )}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label>Title</Label>
                              <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                minLength={3}
                                maxLength={280}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea
                                value={editDescription ?? ""}
                                onChange={(e) =>
                                  setEditDescription(
                                    e.target.value.trim() === ""
                                      ? null
                                      : e.target.value,
                                  )
                                }
                                rows={3}
                                minLength={editDescription ? 10 : undefined}
                                maxLength={500}
                              />
                              <p className="text-xs text-muted-foreground">
                                Leave empty or use 10–500 characters.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select
                                  value={editPriority}
                                  onValueChange={setEditPriority}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="urgent">
                                      Urgent
                                    </SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="normal">
                                      Normal
                                    </SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                  value={editStatus}
                                  onValueChange={setEditStatus}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="todo">To do</SelectItem>
                                    <SelectItem value="pending">
                                      Pending
                                    </SelectItem>
                                    <SelectItem value="done">Done</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {saveError ? (
                              <div className="text-sm text-destructive">
                                {saveError}
                              </div>
                            ) : null}
                            {deleteError ? (
                              <div className="text-sm text-destructive">
                                {deleteError}
                              </div>
                            ) : null}

                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                onClick={saveEdits}
                                disabled={
                                  saving ||
                                  editTitle.trim().length < 3 ||
                                  editTitle.trim().length > 280
                                }
                              >
                                {saving ? "Saving..." : "Save"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={cancelEditing}
                                disabled={saving}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Created {new Date(t.creation_date).toLocaleString()}{" "}
                            · Updated {new Date(t.update_date).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    );

}

const exh: never = auth;
throw Error(
"Unreachable code detected at TasksView with status: " +
(exh as ClientAuthState).status,
);
};

const ConnectedTasksView = ({ activePathname }: { activePathname: string }) => {
return (
<NavBar activePathname={activePathname}>
<TasksView />
</NavBar>
);
};

export { ConnectedTasksView as TasksView };

// return (
// <div className="p-4 md:p-6 relative min-h-[calc(100vh-theme-header-height)]">
// <h1 className="text-3xl font-bold tracking-tight mb-4">Tasks</h1>
// <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
// <div className="flex items-center gap-x-4">
// <span className="text-sm font-medium text-muted-foreground">
// Priority:
// </span>
// {Object.values(priorityConfig).map((p) => (
// <div key={p.name} className="flex items-center gap-2">
// <div className={cn("h-3 w-3 rounded-full", p.colorClassName)} />
// <span className="text-sm text-muted-foreground">{p.name}</span>
// </div>
// ))}
// </div>
// <div className="flex items-center gap-x-4">
// <span className="text-sm font-medium text-muted-foreground">
// Status:
// </span>
// {Object.values(statusConfig).map((s) => (
// <div key={s.name} className="flex items-center gap-1.5">
// <s.icon className="h-4 w-4 text-muted-foreground" />
// <span className="text-sm text-muted-foreground">{s.name}</span>
// </div>
// ))}
// </div>
// </div>
// <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
// <Card className="flex items-center justify-center border-2 border-dashed bg-muted/50 hover:border-primary/50 hover:bg-muted/70 transition-colors duration-200">
// <button className="flex flex-col items-center justify-center w-full h-full text-center p-4">
// <Plus className="h-10 w-10 text-muted-foreground mb-2" />
// <span className="text-sm font-medium text-muted-foreground">
// Add New Task
// </span>
// </button>
// </Card>
// {sortedData.map((task) => {
// const priorityConf = priorityConfig[task.priority];
// const statusConf = statusConfig[task.status];
// return (
// <Card
// key={task.id}
// className="py-4 relative overflow-hidden group gap-1"
// >
// <div
// className={cn(
// "absolute top-0 left-0 h-1.5 w-full",
// priorityConf.colorClassName,
// )}
// />
// <CardHeader className="px-4">
// <CardTitle className="flex items-start gap-2">
// <statusConf.icon
// className={cn("h-5 w-5 flex-shrink-0 mt-px", {
// "text-red-500": task.priority === "urgent",
// "text-orange-500": task.priority === "high",
// "text-blue-500": task.priority === "normal",
// "text-gray-500": task.priority === "low",
// })}
// />
// <span className="text-base font-semibold leading-tight">
// {task.title}
// </span>
// </CardTitle>
// </CardHeader>
// <CardContent className="pr-4 py-0 pl-11">
// {task.description && (
// <p className="text-sm text-muted-foreground line-clamp-3">
// {task.description}
// </p>
// )}
// </CardContent>
// </Card>
// );
// })}
// </div>
// <Button
// size="icon"
// className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg"
// >
// <Plus className="h-7 w-7" />
// </Button>
// </div>
// );

import { useTasksQuery } from "./use-tasks-query";
import {
Card,
CardContent,
CardHeader,
CardTitle,
} from "@/lib/ui/components/card";
import {
AlertTriangle,
ArrowDown,
ArrowUp,
ChevronUp,
Circle,
CircleCheck,
CircleEllipsis,
Plus,
type LucideIcon,
} from "lucide-react";
import type { Task } from "./use-tasks-query";
import { cn } from "@/lib/ui/utils/cn";
import React from "react";
import { Button } from "@/lib/ui/components/button";

const priorityConfig: Record<
Task["priority"],
{ name: string; icon: LucideIcon; colorClassName: string }

> = {
> urgent: {

    name: "Urgent",
    icon: AlertTriangle,
    colorClassName: "bg-red-500",

},
high: {
name: "High",
icon: ChevronUp,
colorClassName: "bg-orange-500",
},
normal: {
name: "Normal",
icon: ArrowUp,
colorClassName: "bg-blue-500",
},
low: {
name: "Low",
icon: ArrowDown,
colorClassName: "bg-gray-400",
},
};

const statusConfig: Record<Task["status"], { name: string; icon: LucideIcon }> =
{
todo: { name: "To Do", icon: Circle },
pending: { name: "In Progress", icon: CircleEllipsis },
done: { name: "Done", icon: CircleCheck },
};

const priorityOrder: Record<Task["priority"], number> = {
urgent: 1,
high: 2,
normal: 3,
low: 4,
};

const TasksView = () => {
const { data, isLoading, error } = useTasksQuery();

const sortedData = React.useMemo(() => {
if (!Array.isArray(data)) return [];
return [...data].sort(
(a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
);
}, [data]);

if (isLoading) {
return <div>Loading tasks...</div>;
}

if (error) {
return <div>Error loading tasks: {error.message}</div>;
}

if (!Array.isArray(data) || data.length === 0) {
return <div>No tasks found</div>;
}

return (
<div>
<h1 className="text-3xl font-bold tracking-tight mb-4">Tasks</h1>
</div>
);
};

export { TasksView };
