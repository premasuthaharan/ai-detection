const CIRCUMFERENCE = 2 * Math.PI * 54; // matches r=54 in popup.html

const els = {
  loading: document.getElementById("state-loading"),
  error: document.getElementById("state-error"),
  errorMessage: document.getElementById("error-message"),
  result: document.getElementById("state-result"),
  gaugeProgress: document.getElementById("gauge-progress"),
  scoreNumber: document.getElementById("score-number"),
  tierLabel: document.getElementById("tier-label"),
  reasonsList: document.getElementById("reasons-list"),
  noReasons: document.getElementById("no-reasons"),
  rescanBtn: document.getElementById("rescan-btn"),
  shareBtn: document.getElementById("share-btn"),
};

let lastResult = null; // { score, tier, hostname } — for the "Copy result" button

function showState(name) {
  for (const key of ["loading", "error", "result"]) {
    els[key].classList.toggle("hidden", key !== name);
  }
}

function isScannableUrl(url) {
  return !!url && /^https?:\/\//.test(url);
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function collectRawSignals(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content/collector.js"],
  });
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => window.__AI_SLOP_RAW__,
  });
  return result;
}

function renderResult({ score, tier, reasons, hostname }) {
  lastResult = { score, tier, hostname };
  els.scoreNumber.textContent = String(score);
  els.scoreNumber.style.color = tier.color;
  els.tierLabel.textContent = tier.label;
  els.tierLabel.style.color = tier.color;

  const offset = CIRCUMFERENCE * (1 - score / 100);
  // Force layout so the transition animates from full offset instead of jumping.
  els.gaugeProgress.style.strokeDashoffset = String(CIRCUMFERENCE);
  requestAnimationFrame(() => {
    els.gaugeProgress.style.strokeDashoffset = String(offset);
  });

  els.reasonsList.innerHTML = "";
  if (reasons.length === 0) {
    els.noReasons.classList.remove("hidden");
  } else {
    els.noReasons.classList.add("hidden");
    for (const reason of reasons) {
      const li = document.createElement("li");
      const text = document.createElement("span");
      text.className = "reason-text";
      text.textContent = reason.text;
      const weight = document.createElement("span");
      weight.className = "reason-weight";
      weight.textContent = `+${reason.contribution}`;
      li.appendChild(text);
      li.appendChild(weight);
      els.reasonsList.appendChild(li);
    }
  }

  showState("result");
}

function setBadge(tabId, score, color) {
  chrome.action.setBadgeText({ tabId, text: String(score) });
  chrome.action.setBadgeBackgroundColor({ tabId, color });
}

async function runAnalysis() {
  showState("loading");
  try {
    const tab = await getActiveTab();
    if (!tab || !isScannableUrl(tab.url)) {
      els.errorMessage.textContent = "This page can't be analyzed (browser or extension pages are off-limits).";
      showState("error");
      return;
    }

    const raw = await collectRawSignals(tab.id);
    const { computeScore } = window.AISlopScoring;
    const { score, tier, reasons } = computeScore(raw);
    const hostname = (() => {
      try {
        return new URL(tab.url).hostname;
      } catch {
        return "This page";
      }
    })();

    renderResult({ score, tier, reasons, hostname });
    setBadge(tab.id, score, tier.color);
  } catch (err) {
    els.errorMessage.textContent = "Couldn't scan this page. It may be a restricted browser page.";
    showState("error");
    console.error("AI Slop Detector analysis failed:", err);
  }
}

async function copyShareText() {
  if (!lastResult) return;
  const { score, tier, hostname } = lastResult;
  const text = `${hostname} scores ${score}/100 for looking AI-generated (${tier.label}) — checked with AI Slop Detector.`;
  try {
    await navigator.clipboard.writeText(text);
    const original = els.shareBtn.textContent;
    els.shareBtn.textContent = "Copied!";
    setTimeout(() => {
      els.shareBtn.textContent = original;
    }, 1500);
  } catch (err) {
    console.error("AI Slop Detector: couldn't copy to clipboard:", err);
  }
}

els.rescanBtn.addEventListener("click", runAnalysis);
els.shareBtn.addEventListener("click", copyShareText);
document.addEventListener("DOMContentLoaded", runAnalysis);
runAnalysis();
