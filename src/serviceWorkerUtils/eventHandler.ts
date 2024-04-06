import { Permission } from "../components/Permissions";
import { URLPermission, URLPermissions, Activities, Activity, Missions, Mission } from "../entities";
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

export type UpdateActivity = {
  eventName: "updateActivity";
  id: number;
  title?: string;
};

export type AddActivity = {
  eventName: "addActivity";
  action: "click";
  url: string;
  activityTitle: string;
  elementName: string;
  attributes: string[][];
  selector: string;
};

export type RemoveActivity = {
  eventName: "removeActivity";
  id: number;
};

export type GetCurrentMission = {
  eventName: "getCurrentMission";
};

export type AddMission = {
  eventName: "addMission";
  missionName: string;
};

export type StartMission = {
  eventName: "startMission";
};

export type EndMission = {
  eventName: "endMission";
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

  async getURLPermissions(_: GetURLPermissions): Promise<ResultAsync<URLPermissions>> {
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

  async getURLPermission(event: GetURLPermission): Promise<ResultAsync<URLPermission>> {
    if (!this.db) {
      try {
        await this.initialize();
      } catch (e) {
        return { error: e };
      }
    }

    return await resultAsync(this.db!.findIndex("permissions", "url", event.url), "resultfiy");
  }

  async addActivity({ action, url, activityTitle, elementName, attributes, selector }: AddActivity): Promise<ResultAsync<Activity>> {
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

  async getActivities(_: GetActivites): Promise<ResultAsync<Activities>> {
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

  async updateActivity(event: UpdateActivity): Promise<ResultAsync<void>> {
    if (!this.db) {
      try {
        await this.initialize();
      } catch (e) {
        return { error: e };
      }
    }

    const result = await resultAsync(this.db!.find<Activity>("activites", event.id), "resultfiy");
    if (result.error && !result.data) {
      return { error: result.error };
    }

    const data = result.data!;

    if (event.title) {
      data.activityTitle = event.title;
      return await resultAsync(this.db!.update("activites", data), "resultfiy");
    }

    return { data: undefined };
  }

  async addMission(event: AddMission): Promise<ResultAsync<Mission>> {
    if (!this.db) {
      try {
        await this.initialize();
      } catch (e) {
        return { error: e };
      }
    }

    const result = await resultAsync(
      this.db!.add<Omit<Mission, "id">>("missions", {
        name: event.missionName,
        active: true,
        activities: [],
      }),
      "resultfiy",
    );
    if (result.error || !result.data) {
      return { error: result.error };
    }

    const missions = await resultAsync(this.db!.getAll<Mission>("missions"), "resultfiy");
    if (missions.error || !missions.data) {
      return { error: missions.error };
    }

    missions.data.forEach(async (mission) => {
      if (mission.id !== result.data) {
        mission.active = false;
        // ignore the result for now.
        await resultAsync(this.db!.update("missions", mission), "resultfiy");
      }
    });

    return {
      data: {
        id: result.data,
        name: event.missionName,
        active: true,
        activities: [],
      },
    };
  }

  async startMission(_: StartMission): Promise<ResultAsync<boolean>> {
    if (!this.db) {
      try {
        await this.initialize();
      } catch (e) {
        return { error: e };
      }
    }

    const result = await resultAsync(chrome.tabs.query({ active: true, currentWindow: true }), "resultfiy");
    if (result.error) {
      return { error: result.error };
    }

    const [tab] = result.data!;
    if (!tab?.id || !tab?.url) {
      return { error: "No active tab found" };
    }

    const url = new URL(tab.url);
    const permission = await resultAsync<URLPermission>(this.db!.findIndex("permissions", "url", url.hostname), "resultfiy");
    if (permission.error) {
      return { error: permission.error };
    }

    if (!permission.data) {
      return { error: "Permission denied" };
    }

    const missionsResult = await resultAsync<Missions>(this.db!.getAll("missions"), "resultfiy");
    if (missionsResult.error) {
      return { error: missionsResult.error };
    }

    const activeMission = missionsResult.data!.find((mission) => mission.active);
    if (!activeMission) {
      return { error: "No active mission found" };
    }

    const permissions = await resultAsync(this.db!.getAll<Permission>("permissions"), "resultfiy");
    if (permissions.error || !permissions.data) {
      return { error: permissions.error };
    }

    // @NOTE: IDK why but injection feels like it should be behind a permission check
    const injectResult = await resultAsync(
      chrome.scripting.registerContentScripts([
        {
          id: "activityTracker",
          matches: permissions.data.map((permission) => {
            return `https://${permission.url}/*`;
          }),
          js: ["bundle/activityTracker.js"],
          runAt: "document_end",
        },
      ]),
      "resultfiy",
    );
    if (injectResult.error) {
      return { error: injectResult.error };
    }

    return { data: true };
  }

  async endMission(_: EndMission): Promise<ResultAsync<void>> {
    if (!this.db) {
      try {
        await this.initialize();
      } catch (e) {
        return { error: e };
      }
    }

    const missions = await resultAsync(this.db!.getAll<Mission>("missions"), "resultfiy");
    // @WARN: Ignoring the error for now here
    if (missions.data) {
      const mission = missions.data.find((mission) => mission.active);
      if (mission && mission.active) {
        mission.active = false;

        const currentActivities = await resultAsync(this.db!.getAll<Activity>("activites"), "resultfiy");
        if (currentActivities.data) {
          mission.activities = currentActivities.data;
        }

        await resultAsync(this.db!.update("missions", mission), "resultfiy");
        await resultAsync(this.db!.removeAll("activites"), "resultfiy");
      }
    }

    // @WARN: Ignoring the error for now here
    await resultAsync(
      chrome.scripting.unregisterContentScripts({
        ids: ["activityTracker"],
      }),
      "resultfiy",
    );

    return {};
  }

  async getCurrentMission(_: GetCurrentMission): Promise<ResultAsync<Mission | null>> {
    if (!this.db) {
      try {
        await this.initialize();
      } catch (e) {
        return { error: e };
      }
    }

    const missions = await resultAsync(this.db!.getAll<Mission>("missions"), "resultfiy");
    if (missions.error) {
      return { error: missions.error };
    }

    return { data: missions.data!.find((mission) => mission.active) };
  }
}
