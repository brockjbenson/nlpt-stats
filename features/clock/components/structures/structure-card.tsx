import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DeleteStructureButton from "@/features/clock/components/structures/delete-structure-button";
import DuplicateStructureButton from "@/features/clock/components/structures/duplicate-structure-button";
import type { StructureWithLevels } from "@/features/clock/data/structures";
import {
  formatChips,
  formatDollars,
  formatDuration,
  ordinal,
  plural,
} from "@/features/clock/lib/format";
import { summarizeLevels } from "@/features/clock/lib/structures";
import { Pencil } from "lucide-react";
import Link from "next/link";

function StructureCard({ structure }: { structure: StructureWithLevels }) {
  const { levelCount, breakCount, lengthMs } = summarizeLevels(
    structure.levels,
  );
  const editHref = `/admin/clock/structures/${structure.id}`;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="text-lg leading-tight">
          <Link href={editHref} className="hover:underline">
            {structure.name}
          </Link>
        </CardTitle>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={editHref} aria-label={`Edit ${structure.name}`}>
              <Pencil size={16} />
            </Link>
          </Button>
          <DuplicateStructureButton id={structure.id} name={structure.name} />
          <DeleteStructureButton id={structure.id} name={structure.name} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm text-muted">
        <p>
          {plural(levelCount, "level")} · {plural(breakCount, "break")} ·{" "}
          {formatDuration(lengthMs)}
        </p>
        <p>
          {formatDollars(structure.default_buy_in)} buy-in ·{" "}
          {formatDollars(structure.default_rebuy)} rebuy ·{" "}
          {formatChips(structure.default_starting_chips)} chips
        </p>
        <p>
          {structure.default_places_paid} paid:{" "}
          {structure.default_payout_pcts.join(" / ")} +{" "}
          {ordinal(structure.default_places_paid)} buy-in back · max{" "}
          {plural(structure.default_max_rebuys, "rebuy")}
        </p>
      </CardContent>
    </Card>
  );
}

export default StructureCard;
