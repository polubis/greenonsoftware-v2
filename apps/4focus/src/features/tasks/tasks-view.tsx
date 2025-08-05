// import { useUser } from "../../shared/client-auth/core";
import { ClientAuthGuard } from "../../shared/client-auth/guards";
import { AppRouter } from "../../shared/routing/app-router";

const TasksView = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Welcome to your Tasks
        </h2>
        <div className="mt-4 p-4 bg-gray-100 rounded-md text-left">
          <pre className="overflow-x-auto">{JSON.stringify({}, null, 2)}</pre>
        </div>
      </div>
      <div className="mt-8 flex justify-center space-x-4">
        <a href="/" className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md">
          Home
        </a>
        <a
          href="/dashboard"
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
        >
          Dashboard
        </a>
        <form action="/api/logout" method="GET">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
};

const ProtectedTasksView = ClientAuthGuard({
  Component: TasksView,
  Fallback: ({ status }) => {
    if (status === "idle") {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <p className="text-center">Verifying session...</p>
        </div>
      );
    }

    if (status === "unauthenticated") {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <p className="text-center">
            Session lost <a href={AppRouter.getPath("login")}>Login</a>
          </p>
        </div>
      );
    }
  },
});

export { ProtectedTasksView as TasksView };
