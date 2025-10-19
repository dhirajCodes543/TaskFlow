import { Schema, model, Types } from "mongoose";

const jobSchema = new Schema({
  groupId: {
    type: Types.ObjectId,
    ref: "GROUP", // reference to the group this job belongs to
    required: true,
  },
  createdBy: {
    type: Types.ObjectId,
    ref: "USER", // reference to the user who created the job
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  priority: {
    type: Number,
    default: 1, // 3 = highest priority
  },
  status: {
    type: String,
    enum: ["processing", "success", "failed","warning"],
    default: "processing",
  },
  logs: {
    type:String,
    required:true
  },
  retries: {
    type: Number,
    default: 0,
  },
  maxRetries: {
    type: Number,
    default: 3,
  },
  startedAt: {
    type: Date,
    default: null,
  },
  finishedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

const JOB = model("JOB", jobSchema);

export default JOB;
