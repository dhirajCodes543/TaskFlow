import { Schema, model, Types } from "mongoose";

const userSchema = new Schema({
  uid: {
    type: String,
    required: true,
    unique: true, // Firebase UID
  },
  name: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  groups: [
    {
      type: Types.ObjectId,
      ref: "GROUP",
    },
  ],
  lastActive: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const USER = model("USER", userSchema);

export default USER;
