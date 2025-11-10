import { cn } from "@/lib/utils";
import { FaLongArrowAltUp } from "react-icons/fa";

interface Props {
  label: string;
  direction: "asc" | "desc";
  onSort: () => void;
  isSorted: false | "asc" | "desc";
}

function SortButton({ label, direction, onSort, isSorted, ...props }: Props) {
  return (
    <button
      onClick={onSort}
      className="cursor-pointer flex items-center gap-1 select-none"
      {...props}>
      {label}
      <FaLongArrowAltUp
        className={cn(
          "w-3 h-3",
          direction === "asc" && "rotate-180",
          !isSorted && "opacity-0"
        )}
      />
    </button>
  );
}

export default SortButton;
