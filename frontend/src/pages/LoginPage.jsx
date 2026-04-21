import { useState } from "react";
import { Link } from "react-router";
import useLogin from "../hooks/useLogin";
import { MonitorIcon, ShieldCheckIcon, EyeIcon, BrainCircuitIcon, ActivityIcon, EyeOffIcon } from "lucide-react";

const features = [
  {
    icon: EyeIcon,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    title: "AI Attention Detection",
    desc: "Real-time monitoring of student focus and engagement",
  },
  {
    icon: BrainCircuitIcon,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    title: "Phone Usage Alerts",
    desc: "Instantly detect and flag device distractions",
  },
  {
    icon: ActivityIcon,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    title: "Live Analytics Dashboard",
    desc: "Track attention scores and warnings in real time",
  },
];

const LoginPage = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { isPending, error, loginMutation } = useLogin();

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation(loginData);
  };

  return (
    <div className="min-h-screen ts-auth-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-blue-600/8 blur-3xl animate-blob" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-cyan-600/6 blur-3xl animate-blob delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-purple-600/5 blur-3xl animate-blob delay-4000" />
      </div>

      <div className="relative w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-0 ts-auth-card shadow-2xl shadow-black/50 overflow-hidden animate-fade-in">

        {/* ── LEFT: FORM ── */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-[#0a0f1e]/60">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 animate-slide-left">
          </div>

          <div className="mb-6 animate-fade-in-up delay-100">
            <h2 className="text-2xl font-bold text-slate-100">Welcome back</h2>
            <p className="text-sm text-slate-400 mt-1">Sign in to your classroom account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
              {error.response?.data?.message || "Login failed. Please try again."}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 animate-fade-in-up delay-200">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                placeholder="Institutional Email"
                className="ts-input input w-full h-11 px-4 text-sm"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="ts-input input w-full h-11 px-4 pr-11 text-sm"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="ts-btn-primary btn w-full h-11 text-sm mt-2"
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-xs" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6 animate-fade-in-up delay-300">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Create one
            </Link>
          </p>
        </div>

        {/* ── RIGHT: HERO ── */}
        <div className="hidden lg:flex flex-col justify-center p-10 bg-gradient-to-br from-[#0d1b2e] to-[#0a1020] border-l border-white/5 animate-slide-right">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-100 leading-tight mb-2">
              Smarter call sessions<br />
              <span className="gradient-text">start here.</span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time attention tracking and distraction detection — keeping every student engaged, every session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
