import { redirect } from "next/navigation";

export default function CumulativeStatsRedirect() {
  const currentYear = new Date().getFullYear();
  redirect(`/stats/cumulative/${currentYear}`);
}
