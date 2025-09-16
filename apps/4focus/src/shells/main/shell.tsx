import { Router } from "./router";
import { QueryProvider } from "./query-provider";
import { withAuth } from "@/kernel/auth/with-auth";

const MainShell = () => {
  return (
    <QueryProvider>
      <Router />
    </QueryProvider>
  );
};

const ProtectedMainShell = withAuth(MainShell, {
  Idle: () => {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <div className="w-full max-w-md text-center">
          <p className="text-foreground">Verifying session...</p>
        </div>
      </div>
    );
  },
  Unauthenticated: () => {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <div className="w-full max-w-md text-center">
          <p className="text-foreground">Session lost</p>
        </div>
      </div>
    );
  },
});

export { ProtectedMainShell as MainShell };
