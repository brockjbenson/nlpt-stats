import { Member } from "@/utils/types";
import Image from "next/image";
import React from "react";
import { FaCircleUser } from "react-icons/fa6";

function MemberInfo({ member }: { member: Member | null }) {
  return (
    <div className="flex flex-col gap-2 w-full items-center justify-center">
      {member ? (
        <>
          <figure className="w-3/5 rounded-full relative aspect-square overflow-hidden flex items-center justify-center">
            <Image
              className="w-full h-full absolute object-cover"
              src={member.portrait_url}
              alt={member.last_name}
              width={150}
              height={150}
            />
          </figure>
        </>
      ) : (
        <FaCircleUser className="w-3/5 aspect-square h-auto text-muted" />
      )}
    </div>
  );
}

export default MemberInfo;
