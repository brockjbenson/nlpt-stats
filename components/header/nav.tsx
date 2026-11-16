import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";
import AdminNav from "../admin-nav/admin-nav";

const UNDERLINE =
  "relative after:content-[''] after:absolute text-base font-medium after:transition-all after:duration-300 after:ease-in-out after:opacity-100 after:left-1/2 after:-translate-x-1/2 after:-bottom-2 after:h-0.5 after:bg-primary after:w-0";

// Same destinations as the phone's tab bar, for the current season.
function navLinks(year: number) {
  return [
    { href: "/members", label: "Members" },
    { href: `/stats/cash/${year}`, label: "Cash" },
    { href: `/tournaments/${year}`, label: "Tourney's" },
    { href: `/poy/${year}`, label: "POY Standings" },
    { href: "/nlpi", label: "NLPI Rankings" },
    { href: "/records", label: "Records" },
  ];
}

function Nav({ excludeAdmin, year }: { excludeAdmin: boolean; year: number }) {
  return (
    <NavigationMenu className="hidden md:flex w-full mx-w-full ">
      <NavigationMenuList className="flex gap-8 w-full justify-center">
        {navLinks(year).map(({ href, label }) => (
          <NavigationMenuItem key={href}>
            {/* asChild: render next/link (client navigation and prefetch)
                instead of Radix's plain <a>. */}
            <NavigationMenuLink
              asChild
              className={`${UNDERLINE} hover:text-primary hover:after:w-full`}
            >
              <Link href={href}>{label}</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
        {!excludeAdmin && (
          <NavigationMenuItem>
            {/* Opens the admin menu; there's no admin home page to link to. */}
            <NavigationMenuTrigger
              className={`${UNDERLINE} hover:text-primary data-[state=open]:text-primary data-[state=open]:after:w-full`}
            >
              Admin
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
