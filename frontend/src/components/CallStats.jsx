import { Users as UsersIcon, TrendingUp, Activity } from "lucide-react";

const CallStats = ({ participants, authUser }) => {
  const isTeacher = authUser?.role === "teacher";
  const studentCount = participants.filter(p => 
    !p.isLocalParticipant || authUser?.role === "student"
  ).length;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[40] flex gap-3 animate-in slide-in-from-top duration-300">
      {/* Participant Count Card - Compact */}
      <div className="bg-gradient-to-br from-base-100/95 to-base-200/95 backdrop-blur-xl rounded-lg border border-primary/30 px-4 py-2 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center gap-3">
        <UsersIcon className="size-5 text-primary drop-shadow" />
        <div>
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-none">{participants.length}</div>
          <div className="text-[10px] opacity-60 font-medium uppercase tracking-wide">Participants</div>
        </div>
      </div>

      {/* Teacher-specific stats - Compact */}
      {isTeacher && studentCount > 0 && (
        <div className="bg-gradient-to-br from-primary to-primary-focus backdrop-blur-xl rounded-lg border border-primary-content/30 px-4 py-2 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center gap-3">
          <Activity className="size-5 text-primary-content drop-shadow" />
          <div>
            <div className="text-2xl font-bold text-primary-content drop-shadow leading-none">{studentCount}</div>
            <div className="text-[10px] text-primary-content opacity-90 font-medium uppercase tracking-wide">Students</div>
          </div>
        </div>
      )}

      {/* Connection indicator - Compact */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-success to-success-focus backdrop-blur-xl rounded-lg border border-success-content/30 px-4 py-2 shadow-xl hover:scale-105 transition-transform">
        <div className="relative">
          <div className="size-2 rounded-full bg-success-content"></div>
          <div className="absolute inset-0 size-2 rounded-full bg-success-content animate-ping"></div>
        </div>
        <span className="text-sm font-bold text-success-content drop-shadow uppercase tracking-wide">LIVE</span>
      </div>
    </div>
  );
};

export default CallStats;
