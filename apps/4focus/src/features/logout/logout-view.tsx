import { AppRouter } from "../../shared/routing/app-router";

const LogoutView = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-2xl font-semibold text-green-600">
          Successfully Signed Out
        </h2>
        <p className="mt-2 text-gray-600">
          Thank you for using our application.
        </p>
        <a
          href={AppRouter.getPath("login")}
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          Sign in again
        </a>
      </div>
    </div>
  );
};

export { LogoutView };
