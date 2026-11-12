import MemberImage from "@/components/members/member-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { StatsData } from "../../_lib/types";
import { Member } from "@/utils/types";
import Link from "next/link";

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

  return (
    <div className="flex-[0_0_100%] min-w-0 pl-4">
      <Card className="relative">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <Drawer onOpenChange={onOpenChange}>
          <DrawerTrigger className="absolute underline top-2 right-4 text-muted text-sm">
            Full List
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
            </DrawerHeader>
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
                    className="w-full grid grid-cols-2 py-3 border-b border-neutral-600">
                    <h3 className="text-base font-semibold md:text-xl text-muted">
                      <Link href={`/members/${member.id}`}>
                        {member.first_name}
                      </Link>
                    </h3>
                    <p className="font-semibold text-base md:text-lg text-end text-muted">
                      —
                    </p>
                  </div>
                ))}
              </div>
            )}
          </DrawerContent>
        </Drawer>
        <CardContent className="mt-3">
          <div className="flex flex-col gap-4">
            {topThree.map((item, index) => {
              const memberData = members?.find(
                (member) => member.id === item.member_id,
              );

              return (
                <div
                  className="flex items-center justify-between"
                  key={`${item.member_id}-${index}`}>
                  <Link
                    href={`/members/${item.member_id}`}
                    className="flex items-center gap-4">
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

export default StatCard;
