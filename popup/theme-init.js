// Set the theme before first paint so there's no flash of the wrong theme
// when a dark-mode user opens the popup. Must be an external file (not an
// inline <script>) because Manifest V3's default CSP (script-src 'self')
// blocks inline scripts in extension pages.
(function () {
  var stored = localStorage.getItem("ai-slop-theme");
  var theme = stored || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
})();
