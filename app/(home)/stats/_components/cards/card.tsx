import MemberImage from "@/components/members/member-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { X } from "lucide-react";
import { StatsData } from "../../_lib/types";
import { Member } from "@/utils/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

type StatItem = StatsData;

// Reusable stat card component with proper typing
interface StatCardProps<T extends StatItem> {
  title: string;
  data: T[];
  onOpenChange?: (open: boolean) => void; // ✅ Add this prop
  renderValue: (item: T) => React.ReactNode;
  renderDrawerColumns: () => React.ReactNode;
  renderDrawerRows: (item: T) => React.ReactNode;
  members?: Member[];
  // Heading for visible members missing from `data` (e.g. didn't play this season)
  unlistedLabel?: string;
}

function StatCard<T extends StatItem>({
  title,
  data,
  onOpenChange,
  renderValue,
  renderDrawerColumns,
  renderDrawerRows,
  members,
  unlistedLabel = "Did not play",
}: StatCardProps<T>) {
  const topThree = data.slice(0, 3);
  const listedIds = new Set(data.map((item) => item.member_id));
  const unlistedMembers = (members ?? [])
    .filter((member) => member.visible !== false && !listedIds.has(member.id))
    .sort((a, b) => a.first_name.localeCompare(b.first_name));

  const fullList = (
    <>
      <div className="grid mt-4 w-full">
        {renderDrawerColumns()}
        {data.map((item) => renderDrawerRows(item))}
      </div>
      {unlistedMembers.length > 0 && (
        <div className="grid mt-8 w-full">
          <div className="grid border-b border-neutral-600 pb-2 grid-cols-2">
            <span className="text-muted">{unlistedLabel}</span>
          </div>
          {unlistedMembers.map((member) => (
            <div
              key={`${member.id}-unlisted`}
              className="w-full grid grid-cols-2 py-3 border-b border-neutral-600"
            >
              <h3 className="text-base font-semibold md:text-xl text-muted">
                <Link href={`/members/${member.id}`}>{member.first_name}</Link>
              </h3>
              <p className="font-semibold text-base md:text-lg text-end text-muted">
                —
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="min-w-0">
      <Card className="relative">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <FullListView title={title} onOpenChange={onOpenChange}>
          {fullList}
        </FullListView>
        <CardContent className="mt-3">
          <div className="flex flex-col gap-4">
            {topThree.map((item, index) => {
              const memberData = members?.find(
                (member) => member.id === item.member_id,
              );

              return (
                <div
                  className="flex items-center justify-between"
                  key={`${item.member_id}-${index}`}
                >
                  <Link
                    href={`/members/${item.member_id}`}
                    className="flex items-center gap-4"
                  >
                    <MemberImage
                      loading="lazy"
                      className="w-10 h-10"
                      src={
                        memberData?.portrait_url ||
                        ("portrait_url" in item ? item.portrait_url : "") ||
                        ""
                      }
                      alt={item.first_name}
                    />
                    <h3 className="text-base md:text-xl font-medium">
                      {item.first_name}
                    </h3>
                  </Link>
                  {renderValue(item)}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const TRIGGER_CLASS = "absolute underline top-2 right-4 text-muted text-sm";

// Fade in when opened and out when closed (Radix waits for the exit animation
// before unmounting).
const FADE =
  "duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0";

// The card's "Full List": a bottom sheet on phones, a centered modal on
// desktop where a sheet spanning the whole width is awkward.
function FullListView({
  title,
  onOpenChange,
  children,
}: {
  title: string;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const isDesktop = useIsDesktop();

  if (!isDesktop) {
    return (
      <Drawer onOpenChange={onOpenChange}>
        <DrawerTrigger className={TRIGGER_CLASS}>Full List</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          {children}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger className={TRIGGER_CLASS}>Full List</DialogTrigger>
      <DialogPortal>
        <DialogOverlay className={cn("bg-black/50", FADE)} />
        {/* Styled like the stat cards. The title stays put and only the list
            scrolls, so the scrollbar stays clear of the rounded corners. */}
        <DialogContent
          aria-describedby={undefined}
          className={cn(
            "flex flex-col w-[calc(100vw-2rem)] max-w-lg max-h-[80vh] p-0 overflow-hidden",
            "bg-card text-card-foreground rounded-xl border border-border shadow-sm",
            FADE,
          )}
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-1">
            <DialogTitle>{title}</DialogTitle>
            <DialogClose
              aria-label="Close"
              className="text-muted hover:text-foreground"
            >
              <X className="size-5" />
            </DialogClose>
          </div>
          <div className="overflow-y-auto scrollbar-thin px-6 pb-6">
            {children}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

export default StatCard;
