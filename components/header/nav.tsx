import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { cva } from "class-variance-authority";
import { User } from "@supabase/supabase-js";
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

function Nav({ excludeAdmin }: { excludeAdmin: boolean }) {
  return (
    <NavigationMenu>
      <NavigationMenuList className="flex gap-8 justify-center">
        <NavigationMenuItem>
          <NavigationMenuLink
            className="relative after:content-[''] after:absolute text-base font-medium after:transition-all after:duration-300 after:ease-in-out after:opacity-100 after:left-1/2 after:-translate-x-1/2 after:-bottom-2 after:h-[2px] after:bg-primary hover:text-primary after:w-0 hover:after:w-full"
            href="/members">
            Members
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="relative after:content-[''] after:absolute text-base font-medium after:transition-all after:duration-300 after:ease-in-out after:opacity-100 after:left-1/2 after:-translate-x-1/2 after:-bottom-2 after:h-[2px] after:bg-primary data-[state=open]:text-primary after:w-0 data-[state=open]:after:w-full">
            <NavigationMenuLink href="/stats">Stats</NavigationMenuLink>
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuList className="flex gap-12">
              <NavigationMenuItem>
                <NavigationMenuLink
                  className="whitespace-nowrap"
                  href="/stats/cash">
                  Cash
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  className="whitespace-nowrap"
                  href="/stats/cash">
                  Tournaments
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export default Nav;
