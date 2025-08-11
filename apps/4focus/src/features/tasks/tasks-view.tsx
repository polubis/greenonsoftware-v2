import { AppRouter } from "../../shared/routing/app-router";
import { APIRouter } from "../../shared/routing/api-router";
import { NavBar } from "../../shared/components/nav-bar";
import { useClientAuth } from "../../shared/client-auth/use-client-auth";
import type { ClientAuthState } from "../../shared/client-auth/client-auth-store";
import { useEffect, useState } from "react";

const TasksView = () => {
  const auth = useClientAuth();
  const [tasks, setTasks] = useState<Array<{
    id: number;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    creation_date: string;
    update_date: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState<string | null>(null);
  const [editPriority, setEditPriority] = useState("normal");
  const [editStatus, setEditStatus] = useState("todo");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchTasks = async () => {
      if (auth.status !== "authenticated") return;
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(APIRouter.getPath("tasks"), {
          headers: { accept: "application/json" },
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to load tasks");
        }
        const data = (await res.json()) as typeof tasks;
        if (mounted) setTasks(data);
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

  if (auth.status === "idle") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <p className="text-center">Verifying session...</p>
      </div>
    );
  }

  if (auth.status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <p className="text-center">
          Session lost <a href={AppRouter.getPath("login")}>Login</a>
        </p>
      </div>
    );
  }

  if (auth.status === "authenticated") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create a Task
          </h2>

          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form
              className="space-y-6"
              action={APIRouter.getPath("tasks")}
              method="POST"
              data-astro-reload
            >
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title
                </label>
                <div className="mt-1">
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    minLength={3}
                    maxLength={280}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Optional"
                    minLength={10}
                    maxLength={500}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty or use 10–500 characters.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="priority"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Priority
                  </label>
                  <div className="mt-1">
                    <select
                      id="priority"
                      name="priority"
                      defaultValue="normal"
                      className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="normal">Normal</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Status
                  </label>
                  <div className="mt-1">
                    <select
                      id="status"
                      name="status"
                      defaultValue="todo"
                      className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="todo">To do</option>
                      <option value="pending">Pending</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Tasks</h3>
            {loading ? (
              <div className="text-sm text-gray-600">Loading tasks...</div>
            ) : loadError ? (
              <div className="text-sm text-red-600">{loadError}</div>
            ) : tasks.length === 0 ? (
              <div className="text-sm text-gray-600">No tasks yet. Create your first task above.</div>
            ) : (
              <ul role="list" className="space-y-3">
                {tasks.map((t) => {
                  const isEditing = editingId === t.id;
                  return (
                    <li
                      key={t.id}
                      className="border rounded-md p-4 bg-white shadow-sm cursor-pointer"
                      onClick={() => !isEditing && startEditing(t)}
                    >
                      {!isEditing ? (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-base font-medium text-gray-900">{t.title}</h4>
                              {t.description ? (
                                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{t.description}</p>
                              ) : null}
                            </div>
                            <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                                {t.status}
                              </span>
                              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800">
                                {t.priority}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <div>
                              Created {new Date(t.creation_date).toLocaleString()} · Updated {new Date(t.update_date).toLocaleString()}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void deleteTask(t.id);
                              }}
                              disabled={deletingId === t.id}
                              className="ml-3 inline-flex items-center px-2 py-1 border border-red-300 text-red-700 bg-white rounded hover:bg-red-50 disabled:opacity-50"
                              aria-label="Delete task"
                              title="Delete"
                            >
                              {deletingId === t.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Title</label>
                              <input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                minLength={3}
                                maxLength={280}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Description</label>
                              <textarea
                                value={editDescription ?? ""}
                                onChange={(e) =>
                                  setEditDescription(e.target.value.trim() === "" ? null : e.target.value)
                                }
                                rows={3}
                                minLength={editDescription ? 10 : undefined}
                                maxLength={500}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                              <p className="mt-1 text-xs text-gray-500">Leave empty or use 10–500 characters.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Priority</label>
                                <select
                                  value={editPriority}
                                  onChange={(e) => setEditPriority(e.target.value)}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                  <option value="urgent">Urgent</option>
                                  <option value="high">High</option>
                                  <option value="normal">Normal</option>
                                  <option value="low">Low</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                  value={editStatus}
                                  onChange={(e) => setEditStatus(e.target.value)}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                  <option value="todo">To do</option>
                                  <option value="pending">Pending</option>
                                  <option value="done">Done</option>
                                </select>
                              </div>
                            </div>

                            {saveError ? (
                              <div className="text-sm text-red-600">{saveError}</div>
                            ) : null}
                            {deleteError ? (
                              <div className="text-sm text-red-600">{deleteError}</div>
                            ) : null}

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={saveEdits}
                                disabled={saving || editTitle.trim().length < 3 || editTitle.trim().length > 280}
                                className="inline-flex justify-center py-1.5 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                {saving ? "Saving..." : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditing}
                                disabled={saving}
                                className="inline-flex justify-center py-1.5 px-3 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Created {new Date(t.creation_date).toLocaleString()} · Updated {new Date(t.update_date).toLocaleString()}
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
    <>
      <NavBar activePathname={activePathname} />
      <TasksView />
    </>
  );
};

export { ConnectedTasksView as TasksView };
