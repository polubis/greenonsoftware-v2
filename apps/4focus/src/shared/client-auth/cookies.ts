const hasSessionCookie = () => {
  const isClient = typeof window !== "undefined";

  return (
    isClient &&
    document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith("session-active="))
  );
};

export { hasSessionCookie };
