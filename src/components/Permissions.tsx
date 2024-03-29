import { useSignal } from "@preact/signals";
import React, { useEffect } from "preact/compat";
import { ResultAsync, resultAsync } from "../utils";
import { AddIcon, ConfirmIcon, RemoveIcon } from "./Icons";

type Permission = { id: number; url: string };
type Permissions = Permission[];

function Permission({ permission, removePermission }: { permission: Permission; removePermission: () => Promise<void> }) {
  return (
    <div className="m-[5px] grid grid-cols-[minmax(90%,_auto)_auto] grid-rows-[40px] text-base">
      <div className="rounded-md bg-gray-400 p-[10px]">{permission.url}</div>
      <button onClick={removePermission} className="mb-[5px] ml-[3px] mt-[5px] outline-none">
        <RemoveIcon className="h-auto max-h-full max-w-full" />
      </button>
    </div>
  );
}

export default function Permissions() {
  const showNewField = useSignal(false);
  const permissions = useSignal<Permissions>([]);
  const newPermissionUrl = useSignal("");

  chrome.runtime.onMessage.addListener((message: { eventName: "urlPermissionRemoved"; id: number }) => {
    if (message.eventName !== "urlPermissionRemoved") {
      return false;
    }

    permissions.value = permissions.value.filter((permission) => permission.id !== message.id);

    return false;
  });

  async function addPermission() {
    if (newPermissionUrl.value.length <= 0) {
      return;
    }

    const response = (await resultAsync(
      chrome.runtime.sendMessage({
        eventName: "addURLPermission",
        url: newPermissionUrl.value,
      }),
      "bare",
    )) as ResultAsync<number>;

    if (response.error) {
      console.error("There was an error trying to add permission", response.error);
      return;
    }

    showNewField.value = false;
    permissions.value = [...permissions.value, { id: response.data!, url: newPermissionUrl.value }];
    newPermissionUrl.value = "";
  }

  async function removePermission(id: number) {
    const result = (await resultAsync(
      chrome.runtime.sendMessage({
        eventName: "removeURLPermission",
        id,
      }),
      "bare",
    )) as ResultAsync<number>;

    if (result.error) {
      console.error("There was an error trying to remove permission", result.error);
      return;
    }

    permissions.value = permissions.value.filter((permission) => permission.id !== id);
  }

  (async () => {
    const response: ResultAsync<Permissions> = (await resultAsync(
      chrome.runtime.sendMessage({
        eventName: "getURLPermissions",
      }),
      "bare",
    )) as ResultAsync<Permissions>;

    if (response.error) {
      console.error("There was an error getting the permissions", response.error);
      return;
    }

    permissions.value = response.data!;
  })();

  return (
    <div>
      {permissions.value.map((permission, key) => (
        <Permission key={key} permission={permission} removePermission={() => removePermission(permission.id)} />
      ))}
      {showNewField.value && (
        <div className="m-[5px] grid grid-cols-[minmax(90%,_auto)_auto] grid-rows-[40px] text-base">
          <input
            className="rounded-md bg-gray-400 p-[10px] placeholder-gray-100"
            onChange={(e) => (newPermissionUrl.value = (e.target as HTMLInputElement).value)}
            placeholder="URL"
          />
          <button onClick={addPermission} className="mb-[5px] ml-[3px] mt-[5px] outline-none">
            <ConfirmIcon className="h-auto max-h-full max-w-full" />
          </button>
        </div>
      )}
      <button onClick={() => (showNewField.value = !showNewField.value)} className="mb-0 ml-auto mr-auto mt-0 flex h-[30px] w-[30px]">
        <AddIcon className="h-auto max-h-full max-w-full" />
      </button>
    </div>
  );
}
