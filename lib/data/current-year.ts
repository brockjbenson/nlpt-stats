import { cacheLife } from "next/cache";

// The calendar year, for the pages and tabs that open on the current season.
// Next can't prebuild a page that reads the clock directly, so the year is
// cached like data: it's checked again hourly, so a new year shows up within
// the hour.
export async function getCurrentYear() {
  "use cache";
  cacheLife("hours");
  return new Date().getFullYear();
}
