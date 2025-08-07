import { useEffect, useState } from "react";
import { context } from "../../lib/context";
import { supabaseBrowserClient } from "../db/supabase-browser";
import type { User } from "@supabase/supabase-js";

type ClientProviderAuthState =
  | {
      status: "idle";
    }
  | {
      status: "authenticated";
      user: User;
    }
  | {
      status: "unauthenticated";
    };

const [ClientAuthProvider, useClientAuthProvider] = context(() => {
  const [state, setState] = useState<ClientProviderAuthState>({
    status: "idle",
  });

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabaseBrowserClient.auth.getUser();

      if (user) {
        setState({ status: "authenticated", user });
      } else {
        setState({ status: "unauthenticated" });
      }
    };
    
    getUser();

    const {
      data: { subscription },
    } = supabaseBrowserClient.auth.onAuthStateChange((event, session) => {
      if (session) {
        setState({ status: "authenticated", user: session.user });
      } else {
        setState({ status: "unauthenticated" });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return state;
});

export type { ClientProviderAuthState };
export { ClientAuthProvider, useClientAuthProvider };
