import ErrorHandler from "@/components/error-handler";
import MemberCard from "@/components/members/member-card";
import PageHeader from "@/components/page-header/page-header";
import { Member } from "@/utils/types";
import Link from "next/link";
import React from "react";
import { createStaticClient } from "@/utils/supabase/static";

type MemberWithDebut = Member & {
  debutDate: string | null;
};

export const dynamic = "force-static";
export const revalidate = 3600; // Revalidate every hour (optional)

async function Members() {
  const db = createStaticClient();

  const { data, error } = await db
    .from("members")
    .select("*")
    .order("first_name", { ascending: true });

  if (error) {
    return (
      <ErrorHandler
        title="Error fetching members"
        errorMessage={error.message}
        pageTitle="Members"
      />
    );
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
      <PageHeader title="Members" />
      <div className="w-full mt-4 px-2 max-w-(--breakpoint-xl) md:mt-8 mx-auto">
        <h1 className="text-2xl font-semibold hidden mb-4 md:block">Members</h1>
        <ul className="w-full grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4">
          {memberDebutDates.map((member) => (
            <li key={member.id}>
              <Link scroll={true} href={`/members/${member.id}`}>
                <MemberCard member={member} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default Members;
