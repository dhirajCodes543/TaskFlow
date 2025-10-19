import { Router } from "express";
import GROUP from "../models/group.js";
import USER from "../models/user.js";

const router = Router();

router.post("/getMembers", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. Please login." });
    }

    const firebaseUid = req.user.uid;
    const user = await USER.findOne({ uid: firebaseUid });

    if (!user) {
      return res.status(400).json({ error: "User not found." });
    }

    const { groupId } = req.body; //using destructuring
    if (!groupId) {
      return res.status(400).json({ error: "Group ID (inviteCode) is required." });
    }

    // Find the group by invite code and populate members
    const group = await GROUP.findOne({ _id: groupId })
      .populate("members", "name email uid")
      .lean(); // lean() for cleaner object

    if (!group) {
      return res.status(404).json({ error: "Group not found." });
    }

    // Filter out the current user from members
    
    const members = group.members

    const membersWithGroup = members.map(member => ({
      ...member,
      groupName: group.name,
      inviteCode:group.inviteCode
    }));

    console.log(membersWithGroup[0].groupName);

    return res.status(200).json({ members: membersWithGroup });
  } catch (error) {
    console.error("Error fetching group members:", error);
    return res.status(500).json({ error: "Server error while fetching members." });
  }
});

export default router;
