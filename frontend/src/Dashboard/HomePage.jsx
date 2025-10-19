import React, { useState, useEffect } from 'react';
import { Users, Plus, LogIn, Crown, Search, Calendar, ChevronRight, Copy, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import axios from 'axios';
import { useRef } from 'react';
import { getSocket } from '../stores/SocketManager.js';
import { auth } from '../firebase.js';
import useThemeStore from '../stores/themeStore.js';

export default function HomePage() {
  const { darkMode } = useThemeStore();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    maxWorkers: 2
  });
  const [userGroups, setUserGroups] = useState([]);
  const [createdGroups, setCreatedGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const navigate = useNavigate();

  const socket = getSocket();
  const joinedRooms = useRef(new Set());

  useEffect(() => {
    const fetchGroups = async () => {
      let res;
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setLoadingGroups(false);
          return;
        }
        await currentUser.reload();
        const token = await currentUser.getIdToken(true);
        res = await axios.get('/api/group/my-groups', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const groups = res.data.groups || [];
        const userId = res.data.userId;

        // Separate into joined & created groups
        const joined = groups.filter(g => !g.isCreator);
        const created = groups.filter(g => g.isCreator);

        setUserGroups(joined);
        setCreatedGroups(created);

      } catch (error) {
        console.error('Failed to fetch groups:', error);
        if (error.response?.data?.error !== "User not found.") {
          toast.error('Failed to fetch your groups.');
        }
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleConnectError = (error) => {
      console.error("Socket connection failed:", error);
      toast.error("Real-time updates unavailable");
    };

    const handleMemberJoined = (data) => {
      setUserGroups(prev =>
        prev.map(g => {
          if (g.inviteCode === data.groupId) {
            const exists = g.members?.some(m => m.uid === data.uid);
            if (!exists) return { ...g, members: [...(g.members || []), data] };
          }
          return g;
        })
      );

      setCreatedGroups(prev =>
        prev.map(g => {
          if (g.inviteCode === data.groupId) {
            const exists = g.members?.some(m => m.uid === data.uid);
            if (!exists) return { ...g, members: [...(g.members || []), data] };
          }
          return g;
        })
      );

      toast.info(`${data.name || data.email} joined group ${data.groupName}`);
    };

    // Attach listeners
    socket.on("connect_error", handleConnectError);
    socket.on("memberJoined", handleMemberJoined);

    // Cleanup listeners on unmount
    return () => {
      socket.off("connect_error", handleConnectError);
      socket.off("memberJoined", handleMemberJoined);
    };
  }, [socket]);


  // Join rooms whenever groups are loaded
  useEffect(() => {
    if (!socket) return;

    [...userGroups, ...createdGroups].forEach(group => {
      if (!joinedRooms.current.has(group.inviteCode)) {
        socket.emit("joinRoom", group.inviteCode);
        joinedRooms.current.add(group.inviteCode);
      }
    });
  }, [userGroups, createdGroups, socket]);
  // Only runs when we first get groups
  const handleCreateGroup = () => {
    setShowCreateModal(true);
  };

  const handleCreateGroupSubmit = async () => {
    if (!newGroup.name.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    const groupName = newGroup.name;
    const workers = newGroup.maxWorkers;
    setCreatingGroup(true);

    try {
      const currentUser = auth.currentUser;
      const token = await currentUser.getIdToken(true);

      const res = await axios.post(
        "/api/newGroup/create",
        { groupName, workers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Group created:", res.data);

      // Extract invite code from backend response
      const inviteCode = res.data.group?.inviteCode || res.data.inviteCode;
      const newCreatedGroup = res.data.group;

      setGeneratedCode(inviteCode);
      setShowCreateModal(false);
      setShowSuccessModal(true);
      setNewGroup({ name: '', maxWorkers: 2 });

      // Add the new group to created groups list
      if (newCreatedGroup) {
        setCreatedGroups(prev => [...prev, newCreatedGroup]);
      }

      toast.success('Group created successfully! 🎉');

    } catch (error) {
      console.error("Backend response failed:", error);
      toast.error(error.response?.data?.error || "Failed to create group");
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCodeCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a group code');
      return;
    }

    setJoiningGroup(true);

    try {
      const currentUser = auth.currentUser;
      const token = await currentUser.getIdToken(true);

      const res = await axios.post(
        "/api/otherGroup/join",
        { inviteCode: joinCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Joined group:", res.data);

      // Add the joined group to user groups list
      if (res.data.group) {
        setUserGroups(prev => [...prev, res.data.group]);
      }

      toast.success("Successfully joined the group! 🎉");
      setShowJoinModal(false);
      setJoinCode('');

    } catch (error) {
      console.error("Failed to join group:", error);
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to join group';
      toast.error(errorMessage);
    } finally {
      setJoiningGroup(false);
    }
  };

  const handleGroupClick = (groupId) => {
    navigate(`/group/${groupId}`);
  };

  if (loadingGroups) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
        }`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading your groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Make Groups. Give Tasks.{' '}
            <span className="text-blue-600">Grow Together.</span>
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Collaborate with your team, track progress, and achieve goals together
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <button
            onClick={handleCreateGroup}
            className="flex items-center justify-center gap-3 p-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-6 h-6" />
            Create New Group
          </button>

          <button
            onClick={() => setShowJoinModal(true)}
            className={`flex items-center justify-center gap-3 p-6 rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl ${darkMode
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
          >
            <LogIn className="w-6 h-6" />
            Join Group with Code
          </button>
        </div>

        {/* My Groups Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold">My Groups</h2>
            <span className={`ml-2 px-2 py-1 rounded-full text-sm ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-600'
              }`}>
              {userGroups.length}
            </span>
          </div>

          {userGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userGroups.map((group) => (
                <button
                  key={group._id || group.id}
                  onClick={() => handleGroupClick(group._id || group.id)}
                  className={`p-5 rounded-lg transition-all duration-200 text-left hover:scale-105 ${darkMode
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : 'bg-white hover:shadow-lg shadow-md'
                    }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold">{group.groupName || group.name}</h3>
                  </div>

                  <div className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {group.members?.length || 0} members
                      </span>
                      <span className="flex items-center gap-1">
                        <Search className="w-4 h-4" />
                        {group.tasks?.length || 0} tasks
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Active recently
                      </span>
                      <span className={`px-2 py-0.5 rounded ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                        }`}>
                        {group.workers || 0} workers
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end text-blue-600">
                    <span className="text-sm font-medium">View Group</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white shadow-md'
              }`}>
              <Users className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                You haven't joined any groups yet
              </p>
            </div>
          )}
        </div>

        {/* Groups Created by You */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold">Groups Created by You</h2>
            <span className={`ml-2 px-2 py-1 rounded-full text-sm ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-600'
              }`}>
              {createdGroups.length}
            </span>
          </div>

          {createdGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {createdGroups.map((group) => (
                <button
                  key={group._id || group.id}
                  onClick={() => handleGroupClick(group._id || group.id)}
                  className={`p-5 rounded-lg transition-all duration-200 text-left hover:scale-105 ${darkMode
                    ? 'bg-gray-800 hover:bg-gray-700 border border-yellow-500/30'
                    : 'bg-white hover:shadow-lg shadow-md border border-yellow-500/20'
                    }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold">{group.groupName || group.name}</h3>
                    <Crown className="w-5 h-5 text-yellow-500" />
                  </div>

                  <div className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {group.members?.length || 0} members
                      </span>
                      <span className="flex items-center gap-1">
                        <Search className="w-4 h-4" />
                        {group.tasks?.length || 0} tasks
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className={`px-2 py-1 rounded text-xs font-mono ${darkMode ? 'bg-gray-900 text-blue-400' : 'bg-blue-50 text-blue-600'
                        }`}>
                        Code: {group.inviteCode || 'N/A'}
                      </div>
                      <span className={`px-2 py-0.5 rounded ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                        }`}>
                        {group.workers || 0} workers
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end text-blue-600">
                    <span className="text-sm font-medium">View Group</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white shadow-md'
              }`}>
              <Crown className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                You haven't created any groups yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'
              }`}>
              Join Group
            </h3>
            <p className={`mb-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
              Enter the group code to join
            </p>

            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter group code"
              className={`w-full px-4 py-3 border rounded-lg mb-4 font-mono text-center text-lg tracking-wider transition-colors duration-200 ${darkMode
                ? 'border-gray-600 bg-gray-900 text-white placeholder-gray-500 focus:border-blue-400'
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinCode('');
                }}
                disabled={joiningGroup}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Cancel
              </button>
              <button
                onClick={handleJoinGroup}
                disabled={joiningGroup || !joinCode.trim()}
                className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition-colors duration-200 ${joiningGroup || !joinCode.trim()
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {joiningGroup ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Joining...
                  </div>
                ) : (
                  'Join Group'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'
              }`}>
              Create New Group
            </h3>
            <p className={`mb-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
              Set up your new group
            </p>

            <div className="space-y-4 mb-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="Enter group name"
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 ${darkMode
                    ? 'border-gray-600 bg-gray-900 text-white placeholder-gray-500 focus:border-blue-400'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Maximum Workers: {newGroup.maxWorkers}
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => setNewGroup({ ...newGroup, maxWorkers: num })}
                      className={`flex-1 py-3 rounded-lg font-medium transition-colors duration-200 ${newGroup.maxWorkers === num
                        ? 'bg-blue-600 text-white'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewGroup({ name: '', maxWorkers: 2 });
                }}
                disabled={creatingGroup}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroupSubmit}
                disabled={creatingGroup || !newGroup.name.trim()}
                className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition-colors duration-200 ${creatingGroup || !newGroup.name.trim()
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {creatingGroup ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  'Create Group'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal with Group Code */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                Group Created Successfully! 🎉
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                Share this code with others to let them join
              </p>
            </div>

            <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'
              }`}>
              <p className={`text-xs font-medium mb-2 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                Group Code
              </p>
              <div className={`text-3xl font-mono font-bold text-center tracking-widest mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                {generatedCode}
              </div>
              <button
                onClick={handleCopyCode}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors duration-200 ${codeCopied
                  ? darkMode
                    ? 'bg-green-900/30 text-green-400'
                    : 'bg-green-100 text-green-700'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {codeCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}