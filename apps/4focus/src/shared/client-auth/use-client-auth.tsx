import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
  authState,
  initAuthState,
  type ClientAuthState,
} from "./client-auth-store";

const useClientAuth = (): ClientAuthState => {
  const state = useStore(authState);

  useEffect(() => {
    const cleanup = initAuthState();
    return () => {
      cleanup();
    };
  }, []);

  return state;
};

export { useClientAuth };
