import { redirect } from "next/navigation";

export default function TournamentsRedirect() {
  const currentYear = new Date().getFullYear();
  redirect(`/tournaments/${currentYear}`);
}
