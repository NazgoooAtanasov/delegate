chrome.runtime.onInstalled.addListener(async (_) => {
  try {
    await chrome.scripting.registerContentScripts([
      {
        id: "activityTracker",
        js: ["bundle/activityTracker.js"],
        persistAcrossSessions: true,
        matches: ["https://*/*"],
        runAt: "document_end",
      },
    ]);
  } catch (err) {
    console.log("There was an error registering content scripts", err);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId) => {
  await chrome.sidePanel.setOptions({
    tabId,
    path: "sidepanel.html",
    enabled: true,
  });
});
