import CHAT from "../models/Chat.js";
import USER from "../models/user.js";
import { sendJobHandler } from "../JobHandler/addJobToQueue.js";

export default function groupSocketHandler(socket, io) {

    sendJobHandler(socket, io);

    socket.on("joinRoom", (groupId) => {
        socket.join(groupId);
        const roomSize = io.sockets.adapter.rooms.get(groupId)?.size || 0;
        console.log(`✅ Socket ${socket.id} joined room ${groupId} | Total in room: ${roomSize}`);
    });

    socket.on("leaveRoom", (groupId) => {
        socket.leave(groupId);
        const roomSize = io.sockets.adapter.rooms.get(groupId)?.size || 0;
        console.log(`🚪 Socket ${socket.id} left room ${groupId} | Total in room: ${roomSize}`);
    });

    socket.on("sendMessage", async (data) => {
        let { groupId, message, senderId } = data;

        // Validate input
        if (!groupId || !message || !senderId) {
            console.warn("⚠️ sendMessage: Missing groupId, message, or senderId", data);
            return socket.emit("errorMessage", { error: "Missing groupId, message, or senderId" });
        }
        
        const Uid = senderId;
        
        // Fetch user info
        const user = await USER.findOne({ uid: senderId });
        if (!user) {
            console.warn("⚠️ User not found for uid:", senderId);
            return socket.emit("errorMessage", { error: "User not found" });
        }
        
        const senderName = user?.name || user?.email || "Unknown";

        // Save to database
        senderId = user._id;
        const chat = new CHAT({ groupId, senderId, message });
        await chat.save();

        // Check room size before broadcasting
        const roomSize = io.sockets.adapter.rooms.get(groupId)?.size || 0;
        console.log(`📊 Room ${groupId} has ${roomSize} socket(s)`);
        
        senderId = Uid;
        
        // Broadcast to everyone in the group room
        socket.to(groupId).emit("newMessage", {
            id: chat._id,
            message,
            senderId:Uid,
            sender: { uid: senderId, name: senderName },
            createdAt: chat.createdAt,
        });
        
        console.log(`📤 Message broadcasted to room ${groupId} by ${senderName}`);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log(`❌ Socket ${socket.id} disconnected`);
    });

    // add other group events here
}