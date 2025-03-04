import ErrorHandler from "@/components/error-handler";
import MemberCard from "@/components/members/member-card";
import PageHeader from "@/components/page-header/page-header";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import React from "react";

async function Members() {
  const db = await createClient();
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
  const members = data;
  return (
    <>
      <PageHeader title="Members" />
      <div className="w-full mt-4 px-2 max-w-screen-xl mx-auto">
        <ul className="w-full grid grid-cols-1 md:grid-cols-3 gap-x-12">
          {members.map((member) => (
            <li key={member.id}>
              <Link href={`/members/${member.id}`}>
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
