import { useState } from "react";
import axios from "axios";

const API = "https://teamtaskmanager-production-da38.up.railway.app/";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState("");

  const [projectName, setProjectName] = useState("");
  const [projectId, setProjectId] = useState(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [tasks, setTasks] = useState([]);

  // SIGNUP
  const signup = async () => {
    try {
      await axios.post(`${API}/api/auth/signup`, {
        name,
        email,
        password,
        role: "admin"
      });

      setMessage(`Welcome ${name} 🎉 Your account has been created!`);
      setIsLogin(true);
    } catch (err) {
      setMessage("User may already exist ❌");
    }
  };

  // LOGIN
  const login = async () => {
    try {
      const res = await axios.post(`${API}/api/auth/login`, {
        email,
        password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user.id);

      setLoggedIn(true);
      setMessage("");
    } catch (err) {
      setMessage("Invalid credentials ❌");
    }
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setLoggedIn(false);
    setTasks([]);
    setProjectId(null);
  };

  // CREATE PROJECT
  const createProject = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API}/api/projects`,
        {
          name: projectName,
          members: []
        },
        {
          headers: {
            Authorization: token
          }
        }
      );

      setProjectId(res.data._id);
      alert("Project created ✅");
      setProjectName("");
    } catch (err) {
      alert("Error creating project ❌");
    }
  };

  // CREATE TASK
  const createTask = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!projectId) {
        alert("Create a project first ⚠️");
        return;
      }

      await axios.post(
        `${API}/api/tasks`,
        {
          title: taskTitle,
          projectId,
          assignedTo: userId
        },
        {
          headers: {
            Authorization: token
          }
        }
      );

      setTaskTitle("");
      getTasks();
    } catch (err) {
      alert("Error creating task ❌");
    }
  };

  // GET TASKS
  const getTasks = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/api/tasks`, {
        headers: {
          Authorization: token
        }
      });

      setTasks(res.data);
    } catch (err) {
      alert("Error fetching tasks ❌");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Team Task Manager</h1>

      {message && (
        <p style={{ color: "green", fontWeight: "bold" }}>{message}</p>
      )}

      {!loggedIn ? (
        <>
          <button onClick={() => setIsLogin(!isLogin)}>
            Switch to {isLogin ? "Signup" : "Login"}
          </button>

          <hr />

          {!isLogin ? (
            <div>
              <h2>Signup</h2>
              <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
              <br /><br />
              <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
              <br /><br />
              <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
              <br /><br />
              <button onClick={signup}>Signup</button>
            </div>
          ) : (
            <div>
              <h2>Login</h2>
              <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
              <br /><br />
              <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
              <br /><br />
              <button onClick={login}>Login</button>
            </div>
          )}
        </>
      ) : (
        <>
          <h2>Welcome, {email} 👋</h2>
          <button onClick={logout}>Logout</button>

          <hr />

          <h3>Create Project</h3>
          <input
            placeholder="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          <button onClick={createProject}>Create Project</button>

          <hr />

          <h3>Create Task</h3>
          <input
            placeholder="Task title"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />
          <button onClick={createTask}>Add Task</button>

          <hr />

          <h2>My Tasks</h2>
          <button onClick={getTasks}>Load Tasks</button>

          {tasks.length === 0 && <p>No tasks yet. Create one 👆</p>}

          {tasks.map((task) => (
            <p key={task._id}>
              {task.title} - {task.status}
            </p>
          ))}
        </>
      )}
    </div>
  );
}

export default App;