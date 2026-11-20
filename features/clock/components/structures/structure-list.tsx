import { ADMIN_ACTION_CLASS } from "@/components/admin-nav/admin-action";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import StructureCard from "@/features/clock/components/structures/structure-card";
import type { StructureWithLevels } from "@/features/clock/data/structures";
import { Timer } from "lucide-react";
import Link from "next/link";

const NEW_STRUCTURE_HREF = "/admin/clock/structures/new";

function AddTemplateLink() {
  return (
    <Link className={ADMIN_ACTION_CLASS} href={NEW_STRUCTURE_HREF}>
      Add Template
    </Link>
  );
}

function StructureList({ structures }: { structures: StructureWithLevels[] }) {
  if (structures.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Timer />
          </EmptyMedia>
          <EmptyTitle>No Blind Structures</EmptyTitle>
          <EmptyDescription>
            Add a template to set the levels, breaks, money and payouts a clock
            starts from.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <AddTemplateLink />
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="w-full px-2">
      <div className="mb-4 flex justify-end">
        <AddTemplateLink />
      </div>
      <ul className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {structures.map((structure) => (
          <li key={structure.id}>
            <StructureCard structure={structure} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StructureList;
