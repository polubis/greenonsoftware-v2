import type { AstroCookies } from "astro";
import { supabase } from "../db/client";
import type { AuthResponse } from "@supabase/supabase-js";

type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

class Session {
  static set = (cookies: AstroCookies, tokens: SessionTokens): void => {
    cookies.set("sb-access-token", tokens.accessToken, {
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "strict",
    });
    cookies.set("sb-refresh-token", tokens.refreshToken, {
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "strict",
    });
    cookies.set("authenticated", "true", {
      path: "/",
      sameSite: "strict",
    });
  };

  static get = (cookies: AstroCookies): SessionTokens | null => {
    const accessToken = cookies.get("sb-access-token");
    const refreshToken = cookies.get("sb-refresh-token");

    if (!accessToken || !refreshToken) {
      return null;
    }

    return {
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
    };
  };

  static delete = (cookies: AstroCookies) => {
    cookies.delete("sb-access-token", {
      path: "/",
    });
    cookies.delete("sb-refresh-token", {
      path: "/",
    });
    cookies.delete("authenticated", {
      path: "/",
    });
  };

  static isActive = (cookies: AstroCookies): boolean => {
    const tokens = Session.get(cookies);
    return tokens !== null;
  };

  static extend = async (
    cookies: AstroCookies,
  ): Promise<AuthResponse["data"] | null> => {
    try {
      const tokens = Session.get(cookies);

      if (!tokens) {
        return null;
      }

      const { accessToken, refreshToken } = tokens;

      const session = await supabase.auth.setSession({
        refresh_token: refreshToken,
        access_token: accessToken,
      });

      if (session.error || !session.data.session) {
        Session.delete(cookies);
        return null;
      }

      Session.set(cookies, {
        accessToken: session.data.session.access_token,
        refreshToken: session.data.session.refresh_token,
      });

      return session.data;
    } catch {
      Session.delete(cookies);
      return null;
    }
  };
}

export { Session };
