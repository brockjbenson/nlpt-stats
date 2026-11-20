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
