import { EventHandler } from "./serviceWorkerUtils";
import {
  AddActivity,
  AddURLPermission,
  GetActivites,
  GetURLPermissions,
  RemoveActivities,
  RemoveActivity,
  RemoveURLPermission,
  UpdateActivity,
} from "./serviceWorkerUtils/eventHandler";
import { resultAsync } from "./utils";

let eventHandler: EventHandler | null = null;
(async () => {
  try {
    eventHandler = new EventHandler();
    await eventHandler.initialize();
  } catch (err) {
    console.error("There was an error initializing the event handler", err);
  }
})();

function closeSidePanel(id: number | undefined = undefined) {
  chrome.sidePanel.setOptions({
    tabId: id,
    enabled: false,
  });
}

chrome.tabs.onActivated.addListener(async (tab) => {
  const tabs = await resultAsync(
    chrome.tabs.query({
      active: true,
      windowId: tab.windowId,
    }),
    "resultfiy",
  );

  if (tabs.error) {
    console.error("There was an error getting the current tab", tabs.error);
    closeSidePanel();
    return;
  }

  const [currentTab] = tabs.data ?? [];
  if (!currentTab) {
    console.error("There is no active tab");
    closeSidePanel();
    return;
  }

  if (currentTab.id !== tab.tabId || !currentTab.url) {
    closeSidePanel(currentTab.id);
    return;
  }

  const permission = await eventHandler?.getURLPermission({ eventName: "getURLPermission", url: new URL(currentTab.url).hostname });
  if (permission?.error) {
    console.error("There was an error getting the permission", permission.error);
    closeSidePanel(currentTab.id);
    return;
  }

  if (!permission?.data) {
    closeSidePanel(currentTab.id);
  }
});

chrome.tabs.onUpdated.addListener(async (_, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;

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
  let permissions: { id: number; url: string }[] = [];

  try {
    const urlOjb = new URL(url);
    const result = await eventHandler?.getURLPermissions({ eventName: "getURLPermissions" });

    if (result?.error) {
      console.error("There was an error getting the permission", result.error);
      return;
    }

    permission = result?.data?.find((permission) => permission.url === urlOjb.hostname);
    permissions = result?.data || [];
  } catch (err) {
    console.error("There was an error getting the permission", err);
  }

  if (permission) {
    try {
      const activeScripts = await chrome.scripting.getRegisteredContentScripts({ ids: ["activityTracker"] });
      if (activeScripts.length <= 0) {
        await chrome.scripting.registerContentScripts([
          {
            id: "activityTracker",
            js: ["bundle/activityTracker.js"],
            persistAcrossSessions: true,
            matches: permissions.map((permission) => `https://${permission.url}/*`), // ["https://*/*"],
            runAt: "document_end",
          },
        ]);
      }
    } catch (err) {
      console.error("There was an error registering content scripts", err);
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
  (
    message:
      | AddURLPermission
      | GetURLPermissions
      | RemoveURLPermission
      | AddActivity
      | RemoveActivity
      | GetActivites
      | RemoveActivities
      | UpdateActivity,
    _,
    sendResponse: (_: unknown) => void,
  ) => {
    if (
      message.eventName !== "getURLPermissions" &&
      message.eventName !== "addURLPermission" &&
      message.eventName !== "removeURLPermission" &&
      message.eventName !== "addActivity" &&
      message.eventName !== "getActivities" &&
      message.eventName !== "removeActivities" &&
      message.eventName !== "removeActivity" &&
      message.eventName !== "updateActivity"
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

    if (message.eventName === "removeActivity") {
      eventHandler
        ?.removeActivity(message)
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse(err));
      return true;
    }

    if (message.eventName === "getActivities") {
      eventHandler
        ?.getActivities(message)
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse(err));
      return true;
    }

    if (message.eventName === "removeActivities") {
      eventHandler
        ?.removeAllActivites(message)
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse(err));
      return false;
    }

    if (message.eventName === "updateActivity") {
      eventHandler
        ?.updateActivity(message)
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse(err));
      return true;
    }
  },
);
