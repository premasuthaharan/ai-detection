const fs = require("fs");

const DEFAULT_CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];

function resolveChromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const found = DEFAULT_CHROME_PATHS.find((p) => fs.existsSync(p));
  if (!found) {
    console.error("Couldn't find a local Chrome install. Set CHROME_PATH and re-run.");
    process.exit(1);
  }
  return found;
}

module.exports = { resolveChromePath };
