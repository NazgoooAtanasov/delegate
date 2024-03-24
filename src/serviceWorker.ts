chrome.runtime.onInstalled.addListener(async (_) => {
  try {
    await chrome.scripting.registerContentScripts([
      {
        id: "activityTracker",
        js: ["bundle/activityTracker.js"],
        persistAcrossSessions: true,
        matches: ["https://developer.chrome.com/*"],
        runAt: "document_end",
      },
    ]);
  } catch (err) {
    console.log("There was an error registering content scripts", err);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, _, tab) => {
  const chromeDeveloperUrl = "https://developer.chrome.com/";
  if (!tab.url?.includes(chromeDeveloperUrl)) {
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false,
    });
    return;
  }

  await chrome.sidePanel.setOptions({
    tabId,
    path: "sidepanel.html",
    enabled: true,
  });
});
