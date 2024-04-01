export type Activity = {
  id: number;
  action: "click";
  activityTitle: string;
  attributes: string[][];
  elementName: string;
  selector: string;
  url: string;
};

export type Activities = Activity[];
