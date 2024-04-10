import { useSignal } from "@preact/signals";
import { render } from "preact";
import React, { useEffect } from "preact/compat";
import { Missions } from "./entities";

function Reports() {
  const missions = useSignal<Missions>([]);

  useEffect(() => {
    chrome.runtime
      .sendMessage({ eventName: "getMissions" })
      .then((result) => (missions.value = result.data!))
      .catch((error) => console.error("There was an error getting activities", error));
  }, []);

  return (
    <>
      {missions.value.map((mission) => (
        <section>
          <h3>Mission name: {mission.name}</h3>
          <div> active: {mission.active ? "true" : "false"}</div>
          <div> running: {mission.running ? "true" : "false"}</div>
          <div> missionTime: {mission.missionTime}</div>
          <div> startTime: {mission.startTime ? new Date(mission.startTime).toString() : "N\\A"}</div>
          <div> endTime: {mission.endTime ? new Date(mission.endTime).toString() : "N\\A"}</div>

          {mission.activities.map((activity) => (
            <div>
              <h4>Activity</h4>
              <div> action: {activity.action}</div>
              <div> url: {activity.url}</div>
              <div> activityTitle: {activity.activityTitle}</div>
              <div> elementName: {activity.elementName}</div>
              <div> attributes: {activity.attributes}</div>
              <div> selector: {activity.selector}</div>
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

render(<Reports />, document.body);
