import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Member } from "@/utils/types";
import React from "react";

interface MemberSelectorProps {
  selectedMemberIds: string[];
  setSelectedMemberIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedMember: React.Dispatch<React.SetStateAction<Member | null>>;
  members: Member[];
  value?: Member | null;
}

function CompareMemberSelect({
  selectedMemberIds,
  setSelectedMemberIds,
  value,
  setSelectedMember,
  members,
}: MemberSelectorProps) {
  return (
    <Select
      onValueChange={(val) => {
        setSelectedMemberIds((prev) => {
          // Don't add if already selected
          if (prev.includes(val)) {
            return prev;
          }

          // If we already have a value for this selector, replace it
          if (value) {
            return prev.map((id) => (id === value.id ? val : id));
          }

          // Otherwise, only add if we have less than 2 members
          if (prev.length >= 2) {
            return prev;
          }

          return [...prev, val];
        });
        const selected = members.find((member) => member.id === val) || null;
        setSelectedMember(selected);
      }}
      value={value ? value.id : undefined}>
      <SelectTrigger className="flex items-center text-base font-semibold justify-center">
        {value
          ? `${value.first_name} ${value.last_name.slice(0, 1)}`
          : "Select a member"}
      </SelectTrigger>
      <SelectContent>
        {members.map((member) => (
          <SelectItem
            disabled={selectedMemberIds.includes(member.id)}
            key={member.id}
            value={member.id}>
            {member.first_name} {member.last_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default CompareMemberSelect;
