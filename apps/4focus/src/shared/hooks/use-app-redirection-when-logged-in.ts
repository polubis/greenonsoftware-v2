import { useEffect } from "react";
import { useAuth } from "../../kernel/auth/use-auth";
import { AppRouter } from "../../kernel/routing/app-router";

const useAppRedirectionWhenLoggedIn = () => {
  const auth = useAuth();

  useEffect(() => {
    if (auth.status === "authenticated") {
      window.location.href = AppRouter.getPath("dashboard");
    }
  }, [auth.status]);
};

export { useAppRedirectionWhenLoggedIn };
