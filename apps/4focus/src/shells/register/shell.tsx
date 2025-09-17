import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavBar } from "../../cross-shell/components/nav-bar";
import { useAppRedirectionWhenLoggedIn } from "../../kernel/auth/use-app-redirection-when-logged-in";
import { APIRouter } from "../../kernel/routing/api-router";

const RegisterShell = ({ activePathname }: { activePathname: string }) => {
  useAppRedirectionWhenLoggedIn();

  return (
    <NavBar activePathname={activePathname}>
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">
                Create a new account
              </CardTitle>
              <CardDescription>
                Enter your details to create your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-6"
                action={APIRouter.getPath("register")}
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
                    autoComplete="new-password"
                    placeholder="Create a password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-confirm">Confirm Password</Label>
                  <Input
                    id="password-confirm"
                    name="password-confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                <Button className="w-full" type="submit">
                  Sign up
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </NavBar>
  );
};

export { RegisterShell };
