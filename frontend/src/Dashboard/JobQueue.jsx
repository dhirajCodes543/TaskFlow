import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageCircle, List, AlertCircle, CheckCircle, Clock, XCircle, Loader } from 'lucide-react';
import useThemeStore from '../stores/ThemeStore.js';
import { useParams } from "react-router-dom";
import { fetchGroupMembers, fetchGroupChats, fetchGroupLogs } from '../../GetData/getGroupThings.js';
import { auth } from '../firebase.js';
import { getSocket } from '../stores/SocketManager.js';

export default function JobQueuePage() {
  const { groupId } = useParams();
  const { darkMode } = useThemeStore();
  const [jobName, setJobName] = useState('');
  const [priority, setPriority] = useState('');
  const [retries, setRetries] = useState('');
  const [logs, setLogs] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState('');
  const [members, setMembers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [messages, setMessages] = useState([]);
  const logsEndRef = useRef(null);
  const logsContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [socket, setSocket] = useState(null);

  const userUid = auth.currentUser?.uid;

  useEffect(() => {
    const checkSocket = () => {
      const sock = getSocket();
      if (sock) {
        setSocket(sock);
      } else {
        // Retry after a short delay
        setTimeout(checkSocket, 100);
      }
    };
    checkSocket();
  }, []);

  useEffect(() => {
    console.log("📦 Current Group ID:", groupId);

    const loadGroupData = async () => {
      try {
        const token = await auth.currentUser.getIdToken();

        //  Fetch members
        const membersData = await fetchGroupMembers(groupId, token);
        setGroupName(membersData[0]?.groupName || "Unknown Group");

        const formattedMembers = membersData.map((m, index) => ({
          id: index + 1,
          name: m.uid === userUid ? 'You' : m.name || m.email, // mark yourself
          status: "online",
        }));

        setMembers(formattedMembers);

        //  Fetch chats
        const chatsData = await fetchGroupChats(groupId, token);
        setMessages(chatsData);

        const jobsData = await fetchGroupLogs(groupId, token)
        setLogs(jobsData.map((log, index) => ({ ...log, id: Date.now() + index })));

        console.log(" Members and chats loaded successfully");
      } catch (error) {
        console.error("❌ Failed to load group data:", error);
      }
    };

    if (groupId) loadGroupData();
  }, [groupId]);


  useEffect(() => {
    if (!groupId || !socket) return;
    socket.emit("joinRoom", groupId);

    console.log("came");
    // Listen for new messages
    const handleNewMessage = (chatData) => {
      const formatted = {
        id: messages.length + 1,
        user: chatData.sender.name || chatData.sender.email || "Unknown",
        message: chatData.message,
        timestamp: new Date(chatData.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: chatData.senderId === userUid,
      };
      console.log(chatData.message);
      setMessages((prev) => [...prev, formatted]);
    };

    const handleNewJob = (job) => {
      setLogs(prev => [
        ...prev,
        {
          id: Date.now(), // unique for frontend rendering
          type: job.type || 'info', // matches backend "type"
          message: job.message,
          timestamp: new Date(job.timestamp),
          createdBy: job.createdBy, // { uid, name }
          title: job.title,
        }
      ]);
    };

    const handleSocketError = (data) => {
      console.error("Socket error:", data);
      toast.error(data.error || "Something went wrong with the socket");
    };

    socket.on("errorMessage", handleSocketError);

    socket.on("newMessage", handleNewMessage);
    socket.on("newJob", handleNewJob);
    return () => {
      socket.off("newJob", handleNewJob);
      socket.off("errorMessage", handleSocketError);
      socket.emit("leaveRoom", groupId);
      socket.off("newMessage", handleNewMessage);
    };
  }, [groupId, userUid, messages.length, socket]);

  const logTypes = {
    info: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    warning: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    processing: { icon: Loader, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jobName.trim() || !priority.trim() || !retries.trim()) return;

    const jobId = Math.floor(Math.random() * 9999);
    setLogs(prev => [...prev, {
      id: Date.now(),
      type: 'processing',
      message: `You added Job "${jobName}" to queue`,
      timestamp: new Date(),
    }]);

    socket.emit("sendJob", {
      groupId: groupId,
      jobName: jobName,
      priority: Number(priority),
      retries: Number(retries),
      senderId: userUid, // current user UID
    });

    setJobName('');
    setPriority('');
    setRetries('');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      user: 'You',
      message: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    socket.emit("sendMessage", {
      groupId: groupId,
      message: message,
      senderId: userUid, // ✅ current user UID
    });
  };

  const formatTime = (date) => {
    if (!date) return '--:--:--';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
      <div className="h-screen flex flex-col overflow-hidden">
        <div className={`border-b px-6 py-4 ${darkMode ? 'border-gray-800' : 'border-gray-200'
          }`}>
          <div className="text-center">
            <h1 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {groupName}
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Job Queue Management • Monitor and manage your job processing queue
            </p>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col p-6">
            <form onSubmit={handleSubmit} className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white shadow-md'
              }`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    Job Name
                  </label>
                  <input
                    type="text"
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    placeholder="e.g., Data Processing"
                    className={`w-full px-4 py-2 border rounded-lg transition-colors duration-200 ${darkMode
                      ? 'border-gray-600 bg-gray-900 text-white placeholder-gray-500 focus:border-blue-400'
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    Priority
                  </label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    placeholder="e.g., 1, 2, 3..."
                    className={`w-full px-4 py-2 border rounded-lg transition-colors duration-200 ${darkMode
                      ? 'border-gray-600 bg-gray-900 text-white placeholder-gray-500 focus:border-blue-400'
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    Retries
                  </label>
                  <input
                    type="number"
                    value={retries}
                    onChange={(e) => setRetries(e.target.value)}
                    placeholder="e.g., 3, 5..."
                    className={`w-full px-4 py-2 border rounded-lg transition-colors duration-200 ${darkMode
                      ? 'border-gray-600 bg-gray-900 text-white placeholder-gray-500 focus:border-blue-400'
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    Add to Queue
                  </button>
                </div>
              </div>
            </form>

            <div className={`flex-1 rounded-lg overflow-hidden flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white shadow-md'
              }`}>
              <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                <h2 className="font-semibold flex items-center gap-2">
                  <List className="w-5 h-5" />
                  Live Logs
                </h2>
              </div>
              <div
                ref={logsContainerRef}
                className={`flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm ${darkMode ? 'bg-gray-900' : 'bg-gray-50'
                  }`}
              >
                {logs.length === 0 ? (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                    Waiting for logs...
                  </div>
                ) : (
                  logs.map((log) => {
                    const logType = logTypes[log.type] || logTypes.info;
                    const LogIcon = logType.icon;
                    return (
                      <div
                        key={log.id}
                        className={`flex items-start gap-3 p-3 rounded-lg ${logType.bg
                          }`}
                      >
                        <LogIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${logType.color
                          } ${log.type === 'processing' ? 'animate-spin' : ''}`} />
                        <div className="flex-1">
                          <p className={darkMode ? 'text-gray-200' : 'text-gray-800'}>
                            {log.message}
                          </p>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                            {formatTime(log.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>

          <div className={`w-96 border-l flex flex-col overflow-hidden ${darkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
            <div className={`flex border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'
              }`}>
              <button
                onClick={() => setShowChat(false)}
                className={`flex-1 px-4 py-3 font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${!showChat
                  ? 'bg-blue-600 text-white'
                  : darkMode
                    ? 'text-gray-400 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Users className="w-5 h-5" />
                Members
              </button>
              <button
                onClick={() => setShowChat(true)}
                className={`flex-1 px-4 py-3 font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${showChat
                  ? 'bg-blue-600 text-white'
                  : darkMode
                    ? 'text-gray-400 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <MessageCircle className="w-5 h-5" />
                Chat
              </button>
            </div>

            {!showChat ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ maxHeight: '100%' }}>
                <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">
                  Group Members ({members.length})
                </h3>
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`p-3 rounded-lg flex items-center gap-3 ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors duration-200`}
                  >
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold overflow-hidden ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-300 text-gray-700'
                        }`}>
                        <img
                          className="w-6 h-6 object-contain"
                          src="/user.svg"
                          alt="User"
                        />
                      </div>

                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        member
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col" style={{ maxHeight: '100%', overflow: 'hidden' }}>
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3"
                  style={{ maxHeight: '100%' }}
                >
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs ${msg.isOwn ? 'text-right' : 'text-left'}`}>
                        {!msg.isOwn && (
                          <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            {msg.user}
                          </p>
                        )}
                        <div className={`inline-block px-4 py-2 rounded-lg ${msg.isOwn
                          ? 'bg-blue-600 text-white'
                          : darkMode
                            ? 'bg-gray-800 text-gray-200'
                            : 'bg-gray-200 text-gray-900'
                          }`}>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'
                    }`}
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className={`flex-1 px-4 py-2 border rounded-lg transition-colors duration-200 ${darkMode
                        ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500 focus:border-blue-400'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                    <button
                      type="submit"
                      disabled={!message.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}