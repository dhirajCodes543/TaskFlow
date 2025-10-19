import { Router } from "express";
import USER from "../models/user.js";
import admin from "../firebaseAdmin.js";

const router = Router();

router.post("/signup", async (req, res) => {
    if (!req.user) {
        return res.status(400).json({ error: "User missing" });
    }

    const firebaseUid = req.user.uid;

    try {
        const firebaseUser = await admin.auth().getUser(firebaseUid);

        let user = await USER.findOne({ uid: firebaseUid });
        if (user) {
            return res.status(200).json({ message: "User already exists", user });
        }

        user = await USER.create({
            uid: firebaseUid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || "",
        });

        console.error("Signup Successfull", user);
        res.status(201).json({ message: "User created", user });

    } catch (error) {
        console.error("Signup Error", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
