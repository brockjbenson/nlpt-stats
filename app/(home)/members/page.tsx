import { createClient } from "@/utils/supabase/server";
import { User2 } from "lucide-react";
import Image from "next/image";
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
          <li className="border-b border-neutral-400 py-8" key={member.id}>
            <Link
              className="grid group/member grid-cols-[80px_1fr] gap-8"
              href={`/members/${member.id}`}>
              {member.portraitUrl ? (
                <div className="rounded-full overflow-hidden w-20 h-20 flex items-center justify-center">
                  <Image
                    src={member.portraitUrl}
                    alt={`${member.firstName}_${member.lastName}`}
                    width={100}
                    height={100}
                  />
                </div>
              ) : (
                <div className="rounded-full bg-muted overflow-hidden w-20 h-20 flex items-center justify-center">
                  <User2
                    className="fill-muted-foreground relative top-3 w-28 h-28"
                    stroke="neutral-500"
                  />
                </div>
              )}
              <ul className="flex flex-col justify-center">
                <li className="flex gap-2">
                  <span className="group-hover/member:text-primary text-lg font-semibold transition">
                    {member.firstName} {member.lastName}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted">Nickname:</span>
                  <span>{member.nickname}</span>
                </li>
              </ul>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default Members;
