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
  StreamTheme,
  CallingState,
  useCallStateHooks,
  useCall,
  ParticipantView,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";
import StudentMonitoringPanel from "../components/StudentMonitoringPanel";
import TeacherMonitoringDashboard from "../components/TeacherMonitoringDashboard";
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
              
              <CallContent authUser={authUser} isChatOpen={isChatOpen} callId={callId} />
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

const CallContent = ({ authUser, isChatOpen, callId }) => {
  const { useCallCallingState, useParticipants, useCameraState, useMicrophoneState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();
  const participants = useParticipants();
  const call = useCall();
  const { camera, isMute: isCamOff } = useCameraState();
  const { microphone, isMute: isMicOff } = useMicrophoneState();
  const isTeacher = authUser?.role === "teacher";

  // ── Navigate home when this user leaves ──
  useEffect(() => {
    if (callingState === CallingState.LEFT) navigate("/");
  }, [callingState, navigate]);

  // ── Navigate home when teacher ends the call for everyone ──
  useEffect(() => {
    if (!call) return;
    const handleEnded = () => navigate("/");
    call.on("call.ended", handleEnded);
    return () => call.off("call.ended", handleEnded);
  }, [call, navigate]);

  // ── End call: teacher ends for ALL, student just leaves ──
  const handleEndCall = async () => {
    try {
      if (isTeacher) {
        await call?.end();   // broadcasts call.ended → all participants navigate home
      } else {
        await call?.leave(); // only this participant leaves
      }
    } catch (err) {
      console.error("Error ending/leaving call:", err);
      navigate("/");
    }
  };

  
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
        {/* Top Bar: Session Info + Participants */}
        <CallStats participants={uniqueParticipants} authUser={authUser} callId={callId} />

        {/* Video Grid Layout */}
        <div 
          className="w-full h-full overflow-auto" 
          style={{ 
            paddingLeft: isTeacher ? '410px' : '10px',
            paddingRight: isChatOpen ? '348px' : '10px',
            paddingTop: '52px',
            paddingBottom: '100px',
            transition: 'padding-right 0.3s ease'
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
        
        {/* Call Controls — hook-driven custom bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-base-300 to-transparent pb-4 pt-8">
          <div className="flex justify-center items-center gap-3">

            {/* Microphone */}
            <button
              onClick={() => microphone.toggle()}
              title={isMicOff ? "Unmute" : "Mute"}
              style={{
                background: isMicOff ? '#ef4444' : 'rgba(255,255,255,0.15)',
                border: 'none', borderRadius: '50%',
                width: '52px', height: '52px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'white', transition: 'background 0.2s',
              }}
            >
              {isMicOff ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                </svg>
              )}
            </button>

            {/* Camera */}
            <button
              onClick={() => camera.toggle()}
              title={isCamOff ? "Turn on camera" : "Turn off camera"}
              style={{
                background: isCamOff ? '#ef4444' : 'rgba(255,255,255,0.15)',
                border: 'none', borderRadius: '50%',
                width: '52px', height: '52px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'white', transition: 'background 0.2s',
              }}
            >
              {isCamOff ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 6.5l-4-4-12 12 4 4 12-12zM2.77 5.56L1.5 6.83l2.9 2.9C4.14 10.22 4 10.85 4 11.5v9h16v-2.46l2 2 1.27-1.27-5-5L2.77 5.56zM6 18.5v-5.17l5.17 5.17H6zm14-5v-8l-6 6 6 2z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
              )}
            </button>

            {/* Screen Share — use native Stream SDK button which reliably works */}
            <button
              onClick={() => call?.screenShare?.toggle?.()}
              title="Share screen"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none', borderRadius: '50%',
                width: '52px', height: '52px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'white',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
              </svg>
            </button>

            {/* End Call */}
            <button
              onClick={handleEndCall}
              title={isTeacher ? "End session for everyone" : "Leave session"}
              style={{
                background: '#ef4444',
                border: 'none', borderRadius: '50%',
                width: '52px', height: '52px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'white',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
              </svg>
            </button>
          </div>
        </div>
      </StreamTheme>
    </div>
  );
};

export default CallPage;