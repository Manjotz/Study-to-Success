/* ==============================
   SHOW LOGGED IN USER
============================== */

const studentName = localStorage.getItem("loggedInUser");

if (studentName) {
  document.getElementById("studentName").textContent = studentName;
}

/* ==============================
   GLOBAL DATA
============================== */

let tasks = [];
let exams = [];
let currentDate = new Date();

/* ==============================
   LOAD TASKS + EXAMS
============================== */

async function loadEvents() {

  /* Render calendar first */
  renderCalendar();

  try {

    /* GET TASKS */
    const taskRes = await fetch("/schedule");
    tasks = await taskRes.json();

    /* GET EXAMS */
    const examRes = await fetch("/exams");
    exams = await examRes.json();

    /* Render again after loading events */
    renderCalendar();

  } catch (err) {

    console.error("Error loading events:", err);

  }

}
async function loadUser() {
  try {
    const res = await fetch("/profile");
    const user = await res.json();

    if (!user || !user.username) return;

    // Show username
    document.getElementById("studentName").textContent = user.username;

    // Create avatar initials
    const initials = user.username
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();

    document.querySelector(".avatar").textContent = initials;

  } catch (err) {
    console.error("User load error:", err);
  }
}

loadUser();

/* ==============================
   RENDER CALENDAR
============================== */

function renderCalendar() {

  const calendarDays = document.getElementById("calendarDays");
  const calendarTitle = document.getElementById("calendarTitle");

  calendarDays.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  calendarTitle.textContent = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  /* Empty boxes before month starts */

  for (let i = 0; i < firstDay; i++) {

    const empty = document.createElement("div");
    empty.className = "day-box muted";

    calendarDays.appendChild(empty);

  }

  /* Calendar days */

  for (let day = 1; day <= totalDays; day++) {

    const box = document.createElement("div");
    box.className = "day-box";

    const today = new Date();

    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {

      box.classList.add("today");

    }

    const dateStr =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    box.innerHTML = `<strong>${day}</strong>`;

    /* =========================
       TASK EVENTS
    ========================= */

    tasks.forEach(task => {

      if (task.due_date === dateStr) {

        const e = document.createElement("div");

        e.className = "event task";
        e.innerHTML = `📚 ${task.title}`;

        box.appendChild(e);

      }

    });

    /* =========================
       EXAM EVENTS
    ========================= */

    exams.forEach(exam => {

      if (exam.exam_date === dateStr) {

        const e = document.createElement("div");

        e.className = "event exam";
        e.innerHTML = `📝 ${exam.subject}`;

        box.appendChild(e);

      }

    });

    calendarDays.appendChild(box);

  }

}

/* ==============================
   MONTH CONTROLS
============================== */

document.getElementById("prevMonth").onclick = () => {

  currentDate.setMonth(currentDate.getMonth() - 1);

  renderCalendar();

};

document.getElementById("nextMonth").onclick = () => {

  currentDate.setMonth(currentDate.getMonth() + 1);

  renderCalendar();

};


/* ==============================
   DARK MODE
============================== */

if (localStorage.getItem("darkMode") === "true") {

  document.body.classList.add("dark-mode");

}


/* ==============================
   PAGE LOAD
============================== */

window.onload = loadEvents;