import ErrorHandler from "@/components/error-handler";
import MemberCard from "@/components/members/member-card";
import PageHeader from "@/components/page-header/page-header";
import Link from "next/link";
import React from "react";
import { getMemberDirectory } from "@/lib/data/league";

async function Members() {
  // Visible members with their debut dates, as one cached lookup
  const { data: memberDebutDates, error } = await getMemberDirectory();

  if (error) {
    return (
      <ErrorHandler
        title="Error fetching members"
        errorMessage={error.message}
        pageTitle="Members"
      />
    );
  }

  return (
    <>
      <PageHeader title="Members" />
      <div className="w-full px-2 max-w-(--breakpoint-xl) md:mt-8 mx-auto">
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
