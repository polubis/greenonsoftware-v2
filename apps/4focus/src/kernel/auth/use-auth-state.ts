import { useStore } from "@nanostores/react";
import { authState } from "./store";

const useAuthState = () => {
  const state = useStore(authState);
  return state;
};

export { useAuthState };
