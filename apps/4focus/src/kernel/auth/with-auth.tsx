import { type ComponentType } from "react";
import { useAuth } from "./use-auth";
import type { ClientAuthState } from "./store";

type Settings = {
  Idle: ComponentType<{
    auth: Extract<ClientAuthState, { status: "idle" }>;
  }>;
  Unauthenticated: ComponentType<{
    auth: Extract<ClientAuthState, { status: "unauthenticated" }>;
  }>;
};

const withAuth = <TProps extends Record<string, unknown>>(
  WrappedComponent: ComponentType<TProps>,
  settings: Settings,
) => {
  const componentName =
    WrappedComponent.displayName || WrappedComponent.name || "Component";

  const { Idle, Unauthenticated } = settings;

  const ProtectedComponent = (props: TProps) => {
    const auth = useAuth();
    const status = auth.status;

    switch (status) {
      case "idle":
        return <Idle auth={auth} />;
      case "unauthenticated":
        return <Unauthenticated auth={auth} />;
      case "authenticated":
        return <WrappedComponent {...props} />;
      default: {
        const exhaustiveCheck: never = status;
        throw new Error(`Invalid auth status: ${exhaustiveCheck}`);
      }
    }
  };

  ProtectedComponent.displayName = `WithAuth(${componentName})`;

  return ProtectedComponent;
};

export { withAuth };
