import "./style/index.css";
import { render } from "preact";
import React, { useEffect } from "preact/compat";
import { resultAsync } from "./utils";
import Permissions, { type Permissions as PermissionsType } from "./components/Permissions";
import { useSignal } from "@preact/signals";

function NavButton({ name, onClick }: { name: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="h-full p-[10px]">
      {name}
    </button>
  );
}

function Nav() {
  async function openSidePanel() {
    const tabs = await resultAsync(
      chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      }),
      "resultfiy",
    );

    if (tabs.error) {
      console.error("There was an error getting the current tab", tabs.error);
      return;
    }

    const [tab] = tabs.data ?? [];
    if (!tab) {
      console.error("There is no active tab");
      return;
    }

    const open = await resultAsync(
      chrome.sidePanel.open({
        tabId: tab.id,
        windowId: tab.windowId,
      }),
      "resultfiy",
    );

    if (open.error) {
      console.error("There was an error opening the side panel", open.error);
    }
  }

  async function openReports() {
    const openTab = await resultAsync(chrome.tabs.create({ active: true, url: "reports.html" }), "resultfiy");

    if (openTab.error) {
      console.error("There was an error opening the reports tab", openTab.error);
      return;
    }
  }

  return (
    <nav className="basis-1/6 text-xl">
      <NavButton name="Reports" onClick={openReports} />
      <NavButton name="Side panel" onClick={openSidePanel} />
    </nav>
  );
}

function Body() {
  const permissions = useSignal<PermissionsType>([]);

  useEffect(() => {
    chrome.runtime
      .sendMessage({
        eventName: "getURLPermissions",
      })
      .then((response) => {
        permissions.value = response.data!;
      })
      .catch((error) => {
        console.error("There was an error getting the permissions", error);
      });
  }, []);

  return (
    <section className="basis-5/6">
      <Permissions permissions={permissions} />
    </section>
  );
}

function Root() {
  return (
    <main className="flex size-[500px] flex-col font-mono">
      <Nav />
      <Body />
    </main>
  );
}

const App = <Root />;

render(App, document.body);
