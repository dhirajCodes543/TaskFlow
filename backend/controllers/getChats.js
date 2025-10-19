import Chat from "../models/Chat.js";
import USER from "../models/user.js";

export const getChats = async (req, res) => {
  try {
    //  Verify user exists from Firebase middleware
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. Please login." });
    }

    const firebaseUid = req.user.uid;
    const user = await USER.findOne({ uid: firebaseUid });
    if (!user) {
      return res.status(400).json({ error: "User not found." });
    }

    const { groupId } = req.params;
    if (!groupId) {
      return res.status(400).json({ error: "Group ID is required." });
    }

    //  Fetch chats and populate sender info
    const chats = await Chat.find({ groupId })
      .populate("senderId", "uid name email") // only fetch needed fields
      .sort({ createdAt: 1 });

    //  Transform for frontend (so frontend doesn’t have to think)
    const formattedChats = chats.map((chat, index) => ({
      id: index + 1,
      message: chat.message,
      timestamp: chat.createdAt,
      sender: {
        uid: chat.senderId?.uid,
        name: chat.senderId?.name || chat.senderId?.email || "Unknown User",
      },
      isOwn: chat.senderId?.uid === firebaseUid,
    }));

    return res.status(200).json({ chats: formattedChats });

  } catch (err) {
    console.error("❌ Error fetching chats:", err);
    return res.status(500).json({ error: "Failed to fetch chats." });
  }
};
