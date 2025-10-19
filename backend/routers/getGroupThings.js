import { Router } from "express";
import { getChats } from "../controllers/getChats.js";
import { getJobs } from "../controllers/getJobs.js";

const router = Router();

router.get("/:groupId",getChats);
router.get("/jobs/:groupId",getJobs);

export default router;