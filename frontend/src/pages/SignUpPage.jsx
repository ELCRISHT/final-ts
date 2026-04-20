import { useState } from "react";
import { Link } from "react-router";
import useSignUp from "../hooks/useSignUp";
import { MonitorIcon, ShieldCheckIcon, UsersIcon, ZapIcon, LockIcon } from "lucide-react";

const highlights = [
  { icon: UsersIcon, color: "text-blue-400", title: "Multi-role Platform", desc: "Built for both teachers and students" },
  { icon: ZapIcon, color: "text-cyan-400", title: "Instant Setup", desc: "Join or start a session in seconds" },
  { icon: LockIcon, color: "text-purple-400", title: "Secure & Private", desc: "End-to-end encrypted classroom sessions" },
];

const SignUpPage = () => {
  const [signupData, setSignupData] = useState({ fullName: "", email: "", password: "" });
  const { isPending, error, signupMutation } = useSignUp();

  const handleSignup = (e) => {
    e.preventDefault();
    signupMutation(signupData);
  };

  return (
    <div className="min-h-screen ts-auth-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-cyan-600/8 blur-3xl animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-600/6 blur-3xl animate-blob delay-2000" />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full bg-purple-600/5 blur-3xl animate-blob delay-4000" />
      </div>

      <div className="relative w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-0 ts-auth-card shadow-2xl shadow-black/50 overflow-hidden animate-fade-in">

        {/* ── LEFT: HERO ── */}
        <div className="hidden lg:flex flex-col justify-center p-10 bg-gradient-to-br from-[#0d1b2e] to-[#0a1020] border-r border-white/5 animate-slide-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-5">
            <ShieldCheckIcon className="size-3" />
            Join TrackSmart Today
          </div>
          <h2 className="text-2xl font-bold text-slate-100 leading-tight mb-2">
            The classroom is<br />
            <span className="gradient-text">smarter than ever.</span>
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            TrackSmart brings Zoom-style video calling with AI-powered attention monitoring — all in one seamless platform.
          </p>

          <div className="space-y-3">
            {highlights.map(({ icon: Icon, color, title, desc }, i) => (
              <div
                key={title}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/3 border border-white/6 animate-fade-in-up"
                style={{ animationDelay: `${(i + 1) * 0.15}s` }}
              >
                <Icon className={`size-5 ${color} shrink-0`} />
                <div>
                  <p className="text-sm font-semibold text-slate-200">{title}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/15">
            <p className="text-xs text-slate-400 italic leading-relaxed">
              "TrackSmart transformed how I manage classroom engagement — I can see every student's attention score live."
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-300">M</div>
              <p className="text-[11px] text-slate-500">Ms. Cruz · Computer Science Teacher</p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: FORM ── */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-[#0a0f1e]/60 animate-slide-right">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <MonitorIcon className="size-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text tracking-tight leading-none">TrackSmart</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Classroom Intelligence</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-100">Create your account</h2>
            <p className="text-sm text-slate-400 mt-1">Get started in less than a minute</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error.response?.data?.message || "Sign up failed. Please try again."}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                placeholder="Juan dela Cruz"
                className="ts-input input w-full h-11 px-4 text-sm"
                value={signupData.fullName}
                onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                placeholder="you@school.edu"
                className="ts-input input w-full h-11 px-4 text-sm"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                className="ts-input input w-full h-11 px-4 text-sm"
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                required
              />
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input type="checkbox" className="checkbox checkbox-xs checkbox-primary mt-1" required />
              <span className="text-xs text-slate-500 leading-relaxed">
                I agree to the{" "}
                <span className="text-blue-400 cursor-pointer hover:underline">Terms of Service</span>{" "}
                and{" "}
                <span className="text-blue-400 cursor-pointer hover:underline">Privacy Policy</span>
              </span>
            </div>

            <button
              type="submit"
              className="ts-btn-primary btn w-full h-11 text-sm mt-1"
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-xs" />
                  Creating account...
                </span>
              ) : (
                "Create Account →"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
