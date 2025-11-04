"use client";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import React from "react";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { FaListUl, FaMoneyBill, FaTrophy, FaUsers } from "react-icons/fa";
import { PiListPlusBold, PiListBulletsBold } from "react-icons/pi";

function MobileAdminNav() {
  const [adminOpen, setAdminOpen] = React.useState(false);
  return (
    <>
      <button
        onClick={() => setAdminOpen(true)}
        className="w-full flex items-center gap-4 py-3 font-semibold">
        <MdOutlineAdminPanelSettings className="w-5 h-5" /> Admin
        <ChevronRight className="ml-auto w-6 h-6" />
      </button>
      <div
        className={cn(
          "bg-black z-50 w-full h-full flex flex-col gap-4 p-4 absolute transition-transform duration-300 top-0 left-0",
          adminOpen ? "translate-x-0" : "translate-x-full"
        )}>
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            className="w-6 h-6 flex absolute left-3 items-center justify-center"
            onClick={() => setAdminOpen(false)}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="font-bold  text-2xl">Admin Panel</h2>
        </div>
        <div className="mb-8">
          <ul className="flex flex-col">
            {/* <li>
              <Link href="/admin/users">Users</Link>
            </li> */}
            <li>
              <Accordion type="single" collapsible>
                <AccordionItem className="!border-none" value="stats">
                  <AccordionTrigger className="w-full py-3 font-semibold">
                    <span className="flex items-center ml-1 gap-4">
                      <FaTrophy className="w-4 h-4" /> Tournaments
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="!border-none relative p-0 ml-10 after:flex after:h-[calc(100%-0.75rem)] after:w-[1.25px] after:bg-neutral-600 after:absolute after:-left-6 after:bottom-2">
                    <Link
                      className="w-full flex items-center gap-4 py-3"
                      href="/admin/stats/tournaments">
                      <PiListBulletsBold className="w-5 h-5 " /> Tournaments
                      List
                    </Link>
                    <Link
                      className="w-full flex items-center gap-4 py-3"
                      href="/admin/stats/tournaments/new">
                      <PiListPlusBold className="w-5 h-5 " /> Add Tournament
                    </Link>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </li>
            <li>
              <Accordion type="single" collapsible>
                <AccordionItem className="!border-none" value="stats">
                  <AccordionTrigger className="w-full py-3 font-semibold">
                    <span className="flex items-center ml-1 gap-4">
                      <FaMoneyBill className="w-4 h-4" /> Cash
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="!border-none relative p-0 ml-10 after:flex after:h-[calc(100%-0.75rem)] after:w-[1.25px] after:bg-neutral-600 after:absolute after:-left-6 after:bottom-2">
                    <Link
                      className="w-full flex items-center gap-4 py-3"
                      href="admin/stats/cash">
                      <PiListBulletsBold className="w-5 h-5 " /> Sessions
                    </Link>
                    <Link
                      className="w-full flex items-center gap-4 py-3"
                      href="/admin/stats/cash/new">
                      <PiListPlusBold className="w-5 h-5 " /> Add Sessions
                    </Link>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </li>
            <li>
              <Accordion type="single" collapsible>
                <AccordionItem className="!border-none" value="stats">
                  <AccordionTrigger className="w-full py-3 font-semibold">
                    <span className="flex items-center ml-1 gap-4">
                      <FaUsers className="w-4 h-4" /> Members
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="!border-none relative p-0 ml-10 after:flex after:h-[calc(100%-0.75rem)] after:w-[1.25px] after:bg-neutral-600 after:absolute after:-left-6 after:bottom-2">
                    <Link
                      className="w-full flex items-center gap-4 py-3"
                      href="/admin/members">
                      <PiListBulletsBold className="w-5 h-5 " /> Members List
                      List
                    </Link>
                    <Link
                      className="w-full flex items-center gap-4 py-3"
                      href="/admin/members/add">
                      <PiListPlusBold className="w-5 h-5 " /> Add Member
                    </Link>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </li>
            <li>
              <Link href="/admin/seasons">Seasons</Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default MobileAdminNav;
