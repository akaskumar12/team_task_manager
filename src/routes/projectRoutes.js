import express from "express";
import Project from "../models/Project.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All project routes require authentication
router.use(authenticate);

// GET /api/projects — get projects user owns or is member of
router.get("/", async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate("owner", "name email")
      .populate("members", "name email")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects — create project
router.post("/", async (req, res, next) => {
  try {
    const { name, description, members } = req.body;
    if (!name) return res.status(400).json({ error: "Project name is required" });

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: members || [],
    });

    await project.populate("owner", "name email");
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id
router.get("/:id", async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!project) return res.status(404).json({ error: "Project not found" });

    // Check access
    const isMember =
      project.owner._id.equals(req.user._id) ||
      project.members.some((m) => m._id.equals(req.user._id)) ||
      req.user.role === "admin";

    if (!isMember) return res.status(403).json({ error: "Access denied" });

    res.json(project);
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id — update project
router.put("/:id", async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const isOwner =
      project.owner.equals(req.user._id) || req.user.role === "admin";
    if (!isOwner) return res.status(403).json({ error: "Only owner can update project" });

    const { name, description, status, members } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (members) project.members = members;

    await project.save();
    await project.populate("owner", "name email");
    await project.populate("members", "name email");
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const isOwner =
      project.owner.equals(req.user._id) || req.user.role === "admin";
    if (!isOwner) return res.status(403).json({ error: "Only owner can delete project" });

    await project.deleteOne();
    res.json({ message: "Project deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;