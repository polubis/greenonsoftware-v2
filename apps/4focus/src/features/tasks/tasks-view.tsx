import { NavBar } from "../../shared/components/nav-bar";

const TasksView = ({ activePathname }: { activePathname: string }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <NavBar activePathname={activePathname} />
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Welcome to your Tasks
        </h2>
        <div className="mt-4 p-4 bg-gray-100 rounded-md text-left">
          <pre className="overflow-x-auto">{JSON.stringify({}, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export { TasksView };
