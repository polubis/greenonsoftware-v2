import { useEffect, useState } from "react";
import { ClientAuthGuard } from "../../shared/client-auth/guards";
import { AppRouter } from "../../shared/routing/app-router";
import { supabaseBrowserClient } from "../../db/supabase-browser";

const DashboardView = () => {
  // 2. Set up state to store the user session and a loading status
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 3. Use onAuthStateChange for real-time auth updates
    // This is the recommended approach as it listens for sign-in/sign-out events.
    const { data: { subscription } } = supabaseBrowserClient.auth.onAuthStateChange((event, session) => {
      console.log(session)
      setSession(session);
      setLoading(false);
    });

    // 4. The cleanup function unsubscribes from the listener when the component unmounts.
    // This prevents memory leaks.
    return () => {
      subscription.unsubscribe();
    };
  }, []); // The empty dependency array ensures this effect runs only once on mount.

  // 5. Render UI based on the loading and session state
  if (loading) {
    return <p>Loading...</p>;
  }

  if (session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to your Dashboard
          </h2>
          <div className="mt-4 p-4 bg-gray-100 rounded-md text-left">
            <pre className="overflow-x-auto">{JSON.stringify({}, null, 2)}</pre>
          </div>
        </div>
        <div className="mt-8 flex justify-center space-x-4">
          <a href="/" className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md">
            Home
          </a>
          <a
            href="/tasks"
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
          >
            Tasks
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

  return <p>You are not logged in. <a href="/login">Sign In</a></p>;
};

// const ProtectedDashboardView = ClientAuthGuard({
//   Component: DashboardView,
//   Fallback: ({ status }) => {
//     if (status === "idle") {
//       return (
//         <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
//           <p className="text-center">Verifying session...</p>
//         </div>
//       );
//     }

//     if (status === "unauthenticated") {
//       return (
//         <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
//           <p className="text-center">
//             Session lost <a href={AppRouter.getPath("login")}>Login</a>
//           </p>
//         </div>
//       );
//     }
//   },
// });

export { DashboardView };
