import React from "react";
import {
  FaClock,
  FaList,
  FaMoneyBill,
  FaPlus,
  FaStopwatch,
  FaTrophy,
  FaUserPlus,
  FaUsers,
} from "react-icons/fa";

export type AdminLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export type AdminLinkGroup = {
  title: string;
  links: AdminLink[];
};

// Every admin destination, in one place: the desktop Admin menu shows the
// groups as columns and the mobile menu lists the same links. Pages below
// these (a season's cash weeks, a tournament's sessions) are linked from the
// list pages themselves.
export const ADMIN_LINK_GROUPS: AdminLinkGroup[] = [
  {
    title: "Cash",
    links: [
      {
        href: "/admin/stats/cash",
        label: "Cash Sessions",
        icon: <FaMoneyBill className="w-5 h-5" />,
      },
      {
        href: "/admin/stats/cash/new",
        label: "Add Cash Session",
        icon: <FaPlus className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "Tournaments",
    links: [
      {
        href: "/admin/stats/tournaments",
        label: "Tournaments",
        icon: <FaTrophy className="w-5 h-5" />,
      },
      {
        href: "/admin/stats/tournaments/new",
        label: "Add Tournament",
        icon: <FaPlus className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "Clock",
    links: [
      {
        href: "/admin/clock",
        label: "Clocks",
        icon: <FaStopwatch className="w-5 h-5" />,
      },
      {
        href: "/admin/clock/structures",
        label: "Blind Structures",
        icon: <FaClock className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "League",
    links: [
      {
        href: "/admin/members",
        label: "Members",
        icon: <FaUsers className="w-5 h-5" />,
      },
      {
        href: "/admin/members/add",
        label: "Add Member",
        icon: <FaUserPlus className="w-5 h-5" />,
      },
      {
        href: "/admin/seasons",
        label: "Seasons",
        icon: <FaList className="w-5 h-5" />,
      },
    ],
  },
];

export const ADMIN_LINKS: AdminLink[] = ADMIN_LINK_GROUPS.flatMap(
  (group) => group.links,
);
