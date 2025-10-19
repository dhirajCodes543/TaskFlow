import { Router } from "express";
import GROUP from "../models/group.js";
import USER from "../models/user.js";

const router = Router();

// helper function to ensure unique invite codes
async function generateUniqueInviteCode() {
  let code;
  let exists = true;

  while (exists) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existingGroup = await GROUP.findOne({ inviteCode: code });
    if (!existingGroup) exists = false; // stop when code is unique
  }

  return code;
}

router.post("/create", async (req, res) => {
  try {
    // ensure user is authenticated
    if (!req.user) {
      return res.status(400).json({ error: "User missing. Please signup." });
    }

    const firebaseUid = req.user.uid;
    const user = await USER.findOne({ uid: firebaseUid });

    if (!user) {
      return res.status(400).json({ error: "User data missing. Logout and sign in again." });
    }

    const { groupName, workers } = req.body;
    const name = groupName;
    // check for duplicate group name
    const existingGroup = await GROUP.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ error: "Group name already exists." });
    }

    // generate unique invite code
    const inviteCode = await generateUniqueInviteCode();

    // create group
    const newGroup = new GROUP({
      name,
      createdBy: user._id,
      members: [user._id],
      inviteCode,
      workers: workers && workers <= 4 ? workers : 1, // default 1, max 4
    });

    await newGroup.save();

    // send response
    return res.status(201).json({
      message: "Group created successfully!",
      group: {
        _id: newGroup._id,
        name: newGroup.name,
        inviteCode: newGroup.inviteCode,
        createdBy: newGroup.createdBy,
        members: newGroup.members,
        workers: newGroup.workers,
      },
    });
  } catch (error) {
    console.error("Error creating group:", error);
    return res.status(500).json({ error: "Server error while creating group." });
  }
});

export default router;
