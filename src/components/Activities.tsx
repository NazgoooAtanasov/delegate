import React, { useEffect } from "preact/compat";
import { ResultAsync, resultAsync, timerRegex } from "../utils";
import Button from "./Button";
import { Mission, type Activities } from "../entities";
import Activity from "./Activity";
import { Signal, useSignal } from "@preact/signals";
import InputField from "./InputField";
import { ConfirmIcon } from "./Icons";
import Timer from "./Timer";

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

export default function Activities({ activities, mission }: { activities: Signal<Activities>; mission: Signal<Mission | null> }) {
  const missionTimes = [
    {
      value: "15min",
      selected: true,
    },
    {
      value: "20min",
      selected: false,
    },
    {
      value: "25min",
      selected: false,
    },
    {
      value: "Custom",
      selected: false,
    },
  ];

  const missionName = useSignal("");
  const error = useSignal<string | null>(null);

  const isCustomTimeSet = (!!mission.value && !missionTimes.find((time) => time.value === mission.value?.missionTime ?? "")) ?? false;
  if (isCustomTimeSet) {
    missionTimes.forEach((time) => {
      time.selected = time.value === "Custom";
    });
  }
  const missionTime = useSignal(mission.value?.missionTime ?? missionTimes[0].value);
  const customTimerVisibility = useSignal(isCustomTimeSet);
  useEffect(() => {
    if (isCustomTimeSet) {
      customTimerVisibility.value = isCustomTimeSet;
      missionTime.value = mission.value?.missionTime ?? "";
    }
  }, [isCustomTimeSet]);

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
    error.value = null;

    if (!missionTime.value) {
      error.value = "Please select a mission time";
      return;
    }

    if (!missionTime.value.match(timerRegex)) {
      error.value = "Please enter a valid mission time. It should be in the format of XXmin";
      return;
    }

    if (!missionName.value) {
      error.value = "Please enter a mission name";
      return;
    }

    const result = (await resultAsync(
      chrome.runtime.sendMessage({ eventName: "addMission", missionName: missionName.value, missionTime: missionTime.value }),
      "bare",
    )) as ResultAsync<Mission>;
    if (result.error) {
      error.value = result.error as string;
      return;
    }

    mission.value = result.data!;
  }

  async function startMission() {
    const result = (await resultAsync(chrome.runtime.sendMessage({ eventName: "startMission" }), "bare")) as ResultAsync<boolean>;
    if (result.error) {
      error.value = result.error as string;
      return;
    }
    if (mission.value) {
      mission.value = { ...mission.value, running: true };
    }
    chrome.tabs.reload();
  }

  function endMission() {
    // @NOTE: maybe not raw dogging the call here? maybe wrapping in result object? maybe not?
    chrome.runtime.sendMessage({ eventName: "endMission" });
    chrome.tabs.reload();

    activities.value = [];
    mission.value = null;
    missionName.value = "";
    error.value = null;
    missionTime.value = "";
    customTimerVisibility.value = false;
  }

  function onMissionTimeChange(event: Event) {
    const selectedItem = (event.target as HTMLSelectElement).selectedOptions.item(0);
    if (!selectedItem) return;

    if (selectedItem.value.toLowerCase() === "custom") {
      customTimerVisibility.value = true;
      missionTime.value = "";
      return;
    } else {
      customTimerVisibility.value = false;
    }

    missionTime.value = selectedItem.value;
  }

  function onCustomMissionTimeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    missionTime.value = target.value;
  }

  chrome.runtime.onMessage.addListener(updateActivities);
  useEffect(() => {
    return () => chrome.runtime.onMessage.removeListener(updateActivities);
  });

  return (
    <div className="p-[10px]" data-section="actions">
      <div className="relative text-center text-lg">
        Latest actions
        {mission.value?.running && <Timer className="absolute right-0 top-0 flex h-full items-center" toCount={missionTime.value} />}
      </div>

      <div className="mt-[10px] flex justify-between">
        <Button className="ml-3px mr-[3px] flex-grow" text="Clear all" onClick={clearActions} />
        <Button className="ml-3px mr-[3px] flex-grow" text="Get report" />
        <Button className="ml-3px mr-[3px] flex-grow" text="Start" onClick={startMission} />
        <Button className="ml-3px mr-[3px] flex-grow" text="End" onClick={endMission} disabled={!mission.value} />
      </div>

      {error.value && <div className="mt-[20px] text-red-500">{error.value}</div>}

      <div className="mt-[20px] flex">
        <label className="text-lg" for="missionfield">
          Mission:
        </label>
        {!mission.value ? (
          <InputField
            onChange={(event) => (missionName.value = (event.target as HTMLInputElement).value)}
            value={missionName.value}
            className="w-full text-lg"
            name="missionfield"
            placeholder="Fancy name..."
          />
        ) : (
          <h3 className="w-full text-lg">{mission.value.name}</h3>
        )}

        <label for="timer" className="mr-[3px] flex flex-shrink-0 items-center">
          Set timer:{" "}
        </label>
        {customTimerVisibility.value && (
          <InputField
            value={missionTime.value}
            disabled={!!mission.value}
            onChange={onCustomMissionTimeChange}
            className="max-w-[40px]"
            name="minfield"
            placeholder="XX min"
          />
        )}
        <select
          disabled={!!mission.value}
          onChange={onMissionTimeChange}
          name="timer"
          className="rounded-md border-none bg-gray-200 outline-none"
        >
          {missionTimes.map((time) => (
            <option selected={time.selected} value={time.value}>
              {time.value}
            </option>
          ))}
        </select>

        {!mission.value && (
          <button onClick={createAndActivateMission} className="ml-[3px] max-w-[30px]">
            <ConfirmIcon className="h-auto max-h-full max-w-full" />
          </button>
        )}
      </div>
      <div className="mb-[10px] mt-[10px]">
        {mission.value && mission.value.running && (
          <>
            {activities.value.length > 0 ? (
              activities.value.map((activity, index) => {
                return <Activity key={index} activity={activity} deleteActivity={() => deleteActivity(activity.id)} />;
              })
            ) : (
              <div> Waiting for activities... </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
