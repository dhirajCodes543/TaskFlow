import { Schema, model, Types } from "mongoose";

const chatSchema = new Schema({
  groupId: {
    type: Types.ObjectId,
    ref: "GROUP", // reference to the group
    required: true,
  },
  senderId: {
    type: Types.ObjectId,
    ref: "USER", // reference to the user sending the message
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const CHAT = model("CHAT", chatSchema);

export default CHAT;
