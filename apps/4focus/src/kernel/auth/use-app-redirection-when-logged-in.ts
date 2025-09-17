import { useEffect } from "react";
import { useAuth } from "./use-auth";
import { AppRouter } from "../routing/app-router";

const useAppRedirectionWhenLoggedIn = () => {
  const auth = useAuth();

  useEffect(() => {
    if (auth.status === "authenticated") {
      window.location.href = AppRouter.getPath("dashboard");
    }
  }, [auth.status]);
};

export { useAppRedirectionWhenLoggedIn };
