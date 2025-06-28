import Link from "next/link";
import React from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuViewport,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";
import AdminNav from "../admin-nav/admin-nav";

function Nav({ excludeAdmin }: { excludeAdmin: boolean }) {
  return (
    <NavigationMenu className="hidden md:flex w-full mx-w-full ">
      <NavigationMenuList className="flex gap-8 w-full justify-center">
        <NavigationMenuItem>
          <NavigationMenuLink
            className="relative after:content-[''] after:absolute text-base font-medium after:transition-all after:duration-300 after:ease-in-out after:opacity-100 after:left-1/2 after:-translate-x-1/2 after:-bottom-2 after:h-[2px] after:bg-primary hover:text-primary after:w-0 hover:after:w-full"
            href="/members"
          >
            Members
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            className="relative after:content-[''] after:absolute text-base font-medium after:transition-all after:duration-300 after:ease-in-out after:opacity-100 after:left-1/2 after:-translate-x-1/2 after:-bottom-2 after:h-[2px] after:bg-primary hover:text-primary after:w-0 hover:after:w-full"
            href="/stats/cash?year=2025"
          >
            Cash
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            className="relative after:content-[''] after:absolute text-base font-medium after:transition-all after:duration-300 after:ease-in-out after:opacity-100 after:left-1/2 after:-translate-x-1/2 after:-bottom-2 after:h-[2px] after:bg-primary hover:text-primary after:w-0 hover:after:w-full"
            href="/stats/tournaments"
          >
            Tourney's
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            className="relative after:content-[''] after:absolute text-base font-medium after:transition-all after:duration-300 after:ease-in-out after:opacity-100 after:left-1/2 after:-translate-x-1/2 after:-bottom-2 after:h-[2px] after:bg-primary hover:text-primary after:w-0 hover:after:w-full"
            href="/poy"
          >
            POY Standings
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            className="relative after:content-[''] after:absolute text-base font-medium after:transition-all after:duration-300 after:ease-in-out after:opacity-100 after:left-1/2 after:-translate-x-1/2 after:-bottom-2 after:h-[2px] after:bg-primary hover:text-primary after:w-0 hover:after:w-full"
            href="/nlpi"
          >
            NLPI Rankings
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            className="relative after:content-[''] after:absolute text-base font-medium after:transition-all after:duration-300 after:ease-in-out after:opacity-100 after:left-1/2 after:-translate-x-1/2 after:-bottom-2 after:h-[2px] after:bg-primary hover:text-primary after:w-0 hover:after:w-full"
            href="/records"
          >
            Records
          </NavigationMenuLink>
        </NavigationMenuItem>
        {!excludeAdmin && (
          <NavigationMenuItem>
            <NavigationMenuTrigger className="relative after:content-[''] after:absolute text-base font-medium after:transition-all after:duration-300 after:ease-in-out after:opacity-100 after:left-1/2 after:-translate-x-1/2 after:-bottom-2 after:h-[2px] after:bg-primary data-[state=open]:text-primary after:w-0 data-[state=open]:after:w-full">
              <NavigationMenuLink href="/admin">Admin</NavigationMenuLink>
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <AdminNav />
            </NavigationMenuContent>
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export default Nav;
