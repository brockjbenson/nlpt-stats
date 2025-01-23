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
    <NavigationMenu className="hidden lg:block">
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
          <NavigationMenuContent className="w-screen">
            <div className="w-screen flex justify-center">
              <ul className="grid gap-12 w-full max-w-screen-md grid-cols-5">
                <li className="flex flex-col">
                  <Link
                    className="w-full border-b border-foreground pb-1 font-semibold hover:text-primary"
                    href="/stats/2025">
                    2025
                  </Link>
                  <ul className="w-full m-0 pt-1">
                    <li>
                      <Link
                        className="text-sm text-foreground/90 hover:text-primary"
                        href="/stats/2025/cash">
                        Cash
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="text-sm text-foreground/90 hover:text-primary"
                        href="/stats/2025/tournaments">
                        Tournaments
                      </Link>
                    </li>
                  </ul>
                </li>
                <li className="flex flex-col">
                  <Link
                    className="w-full border-b border-foreground pb-1 font-semibold hover:text-primary"
                    href="/stats/2024">
                    2024
                  </Link>
                  <ul className="w-full m-0 pt-1">
                    <li>
                      <Link
                        className="text-sm text-foreground/90 hover:text-primary"
                        href="/stats/2024/cash">
                        Cash
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="text-sm text-foreground/90 hover:text-primary"
                        href="/stats/2024/tournaments">
                        Tournaments
                      </Link>
                    </li>
                  </ul>
                </li>
                <li className="flex flex-col">
                  <Link
                    className="w-full border-b border-foreground pb-1 font-semibold hover:text-primary"
                    href="/stats/2023">
                    2023
                  </Link>
                  <ul className="w-full m-0 pt-1">
                    <li>
                      <Link
                        className="text-sm text-foreground/90 hover:text-primary"
                        href="/stats/2023/cash">
                        Cash
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="text-sm text-foreground/90 hover:text-primary"
                        href="/stats/2023/tournaments">
                        Tournaments
                      </Link>
                    </li>
                  </ul>
                </li>
                <li className="flex flex-col">
                  <Link
                    className="w-full border-b border-foreground pb-1 font-semibold hover:text-primary"
                    href="/stats/2022">
                    2022
                  </Link>
                  <ul className="w-full m-0 pt-1">
                    <li>
                      <Link
                        className="text-sm text-foreground/90 hover:text-primary"
                        href="/stats/2022/cash">
                        Cash
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="text-sm text-foreground/90 hover:text-primary"
                        href="/stats/2022/tournaments">
                        Tournaments
                      </Link>
                    </li>
                  </ul>
                </li>
                <li className="flex flex-col">
                  <Link
                    className="w-full border-b border-foreground pb-1 font-semibold hover:text-primary"
                    href="/stats/career">
                    Career
                  </Link>
                  <ul className="w-full m-0 pt-1">
                    <li>
                      <Link
                        className="text-sm text-foreground/90 hover:text-primary"
                        href="/stats/career/cash">
                        Cash
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="text-sm text-foreground/90 hover:text-primary"
                        href="/stats/career/tournaments">
                        Tournaments
                      </Link>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            className="relative after:content-[''] after:absolute text-base font-medium after:transition-all after:duration-300 after:ease-in-out after:opacity-100 after:left-1/2 after:-translate-x-1/2 after:-bottom-2 after:h-[2px] after:bg-primary hover:text-primary after:w-0 hover:after:w-full"
            href="/poy">
            POY Standings
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            className="relative after:content-[''] after:absolute text-base font-medium after:transition-all after:duration-300 after:ease-in-out after:opacity-100 after:left-1/2 after:-translate-x-1/2 after:-bottom-2 after:h-[2px] after:bg-primary hover:text-primary after:w-0 hover:after:w-full"
            href="/nlpi">
            NLPI Rankings
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
