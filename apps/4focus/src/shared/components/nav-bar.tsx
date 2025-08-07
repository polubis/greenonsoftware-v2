import { AppRouter } from "../routing/app-router";

export const NavBar = ({ activePathname }: { activePathname: string }) => {
  const isActive = (path: string) => activePathname === path;

  return (
    <nav className="flex items-center p-4 bg-gray-50 border-b border-gray-200">
      <div className="flex-1 flex justify-center">
        <a
        href={AppRouter.getPath("home")}
        className={`mx-4 text-lg font-medium no-underline transition-colors duration-300 ${
          isActive(AppRouter.getPath("home")) ? "text-blue-600" : "text-gray-600 hover:text-gray-800"
        }`}
      >
        Home
      </a>
      <a
        href={AppRouter.getPath("login")}
        className={`mx-4 text-lg font-medium no-underline transition-colors duration-300 ${
          isActive(AppRouter.getPath("login")) ? "text-blue-600" : "text-gray-600 hover:text-gray-800"
        }`}
      >
        Login
      </a>
      <a
        href={AppRouter.getPath("register")}
        className={`mx-4 text-lg font-medium no-underline transition-colors duration-300 ${
          isActive(AppRouter.getPath("register")) ? "text-blue-600" : "text-gray-600 hover:text-gray-800"
        }`}
      >
        Register
      </a>
      <a
        href={AppRouter.getPath("dashboard")}
        className={`mx-4 text-lg font-medium no-underline transition-colors duration-300 ${
          isActive(AppRouter.getPath("dashboard")) ? "text-blue-600" : "text-gray-600 hover:text-gray-800"
        }`}
      >
        Dashboard
      </a>
      <a
        href={AppRouter.getPath("tasks")}
        className={`mx-4 text-lg font-medium no-underline transition-colors duration-300 ${
          isActive(AppRouter.getPath("tasks")) ? "text-blue-600" : "text-gray-600 hover:text-gray-800"
        }`}
      >
        Tasks
      </a>
      <a
        href={AppRouter.getPath("account")}
        className={`mx-4 text-lg font-medium no-underline transition-colors duration-300 ${
          isActive(AppRouter.getPath("account")) ? "text-blue-600" : "text-gray-600 hover:text-gray-800"
        }`}
      >
        Account
      </a>
      </div>
      <form action="/api/logout" method="POST">
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md">
          Log out
        </button>
      </form>
    </nav>
  );
};

