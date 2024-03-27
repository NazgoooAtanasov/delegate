import { EventHandler } from "./serviceWorkerUtils";

let db: IDBDatabase | null = null;
let eventHandler: EventHandler | null = null;

function installDb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const dbOpenRequest = indexedDB.open("delegate", 1);

    dbOpenRequest.addEventListener("error", (err) => rej(err));

    dbOpenRequest.addEventListener("success", (_) => res(dbOpenRequest.result));

    dbOpenRequest.addEventListener("upgradeneeded", () => {
      const db = dbOpenRequest.result;

      const permissions = db.createObjectStore("permissions", {
        keyPath: "id",
        autoIncrement: true,
      });

      permissions.createIndex("url", "url", { unique: true });
    });
  });
}

async function getPersmission(url: string): Promise<{ id: number; url: string } | undefined> {
  if (!db) {
    try {
      db = await installDb();
    } catch (err) {
      console.error("There was an error opening indexed db", err);
      return;
    }
  }

  return new Promise((res, rej) => {
    const transaction = db?.transaction("permissions", "readonly");
    const permissions = transaction?.objectStore("permissions");
    const permissionQuery = permissions?.index("url").get(url);

    permissionQuery?.addEventListener("success", () => {
      res(permissionQuery?.result);
    });

    permissionQuery?.addEventListener("error", (err) => {
      console.error("There was an error getting the permission", err);
      rej(err);
    });
  });
}

chrome.tabs.onUpdated.addListener(async (_, changeInfo, tab) => {
  if (changeInfo.status !== "loading") return;
  const url = tab.url!;

  let permission: { id: number; url: string } | undefined = undefined;

  try {
    const urlOjb = new URL(url);
    permission = await getPersmission(urlOjb.hostname);
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

type AddURLPermission = {
  eventName: "addURLPersmission";
  url: string;
};

type GetURLPermissions = {
  eventName: "getURLPermisions";
};

type RemoveURLPermission = {
  eventName: "removeURLPermission";
  id: number;
};

chrome.runtime.onMessage.addListener((message: AddURLPermission | GetURLPermissions | RemoveURLPermission, _, sendResponse) => {
  if (
    message.eventName !== "getURLPermisions" &&
    message.eventName !== "addURLPersmission" &&
    message.eventName !== "removeURLPermission"
  ) {
    return false;
  }

  if (message.eventName === "addURLPersmission") {
    eventHandler
      ?.addURLPermission(message)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse(err));
    return true;
  }

  if (message.eventName === "getURLPermisions") {
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
});
