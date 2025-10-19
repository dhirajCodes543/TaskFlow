import { Router } from "express";
import GROUP from "../models/group.js";
import USER from "../models/user.js";

const router = Router();

router.get("/my-groups", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. Please login." });
    }

    const firebaseUid = req.user.uid;
    const user = await USER.findOne({ uid: firebaseUid });

    if (!user) {
      return res.status(400).json({ error: "User not found." });
    }

    // Find groups where the user is a member or creator
    const groups = await GROUP.find({
      $or: [{ createdBy: user._id }, { members: user._id }],
    })
      .populate("createdBy", "name email uid inviteCode")  // Added uid
      .populate("members", "name email uid inviteCode")     // Added uid
      .sort({ createdAt: -1 });

    // Add a flag to indicate which groups the user created
    const groupsWithMetadata = groups.map(group => ({
      ...group.toObject(),
      isCreator: group.createdBy._id.toString() === user._id.toString()
    }));

    return res.status(200).json({ groups: groupsWithMetadata, userId: user._id });
  } catch (error) {
    console.error("Error fetching user groups:", error);
    return res.status(500).json({ error: "Server error while fetching groups." });
  }
});

export default router;