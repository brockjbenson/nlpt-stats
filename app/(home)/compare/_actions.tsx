import { getMembers } from "@/lib/data/league";

export default async function fetchMembersAction() {
  const { data, error } = await getMembers();

  return {
    members: data ?? [],
    error: error ?? null,
  };
}
