import { redirect } from "next/navigation";

interface Params {
  params: Promise<{ seasonId: string; weekId: string }>;
}

// A week has nothing to show beyond its sessions, so go straight to editing.
async function Page({ params }: Params) {
  const { seasonId, weekId } = await params;
  redirect(`/admin/stats/cash/${seasonId}/sessions/${weekId}/edit`);
}

export default Page;
