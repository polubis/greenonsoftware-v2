import { hasSessionCookie } from "./cookies";
import { clientAuth } from "./core";

const check = (() => {
  let intervalId: ReturnType<typeof setInterval> | undefined;

  const checkForSessionCookie = () => {
    const currentStatus = clientAuth.get().status;
    const newStatus = hasSessionCookie() ? "authenticated" : "unauthenticated";

    if (currentStatus !== newStatus) {
      clientAuth.set({ status: newStatus });
    }
  };

  return () => {
    checkForSessionCookie();

    clearInterval(intervalId);

    intervalId = setInterval(checkForSessionCookie, 3000);
  };
})();

export { check };
