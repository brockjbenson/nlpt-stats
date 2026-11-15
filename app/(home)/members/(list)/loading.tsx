import PageHeader from "@/components/page-header/page-header";
import { Skeleton } from "@/components/ui/skeleton";

// Same grid as the members page: portrait card, name, two detail lines.
// Lives in the (list) group so it only covers /members, not /members/[id]
// (which has its own skeleton).
export default function Loading() {
  return (
    <>
      <PageHeader skeleton title="Members" />
      <div className="w-full px-2 max-w-(--breakpoint-xl) md:mt-8 mx-auto">
        <h1 className="text-2xl font-semibold hidden mb-4 md:block">Members</h1>
        <ul
          className="w-full grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4"
          aria-busy="true"
          aria-label="Loading">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i} className="flex flex-col gap-2">
              <Skeleton className="w-full aspect-6/7 rounded-[8px]" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
