import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import useLogout from "../hooks/useLogout";
import {
  LayoutDashboardIcon,
  MonitorIcon,
  VideoIcon,
  GraduationCapIcon,
  BriefcaseIcon,
  LogOutIcon,
  BellIcon,
  UsersIcon,
  MenuIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const { logoutMutation } = useLogout();
  const location = useLocation();
  const currentPath = location.pathname;
  const isTeacher = authUser?.role === "teacher";
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboardIcon },
    { to: "/rooms", label: "Classrooms", icon: VideoIcon },
    { to: "/notifications", label: "Notifications", icon: BellIcon },
    { to: "/friends", label: "People", icon: UsersIcon },
  ];

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <MonitorIcon className="size-5 text-blue-400" />
          </div>
          <span className="text-lg font-bold tracking-tight gradient-text">
            TrackSmart
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 mt-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={`ts-nav-item ${currentPath === to ? "active" : ""}`}
          >
            <Icon className="size-4.5 shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Role badge + User profile */}
      <div className="p-4 border-t border-white/5">
        {/* Role Badge */}
        <div className="mb-3">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
              isTeacher
                ? "bg-purple-500/15 text-purple-400 border border-purple-500/25"
                : "bg-blue-500/15 text-blue-400 border border-blue-500/25"
            }`}
          >
            {isTeacher ? (
              <BriefcaseIcon className="size-3" />
            ) : (
              <GraduationCapIcon className="size-3" />
            )}
            {isTeacher ? "Teacher" : "Student"}
          </span>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-blue-500/30">
              <img
                src={authUser?.profilePic}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0f1e]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">
              {authUser?.fullName}
            </p>
            <p className="text-xs text-green-400 font-medium">● Online</p>
          </div>
          <button
            onClick={logoutMutation}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Sign out"
          >
            <LogOutIcon className="size-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="w-64 hidden lg:flex flex-col h-screen sticky top-0 ts-sidebar">
        <NavContent />
      </aside>

      {/* ── Mobile Hamburger Button (visible on small screens) ── */}
      <button
        className="lg:hidden fixed top-3 left-4 z-50 p-2 rounded-xl bg-base-200/90 border border-white/10 backdrop-blur-md text-slate-300 hover:text-white transition-colors"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <MenuIcon className="size-5" />
      </button>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer panel */}
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col ts-sidebar shadow-2xl animate-slide-left">
            {/* Close button */}
            <button
              className="absolute top-3 right-3 p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <XIcon className="size-4" />
            </button>
            <NavContent />
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
