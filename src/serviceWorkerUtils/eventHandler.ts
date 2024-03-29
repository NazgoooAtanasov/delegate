import { ResultAsync } from "../utils";

export type AddURLPermission = {
  eventName: "addURLPermission";
  url: string;
};

export type GetURLPermissions = {
  eventName: "getURLPermissions";
};

export type RemoveURLPermission = {
  eventName: "removeURLPermission";
  id: number;
};

export type GetURLPermission = {
  eventName: "getURLPermission";
  url: string;
};

export type GetActivites = {
  eventName: "getActivities";
};

export type RemoveActivities = {
  eventName: "removeActivities";
};

export type AddActivity = {
  eventName: "addActivity";
  action: "click";
  url: string;
  activityTitle?: string;
  elementName: string;
  attributes: string;
  selector: string;
};

export default class EventHandler {
  private db: IDBDatabase | null = null;

  constructor() {}

  async initialize() {
    return new Promise((res, rej) => {
      const dbOpenRequest = indexedDB.open("delegate", 2);

      dbOpenRequest.addEventListener("success", (_) => {
        this.db = dbOpenRequest.result;
        res(dbOpenRequest.result);
      });

      dbOpenRequest.addEventListener("error", (err) => rej(err));

      dbOpenRequest.addEventListener("upgradeneeded", () => {
        this.db = dbOpenRequest.result;

        if (!this.db.objectStoreNames.contains("permissions")) {
          const permissions = this.db.createObjectStore("permissions", {
            keyPath: "id",
            autoIncrement: true,
          });
          permissions.createIndex("url", "url", { unique: true });
        }

        if (!this.db.objectStoreNames.contains("activites")) {
          this.db.createObjectStore("activites", {
            keyPath: "id",
            autoIncrement: true,
          });
        }

        res(this.db);
      });
    });
  }

  async addURLPermission(event: AddURLPermission): Promise<ResultAsync<IDBValidKey>> {
    if (!this.db) {
      await this.initialize();
    }
    return new Promise((res, rej) => {
      const transaction = this.db?.transaction("permissions", "readwrite");
      const permissions = transaction?.objectStore("permissions");

      const request = permissions?.add({ url: event.url });

      request?.addEventListener("success", () => {
        res({ data: request.result });
      });

      request?.addEventListener("error", (err) => {
        rej({ error: err });
      });
    });
  }

  async getURLPermissions(_: GetURLPermissions): Promise<ResultAsync<{ id: number; url: string }[]>> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((res, rej) => {
      const transaction = this.db?.transaction("permissions", "readonly");
      const permissions = transaction?.objectStore("permissions");

      const request = permissions?.getAll();

      request?.addEventListener("success", () => {
        res({ data: request.result });
      });

      request?.addEventListener("error", (err) => {
        rej({ error: err });
      });
    });
  }

  async removeURLPermission(event: RemoveURLPermission): Promise<ResultAsync<number>> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((res, rej) => {
      const transaction = this.db?.transaction("permissions", "readwrite");
      const permissions = transaction?.objectStore("permissions");

      const request = permissions?.delete(event.id);

      request?.addEventListener("success", () => {
        res({ data: event.id });
      });

      request?.addEventListener("error", (err) => {
        rej({ error: err });
      });
    });
  }

  async getURLPermission(event: GetURLPermission): Promise<ResultAsync<{ id: number; url: string }>> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((res, rej) => {
      const transaction = this.db?.transaction("permissions", "readonly");
      const permissions = transaction?.objectStore("permissions");
      const permissionQuery = permissions?.index("url").get(event.url);

      permissionQuery?.addEventListener("success", () => {
        res({ data: permissionQuery?.result });
      });

      permissionQuery?.addEventListener("error", (err) => {
        rej({ error: err });
      });
    });
  }

  async addActivity({
    action,
    url,
    activityTitle,
    elementName,
    attributes,
    selector,
  }: AddActivity): Promise<ResultAsync<Omit<AddActivity, "eventName">>> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((res, rej) => {
      const transaction = this.db?.transaction("activites", "readwrite");
      const activities = transaction?.objectStore("activites");
      const activity = {
        action,
        url,
        activityTitle,
        elementName,
        attributes,
        selector,
      };

      const request = activities?.add(activity);

      request?.addEventListener("success", () => {
        res({ data: activity });
      });

      request?.addEventListener("error", (err) => {
        rej({ error: err });
      });
    });
  }

  async getActivities(_: GetActivites): Promise<ResultAsync<Omit<AddActivity, "eventName">[]>> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((res, rej) => {
      const transaction = this.db?.transaction("activites", "readonly");
      const activities = transaction?.objectStore("activites");
      const request = activities?.getAll();

      request?.addEventListener("success", () => {
        res({ data: request.result });
      });

      request?.addEventListener("error", (err) => {
        rej({ error: err });
      });
    });
  }

  async removeAllActivites(_: RemoveActivities) {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((res, rej) => {
      const transaction = this.db?.transaction("activites", "readwrite");
      const activities = transaction?.objectStore("activites");
      const request = activities?.clear();

      request?.addEventListener("success", () => {
        res({ data: request.result });
      });

      request?.addEventListener("error", (err) => {
        rej({ error: err });
      });
    });
  }
}
