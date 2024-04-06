import { Activities } from ".";

export type Mission = {
  id: number;
  name: string;
  active: boolean;
  running: boolean;
  activities: Activities;
};

export type Missions = Mission[];
