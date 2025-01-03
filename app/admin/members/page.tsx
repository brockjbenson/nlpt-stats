import MembersList from "@/components/admin/members";
import { createClient } from "@/utils/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";

async function MembersAdmin() {
  const db = await createClient();
  const { data, error } = await db
    .from("members")
    .select("*")
    .order("lastName", { ascending: true });

  if (error) {
    return <p>Error fetching members: {error.message}</p>;
  }

  return (
    <>
      <div className="flex items-center justify-between">
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
      <MembersList members={data} />
    </>
  );
}

export default MembersAdmin;
