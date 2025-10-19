import { myQueue } from "../queue.js"
import JOB from "../models/job.js";
import USER from "../models/user.js";
import GROUP from "../models/group.js";
import { getOrCreateGroupQueue} from "./jobFinisher.js"


export const sendJobHandler = (socket, io) => {
    socket.on("sendJob", async (data) => {
        try {
            const { groupId, jobName, priority = 1, retries = 3, senderId } = data;

            // Validate input
            if (!groupId || !jobName || !senderId) {
                return socket.emit("errorMessage", { error: "Missing groupId, jobName, or senderId" });
            }

            const currGroup = await GROUP.findOne({ _id: groupId });
            const workers = currGroup.workers;

            // Fetch user info
            const user = await USER.findOne({ uid: senderId });
            if (!user) {
                return socket.emit("errorMessage", { error: "User not found" });
            }
            console.log("pahucha mai");
            const userName = user.name || user.email;
            // Save job to MongoDB
            const newJob = new JOB({
                groupId,
                status: "processing",
                createdBy: user._id,
                title: jobName,
                priority: Number(priority),
                retries: 0,
                maxRetries: Number(retries),
                logs: `${userName} added Job "${jobName}" to queue`,
            });
            await newJob.save();

            // Broadcast log to everyone in the group
            socket.to(groupId).emit("newJob", {
                id: newJob._id,
                title: jobName,
                type: "processing",
                message: `${userName} added Job "${jobName}" to queue`,
                timestamp: new Date(),
                createdBy: { uid: user.uid, name: user.name },
            });
            const userId = user._id;
            const queue = getOrCreateGroupQueue(groupId, workers, io);
            await queue.add("userJob", {
                jobId: newJob._id,
                jobName,
                groupId,
                userId,
                retries: 0,
                maxRetries: Number(retries),
                priority
            }, { priority });

            console.log(`✅ Job "${jobName}" added to queue by ${user.name} in group ${groupId}`);

        } catch (err) {
            console.error("❌ Error in sendJob:", err);
            socket.emit("errorMessage", { error: "Failed to add job" });
        }
    });
};