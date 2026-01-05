import MemberImage from "@/components/members/member-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Member, POYData, SeasonCashStats } from "@/utils/types";
import Link from "next/link";

type StatItem = SeasonCashStats | POYData;

// Reusable stat card component with proper typing
interface StatCardProps<T extends StatItem> {
  title: string;
  data: T[];
  onOpenChange?: (open: boolean) => void; // ✅ Add this prop
  renderValue: (item: T) => React.ReactNode;
  renderDrawerColumns: () => React.ReactNode;
  renderDrawerRows: (item: T) => React.ReactNode;
  members?: Member[];
}

function StatCard<T extends StatItem>({
  title,
  data,
  onOpenChange,
  renderValue,
  renderDrawerColumns,
  renderDrawerRows,
  members,
}: StatCardProps<T>) {
  const topThree = data.slice(0, 3);

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
            <DrawerTitle>{title}</DrawerTitle>
            <div className="grid mt-4 w-full">
              {renderDrawerColumns()}
              {data.map((item) => renderDrawerRows(item))}
            </div>
          </DrawerContent>
        </Drawer>
        <CardContent>
          <div className="flex flex-col gap-4">
            {topThree.map((item, index) => {
              const memberData = members?.find(
                (member) => member.id === item.member_id
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
