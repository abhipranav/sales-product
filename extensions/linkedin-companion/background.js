// Service worker: Manages extension badge state and provides communication bridge

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: "#FFFF00" });
  chrome.action.setBadgeTextColor({ color: "#111111" });
});

// Update badge when tab changes to LinkedIn
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const isLinkedIn = /linkedin\.com\/(in|company)\//i.test(tab.url);
    chrome.action.setBadgeText({
      text: isLinkedIn ? "●" : "",
      tabId: tab.id
    });
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      const isLinkedIn = /linkedin\.com\/(in|company)\//i.test(tab.url);
      chrome.action.setBadgeText({
        text: isLinkedIn ? "●" : "",
        tabId: tab.id
      });
    }
  } catch {
    // Tab may have closed
  }
});
