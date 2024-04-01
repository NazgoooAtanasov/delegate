import React, { useEffect, useRef } from "preact/compat";
import { ArrowDownIcon, ArrowUpIcon, ConfirmIcon, RemoveIcon } from "./Icons";
import { type Activity } from "./Activities";
import Prismjs from "prismjs";
import { useSignal } from "@preact/signals";
import { ResultAsync, resultAsync } from "../utils";

Prismjs.manual = true;
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

export default function Activity({ activity, deleteActivity }: { activity: Activity; deleteActivity: () => void }) {
  const expand = useSignal(false);
  const edit = useSignal(false);
  const inputField = useRef(null);

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

  function toggleEditTitle() {
    edit.value = !edit.value;
  }

  async function saveTitle() {
    const result = (await resultAsync(
      chrome.runtime.sendMessage({
        eventName: "updateActivity",
        id: activity.id,
        title: (inputField!.current! as HTMLInputElement).value,
      }),
      "bare",
    )) as ResultAsync<void>;

    if (result.error && !result.data) {
      console.warn("There was an error updating activity", result.error);
      return;
    }

    activity.activityTitle = (inputField!.current! as HTMLInputElement).value;
    toggleEditTitle();
  }

  useEffect(() => {
    if (edit.value) {
      (inputField!.current! as HTMLInputElement).focus();
    }
  }, [edit.value]);

  return (
    <>
      <div class="grid max-h-[60px] grid-cols-[minmax(95%,_auto)_5%] grid-rows-[60px]">
        <div className="mb-[5px] mt-[5px] flex min-w-0 max-w-full justify-between rounded-md bg-gray-400 p-[10px] text-lg">
          <h3 className="flex min-w-0 max-w-full">
            <span className="text-green-300">{activity.action}</span>:&nbsp;
            {edit.value ? (
              <input
                ref={inputField}
                value={activity.activityTitle}
                className="ml-[5px] mr-[5px] bg-inherit outline-none placeholder:text-gray-800"
                type="text"
                placeholder="Edit title..."
              />
            ) : (
              <button
                onClick={toggleEditTitle}
                className="overflow-hidden text-ellipsis whitespace-nowrap rounded-md pl-[5px] pr-[5px] transition hover:bg-gray-500"
              >
                {activity.activityTitle}
              </button>
            )}
          </h3>
          <button className="max-w-[20px] flex-shrink-0 shadow-xl" onClick={expandActivityDetails}>
            {expand.value ? (
              <ArrowUpIcon className="h-auto max-h-full max-w-full" />
            ) : (
              <ArrowDownIcon className="h-auto max-h-full max-w-full" />
            )}
          </button>
        </div>
        {edit.value ? (
          <button onClick={() => saveTitle()} className="mb-[5px] ml-[3px] mt-[5px] outline-none">
            <ConfirmIcon className="h-auto max-h-full max-w-full" />
          </button>
        ) : (
          <button onClick={deleteActivity} className="mb-[5px] ml-[3px] mt-[5px] outline-none">
            <RemoveIcon className="h-auto max-h-full max-w-full" />
          </button>
        )}
      </div>
      {expand.value ? (
        <div className="mb-[5px] mt-[5px] rounded-md bg-green-100 p-[10px]">
          <div title={activity.url} className="overflow-hidden text-ellipsis">
            at: {activity.url}
          </div>
          <CodeSegment element={element} />
          <div>
            <button className="mb-[5px] mt-[5px] rounded-md bg-red-200 p-[5px] shadow-xl" onClick={scrollIntoView}>
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
