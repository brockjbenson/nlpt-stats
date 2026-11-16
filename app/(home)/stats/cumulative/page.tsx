import { getCurrentYear } from "@/lib/data/current-year";
import { redirect } from "next/navigation";

export default async function CumulativeStatsRedirect() {
  redirect(`/stats/cumulative/${await getCurrentYear()}`);
}
