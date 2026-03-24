/* ==============================
   LOAD DASHBOARD DATA
============================== */

async function loadDashboard() {
  try {
    const subjectRes = await fetch("/subjects", { credentials: "include" });
    const subjects = await subjectRes.json();

    const taskRes = await fetch("/schedule", { credentials: "include" });
    const tasks = await taskRes.json();

    // ✅ SAFE EXAMS FETCH (IMPORTANT FIX)
    let exams = [];
    try {
      const examRes = await fetch("/exams", { credentials: "include" });
      exams = await examRes.json();
    } catch {
      exams = [];
    }

    document.getElementById("totalSubjects").textContent = subjects.length;
    document.getElementById("totalTasks").textContent = tasks.length;

    const completed = tasks.filter(t => t.completed === 1).length;
    document.getElementById("completedTasks").textContent = completed;

    const today = new Date();
    const upcoming = exams.filter(e => new Date(e.exam_date) >= today);
    document.getElementById("upcomingExams").textContent = upcoming.length;

    let percent = 0;
    if (tasks.length > 0) {
      percent = Math.round((completed / tasks.length) * 100);
    }

    document.getElementById("progressBar").style.width = percent + "%";
    document.getElementById("progressPercent").textContent = percent + "%";

  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

/* ==============================
   TODAY TASKS
============================== */
async function loadTodayTasks() {
  const list = document.getElementById("todayTasks");
  list.innerHTML = "";

  try {
    const res = await fetch("/schedule", { credentials: "include" });
    const tasks = await res.json();

    // ✅ FIX: use LOCAL date (not ISO)
    const now = new Date();
    const today =
      now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0");

    console.log("TODAY:", today);
    console.log("TASKS:", tasks);

   const todayTasks = tasks.filter(t => new Date(t.due_date) >= new Date());

    if (todayTasks.length === 0) {
      list.innerHTML = "<li>No tasks for today</li>";
      return;
    }

    todayTasks.forEach(task => {
      const li = document.createElement("li");
      li.textContent = task.title + " (" + task.subject + ")";

      if (task.completed == 1) {
        li.classList.add("completed");
      }

      list.appendChild(li);
    });

  } catch (err) {
    console.error(err);
    list.innerHTML = "<li>Error loading tasks</li>";
  }
}

/* ==============================
   DEADLINE ALERT
============================== */

async function checkDeadlines() {
  const alertBox = document.getElementById("deadlineAlert");

  try {
    const res = await fetch("/schedule", { credentials: "include" });
    const tasks = await res.json();

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const todayStr = today.toISOString().split("T")[0];
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const urgent = tasks.find(t =>
      !t.completed &&
      (t.due_date === todayStr || t.due_date === tomorrowStr)
    );

    if (urgent) {
      alertBox.style.display = "block";

      if (urgent.due_date === todayStr) {
        alertBox.innerText = "⚠ " + urgent.title + " is due TODAY!";
      } else {
        alertBox.innerText = "⚠ " + urgent.title + " is due tomorrow!";
      }
    }

  } catch (err) {
    console.error(err);
  }
}

/* ==============================
   STUDY TIMER
============================== */

let startTime = Date.now();

function updateStudyTime() {
  let diff = Date.now() - startTime;

  let sec = Math.floor(diff / 1000) % 60;
  let min = Math.floor(diff / 60000) % 60;
  let hr = Math.floor(diff / 3600000);

  document.getElementById("studyTime").innerText =
    `${hr}h ${min}m ${sec}s`;
}

setInterval(updateStudyTime, 1000);

/* ==============================
   DARK MODE (FIXED)
============================== */

const toggleBtn = document.getElementById("themeToggle");

// ✅ FIX: use same key everywhere
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark-mode");
  toggleBtn.textContent = "☀️";
}

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  if (document.body.classList.contains("dark-mode")) {
    toggleBtn.textContent = "☀️";
    localStorage.setItem("darkMode", "true");
  } else {
    toggleBtn.textContent = "🌙";
    localStorage.setItem("darkMode", "false");
  }
});

/* ==============================
   LOGOUT
============================== */

function logout() {
  window.location.href = "/logout";
}

/* ==============================
   PAGE LOAD
============================== */

window.onload = () => {
  loadDashboard();
  loadTodayTasks();
  checkDeadlines();
};
// QUICK ACTIONS MODALS
const addTaskModal = new bootstrap.Modal(document.getElementById('addTaskModal'));
const viewStatsModal = new bootstrap.Modal(document.getElementById('viewStatsModal'));

// Open Add Task Modal
document.getElementById('openAddTaskBtn').addEventListener('click', () => {
  addTaskModal.show();
});

// Open View Stats Modal
document.getElementById('openViewStatsBtn').addEventListener('click', async () => {
  // Optional: Load stats dynamically
  const res = await fetch("/schedule", { credentials: "include" });
  const tasks = await res.json();
  const completed = tasks.filter(t => t.completed === 1).length;
  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  document.getElementById('statsText').innerHTML = `
    Total Tasks: ${tasks.length}<br>
    Completed Tasks: ${completed}<br>
    Overall Progress: ${percent}%
  `;

  viewStatsModal.show();
});