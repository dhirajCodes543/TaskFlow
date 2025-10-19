import JOB from "../models/job.js";
import USER from "../models/user.js";
import GROUP from "../models/group.js";

export const getJobs = async (req, res) => {
  try {
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

    // Fetch last 10 jobs for that group, sorted by creation time descending
    const jobs = await JOB.find({ groupId })
      .sort({ createdAt: -1 }) // newest first
      .limit(10);

    // Transform jobs into frontend format
    const historicalLogs = jobs.map((job) => ({
      type: job.status, // success, failed, warning, processing
      message:job.logs,
      timestamp: job.createdAt,
    }));
    
    // Optional: reverse to show oldest first
    historicalLogs.reverse();
    console.log("send jobs")
    return res.status(200).json({ historicalLogs });
  } catch (err) {
    console.error("❌ Error fetching jobs:", err);
    return res.status(500).json({ error: "Failed to fetch jobs." });
  }
};
