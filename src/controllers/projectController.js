import Project from "../models/Project.js";

export const createProject = async (req, res) => {
  try {
    const { name, members } = req.body;

    const project = await Project.create({
      name,
      members,
      createdBy: req.user.id
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      members: req.user.id
    });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};