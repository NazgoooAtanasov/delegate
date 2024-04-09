import { Activities } from ".";

export type Mission = {
  id: number;
  name: string;
  active: boolean;
  running: boolean;
  missionTime: string;
  startTime?: number;
  endTime?: number;
  activities: Activities;
};

export type Missions = Mission[];
