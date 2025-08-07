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
        <a
          href={AppRouter.getPath("home")}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
        >
          Home
        </a>
        <a
          href={AppRouter.getPath("dashboard")}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
        >
          Dashboard
        </a>
        <a
          href={AppRouter.getPath("account")}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
        >
          Account
        </a>
        <form action="/api/logout" method="POST">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
};

export { TasksView };
