import { Member } from "@/utils/types";
import Image from "next/image";
import { UserRound } from "lucide-react";
import React from "react";

function MemberHeader({
  member,
  joinDate,
}: {
  member: Member;
  joinDate: string;
}) {
  return (
    <>
      <figure className="w-full z-10 aspect-[8/7.5] h-auto overflow-hidden relative flex items-center justify-center">
        <div className="w-full h-full bg-linear-to-b from-white/5  to-black/70 to-99% z-10" />
        {member.portrait_url ? (
          <Image
            className="w-full absolute h-auto"
            src={member.portrait_url}
            alt={member.first_name + " " + member.last_name}
            width={200}
            height={200}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <UserRound className="w-1/3 h-1/3 text-muted-foreground" />
          </div>
        )}
        <h1 className="text-3xl absolute bottom-10 font-bold z-20 text-white">
          {member.first_name} {member.last_name}
        </h1>
        <p className="absolute bottom-4 font-medium z-20 text-white">
          Joined:{" "}
          {joinDate
            ? new Date(joinDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "—"}
        </p>
      </figure>
    </>
  );
}

export default MemberHeader;
