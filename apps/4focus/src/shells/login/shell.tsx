import { Button } from "@/lib/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/ui/components/card";
import { Input } from "@/lib/ui/components/input";
import { Label } from "@/lib/ui/components/label";
import { Checkbox } from "@/lib/ui/components/checkbox";
import { NavBar } from "../../cross-shell/components/nav-bar";
import { useAppRedirectionWhenLoggedIn } from "../../kernel/auth/use-app-redirection-when-logged-in";
import { APIRouter } from "../../kernel/routing/api-router";

const LoginShell = ({ activePathname }: { activePathname: string }) => {
  useAppRedirectionWhenLoggedIn();

  return (
    <NavBar activePathname={activePathname}>
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">
                Sign in to your account
              </CardTitle>
              <CardDescription>
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-6"
                action={APIRouter.getPath("login")}
                method="POST"
                data-astro-reload
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember-me" name="remember-me" />
                    <Label
                      htmlFor="remember-me"
                      className="text-sm font-normal"
                    >
                      Remember me
                    </Label>
                  </div>

                  <div className="text-sm">
                    <a
                      href="#"
                      className="font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot your password?
                    </a>
                  </div>
                </div>

                <Button className="w-full" type="submit">
                  Sign in
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <form action={APIRouter.getPath("login")} method="POST">
                    <input type="hidden" name="provider" value="google" />
                    <Button variant="outline" type="submit" className="w-full">
                      Continue with Google
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </NavBar>
  );
};

export { LoginShell };
