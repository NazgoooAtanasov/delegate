import { render } from "preact";
import React, { useEffect } from "preact/compat";
import Activities from "./components/Activities";
import { Mission, type Activities as ActivitiesType } from "./entities";
import { useSignal } from "@preact/signals";

function SidePanel() {
  const activities = useSignal<ActivitiesType>([]);
  const currentMission = useSignal<Mission | null>(null);

  useEffect(() => {
    chrome.runtime
      .sendMessage({ eventName: "getActivities" })
      .then((result) => (activities.value = result.data!))
      .catch((error) => console.error("There was an error getting activities", error));

    chrome.runtime
      .sendMessage({ eventName: "getCurrentMission" })
      .then((result) => (currentMission.value = result.data!))
      .catch((error) => console.log("There was an error getting the current mission", error));
  }, []);

  return <Activities mission={currentMission} activities={activities} />;
}

render(<SidePanel />, document.body);
