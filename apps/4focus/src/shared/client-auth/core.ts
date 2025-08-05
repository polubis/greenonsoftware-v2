import { useStore } from "@nanostores/react";
import { map } from "nanostores";
import type { AuthState } from "./models";

const clientAuth = map<AuthState>({
  status: "idle",
});

const useClientAuth = () => useStore(clientAuth);

export { clientAuth, useClientAuth };
