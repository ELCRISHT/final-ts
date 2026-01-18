import { useState, useEffect, useRef } from "react";
import { socket } from "../lib/socket";
import { Send, MessageCircle, X, Minimize2, Maximize2, Users } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";

const CallGroupChat = ({ callId, isOpen, onToggle }) => {
  const { authUser } = useAuthUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isOpen, isMinimized]);

  // Socket event listeners
  useEffect(() => {
    // Receive chat messages
    socket.on("chat:message", (data) => {
      setMessages((prev) => [...prev, data]);
      if (!isOpen || isMinimized) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    // Receive typing indicators
    socket.on("chat:typing", (data) => {
      if (data.userId !== authUser?._id) {
        setTypingUsers((prev) => {
          if (!prev.find((u) => u.id === data.userId)) {
            return [...prev, { id: data.userId, name: data.userName }];
          }
          return prev;
        });
      }
    });

    // User stopped typing
    socket.on("chat:stopTyping", (data) => {
      setTypingUsers((prev) => prev.filter((u) => u.id !== data.userId));
    });

    // System messages (user joined/left)
    socket.on("chat:system", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "system",
          content: data.message,
          timestamp: new Date(),
        },
      ]);
    });

    return () => {
      socket.off("chat:message");
      socket.off("chat:typing");
      socket.off("chat:stopTyping");
      socket.off("chat:system");
    };
  }, [authUser, isOpen, isMinimized]);

  // Handle typing indicator
  const handleTyping = () => {
    socket.emit("chat:typing", {
      callId,
      userId: authUser._id,
      userName: authUser.fullName,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("chat:stopTyping", {
        callId,
        userId: authUser._id,
      });
    }, 2000);
  };

  // Send message
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      id: Date.now(),
      callId,
      userId: authUser._id,
      userName: authUser.fullName,
      userImage: authUser.profilePic,
      userRole: authUser.role,
      content: newMessage.trim(),
      timestamp: new Date(),
    };

    socket.emit("chat:message", messageData);
    
    // Clear typing indicator
    socket.emit("chat:stopTyping", {
      callId,
      userId: authUser._id,
    });

    setNewMessage("");
    inputRef.current?.focus();
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Chat toggle button (when closed)
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-28 right-6 z-[50] btn btn-circle btn-lg btn-primary shadow-2xl hover:scale-110 transition-transform duration-200 animate-bounce"
        style={{ animationDuration: "3s" }}
      >
        <MessageCircle className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 badge badge-error badge-sm animate-pulse shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-28 right-6 z-[50] bg-base-100 rounded-2xl shadow-2xl border border-primary/20 flex flex-col transition-all duration-300 backdrop-blur-xl ${
        isMinimized ? "w-72 h-14" : "w-80 h-[500px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-primary/20 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-4 text-primary" />
          <span className="font-bold text-sm">Group Chat</span>
          {unreadCount > 0 && isMinimized && (
            <span className="badge badge-error badge-xs">{unreadCount}</span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="btn btn-ghost btn-xs btn-square"
          >
            {isMinimized ? (
              <Maximize2 className="size-3" />
            ) : (
              <Minimize2 className="size-3" />
            )}
          </button>
          <button onClick={onToggle} className="btn btn-ghost btn-xs btn-square">
            <X className="size-3" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <MessageCircle className="size-10 mb-2" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Start the conversation!</p>
              </div>
            )}

            {messages.map((msg) => {
              if (msg.type === "system") {
                return (
                  <div key={msg.id} className="text-center">
                    <span className="text-xs opacity-50 bg-base-200 px-2 py-1 rounded">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              const isOwn = msg.userId === authUser?._id;
              const isTeacher = msg.userRole === "teacher";

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div className="avatar">
                    <div
                      className={`w-8 rounded-full ring-1 ${
                        isTeacher ? "ring-primary" : "ring-base-300"
                      }`}
                    >
                      <img
                        src={msg.userImage || "https://avatar.iran.liara.run/public"}
                        alt={msg.userName}
                      />
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[70%] ${isOwn ? "items-end" : ""}`}>
                    {/* Name & Role */}
                    <div
                      className={`flex items-center gap-1 mb-0.5 ${
                        isOwn ? "justify-end" : ""
                      }`}
                    >
                      <span className="text-xs font-semibold opacity-70">
                        {isOwn ? "You" : msg.userName}
                      </span>
                      {isTeacher && (
                        <span className="badge badge-primary badge-xs">Teacher</span>
                      )}
                    </div>

                    {/* Message Content */}
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm shadow-sm transition-all hover:shadow-md ${
                        isOwn
                          ? "bg-gradient-to-br from-primary to-primary-focus text-primary-content rounded-tr-sm"
                          : isTeacher
                          ? "bg-gradient-to-br from-secondary/20 to-primary/10 rounded-tl-sm border border-primary/20"
                          : "bg-base-200 rounded-tl-sm hover:bg-base-300"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Timestamp */}
                    <div
                      className={`text-[10px] opacity-50 mt-0.5 ${
                        isOwn ? "text-right" : ""
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-xs bg-base-200 px-3 py-2 rounded-full w-fit animate-pulse">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                </div>
                <span className="font-medium opacity-70">
                  {typingUsers.length === 1
                    ? `${typingUsers[0].name} is typing...`
                    : `${typingUsers.length} people are typing...`}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={sendMessage} className="p-3 border-t border-base-200">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                className="input input-bordered input-sm flex-1 focus:input-primary"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="btn btn-primary btn-sm btn-square"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default CallGroupChat;
