import MembersList from "@/components/admin/members";
import { createClient } from "@/utils/supabase/server";
import { Member } from "@/utils/types";
import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";

type MemberWithDebut = Member & {
  debutDate: string | null;
};

async function MembersAdmin() {
  const db = await createClient();
  const { data, error } = await db
    .from("members")
    .select("*")
    .order("last_name", { ascending: true });

  if (error) {
    return <p>Error fetching members: {error.message}</p>;
  }

  const memberDebutDates: MemberWithDebut[] = await Promise.all(
    data.map(async (member) => {
      const { data: debutDate } = await db.rpc("get_member_debut_date", {
        target_member_id: member.id,
      });
      return {
        ...member,
        debutDate: debutDate?.[0]?.created_at || null,
      };
    })
  );

  return (
    <>
      <div className="flex px-2 items-center justify-between">
        <h2 className=" text-2xl font-medium flex gap-2 items-end">
          Members
          <span className="text-lg font-normal text-muted">
            ({data?.length})
          </span>
        </h2>
        <Link
          className="bg-primary hover:bg-primary-hover transition border border-primary font-semibold text-background flex items-center gap-2 rounded py-2 px-4"
          href="/admin/members/add">
          Add <Plus className="w-4 h-4" />
        </Link>
      </div>
      <MembersList members={memberDebutDates} />
    </>
  );
}

export default MembersAdmin;
