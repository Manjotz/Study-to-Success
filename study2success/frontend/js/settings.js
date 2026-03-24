// ==========================
// SETTINGS.JS
// ==========================

// Load profile & dark mode on page load
window.addEventListener("DOMContentLoaded", async () => {
  // Load profile
  try {
    const res = await fetch("/profile", { credentials: "include" });
    const data = await res.json();

    if (data) {
      document.getElementById("studentName").value = data.username || "";
      document.getElementById("studentEmail").value = data.email || "";
    }
  } catch (err) {
    console.error("Failed to load profile:", err);
  }

  // Load dark mode preference from localStorage
  const darkModePref = localStorage.getItem("darkMode") === "true";
  const darkModeCheckbox = document.getElementById("darkMode");
  darkModeCheckbox.checked = darkModePref;
  if (darkModePref) document.body.classList.add("dark-mode");
});

// ==========================
// UPDATE PROFILE
// ==========================
document.getElementById("profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("studentName").value.trim();
  const email = document.getElementById("studentEmail").value.trim();

  try {
    const res = await fetch("/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, email })
    });

    const data = await res.json();

    if (data.success) {
      alert("✅ Profile updated!");
    } else {
      alert("❌ Update failed: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    alert("❌ Network error");
  }
});

// ==========================
// LOGOUT
// ==========================
function logout() {
  window.location.href = "/logout";
}

// ==========================
// SAVE APP SETTINGS
// ==========================
function saveAppSettings() {
  const darkMode = document.getElementById("darkMode").checked;

  // Add/remove dark mode class
  if (darkMode) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }

  // Save preference in localStorage
  localStorage.setItem("darkMode", darkMode);

  alert(`Preferences saved!\nDark Mode: ${darkMode}`);
}