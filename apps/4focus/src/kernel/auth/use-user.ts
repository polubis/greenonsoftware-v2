import { useStore } from "@nanostores/react";
import { authState } from "./store";

const useUser = () => {
  const state = useStore(authState);

  if (state.status !== "authenticated") {
    throw Error("User not authenticated");
  }

  return state.user;
};

export { useUser };
