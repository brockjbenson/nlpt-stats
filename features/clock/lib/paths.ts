// Where the clock screens live, so links, redirects and revalidation agree.
export const CLOCKS_PATH = "/admin/clock";
export const NEW_CLOCK_PATH = `${CLOCKS_PATH}/new`;

// The admin control screen for one clock.
export function clockControlPath(id: string): string {
  return `${CLOCKS_PATH}/${id}`;
}

// The public display for one clock: no sign-in needed.
export function clockDisplayPath(id: string): string {
  return `/clock/${id}`;
}

// Where a clock's current and upcoming levels are edited.
export function clockLevelsPath(id: string): string {
  return `${CLOCKS_PATH}/${id}/levels`;
}

// Where a finished clock's results are reviewed and saved.
export function clockFinishPath(id: string): string {
  return `${CLOCKS_PATH}/${id}/finish`;
}

// A saved tournament's page.
export function tournamentPath(year: number, id: string): string {
  return `/tournaments/${year}/${id}`;
}
