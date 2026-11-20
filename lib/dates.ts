// A day ("2026-11-27") or a month ("2025-01") with no time.
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/;

// Reads a date the database sends without a time (a `date` column, or a
// "yyyy-mm" month) as that day at local midnight. `new Date("2026-11-27")`
// reads it as midnight UTC, which in US time zones is the evening before,
// so it showed a day (or, on the 1st, a month) early. Anything with a time
// is parsed as usual.
export function parseDateOnly(value: string): Date {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return new Date(value);
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, day ? Number(day) : 1);
}
