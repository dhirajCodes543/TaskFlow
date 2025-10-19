import JOB from "../models/job.js";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { connection } from "../queue.js";

const groupQueues = new Map();

// Create or fetch existing queue per group
export function getOrCreateGroupQueue(groupId, workerCount = 3, io) {
  if (groupQueues.has(groupId)) return groupQueues.get(groupId);

  const queueName = `group-${groupId}`;
  const queue = new Queue(queueName, { connection });

  // Spawn workers
  for (let i = 0; i < workerCount; i++) {
    new Worker(
      queueName,
      async (job) => {
        await processJob(io, job.data, job);
      },
      { connection }
    );
  }

  // Manual poller to log waiting jobs
  setInterval(async () => {
    const waitingCount = await queue.getWaitingCount();
    if (waitingCount > 0) {
      console.log(`⏳ ${queueName}: ${waitingCount} jobs waiting`);
    }
  }, 5000);

  groupQueues.set(groupId, queue);
  return queue;
}

async function processJob(io, data, jobInstance) {
  const { jobId, jobName, groupId, userId, retries = 0, maxRetries, priority } = data;

  // Emit job started/processing
  io.to(groupId).emit("newJob", {
    type: "processing",
    message: `Job "${jobName}" is being processed (attempt ${retries + 1}/${maxRetries})`,
    timestamp: new Date(),
    jobId,
  });

  // Simulate 3s job processing time
  await new Promise((r) => setTimeout(r, 3000));

  const failChance = Math.random() < 0.15; // 15% fail

  if (failChance) {
    if (retries + 1 >= maxRetries) {
      // ❌ Job FAILED after max retries
      await JOB.create({
        groupId,
        createdBy: userId,
        title: jobName,
        status: "failed",
        logs: `Job "${jobName}" failed after ${maxRetries} retries`,
        retries: retries + 1,
        maxRetries,
        finishedAt: new Date(),
      });

      io.to(groupId).emit("newJob", {
        type: "failed",
        message: `Job "${jobName}" failed after ${maxRetries} retries`,
        timestamp: new Date(),
        jobId,
      });

      console.log(`❌ Job "${jobName}" failed after ${maxRetries} retries`);
    } else {
      // ⚠️ Job RETRY
      await JOB.create({
        groupId,
        createdBy: userId,
        title: jobName,
        status: "warning",
        logs: `Retrying job "${jobName}" (${retries + 1}/${maxRetries})`,
        retries: retries + 1,
        maxRetries,
      });

      io.to(groupId).emit("newJob", {
        type: "warning",
        message: `Job "${jobName}" retry attempt ${retries + 1}/${maxRetries}`,
        timestamp: new Date(),
        jobId,
      });

      console.log(`⚠️ Job "${jobName}" retrying (${retries + 1}/${maxRetries})`);

      // Re-add job to queue with incremented retries
      const groupQueue = groupQueues.get(groupId);
      if (groupQueue) {
        await groupQueue.add(
          "userJob",
          { jobId, jobName, groupId, userId, retries: retries + 1, maxRetries, priority },
          { priority }
        );
      }
    }
  } else {
    // ✅ Job SUCCEEDED
    await JOB.create({
      groupId,
      createdBy: userId,
      title: jobName,
      status: "success",
      logs: `Job "${jobName}" completed successfully`,
      retries,
      maxRetries,
      finishedAt: new Date(),
    });

    io.to(groupId).emit("newJob", {
      type: "success",
      message: `Job "${jobName}" completed successfully`,
      timestamp: new Date(),
      jobId,
    });

    console.log(`✅ Job "${jobName}" completed successfully`);
  }
}
