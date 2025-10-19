import BullMQ from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const { Queue, Worker } = BullMQ;

// Correct: pass full REDIS_URL
export const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // required for serverless Redis
});

connection.on("connect", () => console.log("✅ Connected to Redis"));
connection.on("error", (err) => console.error("❌ Redis connection error:", err));

export const myQueue = new Queue("priorityQueue", { connection });

new Worker(
  "priorityQueue",
  async (job) => {
    console.log("Processing job:", job.name, job.data);
  },
  { connection }
);
