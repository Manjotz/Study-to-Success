const userNameEl = document.getElementById("userName");
const avatarEl = document.getElementById("userAvatar");
const loggedUser = localStorage.getItem("loggedInUser");

if (loggedUser) {
  userNameEl.textContent = loggedUser;

  const initials = loggedUser
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase();

  avatarEl.textContent = initials;
}
// If not logged, just show default name/avatar
