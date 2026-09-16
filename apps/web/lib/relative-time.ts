const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export const relativeFrom = (updatedAt: number, now: number): string => {
  const delta = Math.max(0, now - updatedAt);
  if (delta < MINUTE) {
    return "たった今";
  }
  if (delta < HOUR) {
    return `${String(Math.floor(delta / MINUTE))}分前`;
  }
  if (delta < DAY) {
    return `${String(Math.floor(delta / HOUR))}時間前`;
  }
  return `${String(Math.floor(delta / DAY))}日前`;
};

export const publishedThisWeek = (
  updatedAt: number,
  hasProduction: boolean,
  now: number
): boolean => hasProduction && now - updatedAt < WEEK;
