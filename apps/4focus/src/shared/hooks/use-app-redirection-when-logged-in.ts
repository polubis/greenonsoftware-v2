import { useEffect } from "react";
import { useClientAuth } from "../client-auth/use-client-auth";
import { AppRouter } from "../routing/app-router";

const useAppRedirectionWhenLoggedIn = () => {
    const auth = useClientAuth();

    useEffect(() => {
        if (auth.status === "authenticated") {
            window.location.href = AppRouter.getPath('dashboard');
        }
    }, [auth.status]);
}

export { useAppRedirectionWhenLoggedIn };