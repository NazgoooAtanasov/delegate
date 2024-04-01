import { ResultAsync, resultAsync } from "../utils";
import Database, { Storage } from "./database";

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

export type RemoveActivity = {
  eventName: "removeActivity";
  id: number;
};

export default class EventHandler {
  private db: Storage | null = null;

  constructor() {}

  async initialize() {
    this.db = new Database();
    await this.db.conncect();
  }

  async addURLPermission(event: AddURLPermission): Promise<ResultAsync<number>> {
    if (!this.db) {
      try {
        await this.initialize();
      } catch (e) {
        return { error: e };
      }
    }

    return await resultAsync(this.db!.add("permissions", { url: event.url }), "resultfiy");
  }

  async getURLPermissions(_: GetURLPermissions): Promise<ResultAsync<{ id: number; url: string }[]>> {
    if (!this.db) {
      try {
        await this.initialize();
      } catch (e) {
        return { error: e };
      }
    }

    return await resultAsync(this.db!.getAll("permissions"), "resultfiy");
  }

  async removeURLPermission(event: RemoveURLPermission): Promise<ResultAsync<number>> {
    if (!this.db) {
      try {
        await this.initialize();
      } catch (e) {
        return { error: e };
      }
    }

    return await resultAsync(this.db!.remove("permissions", event.id), "resultfiy");
  }

  async getURLPermission(event: GetURLPermission): Promise<ResultAsync<{ id: number; url: string }>> {
    if (!this.db) {
      try {
        await this.initialize();
      } catch (e) {
        return { error: e };
      }
    }

    return await resultAsync(this.db!.findIndex("permissions", "url", event.url), "resultfiy");
  }

  async addActivity({
    action,
    url,
    activityTitle,
    elementName,
    attributes,
    selector,
  }: AddActivity): Promise<ResultAsync<Omit<AddActivity, "eventName"> & { id: number }>> {
    if (!this.db) {
      try {
        await this.initialize();
      } catch (e) {
        return { error: e };
      }
    }

    const result = await resultAsync(
      this.db!.add("activites", { action, url, activityTitle, elementName, attributes, selector }),
      "resultfiy",
    );
    if (result.error || !result.data) {
      return { error: result.error };
    }

    return { data: { id: result.data, action, url, activityTitle, elementName, attributes, selector } };
  }

  async removeActivity(event: RemoveActivity): Promise<ResultAsync<number>> {
    if (!this.db) {
      try {
        await this.initialize();
      } catch (e) {
        return { error: e };
      }
    }

    return await resultAsync(this.db!.remove("activites", event.id), "resultfiy");
  }

  async getActivities(_: GetActivites): Promise<ResultAsync<Omit<AddActivity, "eventName">[]>> {
    if (!this.db) {
      try {
        await this.initialize();
      } catch (e) {
        return { error: e };
      }
    }

    return await resultAsync(this.db!.getAll("activites"), "resultfiy");
  }

  async removeAllActivites(_: RemoveActivities) {
    if (!this.db) {
      try {
        await this.initialize();
      } catch (e) {
        return { error: e };
      }
    }

    return await resultAsync(this.db!.removeAll("activites"), "resultfiy");
  }
}
