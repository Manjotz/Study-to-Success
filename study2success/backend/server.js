/* =====================================================
   IMPORT MODULES
===================================================== */
const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const path = require("path");
const sqlite3 = require("sqlite3").verbose(); // ✅ FIXED

const app = express();
const PORT = process.env.PORT || 3000;

/* =====================================================
   DATABASE (LOCAL + RENDER SAFE)
===================================================== */

// Detect environment
const isRender = process.env.RENDER === "true";

// Correct DB path
const dbPath = isRender
  ? "/data/study.db"                    // Render
  : path.join(__dirname, "database.db"); // Local

console.log("Using DB path:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ DB Error:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

/* =====================================================
   MIDDLEWARE
===================================================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

/* SESSION */
app.use(
  session({
    store: new SQLiteStore({
      db: "sessions.db",
      dir: isRender ? "/data" : "./"
    }),
    secret: "study2success-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true
    }
  })
);

/* =====================================================
   DATABASE TABLES
===================================================== */

db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  email TEXT UNIQUE,
  password TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  desc TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  subject_id INTEGER,
  completed INTEGER DEFAULT 0,
  due_date TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  subject TEXT NOT NULL,
  exam_date TEXT,
  exam_time TEXT,
  location TEXT
)`);

/* =====================================================
   AUTH ROUTES
===================================================== */

// REGISTER
app.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  db.run(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, password],
    function (err) {
      if (err) {
        console.error(err);
        if (err.message.includes("UNIQUE")) {
          return res.json({ success: false, message: "Email already exists" });
        }
        return res.json({ success: false });
      }
      res.json({ success: true });
    }
  );
});

// LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, user) => {
      if (err) {
        console.error(err);
        return res.json({ success: false });
      }

      if (user) {
        req.session.user = user;
        console.log("✅ Logged in:", user.id);
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    }
  );
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login.html"));
});


/* =====================================================
   AUTH MIDDLEWARE
===================================================== */
function isAuth(req, res, next) {
  if (!req.session.user) return res.redirect("/login.html");
  next();
}
/* PROFILE ROUTES */
app.get("/profile", (req, res) => {
  if (!req.session.user) return res.json(null);

  const { id } = req.session.user;
  db.get("SELECT username, email FROM users WHERE id = ?", [id], (err, row) => {
    if (err || !row) return res.json(null);
    res.json(row);
  });
});

app.put("/profile", (req, res) => {
  if (!req.session.user) return res.json({ success: false });

  const { username, email } = req.body;
  const { id } = req.session.user;

  db.run(
    "UPDATE users SET username = ?, email = ? WHERE id = ?",
    [username, email, id],
    function(err) {
      if (err) {
        console.error(err);
        if (err.message.includes("UNIQUE")) {
          return res.json({ success: false, message: "Email already exists" });
        }
        return res.json({ success: false });
      }

      // Update session data
      req.session.user.username = username;
      req.session.user.email = email;

      res.json({ success: true });
    }
  );
});

/* =====================================================
   PROTECTED PAGES
===================================================== */
app.get("/dashboard.html", isAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dashboard.html"));
});

app.get("/schedule.html", isAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/schedule.html"));
});

/* =====================================================
   SUBJECT ROUTES
===================================================== */

app.post("/subjects", (req, res) => {
  if (!req.session.user) return res.json({ success: false });

  const { name, desc = "" } = req.body;

  db.run(
    "INSERT INTO subjects (user_id, name, desc) VALUES (?, ?, ?)",
    [req.session.user.id, name, desc],
    () => res.json({ success: true })
  );
});

app.get("/subjects", (req, res) => {
  if (!req.session.user) return res.json([]);

  db.all(
    "SELECT * FROM subjects WHERE user_id = ?",
    [req.session.user.id],
    (err, rows) => res.json(rows || [])
  );
});
/* ================= UPDATE SUBJECT ================= */
app.put("/subjects/:id", (req, res) => {
  if (!req.session.user) return res.json({ success: false, message: "Unauthorized" });

  const { id } = req.params;
  const { name, desc } = req.body;

  db.run(
    "UPDATE subjects SET name = ?, desc = ? WHERE id = ? AND user_id = ?",
    [name, desc, id, req.session.user.id],
    function(err) {
      if (err) {
        console.error(err);
        return res.json({ success: false, message: "Failed to update subject" });
      }
      res.json({ success: true });
    }
  );
});

/* ================= DELETE SUBJECT ================= */
app.delete("/subjects/:id", (req, res) => {
  if (!req.session.user) return res.json({ success: false, message: "Unauthorized" });

  const { id } = req.params;

  db.run(
    "DELETE FROM subjects WHERE id = ? AND user_id = ?",
    [id, req.session.user.id],
    function(err) {
      if (err) {
        console.error(err);
        return res.json({ success: false, message: "Failed to delete subject" });
      }
      res.json({ success: true });
    }
  );
});

/* =====================================================
   TASK ROUTES
===================================================== */

app.get("/tasks/:subjectId", (req, res) => {
  if (!req.session.user) return res.json([]);

  db.all(
    "SELECT * FROM tasks WHERE user_id = ? AND subject_id = ? ORDER BY due_date ASC",
    [req.session.user.id, req.params.subjectId],
    (err, rows) => res.json(rows || [])
  );
});

app.post("/tasks", (req, res) => {
  if (!req.session.user) return res.json({ success: false });

  const { title, subjectId, dueDate } = req.body;

  db.run(
    "INSERT INTO tasks (user_id, title, subject_id, due_date) VALUES (?, ?, ?, ?)",
    [req.session.user.id, title, subjectId, dueDate],
    () => res.json({ success: true })
  );
});

app.put("/tasks/toggle/:id", (req, res) => {
  if (!req.session.user) return res.json({ success: false });

  db.get(
    "SELECT completed FROM tasks WHERE id = ? AND user_id = ?",
    [req.params.id, req.session.user.id],
    (err, row) => {
      if (!row) return res.json({ success: false });

      const newStatus = row.completed ? 0 : 1;

      db.run(
        "UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?",
        [newStatus, req.params.id, req.session.user.id],
        () => res.json({ success: true })
      );
    }
  );
});

app.delete("/tasks/:id", (req, res) => {
  if (!req.session.user) return res.json({ success: false });

  db.run(
    "DELETE FROM tasks WHERE id = ? AND user_id = ?",
    [req.params.id, req.session.user.id],
    () => res.json({ success: true })
  );
});
/* =====================================================
   EXAMS ROUTES
===================================================== */

app.get("/exams", (req, res) => {
  if (!req.session.user) return res.json([]);

  db.all(
    "SELECT * FROM exams WHERE user_id = ?",
    [req.session.user.id],
    (err, rows) => {
      if (err) return res.json([]);
      res.json(rows || []);
    }
  );
});

app.post("/exams", (req, res) => {
  if (!req.session.user) return res.json({ success: false });

  const { subject, exam_date, exam_time, location } = req.body;

  db.run(
    "INSERT INTO exams (user_id, subject, exam_date, exam_time, location) VALUES (?, ?, ?, ?, ?)",
    [req.session.user.id, subject, exam_date, exam_time, location],
    () => res.json({ success: true })
  );
});

/* ================= UPDATE EXAM ================= */
app.put("/exams/:id", (req, res) => {
  if (!req.session.user) return res.json({ success: false });

  const { id } = req.params;
  const { subject, exam_date, exam_time, location } = req.body;

  db.run(
    "UPDATE exams SET subject = ?, exam_date = ?, exam_time = ?, location = ? WHERE id = ? AND user_id = ?",
    [subject, exam_date, exam_time, location, id, req.session.user.id],
    function(err) {
      if (err) {
        console.error(err);
        return res.json({ success: false, message: "Failed to update exam" });
      }
      res.json({ success: true });
    }
  );
});

/* ================= DELETE EXAM ================= */
app.delete("/exams/:id", (req, res) => {
  if (!req.session.user) return res.json({ success: false });

  const { id } = req.params;

  db.run(
    "DELETE FROM exams WHERE id = ? AND user_id = ?",
    [id, req.session.user.id],
    function(err) {
      if (err) {
        console.error(err);
        return res.json({ success: false, message: "Failed to delete exam" });
      }
      res.json({ success: true });
    }
  );
});
/* =====================================================
   SCHEDULE
===================================================== */

app.get("/schedule", (req, res) => {
  if (!req.session.user) return res.json([]);

  db.all(
    `SELECT tasks.*, subjects.name AS subject
     FROM tasks
     JOIN subjects ON tasks.subject_id = subjects.id
     WHERE tasks.user_id = ?
     ORDER BY tasks.due_date ASC`,
    [req.session.user.id],
    (err, rows) => res.json(rows || [])
  );
});

/* =====================================================
   STATIC FILES
===================================================== */
app.use(express.static(path.join(__dirname, "../frontend")));

/* =====================================================
   START SERVER
===================================================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});