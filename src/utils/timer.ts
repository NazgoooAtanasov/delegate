export const timerRegex = /^(?<time>\d{1,2})min$/;

type CalcDiff = {
  hours: number;
  minutes: number;
  seconds: number;
};

export function calcTimerDiff(timeDiff: number): CalcDiff {
  const days = Math.floor(timeDiff / (60 * 60 * 24));
  timeDiff -= days * 60 * 60 * 24;

  const calcDiff: CalcDiff = {
    hours: 0,
    minutes: 0,
    seconds: 0,
  };

  calcDiff.hours = Math.floor((timeDiff / (60 * 60)) % 24);
  timeDiff -= calcDiff.hours * 60 * 60;

  calcDiff.minutes = Math.floor((timeDiff / 60) % 60);
  timeDiff -= calcDiff.minutes * 60;

  calcDiff.seconds = Math.floor(timeDiff);

  return calcDiff;
}
