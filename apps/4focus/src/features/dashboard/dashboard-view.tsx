import { AppRouter } from "../../shared/routing/app-router";
import { NavBar } from "../../shared/components/nav-bar";
import { useClientAuth } from "../../shared/client-auth/use-client-auth";
import type { ClientAuthState } from "../../shared/client-auth/client-auth-store";

const DashboardView = () => {
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
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to your Dashboard
          </h2>
          <div className="mt-4 p-4 bg-gray-100 rounded-md text-left">
            <pre className="overflow-x-auto">
              {JSON.stringify(auth.user, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  const exh: never = auth;
  throw Error(
    "Unreachable code detected at DashboardView with status: " +
      (exh as ClientAuthState).status,
  );
};

const ConnectedDashboardView = ({ activePathname }: { activePathname: string }) => {
  return (
    <>
      <NavBar activePathname={activePathname} />
      <DashboardView />
    </>
  );
};

export { ConnectedDashboardView as DashboardView };
