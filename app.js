const localTime = document.querySelector("#local-time");

function updateLocalTime() {
  if (!localTime) return;
  localTime.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

updateLocalTime();
window.setInterval(updateLocalTime, 30_000);
