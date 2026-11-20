// The installed app's names, which say "Staging" on the staging deployment
// so it can't be mixed up with the real app on a Home Screen. Read at build
// time: Vercel sets VERCEL_TARGET_ENV to a custom environment's name, and
// the staging environment builds from the staging branch.
const isStaging =
  process.env.VERCEL_TARGET_ENV?.toLowerCase() === "staging" ||
  process.env.VERCEL_GIT_COMMIT_REF === "staging";

const STAGING_SUFFIX = " (Staging)";

// The browser tab and the full app name.
export const APP_TITLE = isStaging
  ? `NLPT Stats${STAGING_SUFFIX}`
  : "NLPT Stats";
export const APP_FULL_NAME = `Northern Lights Poker Tour Stats${isStaging ? STAGING_SUFFIX : ""}`;
// The Home Screen label. iOS cuts it off at about 12 characters, so staging
// drops "Stats" rather than showing "NLPT Stats S…".
export const APP_SHORT_NAME = isStaging ? "NLPT Staging" : "NLPT Stats";
