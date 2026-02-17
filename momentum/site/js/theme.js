document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("theme-toggle");
  const html = document.documentElement;

  // Detect system preference if no theme is saved
  let savedTheme = localStorage.getItem("theme");
  if (!savedTheme) {
    savedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  html.setAttribute("data-theme", savedTheme);

  if (toggle) {
    const updateIcon = () => {
      const isDark = html.getAttribute("data-theme") === "dark";
      toggle.setAttribute("aria-pressed", isDark);
    };

    updateIcon();

    toggle.addEventListener("click", () => {
      const isDark = html.getAttribute("data-theme") === "dark";
      const newTheme = isDark ? "light" : "dark";
      html.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      updateIcon();
    });
  }
});
