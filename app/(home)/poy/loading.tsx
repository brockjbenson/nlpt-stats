import PageHeader from "@/components/page-header/page-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";

function loading() {
  return (
    <div className="animate-pulse">
      <PageHeader skeleton />
      <div className="w-full mt-4 px-2 max-w-screen-xl mx-auto">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Last Week</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Points Behind</TableHead>
                <TableHead>Avg Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(10)].map((_, index) => (
                <TableRow key={index} className="w-full">
                  <TableCell>
                    <div className="w-[49px] h-[24px] bg-neutral-700 rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="w-[64px] h-[24px] bg-neutral-700 rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="w-[64px] h-[24px] bg-neutral-700 rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="w-[82px] h-[24px] bg-neutral-700 rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="w-[55px] h-[24px] bg-neutral-700 rounded"></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

export default loading;
