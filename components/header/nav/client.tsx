"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getVisitedRoutes } from "@/lib/route-visited-wrapper";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaList, FaMoneyBill, FaPlus, FaTrophy, FaUsers } from "react-icons/fa";
import {
  FaBookBookmark,
  FaGlobe,
  FaRankingStar,
  FaUserShield,
} from "react-icons/fa6";
import { MdCompare } from "react-icons/md";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_LINKS: NavLink[] = [
  {
    href: "/stats/tournaments",
    label: "Tournaments",
    icon: <FaTrophy className="w-5 h-5" />,
  },
  {
    href: "/stats/cash?year=2025",
    label: "Cash",
    icon: <FaMoneyBill className="w-5 h-5" />,
  },
  {
    href: "/members",
    label: "Members",
    icon: <FaUsers className="w-5 h-5" />,
  },
  {
    href: "/poy",
    label: "POY Standings",
    icon: <FaRankingStar className="w-5 h-5" />,
  },
  {
    href: "/nlpi",
    label: "NLPI Rankings",
    icon: <FaGlobe className="w-5 h-5" />,
  },
  {
    href: "/records",
    label: "Records",
    icon: <FaBookBookmark className="w-5 h-5" />,
  },
  {
    href: "/compare",
    label: "Compare Members",
    icon: <MdCompare className="w-5 h-5" />,
  },
];

const ADMIN_LINKS: NavLink[] = [
  {
    href: "/admin/users",
    label: "Users",
    icon: <FaUsers className="w-5 h-5" />,
  },
  {
    href: "/admin/seasons",
    label: "Seasons",
    icon: <FaList className="w-5 h-5" />,
  },
  {
    href: "/admin/stats/tournaments",
    label: "Tournaments List",
    icon: <FaTrophy className="w-5 h-5" />,
  },
  {
    href: "/admin/stats/cash",
    label: "Cash Sessions List",
    icon: <FaMoneyBill className="w-5 h-5" />,
  },
  {
    href: "/admin/stats/tournaments/new",
    label: "Add Tournament",
    icon: <FaPlus className="w-5 h-5" />,
  },
  {
    href: "/admin/stats/cash/new",
    label: "Add Cash Session",
    icon: <FaPlus className="w-5 h-5" />,
  },
];

// Add routes here that you want to track with NEW badges
const ROUTES_TO_TRACK = ["/compare"];
const STORAGE_KEY = "nlpt-visited-routes";

export function NavLinks({ showAdmin }: { showAdmin: boolean }) {
  const [visitedRoutes, setVisitedRoutes] = useState<string[]>([]);

  // Listen for route visit updates
  useEffect(() => {
    // Initial load
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisitedRoutes(getVisitedRoutes(STORAGE_KEY));

    // Listen for updates
    const handleUpdate = () => {
      setVisitedRoutes(getVisitedRoutes(STORAGE_KEY));
    };

    window.addEventListener("visited-routes-updated", handleUpdate);
    return () => {
      window.removeEventListener("visited-routes-updated", handleUpdate);
    };
  }, []);

  const shouldShowBadge = (href: string) => {
    const path = href.split("?")[0];
    if (!ROUTES_TO_TRACK.includes(path)) return false;
    return !visitedRoutes.includes(path);
  };

  return (
    <>
      <ul className="pl-6 flex flex-col gap-4">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              className="flex items-center gap-4 text-lg font-medium relative"
              href={link.href}>
              {link.icon}
              {link.label}
              {shouldShowBadge(link.href) && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                  NEW
                </span>
              )}
            </Link>
          </li>
        ))}
        {showAdmin && (
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
                    {ADMIN_LINKS.map((link) => (
                      <li key={link.href}>
                        <Link
                          className="flex items-center gap-4"
                          href={link.href}>
                          {link.icon} {link.label}
                          {shouldShowBadge(link.href) && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                              NEW
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </li>
        )}
      </ul>
    </>
  );
}
