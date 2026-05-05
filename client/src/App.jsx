import { useState, useEffect } from "react";
import axios from "axios";

const API = "https://teamtaskmanager-production-0bb8.up.railway.app";


const getAxios = () => {
  const token = localStorage.getItem("token");
  return axios.create({
    baseURL: API,
    headers: {
      // ✅ FIX: Must be "Bearer <token>", not just the raw token
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
};

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [projectName, setProjectName] = useState("");
  const [projectId, setProjectId] = useState(null);
  const [projects, setProjects] = useState([]);

  const [taskTitle, setTaskTitle] = useState("");
  const [tasks, setTasks] = useState([]);

  // ✅ Auto-login if token exists on page load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getAxios()
        .get("/api/auth/me")
        .then((res) => {
          setLoggedIn(true);
          setCurrentUser(res.data.user);
          loadProjects();
          loadTasks();
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
        });
    }
  }, []);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  // ── Auth ──────────────────────────────────────────────────────────

  const signup = async () => {
    if (!name || !email || !password) {
      return showMessage("Please fill in all fields", "error");
    }
    try {
      await axios.post(`${API}/api/auth/signup`, { name, email, password, role: "member" });
      showMessage("Account created! Please log in ✅");
      setIsLogin(true);
    } catch (err) {
      const msg = err.response?.data?.error || "Signup failed";
      showMessage(msg, "error");
    }
  };

  const login = async () => {
    if (!email || !password) return showMessage("Enter email and password", "error");
    try {
      const res = await axios.post(`${API}/api/auth/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user._id);
      setLoggedIn(true);
      setCurrentUser(res.data.user);
      showMessage(`Welcome back, ${res.data.user.name}! 👋`);
      loadProjects();
      loadTasks();
    } catch (err) {
      const msg = err.response?.data?.error || "Invalid credentials";
      showMessage(msg, "error");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setLoggedIn(false);
    setCurrentUser(null);
    setTasks([]);
    setProjects([]);
    setProjectId(null);
    showMessage("Logged out successfully");
  };

  // ── Projects ──────────────────────────────────────────────────────

  const loadProjects = async () => {
    try {
      const res = await getAxios().get("/api/projects");
      setProjects(res.data);
      if (res.data.length > 0 && !projectId) {
        setProjectId(res.data[0]._id);
      }
    } catch (err) {
      console.error("Failed to load projects:", err.response?.data);
    }
  };

  const createProject = async () => {
    if (!projectName.trim()) return showMessage("Enter a project name", "error");
    try {
      const res = await getAxios().post("/api/projects", { name: projectName, members: [] });
      setProjectId(res.data._id);
      setProjectName("");
      showMessage(`Project "${res.data.name}" created ✅`);
      loadProjects();
    } catch (err) {
      const msg = err.response?.data?.error || "Error creating project";
      showMessage(msg, "error");
    }
  };

  // ── Tasks ─────────────────────────────────────────────────────────

  const loadTasks = async () => {
    try {
      const res = await getAxios().get("/api/tasks");
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to load tasks:", err.response?.data);
    }
  };

  const createTask = async () => {
    if (!taskTitle.trim()) return showMessage("Enter a task title", "error");
    if (!projectId) return showMessage("Create or select a project first ⚠️", "error");
    try {
      await getAxios().post("/api/tasks", {
        title: taskTitle,
        projectId,
        assignedTo: localStorage.getItem("userId"),
      });
      setTaskTitle("");
      showMessage("Task created ✅");
      loadTasks();
    } catch (err) {
      const msg = err.response?.data?.error || "Error creating task";
      showMessage(msg, "error");
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await getAxios().patch(`/api/tasks/${taskId}`, { status });
      loadTasks();
    } catch (err) {
      showMessage("Failed to update task", "error");
    }
  };

  // ── Render ────────────────────────────────────────────────────────

  const STATUS_OPTIONS = ["todo", "in_progress", "review", "done"];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ borderBottom: "2px solid #6366f1", paddingBottom: 12, color: "#1e1b4b" }}>
        🗂️ Team Task Manager
      </h1>

      {/* Message */}
      {message.text && (
        <div style={{
          padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontWeight: 500,
          background: message.type === "error" ? "#fee2e2" : "#dcfce7",
          color: message.type === "error" ? "#dc2626" : "#16a34a",
          border: `1px solid ${message.type === "error" ? "#fca5a5" : "#86efac"}`,
        }}>
          {message.text}
        </div>
      )}

      {/* ── Auth ── */}
      {!loggedIn ? (
        <div style={{ maxWidth: 380 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button
              onClick={() => setIsLogin(true)}
              style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", cursor: "pointer",
                background: isLogin ? "#6366f1" : "#e5e7eb", color: isLogin ? "#fff" : "#374151", fontWeight: 600 }}>
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", cursor: "pointer",
                background: !isLogin ? "#6366f1" : "#e5e7eb", color: !isLogin ? "#fff" : "#374151", fontWeight: 600 }}>
              Sign Up
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {!isLogin && (
              <input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)}
                style={inputStyle} />
            )}
            <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              style={inputStyle} />
            <input placeholder="Password (min 6 chars)" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && (isLogin ? login() : signup())} />
            <button onClick={isLogin ? login : signup} style={btnStyle}>
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* User Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#f0f0ff", borderRadius: 10, padding: "10px 16px", marginBottom: 20 }}>
            <div>
              <strong>{currentUser?.name}</strong>
              <span style={{ marginLeft: 8, fontSize: 13, color: "#6b7280" }}>{currentUser?.email}</span>
              <span style={{ marginLeft: 8, background: "#6366f1", color: "#fff",
                borderRadius: 20, padding: "1px 10px", fontSize: 12, fontWeight: 600 }}>
                {currentUser?.role}
              </span>
            </div>
            <button onClick={logout} style={{ ...btnStyle, background: "#ef4444", padding: "6px 14px" }}>
              Logout
            </button>
          </div>

          {/* Projects */}
          <section style={sectionStyle}>
            <h2 style={sectionTitle}>📁 Projects</h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input placeholder="Project name" value={projectName}
                onChange={(e) => setProjectName(e.target.value)} style={{ ...inputStyle, flex: 1 }}
                onKeyDown={(e) => e.key === "Enter" && createProject()} />
              <button onClick={createProject} style={btnStyle}>Create</button>
            </div>
            {projects.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {projects.map((p) => (
                  <div key={p._id}
                    onClick={() => setProjectId(p._id)}
                    style={{
                      padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 14,
                      background: projectId === p._id ? "#6366f1" : "#e5e7eb",
                      color: projectId === p._id ? "#fff" : "#374151", fontWeight: 500,
                    }}>
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Tasks */}
          <section style={sectionStyle}>
            <h2 style={sectionTitle}>✅ Tasks</h2>
            {projectId ? (
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input placeholder="New task title" value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)} style={{ ...inputStyle, flex: 1 }}
                  onKeyDown={(e) => e.key === "Enter" && createTask()} />
                <button onClick={createTask} style={btnStyle}>Add Task</button>
              </div>
            ) : (
              <p style={{ color: "#9ca3af", marginBottom: 12 }}>Select or create a project first</p>
            )}

            {tasks.length === 0 ? (
              <p style={{ color: "#9ca3af" }}>No tasks yet. Create one above 👆</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tasks.map((task) => (
                  <div key={task._id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "#f9fafb", border: "1px solid #e5e7eb",
                    borderRadius: 8, padding: "10px 14px",
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{task.title}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        {task.projectId?.name || "Unknown project"} ·{" "}
                        {task.assignedTo?.name || "Unassigned"}
                      </div>
                    </div>
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                      style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #d1d5db",
                        fontSize: 13, background: statusColor(task.status), fontWeight: 500 }}>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

const statusColor = (status) => {
  switch (status) {
    case "done": return "#dcfce7";
    case "in_progress": return "#dbeafe";
    case "review": return "#fef9c3";
    default: return "#f3f4f6";
  }
};

const inputStyle = {
  padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db",
  fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
};

const btnStyle = {
  padding: "9px 18px", borderRadius: 8, border: "none",
  background: "#6366f1", color: "#fff", fontWeight: 600,
  cursor: "pointer", fontSize: 14, whiteSpace: "nowrap",
};

const sectionStyle = {
  background: "#fff", border: "1px solid #e5e7eb",
  borderRadius: 12, padding: "16px 20px", marginBottom: 16,
};

const sectionTitle = {
  margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "#1e1b4b",
};

export default App;
