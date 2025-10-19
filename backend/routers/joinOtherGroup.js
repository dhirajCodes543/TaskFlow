import { Router } from "express";
import GROUP from "../models/group.js";
import USER from "../models/user.js";

export default function joinGroupRouter(io) {
  const router = Router();

  router.post("/join", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized. Please login." });
      }

      const firebaseUid = req.user.uid;
      const user = await USER.findOne({ uid: firebaseUid });

      if (!user) {
        return res.status(400).json({ error: "User not found." });
      }

      const { inviteCode } = req.body;
      const group = await GROUP.findOne({ inviteCode })
        .populate("createdBy", "name email uid inviteCode")
        .populate("members", "name email uid inviteCode");

      if (!group) {
        return res.status(400).json({ error: "Invalid code. No group exists." });
      }

      // Check if user is the creator
      const isCreator = group.createdBy._id.toString() === user._id.toString();
      if (isCreator) {
        return res.status(400).json({ error: "You are the creator of this group. You cannot join it again." });
      }

      // Check if user is already a member
      const isAlreadyMember = group.members.some(
        (member) => member._id.toString() === user._id.toString()
      );
      if (isAlreadyMember) {
        return res.status(400).json({ error: "You are already a member of this group." });
      }

      // Add user to members array
      group.members.push(user._id);
      await group.save();

      // Re-populate after save to get updated member details
      await group.populate("members", "name email uid inviteCode");

      // Notify all clients in this group that a new member joined
      io.to(inviteCode).emit("memberJoined", {
        userId: user._id,
        name: user.name,
        email: user.email,
        uid: user.uid,
        groupId: inviteCode,
        groupName:group.name
      });

      // Return group with isCreator flag for frontend
      const groupWithMetadata = {
        ...group.toObject(),
        isCreator: false,
      };

      return res.status(200).json({ 
        group: groupWithMetadata,
        message: "Successfully joined the group!" 
      });
    } catch (error) {
      console.error("Error joining group:", error);
      return res.status(500).json({ error: "Server error while joining group." });
    }
  });

  return router;
}
