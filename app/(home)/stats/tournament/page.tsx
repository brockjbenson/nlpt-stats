import { getCurrentYear } from "@/lib/data/current-year";
import { redirect } from "next/navigation";

export default async function TournamentStatsRedirect() {
  redirect(`/stats/tournament/${await getCurrentYear()}`);
}
