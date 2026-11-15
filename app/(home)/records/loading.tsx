import PageHeader from "@/components/page-header/page-header";
import { Skeleton } from "@/components/ui/skeleton";

// Records: the Career / Season / Session tabs, then record rows (photo,
// record title, holder and value).
export default function Loading() {
  return (
    <>
      <PageHeader skeleton title="Records" />
      <div
        className="flex px-2 flex-col gap-4 items-center justify-center"
        aria-busy="true"
        aria-label="Loading">
        <div className="flex w-full gap-4 border-b-2 border-white pb-2 md:mt-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
        <ul className="flex w-full flex-col gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="flex items-center gap-4">
              <Skeleton className="size-16 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
