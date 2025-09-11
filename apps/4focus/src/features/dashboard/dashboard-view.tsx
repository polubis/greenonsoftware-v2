import { AppRouter } from "../../shared/routing/app-router";
import { NavBar } from "../../shared/components/nav-bar";
import { useClientAuth } from "../../shared/client-auth/use-client-auth";
import type { ClientAuthState } from "../../shared/client-auth/client-auth-store";

const DashboardView = () => {
  const auth = useClientAuth();

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
              className="text-primary hover:text-primary/80"
            >
              Login
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (auth.status === "authenticated") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <div className="w-full max-w-4xl">
          <h1 className="text-3xl font-bold text-foreground mb-6 text-center">
            Welcome to your Dashboard
          </h1>
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <div className="bg-muted p-4 rounded-md">
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(auth.user, null, 2)}
              </pre>
            </div>
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

const ConnectedDashboardView = ({
  activePathname,
}: {
  activePathname: string;
}) => {
  return (
    <NavBar activePathname={activePathname}>
      <DashboardView />
    </NavBar>
  );
};

export { ConnectedDashboardView as DashboardView };
