import { signOutAction } from "@/app/actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createClient } from "@/utils/supabase/server";
import { MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { FaMoneyBill, FaPlus, FaTrophy, FaUsers } from "react-icons/fa";
import {
  FaBookBookmark,
  FaGlobe,
  FaRankingStar,
  FaUserShield,
} from "react-icons/fa6";
import { LuList, LuListPlus } from "react-icons/lu";
import { TiPlus, TiPlusOutline } from "react-icons/ti";
import { GoPlus } from "react-icons/go";

async function MobileNav() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <Sheet>
      <SheetTrigger>
        <MenuIcon className="ml-auto" size={32} />
      </SheetTrigger>
      <SheetContent className="!px-0 gap-0" hideCloseButton side="right">
        <SheetTitle className="w-full border-b px-4 pb-4 mb-4 border-neutral-700 flex items-center gap-4">
          <Image
            src="/icons/nlpt-no-bg.png"
            alt="logo"
            width={40}
            height={40}
          />
          NLPT Stats
        </SheetTitle>
        <ul className="pl-6 flex flex-col gap-4">
          <li>
            <Link
              className="flex items-center gap-4 text-lg font-medium"
              href="/stats/tournaments">
              <FaTrophy className="w-5 h-5" />
              Tournaments
            </Link>
          </li>
          <li>
            <Link
              className="flex items-center gap-4 text-lg font-medium"
              href="/stats/cash?year=2025">
              <FaMoneyBill className="w-5 h-5" />
              Cash
            </Link>
          </li>
          <li>
            <Link
              className="flex items-center gap-4 text-lg font-medium"
              href="/members">
              <FaUsers className="w-5 h-5" />
              Members
            </Link>
          </li>
          <li>
            <Link
              className="flex items-center gap-4 text-lg font-medium"
              href="/poy">
              <FaRankingStar className="w-5 h-5" />
              POY Standings
            </Link>
          </li>
          <li>
            <Link
              className="flex items-center gap-4 text-lg font-medium"
              href="/nlpi">
              <FaGlobe className="w-5 h-5" />
              NLPI Rankings
            </Link>
          </li>
          <li>
            <Link
              className="flex items-center gap-4 text-lg font-medium"
              href="/records">
              <FaBookBookmark className="w-5 h-5" />
              Records
            </Link>
          </li>
          {user && (
            <li>
              <Accordion type="single" collapsible>
                <AccordionItem value="admin">
                  <AccordionTrigger className="p-0 pr-4">
                    <span className="flex items-center gap-4 text-lg font-medium">
                      <FaUserShield className="w-5 h-5" />
                      Admin
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="w-full mt-2">
                    <ul className="flex border-l-2 border-neutral-500 ml-1 pl-6 flex-col gap-4">
                      <li>
                        <Link
                          className="flex items-center gap-4"
                          href="/admin/stats/tournaments">
                          <FaTrophy className="w-5 h-5" /> Tournaments List
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="flex items-center gap-4"
                          href="/admin/stats/cash">
                          <FaMoneyBill className="w-5 h-5" />
                          Cash Sessions List
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="flex items-center gap-4"
                          href="/admin/stats/tournaments/new">
                          <FaPlus className="w-5 h-5" />
                          Add Tournament
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="flex items-center gap-4"
                          href="/admin/stats/cash/new">
                          <FaPlus className="w-5 h-5" />
                          Add Cash Session
                        </Link>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </li>
          )}
        </ul>
        {user ? (
          <form
            className="flex mt-auto w-64 items-start mx-auto justify-center"
            action={signOutAction}>
            <Button type="submit" className="w-full h-12" variant={"outline"}>
              Sign out
            </Button>
          </form>
        ) : (
          <Button
            asChild
            className="w-64 mt-auto mx-auto h-12"
            variant={"default"}>
            <Link
              className=" self-end ml-auto align-middle w-fit"
              href="/sign-in">
              Sign in
            </Link>
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default MobileNav;
