// Year in footer
document.getElementById("year").textContent = new Date().getFullYear();

// Theme toggle (remembers choice, defaults to system preference)
const root = document.documentElement;
const themeBtn = document.getElementById("themeToggle");

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeBtn.textContent = theme === "dark" ? "☀️" : "🌙";
}

let saved = null;
try { saved = localStorage.getItem("theme"); } catch (e) {}
const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(saved || (prefersDark ? "dark" : "light"));

themeBtn.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem("theme", next); } catch (e) {}
});

// Mobile menu
const menuBtn = document.getElementById("menuBtn");
if (menuBtn) {
  const navLinks = document.getElementById("navLinks");
  menuBtn.addEventListener("click", () => navLinks.classList.toggle("open"));
  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => navLinks.classList.remove("open"))
  );
}
