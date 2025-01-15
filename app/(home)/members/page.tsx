import MemberCard from "@/components/members/member-card";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import React from "react";

async function Members() {
  const db = await createClient();
  const { data, error } = await db
    .from("members")
    .select("*")
    .order("lastName", { ascending: true });

  if (error) {
    return <p>Error fetching members: {error.message}</p>;
  }
  const members = data;
  return (
    <>
      <h1>Members</h1>
      <ul className="w-full grid grid-cols-3 gap-x-12">
        {members.map((member) => (
          <li key={member.id}>
            <Link href={`/members/${member.id}`}>
              <MemberCard member={member} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default Members;
