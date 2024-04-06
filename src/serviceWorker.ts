import { EventHandler } from "./serviceWorkerUtils";
import {
  AddActivity,
  AddMission,
  AddURLPermission,
  EndMission,
  GetActivites,
  GetCurrentMission,
  GetURLPermissions,
  RemoveActivities,
  RemoveActivity,
  RemoveURLPermission,
  StartMission,
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
      | UpdateActivity
      | AddMission
      | StartMission
      | EndMission
      | GetCurrentMission,
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
      message.eventName !== "updateActivity" &&
      message.eventName !== "addMission" &&
      message.eventName !== "startMission" &&
      message.eventName !== "getCurrentMission" &&
      message.eventName !== "endMission"
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

    if (message.eventName === "startMission") {
      eventHandler
        ?.startMission(message)
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse(err));
      return true;
    }

    if (message.eventName === "addMission") {
      eventHandler
        ?.addMission(message)
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse(err));
      return true;
    }

    if (message.eventName === "endMission") {
      eventHandler
        ?.endMission(message)
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse(err));
      return false;
    }

    if (message.eventName === "getCurrentMission") {
      eventHandler
        ?.getCurrentMission(message)
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse(err));
      return true;
    }
  },
);
