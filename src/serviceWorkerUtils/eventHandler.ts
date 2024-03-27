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

export default class EventHandler {
  private db: IDBDatabase | null = null;

  constructor() {}

  async initialize() {
    return new Promise((res, rej) => {
      const dbOpenRequest = indexedDB.open("delegate", 1);

      dbOpenRequest.addEventListener("success", (_) => {
        this.db = dbOpenRequest.result;
        res(dbOpenRequest.result);
      });

      dbOpenRequest.addEventListener("error", (err) => rej(err));

      dbOpenRequest.addEventListener("upgradeneeded", () => {
        this.db = dbOpenRequest.result;

        const permissions = this.db.createObjectStore("permissions", {
          keyPath: "id",
          autoIncrement: true,
        });

        permissions.createIndex("url", "url", { unique: true });

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
}
