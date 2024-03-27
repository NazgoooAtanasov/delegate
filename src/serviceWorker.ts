import { EventHandler } from "./serviceWorkerUtils";
import { AddActivity, AddURLPermission, GetURLPermissions, RemoveURLPermission } from "./serviceWorkerUtils/eventHandler";

let eventHandler: EventHandler | null = null;

chrome.tabs.onUpdated.addListener(async (_, changeInfo, tab) => {
  if (changeInfo.status !== "loading") return;

  if (!eventHandler) {
    try {
      eventHandler = new EventHandler();
      await eventHandler.initialize();
    } catch (err) {
      console.error("There was an error initializing the event handler", err);
    }
  }

  const url = tab.url!;
  let permission: { id: number; url: string } | undefined = undefined;

  try {
    const urlOjb = new URL(url);
    const result = await eventHandler?.getURLPermission({ eventName: "getURLPermission", url: urlOjb.hostname });

    if (result?.error) {
      console.error("There was an error getting the permission", result.error);
      return;
    }

    permission = result?.data;
  } catch (err) {
    console.error("There was an error getting the permission", err);
  }

  if (permission) {
    try {
      const activeScripts = await chrome.scripting.getRegisteredContentScripts();
      if (!activeScripts.find((script) => script.id === "activityTracker")) {
        await chrome.scripting.registerContentScripts([
          {
            id: "activityTracker",
            js: ["bundle/activityTracker.js"],
            persistAcrossSessions: true,
            matches: ["https://*/*"],
            runAt: "document_end",
          },
        ]);
      }
    } catch (err) {
      console.error("There was an error registering content scripts", err);
    }
  }
});

chrome.runtime.onInstalled.addListener(async (_) => {
  if (!eventHandler) {
    try {
      eventHandler = new EventHandler();
      await eventHandler.initialize();
    } catch (err) {
      console.error("There was an error initializing the event handler", err);
    }
  }
});

chrome.tabs.onUpdated.addListener(async (tabId) => {
  await chrome.sidePanel.setOptions({
    tabId,
    path: "sidepanel.html",
    enabled: true,
  });
});

chrome.runtime.onMessage.addListener(
  (message: AddURLPermission | GetURLPermissions | RemoveURLPermission | AddActivity, _, sendResponse) => {
    if (
      message.eventName !== "getURLPermissions" &&
      message.eventName !== "addURLPermission" &&
      message.eventName !== "removeURLPermission" &&
      message.eventName !== "addActivity"
    ) {
      return false;
    }

    if (message.eventName === "addURLPermission") {
      eventHandler
        ?.addURLPermission(message)
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse(err));
      return true;
    }

    if (message.eventName === "getURLPermissions") {
      eventHandler
        ?.getURLPermissions(message)
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse(err));
      return true;
    }

    if (message.eventName === "removeURLPermission") {
      eventHandler
        ?.removeURLPermission(message)
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse(err));
      return true;
    }

    if (message.eventName === "addActivity") {
      eventHandler
        ?.addActivity(message)
        .then((result) => {
          // @FIXME: this is not perfomant, ples fix fast
          chrome.runtime.sendMessage({ eventName: "activityAdded", ...result.data });
          sendResponse(result);
        })
        .catch((err) => sendResponse(err));
      return true;
    }
  },
);
