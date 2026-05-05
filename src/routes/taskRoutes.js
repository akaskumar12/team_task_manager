import express from "express";
import { createTask, getTasks, updateTask } from "../controllers/taskController.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin creates task
router.post("/", verifyToken, isAdmin, createTask);

// Logged-in users see their tasks
router.get("/", verifyToken, getTasks);

// Update task status
router.put("/:id", verifyToken, updateTask);

export default router;