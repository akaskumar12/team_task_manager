import express from "express";
import { createProject, getProjects } from "../controllers/projectController.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin only
router.post("/", verifyToken, isAdmin, createProject);

// All logged-in users
router.get("/", verifyToken, getProjects);

export default router;