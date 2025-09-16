import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { authState, initAuthState, type ClientAuthState } from "./store";

const useAuth = (): ClientAuthState => {
  const state = useStore(authState);

  useEffect(() => {
    const cleanup = initAuthState();
    return () => {
      cleanup();
    };
  }, []);

  return state;
};

export { useAuth };
