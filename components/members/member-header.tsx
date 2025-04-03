import { Member } from "@/utils/types";
import Image from "next/image";
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
        <div className="w-full h-full bg-gradient-to-b from-white/5  to-black/70 to-[99%] z-10" />
        <Image
          className="w-full absolute h-auto"
          src={member.portrait_url}
          alt={member.first_name + " " + member.last_name}
          width={200}
          height={200}
        />
        <h1 className="text-3xl absolute bottom-[2.5rem] font-bold z-20 text-white">
          {member.first_name} {member.last_name}
        </h1>
        <p className="absolute bottom-4 font-medium z-20 text-white">
          Joined:{" "}
          {new Date(joinDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </figure>
    </>
  );
}

export default MemberHeader;
