import { redirect } from "next/navigation";

export const dynamic = "force-static";

export default function CumulativeStatsRedirect() {
  const currentYear = new Date().getFullYear();
  redirect(`/stats/cumulative/${currentYear}`);
}
