import { Users as UsersIcon, Video, VideoOff, Mic, MicOff } from "lucide-react";

const ParticipantsList = ({ participants, isOpen, onToggle }) => {
  if (!isOpen) {
    return (
      <div className="fixed top-6 right-6 z-[55]">
        <button 
          className="btn btn-sm bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-xl border-primary/30 gap-2 hover:scale-105 shadow-xl hover:shadow-2xl transition-all duration-200"
          onClick={onToggle}
        >
          <UsersIcon className="size-4 text-primary" />
          <span className="font-bold text-lg">{participants.length}</span>
          <span className="text-xs opacity-70">Participant{participants.length !== 1 ? 's' : ''}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-6 right-6 z-[55] w-80 animate-in slide-in-from-right duration-300">
      {/* Header Button */}
      <button 
        className="btn btn-sm bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-xl border-primary/30 gap-2 hover:scale-105 w-full mb-2 shadow-xl hover:shadow-2xl transition-all duration-200"
        onClick={onToggle}
      >
        <UsersIcon className="size-4 text-primary" />
        <span className="font-bold text-lg">{participants.length}</span>
        <span className="text-xs opacity-70">Participant{participants.length !== 1 ? 's' : ''}</span>
      </button>

      {/* Participants List */}
      <div className="bg-base-100/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-primary/20 max-h-96 overflow-hidden">
        <div className="p-3 border-b border-primary/20 font-bold text-sm bg-gradient-to-r from-primary/10 to-secondary/10">
          In This Call
        </div>
        <div className="overflow-y-auto max-h-80">
          {participants.map((participant) => {
            const hasVideo = participant.publishedTracks?.includes('video');
            const hasAudio = participant.publishedTracks?.includes('audio');
            
            return (
              <div 
                key={participant.sessionId} 
                className="flex items-center gap-3 p-3 hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 border-b border-base-200 last:border-b-0 transition-all duration-200 cursor-pointer group"
              >
                {/* Avatar */}
                <div className="avatar">
                  <div className={`w-10 rounded-full ring-2 transition-all duration-200 ${
                    participant.isLocalParticipant ? 'ring-primary group-hover:ring-primary-focus shadow-lg' : 'ring-base-300 group-hover:ring-primary/50'
                  }`}>
                    <img 
                      src={participant.image || `https://avatar.iran.liara.run/public/${participant.userId?.charCodeAt(0) % 100}`} 
                      alt={participant.name || participant.userId}
                    />
                  </div>
                </div>

                {/* Name & Status */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate flex items-center gap-2">
                    {participant.name || participant.userId}
                    {participant.isLocalParticipant && (
                      <span className="badge badge-primary badge-xs">You</span>
                    )}
                  </div>
                  <div className="text-xs opacity-60 flex items-center gap-1 mt-0.5">
                    {participant.connectionQuality && (
                      <span className={`badge badge-xs ${
                        participant.connectionQuality === 'excellent' ? 'badge-success' :
                        participant.connectionQuality === 'good' ? 'badge-info' :
                        participant.connectionQuality === 'poor' ? 'badge-warning' :
                        'badge-error'
                      }`}>
                        {participant.connectionQuality}
                      </span>
                    )}
                  </div>
                </div>

                {/* Media Status Icons */}
                <div className="flex gap-1">
                  {hasVideo ? (
                    <div className="tooltip tooltip-left" data-tip="Video On">
                      <div className="p-1.5 bg-gradient-to-br from-success/30 to-success/20 rounded-full border border-success/30 shadow-sm hover:shadow-md transition-all">
                        <Video className="size-3.5 text-success" />
                      </div>
                    </div>
                  ) : (
                    <div className="tooltip tooltip-left" data-tip="Video Off">
                      <div className="p-1.5 bg-base-300/50 rounded-full hover:bg-base-300 transition-all">
                        <VideoOff className="size-3.5 opacity-50" />
                      </div>
                    </div>
                  )}
                  
                  {hasAudio ? (
                    <div className="tooltip tooltip-left" data-tip="Mic On">
                      <div className="p-1.5 bg-gradient-to-br from-success/30 to-success/20 rounded-full border border-success/30 shadow-sm hover:shadow-md transition-all">
                        <Mic className="size-3.5 text-success" />
                      </div>
                    </div>
                  ) : (
                    <div className="tooltip tooltip-left" data-tip="Mic Muted">
                      <div className="p-1.5 bg-gradient-to-br from-error/30 to-error/20 rounded-full border border-error/30 shadow-sm hover:shadow-md transition-all">
                        <MicOff className="size-3.5 text-error" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ParticipantsList;
