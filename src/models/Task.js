import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: String,
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project"
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  status: {
    type: String,
    enum: ["todo", "in-progress", "done"],
    default: "todo"
  },
  dueDate: Date
}, { timestamps: true });

export default mongoose.model("Task", taskSchema);