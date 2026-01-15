import { CashSession, Member, Week } from "@/utils/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Minus } from "lucide-react";

interface Props {
  data: CashSession[];
  year: string;
  weeks?: Week[];
  members: Member[];
  className?: string;
}

function SessionsTable({ data, members, weeks, year, className }: Props) {
  return (
    <div className="w-full max-w-(--breakpoint-xl) mx-auto mt-4 px-2">
      <Card className="w-full mb-8">
        <CardHeader>
          <CardTitle className="">{year} Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className={cn(className)}>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold sticky left-0 bg-card z-10">
                  Member
                </TableHead>
                {weeks?.map((week) => (
                  <TableHead key={week.id}>Week {week.week_number}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const session = data.find(
                  (session) => session.member_id === member.id
                );
                if (!session) return null;
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-bold bg-card sticky left-0 z-10">
                      <Link
                        scroll={true}
                        className="hover:text-primary"
                        href={`/members/${member.id}`}>
                        {member.first_name}
                      </Link>
                    </TableCell>
                    {weeks?.map((week) => {
                      const sessionForWeek = data.find(
                        (session) =>
                          session.member_id === member.id &&
                          session.week_id === week.id
                      );
                      return (
                        <TableCell
                          key={week.id}
                          className={getProfitTextColor(
                            sessionForWeek?.net_profit || 0
                          )}>
                          {sessionForWeek ? (
                            formatMoney(sessionForWeek.net_profit)
                          ) : (
                            <Minus className="mx-auto size-4" />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default SessionsTable;
