import { useSignal } from "@preact/signals";
import React, { useEffect } from "preact/compat";
import Prismjs from "prismjs";
import { resultAsync } from "../utils";
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

    console.log(tabResult.data);
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
          <svg
            className="h-auto max-h-full max-w-full"
            width="79.541916mm"
            height="79.541397mm"
            viewBox="0 0 79.541916 79.541397"
            version="1.1"
            id="svg1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs id="defs1" />
            <g id="layer1" transform="translate(-65.229097,-108.72928)">
              <path
                id="path1"
                style="fill:#ff0000;fill-rule:evenodd;stroke-width:0.323001"
                d="m 104.99979,108.72928 a 39.77084,39.77084 0 0 0 -39.770697,39.7707 39.77084,39.77084 0 0 0 39.770697,39.7707 39.77084,39.77084 0 0 0 39.77122,-39.7707 39.77084,39.77084 0 0 0 -39.77122,-39.7707 z m 0,7.95404 a 31.816671,31.816671 0 0 1 31.81667,31.81666 31.816671,31.816671 0 0 1 -31.81667,31.81666 31.816671,31.816671 0 0 1 -31.81666,-31.81666 31.816671,31.816671 0 0 1 31.81666,-31.81666 z"
              />
              <path
                id="rect2-9"
                style="fill:#ff0000;fill-rule:evenodd;stroke-width:0.323001"
                d="m 105.01611,134.43661 a 4.9731161,4.9731161 45.185653 0 1 4.95698,4.9892 v 18.14837 a 4.9892041,4.9892041 135 0 1 -4.9892,4.9892 4.9731161,4.9731161 45.185653 0 1 -4.95698,-4.9892 l 0,-18.14837 a 4.9892041,4.9892041 135 0 1 4.9892,-4.9892 z"
                transform="matrix(0.70710678,-0.70710678,1.0700174,1.0700174,-128.14379,63.848635)"
              />
              <path
                id="rect2-9-9"
                style="fill:#ff0000;fill-rule:evenodd;stroke-width:0.323001"
                d="m 105.01611,134.43661 a 4.9731161,4.9731161 45.185653 0 1 4.95698,4.9892 v 18.14837 a 4.9892041,4.9892041 135 0 1 -4.9892,4.9892 4.9731161,4.9731161 45.185653 0 1 -4.95698,-4.9892 l 0,-18.14837 a 4.9892041,4.9892041 135 0 1 4.9892,-4.9892 z"
                transform="matrix(0.70710678,0.70710678,-1.0700174,1.0700174,189.65136,-84.643789)"
              />
            </g>
          </svg>
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
