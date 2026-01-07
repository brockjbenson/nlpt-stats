import { redirect } from "next/navigation";

export default function StatsRedirect() {
  const currentYear = new Date().getFullYear();
  redirect(`/stats/cumulative/${currentYear}`);
}
