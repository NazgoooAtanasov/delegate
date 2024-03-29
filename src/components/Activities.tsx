import { useSignal } from "@preact/signals";
import React, { useEffect } from "preact/compat";
import Prismjs from "prismjs";
import { ResultAsync, resultAsync } from "../utils";
import { ArrowDownIcon, ArrowUpIcon, RemoveIcon } from "./Icons";
Prismjs.manual = true;

// @TODO: this is pretty much the same thing as AddActivity from eventHandler. FIX?
type ActivityAdded = {
  eventName: "activityAdded";
  action: "click";
  url: string;
  activityTitle?: string;
  elementName: string;
  attributes: string[][];
  selector: string;
  id: number;
};

type Activity = Omit<ActivityAdded, "eventName">;
type Activities = Activity[];

function CodeSegment({ element }: { element: { elementName: string; attributes: string[][] } }) {
  let code = `<${element.elementName} `;
  const attributes = element.attributes.map(([name, value]) => `${name}="${value}"`).join(" ");
  code += attributes;
  code += `> </${element.elementName}>`;

  useEffect(() => {
    Prismjs.highlightAll();
  });

  return (
    <pre>
      <code className="language-html">{code}</code>
    </pre>
  );
}

function Activity({ activity, deleteActivity }: { activity: Activity; deleteActivity: () => void }) {
  const expand = useSignal(false);

  const element: { elementName: string; attributes: string[][] } = {
    elementName: activity.elementName,
    attributes: activity.attributes,
  };

  function expandActivityDetails() {
    expand.value = !expand.value;
  }

  async function scrollIntoView() {
    const tabResult = await resultAsync(chrome.tabs.query({ active: true, currentWindow: true }), "resultfiy");
    if (tabResult.error) {
      console.warn("There was an error querying active tab", tabResult.error);
      return;
    }

    const [tab] = tabResult.data!;
    if (!tab?.id) {
      console.warn("No active tab found");
      return;
    }

    const result = await resultAsync(
      chrome.tabs.sendMessage(tab.id, {
        eventName: "scrollIntoView",
        selector: activity.selector,
      }),
      "resultfiy",
    );
    if (result.error) {
      console.warn("There was an error sending scrollIntoView message", result.error);
      return;
    }
  }

  return (
    <>
      <div class="grid max-h-[60px] grid-cols-[minmax(95%,_auto)_5%] grid-rows-[60px]">
        <div className="mb-[5px] mt-[5px] flex min-w-0 max-w-full justify-between rounded-md bg-gray-400 p-[10px] text-lg">
          <h3 className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="text-green-300">{activity.action}</span>:&nbsp;
            {activity.activityTitle}
          </h3>
          <button className="max-w-[20px] drop-shadow-xl" onClick={expandActivityDetails}>
            {expand.value ? (
              <ArrowUpIcon className="h-auto max-h-full max-w-full" />
            ) : (
              <ArrowDownIcon className="h-auto max-h-full max-w-full" />
            )}
          </button>
        </div>
        <button onClick={deleteActivity} className="mb-[5px] ml-[3px] mt-[5px] outline-none">
          <RemoveIcon className="h-auto max-h-full max-w-full" />
        </button>
      </div>
      {expand.value ? (
        <div className="mb-[5px] mt-[5px] rounded-md bg-green-100 p-[10px]">
          <div title={activity.url} className="overflow-hidden text-ellipsis">
            at: {activity.url}
          </div>
          <CodeSegment element={element} />
          <div>
            <button className="mb-[5px] mt-[5px] rounded-md bg-red-200 p-[5px] drop-shadow-xl" onClick={scrollIntoView}>
              View
            </button>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}

export default function Activities() {
  const activities = useSignal<Activities>([]);

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

  chrome.runtime.onMessage.addListener(updateActivities);
  useEffect(() => {
    return () => chrome.runtime.onMessage.removeListener(updateActivities);
  });

  (async () => {
    const result: ResultAsync<Activity[]> = (await resultAsync(
      chrome.runtime.sendMessage({ eventName: "getActivities" }),
      "bare",
    )) as ResultAsync<Activity[]>;

    if (result.error) {
      console.error("There was an error getting activities", result.error);
      return;
    }

    activities.value = result.data!;
  })();

  return (
    <div className="p-[10px]" data-section="actions">
      <h1 className="text-lg">Latest actions</h1>
      <div>
        <button onClick={clearActions}>Clear actions</button>
      </div>
      <div className="mb-[10px] mt-[10px]">
        {activities.value.map((activity, index) => {
          return <Activity key={index} activity={activity} deleteActivity={() => deleteActivity(activity.id)} />;
        })}
      </div>
    </div>
  );
}
