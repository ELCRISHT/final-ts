import { useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import {
  MonitorIcon,
  MapPinIcon,
  ShuffleIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  ArrowRightIcon,
  UserIcon,
  BuildingIcon,
  BookOpenIcon,
} from "lucide-react";

const DEPARTMENTS = [
  { value: "cs", label: "Computer Science" },
  { value: "it", label: "Information Technology" },
  { value: "eng", label: "Engineering" },
  { value: "arts", label: "Arts & Sciences" },
  { value: "edu", label: "Education" },
  { value: "other", label: "Other" },
];

const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
    role: "student",
    department: "",
    yearLevel: "",
    position: "",
  });

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile set up successfully!");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Something went wrong");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onboardingMutation(formState);
  };

  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1;
    setFormState({ ...formState, profilePic: `https://avatar.iran.liara.run/public/${idx}.png` });
    toast.success("Avatar generated!");
  };

  const isTeacher = formState.role === "teacher";

  return (
    <div className="min-h-screen ts-auth-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-72 h-72 rounded-full bg-blue-600/8 blur-3xl animate-blob" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-purple-600/6 blur-3xl animate-blob delay-2000" />
      </div>

      <div className="relative w-full max-w-2xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <MonitorIcon className="size-5 text-blue-400" />
            </div>
            <span className="text-lg font-bold gradient-text">TrackSmart</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Complete Your Profile</h1>
          <p className="text-sm text-slate-400 mt-1">Let's set you up — this only takes a moment</p>
        </div>

        <div className="ts-auth-card p-6 sm:p-8 shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-blue-500/20 bg-white/5">
                  {formState.profilePic ? (
                    <img src={formState.profilePic} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <UserIcon className="size-10" />
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleRandomAvatar}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
              >
                <ShuffleIcon className="size-3.5" />
                Generate Random Avatar
              </button>
            </div>

            {/* Personal Info */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserIcon className="size-3" /> Full Name
                </label>
                <input
                  type="text"
                  value={formState.fullName}
                  onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                  className="ts-input input w-full h-10 px-3 text-sm"
                  placeholder="Juan dela Cruz"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPinIcon className="size-3" /> Location
                </label>
                <input
                  type="text"
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                  className="ts-input input w-full h-10 px-3 text-sm"
                  placeholder="City, Country"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Short Bio</label>
              <textarea
                value={formState.bio}
                onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
                className="ts-input textarea w-full px-3 py-2.5 text-sm h-20 resize-none"
                placeholder="Tell your teacher or students a bit about yourself..."
                required
              />
            </div>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-white/8" />
              <span className="mx-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">Role & Academic Info</span>
              <div className="flex-1 border-t border-white/8" />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormState({ ...formState, role: "student" })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    !isTeacher
                      ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                      : "bg-white/3 border-white/8 text-slate-400 hover:border-blue-500/20 hover:bg-blue-500/5"
                  }`}
                >
                  <GraduationCapIcon className="size-6" />
                  <span className="text-sm font-semibold">Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormState({ ...formState, role: "teacher" })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    isTeacher
                      ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                      : "bg-white/3 border-white/8 text-slate-400 hover:border-purple-500/20 hover:bg-purple-500/5"
                  }`}
                >
                  <BriefcaseIcon className="size-6" />
                  <span className="text-sm font-semibold">Teacher</span>
                </button>
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BuildingIcon className="size-3" /> Department / College
              </label>
              <select
                className="ts-input select w-full h-10 px-3 text-sm"
                value={formState.department}
                onChange={(e) => setFormState({ ...formState, department: e.target.value })}
                required
              >
                <option value="" disabled>Select Department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Conditional: Year Level / Position */}
            <div className="space-y-1.5">
              {!isTeacher ? (
                <>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpenIcon className="size-3" /> Year Level
                  </label>
                  <select
                    className="ts-input select w-full h-10 px-3 text-sm"
                    value={formState.yearLevel}
                    onChange={(e) => setFormState({ ...formState, yearLevel: e.target.value })}
                    required
                  >
                    <option value="" disabled>Select Year Level</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </>
              ) : (
                <>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BriefcaseIcon className="size-3" /> Position / Title
                  </label>
                  <input
                    type="text"
                    className="ts-input input w-full h-10 px-3 text-sm"
                    placeholder="e.g. Professor, Instructor"
                    value={formState.position}
                    onChange={(e) => setFormState({ ...formState, position: e.target.value })}
                    required
                  />
                </>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="ts-btn-primary btn w-full h-12 text-sm mt-2"
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-xs" />
                  Setting up your profile...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Complete Setup
                  <ArrowRightIcon className="size-4" />
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;