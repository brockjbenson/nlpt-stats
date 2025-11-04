import { createClient } from "@/utils/supabase/server";
import React from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet";
import { RxHamburgerMenu } from "react-icons/rx";
import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { Button } from "../ui/button";
import { FaRankingStar } from "react-icons/fa6";
import { TbWorldStar } from "react-icons/tb";
import { FaChartLine } from "react-icons/fa6";
import { CgFileDocument } from "react-icons/cg";
import { LuBookMarked } from "react-icons/lu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { FaMoneyBill, FaTrophy, FaUsers } from "react-icons/fa";
import MobileAdminNav from "./mobile-admin-nav";

async function MobileNav() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = user?.user_metadata.role === "admin";
  return (
    <Sheet>
      <SheetTrigger asChild>
        <RxHamburgerMenu className="ml-auto" size={32} />
      </SheetTrigger>
      <SheetContent>
        <SheetTitle className="font-bold mb-4 text-2xl">NLPT Stats</SheetTitle>

        <div className="mb-8">
          <ul className="flex flex-col">
            <li>
              <Accordion type="single" collapsible>
                <AccordionItem className="!border-none" value="stats">
                  <AccordionTrigger className="w-full py-3 font-semibold">
                    <span className="flex items-center ml-1 gap-4">
                      <FaChartLine className="w-4 h-4" /> Stats
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="!border-none relative p-0 ml-10 after:flex after:h-[calc(100%-0.75rem)] after:w-[1.25px] after:bg-neutral-600 after:absolute after:-left-6 after:bottom-2">
                    <Link
                      className="w-full flex items-center gap-4 py-3"
                      href="/stats/career">
                      <CgFileDocument className="w-5 h-5 " /> Career
                    </Link>
                    <Link
                      className="w-full flex items-center gap-4 py-3"
                      href="/stats/cash">
                      <FaMoneyBill className="w-5 h-5 " /> Cash
                    </Link>
                    <Link
                      className="w-full flex items-center gap-4 pt-3 pb-6"
                      href="/stats/tournaments">
                      <FaTrophy className="w-5 h-5 " /> Tournaments
                    </Link>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </li>
            <li>
              <Link
                className="w-full flex items-center gap-4 py-3 font-semibold"
                href="/members">
                <FaUsers className="w-5 h-5" /> Members
              </Link>
            </li>
            <li>
              <Link
                className="w-full flex items-center gap-4 py-3 font-semibold"
                href="/poy">
                <FaRankingStar className="w-5 h-5" /> POY Standings
              </Link>
            </li>
            <li>
              <Link
                className="w-full flex items-center gap-4 py-3 font-semibold"
                href="/nlpi">
                <TbWorldStar className="w-5 h-5" /> NLPI Rankings
              </Link>
            </li>
            <li>
              <Link
                className="w-full flex items-center gap-4 py-3 font-semibold"
                href="/records">
                <LuBookMarked className="w-5 h-5" /> Records
              </Link>
            </li>
            {isAdmin && (
              <li>
                <MobileAdminNav />
              </li>
            )}
          </ul>
        </div>
        <div
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom))",
          }}
          className="mt-auto w-full">
          {user ? (
            <form action={signOutAction}>
              <Button
                type="submit"
                className="w-full font-semibold rounded py-4"
                variant={"outline"}>
                Sign out
              </Button>
            </form>
          ) : (
            <Button asChild className="w-full font-semibold rounded py-4">
              <Link
                className="w-full bg-primary font-bold text-base rounded py-4"
                href="/sign-in">
                Sign in
              </Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MobileNav;
