import { redirect } from "next/navigation";

export const dynamic = "force-static";

export default function CashStatsRedirect() {
  const currentYear = new Date().getFullYear();
  redirect(`/stats/cash/${currentYear}`);
}
