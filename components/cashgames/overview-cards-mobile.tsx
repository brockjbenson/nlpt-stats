import React from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "../ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import MemberImage from "@/components/members/member-image";
import { cn } from "@/lib/utils";

interface OverviewStatCardProps<T> {
  title: string;
  description?: string;
  data: T[];
  topCount?: number;
  nameKey: keyof T;
  valueKey: keyof T;
  members?: any[];
  formatValue?: (val: any) => string;
  sortFn?: (a: T, b: T) => number;
  valueTextColorFn?: (val: any) => string;
  extraColumns?: { label: string; render: (row: T) => React.ReactNode }[];
}

export function OverviewStatCard<T>({
  title,
  description,
  data,
  nameKey,
  valueKey,
  formatValue = (v) => v,
  sortFn,
  valueTextColorFn,
  topCount = 3,
  extraColumns = [],
}: OverviewStatCardProps<T>) {
  const sorted = sortFn ? [...data].sort(sortFn) : data;
  const top = sorted.slice(0, topCount);

  return (
    <div
      style={{ transform: "translate3D(0, 0, 0)" }}
      className="flex-[0_0_100%] min-w-0 pl-4">
      <Card className="relative">
        <CardTitle>{title}</CardTitle>
        <Drawer>
          <DrawerTrigger className="absolute underline top-2 mt-2 right-4 text-muted text-sm">
            Full List
          </DrawerTrigger>
          <DrawerContent className="h-4/5 rounded-t-[20px]">
            <DrawerHeader className="sticky top-0 bg-card z-10">
              <DrawerTitle>{title}</DrawerTitle>
              {description && (
                <DrawerDescription>{description}</DrawerDescription>
              )}
            </DrawerHeader>
            <Table className="mb-8">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  {extraColumns.map((col, i) => (
                    <TableHead key={i}>{col.label}</TableHead>
                  ))}
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((row: any, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-base">
                      <Link href={`/members/${row.member_id}`}>
                        {row.first_name || row[nameKey]}
                      </Link>
                    </TableCell>
                    {extraColumns.map((col, j) => (
                      <TableCell className="text-base" key={j}>
                        {col.render(row)}
                      </TableCell>
                    ))}
                    <TableCell
                      className={cn(
                        "text-right text-base font-semibold",
                        valueTextColorFn
                          ? valueTextColorFn(row[valueKey])
                          : "text-white"
                      )}>
                      {formatValue ? formatValue(row[valueKey]) : row[valueKey]}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DrawerContent>
        </Drawer>

        <div className="flex flex-col gap-4 mt-4">
          {top.map((row: any, i) => (
            <div key={i} className="flex items-center justify-between">
              <Link
                href={`/members/${row.member_id}`}
                className="flex items-center gap-4">
                <MemberImage
                  loading="lazy"
                  className="w-10 h-10"
                  src={row.portrait_url}
                  alt={row.first_name}
                />
                <h3 className="text-base md:text-xl font-medium">
                  {row.first_name}
                </h3>
              </Link>
              <p
                className={cn(
                  "font-semibold text-lg md:text-xl",
                  valueTextColorFn
                    ? valueTextColorFn(row[valueKey])
                    : "text-white"
                )}>
                {formatValue && formatValue(row[valueKey])}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
