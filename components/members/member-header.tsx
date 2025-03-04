import { Member } from "@/utils/types";
import Image from "next/image";
import React from "react";

function MemberHeader({ member }: { member: Member }) {
  return (
    <>
      <div>
        <figure className="w-full z-10 aspect-[8/7.5] h-auto overflow-hidden relative flex items-center justify-center">
          <div className="w-full h-full bg-gradient-to-b from-white/5 to-black/60 z-10" />
          <Image
            className="w-full absolute h-auto"
            src={member.portrait_url}
            alt={member.first_name + " " + member.last_name}
            width={200}
            height={200}
          />
          <h1 className="text-3xl absolute bottom-4 font-bold z-20 text-white">
            {member.first_name} {member.last_name}
          </h1>
        </figure>
      </div>
    </>
  );
}

export default MemberHeader;
