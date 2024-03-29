import { render } from "preact";
import React, { useEffect } from "preact/compat";
import Activities, { type Activities as ActivitiesType } from "./components/Activities";
import { useSignal } from "@preact/signals";

function SidePanel() {
  const activities = useSignal<ActivitiesType>([]);

  useEffect(() => {
    chrome.runtime
      .sendMessage({ eventName: "getActivities" })
      .then((result) => (activities.value = result.data!))
      .catch((error) => console.error("There was an error getting activities", error));
  }, []);

  return (
    <div>
      <h1>Side panel</h1>
      <Activities activities={activities} />
    </div>
  );
}

render(<SidePanel />, document.body);
