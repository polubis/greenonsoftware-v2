import { useUser } from "@/kernel/auth/use-user";

const AccountView = () => {
  const user = useUser();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-6 text-center">
          Welcome to your Account
        </h1>
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="bg-muted p-4 rounded-md">
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export { AccountView };
