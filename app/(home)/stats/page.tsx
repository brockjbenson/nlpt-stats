import { getCurrentYear } from "@/lib/data/current-year";
import { redirect } from "next/navigation";

export default async function StatsRedirect() {
  redirect(`/stats/cumulative/${await getCurrentYear()}`);
}
