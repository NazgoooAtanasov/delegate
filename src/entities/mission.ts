import { Activities } from ".";

export type Mission = {
  id: number;
  name: string;
  active: boolean;
  activities: Activities;
};

export type Missions = Mission[];
