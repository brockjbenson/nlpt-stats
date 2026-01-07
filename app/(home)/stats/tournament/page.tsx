import { redirect } from "next/navigation";

export default function TournamentStatsRedirect() {
  const currentYear = new Date().getFullYear();
  redirect(`/stats/tournament/${currentYear}`);
}
