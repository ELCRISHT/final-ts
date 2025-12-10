import { useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import { LoaderIcon, MapPinIcon, ShipWheelIcon, ShuffleIcon, BriefcaseIcon, GraduationCapIcon } from "lucide-react";

const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
    // New Fields
    role: "student",
    department: "",
    yearLevel: "", // Only for students
    position: "",  // Only for teachers
  });

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile onboarded successfully");
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
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;
    setFormState({ ...formState, profilePic: randomAvatar });
    toast.success("Random profile picture generated!");
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-base-200 w-full max-w-3xl shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">Complete Your Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PROFILE PIC */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="size-32 rounded-full bg-base-300 overflow-hidden ring-4 ring-base-100">
                <img
                  src={formState.profilePic}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button type="button" onClick={handleRandomAvatar} className="btn btn-accent btn-sm">
                <ShuffleIcon className="size-4 mr-2" />
                Generate Random Avatar
              </button>
            </div>

            {/* FULL NAME */}
            <div className="form-control">
              <label className="label"><span className="label-text">Full Name</span></label>
              <input
                type="text"
                value={formState.fullName}
                onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                className="input input-bordered w-full"
                required
              />
            </div>

            {/* BIO */}
            <div className="form-control">
              <label className="label"><span className="label-text">Bio</span></label>
              <textarea
                value={formState.bio}
                onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
                className="textarea textarea-bordered h-24"
                placeholder="Tell us about yourself..."
                required
              />
            </div>

            {/* LOCATION */}
            <div className="form-control">
              <label className="label"><span className="label-text">Location</span></label>
              <div className="relative">
                <MapPinIcon className="absolute top-1/2 transform -translate-y-1/2 left-3 size-5 text-base-content opacity-70" />
                <input
                  type="text"
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                  className="input input-bordered w-full pl-10"
                  placeholder="City, Country"
                  required
                />
              </div>
            </div>

            {/* --- ROLE SELECTION --- */}
            <div className="divider">Role & Academics</div>
            
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">I am a...</span></label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${formState.role === 'student' ? 'bg-primary text-primary-content border-primary' : 'bg-base-100 border-base-300 hover:border-primary'}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    className="hidden" 
                    checked={formState.role === "student"} 
                    onChange={() => setFormState({...formState, role: "student"})} 
                  />
                  <GraduationCapIcon className="size-6" />
                  <span className="font-medium">Student</span>
                </label>

                <label className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${formState.role === 'teacher' ? 'bg-secondary text-secondary-content border-secondary' : 'bg-base-100 border-base-300 hover:border-secondary'}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    className="hidden" 
                    checked={formState.role === "teacher"} 
                    onChange={() => setFormState({...formState, role: "teacher"})} 
                  />
                  <BriefcaseIcon className="size-6" />
                  <span className="font-medium">Teacher</span>
                </label>
              </div>
            </div>

            {/* DEPARTMENT (Common) */}
            <div className="form-control">
              <label className="label"><span className="label-text">Department / College</span></label>
              <select 
                className="select select-bordered w-full" 
                value={formState.department}
                onChange={(e) => setFormState({...formState, department: e.target.value})}
                required
              >
                <option value="" disabled>Select Department</option>
                <option value="cs">Computer Science</option>
                <option value="it">Information Technology</option>
                <option value="eng">Engineering</option>
                <option value="arts">Arts & Sciences</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* CONDITIONAL FIELDS */}
            <div className="grid grid-cols-1 gap-4">
              {formState.role === "student" ? (
                <div className="form-control">
                  <label className="label"><span className="label-text">Year Level</span></label>
                  <select 
                    className="select select-bordered w-full"
                    value={formState.yearLevel}
                    onChange={(e) => setFormState({...formState, yearLevel: e.target.value})}
                    required={formState.role === "student"}
                  >
                    <option value="" disabled>Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              ) : (
                <div className="form-control">
                  <label className="label"><span className="label-text">Position / Title</span></label>
                  <input 
                    type="text"
                    className="input input-bordered w-full" 
                    placeholder="e.g. Professor, Instructor"
                    value={formState.position}
                    onChange={(e) => setFormState({...formState, position: e.target.value})}
                    required={formState.role === "teacher"}
                  />
                </div>
              )}
            </div>

            <button className="btn btn-primary w-full mt-6" disabled={isPending} type="submit">
              {isPending ? (
                <>
                  <LoaderIcon className="animate-spin size-5 mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <ShipWheelIcon className="size-5 mr-2" />
                  Complete Setup
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default OnboardingPage;