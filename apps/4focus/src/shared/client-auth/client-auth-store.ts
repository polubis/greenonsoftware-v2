import { atom } from "nanostores";
import { supabaseBrowserClient } from "../db/supabase-browser";

type ClientAuthState =
  | {
    status: "idle";
  }
  | {
    status: "authenticated";
    user: {
      id: string;
      email?: string;
      created_at: string;
      updated_at?: string;
    };
  }
  | {
    status: "unauthenticated";
  };

const authState = atom<ClientAuthState>({
  status: "idle",
});

const initAuthState = () => {
  console.log("initAuthState()", authState.get());
  const {
    data: { subscription },
  } = supabaseBrowserClient.auth.onAuthStateChange((event, session) => {
    console.log("initAuthState() onAuthStateChange()", event, session);
    if (session) {
      authState.set({
        status: "authenticated", user: {
          id: session.user.id,
          email: session.user.email,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at,
        }
      });
    } else {
      authState.set({ status: "unauthenticated" });
    }
  });

  return subscription.unsubscribe;
}

export { authState, initAuthState, type ClientAuthState };