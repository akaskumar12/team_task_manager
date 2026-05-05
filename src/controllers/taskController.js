import Task from "../models/Task.js";

// Admin creates task
export const createTask = async (req, res) => {
  try {
    const { title, projectId, assignedTo, dueDate } = req.body;

    const task = await Task.create({
      title,
      projectId,
      assignedTo,
      dueDate
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get tasks for logged-in user
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.user.id
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update status
export const updateTask = async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};