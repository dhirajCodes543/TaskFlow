import axios from "axios";

export const fetchGroupMembers = async (groupId, token) => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/api/member/getMembers`,
      { groupId }, //  sent in body
      {
        headers: {
          Authorization: `Bearer ${token}`, //  sent properly
        },
      }
    );

    // Extract members array from response
    const members = res.data.members || [];
    console.log(members);
    return members;

  } catch (error) {
    console.error("❌ Error fetching group members:", error.response?.data || error.message);
    throw error;
  }
};

export const fetchGroupChats = async (groupId, token) => {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_BASE_URL}/api/chat/chats/${groupId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const chats = res.data.chats || [];

    // Transform backend data into frontend-ready structure
    const formattedChats = chats.map(chat => ({
      id: chat.id,
      user: chat.isOwn ? "You" : chat.sender.name,
      message: chat.message,
      timestamp: new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: chat.isOwn,
    }));

    console.log("Formatted Chats:", formattedChats);
    return formattedChats;

  } catch (error) {
    console.error("Error fetching group chats:", error.response?.data || error.message);
    throw error;
  }
};

export const fetchGroupLogs = async (groupId, token) => {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_BASE_URL}/api/get/jobs/${groupId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const logs = res.data.historicalLogs || [];

    // Transform backend data into frontend-ready structure
    console.log(logs[0]);
    const formattedLogs = logs.map(log => ({
      type: log.type, // success, failed, warning, processing
      message: log.message,
      timestamp: log.timestamp,
    }));

    console.log("Formatted Logs:", formattedLogs);
    return formattedLogs;

  } catch (error) {
    console.error("❌ Error fetching group logs:", error.response?.data || error.message);
    throw error;
  }
};

