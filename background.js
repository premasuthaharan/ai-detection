/**
 * Keeps the toolbar badge honest: a score computed for one page shouldn't
 * linger and be misread as applying to whatever the user navigates to next.
 * Clears the per-tab badge as soon as that tab starts a new navigation.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    chrome.action.setBadgeText({ tabId, text: "" });
  }
});
