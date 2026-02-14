import {
  HeaderSelector,
  HeaderSelectorItem,
  HeaderSelectorContent,
  HeaderSelectorTrigger,
} from "@/components/page-header/year-selector";
import { ChevronDown } from "lucide-react";

function PageHeaderSelect({ page }: { page: "users" | "invitations" }) {
  return (
    <HeaderSelector>
      <HeaderSelectorTrigger className="w-fit text-xl flex items-center gap-2 group font-bold justify-center mx-auto">
        {page === "users" ? " Users" : " Invitations"}
        <ChevronDown className="ml-1 group-data-[state=open]:rotate-180 size-4" />
      </HeaderSelectorTrigger>
      <HeaderSelectorContent>
        <HeaderSelectorItem active={page === "users"} href="/admin/users">
          Users
        </HeaderSelectorItem>
        <HeaderSelectorItem
          active={page === "invitations"}
          href="/admin/users/invitations">
          Invitations
        </HeaderSelectorItem>
      </HeaderSelectorContent>
    </HeaderSelector>
  );
}

export default PageHeaderSelect;
