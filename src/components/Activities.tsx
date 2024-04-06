import React, { useEffect, useRef } from "preact/compat";
import { ResultAsync, resultAsync } from "../utils";
import Button from "./Button";
import { Mission, type Activities } from "../entities";
import Activity from "./Activity";
import { Signal, useSignal } from "@preact/signals";
import InputField from "./InputField";
import { ConfirmIcon } from "./Icons";

// @TODO: this is pretty much the same thing as AddActivity from eventHandler. FIX?
type ActivityAdded = {
  eventName: "activityAdded";
  action: "click";
  url: string;
  activityTitle: string;
  elementName: string;
  attributes: string[][];
  selector: string;
  id: number;
};

export default function Activities({ activities }: { activities: Signal<Activities> }) {
  const error = useSignal<string | null>(null);
  const currentMission = useSignal<Mission | null>(null);
  const missionName = useSignal("");

  function clearActions() {
    chrome.runtime.sendMessage({ eventName: "removeActivities" });
    activities.value = [];
  }

  async function deleteActivity(id: number) {
    const result = (await resultAsync(chrome.runtime.sendMessage({ eventName: "removeActivity", id }), "bare")) as ResultAsync<number>;

    if (result.error) {
      console.error("There was an error deleting activity", result.error);
      return;
    }

    activities.value = activities.value.filter((activity) => activity.id !== id);
  }

  function updateActivities({ id, eventName, action, url, activityTitle, elementName, attributes, selector }: ActivityAdded) {
    if (eventName !== "activityAdded") return false;

    activities.value = [...activities.value, { action, url, activityTitle, elementName, attributes, selector, id }];

    return false;
  }

  async function createAndActivateMission() {
    const result = (await resultAsync(
      chrome.runtime.sendMessage({ eventName: "addMission", missionName: missionName.value }),
      "bare",
    )) as ResultAsync<Mission>;
    if (result.error) {
      error.value = result.error as string;
      return;
    }

    currentMission.value = result.data!;
  }

  async function startMission() {
    const result = (await resultAsync(chrome.runtime.sendMessage({ eventName: "startMission" }), "bare")) as ResultAsync<boolean>;
    if (result.error) {
      error.value = result.error as string;
    }
  }

  chrome.runtime.onMessage.addListener(updateActivities);
  useEffect(() => {
    return () => chrome.runtime.onMessage.removeListener(updateActivities);
  });

  return (
    <div className="p-[10px]" data-section="actions">
      <h1 className="text-center text-lg">Latest actions</h1>
      <div className="mt-[10px] flex justify-between">
        <Button className="ml-3px mr-[3px] flex-grow" text="Clear all" onClick={clearActions} />
        <Button className="ml-3px mr-[3px] flex-grow" text="Get report" />
        <Button className="ml-3px mr-[3px] flex-grow" text="Start" onClick={startMission} />
        <Button className="ml-3px mr-[3px] flex-grow" text="End" disabled={true} />
      </div>
      {error.value && <div className="mt-[20px] text-red-500">{error.value}</div>}
      <div className="mt-[20px] grid grid-cols-[auto_5%] grid-rows-[30px]">
        <div class="flex">
          <label className="flex-grow-0 text-lg" for="missionfield">
            Mission:
          </label>
          {!currentMission.value ? (
            <InputField
              onChange={(event) => (missionName.value = (event.target as HTMLInputElement).value)}
              className="w-full flex-grow text-lg"
              name="missionfield"
              placeholder="Fancy name..."
            />
          ) : (
            <h3 className="w-full flex-grow text-lg">{currentMission.value.name}</h3>
          )}
        </div>
        {!currentMission.value && (
          <button onClick={createAndActivateMission} className="ml-[3px] max-w-[30px]">
            <ConfirmIcon className="h-auto max-h-full max-w-full" />
          </button>
        )}
      </div>
      <div className="mb-[10px] mt-[10px]">
        {activities.value.map((activity, index) => {
          return <Activity key={index} activity={activity} deleteActivity={() => deleteActivity(activity.id)} />;
        })}
      </div>
    </div>
  );
}
