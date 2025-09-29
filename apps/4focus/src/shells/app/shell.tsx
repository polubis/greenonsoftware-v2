import { Router } from "./router";
import { QueryProvider } from "./query-provider";
import { withAuth } from "@/kernel/auth/with-auth";
import { Toaster } from "sonner";

const AppShell = () => {
  return (
    <QueryProvider>
      <Toaster />
      <Router />
    </QueryProvider>
  );
};

const ProtectedAppShell = withAuth(AppShell, {
  Idle: () => {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md text-center">
          <p className="text-foreground">Verifying session...</p>
        </div>
      </div>
    );
  },
  Unauthenticated: () => {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md text-center">
          <p className="text-foreground">Session lost</p>
        </div>
      </div>
    );
  },
});

export { ProtectedAppShell as AppShell };
