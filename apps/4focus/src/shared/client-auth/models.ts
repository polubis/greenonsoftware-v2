type AuthState =
  | { status: "idle" }
  | { status: "authenticated" }
  | { status: "unauthenticated" };

export type { AuthState };
