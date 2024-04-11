import { useSignal, useSignalEffect } from "@preact/signals";
import React, { useEffect, useMemo } from "preact/compat";
import { calcTimerDiff, timerRegex } from "../utils";

const useTimer = (callback: () => void, pollTime: number = 1000) => {
  useEffect(() => {
    const id = setInterval(callback, pollTime);
    return () => clearInterval(id);
  }, [callback]);
};

type TimerProps = {
  toCount: string;
  timerAboutToElapse?: () => void;
  timerElapsed?: () => void;
  className?: string;
};

export default function Timer({ toCount, timerAboutToElapse, timerElapsed, className = "" }: TimerProps) {
  let timerAboutToElapseSent = false;
  let timerElapsedSent = false;

  const target = useMemo(() => {
    const matches = toCount.match(timerRegex);
    const time = matches?.groups?.time;

    if (!time) {
      // @NOTE: idk if this should be like this. leaving it for now.
      return new Date();
    }

    const target = new Date();
    target.setMinutes(target.getMinutes() + parseInt(time));
    return target;
  }, []);

  const timerState = useSignal<"good" | "warning" | "bad">("good");
  useSignalEffect(() => {
    if (timerState.value === "warning" && !timerAboutToElapseSent && timerAboutToElapse) {
      timerAboutToElapse();
      timerAboutToElapseSent = true;
    }

    if (timerState.value === "bad" && !timerElapsedSent && timerElapsed) {
      timerElapsed();
      timerElapsedSent = true;
    }
  });

  const hours = useSignal(0);
  const minutes = useSignal(0);
  const seconds = useSignal(0);
  const timerCallback = useSignal<(() => void) | undefined>(undefined);
  const elapsedTimer = useSignal(new Date());

  function timer() {
    elapsedTimer.value = new Date();
    const diff = Math.floor(elapsedTimer.value.getTime() - target.getTime()) / 1000;
    const timerDiff = calcTimerDiff(diff);
    hours.value = timerDiff.hours;
    minutes.value = timerDiff.minutes;
    seconds.value = timerDiff.seconds;
  }

  function countDown() {
    const current = new Date();

    if (current.getTime() >= target.getTime()) {
      timerState.value = "bad";
      timerCallback.value = timer;
      return;
    }

    const diff = Math.floor(target.getTime() - current.getTime()) / 1000;
    const timerDiff = calcTimerDiff(diff);
    hours.value = timerDiff.hours;
    minutes.value = timerDiff.minutes;
    seconds.value = timerDiff.seconds;

    if (current.getTime() > target.getTime()) {
      timerState.value = "bad";
    } else if (minutes.value <= 1) {
      timerState.value = "warning";
    } else {
      timerState.value = "good";
    }
  }

  if (!timerCallback.value) {
    timerCallback.value = countDown;
  }
  useTimer(timerCallback.value, 1000);

  return (
    <div className={`text-sm ${className}`}>
      Elapsed time:
      <span
        className={`ml-[3px] ${timerState.value === "good" && "text-green-700"} ${timerState.value === "warning" && "animate-pulse text-yellow-700"} ${timerState.value === "bad" && "text-red-700"}`}
      >
        {timerState.value === "bad" && "-"}
        {hours.value <= 9 ? `0${hours.value}` : hours.value}:{minutes.value <= 9 ? `0${minutes.value}` : minutes.value}:
        {seconds.value <= 9 ? `0${seconds.value}` : seconds.value}
      </span>
    </div>
  );
}
