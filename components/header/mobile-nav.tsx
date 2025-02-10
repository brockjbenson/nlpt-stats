import React from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import { IoStatsChart } from "react-icons/io5";
import { HiUserGroup } from "react-icons/hi";
import { FaRankingStar, FaMedal } from "react-icons/fa6";

interface Props {
  className?: string;
  excludeAdmin?: boolean;
}

function MobileNav({ excludeAdmin, className }: Props) {
  return (
    <div className="px-2 lg:hidden block pt-2 z-[2340573245] pb-8 fixed bottom-0 bg-background left-0 w-screen border-t border-t-primary">
      <ul className="w-full grid gap-4 grid-cols-4">
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            className="flex flex-col items-center justify-center gap-1 text-sm font-semibold"
            href="/stats/2025">
            <IoStatsChart className="w-6 h-6" />
            Stats
          </Link>
        </li>
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            className="flex flex-col items-center justify-center gap-1 text-sm font-semibold"
            href="/stats">
            <HiUserGroup className="w-6 h-6" />
            Members
          </Link>
        </li>
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            className="flex flex-col items-center justify-center gap-1 text-sm font-semibold"
            href="/stats">
            <FaMedal className="w-6 h-6" />
            POY
          </Link>
        </li>
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            className="flex flex-col items-center justify-center gap-1 text-sm font-semibold"
            href="/stats">
            <FaRankingStar className="w-6 h-6" />
            NLPI
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default MobileNav;
