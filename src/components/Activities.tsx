import { useSignal } from "@preact/signals";
import React, { useEffect } from "preact/compat";
import Prismjs from "prismjs";
import { resultAsync } from "../utils";
import { RemoveIcon } from "./Icons";
Prismjs.manual = true;

type TargetElement = {
  elementName: string;
  attributes: string[][];
  selector: string;
};

type Activity = {
  action: "click";
  url?: string;
  activityTitle: string;
  element: TargetElement;
};

type Activities = Activity[];

function CodeSegment({ element }: { element: TargetElement }) {
  let code = `<${element.elementName} `;
  const attributes = element.attributes
    .map(([name, value]) => `${name}="${value}"`)
    .join(" ");
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

function Activity({
  activity,
  deleteActivity,
}: {
  activity: Activity;
  deleteActivity: () => void;
}) {
  const expand = useSignal(false);

  function expandActivityDetails() {
    expand.value = !expand.value;
  }

  async function scrollIntoView() {
    const tabResult = await resultAsync(
      chrome.tabs.query({ active: true, currentWindow: true }),
    );
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
        element: activity.element,
        selector: activity.element.selector,
      }),
    );
    if (result.error) {
      console.warn(
        "There was an error sending scrollIntoView message",
        result.error,
      );
      return;
    }
  }

  return (
    <>
      <div class="grid max-h-[60px] grid-cols-[minmax(90%,_auto)_auto] grid-rows-[60px]">
        <button
          onClick={expandActivityDetails}
          className="mb-[5px] mt-[5px] flex min-w-0 max-w-full justify-between rounded-md bg-gray-400 p-[10px] text-left text-lg outline-none"
        >
          <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="text-green-300">{activity.action}</span>:&nbsp;
            {activity.activityTitle}
          </span>
          <span>{expand.value ? "▲" : "▼"}</span>
        </button>
        <button
          onClick={deleteActivity}
          className="mb-[5px] ml-[3px] mt-[5px] outline-none"
        >
          <RemoveIcon className="h-auto max-h-full max-w-full" />
        </button>
      </div>
      {expand.value ? (
        <div className="mb-[5px] mt-[5px] rounded-md bg-green-100 p-[10px]">
          <div className="flex justify-between">
            <div
              title={activity.url || ""}
              className="overflow-hidden text-ellipsis"
            >
              {activity.url || ""}
            </div>
            <div className="text-right text-gray-500"> {activity.action} </div>
          </div>
          <CodeSegment element={activity.element} />
          <div>
            <button
              className="mb-[5px] mt-[5px] rounded-md bg-red-200 p-[5px]"
              onClick={scrollIntoView}
            >
              Scroll into view
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
  const activity = useSignal<Activities>([]);

  function updateActions(
    message: {
      eventName: "activity";
      url?: string;
      activityTitle: string;
    } & TargetElement,
  ) {
    if (message.eventName === "activity") {
      activity.value = [
        ...activity.value,
        {
          action: "click",
          url: message.url,
          activityTitle: message.activityTitle,
          element: {
            elementName: message.elementName,
            attributes: message.attributes,
            selector: message.selector,
          },
        },
      ];
    }
    return false;
  }

  function clearActions() {
    activity.value = [];
  }

  function deleteActivity(index: number) {
    activity.value = activity.value.filter((_, i) => i !== index);
  }

  chrome.runtime.onMessage.addListener(updateActions);

  useEffect(() => {
    return () => {
      chrome.runtime.onMessage.removeListener(updateActions);
    };
  });

  return (
    <div className="p-[10px]" data-section="actions">
      <h1 className="text-lg">Latest actions</h1>
      <div>
        <button onClick={clearActions}>Clear actions</button>
      </div>
      <div className="mb-[10px] mt-[10px]">
        {activity.value.map((activity, index) => {
          return (
            <Activity
              key={index}
              activity={activity}
              deleteActivity={() => deleteActivity(index)}
            />
          );
        })}
      </div>
    </div>
  );
}
