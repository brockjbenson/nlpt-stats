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

function NLPISkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between max-md:border-b md:sticky fixed top-0 max-md:border-b-neutral-500 w-full px-4 py-6 bg-background z-[394587]">
        <div className="h-[32px] bg-neutral-700 rounded w-16"></div>
        <div className="h-[32px] bg-neutral-700 rounded w-40"></div>
      </div>
      <div className="w-full mt-4 px-2 max-w-screen-xl mx-auto">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Last Week</TableHead>
                <TableHead>End 2024</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Avg Points</TableHead>
                <TableHead>Total Points</TableHead>
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
                    <div className="w-[55px] h-[24px] bg-neutral-700 rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="w-[50px] h-[24px] bg-neutral-700 rounded"></div>
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

export default NLPISkeleton;
