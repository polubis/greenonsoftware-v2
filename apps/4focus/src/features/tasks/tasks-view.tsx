import { AppRouter } from "../../shared/routing/app-router";
import { APIRouter } from "../../shared/routing/api-router";
import { NavBar } from "../../shared/components/nav-bar";
import { useClientAuth } from "../../shared/client-auth/use-client-auth";
import type { ClientAuthState } from "../../shared/client-auth/client-auth-store";

const TasksView = () => {
  const auth = useClientAuth();

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
