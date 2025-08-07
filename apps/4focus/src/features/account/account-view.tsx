import { AppRouter } from "../../shared/routing/app-router";
import {
    ClientAuthProvider,
    useClientAuthProvider,
    type ClientProviderAuthState,
} from "../../shared/client-auth/client-auth-provider";

const AccountView = () => {
    const auth = useClientAuthProvider();

    if (auth.status === "idle") {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <p className="text-center">Verifying session...</p>
            </div>
        );
    }

    if (auth.status === "unauthenticated") {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <p className="text-center">
                    Session lost <a href={AppRouter.getPath("login")}>Login</a>
                </p>
            </div>
        );
    }

    if (auth.status === "authenticated") {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Welcome to your Dashboard
                    </h2>
                    <div className="mt-4 p-4 bg-gray-100 rounded-md text-left">
                        <pre className="overflow-x-auto">
                            {JSON.stringify(auth.user, null, 2)}
                        </pre>
                    </div>
                </div>
                <div className="mt-8 flex justify-center space-x-4">
                    <a
                        href={AppRouter.getPath("home")}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
                    >
                        Home
                    </a>
                    <a
                        href={AppRouter.getPath("tasks")}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
                    >
                        Tasks
                    </a>
                    <a
                        href={AppRouter.getPath("account")}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
                    >
                        Account
                    </a>
                    <a
                        href={AppRouter.getPath('dashboard')}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
                    >
                        Dashboard
                    </a>
                    <form action="/api/logout" method="POST">
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md">
                            Log out
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const exh: never = auth;
    throw Error(
        "Unreachable code detected at AccountView with status: " +
        (exh as ClientProviderAuthState).status,
    );
};

const ConnectedAccountView = () => {
    return (
        <ClientAuthProvider>
            <AccountView />
        </ClientAuthProvider>
    );
};

export { ConnectedAccountView as AccountView };
