import { Link, useLocation, useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { MonitorIcon, LogOutIcon } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import { useQueryClient } from "@tanstack/react-query";
import { logout } from "../lib/api";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isChatPage = location.pathname?.startsWith("/chat");
  const isCallPage = location.pathname?.startsWith("/call");

  const handleLogout = async () => {
    try {
      await logout(); // clears server-side session cookie
    } catch {
      // proceed even if the request fails
    }
    queryClient.clear(); // wipe authUser from React Query cache
    navigate("/login", { replace: true });
  };

  if (isCallPage) return null; // No navbar on call page — it has its own UI

  return (
    <nav className="sticky top-0 z-30 h-14 flex items-center border-b border-white/5 bg-[#0a0f1e]/90 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full">
          {/* Logo — only on chat page (sidebar hidden) */}
          {isChatPage && (
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <MonitorIcon className="size-4 text-blue-400" />
              </div>
              <span className="text-base font-bold gradient-text tracking-tight">
                TrackSmart
              </span>
            </Link>
          )}

          <div className="flex items-center gap-3 ml-auto">
            {/* Theme Selector */}
            <ThemeSelector />

            {/* User Avatar */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-blue-500/30">
                <img
                  src={authUser?.profilePic}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0a0f1e]" />
            </div>

            {/* Logout */}
            <button
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOutIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
