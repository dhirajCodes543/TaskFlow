import { Schema, model, Types } from "mongoose";

const groupSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  members: [
    {
      type: Types.ObjectId,
      ref: "USER", // references User model
    },
  ],
  jobs: [
    {
      type: Types.ObjectId,
      ref: "JOB", // references Job model
    },
  ],
  chats: [
    {
      type: Types.ObjectId,
      ref: "CHAT", // references ChatMessage model
    },
  ],
  logs: [
    {
      message: { type: String },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdBy: {
    type: Types.ObjectId,
    ref: "USER",
    required: true,
  },
  inviteCode: {
    type: String,
    default: "",
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  workers: {
    type: Number,
    default: 1,
    min: 1,
    max: 4, // maximum of 4 workers
  },
}, { timestamps: true });

const GROUP = model("GROUP", groupSchema);

export default GROUP;
