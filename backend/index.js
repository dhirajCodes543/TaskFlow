import express from "express";
import http from 'http';
import dotenv from "dotenv";
import { Server } from "socket.io";
import authenticateFirebaseToken from "./middleware/authMiddleware.js";
import mongoose from "mongoose";
import userRouter from "./routers/signup.js";
import createGroupRouter from "./routers/groupCreation.js";
import getAllGroup from "./routers/getAllGroups.js";
import joinGroup from "./routers/joinOtherGroup.js";
import getMembers from "./routers/getMembers.js";
import getGroupThings from "./routers/getGroupThings.js"
import cors from 'cors'
import "./JobHandler/addJobToQueue.js"
import "./queue.js"
import groupSocketHandler from "./socket/groupSocketHandler.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 9000;

const server = http.createServer(app);

app.use(cors({
  origin: "https://1taskflow.netlify.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


const io = new Server(server, {
  cors: {
    origin: "https://1taskflow.netlify.app", // replace with your frontend URL in production
    methods: ["GET", "POST"]
  }
});

mongoose.connect(process.env.MONGO_DB)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.use(express.json());
app.use(authenticateFirebaseToken);

app.use("/api/user", userRouter);  
app.use("/api/newGroup", createGroupRouter);
app.use("/api/group", getAllGroup);
app.use("/api/otherGroup", joinGroup(io));
app.use("/api/member", getMembers);
app.use("/api/chat/chats", getGroupThings);
app.use("/api/get", getGroupThings);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  groupSocketHandler(socket, io);
});

// Only server.listen
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
