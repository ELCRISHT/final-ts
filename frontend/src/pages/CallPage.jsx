import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import { socket, connectSocket, disconnectSocket } from "../lib/socket";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
  ParticipantView,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";
import StudentMonitoringPanel from "../components/StudentMonitoringPanel";
import TeacherMonitoringDashboard from "../components/TeacherMonitoringDashboard";
import ParticipantsList from "../components/ParticipantsList";
import CallStats from "../components/CallStats";
import CallGroupChat from "../components/CallGroupChat";
import StudentPeerPanel from "../components/StudentPeerPanel";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { authUser, isLoading } = useAuthUser();

  // Temporary Fix: If your user was created before roles existed, default to 'student'
  if (authUser && !authUser.role) authUser.role = "student";

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // Connect to Socket.io for monitoring and chat
  useEffect(() => {
    if (callId && authUser) {
      connectSocket(authUser);
      socket.emit("join_call", callId);
      
      return () => {
        disconnectSocket();
      };
    }
  }, [callId, authUser]);

  useEffect(() => {
    const initCall = async () => {
      if (!tokenData?.token || !authUser || !callId) return;

      try {
        const user = {
          id: authUser._id,
          name: authUser.fullName,
          image: authUser.profilePic,
        };

        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user,
          token: tokenData.token,
        });

        const callInstance = videoClient.call("default", callId);
        await callInstance.join({ create: true });

        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        console.error("Error joining call:", error);
        toast.error("Could not join the call. Please try again.");
      } finally {
        setIsConnecting(false);
      }
    };

    initCall();
  }, [tokenData, authUser, callId]);

  if (isLoading || isConnecting) return <PageLoader />;

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-base-300">
      <div className="relative w-full h-full">
        {client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              {/* MONITORING PANELS */}
              {authUser?.role === "student" && (
                <>
                  <StudentMonitoringPanel callId={callId} userId={authUser._id} />
                  <StudentPeerPanel callId={callId} currentUserId={authUser._id} />
                </>
              )}
              {authUser?.role === "teacher" && (
                <TeacherMonitoringDashboard callId={callId} />
              )}
              
              {/* GROUP CHAT */}
              <CallGroupChat 
                callId={callId} 
                isOpen={isChatOpen} 
                onToggle={() => setIsChatOpen(!isChatOpen)} 
              />
              
              <CallContent authUser={authUser} />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize call. Please refresh.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CallContent = ({ authUser }) => {
  const { useCallCallingState, useParticipants } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();
  const participants = useParticipants();
  const [showParticipants, setShowParticipants] = useState(false);

  if (callingState === CallingState.LEFT) return navigate("/");

  const isTeacher = authUser?.role === "teacher";
  
  // Remove duplicate participants by userId (keep only unique users)
  const uniqueParticipants = participants.reduce((acc, participant) => {
    const existingIndex = acc.findIndex(p => p.userId === participant.userId);
    if (existingIndex === -1) {
      acc.push(participant);
    } else {
      // If duplicate, prefer the one with video track
      if (participant.publishedTracks.includes('video') && 
          !acc[existingIndex].publishedTracks.includes('video')) {
        acc[existingIndex] = participant;
      }
    }
    return acc;
  }, []);
  
  // Calculate grid columns based on participant count
  const getGridCols = (count) => {
    if (count <= 1) return 1;
    if (count <= 4) return 2;
    if (count <= 9) return 3;
    return 4;
  };

  return (
    <div className="w-full h-full relative bg-base-300">
      <StreamTheme>
        {/* Call Stats - Top Center */}
        <CallStats participants={uniqueParticipants} authUser={authUser} />
        
        {/* Participant List - Top Right */}
        <ParticipantsList 
          participants={uniqueParticipants}
          isOpen={showParticipants}
          onToggle={() => setShowParticipants(!showParticipants)}
        />

        {/* Video Grid Layout */}
        <div 
          className="w-full h-full overflow-auto" 
          style={{ 
            paddingLeft: isTeacher ? '410px' : '10px',
            paddingRight: '10px',
            paddingTop: '75px',
            paddingBottom: '100px'
          }}
        >
          <div 
            className="grid gap-4 h-full w-full p-4"
            style={{
              gridTemplateColumns: `repeat(${getGridCols(uniqueParticipants.length)}, 1fr)`,
              gridAutoRows: 'minmax(200px, 1fr)',
            }}
          >
            {uniqueParticipants.map((participant) => (
              <div
                key={participant.sessionId}
                className="relative bg-base-200 rounded-xl overflow-hidden shadow-xl border-2 border-base-300 hover:border-primary/50 transition-all"
              >
                <ParticipantView
                  participant={participant}
                  ParticipantViewUI={null}
                />
                
                {/* Participant Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-base-300/95 to-transparent p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="avatar placeholder">
                        <div className="bg-primary text-primary-content rounded-full w-8">
                          <span className="text-xs">{participant.name?.charAt(0) || "U"}</span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-white drop-shadow-lg">
                        {participant.name || "Unknown"}
                        {participant.isLocalParticipant && " (You)"}
                      </span>
                    </div>
                    
                    {/* Audio/Video Status */}
                    <div className="flex gap-2">
                      {!participant.publishedTracks.includes("audio") && (
                        <div className="badge badge-error badge-sm gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {!participant.publishedTracks.includes("video") && (
                        <div className="badge badge-error badge-sm gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connection Quality Indicator */}
                {participant.connectionQuality && (
                  <div className="absolute top-2 right-2">
                    <div className={`badge badge-sm ${
                      participant.connectionQuality === 'excellent' ? 'badge-success' :
                      participant.connectionQuality === 'good' ? 'badge-info' :
                      participant.connectionQuality === 'poor' ? 'badge-warning' :
                      'badge-error'
                    }`}>
                      {participant.connectionQuality}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Call Controls - Fixed at bottom like Zoom */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-base-300 to-transparent pb-4 pt-8">
          <div className="flex justify-center">
            <CallControls />
          </div>
        </div>
      </StreamTheme>
    </div>
  );
};

export default CallPage;