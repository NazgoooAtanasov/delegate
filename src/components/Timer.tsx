import { useSignal } from "@preact/signals";
import React, { useEffect, useMemo } from "preact/compat";

const useTimer = (callback: () => void, pollTime: number = 1000) => {
  useEffect(() => {
    const id = setInterval(callback, pollTime);
    return () => clearInterval(id);
  }, [callback]);
};

export default function Timer() {
  // @TODO: the timer should be configurable instead of being hardcoded for 15mins
  const target = useMemo(() => {
    const target = new Date();
    target.setMinutes(target.getMinutes() + 15);
    return target;
  }, []);

  const hours = useSignal(0);
  const minutes = useSignal(0);
  const seconds = useSignal(0);
  const timerState = useSignal<"good" | "warning" | "bad">("good");

  useTimer(() => {
    const current = new Date();

    // put manual clearence of the interval here

    let diff = Math.floor(target.getTime() - current.getTime()) / 1000;

    const days = Math.floor(diff / (60 * 60 * 24));
    diff -= days * 60 * 60 * 24;

    hours.value = Math.floor((diff / (60 * 60)) % 24);
    diff -= hours.value * 60 * 60;

    minutes.value = Math.floor((diff / 60) % 60);
    diff -= minutes.value * 60;

    seconds.value = Math.floor(diff);

    if (current.getTime() > target.getTime()) {
      timerState.value = "bad";
    } else if (minutes.value <= 1) {
      timerState.value = "warning";
    } else {
      timerState.value = "good";
    }
  }, 1000);
  return (
    <div
      className={`text-lg ${timerState.value === "good" && "text-green-700"} ${timerState.value === "warning" && "text-yellow-700"} ${timerState.value === "bad" && "text-red-700"}`}
    >
      {hours.value <= 9 ? `0${hours.value}` : hours.value}:{minutes.value <= 9 ? `0${minutes.value}` : minutes.value}:
      {seconds.value <= 9 ? `0${seconds.value}` : seconds.value}
    </div>
  );
}
