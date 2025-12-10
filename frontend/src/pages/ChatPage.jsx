import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import { socket } from "../lib/socket"; // Make sure socket.js exists

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";
import StudentMonitoringPanel from "../components/StudentMonitoringPanel"; // Make sure this exists
import TeacherMonitoringDashboard from "../components/TeacherMonitoringDashboard"; // Make sure this exists

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const { authUser, isLoading } = useAuthUser();

  // Temporary Fix: If your user was created before roles existed, default to 'student'
  // Remove this line after you create a fresh user via the new Onboarding Page.
  if (authUser && !authUser.role) authUser.role = "student";

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // Connect to Socket.io for monitoring
  useEffect(() => {
    if (callId && authUser) {
      socket.connect();
      socket.emit("join_call", callId);
      
      return () => {
        socket.disconnect();
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
                <StudentMonitoringPanel callId={callId} userId={authUser._id} />
              )}
              {authUser?.role === "teacher" && (
                <TeacherMonitoringDashboard callId={callId} />
              )}
              
              <CallContent />
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

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();

  if (callingState === CallingState.LEFT) return navigate("/");

  return (
    <div className="w-full h-full">
      <StreamTheme>
        <SpeakerLayout />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
            <CallControls />
        </div>
      </StreamTheme>
    </div>
  );
};

export default CallPage;