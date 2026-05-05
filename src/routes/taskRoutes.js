import express from "express";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

// GET /api/tasks — get tasks for projects user belongs to
router.get("/", async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).select("_id");

    const projectIds = projects.map((p) => p._id);

    const tasks = await Task.find({ projectId: { $in: projectIds } })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("projectId", "name")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks
router.post("/", async (req, res, next) => {
  try {
    const { title, description, projectId, assignedTo, priority, dueDate, status } = req.body;

    if (!title) return res.status(400).json({ error: "Task title is required" });
    if (!projectId) return res.status(400).json({ error: "projectId is required" });

    // Verify user has access to this project
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const hasAccess =
      project.owner.equals(req.user._id) ||
      project.members.some((m) => m.equals(req.user._id)) ||
      req.user.role === "admin";

    if (!hasAccess) return res.status(403).json({ error: "Access denied to this project" });

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo: assignedTo || req.user._id,
      createdBy: req.user._id,
      priority: priority || "medium",
      dueDate,
      status: status || "todo",
    });

    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");
    await task.populate("projectId", "name");

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id
router.get("/:id", async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("projectId", "name");

    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id — update status or other fields
router.patch("/:id", async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const allowed = ["title", "description", "status", "priority", "assignedTo", "dueDate"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    await task.save();
    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");
    await task.populate("projectId", "name");
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const canDelete =
      task.createdBy.equals(req.user._id) || req.user.role === "admin";
    if (!canDelete) return res.status(403).json({ error: "Only creator or admin can delete tasks" });

    await task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
