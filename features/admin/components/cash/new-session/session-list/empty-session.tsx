import { CardHeader, CardTitle } from "@/components/ui/card";
import { Member } from "@/utils/types";
import { PlusCircle } from "lucide-react";

const EmptySession = ({
  member,
  onClick,
}: {
  member: Member;
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}) => {
  return (
    <>
      <CardHeader>
        <button
          onClick={onClick}
          className="w-full h-10 col-span-2 flex items-center justify-between">
          <CardTitle>
            {member.first_name} {member.last_name.slice(0, 1)}
          </CardTitle>
          <PlusCircle className="text-primary pointer-events-none w-6 h-6 hover:text-primary-hover" />
        </button>
      </CardHeader>
    </>
  );
};

export default EmptySession;
