import { useEffect, useState, type ComponentType } from "react";
import type { AuthState } from "./models";
import { useClientAuth } from "./core";

type ClientAuthGuardProps<TProps extends Record<string, unknown>> = {
  Component: ComponentType<TProps>;
  Fallback: ComponentType<
    TProps & Exclude<AuthState, { status: "authenticated" }>
  >;
};

const ClientAuthGuard = <TProps extends Record<string, unknown>>({
  Component,
  Fallback,
}: ClientAuthGuardProps<TProps>) => {
  const ComponentWithAuth = (props: TProps) => {
    const auth = useClientAuth();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      setIsMounted(true);
    }, []);

    if (!isMounted) {
      return <Fallback {...props} status="idle" />;
    }

    if (auth.status === "authenticated") {
      return <Component {...props} />;
    }

    return <Fallback {...props} {...auth} />;
  };

  ComponentWithAuth.displayName = `ClientAuthGuard(${Component.displayName || Component.name || "Component"})`;

  return ComponentWithAuth;
};

export { ClientAuthGuard };
