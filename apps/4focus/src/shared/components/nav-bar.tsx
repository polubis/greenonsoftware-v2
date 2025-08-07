import { AppRouter } from "../routing/app-router";
import { useClientAuth } from "../client-auth/use-client-auth";
import { useState } from "react";

export const NavBar = ({ activePathname }: { activePathname: string }) => {
  const auth = useClientAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => activePathname === path;

  // Get avatar display character
  const getAvatarDisplay = () => {
    if (auth.status !== "authenticated") return "?";

    const { user } = auth;

    // Check for email and get first letter
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }

    // Fallback
    return "?";
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      {/* Rearrange the navbar for mobile - move the menu button to the far right */}
      <nav className="flex items-center p-4 bg-gray-50 border-b border-gray-200">
        {/* Left - Logo */}
        <div className="flex-1 lg:w-1/4 flex items-center justify-start">
          <a href={AppRouter.getPath("home")} className="flex items-center">
            <div className="text-indigo-600 font-bold text-xl">4Focus</div>
          </a>
        </div>

        {/* Middle section - empty on mobile, nav links on desktop */}
        <div className="hidden lg:flex lg:w-2/4 lg:justify-center lg:items-center">
          {/* Navigation links as before */}
          <a
            href={AppRouter.getPath("home")}
            className={`mx-6 text-lg font-medium no-underline transition-colors duration-300 ${isActive(AppRouter.getPath("home")) ? "text-blue-600" : "text-gray-600 hover:text-gray-800"
              }`}
          >
            Home
          </a>
          {auth.status === "authenticated" && (
            <>
              <a
                href={AppRouter.getPath("dashboard")}
                className={`mx-6 text-lg font-medium no-underline transition-colors duration-300 ${isActive(AppRouter.getPath("dashboard")) ? "text-blue-600" : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                Dashboard
              </a>
              <a
                href={AppRouter.getPath("tasks")}
                className={`mx-6 text-lg font-medium no-underline transition-colors duration-300 ${isActive(AppRouter.getPath("tasks")) ? "text-blue-600" : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                Tasks
              </a>
              <a
                href={AppRouter.getPath("account")}
                className={`mx-6 text-lg font-medium no-underline transition-colors duration-300 ${isActive(AppRouter.getPath("account")) ? "text-blue-600" : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                Account
              </a>
            </>
          )}
        </div>

        {/* Right section - auth + mobile menu */}
        <div className="flex-1 lg:w-1/4 flex items-center justify-end">
          {/* Auth content first */}
          {auth.status === "authenticated" && (
            <div className="flex items-center">
              {/* User Avatar */}
              <div className="flex items-center mr-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-medium mr-3">
                  {getAvatarDisplay()}
                </div>
                <span className="text-gray-700 hidden md:inline-block">
                  {auth.user.email || "User"}
                </span>
              </div>
              
              {/* Logout Button */}
              <form action="/api/logout" method="POST" className="hidden sm:block">
                <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-md hover:bg-indigo-700 transition-colors duration-300">
                  Log out
                </button>
              </form>
            </div>
          )}
          {(auth.status === "idle" || auth.status === "unauthenticated") && (
            <>
              <a
                href={AppRouter.getPath("login")}
                className={`mx-4 text-lg font-medium no-underline hidden sm:inline-block transition-colors duration-300 ${isActive(AppRouter.getPath("login")) ? "text-blue-600" : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                Login
              </a>
              <a
                href={AppRouter.getPath("register")}
                className={`ml-4 hidden sm:inline-flex bg-indigo-600 text-white px-6 py-2.5 rounded-md hover:bg-indigo-700 transition-colors duration-300 no-underline`}
              >
                Register
              </a>
            </>
          )}
          
          {/* Mobile menu button - last item on smaller screens */}
          <button 
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 ml-3 rounded-md hover:bg-gray-200 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-lg">
          {/* Fix the padding for mobile menu items to ensure even spacing */}
          <div className="px-4 py-2">
            <a
              href={AppRouter.getPath("home")}
              className={`block py-3 text-lg font-medium no-underline transition-colors duration-300 ${isActive(AppRouter.getPath("home")) ? "text-blue-600 bg-gray-50 px-4 mx-[-1rem] rounded-md" : "text-gray-600 hover:text-gray-800"
                }`}
            >
              Home
            </a>
            {auth.status === "authenticated" && (
              <>
                <a
                  href={AppRouter.getPath("dashboard")}
                  className={`block py-3 text-lg font-medium no-underline transition-colors duration-300 ${isActive(AppRouter.getPath("dashboard")) ? "text-blue-600 bg-gray-50 px-4 mx-[-1rem] rounded-md" : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  Dashboard
                </a>
                <a
                  href={AppRouter.getPath("tasks")}
                  className={`block py-3 text-lg font-medium no-underline transition-colors duration-300 ${isActive(AppRouter.getPath("tasks")) ? "text-blue-600 bg-gray-50 px-4 mx-[-1rem] rounded-md" : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  Tasks
                </a>
                <a
                  href={AppRouter.getPath("account")}
                  className={`block py-3 text-lg font-medium no-underline transition-colors duration-300 ${isActive(AppRouter.getPath("account")) ? "text-blue-600 bg-gray-50 px-4 mx-[-1rem] rounded-md" : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  Account
                </a>
              </>
            )}
            {(auth.status === "idle" || auth.status === "unauthenticated") && (
              <div className="sm:hidden flex flex-col space-y-2 mt-4 pb-2">
                <a
                  href={AppRouter.getPath("login")}
                  className={`py-3 text-lg font-medium no-underline transition-colors duration-300 ${isActive(AppRouter.getPath("login")) ? "text-blue-600 bg-gray-50 px-4 mx-[-1rem] rounded-md" : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  Login
                </a>
                <a
                  href={AppRouter.getPath("register")}
                  className={`bg-indigo-600 text-white px-4 py-2.5 rounded-md hover:bg-indigo-700 transition-colors duration-300 no-underline text-center`}
                >
                  Register
                </a>
              </div>
            )}
            {auth.status === "authenticated" && (
              <div className="sm:hidden mt-4 pb-2">
                <form action="/api/logout" method="POST">
                  <button className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-md hover:bg-indigo-700 transition-colors duration-300">
                    Log out
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

