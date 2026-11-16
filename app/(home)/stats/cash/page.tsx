import { getCurrentYear } from "@/lib/data/current-year";
import { redirect } from "next/navigation";

export default async function CashStatsRedirect() {
  redirect(`/stats/cash/${await getCurrentYear()}`);
}
