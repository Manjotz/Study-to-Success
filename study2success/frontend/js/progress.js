/* ===== SELECT ELEMENTS ===== */
const userNameEl = document.getElementById("userName");
const avatarEl = document.getElementById("userAvatar");
const progressPercentEl = document.getElementById("progressPercent");
const mainProgressBar = document.getElementById("mainProgressBar");
const moduleCountEl = document.getElementById("moduleCount");
const summaryCountEl = document.getElementById("summaryCount");
const moduleProgressEl = document.getElementById("moduleProgress");
const studyHoursEl = document.getElementById("studyHours");
const streakDaysEl = document.getElementById("streakDays");

/* ===== DARK MODE ===== */
const toggleBtn = document.getElementById("themeToggle");
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    toggleBtn.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
  });
}
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark-mode");
}

/* ===== FETCH USER INFO ===== */
async function loadUser() {
  try {
    const res = await fetch("/profile"); // fetch user info from backend
    const user = await res.json();

    if (user.username) {
      userNameEl.textContent = user.username;
      avatarEl.textContent = user.username
        .split(" ")
        .map(w => w[0])
        .join("")
        .toUpperCase();
    }
  } catch (err) {
    console.error("Failed to fetch user info", err);
  }
}

/* ===== FETCH TASKS ===== */
async function getTasks() {
  try {
    const res = await fetch("/schedule"); // fetch all tasks for logged-in user
    const tasks = await res.json();
    return tasks;
  } catch (err) {
    console.error("Failed to fetch tasks:", err);
    return [];
  }
}

/* ===== UPDATE PROGRESS UI ===== */
async function updateProgress() {
  const tasks = await getTasks();
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;

  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Overall progress
  progressPercentEl.textContent = percent + "%";
  mainProgressBar.style.width = percent + "%";

  // Module count
  moduleCountEl.textContent = `${completed} / ${total}`;
  summaryCountEl.textContent = `${completed} of ${total} modules`;
  moduleProgressEl.style.width = percent + "%";

  // Study hours (example: 1 task = 1 hour)
  studyHoursEl.textContent = `${total} hrs`;

  // Current streak (example: consecutive completed tasks)
  streakDaysEl.textContent = `${completed} Days`;

  // Success box styling
  const successBox = document.querySelector(".success-box");
  successBox.style.borderLeft = percent >= 70 ? "5px solid #22c55e" : "5px solid #ef4444";
}

/* ===== INIT PAGE ===== */
document.addEventListener("DOMContentLoaded", async () => {
  await loadUser();       // fetch logged-in user info
  await updateProgress(); // fetch tasks and update progress
});