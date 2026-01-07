import { redirect } from "next/navigation";

export default function CashStatsRedirect() {
  const currentYear = new Date().getFullYear();
  redirect(`/stats/cash/${currentYear}`);
}
