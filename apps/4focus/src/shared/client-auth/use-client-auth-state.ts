import { useStore } from "@nanostores/react";
import { authState } from "./client-auth-store";

const useClientAuthState = () => {
  const state = useStore(authState);
  return state;
};

export { useClientAuthState };
